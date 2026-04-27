import { db } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  serverTimestamp, 
  writeBatch,
  orderBy
} from 'firebase/firestore';

/**
 * Reconstruit l'objet "session" à partir des livraisons validées dans Firestore.
 *
 * LOGIQUE DE CROISEMENT :
 * Lors de la validation d'un livreur (validerSessionLivreur dans ValidationPageLogic.js),
 * une seule variable `now = new Date().toISOString()` est utilisée pour écrire :
 *   - `dateValidation` sur chaque document de la collection "livraisons"
 *   - `dateCreation`   sur le document de la collection "demandes_garage"
 * Ces deux champs ont donc la même valeur ISO exacte.
 * On peut donc retrouver toutes les livraisons d'une session garage via :
 *   livraisons WHERE livreurId == demande.livreurId AND dateValidation == demande.dateCreation
 */
const reconstructSessionFromLivraisons = async (livreurId, dateCreation) => {
  if (!livreurId || !dateCreation) return null;

  try {
    // Interroger les deux collections en parallèle avec le même critère de croisement :
    // livreurId + dateValidation == dateCreation (même valeur `now` écrite dans le même batch)
    const [snapInterne, snapPartenaire] = await Promise.all([
      getDocs(query(
        collection(db, "livraisons"),
        where("livreurId", "==", livreurId),
        where("dateValidation", "==", dateCreation)
      )),
      getDocs(query(
        collection(db, "livraison_partenaire"),
        where("livreurId", "==", livreurId),
        where("dateLivraison", "==", dateCreation)
      ))
    ]);

    if (snapInterne.empty && snapPartenaire.empty) return null;

    const buildLivraison = (d, origine) => {
      const data = d.data();
      const articles = (data.articles || []).map(a => ({
        nom:               a.nom || a.designation || 'Article',
        quantiteCommandee: parseInt(a.quantiteCommandee || 0),
        quantiteLivree:    parseInt(a.quantiteLivree   || 0),
        quantiteRetournee: parseInt(a.quantiteRetournee || 0),
        quantitePerdue:    parseInt(a.quantitePerdue   || 0),
        coutUnitaire:      parseFloat(a.coutUnitaire   || 0),
      }));

      const nbLivres    = articles.filter(a => a.quantiteLivree    > 0).length;
      const nbRetournes = articles.filter(a => a.quantiteRetournee > 0).length;
      const nbPerdus    = articles.filter(a => a.quantitePerdue    > 0).length;

      return {
        livraisonId:         d.id,
        tracking:            data.numeroSuivi || d.id,
        quartier:            data.infosLivraison?.quartier || data.infosLivraison?.villeDestination || 'N/A',
        origine,
        statut:              data.statut,
        totalCalcule:        parseFloat(data.totalFinalEncaisse || 0),
        coutPrestation:      parseFloat(data.coutPrestation     || 0),
        nbArticlesLivres:    nbLivres,
        nbArticlesRetournes: nbRetournes,
        nbArticlesPerdus:    nbPerdus,
        articles,
      };
    };

    const livraisons = [
      ...snapInterne.docs.map(d => buildLivraison(d, 'interne')),
      ...snapPartenaire.docs.map(d => buildLivraison(d, 'partenaire')),
    ];

    // Agrégats globaux
    const totalArticlesLivres    = livraisons.reduce((s, l) => s + l.nbArticlesLivres,    0);
    const totalArticlesRetournes = livraisons.reduce((s, l) => s + l.nbArticlesRetournes, 0);
    const totalArticlesPerdus    = livraisons.reduce((s, l) => s + l.nbArticlesPerdus,    0);

    return {
      date:                  dateCreation,
      nbCourses:             livraisons.length,
      livraisons,
      totalArticlesLivres,
      totalArticlesRetournes,
      totalArticlesPerdus,
      // Les montants financiers agrégés (montantTheorique, montantRecu, etc.)
      // ne sont pas stockés dans "livraisons" — uniquement dans "session" (nouvelles demandes).
      // On laisse ces champs à null pour que le composant SessionDetails
      // les affiche comme "—" sans erreur.
      montantTheorique:      null,
      montantRecu:           null,
      cashManquant:          null,
      montantPerduArticles:  null,
      totalDetteAjoutee:     null,
      ecartCash:             null,
      notes:                 null,
      _source:               'livraisons', // flag interne pour debug
    };

  } catch (e) {
    console.warn("reconstructSessionFromLivraisons:", e);
    return null;
  }
};

