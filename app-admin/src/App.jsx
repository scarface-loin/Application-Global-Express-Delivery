import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// --- IMPORTS DES PAGES ---
import LoginPage from './components/pages/LoginPage';
import Dashboard from './components/common/Dashboard'; // Vérifiez que le chemin est bon
import DeliveriesPage from './components/pages/DeliveriesPage';
import ValidationPage from './components/pages/ValidationPage';
import CreateDeliveryPage from './components/pages/CreateDeliveryPage';
import ProfilePage from './components/pages/ProfilePage';
import HistoryPage from './components/pages/HistoryPage';

// --- IMPORTS À DÉCOMMENTER QUAND VOUS AUREZ LES FICHIERS ---
// import CreateLivreurForm from './components/pages/CreateLivreurForm';
// import DailySummaryPage from './components/pages/DailySummaryPage';
// import DeliveryMenPage from './components/pages/DeliveryMenPage';
// import GarageValidationPage from './components/pages/GarageValidationPage';

import AdminNotificationBadge from './components/common/AdminNotificationBadge';

const AppContent = () => {
  const { token, login, logout } = useAuth(); 
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const handleNavigate = (page, data) => {
    setCurrentPage(page);
    if (page === 'assign-delivery') {
      setSelectedDelivery(data);
    } else {
      setSelectedDelivery(null);
    }
  };

  // --- LOGIQUE DE ROUTING ---
  // Si pas de token, on affiche UNIQUEMENT la page de login
  if (!token) {
    return <LoginPage onLogin={login} />;
  }

  // Fonction pour rendre la page active
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        // C'EST ICI LA CLÉ : On passe setCurrentPage au Dashboard
        return <Dashboard setCurrentPage={setCurrentPage} />;
      
      case 'deliveries':
        return <DeliveriesPage onNavigate={handleNavigate} />;
      
      case 'create-delivery':
        return <CreateDeliveryPage />;
        
      case 'validation':
        return <ValidationPage />;
      
      case 'history':
        return <HistoryPage />;
      
      case 'profile':
        return <ProfilePage />;

      // --- PAGES LIÉES AUX ACTIONS RAPIDES ET SIDEBAR ---
      // Remplacez les <div> par vos composants réels (ex: <CreateLivreurForm />)
      
      case 'CreateLivreurForm':
        return <div className="p-10 text-center">Composant Recruter Livreur (À importer)</div>; // <CreateLivreurForm />
      
      case 'daily-summary':
        return <div className="p-10 text-center">Composant Récapitulatif jour (À importer)</div>; // <DailySummaryPage />

      case 'deliverymen':
        return <div className="p-10 text-center">Composant Équipe Livreurs (À importer)</div>; // <DeliveryMenPage />

      case 'GarageValidationPage':
         return <div className="p-10 text-center">Composant Garage (À importer)</div>;

      case 'admin-assign-delivery':
         return <div className="p-10 text-center">Composant Attribution (À importer)</div>;

      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  // Titres dynamiques pour le Header
  const pageTitles = {
    'dashboard': 'Tableau de bord',
    'deliveries': 'Course du jour',
    'validation': 'Validation des Livraisons',
    'history': 'Historique global',
    'create-delivery': 'Créer une Livraison',
    'profile': 'Mon Profil',
    'CreateLivreurForm': 'Recruter un Livreur',
    'daily-summary': 'Récapitulatif de la journée',
    'deliverymen': 'Gestion des Livreurs',
    'GarageValidationPage': 'Garage & Entretien',
    'admin-assign-delivery': 'Attribution des Livraisons'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      
      <div className={`lg:ml-64 transition-all duration-300 ${sidebarOpen ? 'ml-64' : ''}`}>
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitles[currentPage] || 'Admin Livraisons'}
          additionalElements={
            <div className="flex items-center space-x-4">
              <AdminNotificationBadge />
            </div>
          }
        />
        
        <main className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;