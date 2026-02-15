import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

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

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);