import { db } from '../../../services/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

/**
 * Récupère la liste des livreurs actifs pour le menu déroulant
 */
export const fetchActiveLivreurs = async () => {
  try {
    // On ne veut que les livreurs qui sont marqués comme 'actif'
    const q = query(collection(db, "livreurs"), where("statut", "==", "actif"));
    const querySnapshot = await getDocs(q);
    
    const livreurs = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      livreurs.push({
        id: doc.id, // L'ID du document (ex: LIV-170...)
        nom: data.nom
      });
    });
    
    return livreurs;
  } catch (error) {
    console.error("Erreur récupération livreurs:", error);
    return []; // Retourne une liste vide en cas d'erreur
  }
};

/**
 * Fonction pour créer une livraison dans Firestore
 * (Mise à jour pour inclure le nom du livreur)
 */
export const createDeliveryInFirebase = async (formData, articles, deliveryType) => {
  try {
    // ... (Le début du code reste identique : Calculs financiers, formattedArticles, etc.)
    const totalArticles = articles.reduce((sum, item) => {
      return sum + (parseFloat(item.quantite) * parseFloat(item.cout));
    }, 0);

    const coutPrestation = deliveryType === 'course' 
      ? parseFloat(formData.coutLivraison) 
      : parseFloat(formData.coutExpedition);

    const totalGeneral = totalArticles + coutPrestation;

    const formattedArticles = articles.map((article, index) => ({
      id: index + 1,
      nom: article.nom,
      coutUnitaire: parseFloat(article.cout),
      quantiteCommandee: parseInt(article.quantite, 10),
      quantiteLivree: 0,
      quantiteRejetee: 0,
      motifRejet: null,
      totalLignePrevu: parseInt(article.quantite, 10) * parseFloat(article.cout)
    }));

    const trackingNumber = `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Construction de l'objet
    const livraisonData = {
      numeroSuivi: trackingNumber,
      type: deliveryType,
      statut: 'en_attente', 
      
      // --- MODIFICATION ICI ---
      livreurId: formData.livreurId, // L'ID technique
      livreurNom: formData.livreurNom, // Le nom pour affichage facile
      // ------------------------

      adminIdValidation: null,
      dateCreation: new Date().toISOString(),
      createdAt: serverTimestamp(),
      dateValidation: null,
      devise: 'FCFA',
      coutPrestation: coutPrestation,
      totalArticles: totalArticles,
      totalGeneral: totalGeneral,
      estPaye: false,
      articles: formattedArticles,
      infosLivraison: deliveryType === 'course' ? {
        quartier: formData.quartier,
        numeroDestinataire: formData.numeroDestinataire,
      } : {
        villeDestination: formData.villeDestination,
        nomClient: formData.nomClient,
        contactClient: formData.contactClient,
      }
    };

    const docRef = await addDoc(collection(db, "livraisons"), livraisonData);
    
    return {
      success: true,
      id: docRef.id,
      trackingNumber: trackingNumber,
      message: "Livraison enregistrée avec succès"
    };

  } catch (error) {
    console.error("Erreur lors de la création: ", error);
    throw new Error("Impossible de créer la livraison : " + error.message);
  }
};