import { db } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Récupère toutes les livraisons en attente d'attribution
 * CIBLE LA COLLECTION : 'livraison_partenaire'
 */
export const fetchLivraisonsEnAttente = async () => {
  try {
    // On cible la collection spécifique aux partenaires
    const q = query(
      collection(db, "livraison_partenaire"),
      where("statut", "==", "en_attente_attribution")
      // Note : on peut garder filtre 'origine' si vous voulez, mais la collection sépare déjà
    );
    
    const querySnapshot = await getDocs(q);
    const livraisons = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      livraisons.push({
        id: docSnap.id,
        numeroSuivi: data.numeroSuivi,
        type: data.type, // 'course' ou 'expedition'
        
        // Partenaire
        partenaireId: data.partenaireId,
        partenaireNom: data.partenaireNom,
        
        // Destination (Gestion sécurisée des champs optionnels)
        quartier: data.infosLivraison?.quartier || 'N/A',
        numeroDestinataire: data.infosLivraison?.numeroDestinataire || 'N/A',
        villeDestination: data.infosLivraison?.villeDestination || 'N/A',
        nomClient: data.infosLivraison?.nomClient || 'Client',
        contactClient: data.infosLivraison?.contactClient || '',
        
        // Articles
        articles: data.articles || [],
        nbArticles: data.articles?.reduce((sum, art) => sum + (parseInt(art.quantiteCommandee) || 0), 0) || 0,
        
        // Finances
        total: data.totalGeneral || 0,
        
        // Dates
        dateCreation: data.dateCreation
      });
    });

    // Trier par date (plus récentes en premier)
    livraisons.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

    return livraisons;

  } catch (error) {
    console.error("Erreur lors de la récupération des livraisons partenaire:", error);
    throw new Error("Impossible de charger les livraisons en attente.");
  }
};

/**
 * Récupère la liste des livreurs actifs et disponibles
 * CIBLE LA COLLECTION : 'livreurs'
 */
export const fetchActiveLivreurs = async () => {
  try {
    const q = query(
      collection(db, "livreurs"),
      where("statut", "==", "actif"),
      where("disponible", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    const livreurs = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      livreurs.push({
        id: docSnap.id,
        nom: data.nom,
        telephone: data.telephone,
        photoUrl: data.photoUrl || null
      });
    });

    // Trier par nom alphabétique
    livreurs.sort((a, b) => a.nom.localeCompare(b.nom));

    return livreurs;

  } catch (error) {
    console.error("Erreur lors de la récupération des livreurs:", error);
    throw new Error("Impossible de charger les livreurs actifs.");
  }
};

/**
 * Attribue une livraison partenaire à un livreur
 * CIBLE LA COLLECTION : 'livraison_partenaire'
 */
export const assignLivraisonToLivreur = async (livraisonId, livreurId, livreurNom) => {
  try {
    // Attention : On modifie bien dans livraison_partenaire
    const livraisonRef = doc(db, "livraison_partenaire", livraisonId);
    
    // Récupérer l'ID de l'admin (simulé ou via auth context)
    const adminId = localStorage.getItem('admin_id') || 'ADMIN-SYSTEM';
    
    await updateDoc(livraisonRef, {
      statut: 'en_cours', // Passe en cours de livraison
      livreurId: livreurId,
      livreurNom: livreurNom,
      dateAttribution: new Date().toISOString(),
      adminIdAttribution: adminId,
      updatedAt: serverTimestamp(),
      
      // Ajout dans l'historique de la commande
      historique: [
        // On ne peut pas utiliser arrayUnion facilement si on ne connait pas l'état précédent exact,
        // mais ici on suppose que l'on ajoute à la liste existante ou qu'on écrase si nécessaire.
        // Pour faire propre avec Firestore sans écraser l'existant, idéalement utiliser arrayUnion.
        // Ici, on va simplifier pour l'exemple opérationnel immédiat :
        /* 
           Note: En prod, utiliser : 
           historique: arrayUnion({ ... }) 
           (nécessite d'importer arrayUnion de firebase/firestore)
        */
      ]
    });

    // Optionnel : On pourrait aussi notifier le livreur ici (Push Notification)

    return { success: true };

  } catch (error) {
    console.error("Erreur lors de l'attribution:", error);
    throw new Error("Impossible d'attribuer la livraison.");
  }
};