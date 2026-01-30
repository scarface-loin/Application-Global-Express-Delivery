import React, { useState, useEffect } from 'react';
import LivreurLoginPage from './LivreurLoginPage';
import LivreurApp from './LivreurApp';

/**
 * Composant principal qui gère l'authentification des livreurs
 * et affiche soit la page de login, soit l'application
 */
export default function LivreurRoot() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const savedAuth = localStorage.getItem('livreur_auth');
      if (savedAuth) {
        const userData = JSON.parse(savedAuth);
        setCurrentUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'auth:', error);
      // En cas d'erreur, on nettoie le localStorage
      localStorage.removeItem('livreur_auth');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('livreur_auth');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Écran de chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si non authentifié, afficher la page de login
  if (!isAuthenticated || !currentUser) {
    return <LivreurLoginPage onLogin={handleLogin} />;
  }

  // Si authentifié, afficher l'application avec le livreurId
  return (
    <div>
      {/* Bouton de déconnexion (optionnel - peut être dans un menu) */}
      <LivreurApp 
        livreurId={currentUser.id}
        onLogout={handleLogout}
      />
    </div>
  );
}