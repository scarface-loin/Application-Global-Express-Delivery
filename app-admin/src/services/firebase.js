// src/services/firebase.js

// Import des fonctions nécessaires depuis les SDKs Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Utile si vous ajoutez d'autres types d'authentification plus tard
import { getStorage } from "firebase/storage"; // Si vous prévoyez de gérer des fichiers (images, etc.)

// Votre configuration Firebase personnelle
// ATTENTION : Ne partagez jamais vos clés secrètes si vous utilisiez le SDK Admin (Node.js).
// Celles-ci sont conçues pour être publiques pour le web, mais la sécurité se gère via les "Security Rules".
const firebaseConfig = {
  apiKey: "AIzaSyC7RzSb3xgGlK2iUrcsvMUNEoQW9psco6o",
  authDomain: "app-global-express-delivery.firebaseapp.com",
  databaseURL: "https://app-global-express-delivery-default-rtdb.firebaseio.com",
  projectId: "app-global-express-delivery",
  storageBucket: "app-global-express-delivery.firebasestorage.app",
  messagingSenderId: "349572887102",
  appId: "1:349572887102:web:c80d0a700fdcc9e079576f",
  measurementId: "G-Q7VD7D211M"
};

// 1. Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);

// 2. Initialisation des services que vous allez utiliser
// On exporte directement les instances des services pour les importer facilement ailleurs.
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Vous n'avez généralement pas besoin d'exporter 'app' directement,
// mais plutôt les services initialisés comme 'db', 'auth', etc.