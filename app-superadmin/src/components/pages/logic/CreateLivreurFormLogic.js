import { db, storage } from '../../../services/firebase'; // Adapte le chemin selon ta structure
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Fonction utilitaire pour uploader un fichier unique
 */
const uploadFileToStorage = async (file, folderName, fileName) => {
  if (!file) return null;
  
  // Création de la référence : livreurs/ID_LIVREUR/documents/nom_fichier
  const storageRef = ref(storage, `${folderName}/${fileName}`);
  
  // Upload
  const snapshot = await uploadBytes(storageRef, file);
  
  // Récupération de l'URL publique
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

/**
 * Fonction principale pour créer le livreur
 * @param {Object} formData - Les données du formulaire (nom, numero, fichiers...)
 */
export const createLivreurInFirebase = async (formData) => {
  try {
    // 1. Générer un ID unique pour le livreur
    // On utilise un timestamp pour avoir un ID lisible ex: LIV-170654890
    const livreurId = `LIV-${Date.now()}`;

    // 2. Préparer les chemins pour le stockage
    const storagePath = `livreurs/${livreurId}/documents`;

    // 3. Uploader les fichiers en parallèle (plus rapide)
    // On lance les 3 uploads en même temps
    const uploadPromises = [
      uploadFileToStorage(formData.permis, storagePath, 'permis'),
      uploadFileToStorage(formData.cni, storagePath, 'cni'),
      uploadFileToStorage(formData.contratTravail, storagePath, 'contrat')
    ];

    const [permisUrl, cniUrl, contratUrl] = await Promise.all(uploadPromises);

    // 4. Hasher le mot de passe par défaut "123456"
    // Note: Idéalement, fais ça côté backend. Ici c'est une simulation simple.
    // Pour une vraie sécu, utilise une librairie comme bcryptjs ou Firebase Auth.
    const defaultPasswordHash = "$2a$12$OgVFDae7w11cDMP3Og9ZhO949csJkJy9PHDSwtQx.pRzClvxmX/YC"; 

    // 5. Construire l'objet Livreur (Structure V2 avec Dette et Sécurité)
    const newLivreur = {
      id: livreurId,
      nom: formData.nom,
      telephone: formData.numero.replace(/\s/g, ''), // Nettoyage du numéro
      photoUrl: "", // Tu pourras ajouter un upload de photo de profil plus tard
      
      // --- SÉCURITÉ ---
      motDePasseHash: defaultPasswordHash,
      isFirstLogin: true, // ⚠️ FORCE LE CHANGEMENT DE MOT DE PASSE

      // --- FINANCE & DETTES ---
      finance: {
        detteActuelle: 0,        // Commence à 0
        plafondDette: 50000,     // Bloquer si > 50.000 FCFA
        totalManquants: 0,       // Argent perdu déclaré
        salaireBase: 50000,      // Config par défaut
        primeParLivraison: 250   // Config par défaut
      },

      // --- DOCUMENTS ---
      documents: {
        permisUrl: permisUrl || null,
        cniUrl: cniUrl || null,
        contratUrl: contratUrl || null
      },

      // --- ÉTAT ---
      statut: "actif",       // actif, suspendu, bloque_finance
      disponible: true,      // prêt à recevoir des courses
      positionActuelle: null, // Sera mis à jour par le GPS du livreur

      // --- METADATA ---
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // 6. Sauvegarder dans Firestore
    // On utilise setDoc avec l'ID spécifique qu'on a généré
    await setDoc(doc(db, "livreurs", livreurId), newLivreur);

    console.log("Livreur créé avec succès :", livreurId);
    
    return { 
      success: true, 
      message: "Livreur créé avec succès",
      id: livreurId 
    };

  } catch (error) {
    console.error("Erreur lors de la création du livreur:", error);
    throw new Error("Impossible de créer le livreur : " + error.message);
  }
};