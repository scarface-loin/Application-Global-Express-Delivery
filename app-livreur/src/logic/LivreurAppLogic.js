import { db } from '../services/firebase'; 
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc, 
  updateDoc,
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import bcrypt from 'bcryptjs';

// --- LOGIQUE POUR LES COURSES DU JOUR (AMÉLIORÉE) ---
const formatLivraisonData = (docSnap, origine) => {
  const data = docSnap.data();
  const info = data.infosLivraison || {}; 

  // 1. RECUPERATION DU TELEPHONE (Mode Agressif pour le bouton Appeler)
  let telephone = info.numeroDestinataire || info.contactClient || info.telephone || data.telephone || '';
  
  // 2. RECUPERATION DU NOM
  let nomClient = info.nomClient || info.entrepriseNom || info.nom || info.destinataire || data.nomClient;
  
  if (!nomClient) {
    if (info.quartier) {
      nomClient = `Client - ${info.quartier}`;
    } else {
      nomClient = "Client";
    }
  }

  // 3. ADRESSE
  const adresse = info.adresseComplete || (info.quartier ? `${info.quartier}` : '') || 'Adresse non spécifiée';

  return {
    id: docSnap.id,
    trackingNumber: data.numeroSuivi || 'Sans Numéro',
    origine: origine, 
    type: data.type || 'livraison',
    statut: data.statut, 
    expediteur: origine === 'partenaire' ? (data.partenaireNom || 'Partenaire') : 'Global Express',
    
    // Données normalisées pour l'affichage Carte & Modale
    nomClient: nomClient,
    contactClient: telephone, 
    numeroDestinataire: telephone, // Clé pour le bouton
    quartier: info.quartier || 'N/A',
    ville: info.villeDestination || '',
    adresseComplete: adresse,
    
    articles: data.articles || [],
    nbArticles: data.articles?.reduce((sum, art) => sum + (parseInt(art.quantiteCommandee) || 0), 0) || 0,
    total: data.totalGeneral || 0,
    modePaiement: data.modePaiement || 'cash',
    dateCreation: data.dateCreation,
    heureAttribution: data.dateAttribution 
      ? new Date(data.dateAttribution.toDate ? data.dateAttribution.toDate() : data.dateAttribution).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) 
      : '--:--'
  };
};

export const fetchLivraisonsJour = async (livreurId) => {
  try {
    if (!livreurId) return [];
    
    const qInterne = query(
      collection(db, "livraisons"),
      where("livreurId", "==", livreurId),
      where("dateValidation", "==", null), 
      orderBy("dateCreation", "desc")
    );

    const qPartenaire = query(
      collection(db, "livraison_partenaire"),
      where("livreurId", "==", livreurId),
      where("dateValidation", "==", null),
      orderBy("dateCreation", "desc")
    );
    
    const [snapInterne, snapPartenaire] = await Promise.all([
      getDocs(qInterne),
      getDocs(qPartenaire)
    ]);

    const livraisons = [];
    snapInterne.forEach(doc => livraisons.push(formatLivraisonData(doc, 'interne')));
    snapPartenaire.forEach(doc => livraisons.push(formatLivraisonData(doc, 'partenaire')));

    return livraisons.sort((a, b) => {
      const dateA = new Date(a.dateCreation?.toDate ? a.dateCreation.toDate() : a.dateCreation);
      const dateB = new Date(b.dateCreation?.toDate ? b.dateCreation.toDate() : b.dateCreation);
      return dateB - dateA; 
    });

  } catch (error) {
    console.error("Erreur fetchLivraisonsJour :", error);
    throw new Error("Impossible de charger les courses.");
  }
};

export const calculateSituationDuJour = (livraisons) => {
  let responsabiliteDuJour = 0; 
  let especesEnMain = 0; 
  let valeurColisEnMain = 0; 

  livraisons.forEach(l => {
    responsabiliteDuJour += l.total;

    if (l.statut === 'livre') {
      especesEnMain += l.total;
    } else {
      valeurColisEnMain += l.total;
    }
  });

  return {
    responsabiliteDuJour, 
    especesEnMain,
    valeurColisEnMain,
    nbCourses: livraisons.length
  };
};