/**
 * Récupère toutes les demandes de garage avec leurs détails complets.
 * Pour les demandes qui ont déjà un champ `session` (nouvelles), on l'utilise directement.
 * Pour les demandes sans `session` (anciennes), on reconstruit depuis la collection "livraisons"
 * en croisant livreurId + dateValidation == dateCreation.
 */
export const fetchDemandesGarage = async () => {
  try {
    const q = query(
      collection(db, "demandes_garage"),
      orderBy("dateCreation", "desc")
    );
    const querySnapshot = await getDocs(q);

    // 1. Construire la liste brute
    const demandesBrutes = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      demandesBrutes.push({
        id: docSnap.id,
        ...data,
        date: data.dateCreation || data.date,
        nomLivreur: data.livreurNom || data.nomLivreur || 'Inconnu',
        idLivreur: data.livreurId || data.idLivreur,
        vehicule: data.vehicule || 'Non spécifié',
        immatriculation: data.immatriculation || 'N/A',
        urgence: data.urgence || 'normale',
        motif: data.motif || 'Non précisé',
        description: data.description || '',
        montantManquant: data.montantManquant || data.montantEstime || 0,
        coutReel: data.coutReel || null,
        statut: data.statut || 'en_attente',
        dateValidation: data.dateValidation || null,
        validePar: data.validePar || null,
        photoUrl: data.photoUrl || data.preuve || null,
        session: data.session || null,
      });
    });

    // 2. Pour chaque demande sans session, tenter la reconstruction depuis "livraisons"
    const demandes = await Promise.all(
      demandesBrutes.map(async (demande) => {
        if (demande.session) return demande; // session complète déjà présente → rien à faire

        const sessionReconstruite = await reconstructSessionFromLivraisons(
          demande.idLivreur,
          demande.date
        );
        return { ...demande, session: sessionReconstruite };
      })
    );

    return demandes;

  } catch (error) {
    console.error("Erreur fetchDemandesGarage:", error);
    throw new Error("Impossible de charger les demandes garage.");
  }
};

/**
 * VALIDE une demande, soustrait la dette ET crée une entrée de session détaillée.
 *
 * CORRECTION : on lit d'abord finance.detteActuelle puis on soustrait le montant
 * garage en plafonant à 0 (Math.max), pour éviter une dette négative.
 * increment(-x) Firestore est aveugle et peut passer sous zéro.
 */
