// src/services/authService.js

import { db } from './firebase'; // Assurez-vous que votre fichier de config firebase est bien ici
import { collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

const SUPER_ADMIN_COLLECTION = 'super_admins';

/**
 * Vérifie les identifiants du super admin dans Firestore.
 * @param {string} phone - Le numéro de téléphone saisi.
 * @param {string} password - Le mot de passe en clair saisi.
 * @returns {Promise<string>} - Retourne un token de session en cas de succès.
 * @throws {Error} - Lance une erreur si les identifiants sont incorrects ou si l'utilisateur n'est pas trouvé.
 */
export const loginSuperAdmin = async (phone, password) => {
  if (!phone || !password) {
    throw new Error('Le numéro de téléphone et le mot de passe sont requis.');
  }

  // 1. Récupérer l'administrateur par son numéro de téléphone
  const q = query(collection(db, SUPER_ADMIN_COLLECTION), where("phone", "==", phone));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Identifiants incorrects.');
  }

  // Normalement, il ne devrait y avoir qu'un seul résultat
  const adminDoc = querySnapshot.docs[0];
  const adminData = adminDoc.data();

  // 2. Comparer le mot de passe haché
  const isPasswordMatch = await bcrypt.compare(password, adminData.passwordHash);

  if (!isPasswordMatch) {
    throw new Error('Identifiants incorrects.');
  }

  // 3. Créer un "token" de session simple et le sauvegarder en local
  const sessionToken = `super-admin-session-${new Date().getTime()}`;
  const adminInfo = {
    uid: adminDoc.id,
    phone: adminData.phone,
    name: adminData.name,
    token: sessionToken,
  };
  
  // La sauvegarde se fait côté composant après une connexion réussie
  return adminInfo;
};

/**
 * Sauvegarde les informations de session dans le localStorage.
 * @param {object} adminInfo - Les informations de l'admin à sauvegarder.
 */
export const saveSession = (adminInfo) => {
  try {
    localStorage.setItem('superAdminSession', JSON.stringify(adminInfo));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la session en local:", error);
  }
};


/**
 * Déconnecte l'utilisateur en supprimant les informations du localStorage.
 */
export const logoutSuperAdmin = () => {
  try {
    localStorage.removeItem('superAdminSession');
  } catch (error) {
    console.error("Erreur lors de la suppression de la session en local:", error);
  }
};