import { db } from '../../../services/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Récupère tous les livreurs depuis Firestore
 */
export const fetchAllLivreurs = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "livreurs"));
    const livreursData = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // On s'assure que la structure est complète (défense contre données incomplètes) 
      livreursData.push({
        id: doc.id,
        ...data,
        // Valeurs par défaut si le livreur a été créé avec une ancienne version
        finance: data.finance || {
          detteActuelle: 0,
          plafondDette: 50000,
          totalManquants: 0
        },
        documents: data.documents || {
          cniUrl: null,
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
      statut: newStatus,
      // Si on suspend, on le met aussi indisponible
      disponible: newStatus === 'actif'
    });
    return true;
  } catch (error) {
    console.error("Erreur mise à jour statut:", error);
    throw error;
  }
};