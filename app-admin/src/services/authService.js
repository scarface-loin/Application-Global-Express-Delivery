import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

/**
 * Connexion d'un super admin
 * @param {string} phone - Numéro de téléphone
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Informations de l'admin connecté
 */
export const loginSuperAdmin = async (phone, password) => {
  try {
    // Nettoyage du numéro de téléphone (enlever les espaces)
    const cleanPhone = phone.replace(/\s/g, '');

    // Requête pour trouver l'admin par téléphone
    const q = query(
      collection(db, "admins"),
      where("telephone", "==", cleanPhone)
    );

    const querySnapshot = await getDocs(q);

    // Vérification si l'admin existe
    if (querySnapshot.empty) {
      throw new Error("Numéro de téléphone incorrect");
    }

    const adminDoc = querySnapshot.docs[0];
    const adminData = adminDoc.data();

    // Vérification du mot de passe
    // IMPORTANT: En production, utilisez bcrypt ou un système de hashage sécurisé
    if (adminData.motDePasse !== password) {
      throw new Error("Mot de passe incorrect");
    }

    // Vérification du statut
    if (adminData.statut !== 'actif') {
      throw new Error("Compte désactivé. Contactez l'administrateur.");
    }

    // Génération d'un token (simple pour l'exemple, utilisez JWT en production)
    const token = `TOKEN_${adminDoc.id}_${Date.now()}`;

    // Retour des informations
    return {
      uid: adminDoc.id,
      token: token,
      nom: adminData.nom || 'Admin',
      telephone: adminData.telephone,
      role: adminData.role || 'admin',
      mustChangePassword: adminData.mustChangePassword || false,
      dateCreation: adminData.dateCreation
    };

  } catch (error) {
    console.error("Erreur loginSuperAdmin:", error);
    throw error;
  }
};

/**
 * Sauvegarde la session dans le localStorage
 * @param {Object} adminInfo - Informations de l'admin
 */
export const saveSession = (adminInfo) => {
  try {
    localStorage.setItem('auth_token', adminInfo.token);
    localStorage.setItem('admin_id', adminInfo.uid);
    localStorage.setItem('admin_info', JSON.stringify({
      uid: adminInfo.uid,
      nom: adminInfo.nom,
      telephone: adminInfo.telephone,
      role: adminInfo.role
    }));
  } catch (error) {
    console.error("Erreur saveSession:", error);
  }
};

/**
 * Met à jour le mot de passe lors de la première connexion
 * @param {string} uid - ID de l'admin
 * @param {string} newPassword - Nouveau mot de passe
 */
export const updateFirstLoginPassword = async (uid, newPassword) => {
  try {
    const adminRef = doc(db, "admins", uid);
    
    await updateDoc(adminRef, {
      motDePasse: newPassword,
      mustChangePassword: false,
      dateChangementMotDePasse: new Date().toISOString()
    });

    return { success: true };

  } catch (error) {
    console.error("Erreur updateFirstLoginPassword:", error);
    throw new Error("Impossible de mettre à jour le mot de passe");
  }
};

/**
 * Déconnexion
 */
export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('admin_id');
  localStorage.removeItem('admin_info');
};

/**
 * Vérifie si une session est active
 * @returns {boolean}
 */
export const isSessionActive = () => {
  const token = localStorage.getItem('auth_token');
  const adminId = localStorage.getItem('admin_id');
  return !!(token && adminId);
};

/**
 * Récupère les informations de l'admin connecté
 * @returns {Object|null}
 */
export const getCurrentAdmin = () => {
  try {
    const adminInfo = localStorage.getItem('admin_info');
    return adminInfo ? JSON.parse(adminInfo) : null;
  } catch (error) {
    console.error("Erreur getCurrentAdmin:", error);
    return null;
  }
};