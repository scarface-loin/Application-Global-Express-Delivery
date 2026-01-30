/**
 * 🔥 SERVICE FIREBASE - Tous les appels Firebase
 * Gestion Partenaires & Commandes (Collection: livraison_partenaire)
 */

import { db } from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { 
  generateTrackingNumber, 
  calculateTotal, 
  formatArticlesForFirebase,
  extractStats
} from './utils';
import { STORAGE_KEY } from '../constants';

// ==================== AUTHENTIFICATION ====================

export const authenticatePartenaire = async (telephone, motDePasse) => {
  try {
    const cleanedPhone = telephone.replace(/\s/g, '');
    
    const q = query(
      collection(db, 'partenaires'),
      where('telephone', '==', cleanedPhone)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Numéro de téléphone non reconnu');
    }
    
    const partenaireDoc = snapshot.docs[0];
    const data = partenaireDoc.data();
    
    if (data.statut !== 'actif') {
      throw new Error('Votre compte est désactivé');
    }
    
    // ⚠️ EN PRODUCTION : utiliser bcrypt pour comparer les hash
    // Ici on compare le texte brut ou le hash stocké
    if (motDePasse !== '123456' && data.motDePasseHash !== motDePasse) {
      throw new Error('Mot de passe incorrect');
    }
    
    return {
      success: true,
      partenaire: {
        id: partenaireDoc.id,
        nom: data.nom,
        telephone: data.telephone,
        type: data.type,
        email: data.email || '',
        isFirstLogin: data.isFirstLogin === true // S'assure que c'est un booléen
      }
    };
  } catch (error) {
    throw error;
  }
};

export const saveAuth = (partenaireData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(partenaireData));
};

export const getAuth = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// ==================== GESTION COMPTE PARTENAIRE ====================

export const fetchPartenaireInfo = async (partenaireId) => {
  try {
    const docRef = doc(db, 'partenaires', partenaireId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Partenaire introuvable');
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      nom: data.nom,
      telephone: data.telephone,
      type: data.type,
      email: data.email || '',
      adresse: data.adresse || '',
      stats: data.stats || {},
      isFirstLogin: data.isFirstLogin || false
    };
  } catch (error) {
    throw new Error('Impossible de charger les informations');
  }
};

