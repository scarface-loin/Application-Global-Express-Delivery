/**
 * Cloud Functions – Global Express Delivery | Notifications Partenaire
 *
 * Deux triggers :
 *  1. onAttributionChanged  – livraison_partenaire : statut → en_cours
 *  2. onPaiementCreated     – notifications_partenaires : nouveau document
 *
 * Deploy : firebase deploy --only functions
 */

const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : récupérer le token FCM du partenaire
// ─────────────────────────────────────────────────────────────────────────────
async function getFCMToken(partenaireId) {
  try {
    const doc = await db.collection("partenaires").doc(partenaireId).get();
    if (!doc.exists) return null;
    return doc.data()?.fcmToken ?? null;
  } catch (err) {
    console.error("getFCMToken error:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 1 : Attribution de course
// Collection : livraison_partenaire
// Condition  : statut passe de en_attente_attribution → en_cours
// ─────────────────────────────────────────────────────────────────────────────
exports.onAttributionChanged = onDocumentUpdated(
  {
    document: "livraison_partenaire/{docId}",
    region: "europe-west1",
  },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Guard : vérifier la transition de statut
    const wasWaiting = before.statut === "en_attente_attribution";
    const isNowInProgress = after.statut === "en_cours";

    if (!wasWaiting || !isNowInProgress) {
      return null; // Pas la transition cible
    }

    const partenaireId = after.partenaireId;
    const numeroSuivi = after.numeroSuivi ?? "N/A";
    const livreurNom = after.livreurNom ?? "un livreur";

    if (!partenaireId) {
      console.warn("Pas de partenaireId sur le document:", event.params.docId);
      return null;
    }

    // 1. Récupérer le token FCM
    const token = await getFCMToken(partenaireId);

    // 2. Envoyer la notification push FCM (si token disponible)
    if (token) {
      const message = {
        token,
        notification: {
          title: "Course prise en charge 🛵",
          body: `Votre livraison #${numeroSuivi} a été confiée au livreur ${livreurNom}.`,
        },
        data: {
          type: "attribution",
          numeroSuivi,
          livreurNom,
          docId: event.params.docId,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high",
          notification: {
            channelId: "livraison_channel",
            icon: "ic_notification",
            color: "#10B981",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      try {
        const response = await messaging.send(message);
        console.log("FCM attribution envoyé:", response);
      } catch (fcmError) {
        console.error("FCM attribution erreur:", fcmError);
        // On invalide le token si expiré
        if (
          fcmError.code === "messaging/invalid-registration-token" ||
          fcmError.code === "messaging/registration-token-not-registered"
        ) {
          await db
            .collection("partenaires")
            .doc(partenaireId)
            .update({ fcmToken: FieldValue.delete() });
        }
      }
    }

    // 3. Créer un document dans notifications_partenaires pour le feed in-app
    await db.collection("notifications_partenaires").add({
      partenaireId,
      type: "attribution",
      titre: "Course prise en charge 🛵",
      message: `Votre livraison #${numeroSuivi} a été confiée au livreur ${livreurNom}.`,
      numeroSuivi,
      livreurNom,
      livraisonId: event.params.docId,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`Attribution notification créée pour partenaire: ${partenaireId}`);
    return null;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 2 : Paiement effectué
// Collection : notifications_partenaires
// Condition  : Création d'un nouveau document avec type = 'paiement'
// ─────────────────────────────────────────────────────────────────────────────
exports.onPaiementCreated = onDocumentCreated(
  {
    document: "notifications_partenaires/{docId}",
    region: "europe-west1",
  },
  async (event) => {
    const data = event.data.data();

    // Guard : seulement pour les notifications de type paiement
    // Les notifications d'attribution sont créées par onAttributionChanged
    if (data.type !== "paiement") {
      return null;
    }

    const partenaireId = data.partenaireId;

    if (!partenaireId) {
      console.warn("Pas de partenaireId sur notification:", event.params.docId);
      return null;
    }

    const titre = data.titre ?? "Paiement reçu 💰";
    const messageBody = data.message ?? "Un paiement a été effectué sur votre compte.";
    const montant = data.montant;

    // Formater le montant en FCFA
    const montantStr = montant
      ? new Intl.NumberFormat("fr-FR").format(montant) + " FCFA"
      : "";

    // 1. Récupérer le token FCM
    const token = await getFCMToken(partenaireId);

    // 2. Envoyer la notification push
    if (token) {
      const fcmPayload = {
        token,
        notification: {
          title: titre,
          body: montantStr
            ? `${messageBody} Montant : ${montantStr}`
            : messageBody,
        },
        data: {
          type: "paiement",
          docId: event.params.docId,
          montant: montant ? String(montant) : "0",
          preuveUrl: data.preuveUrl ?? "",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high",
          notification: {
            channelId: "paiement_channel",
            icon: "ic_notification",
            color: "#10B981",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      try {
        const response = await messaging.send(fcmPayload);
        console.log("FCM paiement envoyé:", response);
      } catch (fcmError) {
        console.error("FCM paiement erreur:", fcmError);
        if (
          fcmError.code === "messaging/invalid-registration-token" ||
          fcmError.code === "messaging/registration-token-not-registered"
        ) {
          await db
            .collection("partenaires")
            .doc(partenaireId)
            .update({ fcmToken: FieldValue.delete() });
        }
      }
    }

    // 3. Mettre à jour le compteur de notifications non lues (optionnel)
    await db
      .collection("partenaires")
      .doc(partenaireId)
      .update({
        unreadNotifications: FieldValue.increment(1),
        lastNotificationAt: FieldValue.serverTimestamp(),
      })
      .catch(() => {}); // Silencer si champ absent

    console.log(`Paiement notification traitée pour partenaire: ${partenaireId}`);
    return null;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : Enregistrer / mettre à jour le token FCM d'un partenaire
// Appeler depuis l'app Flutter lors du login ou refresh token
// ─────────────────────────────────────────────────────────────────────────────
exports.updateFCMToken = require("firebase-functions/v2/https").onCall(
  { region: "europe-west1" },
  async (request) => {
    const { partenaireId, token } = request.data;
    if (!partenaireId || !token) {
      throw new Error("partenaireId et token sont requis");
    }
    await db.collection("partenaires").doc(partenaireId).update({
      fcmToken: token,
      fcmTokenUpdatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  }
);
