import { db } from '../../../services/firebase';
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

/**
 * Récupère les livraisons attribuées à un livreur pour aujourd'hui
 * @param {string} livreurId - L'ID du livreur connecté
 * @returns {Promise<Array>} Liste des livraisons du jour
 */
export const fetchLivraisonsJour = async (livreurId) => {
  try {
    // On récupère uniquement les livraisons :
    // 1. Attribuées à ce livreur
    // 2. Qui n'ont pas encore été validées par l'admin (dateValidation === null)
    const q = query(
      collection(db, "livraisons"),
      where("livreurId", "==", livreurId),
      where("dateValidation", "==", null),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const livraisons = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Formattage pour l'affichage
      const livraison = {
        id: docSnap.id,
        trackingNumber: data.numeroSuivi,
        type: data.type, // 'course' ou 'expedition'
        statut: data.statut, // 'en_cours', 'livre', 'non_livre'
        
        // Informations entreprise/client
        entreprise: data.type === 'course' 
          ? (data.infosLivraison?.entrepriseNom || 'Entreprise inconnue')
          : (data.infosLivraison?.nomClient || 'Client inconnu'),
        
        // Destination
        quartier: data.infosLivraison?.quartier || null,
        numeroDestinataire: data.infosLivraison?.numeroDestinataire || null,
        villeDestination: data.infosLivraison?.villeDestination || null,
        nomClient: data.infosLivraison?.nomClient || null,
        contactClient: data.infosLivraison?.contactClient || null,
        
        // Articles
        articles: data.articles?.map(art => ({
          nom: art.nom,
          quantite: art.quantiteCommandee,
          cout: art.coutUnitaire
        })) || [],
        
        // Finances
        fraisLivraison: data.coutPrestation || 0,
        total: data.totalGeneral || 0,
        
        // Timing
        heureAttribution: data.dateCreation 
          ? new Date(data.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '--:--',
        heureLivraison: data.dateLivraison 
          ? new Date(data.dateLivraison).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : null,
        
        // Priorité (à définir selon vos règles métier)
        // Exemple : les expéditions ou montants > 10000 sont prioritaires
        priorite: (data.type === 'expedition' || data.totalGeneral > 10000) ? 'haute' : 'normale'
      };
      
      livraisons.push(livraison);
    });

    return livraisons;

  } catch (error) {
    console.error("Erreur lors de la récupération des livraisons :", error);
    throw new Error("Impossible de charger les livraisons du jour.");
  }
};

/**
 * Met à jour le statut d'une livraison
 * @param {string} livraisonId - L'ID de la livraison
 * @param {string} nouveauStatut - 'livre' ou 'non_livre'
 */
export const updateLivraisonStatut = async (livraisonId, nouveauStatut) => {
  try {
    const livraisonRef = doc(db, "livraisons", livraisonId);
    
    const updateData = {
      statut: nouveauStatut,
      updatedAt: serverTimestamp()
    };
    
    // Si la livraison est marquée comme livrée, on enregistre la date/heure
    if (nouveauStatut === 'livre') {
      updateData.dateLivraison = new Date().toISOString();
    }
    
    // Si non livrée, on enregistre aussi la date pour traçabilité
    if (nouveauStatut === 'non_livre') {
      updateData.dateNonLivraison = new Date().toISOString();
    }
    
    await updateDoc(livraisonRef, updateData);
    
    return { success: true };

  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut :", error);
    throw new Error("Impossible de mettre à jour le statut de la livraison.");
  }
};

/**
 * Récupère l'historique des livraisons validées du livreur
 * @param {string} livreurId - L'ID du livreur
 * @returns {Promise<Array>} Historique groupé par jour
 */
