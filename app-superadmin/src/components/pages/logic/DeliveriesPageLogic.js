import { db } from '../../../services/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

/**
 * Récupère les livraisons actives (non validées/archivées)
 * @returns {Promise<Array>} Liste formatée des livraisons
 */
export const fetchActiveDeliveries = async () => {
  try {
    // 1. On récupère les livraisons triées par date de création (plus récentes en premier)
    const q = query(collection(db, "livraisons"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const deliveries = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // 2. FILTRE : On ne garde que celles qui ne sont PAS ENCORE VALIDÉES
      // Si dateValidation existe et n'est pas null, c'est que c'est une vieille histoire (archivée)
      if (data.dateValidation) return; 

      // 3. MAPPING : On aplatit les données pour l'affichage facile dans le tableau
      // On gère la différence entre Course (Quartier) et Expédition (Ville)
      const quartierOuVille = data.type === 'course' 
        ? (data.infosLivraison?.quartier || 'Quartier inconnu')
        : (data.infosLivraison?.villeDestination || 'Destination inconnue');

      const contact = data.type === 'course'
        ? (data.infosLivraison?.numeroDestinataire || '')
        : (data.infosLivraison?.contactClient || '');

      deliveries.push({
        id: doc.id,
        // --- Infos principales ---
        trackingNumber: data.numeroSuivi,
        type: data.type,
        status: data.statut,
        createdAt: data.dateCreation,
        
        // --- Infos Lieux/Contacts (Aplaties) ---
        quartier: quartierOuVille,
        numeroDestinataire: contact,
        
        // --- Infos Financières ---
        coutLivraison: data.coutPrestation, // Ce que gagne l'agence
        total: data.totalGeneral,           // Ce que le livreur encaisse
        
        // --- Infos Contenu ---
        articles: data.articles || [],
        
        // --- Infos Livreur ---
        deliveryManName: data.livreurNom || null,
        livreurId: data.livreurId || null
      });
    });

    return deliveries;

  } catch (error) {
    console.error("Erreur lors de la récupération des livraisons :", error);
    throw new Error("Impossible de charger les livraisons.");
  }
};

/**
 * Supprime une livraison (Cas d'erreur de saisie)
 * @param {string} deliveryId 
 */
export const deleteDeliveryFromFirebase = async (deliveryId) => {
  try {
    await deleteDoc(doc(db, "livraisons", deliveryId));
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    throw new Error("Erreur lors de la suppression");
  }
};