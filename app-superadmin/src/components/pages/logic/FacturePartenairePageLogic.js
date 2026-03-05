import { db, storage } from '../../../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ─────────────────────────────────────────────────────────────────────────────
// 1. CHARGEMENT : Livraisons partenaires prêtes à être facturées
//
//    Critère : statut === 'livre' ET dateFactureValidee === null
//    Ces livraisons ont été validées par l'admin de livraison (ValidationPage)
//    mais attendent encore la validation financière du super admin.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchPartnerDeliveriesToInvoice = async () => {
  try {
    const q = query(
      collection(db, 'livraison_partenaire'),
      where('statut', '==', 'livre'),
      where('dateFactureValidee', '==', null)
    );

    const querySnapshot = await getDocs(q);

    const deliveries = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        numeroSuivi: data.numeroSuivi || 'N/A',
        partenaireId: data.partenaireId,
        partenaireNom: data.partenaireNom || 'Partenaire Inconnu',
        type: data.type,
        quartier: data.infosLivraison?.quartier || data.infosLivraison?.villeDestination || 'N/A',
        nomClient: data.infosLivraison?.nomClient || data.infosLivraison?.nomClient || 'N/A',
        articles: data.articles || [],
        // Montant original soumis par le partenaire
        coutLivraisonPartenaire: parseFloat(data.coutPrestation || data.coutLivraison || 0),
        totalGeneral: parseFloat(data.totalGeneral || 0),
        dateCreation: data.dateCreation,
        dateLivraison: data.dateLivraison || null,
        // Facture déposée par le partenaire (si applicable)
        factureUrl: data.factureUrl || null,
      };
    });

    // Tri : plus récentes en premier
    deliveries.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

    return deliveries;
  } catch (error) {
    console.error('Erreur fetchPartnerDeliveriesToInvoice:', error);
    throw new Error('Impossible de charger les factures partenaires en attente.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. VALIDATION FACTURE par le Super Admin
//
//    Actions effectuées en une seule transaction (writeBatch) :
//      a) Met à jour la livraison partenaire (statut 'facture_validee')
//      b) Crée un enregistrement dans 'historique_factures_partenaires'
//      c) Crée une notification pour le partenaire
//
//    @param {Object} params
//    @param {string}  params.deliveryId         - ID du doc livraison_partenaire
//    @param {string}  params.partenaireId        - ID du partenaire
//    @param {string}  params.partenaireNom       - Nom du partenaire
//    @param {number}  params.coutLivraisonOriginal - Montant soumis par le partenaire
//    @param {number}  params.coutLivraisonValide  - Montant validé par le super admin
//    @param {string}  params.justification        - Explication si le montant a changé
//    @param {File}    params.imageConfirmation    - Preuve de dépôt (fichier image)
//    @param {string}  params.numeroSuivi          - Pour affichage dans la notif
// ─────────────────────────────────────────────────────────────────────────────
export const validerFacturePartenaire = async ({
  deliveryId,
  partenaireId,
  partenaireNom,
  coutLivraisonOriginal,
  coutLivraisonValide,
  justification,
  imageConfirmation,
  numeroSuivi,
}) => {
  try {
    const adminId = localStorage.getItem('admin_id') || 'SUPER_ADMIN';
    const now = new Date().toISOString();

    // --- A. Upload de l'image de confirmation de dépôt ---
    if (!imageConfirmation) {
      throw new Error("L'image de confirmation du dépôt est obligatoire.");
    }

    const timestamp = Date.now();
    const storageRef = ref(
      storage,
      `confirmations_depot/${partenaireId}/${deliveryId}_${timestamp}`
    );
    const uploadResult = await uploadBytes(storageRef, imageConfirmation);
    const confirmationImageUrl = await getDownloadURL(uploadResult.ref);

    // --- B. Calcul de la différence (pour traçabilité) ---
    const montantOriginal = parseFloat(coutLivraisonOriginal) || 0;
    const montantValide = parseFloat(coutLivraisonValide) || 0;
    const differenceMonitant = montantValide - montantOriginal;
    const montantModifie = differenceMonitant !== 0;

    // --- C. Écriture batch (atomique) ---
    const batch = writeBatch(db);

    // C1 — Mise à jour de la livraison partenaire
    const livraisonRef = doc(db, 'livraison_partenaire', deliveryId);
    batch.update(livraisonRef, {
      statut: 'facture_validee',
      dateFactureValidee: now,
      coutLivraisonValide: montantValide,
      coutLivraisonOriginal: montantOriginal,
      confirmationDepotUrl: confirmationImageUrl,
      justificationAdmin: justification || null,
      validePar: adminId,
      updatedAt: serverTimestamp(),
    });

    // C2 — Enregistrement dans l'historique des factures
    const historiqueRef = doc(collection(db, 'historique_factures_partenaires'));
    batch.set(historiqueRef, {
      livraisonId: deliveryId,
      numeroSuivi: numeroSuivi || 'N/A',
      partenaireId,
      partenaireNom,
      coutLivraisonOriginal: montantOriginal,
      coutLivraisonValide: montantValide,
      differenceMonitant,
      montantModifie,
      justificationAdmin: justification || null,
      confirmationDepotUrl: confirmationImageUrl,
      dateValidation: now,
      validePar: adminId,
      createdAt: serverTimestamp(),
    });

    // C3 — Notification pour le partenaire
    const notifRef = doc(collection(db, 'notifications_partenaires'));
    const montantModifieMessage = montantModifie
      ? ` (Montant ajusté : ${montantOriginal.toLocaleString('fr-FR')} → ${montantValide.toLocaleString('fr-FR')} FCFA${justification ? ` — ${justification}` : ''})`
      : '';

    batch.set(notifRef, {
      partenaireId,
      partenaireNom,
      type: 'facture_validee',
      titre: 'Dépôt confirmé ✅',
      message: `Votre facture pour la livraison ${numeroSuivi} a été validée et le dépôt a été effectué.${montantModifieMessage}`,
      livraisonId: deliveryId,
      numeroSuivi: numeroSuivi || 'N/A',
      montantDepose: montantValide,
      confirmationDepotUrl: confirmationImageUrl,
      lu: false,
      createdAt: serverTimestamp(),
    });

    await batch.commit();

    return {
      success: true,
      confirmationImageUrl,
      montantValide,
      montantModifie,
    };
  } catch (error) {
    console.error('Erreur validerFacturePartenaire:', error);
    throw new Error(error.message || 'Impossible de valider la facture partenaire.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. HISTORIQUE : Factures partenaires déjà validées
//
//    Permet au super admin de consulter l'historique des dépôts effectués,
//    filtré optionnellement par partenaire ou période.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchHistoriqueFactures = async ({ partenaireId = null, startDate = null, endDate = null } = {}) => {
  try {
    let q = query(
      collection(db, 'historique_factures_partenaires'),
    );

    // Si on filtre par partenaire spécifique
    if (partenaireId) {
      q = query(
        collection(db, 'historique_factures_partenaires'),
        where('partenaireId', '==', partenaireId)
      );
    }

    const snapshot = await getDocs(q);
    let factures = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // Filtrage par période côté client (évite les index composites Firestore)
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      factures = factures.filter((f) => new Date(f.dateValidation) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      factures = factures.filter((f) => new Date(f.dateValidation) <= end);
    }

    // Tri : plus récentes en premier
    factures.sort((a, b) => new Date(b.dateValidation) - new Date(a.dateValidation));

    return factures;
  } catch (error) {
    console.error('Erreur fetchHistoriqueFactures:', error);
    throw new Error("Impossible de charger l'historique des factures.");
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. NOTIFICATIONS PARTENAIRE : Récupérer les notifs non lues
//
//    Utile pour le panneau de notification côté partenaire.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchNotificationsPartenaire = async (partenaireId) => {
  try {
    const q = query(
      collection(db, 'notifications_partenaires'),
      where('partenaireId', '==', partenaireId),
      where('lu', '==', false)
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    notifications.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return notifications;
  } catch (error) {
    console.error('Erreur fetchNotificationsPartenaire:', error);
    throw new Error('Impossible de charger les notifications.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. MARQUER UNE NOTIFICATION COMME LUE
// ─────────────────────────────────────────────────────────────────────────────
export const marquerNotificationLue = async (notificationId) => {
  try {
    const notifRef = doc(db, 'notifications_partenaires', notificationId);
    await updateDoc(notifRef, { lu: true, dateLecture: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    console.error('Erreur marquerNotificationLue:', error);
    throw new Error('Impossible de marquer la notification comme lue.');
  }
};