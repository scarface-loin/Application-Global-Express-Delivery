import { db } from '../../../services/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Crée un nouveau partenaire dans la base de données
 * @param {Object} formData - Les données du formulaire (nom, numero, type)
 */
export const createPartner = async (formData) => {
  try {
    // 1. Nettoyage du numéro de téléphone (enlève les espaces)
    const cleanPhone = formData.numero.replace(/\s/g, '');

    // 2. Vérification si le numéro existe déjà
    const q = query(
      collection(db, "partenaires"),
      where("telephone", "==", cleanPhone)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error("Ce numéro de téléphone est déjà associé à un partenaire.");
    }

    // 3. Préparation de l'objet partenaire
    const partnerData = {
      nom: formData.nom.trim(),
      telephone: cleanPhone,
      type: formData.type,
      statut: 'actif', // Actif par défaut
      motDePasseHash: '123456', // Mot de passe par défaut pour la première connexion
      isFirstLogin: true,
      stats: {
        totalCommandes: 0,
        totalLivre: 0,
        chiffreAffaires: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // 4. Enregistrement dans Firestore
    const docRef = await addDoc(collection(db, "partenaires"), partnerData);

    return {
      success: true,
      id: docRef.id,
      message: "Partenaire créé avec succès"
    };

  } catch (error) {
    console.error("Erreur lors de la création du partenaire:", error);
    // On renvoie l'erreur pour l'afficher dans l'UI
    throw error;
  }
};