export const updateLivraisonStatut = async (livraisonId, origine, nouveauStatut, motif = null) => {
  try {
    const collectionName = origine === 'partenaire' ? 'livraison_partenaire' : 'livraisons';
    const livraisonRef = doc(db, collectionName, livraisonId);
    
    const updateData = {
      statut: nouveauStatut,
      updatedAt: serverTimestamp()
    };
    
    if (nouveauStatut === 'livre') {
      updateData.dateLivraison = new Date().toISOString();
    } else if (nouveauStatut === 'non_livre') {
      updateData.dateNonLivraison = new Date().toISOString();
      updateData.motifNonLivraison = motif;
    }
    
    await updateDoc(livraisonRef, updateData);
    return { success: true };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateLivreurPassword = async (livreurId, newPassword) => {
  try {
    const livreurRef = doc(db, "livreurs", livreurId);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await updateDoc(livreurRef, {
      motDePasseHash: hashedPassword, 
      isFirstLogin: false,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    throw new Error("Erreur mise à jour mot de passe.");
  }
};

// --- Dans LivreurAppLogic.js ---
export const fetchLivreurInfo = async (livreurId) => {
    try {
      if (!livreurId) return null;
      const livreurRef = doc(db, "livreurs", livreurId);
      const livreurSnap = await getDoc(livreurRef);
      
      if (!livreurSnap.exists()) {
        // C'est ici qu'on déclenche l'erreur spécifique
        throw new Error("LIVREUR_NOT_FOUND");
      }
      
      return { id: livreurSnap.id, ...livreurSnap.data() };
    } catch (error) {
      throw error; // On propage l'erreur
    }
};

// --- LOGIQUE POUR L'HISTORIQUE (ORIGINALE / RESTAURÉE) ---
export const fetchHistoriqueLivraisons = async (livreurId) => {
  try {
    if (!livreurId) {
      console.warn("fetchHistoriqueLivraisons appelé sans livreurId. Retourne un tableau vide.");
      return []; 
    }
    const qInterne = query(
      collection(db, "livraisons"),
      where("livreurId", "==", livreurId),
      where("dateValidation", "!=", null), 
      orderBy("dateValidation", "desc")
    );

    const qPartenaire = query(
      collection(db, "livraison_partenaire"),
      where("livreurId", "==", livreurId),
      where("dateValidation", "!=", null), 
      orderBy("dateValidation", "desc")
    );

    const [snapInterne, snapPartenaire] = await Promise.all([
      getDocs(qInterne),
      getDocs(qPartenaire)
    ]);
    
    const historique = [];

    const pushToHistory = (docSnap, origine) => {
       const data = docSnap.data();
       
       // Calculer les détails de validation (LOGIQUE D'ORIGINE)
       const articlesLivres = (data.articles || []).filter(a => (a.quantiteLivree || 0) > 0);
       const articlesNonLivres = (data.articles || []).filter(a => {
         const qteCommande = parseInt(a.quantiteCommandee) || 0;
         const qteLivree = parseInt(a.quantiteLivree) || 0;
         return qteCommande > qteLivree;
       });
       
       const montantLivre = articlesLivres.reduce((sum, art) => {
         return sum + ((art.quantiteLivree || 0) * (art.coutUnitaire || 0));
       }, 0);
       
       const montantNonLivre = articlesNonLivres.reduce((sum, art) => {
         const qteCommande = parseInt(art.quantiteCommandee) || 0;
         const qteLivree = parseInt(art.quantiteLivree) || 0;
         const qteNonLivree = qteCommande - qteLivree;
         return sum + (qteNonLivree * (art.coutUnitaire || 0));
       }, 0);
       
       const totalAttendu = data.totalGeneral || 0;
       const totalEncaisse = data.totalFinalEncaisse || 0;
       const manquant = totalAttendu - totalEncaisse;
       
       historique.push({
         id: docSnap.id,
         numeroSuivi: data.numeroSuivi,
         type: data.type,
         origine: origine,
         expediteur: origine === 'partenaire' ? data.partenaireNom : 'Global Express',
         // On garde le fallback simple d'origine pour l'historique
         nomClient: data.infosLivraison?.nomClient || data.infosLivraison?.entrepriseNom || 'Client',
         numeroDestinataire: data.infosLivraison?.numeroDestinataire || data.infosLivraison?.contactClient || '',
         quartier: data.infosLivraison?.quartier || 'N/A',
         ville: data.infosLivraison?.villeDestination || '',
         
         // Détails de validation
         dateValidation: data.dateValidation ? (data.dateValidation.toDate ? data.dateValidation.toDate() : data.dateValidation) : null,
         statutFinal: articlesLivres.length > 0 ? 'livre' : 'retourne',
         
         // Articles
         articles: data.articles || [],
         articlesLivres: articlesLivres,
         articlesNonLivres: articlesNonLivres,
         
         // Montants détaillés
         totalAttendu: totalAttendu,
         montantLivre: montantLivre,
         montantNonLivre: montantNonLivre,
         totalEncaisse: totalEncaisse,
         manquant: manquant,
         
         // Info validation
         validePar: data.validePar || 'Admin',
         commentaireValidation: data.commentaireValidation || ''
       });
    };

    snapInterne.forEach(doc => pushToHistory(doc, 'interne'));
    snapPartenaire.forEach(doc => pushToHistory(doc, 'partenaire'));

    return historique.sort((a, b) => new Date(b.dateValidation) - new Date(a.dateValidation));

  } catch (error) {
    console.error("Erreur fetchHistoriqueLivraisons:", error);
    return [];
  }
};