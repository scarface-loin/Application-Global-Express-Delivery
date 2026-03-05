import { db } from '../../../services/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

/**
 * Récupère les livraisons actives (non validées/archivées)
 * @returns {Promise<Array>} Liste formatée des livraisons  
 */
export const fetchActiveDeliveries = async () => {
  try {
    // 1. Récupérer les deux collections
    // Note : orderBy nécessite parfois un index composite. 
    // Si ça plante, enlève orderBy temporairement ou crée l'index dans Firebase Console.
    const qInterne = query(collection(db, "livraisons"), orderBy("dateCreation", "desc"));
    const qPartenaire = query(collection(db, "livraison_partenaire"), orderBy("dateCreation", "desc"));

    const [snapInterne, snapPartenaire] = await Promise.all([
      getDocs(qInterne),
      getDocs(qPartenaire)
    ]);
    
    const deliveries = [];

    const processData = (doc, source) => {
      const data = doc.data();
      // On ignore si validé (archivé)
      if (data.dateValidation || data.statut === 'livre' || data.statut === 'facture_validee') return; 

      const quartierOuVille = data.infosLivraison?.quartier || data.infosLivraison?.villeDestination || 'Destination inconnue';
      const contact = data.infosLivraison?.numeroDestinataire || data.infosLivraison?.contactClient || '';

      deliveries.push({
        id: doc.id,
        source: source, // Pour info
        trackingNumber: data.numeroSuivi,
        type: data.type,
        status: data.statut,
        createdAt: data.dateCreation,
        quartier: quartierOuVille,
        numeroDestinataire: contact,
        coutLivraison: data.coutPrestation,
        total: data.totalGeneral,
        articles: data.articles || [],
        deliveryManName: data.livreurNom || null,
        livreurId: data.livreurId || null
      });
    };

    snapInterne.forEach(d => processData(d, 'interne'));
    snapPartenaire.forEach(d => processData(d, 'partenaire'));

    // Tri manuel final (JavaScript) pour être sûr de l'ordre après fusion
    return deliveries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  } catch (error) {
    console.error("Erreur récup livraisons :", error);
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