import React, { useState, useEffect } from 'react';
import LivreurLoginPage from './LivreurLoginPage';
import LivreurApp from './LivreurApp';
import ProfilePage from './ProfilePage'; // Nous aurons besoin de ProfilePage ici aussi

/**
 * Composant principal qui gère l'authentification des livreurs
 * et affiche soit la page de login, soit l'application
 */
export default function LivreurRoot() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false); // NOUVEL ÉTAT

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
        // Restaurer également l'état needsPasswordChange s'il a été sauvegardé
        setNeedsPasswordChange(userData.isFirstLogin || false); // Utiliser isFirstLogin des données sauvegardées
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'auth:', error);
      localStorage.removeItem('livreur_auth');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setNeedsPasswordChange(userData.isFirstLogin); // Définir en fonction du résultat de la connexion
    // Stocker needsPasswordChange dans localStorage également
    localStorage.setItem('livreur_auth', JSON.stringify({ ...userData, isFirstLogin: userData.isFirstLogin }));
  };

  const handleLogout = () => {
    localStorage.removeItem('livreur_auth');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setNeedsPasswordChange(false); // Réinitialiser à la déconnexion
  };

  // Callback appelé lorsque le mot de passe est changé avec succès
  const handlePasswordChanged = () => {
    setNeedsPasswordChange(false);
    // Mettre à jour currentUser et localStorage pour refléter isFirstLogin: false
    if (currentUser) {
      const updatedUser = { ...currentUser, isFirstLogin: false };
      setCurrentUser(updatedUser);
      localStorage.setItem('livreur_auth', JSON.stringify(updatedUser));
    }
  };

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

  if (!isAuthenticated || !currentUser) {
    return <LivreurLoginPage onLogin={handleLogin} />;
  }

  // Si authentifié mais a besoin de changer le mot de passe, afficher ProfilePage de force
  if (needsPasswordChange) {
    return (
      <ProfilePage 
        livreurId={currentUser.id}
        onLogout={handleLogout}
        onPasswordChanged={handlePasswordChanged} // Passer le callback
        forcePasswordChange={true} // Nouvelle prop pour indiquer un changement obligatoire
      />
    );
  }

  // Si authentifié et mot de passe changé, afficher LivreurApp
  return (
    <div>
      <LivreurApp 
        livreurId={currentUser.id}
        onLogout={handleLogout}
      />
    </div>
  );
}