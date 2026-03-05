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
    // Expéditions: montant à récupérer = 0
    if (l.type === 'expedition') return;

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

// --- UTILITAIRE: Calculer le cycle de 25 jours ---
export const calculerCycle25Jours = (dateDebut) => {
  const now = new Date();
  const debut = new Date(dateDebut);
  const diffMs = now - debut;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const jourDansCycle = (diffDays % 25) + 1; // 1 à 25
  const numeroCycle = Math.floor(diffDays / 25) + 1;
  const joursRestants = 25 - jourDansCycle + 1;
  const pourcentage = Math.round((jourDansCycle / 25) * 100);
  
  return { jourDansCycle, numeroCycle, joursRestants, pourcentage };
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
       const isExpedition = data.type === 'expedition';

       // --- STATUT PAR ARTICLE: livré | retourné | perdu ---
       const articles = (data.articles || []).map(art => {
         const qteCommande = parseInt(art.quantiteCommandee) || 0;
         const qteLivree = parseInt(art.quantiteLivree) || 0;
         const qteRetournee = parseInt(art.quantiteRetournee) || 0;
         const qtePerdue = parseInt(art.quantitePerdue) || 0;

         let statutArt;
         if (qtePerdue > 0 && qteLivree === 0 && qteRetournee === 0) {
           statutArt = 'perdu'; // Tout perdu
         } else if (qtePerdue > 0 && qteLivree > 0) {
           statutArt = 'perdu_partiel'; // Livré partiellement + perte
         } else if (qteLivree >= qteCommande) {
           statutArt = 'livre';
         } else if (qteLivree > 0) {
           statutArt = 'partiel';
         } else if (qteRetournee > 0) {
           statutArt = 'retourne';
         } else {
           // Fallback : si rien n'est renseigné, on se base sur l'ancien champ statut
           statutArt = art.statut || 'retourne';
         }

         return { ...art, statutCalcule: statutArt, qteCommande, qteLivree, qteRetournee, qtePerdue };
       });

       const articlesLivres = articles.filter(a => a.statutCalcule === 'livre' || a.statutCalcule === 'partiel' || a.statutCalcule === 'perdu_partiel');
       const articlesRetournes = articles.filter(a => a.statutCalcule === 'retourne');
       const articlesPerdus = articles.filter(a => a.statutCalcule === 'perdu' || a.statutCalcule === 'perdu_partiel');

       // --- CALCULS FINANCIERS ---
       // Expédition: montant toujours 0
       const totalAttendu = isExpedition ? 0 : (data.totalGeneral || 0);
       const totalEncaisse = isExpedition ? 0 : (data.totalFinalEncaisse || 0);

       // Valeur retournés: annule le manquant (colis rendu, pas une dette)
       const valeurRetournes = articlesRetournes.reduce((sum, art) => {
         const qteNonLivree = art.qteCommande - art.qteLivree;
         return sum + (qteNonLivree * (art.coutUnitaire || 0));
       }, 0);

       // Valeur perdus: génère une dette réelle — uniquement sur la quantité réellement perdue
       const valeurPerdus = articles.reduce((sum, art) => {
         return sum + ((art.qtePerdue || 0) * (art.coutUnitaire || 0));
       }, 0);

       // Total attendu réel = total - retournés (pas une perte, colis récupéré)
       const totalAttenduReel = totalAttendu - valeurRetournes;
       const manquant = Math.max(0, totalAttenduReel - totalEncaisse);

       // Statut global
       let statutFinal = 'retourne';
       if (articlesPerdus.length > 0 && articlesLivres.length === 0) {
         statutFinal = 'perdu';
       } else if (articlesPerdus.length > 0) {
         statutFinal = 'perdu_partiel';
       } else if (articlesLivres.length > 0 && articlesRetournes.length === 0) {
         statutFinal = 'livre';
       } else if (articlesLivres.length > 0) {
         statutFinal = 'partiel';
       }

       // --- LIGNES DE DETTE (transparence totale) ---
       const lignesDette = [];
       const dateRef = data.dateValidation
         ? (data.dateValidation.toDate ? data.dateValidation.toDate() : new Date(data.dateValidation))
         : new Date();

       if (manquant > 0 && !isExpedition) {
         lignesDette.push({ motif: 'Versement insuffisant', montant: manquant, date: dateRef, numeroSuivi: data.numeroSuivi });
       }
       if (valeurPerdus > 0) {
         lignesDette.push({ motif: 'Colis perdu', montant: valeurPerdus, date: dateRef, numeroSuivi: data.numeroSuivi });
       }

       // dateCreation = jour où la livraison a été assignée = jour réel de travail du livreur
       const dateCreationRef = data.dateCreation
         ? (data.dateCreation.toDate ? data.dateCreation.toDate() : new Date(data.dateCreation))
         : null;

       historique.push({
         id: docSnap.id,
         numeroSuivi: data.numeroSuivi,
         type: data.type,
         isExpedition,
         origine,
         expediteur: origine === 'partenaire' ? data.partenaireNom : 'Global Express',
         nomClient: data.infosLivraison?.nomClient || data.infosLivraison?.entrepriseNom || 'Client',
         numeroDestinataire: data.infosLivraison?.numeroDestinataire || data.infosLivraison?.contactClient || '',
         quartier: data.infosLivraison?.quartier || 'N/A',
         ville: data.infosLivraison?.villeDestination || '',
         dateCreation: dateCreationRef,
         dateValidation: dateRef,
         statutFinal,
         articles,
         articlesLivres,
         articlesRetournes,
         articlesPerdus,
         totalAttendu,
         totalAttenduReel,
         totalEncaisse,
         valeurRetournes,
         valeurPerdus,
         manquant,
         lignesDette,
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