export const validerDemandeGarage = async (demandeId, livreurId, montantValide, demandeData) => {
  try {
    const adminId = localStorage.getItem('admin_id') || 'SUPER_ADMIN';
    const now = new Date().toISOString();
    const montant = parseFloat(montantValide);

    // 1. Lire la dette actuelle AVANT d'écrire
    const livreurRef = doc(db, "livreurs", livreurId);
    const livreurSnap = await getDoc(livreurRef);
    if (!livreurSnap.exists()) throw new Error("Livreur introuvable.");

    const detteActuelle = parseFloat(livreurSnap.data()?.finance?.detteActuelle || 0);
    // Plafonner à 0 : on ne peut pas rembourser plus que ce qui est dû
    const nouvelleDetteActuelle = Math.max(0, detteActuelle - montant);

    const batch = writeBatch(db);

    // 2. Mise à jour de la demande garage
    const demandeRef = doc(db, "demandes_garage", demandeId);
    batch.update(demandeRef, {
      statut: 'valide',
      coutReel: montant,
      dateValidation: now,
      validePar: adminId,
      updatedAt: serverTimestamp()
    });

    // 3. Mise à jour de la dette — valeur calculée, jamais négative
    batch.update(livreurRef, {
      "finance.detteActuelle": nouvelleDetteActuelle
    });

    // 4. Session de validation détaillée
    const sessionRef = doc(collection(db, "sessions_garage"));
    batch.set(sessionRef, {
      demandeId,
      livreurId,
      livreurNom: demandeData?.nomLivreur || '',
      adminId,
      montantEstime: parseFloat(demandeData?.montantManquant || 0),
      montantValide: montant,
      ecart: parseFloat(demandeData?.montantManquant || 0) - montant,
      // Snapshot avant/après pour traçabilité
      detteAvant: detteActuelle,
      detteApres: nouvelleDetteActuelle,
      vehicule: demandeData?.vehicule || 'N/A',
      immatriculation: demandeData?.immatriculation || 'N/A',
      motif: demandeData?.motif || '',
      description: demandeData?.description || '',
      urgence: demandeData?.urgence || 'normale',
      dateDemandeInitiale: demandeData?.date || null,
      dateValidation: now,
      createdAt: serverTimestamp(),
      type: 'validation_garage',
      statut: 'valide'
    });

    // 5. Trace comptable
    const transactionRef = doc(collection(db, "transactions_financieres"));
    batch.set(transactionRef, {
      livreurId,
      livreurNom: demandeData?.nomLivreur || '',
      type: 'regularisation_garage',
      montant,
      description: `Validation garage - ${demandeData?.motif || demandeId}`,
      vehicule: demandeData?.vehicule || 'N/A',
      date: now,
      createdAt: serverTimestamp(),
      adminId,
      demandeId
    });

    await batch.commit();
    return { success: true, sessionId: sessionRef.id };

  } catch (error) {
    console.error("Erreur validerDemandeGarage:", error);
    throw new Error("Erreur lors de la validation de la demande.");
  }
};

/**
 * REJETTE une demande et crée une session de rejet
 */
export const rejeterDemandeGarage = async (demandeId, demandeData, motifRejet = '') => {
  try {
    const adminId = localStorage.getItem('admin_id') || 'SUPER_ADMIN';
    const now = new Date().toISOString();
    const batch = writeBatch(db);

    const demandeRef = doc(db, "demandes_garage", demandeId);
    batch.update(demandeRef, {
      statut: 'rejete',
      dateValidation: now,
      validePar: adminId,
      motifRejet: motifRejet || '',
      updatedAt: serverTimestamp()
    });

    const sessionRef = doc(collection(db, "sessions_garage"));
    batch.set(sessionRef, {
      demandeId,
      livreurId: demandeData?.idLivreur || '',
      livreurNom: demandeData?.nomLivreur || '',
      adminId,
      montantEstime: parseFloat(demandeData?.montantManquant || 0),
      montantValide: 0,
      vehicule: demandeData?.vehicule || 'N/A',
      immatriculation: demandeData?.immatriculation || 'N/A',
      motif: demandeData?.motif || '',
      motifRejet,
      dateDemandeInitiale: demandeData?.date || null,
      dateValidation: now,
      createdAt: serverTimestamp(),
      type: 'validation_garage',
      statut: 'rejete'
    });

    await batch.commit();
    return { success: true };

  } catch (error) {
    console.error("Erreur rejeterDemandeGarage:", error);
    throw new Error("Erreur lors du rejet de la demande.");
  }
};

/**
 * Récupère l'historique des sessions de validation garage
 */
export const fetchSessionsGarage = async (limitDays = 30) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - limitDays);

    const q = query(
      collection(db, "sessions_garage"),
      where("dateValidation", ">=", since.toISOString()),
      orderBy("dateValidation", "desc")
    );
    const snap = await getDocs(q);
    const sessions = [];
    snap.forEach(d => sessions.push({ id: d.id, ...d.data() }));
    return sessions;
  } catch (error) {
    console.error("Erreur fetchSessionsGarage:", error);
    return [];
  }
};