import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import LoginPage from './components/pages/LoginPage';
import Dashboard from './components/common/Dashboard';
import DeliveriesPage from './components/pages/DeliveriesPage';
import ValidationPage from './components/pages/ValidationPage';
import CreateDeliveryPage from './components/pages/CreateDeliveryPage';
import ProfilePage from './components/pages/ProfilePage';
import HistoryPage from './components/pages/HistoryPage';

import AdminNotificationBadge from './components/common/AdminNotificationBadge';

const AppContent = () => {
  const { token, login } = useAuth(); // On récupère la fonction login ici
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
  // --------------------------

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'deliveries': return <DeliveriesPage onNavigate={handleNavigate} />;
      case 'validation': return <ValidationPage />;
      case 'history': return <HistoryPage />;
      case 'create-delivery': return <CreateDeliveryPage />;
      case 'profile': return <ProfilePage />;
      default: return <Dashboard />;
    }
  };

  const pageTitles = {
    'dashboard': 'Tableau de bord',
    'deliveries': 'Course du jour',
    'validation': 'Validation des Livraisons',
    'history': 'Historique global',
    'create-delivery': 'Créer une Livraison',
    'profile': 'Mon Profil',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <div className="lg:ml-64 transition-all duration-300">
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