export const fetchHistoriqueLivraisons = async (livreurId) => {
  try {
    // On récupère les livraisons déjà validées (dateValidation !== null)
    const q = query(
      collection(db, "livraisons"),
      where("livreurId", "==", livreurId),
      where("dateValidation", "!=", null),
      orderBy("dateValidation", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const livraisonsParJour = {};

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Extraction de la date (format YYYY-MM-DD)
      const dateValidation = new Date(data.dateValidation);
      const dateKey = dateValidation.toISOString().split('T')[0];
      
      if (!livraisonsParJour[dateKey]) {
        livraisonsParJour[dateKey] = {
          date: dateKey,
          livraisons: 0,
          livrees: 0,
          nonLivrees: 0,
          montantTotal: 0,
          montantVerse: 0,
          solde: 0
        };
      }
      
      livraisonsParJour[dateKey].livraisons++;
      livraisonsParJour[dateKey].montantTotal += data.totalGeneral || 0;
      
      if (data.statut === 'livre') {
        livraisonsParJour[dateKey].livrees++;
        livraisonsParJour[dateKey].montantVerse += data.totalGeneral || 0;
      } else if (data.statut === 'non_livre') {
        livraisonsParJour[dateKey].nonLivrees++;
      }
    });
    
    // Calcul du solde pour chaque jour
    Object.keys(livraisonsParJour).forEach(dateKey => {
      const jour = livraisonsParJour[dateKey];
      jour.solde = jour.montantVerse - jour.montantTotal;
    });
    
    // Conversion en tableau et tri par date décroissante
    return Object.values(livraisonsParJour).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique :", error);
    throw new Error("Impossible de charger l'historique.");
  }
};

/**
 * Récupère les informations du livreur connecté
 * @param {string} livreurId - L'ID du livreur
 * @returns {Promise<Object>} Informations du livreur
 */
export const fetchLivreurInfo = async (livreurId) => {
  try {
    const livreurRef = doc(db, "livreurs", livreurId);
    const livreurSnap = await getDoc(livreurRef);
    
    if (!livreurSnap.exists()) {
      throw new Error("Livreur introuvable");
    }
    
    const data = livreurSnap.data();
    
    return {
      id: livreurSnap.id,
      nom: data.nom,
      telephone: data.telephone,
      photoUrl: data.photoUrl || null,
      finance: data.finance || {
        detteActuelle: 0,
        plafondDette: 50000
      },
      statut: data.statut,
      disponible: data.disponible
    };

  } catch (error) {
    console.error("Erreur lors de la récupération du livreur :", error);
    throw new Error("Impossible de charger les informations du livreur.");
  }
};

/**
 * Calcule le solde actuel du livreur basé sur ses livraisons du jour
 * @param {Array} livraisons - Liste des livraisons du jour
 * @returns {Object} Détails du solde
 */
export const calculateSolde = (livraisons) => {
  const totalRecuMatin = livraisons.reduce((sum, l) => sum + l.total, 0);
  const nombreTotal = livraisons.length;
  
  const livraisonsLivrees = livraisons.filter(l => l.statut === 'livre');
  const nombreLivrees = livraisonsLivrees.length;
  const montantVerse = livraisonsLivrees.reduce((sum, l) => sum + l.total, 0);
  
  const livraisonsEnCours = livraisons.filter(l => l.statut === 'en_cours');
  const nombreEnCours = livraisonsEnCours.length;
  
  const livraisonsNonLivrees = livraisons.filter(l => l.statut === 'non_livre');
  const nombreNonLivrees = livraisonsNonLivrees.length;
  const montantNonLivre = livraisonsNonLivrees.reduce((sum, l) => sum + l.total, 0);
  
  // Le solde est négatif au départ (dette), puis remonte avec les livraisons
  const soldeActuel = -(totalRecuMatin - montantVerse - montantNonLivre);
  
  return {
    totalRecuMatin,
    nombreTotal,
    nombreLivrees,
    nombreEnCours,
    nombreNonLivrees,
    montantVerse,
    montantNonLivre,
    soldeActuel
  };
};