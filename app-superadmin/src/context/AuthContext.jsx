// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';

// Création du Contexte
const AuthContext = createContext(null);

// Le Provider du contexte
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Pour gérer le chargement initial

  // Au chargement de l'app, on vérifie si une session existe dans le localStorage
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('superAdminSession');
      if (savedSession) {
        setCurrentUser(JSON.parse(savedSession));
      }
    } catch (error) {
      console.error("Erreur lors de la lecture de la session depuis le localStorage", error);
    } finally {
      setLoading(false); // Fin du chargement
    }
  }, []);

  // Fonction de connexion (appelée par LoginPage)
  const login = (userData) => {
    try {
      localStorage.setItem('superAdminSession', JSON.stringify(userData));
      setCurrentUser(userData);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la session", error);
    }
  };

  // --- C'EST LA FONCTION QUI NOUS INTÉRESSE ---
  // Fonction de déconnexion
  const logout = () => {
    try {
      localStorage.removeItem('superAdminSession'); // Nettoyage du localStorage
      setCurrentUser(null); // Mise à jour de l'état global
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser, // Un booléen pratique pour savoir si l'utilisateur est connecté
  };

  // On ne rend les enfants que lorsque le chargement initial est terminé
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser facilement le contexte
export const useAuth = () => {
  return useContext(AuthContext);
};