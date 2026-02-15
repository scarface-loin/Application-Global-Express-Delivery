import { db } from '../../../services/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

// URL de votre serveur WhatsApp (à configurer selon votre déploiement)
// ⚠️ IMPORTANT: Pas de slash à la fin !
const WHATSAPP_SERVER_URL = "https://whatsapp-bot-34294235336.europe-west1.run.app";

/**
 * ✅ AMÉLIORATION: Envoi de notification WhatsApp avec toutes les données
 * 
 * ⚠️ IMPORTANT: deliveryData.id doit contenir l'ID du document Firestore
 * Exemple d'utilisation:
 * 
 * const result = await createDeliveryInFirebase(formData, articles, type);
 * if (result.success) {
 *   await sendWhatsAppNotification({
 *     id: result.id,  // ← L'ID du document Firestore
 *     numeroSuivi: result.trackingNumber,
 *     livreurNom: result.data.livreurNom,
 *     livreurTelephone: result.data.livreurTelephone,
 *     infosLivraison: formData,
 *     articles: articles,
 *     totalGeneral: result.data.totalGeneral,
 *     type: deliveryType
 *   });
 * }
 * 
 * @param {Object} deliveryData - Données de la livraison
 * @param {string} deliveryData.id - ID du document Firestore (REQUIS)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export const sendWhatsAppNotification = async (deliveryData) => {
  try {
    // ✅ Validation: L'ID Firestore est requis pour générer le lien de suivi
    if (!deliveryData.id) {
      throw new Error("L'ID de la livraison (Firestore document ID) est requis pour envoyer la notification");
    }
    
    // ✅ Construction de la destination selon le type de livraison
    const destination = deliveryData.type === 'course' 
      ? `Quartier: ${deliveryData.infosLivraison.quartier || 'Non spécifié'}`
      : `Ville: ${deliveryData.infosLivraison.villeDestination || 'Non spécifiée'}\nClient: ${deliveryData.infosLivraison.nomClient || 'Non spécifié'}`;
    
    // ✅ Formatage des articles pour le message
    const articlesFormates = deliveryData.articles?.map(article => ({
      nom: article.nom,
      quantite: article.quantiteCommandee || article.quantite,
      prix: article.coutUnitaire || article.cout
    })) || [];

    const payload = {
      numeroClient: deliveryData.infosLivraison.numeroDestinataire || 
                    deliveryData.infosLivraison.contactClient,
      nomLivreur: deliveryData.livreurNom,
      numeroLivreur: deliveryData.livreurTelephone || "Voir l'application",
      lienSuivi: `https://client-global-express.web.app/?id=${deliveryData.id}`,
      // ✅ Nouvelles données
      destination: destination,
      articles: articlesFormates,
      montantTotal: deliveryData.totalGeneral || 0
    };
    
    console.log("📡 Envoi vers serveur WhatsApp:", payload);
    console.log("🔗 Lien de suivi généré:", payload.lienSuivi);
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/send-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    // ✅ Gestion d'erreur HTTP
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    
    console.log("✅ Réponse serveur WhatsApp:", result);
    return result;
    
  } catch (error) {
    console.error("❌ Erreur sendWhatsAppNotification:", error);
    return { 
      success: false, 
      error: error.message || "Serveur non joignable" 
    };
  }
};

/**
 * ✅ AMÉLIORATION: Récupère les livreurs actifs avec leur numéro de téléphone
 * @returns {Promise<Array>} Liste des livreurs actifs
 */
export const fetchActiveLivreurs = async () => {
  try {
    const q = query(collection(db, "livreurs"), where("statut", "==", "actif"));
    const querySnapshot = await getDocs(q);
    
    const livreurs = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      livreurs.push({
        id: doc.id, // L'ID du document (ex: LIV-170...)
        nom: data.nom,
        telephone: data.telephone || data.contact || data.phone || "Non renseigné" // ✅ Récupération du téléphone
      });
    });
    
    console.log(`✅ ${livreurs.length} livreur(s) actif(s) récupéré(s)`);
    return livreurs;
    
  } catch (error) {
    console.error("❌ Erreur récupération livreurs:", error);
    return []; // Retourne une liste vide en cas d'erreur
  }
};

/**
 * ✅ AMÉLIORATION: Fonction pour créer une livraison dans Firestore
 * Inclut maintenant le téléphone du livreur et meilleure gestion d'erreurs
 * 
 * @param {Object} formData - Données du formulaire
 * @param {Array} articles - Liste des articles
 * @param {string} deliveryType - Type de livraison ('course' ou 'expedition')
 * @returns {Promise<Object>} Résultat de la création
 */
