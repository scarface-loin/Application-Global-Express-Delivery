import { db } from '../../../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS INTERNES
// ─────────────────────────────────────────────────────────────────────────────

const toISO = (dateStr, endOfDay = false) => {
  const d = new Date(dateStr);
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

/**
 * Détermine si une livraison est "encaissée" (validée avec succès)
 * Statuts pris en compte : livre, partiel, facture_validee
 */
const isEncaissee = (statut) =>
  ['livre', 'partiel', 'facture_validee'].includes(statut);

/**
 * Formate un enregistrement brut Firestore en entrée de rapport
 */
const formatEntry = (docSnap, origine) => {
  const data = docSnap.data();

  // Date de référence : validation ou création
  const dateRef =
    data.dateValidation || data.dateLivraison || data.dateCreation;

  // Frais de prestation (ce que l'entreprise perçoit pour la livraison)
  const fraisPrestation = parseFloat(data.coutPrestation || data.coutLivraison || 0);

  // Montant total de la commande
  const totalGeneral = parseFloat(data.totalGeneral || 0);

  // Pour les partenaires, le net entreprise = fraisPrestation
  // Pour les internes, le net entreprise = fraisPrestation également
  const netEntreprise = fraisPrestation;

  return {
    id: docSnap.id,
    origine,                                  // 'interne' | 'partenaire'
    numeroSuivi: data.numeroSuivi || 'N/A',
    type: data.type || 'N/A',                 // 'course' | 'expedition'
    statut: data.statut || 'inconnu',
    partenaireNom: data.partenaireNom || null,
    livreurNom: data.livreurNom || null,
    quartier:
      data.infosLivraison?.quartier ||
      data.infosLivraison?.villeDestination ||
      'N/A',
    fraisPrestation,   // Frais de livraison brut
    totalGeneral,      // Total commande (marchandise + frais)
    netEntreprise,     // Ce que l'entreprise garde (= fraisPrestation ici)
    dateCreation: data.dateCreation || null,
    dateValidation: dateRef || null,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. FETCH PRINCIPAL : Frais de livraison sur une période
//
//    Retourne toutes les livraisons validées (livre / partiel / facture_validee)
//    sur la période demandée, avec le détail des frais.
//
//    @param {string} startDate  - Date ISO ou 'YYYY-MM-DD'
//    @param {string} endDate    - Date ISO ou 'YYYY-MM-DD'
//    @param {string} [origine]  - Filtre optionnel : 'interne' | 'partenaire' | null (tous)
//    @param {string} [type]     - Filtre optionnel : 'course' | 'expedition' | null (tous)
// ─────────────────────────────────────────────────────────────────────────────
export const fetchDeliveryFeesReport = async ({
  startDate,
  endDate,
  origine = null,
  type = null,
} = {}) => {
  try {
    const startISO = toISO(startDate, false);
    const endISO = toISO(endDate, true);

    // On interroge les deux collections en parallèle
    const queries = [];

    if (!origine || origine === 'interne') {
      queries.push(
        getDocs(
          query(
            collection(db, 'livraisons'),
            where('dateCreation', '>=', startISO),
            where('dateCreation', '<=', endISO),
            orderBy('dateCreation', 'desc')
          )
        ).then(snap => ({ snap, origine: 'interne' }))
      );
    }

    if (!origine || origine === 'partenaire') {
      queries.push(
        getDocs(
          query(
            collection(db, 'livraison_partenaire'),
            where('dateCreation', '>=', startISO),
            where('dateCreation', '<=', endISO),
            orderBy('dateCreation', 'desc')
          )
        ).then(snap => ({ snap, origine: 'partenaire' }))
      );
    }

    const results = await Promise.all(queries);

    let entries = [];
    results.forEach(({ snap, origine: src }) => {
      snap.forEach(docSnap => {
        const entry = formatEntry(docSnap, src);
        // Ne garder que les livraisons réellement encaissées
        if (isEncaissee(entry.statut)) {
          entries.push(entry);
        }
      });
    });

    // Filtre par type si demandé
    if (type) {
      entries = entries.filter(e => e.type === type);
    }

    // Tri global par date décroissante
    entries.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

    // ── Agrégats globaux ──────────────────────────────────────────────────────
    const totaux = entries.reduce(
      (acc, e) => {
        acc.totalFraisPrestation += e.fraisPrestation;
        acc.totalCommandesValeur += e.totalGeneral;
        acc.nbLivraisons += 1;
        if (e.origine === 'interne') acc.nbInternes += 1;
        else acc.nbPartenaires += 1;
        if (e.type === 'course') acc.nbCourses += 1;
        else if (e.type === 'expedition') acc.nbExpeditions += 1;
        return acc;
      },
      {
        totalFraisPrestation: 0,
        totalCommandesValeur: 0,
        nbLivraisons: 0,
        nbInternes: 0,
        nbPartenaires: 0,
        nbCourses: 0,
        nbExpeditions: 0,
      }
    );

    // ── Ventilation par jour ──────────────────────────────────────────────────
    const parJour = {};
    entries.forEach(e => {
      const jour = (e.dateCreation || '').substring(0, 10); // 'YYYY-MM-DD'
      if (!parJour[jour]) {
        parJour[jour] = { date: jour, nbLivraisons: 0, fraisPrestation: 0 };
      }
      parJour[jour].nbLivraisons += 1;
      parJour[jour].fraisPrestation += e.fraisPrestation;
    });

    const ventilationJournaliere = Object.values(parJour).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // ── Ventilation par partenaire (uniquement si origine = partenaire ou tous) ─
    const parPartenaire = {};
    entries
      .filter(e => e.origine === 'partenaire' && e.partenaireNom)
      .forEach(e => {
        const nom = e.partenaireNom;
        if (!parPartenaire[nom]) {
          parPartenaire[nom] = { nom, nbLivraisons: 0, fraisPrestation: 0 };
        }
        parPartenaire[nom].nbLivraisons += 1;
        parPartenaire[nom].fraisPrestation += e.fraisPrestation;
      });

    const ventilationPartenaire = Object.values(parPartenaire).sort(
      (a, b) => b.fraisPrestation - a.fraisPrestation
    );

    return {
      periode: { startDate, endDate },
      totaux,
      ventilationJournaliere,
      ventilationPartenaire,
      detail: entries, // Liste complète pour affichage tableau
    };

  } catch (error) {
    console.error('Erreur fetchDeliveryFeesReport:', error);
    throw new Error('Impossible de charger le rapport des frais de livraison.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPARAISON ENTRE DEUX PÉRIODES
//
//    Utile pour comparer semaine/mois précédent vs actuel.
//
//    @param {Object} periodeA  - { startDate, endDate }
//    @param {Object} periodeB  - { startDate, endDate }
// ─────────────────────────────────────────────────────────────────────────────
export const compareDeliveryFeesPeriods = async (periodeA, periodeB) => {
  try {
    const [rapportA, rapportB] = await Promise.all([
      fetchDeliveryFeesReport(periodeA),
      fetchDeliveryFeesReport(periodeB),
    ]);

    const delta = (valB, valA) => {
      if (valA === 0) return valB > 0 ? 100 : 0;
      return (((valB - valA) / valA) * 100).toFixed(1);
    };

    return {
      periodeA: rapportA,
      periodeB: rapportB,
      evolution: {
        fraisPrestation: {
          valeurA: rapportA.totaux.totalFraisPrestation,
          valeurB: rapportB.totaux.totalFraisPrestation,
          deltaPercent: delta(
            rapportB.totaux.totalFraisPrestation,
            rapportA.totaux.totalFraisPrestation
          ),
        },
        nbLivraisons: {
          valeurA: rapportA.totaux.nbLivraisons,
          valeurB: rapportB.totaux.nbLivraisons,
          deltaPercent: delta(
            rapportB.totaux.nbLivraisons,
            rapportA.totaux.nbLivraisons
          ),
        },
      },
    };
  } catch (error) {
    console.error('Erreur compareDeliveryFeesPeriods:', error);
    throw new Error('Impossible de comparer les deux périodes.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. FRAIS MOYENS PAR LIVRAISON (KPI rapide)
//
//    Retourne le frais moyen par course et par expédition sur la période.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchAverageFees = async ({ startDate, endDate }) => {
  try {
    const rapport = await fetchDeliveryFeesReport({ startDate, endDate });
    const { detail, totaux } = rapport;

    const courses = detail.filter(e => e.type === 'course');
    const expeditions = detail.filter(e => e.type === 'expedition');

    const moyenne = (arr) =>
      arr.length === 0
        ? 0
        : arr.reduce((s, e) => s + e.fraisPrestation, 0) / arr.length;

    return {
      periode: { startDate, endDate },
      fraisMoyenGlobal:
        totaux.nbLivraisons === 0
          ? 0
          : totaux.totalFraisPrestation / totaux.nbLivraisons,
      fraisMoyenCourse: moyenne(courses),
      fraisMoyenExpedition: moyenne(expeditions),
      nbCourses: courses.length,
      nbExpeditions: expeditions.length,
    };
  } catch (error) {
    console.error('Erreur fetchAverageFees:', error);
    throw new Error('Impossible de calculer les frais moyens.');
  }
};