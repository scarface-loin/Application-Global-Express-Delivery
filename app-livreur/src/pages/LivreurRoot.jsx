import React, { useState, useEffect } from 'react';
import LivreurLoginPage from './LivreurLoginPage';
import LivreurApp from './LivreurApp';
import ProfilePage from './ProfilePage';

/**
 * Composant principal qui gère l'authentification des livreurs
 * et affiche soit la page de login, soit l'application
 */
export default function LivreurRoot() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    console.log('🔄 LivreurRoot: useEffect triggered');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    console.log('🔍 checkAuthStatus: Starting...');
    
    try {
      const savedAuth = localStorage.getItem('livreur_auth');
      console.log('📦 savedAuth from localStorage:', savedAuth);
      
      if (savedAuth) {
        const userData = JSON.parse(savedAuth);
        console.log('✅ User data parsed:', userData);
        
        setCurrentUser(userData);
        setIsAuthenticated(true);
        setNeedsPasswordChange(userData.isFirstLogin || false);
        
        console.log('✅ Auth state updated successfully');
      } else {
        console.log('⚠️ No saved auth found in localStorage');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'auth:', error);
      localStorage.removeItem('livreur_auth');
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    console.log('🔐 handleLogin called with:', userData);
    
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setNeedsPasswordChange(userData.isFirstLogin);
    
    // Stocker dans localStorage
    const authData = { ...userData, isFirstLogin: userData.isFirstLogin };
    localStorage.setItem('livreur_auth', JSON.stringify(authData));
    
    console.log('✅ Login successful, auth saved to localStorage');
  };

  const handleLogout = () => {
    console.log('🚪 handleLogout called');
    
    localStorage.removeItem('livreur_auth');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setNeedsPasswordChange(false);
    
    console.log('✅ Logout successful');
  };

  // Callback appelé lorsque le mot de passe est changé avec succès
  const handlePasswordChanged = () => {
    console.log('🔑 handlePasswordChanged called');
    
    setNeedsPasswordChange(false);
    
    // Mettre à jour currentUser et localStorage
    if (currentUser) {
      const updatedUser = { ...currentUser, isFirstLogin: false };
      setCurrentUser(updatedUser);
      localStorage.setItem('livreur_auth', JSON.stringify(updatedUser));
      
      console.log('✅ Password change recorded');
    }
  };

  // ÉCRAN DE CHARGEMENT
  if (loading) {
    console.log('⏳ Rendering loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
          <p className="text-xs text-gray-400 mt-2">Vérification de l'authentification</p>
        </div>
      </div>
    );
  }

  // PAGE DE LOGIN
  if (!isAuthenticated || !currentUser) {
    console.log('🔓 Rendering login page');
    return <LivreurLoginPage onLogin={handleLogin} />;
  }

  // CHANGEMENT DE MOT DE PASSE OBLIGATOIRE
  if (needsPasswordChange) {
    console.log('🔐 Rendering forced password change page');
    return (
      <ProfilePage 
        livreurId={currentUser.id}
        onLogout={handleLogout}
        onPasswordChanged={handlePasswordChanged}
        forcePasswordChange={true}
      />
    );
  }

  // APPLICATION PRINCIPALE
  console.log('✅ Rendering main app');
  return (
    <div>
      <LivreurApp 
        livreurId={currentUser.id}
        onLogout={handleLogout}
      />
    </div>
  );
}