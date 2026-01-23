// ==================== src/App.jsx ====================
import React, { useState, useEffect } from 'react';
import { Home, Wallet, Bell, User } from 'lucide-react'; // Changement ici: BarChart3 remplacé par Wallet

// Import des composants
import Login from './components/Login';
import ForcePasswordChange from './components/ForcePasswordChange';
import HomeTab from './components/HomeTab';
import DeliveryDetail from './components/DeliveryDetail';
// import StatsTab from './components/StatsTab'; // On remplace Stats par Reconciliation pour l'instant
import ReconciliationTab from './components/ReconciliationTab'; // Nouvel import
import NotificationsTab from './components/NotificationsTab';
import AccountTab from './components/AccountTab';

// Import du service API
import apiService from './services/api';

const App = () => {
  // États d'authentification
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // États de l'application
  const [activeTab, setActiveTab] = useState('home');
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Calculer le total quand les livraisons changent
  useEffect(() => {
    if (isAuthenticated && !mustChangePassword) {
      calculateTotalAmount();
    }
  }, [deliveries, isAuthenticated, mustChangePassword]);

  const checkAuthentication = () => {
    const isAuth = apiService.auth.isAuthenticated();
    const user = apiService.auth.getCurrentUser();

    if (isAuth && user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      
      if (user.mustChangePassword) {
        setMustChangePassword(true);
        setLoading(false);
      } else {
        loadDeliveries();
      }
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user, mustChange) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setMustChangePassword(mustChange);

    if (!mustChange) {
      loadDeliveries();
    } else {
      setLoading(false);
    }
  };

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
    loadDeliveries();
  };

  const handleLogout = async () => {
    await apiService.auth.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setMustChangePassword(false);
    setDeliveries([]);
    setSelectedDelivery(null);
    setActiveTab('home');
  };

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const response = await apiService.deliveries.getAll();
      setDeliveries(response.data || response);
      setLoading(false);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      
      if (error.status === 403) {
        setMustChangePassword(true);
        setLoading(false);
        return;
      }
      
      const mockData = await apiService.utils.getMockDeliveries();
      setDeliveries(mockData.data);
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    const delivered = deliveries.flatMap(d => 
      d.packages.filter(p => p.status === 'delivered')
    );
    const sum = delivered.reduce((acc, p) => acc + p.amount, 0);
    setTotalAmount(sum);
  };

  // ==================== CODE CORRIGÉ ====================
const handleUpdatePackage = async (deliveryId, packageId, newStatus, rejectionReason = null) => {
  try {
    // 1. On passe la raison (4ème argument) à la fonction de l'API
    await apiService.deliveries.updatePackageStatus(deliveryId, packageId, newStatus, rejectionReason);
    
    // 2. On met à jour l'état local pour refléter le changement immédiatement
    const updatePackageInState = (pkg) => {
      if (pkg.id === packageId) {
        const updatedPackage = { ...pkg, status: newStatus };
        // Si le colis est rejeté, on ajoute aussi la raison à l'état local
        if (newStatus === 'failed' && rejectionReason) {
          updatedPackage.rejectionReason = rejectionReason;
        }
        return updatedPackage;
      }
      return pkg;
    };

    setDeliveries(prev =>
      prev.map(delivery =>
        delivery.id === deliveryId
          ? { ...delivery, packages: delivery.packages.map(updatePackageInState) }
          : delivery
      )
    );

    if (selectedDelivery && selectedDelivery.id === deliveryId) {
      setSelectedDelivery(prev => ({
        ...prev,
        packages: prev.packages.map(updatePackageInState)
      }));
    }
  } catch (error) {
    console.error('Error updating package:', error);
    // Optionnel : Gérer l'erreur avec une notification pour l'utilisateur
    // On pourrait ici décider de ne pas mettre à jour l'état si l'API échoue,
    // ou de le faire quand même pour une UI optimiste (ce que fait le code actuel).
  }
};

  const handleSelectDelivery = (delivery) => {
    setSelectedDelivery(delivery);
  };

  const handleBack = () => {
    setSelectedDelivery(null);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (mustChangePassword) {
    return <ForcePasswordChange onPasswordChanged={handlePasswordChanged} />;
  }

  if (loading && activeTab === 'home') {
    return (
      <div className="max-w-md mx-auto h-screen flex items-center justify-center" style={{ backgroundColor: '#f2f2f7' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (selectedDelivery) {
    return (
      <div className="max-w-md mx-auto h-screen" style={{ backgroundColor: '#f2f2f7' }}>
        <DeliveryDetail
          delivery={selectedDelivery}
          onBack={handleBack}
          onUpdatePackage={handleUpdatePackage}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-screen relative" style={{ backgroundColor: '#f2f2f7' }}>
      <div className="h-full">
        {activeTab === 'home' && (
          <HomeTab
            deliveries={deliveries}
            onSelectDelivery={handleSelectDelivery}
            totalAmount={totalAmount}
          />
        )}
        
        {/* Nouvel Onglet Bilan */}
        {activeTab === 'reconciliation' && <ReconciliationTab />}
        
        {activeTab === 'notifications' && <NotificationsTab />}
        
        {activeTab === 'account' && (
          <AccountTab 
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}
      </div>

      {/* Navigation bar iOS-style */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto backdrop-blur-xl bg-white/80 border-t border-gray-200/50 safe-area-inset-bottom z-50">
        <div className="flex justify-around px-2 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', paddingTop: '8px' }}>
          {[
            { id: 'home', icon: Home, label: 'Accueil' },
            { id: 'reconciliation', icon: Wallet, label: 'Bilan' }, // Remplacement de Stats par Bilan
            { id: 'notifications', icon: Bell, label: 'Alertes' },
            { id: 'account', icon: User, label: 'Compte' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center py-1 transition-all active:scale-95"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <tab.icon 
                size={24} 
                style={{ 
                  color: activeTab === tab.id ? '#667eea' : '#8e8e93',
                  strokeWidth: activeTab === tab.id ? 2.5 : 2
                }} 
              />
              <span 
                className="text-xs mt-1 font-medium"
                style={{ 
                  color: activeTab === tab.id ? '#667eea' : '#8e8e93'
                }}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;