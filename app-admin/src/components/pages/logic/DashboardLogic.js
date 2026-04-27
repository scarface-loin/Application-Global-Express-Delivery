// --- START OF FILE DashboardLogic.js ---

import { db } from '../../../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

/**
 * Normalise le statut brut Firestore en statut d'affichage
 * (cohérent avec HistoryPageLogic.js > normalizeStatus)
 */
const normalizeStatusForDisplay = (statut) => {
  switch (statut) {
    case 'livre':
    case 'valide':
    case 'facture_validee':
      return 'delivered';
    case 'partiel':
      return 'partiel';
    case 'en_cours':
      return 'in_progress';
    case 'non_livre':
    case 'annule':
    case 'echec':
      return 'cancelled';
    case 'en_attente':
    case 'en_attente_attribution':
    default:
      return 'pending';
  }
};

/**
 * Détermine si une livraison est encaissée (CA réel)
 * (cohérent avec DeliveryFeesReportLogic.js > isEncaissee)
 */
const isEncaissee = (statut) =>
  ['livre', 'partiel', 'facture_validee'].includes(statut);

/**
 * Récupère les données agrégées et les livraisons récentes pour le tableau de bord.
 * ⚠️ Récupère TOUTES les livraisons sans limite pour avoir les vrais totaux globaux.
 */
export const fetchDashboardData = async () => {
  try {
    // 1. Livreurs actifs
    const qLivreurs = query(collection(db, "livreurs"), where("statut", "==", "actif"));

    // 2. Toutes les livraisons sans limite — vrais totaux globaux
    const qInterne = query(
      collection(db, "livraisons"),
      orderBy("dateCreation", "desc")
    );
    const qPartenaire = query(
      collection(db, "livraison_partenaire"),
      orderBy("dateCreation", "desc")
    );

    const [snapLivreurs, snapInterne, snapPartenaire] = await Promise.all([
      getDocs(qLivreurs),
      getDocs(qInterne),
      getDocs(qPartenaire),
    ]);

    // 3. Fusion et tri global par date décroissante
    const allDeliveries = [];
    snapInterne.forEach(doc => {
      const data = doc.data();
      allDeliveries.push({ ...data, _source: 'interne' });
    });
    snapPartenaire.forEach(doc => {
      const data = doc.data();
      allDeliveries.push({ ...data, _source: 'partenaire' });
    });

    allDeliveries.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

    // 4. Calcul des statistiques sur TOUTES les livraisons
    const stats = allDeliveries.reduce((acc, delivery) => {
      acc.total += 1;

      // CA = frais de prestation uniquement sur les livraisons réellement encaissées
      // (cohérent avec DeliveryFeesReportLogic.js)
      if (isEncaissee(delivery.statut)) {
        acc.totalAmount += parseFloat(delivery.coutPrestation || 0);
      }

      switch (delivery.statut) {
        case 'en_attente':
        case 'en_attente_attribution':
          acc.pending += 1;
          break;
        case 'en_cours':
          acc.inProgress += 1;
          break;
        case 'livre':
        case 'valide':
        case 'facture_validee': // Statut final partenaire (FacturePartenairePageLogic)
          acc.delivered += 1;
          break;
        case 'partiel':
          acc.partial += 1;
          break;
        case 'non_livre':
        case 'annule':
        case 'echec':
          acc.failed += 1;
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
      partial: 0,
      failed: 0,
      totalAmount: 0,
    });

    stats.deliveryMen = snapLivreurs.size;

    // 5. Les 5 livraisons les plus récentes (déjà triées par date)
    const recentDeliveries = allDeliveries.slice(0, 5).map((d) => ({
      _id: d.numeroSuivi || d._id || 'N/A',
      status: normalizeStatusForDisplay(d.statut),
      // Nom client : priorité au nomClient de l'infosLivraison,
      // sinon nom du partenaire (livraisons partenaires sans nomClient direct)
      clientInfo: {
        name: d.infosLivraison?.nomClient ||
              d.partenaireNom ||
              'Client Interne'
      },
      // Type de livraison : 'course' | 'expedition' (cohérent avec les autres pages)
      deliveryType: d.type || 'course',
      // Quartier ou ville destination pour l'affichage
      destination: d.infosLivraison?.quartier ||
                   d.infosLivraison?.villeDestination ||
                   'N/A',
      livreurNom: d.livreurNom || null,
      totalAmount: parseFloat(d.totalGeneral || 0),
      coutPrestation: parseFloat(d.coutPrestation || 0),
      createdAt: d.dateCreation,
      source: d._source, // 'interne' | 'partenaire'
    }));

    return { stats, recentDeliveries };

  } catch (error) {
    console.error("Erreur fetchDashboardData:", error);
    throw new Error("Impossible de charger les données du tableau de bord.");
  }
};

// --- END OF FILE DashboardLogic.js ---