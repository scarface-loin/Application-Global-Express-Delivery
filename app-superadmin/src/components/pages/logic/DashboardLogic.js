// --- START OF FILE DashboardLogic.js ---

import { db } from '../../../services/firebase'; // Adaptez le chemin
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * Récupère les données agrégées et les livraisons récentes pour le tableau de bord.
 */
export const fetchDashboardData = async () => {
  try {
    // 1. Récupérer les livreurs actifs
    const qLivreurs = query(collection(db, "livreurs"), where("statut", "==", "actif"));

    // 2. Récupérer les livraisons récentes (Interne + Partenaire)
    // On prend les 100 dernières pour calculer les stats, et on affiche les 5 plus récentes.
    const qInterne = query(collection(db, "livraisons"), orderBy("dateCreation", "desc"), limit(100));
    const qPartenaire = query(collection(db, "livraison_partenaire"), orderBy("dateCreation", "desc"), limit(100));

    // Exécution des requêtes en parallèle pour la performance
    const [snapLivreurs, snapInterne, snapPartenaire] = await Promise.all([
      getDocs(qLivreurs),
      getDocs(qInterne),
      getDocs(qPartenaire),
    ]);

    // 3. Calcul des statistiques
    const allDeliveries = [];
    snapInterne.forEach(doc => allDeliveries.push(doc.data()));
    snapPartenaire.forEach(doc => allDeliveries.push(doc.data()));

    const stats = allDeliveries.reduce((acc, delivery) => {
      acc.total += 1;
      acc.totalAmount += delivery.totalGeneral || 0;

      switch (delivery.statut) {
        case 'en_attente':
        case 'en_attente_attribution':
          acc.pending += 1;
          break;
        case 'en_cours':
          acc.inProgress += 1;
          break;
        case 'livre':
        case 'valide': // Le statut 'valide' est aussi une forme de "livré" du point de vue admin
          acc.delivered += 1;
          break;
        default:
          break;
      }
      return acc;
    }, {
      total: 0,
      pending: 0,
      inProgress: 0,
      delivered: 0,
      totalAmount: 0,
    });

    stats.deliveryMen = snapLivreurs.size;

    // 4. Formater les 5 livraisons les plus récentes pour l'affichage
    const recentDeliveries = allDeliveries.slice(0, 5).map((d, index) => ({
      _id: d.numeroSuivi || `ID-${index}`,
      status: d.statut === 'livre' ? 'delivered' : d.statut === 'en_cours' ? 'in_progress' : 'pending',
      clientInfo: { name: d.infosLivraison?.nomClient || d.partenaireNom || 'Client Interne' },
      deliveryType: d.type === 'course' || d.type === 'expedition' ? 'local' : 'transfert', // Simplification
      totalAmount: d.totalGeneral || 0,
      createdAt: d.dateCreation
    }));

    return { stats, recentDeliveries };

  } catch (error) {
    console.error("Erreur fetchDashboardData:", error);
    throw new Error("Impossible de charger les données du tableau de bord.");
  }
};
// --- END OF FILE DashboardLogic.js ---