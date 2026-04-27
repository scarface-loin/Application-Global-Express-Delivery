import { db } from '../../../services/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Récupère tous les livreurs depuis Firestore
 */
export const fetchAllLivreurs = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "livreurs"));
    const livreursData = [];

    querySnapshot.forEach((livreurDoc) => {
      const data = livreurDoc.data();
      const financeData = data.finance || {};

      livreursData.push({
        id: livreurDoc.id,
        ...data,
        finance: {
          salaireBase:       financeData.salaireBase       || 50000,
          primeParLivraison: financeData.primeParLivraison || 250,
          // SOURCE DE VÉRITÉ : maintenu en temps réel par ValidationPageLogic
          // (+increment à chaque session) et GarageValidationPageLogic (-increment à chaque validation).
          // Identique à ce que fetchSalaryData utilise pour calculer salaireNet.
          detteActuelle:     parseFloat(financeData.detteActuelle || 0),
          plafondDette:      financeData.plafondDette       || 50000,
        },
        documents: data.documents || {
          cniUrl:    null,
          permisUrl: null,
          contratUrl: null
        },
        stats: data.stats || { courses: 0, note: 5.0 }
      });
    });

    return livreursData;
  } catch (error) {
    console.error("Erreur lors de la récupération des livreurs:", error);
    throw new Error("Impossible de charger la liste des livreurs.");
  }
};

/**
 * Met à jour le statut d'un livreur (ex: suspendre ou réactiver)
 */
export const updateLivreurStatus = async (livreurId, newStatus) => {
  try {
    const livreurRef = doc(db, "livreurs", livreurId);
    await updateDoc(livreurRef, {
      statut:     newStatus,
      disponible: newStatus === 'actif'
    });
    return true;
  } catch (error) {
    console.error("Erreur mise à jour statut:", error);
    throw error;
  }
};

/**
 * Bloque manuellement un livreur (admin)
 * - statut passe à 'suspendu'
 * - disponible = false
 * - raison et date enregistrées pour traçabilité
 *
 * @param {string} livreurId   - ID Firestore du livreur
 * @param {string} raisonBlocage - Motif saisi par l'admin
 */
export const bloquerLivreur = async (livreurId, raisonBlocage = '') => {
  try {
    const adminId = localStorage.getItem('admin_id') || 'SUPER_ADMIN';
    const livreurRef = doc(db, "livreurs", livreurId);
    await updateDoc(livreurRef, {
      statut:        'suspendu',
      disponible:    false,
      raisonBlocage: raisonBlocage.trim() || 'Bloqué par admin',
      dateBloquage:  new Date().toISOString(),
      bloqueParId:   adminId,
    });
    return true;
  } catch (error) {
    console.error("Erreur bloquerLivreur:", error);
    throw new Error("Impossible de bloquer le livreur.");
  }
};

/**
 * Débloque un livreur (remet le statut à 'actif')
 *
 * @param {string} livreurId - ID Firestore du livreur
 */
export const debloquerLivreur = async (livreurId) => {
  try {
    const adminId = localStorage.getItem('admin_id') || 'SUPER_ADMIN';
    const livreurRef = doc(db, "livreurs", livreurId);
    await updateDoc(livreurRef, {
      statut:          'actif',
      disponible:      true,
      raisonBlocage:   null,
      dateBloquage:    null,
      bloqueParId:     null,
      dateDéblocage:   new Date().toISOString(),
      débloquéParId:   adminId,
    });
    return true;
  } catch (error) {
    console.error("Erreur debloquerLivreur:", error);
    throw new Error("Impossible de débloquer le livreur.");
  }
};
