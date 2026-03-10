import { db } from '../../../services/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

/**
 * Récupère les livraisons actives (non validées/archivées)
 */
export const fetchActiveDeliveries = async () => {
  try {
    const qInterne = query(collection(db, "livraisons"), orderBy("dateCreation", "desc"));
    const qPartenaire = query(collection(db, "livraison_partenaire"), orderBy("dateCreation", "desc"));

    const [snapInterne, snapPartenaire] = await Promise.all([
      getDocs(qInterne),
      getDocs(qPartenaire)
    ]);
    
    const deliveries = [];

    const processData = (doc, source) => {
      const data = doc.data();
      if (data.dateValidation || data.statut === 'livre' || data.statut === 'facture_validee') return;

      const quartierOuVille = data.infosLivraison?.quartier || data.infosLivraison?.villeDestination || 'Destination inconnue';
      const contact = data.infosLivraison?.numeroDestinataire || data.infosLivraison?.contactClient || '';

      deliveries.push({
        id: doc.id,
        source,
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

    return deliveries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  } catch (error) {
    console.error("Erreur récup livraisons :", error);
    throw new Error("Impossible de charger les livraisons.");
  }
};

/**
 * Supprime une livraison
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

/**
 * Met à jour une livraison avant validation
 * @param {string} deliveryId - ID du document Firestore
 * @param {string} source - 'interne' | 'partenaire'
 * @param {object} updatedData - Champs modifiés par l'admin
 */
export const updateDelivery = async (deliveryId, source, updatedData) => {
  try {
    // Choisir la bonne collection selon la source
    const collectionName = source === 'partenaire' ? 'livraison_partenaire' : 'livraisons';
    const docRef = doc(db, collectionName, deliveryId);

    // Mapper les champs du composant vers la structure Firestore
    const firestorePayload = {
      statut: updatedData.status,
      coutPrestation: updatedData.coutLivraison,
      totalGeneral: updatedData.total,
      articles: updatedData.articles,
      // Mise à jour des infos de livraison imbriquées
      "infosLivraison.quartier": updatedData.quartier,
      "infosLivraison.numeroDestinataire": updatedData.numeroDestinataire,
    };

    await updateDoc(docRef, firestorePayload);
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    throw new Error("Impossible de sauvegarder les modifications.");
  }
};