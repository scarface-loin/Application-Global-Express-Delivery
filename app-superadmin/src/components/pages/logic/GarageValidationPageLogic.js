import { db } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';

/**
 * Récupère toutes les demandes de garage (en attente et historique récent)
 */
export const fetchDemandesGarage = async () => {
  try {
    // On peut filtrer pour n'avoir que les "en_attente" ou tout récupérer pour l'historique
    const q = query(collection(db, "demandes_garage")); 
    const querySnapshot = await getDocs(q);

    const demandes = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      demandes.push({
        id: docSnap.id,
        ...data,
        // Mapping pour correspondre à votre UI
        date: data.dateCreation || data.date, 
        nomLivreur: data.livreurNom, 
        idLivreur: data.livreurId,
        // Valeurs par défaut si manquantes
        vehicule: data.vehicule || 'Non spécifié',
        immatriculation: data.immatriculation || 'N/A',
        urgence: data.urgence || 'normale'
      });
    });

    // Tri du plus récent au plus ancien
    return demandes.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Erreur fetchDemandesGarage:", error);
    throw new Error("Impossible de charger les demandes garage.");
  }
};

/**
 * VALIDE une demande et SOUSTRAIT le montant de la dette du livreur.
 * 
 * @param {string} demandeId - ID du document demande_garage
 * @param {string} livreurId - ID du livreur (pour mettre à jour sa dette)
 * @param {number} montantValide - Le coût réel validé par le Super Admin
 */
export const validerDemandeGarage = async (demandeId, livreurId, montantValide) => {
  try {
    const adminId = localStorage.getItem('admin_id') || 'SUPER_ADMIN';
    const batch = writeBatch(db);

    // 1. Référence à la demande de garage
    const demandeRef = doc(db, "demandes_garage", demandeId);
    batch.update(demandeRef, {
      statut: 'valide',
      coutReel: parseFloat(montantValide),
      dateValidation: new Date().toISOString(),
      validePar: adminId,
      updatedAt: serverTimestamp()
    });

    // 2. Référence au livreur pour SOUSTRAIRE la dette
    // On utilise increment avec un nombre négatif pour soustraire
    const livreurRef = doc(db, "livreurs", livreurId);
    batch.update(livreurRef, {
      "finance.detteActuelle": increment(-parseFloat(montantValide))
    });

    // 3. (Optionnel) Créer une trace dans les versements/transactions pour la comptabilité
    // Cela permet de savoir pourquoi la dette a baissé sans versement d'argent
    const transactionRef = doc(collection(db, "transactions_financieres"));
    batch.set(transactionRef, {
      livreurId: livreurId,
      type: 'regularisation_garage',
      montant: parseFloat(montantValide),
      description: `Validation garage (ID: ${demandeId})`,
      date: serverTimestamp(),
      adminId: adminId
    });

    await batch.commit();
    return { success: true };

  } catch (error) {
    console.error("Erreur validerDemandeGarage:", error);
    throw new Error("Erreur lors de la validation de la demande.");
  }
};

/**
 * REJETTE une demande.
 * La dette reste inchangée (le livreur doit rembourser l'argent qu'il a gardé).
 */
export const rejeterDemandeGarage = async (demandeId) => {
  try {
    const adminId = localStorage.getItem('admin_id') || 'SUPER_ADMIN';
    const demandeRef = doc(db, "demandes_garage", demandeId);

    await updateDoc(demandeRef, {
      statut: 'rejete',
      dateValidation: new Date().toISOString(),
      validePar: adminId,
      updatedAt: serverTimestamp()
    });

    return { success: true };

  } catch (error) {
    console.error("Erreur rejeterDemandeGarage:", error);
    throw new Error("Erreur lors du rejet de la demande.");
  }
};