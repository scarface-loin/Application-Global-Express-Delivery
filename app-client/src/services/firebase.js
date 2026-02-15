import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

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
export const database = getDatabase(app);
export const firestore = getFirestore(app);