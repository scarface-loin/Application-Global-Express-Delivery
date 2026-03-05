import React, { useState } from 'react';
import { FiLoader } from 'react-icons/fi';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/common/Dashboard';
import DeliveriesPage from './components/pages/DeliveriesPage';
import ValidationPage from './components/pages/ValidationPage';
import FacturePartenairePage from './components/pages/FacturePartenairePage'; // Import new page
import CreateLivreurForm from './components/pages/CreateLivreurForm';
import CreatePartnerForm from './components/pages/CreatePartnerForm';
import CreateDeliveryPage from './components/pages/CreateDeliveryPage';
import ProfilePage from './components/pages/ProfilePage';
import AdminAssignDeliveryPage from './components/pages/AdminAssignDeliveryPage';
import GarageValidationPage from './components/pages/GarageValidationPage';
import HistoryPage from './components/pages/HistoryPage';
import DailySummaryPage from './components/pages/DailySummaryPage';
import DeliveryDriverSalaryPage from './components/pages/DeliveryDriverSalaryPage';
import DeliveryMenListPage from './components/pages/DeliveryMenListPage';
import DeliveryFeesReportPage from './components/pages/DeliveryFeesReportPage';

import AdminNotificationBadge from './components/common/AdminNotificationBadge';

const AppContent = () => {
  const { isAuthenticated, login, loading } = useAuth();
  
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

  const handleBack = () => {
    if (currentPage === 'assign-delivery') {
      setCurrentPage('deliveries');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': 
        return <Dashboard setCurrentPage={setCurrentPage} />;
        
      case 'deliverymen': 
        return <DeliveryMenListPage />;
      case 'deliveries': 
        return <DeliveriesPage onNavigate={handleNavigate} />;
      case 'validation': 
        return <ValidationPage />;
      case 'partner-validation': // Add new case
        return <FacturePartenairePage />;
      case 'CreateLivreurForm': 
        return <CreateLivreurForm />;
      case 'create-partner':
        return <CreatePartnerForm />;
      case 'GarageValidationPage': 
        return <GarageValidationPage />;
      case 'admin-assign-delivery':
        return <AdminAssignDeliveryPage />;
      case 'daily-summary': 
        return <DailySummaryPage />;
      case 'driver-salary':
        return <DeliveryDriverSalaryPage />;
      case 'delivery-fees-report':
        return <DeliveryFeesReportPage />;
      case 'history': 
        return <HistoryPage />;
      case 'create-delivery': 
        return <CreateDeliveryPage />;
      case 'profile': 
        return <ProfilePage />;
      
      case 'assign-delivery':
        return <AdminAssignDeliveryPage deliveryId={selectedDelivery} onBack={handleBack} onSuccess={() => setCurrentPage('deliveries')} />;
        
      default: 
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  const pageTitles = {
    'dashboard': 'Tableau de bord',
    'deliverymen': 'Gestion des Livreurs',
    'GarageValidationPage': 'Suivi Garage & Entretien',
    'deliveries': 'Course du jour',
    'admin-assign-delivery': 'Attribution Livraisons',
    'CreateLivreurForm': 'Recruter Livreur',
    'create-partner': 'Créer Partenaire',
    'validation': 'Validation des Livraisons',
    'partner-validation': 'Validation des Partenaires', // Add new title
    'daily-summary': 'Récapitulatif de la journée',
    'driver-salary': 'Gestion Salaires Livreurs',
    'delivery-fees-report': 'Rapport Frais de Livraison',
    'history': 'Historique global',
    'create-delivery': 'Créer une Livraison',
    'profile': 'Mon Profil',
    'assign-delivery': 'Assigner une Livraison',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <FiLoader className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

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