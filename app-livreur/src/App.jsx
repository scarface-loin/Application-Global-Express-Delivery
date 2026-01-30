import React from 'react';
import { LivreurAuthProvider, useLivreurAuth } from './context/LivreurAuthContext';
import LivreurLoginPage from './pages/LivreurLoginPage';
// Nous allons créer LivreurHomePage à la prochaine étape, mais on l'importe déjà.
// import LivreurHomePage from './pages/LivreurHomePage'; 

// Un simple composant pour le chargement initial
const InitialLoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="mt-4 text-gray-600">Vérification...</p>
  </div>
);

// Ce composant interne gère la logique d'affichage
function AppRouter() {
  const { currentLivreur, loading } = useLivreurAuth();

  // 1. Affiche l'écran de chargement pendant que le contexte vérifie le localStorage
  if (loading) {
    return <InitialLoadingScreen />;
  }

  // 2. Affiche la page principale si le livreur est connecté, sinon la page de connexion
  // Pour l'instant, on met un placeholder pour LivreurHomePage
  return currentLivreur ? <div className="p-4">Bienvenue, {currentLivreur.nom}!</div> : <LivreurLoginPage />;
  // return currentLivreur ? <LivreurHomePage /> : <LivreurLoginPage />;
}

// Le composant App principal qui enveloppe tout
export default function App() {
  return (
    <LivreurAuthProvider>
      <AppRouter />
    </LivreurAuthProvider>
  );
}