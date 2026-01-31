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

const formatLivraisonData = (docSnap, origine) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    trackingNumber: data.numeroSuivi,
    origine: origine,
    type: data.type,
    statut: data.statut,
    expediteur: origine === 'partenaire' ? data.partenaireNom : 'Global Express',
    nomClient: data.infosLivraison?.nomClient || data.infosLivraison?.entrepriseNom || 'Client',
    contactClient: data.infosLivraison?.contactClient || data.infosLivraison?.numeroDestinataire || '',
    quartier: data.infosLivraison?.quartier || 'N/A',
    ville: data.infosLivraison?.villeDestination || '',
    adresseComplete: data.infosLivraison?.adresseComplete || '',
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
    if (!livreurId) {
      console.warn("fetchLivraisonsJour appelé sans livreurId. Retourne un tableau vide.");
      return []; 
    }
    
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
      const dateA = new Date(b.dateCreation?.toDate ? b.dateCreation.toDate() : b.dateCreation);
      const dateB = new Date(a.dateCreation?.toDate ? a.dateCreation.toDate() : a.dateCreation);
      return dateA - dateB;
    });

  } catch (error) {
    console.error("Erreur fetchLivraisonsJour :", error);
    throw new Error("Impossible de charger les livraisons.");
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

/**
 * Met à jour le mot de passe d'un livreur et met isFirstLogin à false.
 */
export const updateLivreurPassword = async (livreurId, newPassword) => {
  try {
    const livreurRef = doc(db, "livreurs", livreurId);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await updateDoc(livreurRef, {
      motDePasseHash: hashedPassword, 
      isFirstLogin: false, // <-- C'EST LA CLÉ ! DÉFINI À FALSE APRÈS LE CHANGEMENT
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    throw new Error("Erreur mise à jour mot de passe.");
  }
};

export const fetchLivreurInfo = async (livreurId) => {
    try {
      if (!livreurId) {
        console.warn("fetchLivreurInfo appelé sans livreurId. Retourne null.");
        return null;
      }
      const livreurRef = doc(db, "livreurs", livreurId);
      const livreurSnap = await getDoc(livreurRef);
      if (!livreurSnap.exists()) throw new Error("Livreur introuvable");
      return { id: livreurSnap.id, ...livreurSnap.data() };
    } catch (error) {
      throw error;
    }
};

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
       historique.push({
         id: docSnap.id,
         numeroSuivi: data.numeroSuivi,
         statutFinal: (data.articles || []).some(a => (a.quantiteLivree || 0) > 0) ? 'livre' : 'retourne',
         date: data.dateValidation ? (data.dateValidation.toDate ? data.dateValidation.toDate() : data.dateValidation) : null,
         totalEncaisse: data.totalFinalEncaisse || 0, 
         origine: origine
       });
    };

    snapInterne.forEach(doc => pushToHistory(doc, 'interne'));
    snapPartenaire.forEach(doc => pushToHistory(doc, 'partenaire'));

    return historique.sort((a, b) => new Date(b.date) - new Date(a.date));

  } catch (error) {
    console.error("Erreur fetchHistoriqueLivraisons:", error);
    return [];
  }
};