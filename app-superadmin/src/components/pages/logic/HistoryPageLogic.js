import { db } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy
} from 'firebase/firestore';

// Helper pour formater les données de n'importe quelle livraison
const formatHistoryData = (docSnap, origine) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    origine: origine,
    type: data.type,
    quartier: data.infosLivraison?.quartier || data.infosLivraison?.villeDestination || 'N/A',
    numeroDestinataire: data.infosLivraison?.contactClient || data.infosLivraison?.numeroDestinataire || '',
    coutLivraison: data.coutPrestation || 0,
    articles: data.articles || [],
    total: data.totalGeneral || 0,
    trackingNumber: data.numeroSuivi,
    // On unifie les statuts pour le filtrage
    statut: data.statut === 'livre' ? 'delivered' : data.statut === 'non_livre' || data.statut === 'annule' ? 'cancelled' : data.statut,
    livreurNom: data.livreurNom || null,
    dateCreation: data.dateCreation,
    dateFin: data.dateLivraison || data.dateNonLivraison || data.dateValidation || data.dateCreation
  };
};

/**
 * Récupère l'historique complet des livraisons (Interne + Partenaire)
 * en fonction des filtres appliqués.
 */
export const fetchHistory = async ({ startDate, endDate, statut }) => {
  try {
    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate);
    endISO.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
    const endISOString = endISO.toISOString();

    const collections = ['livraisons', 'livraison_partenaire'];
    const promises = [];

    collections.forEach(col => {
      // Construction de la requête de base
      let q = query(
        collection(db, col),
        where("dateCreation", ">=", startISO),
        where("dateCreation", "<=", endISOString),
        orderBy("dateCreation", "desc")
      );

      // Ajout du filtre de statut si nécessaire
      // Note: Firestore ne permet pas de requêtes "OR" ('non_livre' ou 'annule').
      // Le filtrage se fera donc côté client pour ce cas précis.
      if (statut === 'delivered') {
        q = query(q, where('statut', '==', 'livre'));
      } else if (statut === 'cancelled') {
        // On ne peut pas faire where('statut', 'in', ['non_livre', 'annule']),
        // donc on récupère tout et on filtre après
      }
      
      promises.push(getDocs(q));
    });

    const [snapInterne, snapPartenaire] = await Promise.all(promises);
    
    let allDeliveries = [];
    snapInterne.forEach(doc => allDeliveries.push(formatHistoryData(doc, 'interne')));
    snapPartenaire.forEach(doc => allDeliveries.push(formatHistoryData(doc, 'partenaire')));

    // Filtrage final côté client
    if (statut) {
      allDeliveries = allDeliveries.filter(d => {
        if (statut === 'cancelled') {
          return d.statut === 'cancelled';
        }
        return d.statut === statut;
      });
    }

    return allDeliveries;

  } catch (error) {
    console.error("Erreur fetchHistory:", error);
    // Erreur d'index Firestore est la plus probable
    throw new Error("Impossible de charger l'historique. Vérifiez les index Firestore.");
  }
};