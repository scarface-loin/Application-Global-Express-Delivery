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
  writeBatch,
  orderBy
} from 'firebase/firestore';

/**
 * Récupère toutes les demandes de garage avec leurs détails complets
 */
export const fetchDemandesGarage = async () => {
  try {
    const q = query(
      collection(db, "demandes_garage"),
      orderBy("dateCreation", "desc")
    );
    const querySnapshot = await getDocs(q);

    const demandes = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      demandes.push({
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
        // Détails de la session de validation qui a généré cette demande
        session: data.session || null,
      });
    });

    return demandes;
  } catch (error) {
    console.error("Erreur fetchDemandesGarage:", error);
    throw new Error("Impossible de charger les demandes garage.");
  }
};

/**
 * VALIDE une demande, soustrait la dette ET crée une entrée de session détaillée
 */
export const validerDemandeGarage = async (demandeId, livreurId, montantValide, demandeData) => {
  try {
    const adminId = localStorage.getItem('admin_id') || 'SUPER_ADMIN';
    const now = new Date().toISOString();
    const batch = writeBatch(db);

    // 1. Mise à jour de la demande garage
    const demandeRef = doc(db, "demandes_garage", demandeId);
    batch.update(demandeRef, {
      statut: 'valide',
      coutReel: parseFloat(montantValide),
      dateValidation: now,
      validePar: adminId,
      updatedAt: serverTimestamp()
    });

    // 2. Soustraction de la dette du livreur
    const livreurRef = doc(db, "livreurs", livreurId);
    batch.update(livreurRef, {
      "finance.detteActuelle": increment(-parseFloat(montantValide))
    });

    // 3. Création d'une SESSION DE VALIDATION détaillée
    const sessionRef = doc(collection(db, "sessions_garage"));
    batch.set(sessionRef, {
      // Identifiants
      demandeId,
      livreurId,
      livreurNom: demandeData?.nomLivreur || '',
      adminId,

      // Détails financiers
      montantEstime: parseFloat(demandeData?.montantManquant || 0),
      montantValide: parseFloat(montantValide),
      ecart: parseFloat(demandeData?.montantManquant || 0) - parseFloat(montantValide),

      // Détails de la demande
      vehicule: demandeData?.vehicule || 'N/A',
      immatriculation: demandeData?.immatriculation || 'N/A',
      motif: demandeData?.motif || '',
      description: demandeData?.description || '',
      urgence: demandeData?.urgence || 'normale',

      // Horodatage
      dateDemandeInitiale: demandeData?.date || null,
      dateValidation: now,
      createdAt: serverTimestamp(),

      // Statut
      type: 'validation_garage',
      statut: 'valide'
    });

    // 4. Trace dans transactions_financieres pour la comptabilité
    const transactionRef = doc(collection(db, "transactions_financieres"));
    batch.set(transactionRef, {
      livreurId,
      livreurNom: demandeData?.nomLivreur || '',
      type: 'regularisation_garage',
      montant: parseFloat(montantValide),
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

    // 1. Mise à jour de la demande
    const demandeRef = doc(db, "demandes_garage", demandeId);
    batch.update(demandeRef, {
      statut: 'rejete',
      dateValidation: now,
      validePar: adminId,
      motifRejet: motifRejet || '',
      updatedAt: serverTimestamp()
    });

    // 2. Session de rejet
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