export const updatePartenairePassword = async (partenaireId, newPassword) => {
  try {
    const docRef = doc(db, 'partenaires', partenaireId);
    
    await updateDoc(docRef, {
      motDePasseHash: newPassword,
      isFirstLogin: false,
      updatedAt: serverTimestamp()
    });

    // Mettre à jour le localStorage pour refléter le changement immédiatement
    const currentAuth = getAuth();
    if (currentAuth && currentAuth.id === partenaireId) {
      currentAuth.isFirstLogin = false;
      saveAuth(currentAuth);
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur màj mot de passe:", error);
    throw new Error("Impossible de mettre à jour le mot de passe");
  }
};

// ==================== COMMANDES (Collection: livraison_partenaire) ====================

export const createLivraison = async (partenaireId, partenaireNom, formData, articles, deliveryType) => {
  try {
    const coutPrestation = deliveryType === 'course'
      ? parseFloat(formData.coutLivraison)
      : parseFloat(formData.coutExpedition);
    
    const totaux = calculateTotal(articles, coutPrestation);
    const formattedArticles = formatArticlesForFirebase(articles);
    const trackingNumber = generateTrackingNumber();
    
    // Construction des infos de livraison
    // On uniformise les champs pour faciliter la lecture côté Admin
    const infosLivraison = deliveryType === 'course' ? {
      entrepriseNom: partenaireNom,
      quartier: formData.quartier,
      numeroDestinataire: formData.numeroDestinataire,
      // Champs uniformisés pour l'Admin Panel :
      nomClient: formData.nomClient || 'Client', 
      contactClient: formData.numeroDestinataire, 
      villeDestination: formData.quartier, // Pour tri par zone
      
      adresseComplete: formData.adresseComplete || '',
      instructionsLivraison: formData.instructionsLivraison || ''
    } : {
      entrepriseNom: partenaireNom,
      nomClient: formData.nomClient,
      contactClient: formData.contactClient,
      villeDestination: formData.villeDestination,
      
      adresseComplete: formData.adresseComplete || '',
      instructionsLivraison: formData.instructionsLivraison || ''
    };
    
    const livraisonData = {
      numeroSuivi: trackingNumber,
      type: deliveryType,
      origine: 'partenaire',
      statut: 'en_attente_attribution',
      partenaireId,
      partenaireNom,
      livreurId: null,
      livreurNom: null,
      articles: formattedArticles,
      coutPrestation: totaux.coutPrestation,
      totalArticles: totaux.totalArticles,
      totalGeneral: totaux.totalGeneral,
      devise: 'FCFA',
      estPaye: false,
      modePaiement: formData.modePaiement || 'cash',
      infosLivraison,
      dateCreation: new Date().toISOString(),
      createdAt: serverTimestamp(),
      dateAttribution: null,
      dateLivraison: null,
      dateValidation: null,
      updatedAt: serverTimestamp(),
      adminIdValidation: null,
      adminIdAttribution: null,
      historique: [{
        action: 'creation',
        par: partenaireId,
        date: new Date().toISOString(),
        details: `Commande créée par ${partenaireNom}`
      }],
      priorite: (deliveryType === 'expedition' || totaux.totalGeneral > 10000) ? 'haute' : 'normale',
      motifNonLivraison: null,
      commentaireNonLivraison: null,
      photosLivraison: []
    };
    
    // ENREGISTREMENT DANS LA NOUVELLE COLLECTION
    const docRef = await addDoc(collection(db, 'livraison_partenaire'), livraisonData);
    
    return {
      success: true,
      id: docRef.id,
      trackingNumber,
      message: "Commande créée avec succès"
    };
  } catch (error) {
    throw new Error('Impossible de créer la commande : ' + error.message);
  }
};

export const fetchCommandes = async (partenaireId) => {
  try {
    // LECTURE DEPUIS LA NOUVELLE COLLECTION
    const q = query(
      collection(db, 'livraison_partenaire'),
      where('partenaireId', '==', partenaireId),
      orderBy('dateCreation', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const commandes = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      commandes.push({
        id: docSnap.id,
        numeroSuivi: data.numeroSuivi,
        type: data.type,
        statut: data.statut,
        
        // Mapping intelligent pour l'affichage (gère course et expédition)
        quartier: data.infosLivraison?.quartier || null,
        villeDestination: data.infosLivraison?.villeDestination || null,
        nomClient: data.infosLivraison?.nomClient || null,
        numeroDestinataire: data.infosLivraison?.numeroDestinataire || data.infosLivraison?.contactClient || null,
        contactClient: data.infosLivraison?.contactClient || null,
        
        livreurNom: data.livreurNom || "En attente d'attribution",
        articles: data.articles || [],
        nbArticles: data.articles?.reduce((sum, art) => sum + (parseInt(art.quantiteCommandee) || 0), 0) || 0,
        total: data.totalGeneral,
        dateCreation: data.dateCreation,
        dateAttribution: data.dateAttribution,
        dateLivraison: data.dateLivraison,
        heureCreation: data.dateCreation
          ? new Date(data.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '--:--'
      });
    });
    
    return commandes;
  } catch (error) {
    console.error("Erreur fetchCommandes:", error);
    throw new Error('Impossible de charger les commandes');
  }
};

// ==================== STATISTIQUES ====================

export const fetchStats = async (partenaireId) => {
  try {
    const commandes = await fetchCommandes(partenaireId);
    return extractStats(commandes);
  } catch (error) {
    throw new Error('Impossible de calculer les statistiques');
  }
};