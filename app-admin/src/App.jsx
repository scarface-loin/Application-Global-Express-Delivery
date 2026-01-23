// App.jsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Import des pages
import LoginPage from './components/pages/LoginPage';
import Dashboard from './components/common/Dashboard';
import DeliveriesPage from './components/pages/DeliveriesPage';
import DeliveryMenPage from './components/pages/DeliveryMenPage';
import CreateDeliveryPage from './components/pages/CreateDeliveryPage';
import TrackingPage from './components/pages/TrackingPage';
import ProfilePage from './components/pages/ProfilePage';
import SettlementsPage from './components/pages/SettlementsPage'; // <--- NOUVEL IMPORT
// Import
import DebtsManagementPage from './components/pages/DebtsManagementPage';

// Import des composants supplémentaires
import DeliveryManDetails from './components/pages/DeliveryManDetails';
import AssignDeliveryPage from './components/pages/AssignDeliveryPage';
import AdminNotificationBadge from './components/common/AdminNotificationBadge';

// Composant principal de l'application
const AppContent = () => {
  const { token, login } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedDeliveryForAssign, setSelectedDeliveryForAssign] = useState(null);

  // Fonction de navigation
  const handleNavigate = (page, data) => {
    setCurrentPage(page);

    // Gérer les données spécifiques selon la page
    switch (page) {
      case 'deliveryman-details':
        setSelectedDeliveryMan(data);
        break;
      case 'assign-delivery':
        setSelectedDelivery(data);
        break;
      case 'assign-delivery-quick':
        setSelectedDeliveryForAssign(data);
        setCurrentPage('assign-delivery-quick');
        break;
      default:
        // Réinitialiser les données spécifiques
        setSelectedDeliveryMan(null);
        setSelectedDelivery(null);
        setSelectedDeliveryForAssign(null);
    }
  };

  // Fonction pour revenir à la page précédente
  const handleBack = () => {
    const backMap = {
      'deliveryman-details': 'deliverymen',
      'assign-delivery': 'deliveries',
      'assign-delivery-quick': 'deliveries',
    };

    if (backMap[currentPage]) {
      setCurrentPage(backMap[currentPage]);
    } else {
      setCurrentPage('dashboard');
    }
  };

  // Rendu de la page courante
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;

      case 'deliveries':
        return <DeliveriesPage onNavigate={handleNavigate} />;

      case 'deliverymen':
        return <DeliveryMenPage onNavigate={handleNavigate} />;

      case 'settlements': // <--- NOUVELLE CASE POUR LA NAVIGATION
        return <SettlementsPage />;

      case 'deliveryman-details':
        return (
          <DeliveryManDetails
            deliveryMan={selectedDeliveryMan}
            onBack={handleBack}
            onUpdate={() => {
              setCurrentPage('deliverymen');
            }}
          />
        );

      case 'assign-delivery':
        return (
          <AssignDeliveryPage
            deliveryId={selectedDelivery}
            onBack={handleBack}
            onSuccess={() => {
              setCurrentPage('deliveries');
            }}
          />
        );

      case 'create-delivery':
        return <CreateDeliveryPage />;

      case 'tracking':
        return <TrackingPage />;

      case 'profile':
        return <ProfilePage />;


      case 'debts':
        return <DebtsManagementPage />;


      default:
        return <Dashboard />;
    }
  };

  // Titres des pages
  const pageTitles = {
    'dashboard': 'Tableau de bord',
    'deliveries': 'Gestion des Livraisons',
    'deliverymen': 'Gestion des Livreurs',
    'settlements': 'Caisse & Versements', // <--- NOUVEAU TITRE
    'deliveryman-details': 'Détails du Livreur',
    'assign-delivery': 'Assigner une Livraison',
    'assign-delivery-quick': 'Assigner une Livraison',
    'create-delivery': 'Créer une Livraison',
    'tracking': 'Suivi de Colis',
    'profile': 'Mon Profil',
    'debts': 'Gestion des Dettes',
  };

  // Si pas de token, afficher la page de connexion
  if (!token) {
    return <LoginPage onLogin={login} />;
  }

  // Rendu de l'application avec layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {/* Contenu principal */}
      <div className="lg:ml-64 transition-all duration-300">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitles[currentPage] || 'Tableau de bord'}
          additionalElements={
            <div className="flex items-center space-x-4">
              <AdminNotificationBadge />
            </div>
          }
        />

        {/* Contenu de la page */}
        <main className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>

        <footer className="border-t bg-white py-4 px-6 lg:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
              <div>
                <span className="font-medium">Admin Livraisons</span> © {new Date().getFullYear()} - Tous droits réservés
              </div>
              <div className="mt-2 md:mt-0">
                <span className="text-xs">Version 1.0.0</span>
                <span className="mx-2">•</span>
                <span className="text-xs">Notifications activées</span>
              </div>
            </div>
          </div>
        </footer>
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