export const createDeliveryInFirebase = async (formData, articles, deliveryType) => {
  try {
    // ✅ Validation des données avant création
    if (!formData.livreurId || !formData.livreurNom) {
      throw new Error("Livreur non sélectionné");
    }
    
    if (!articles || articles.length === 0) {
      throw new Error("Aucun article ajouté");
    }
    
    if (articles.some(a => !a.nom || !a.quantite || !a.cout)) {
      throw new Error("Certains articles ont des données manquantes");
    }
    
    // Calculs financiers
    const totalArticles = articles.reduce((sum, item) => {
      return sum + (parseFloat(item.quantite) * parseFloat(item.cout));
    }, 0);

    const coutPrestation = deliveryType === 'course' 
      ? parseFloat(formData.coutLivraison) 
      : parseFloat(formData.coutExpedition);
      
    // ✅ Validation du coût de prestation
    if (isNaN(coutPrestation) || coutPrestation < 0) {
      throw new Error("Coût de livraison/expédition invalide");
    }

    const totalGeneral = totalArticles + coutPrestation;

    // Formatage des articles
    const formattedArticles = articles.map((article, index) => ({
      id: index + 1,
      nom: article.nom.trim(),
      coutUnitaire: parseFloat(article.cout),
      quantiteCommandee: parseInt(article.quantite, 10),
      quantiteLivree: 0,
      quantiteRejetee: 0,
      motifRejet: null,
      totalLignePrevu: parseInt(article.quantite, 10) * parseFloat(article.cout)
    }));

    // ✅ Génération d'un numéro de suivi unique et lisible
    const trackingNumber = `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const currentDate = new Date().toISOString();

    // Construction de l'objet livraison
    const livraisonData = {
      numeroSuivi: trackingNumber,
      type: deliveryType,
      statut: 'en_attente', 
      
      // ✅ AMÉLIORATION: Inclut toutes les infos du livreur
      livreurId: formData.livreurId,
      livreurNom: formData.livreurNom,
      livreurTelephone: formData.livreurTelephone || "Non renseigné", // ✅ Téléphone du livreur
      
      adminIdValidation: null,
      dateCreation: currentDate,
      createdAt: serverTimestamp(),
      dateValidation: null,
      
      // Informations financières
      devise: 'FCFA',
      coutPrestation: coutPrestation,
      totalArticles: totalArticles,
      totalGeneral: totalGeneral,
      estPaye: false,
      
      // Articles
      articles: formattedArticles,
      
      // ✅ Informations de livraison selon le type
      infosLivraison: deliveryType === 'course' ? {
        type: 'course',
        quartier: formData.quartier.trim(),
        numeroDestinataire: formData.numeroDestinataire.trim(),
      } : {
        type: 'expedition',
        villeDestination: formData.villeDestination.trim(),
        nomClient: formData.nomClient.trim(),
        contactClient: formData.contactClient.trim(),
      },
      
      // ✅ Métadonnées supplémentaires
      metadata: {
        createdBy: 'admin', // Vous pouvez ajouter l'ID de l'admin connecté ici
        platform: 'web',
        version: '1.0.0',
        userAgent: navigator.userAgent
      }
    };

    console.log("📝 Création de la livraison:", {
      trackingNumber,
      type: deliveryType,
      livreur: formData.livreurNom,
      totalGeneral
    });

    // ✅ Création du document dans Firestore
    const docRef = await addDoc(collection(db, "livraisons"), livraisonData);
    
    console.log("✅ Livraison créée avec l'ID:", docRef.id);
    
    return {
      success: true,
      id: docRef.id,
      trackingNumber: trackingNumber,
      message: "Livraison enregistrée avec succès",
      data: {
        livreurNom: formData.livreurNom,
        livreurTelephone: formData.livreurTelephone,
        totalGeneral,
        articlesCount: articles.length
      }
    };

  } catch (error) {
    console.error("❌ Erreur lors de la création de la livraison:", error);
    
    // ✅ Gestion d'erreurs plus détaillée
    let errorMessage = "Impossible de créer la livraison";
    
    if (error.code === 'permission-denied') {
      errorMessage = "Permissions insuffisantes pour créer une livraison";
    } else if (error.code === 'unavailable') {
      errorMessage = "Service Firebase temporairement indisponible";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * ✅ NOUVELLE FONCTION: Vérifie l'état de la connexion WhatsApp
 * @returns {Promise<Object>} Statut de la connexion
 */
export const checkWhatsAppStatus = async () => {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/status`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Erreur vérification statut WhatsApp:", error);
    return { connected: false, error: error.message };
  }
};

/**
 * ✅ NOUVELLE FONCTION: Récupère les statistiques du serveur WhatsApp
 * @returns {Promise<Object>} Statistiques
 */
export const getWhatsAppStats = async () => {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/stats`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Erreur récupération stats WhatsApp:", error);
    return null;
  }
};

/**
 * ✅ FONCTION UTILITAIRE: Valide un numéro de téléphone camerounais
 * @param {string} phoneNumber - Numéro à valider
 * @returns {boolean} True si valide
 */
export const validateCameroonianPhone = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  // Format: +237 6XX XXX XXX ou 6XX XXX XXX
  return /^(?:\+?237)?[6][0-9]{8}$/.test(cleaned);
};

/**
 * ✅ FONCTION UTILITAIRE: Formate un numéro pour l'affichage
 * @param {string} phoneNumber - Numéro à formater
 * @returns {string} Numéro formaté
 */
export const formatPhoneDisplay = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('237')) {
    const number = cleaned.substring(3);
    return `+237 ${number.substring(0, 1)} ${number.substring(1, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
  }
  
  if (cleaned.length === 9 && cleaned.startsWith('6')) {
    return `+237 ${cleaned.substring(0, 1)} ${cleaned.substring(1, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  return phoneNumber;
};