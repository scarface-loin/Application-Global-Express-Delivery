// components/HomeTab.jsx
import React, { useState, useEffect } from 'react';
import { Package, MapPin, ChevronRight, AlertCircle, Clock, CheckCircle, Truck } from 'lucide-react';
import apiService from '../services/api';

const HomeTab = ({ deliveries: initialDeliveries, onSelectDelivery, totalAmount: initialTotalAmount }) => {
  const [deliveries, setDeliveries] = useState(initialDeliveries || []);
  const [totalAmount, setTotalAmount] = useState(initialTotalAmount || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalDeliveries: 0
  });

  useEffect(() => {
    fetchDeliveriesAndStats();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchDeliveriesAndStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeliveriesAndStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les livraisons du livreur
      const deliveriesResult = await apiService.deliveries.getAll();
      
      if (deliveriesResult.success) {
        const userDeliveries = deliveriesResult.data || [];
        setDeliveries(userDeliveries);
        
        // Calculer les statistiques
        const pendingDels = userDeliveries.filter(d => 
          ['pending', 'assigned', 'accepted'].includes(d.status)
        );
        const inProgressDels = userDeliveries.filter(d => 
          d.status === 'in_progress'
        );
        const completedDels = userDeliveries.filter(d => 
          ['delivered', 'transferred'].includes(d.status)
        );

        // Calculer le montant total des livraisons en cours
        const todayAmount = pendingDels.reduce((sum, delivery) => {
          return sum + (delivery.totalAmount || 0);
        }, 0);

        setTotalAmount(todayAmount);
        
        setStats({
          pending: pendingDels.length,
          inProgress: inProgressDels.length,
          completed: completedDels.length,
          totalDeliveries: userDeliveries.length
        });
      } else {
        setError(deliveriesResult.message);
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
      // Utiliser les données mockées en développement
      if (process.env.NODE_ENV === 'development') {
        const mockData = apiService.utils.getMockDeliveries();
        if (mockData.success) {
          setDeliveries(mockData.data);
          setTotalAmount(78000);
          setStats({
            pending: 3,
            inProgress: 0,
            completed: 15,
            totalDeliveries: 18
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDelivery = async (deliveryId, e) => {
    e.stopPropagation(); // Empêche l'ouverture des détails
    
    try {
      const result = await apiService.deliveries.acceptDelivery(deliveryId);
      if (result.success) {
        // Rafraîchir la liste
        fetchDeliveriesAndStats();
        // Notification ou toast
        alert('Livraison acceptée avec succès !');
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'acceptation');
    }
  };

  const handleStartDelivery = async (deliveryId, e) => {
    e.stopPropagation();
    
    try {
      const result = await apiService.deliveries.startDelivery(deliveryId);
      if (result.success) {
        fetchDeliveriesAndStats();
        alert('Livraison démarrée !');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { text: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'assigned': { text: 'Assignée', color: 'bg-blue-100 text-blue-800', icon: Package },
      'accepted': { text: 'Acceptée', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      'in_progress': { text: 'En cours', color: 'bg-orange-100 text-orange-800', icon: Truck },
      'delivered': { text: 'Livrée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'transferred': { text: 'Transférée', color: 'bg-indigo-100 text-indigo-800', icon: Truck }
    };

    const config = statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} className="mr-1" />
        {config.text}
      </span>
    );
  };

  const getActionButton = (delivery) => {
    switch (delivery.status) {
      case 'assigned':
        return (
          <button
            onClick={(e) => handleAcceptDelivery(delivery.id, e)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform shadow-sm"
          >
            Accepter
          </button>
        );
      case 'accepted':
        return (
          <button
            onClick={(e) => handleStartDelivery(delivery.id, e)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform shadow-sm"
          >
            Démarrer
          </button>
        );
      case 'in_progress':
        return (
          <button
            onClick={() => onSelectDelivery(delivery)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform shadow-sm"
          >
            En cours
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: '#f2f2f7' }}>
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 px-5 pt-14 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Livraisons</h1>
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
        <div className="px-4 pt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: '#f2f2f7' }}>
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 px-5 pt-14 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Livraisons</h1>
          <p className="text-sm text-gray-500">Aujourd'hui</p>
        </div>
        <div className="text-center py-20 px-4">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-500" size={40} />
          </div>
          <p className="text-gray-900 text-lg font-semibold mb-2">{error}</p>
          <button
            onClick={fetchDeliveriesAndStats}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium active:scale-95 transition-transform shadow-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const pendingDeliveries = deliveries.filter(d => 
    ['pending', 'assigned', 'accepted', 'in_progress'].includes(d.status)
  );

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: '#f2f2f7' }}>
      {/* Header avec effet glassmorphism */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 px-5 pt-14 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Livraisons</h1>
        <p className="text-sm text-gray-500">Aujourd'hui</p>
      </div>

      <div className="px-4 pt-4">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">En cours</span>
              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                <Truck size={14} className="text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">En attente</span>
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock size={14} className="text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
          </div>
        </div>

        {/* Carte de revenus - Design premium */}
        <div className="mb-6 rounded-3xl overflow-hidden shadow-lg" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">₣</span>
                </div>
                <span className="text-white/90 text-sm font-medium">Revenus du jour</span>
              </div>
              <button
                onClick={fetchDeliveriesAndStats}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="text-white text-5xl font-bold mb-2 tracking-tight">
              {totalAmount.toLocaleString('fr-FR')} FCFA
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                <span className="text-white/80 text-sm">
                  {pendingDeliveries.length} livraison{pendingDeliveries.length > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-white/60 text-xs">
                {stats.completed} livrées aujourd'hui
              </span>
            </div>
          </div>
        </div>

        {/* Liste des livraisons */}
        {pendingDeliveries.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-blue-500" size={40} />
            </div>
            <p className="text-gray-900 text-lg font-semibold mb-1">Tout est livré !</p>
            <p className="text-gray-500 text-sm">Profitez de votre pause</p>
            <button
              onClick={fetchDeliveriesAndStats}
              className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm active:scale-95 transition-transform"
            >
              Rafraîchir
            </button>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="font-semibold text-gray-700">À livrer aujourd'hui</h2>
              <span className="text-sm text-gray-500">{pendingDeliveries.length} au total</span>
            </div>
            
            {pendingDeliveries.map(delivery => {
              const pendingPackages = delivery.packages?.filter(p => 
                ['pending', 'in_transit'].includes(p.status)
              ) || [];
              
              const deliveryAmount = pendingPackages.reduce((sum, pkg) => sum + (pkg.amount || 0), 0);

              return (
                <div
                  key={delivery.id}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-98 transition-all"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* En-tête avec client et statut */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(delivery.status)}
                        {delivery.deliveryType === 'transfer' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Transfert
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-base mb-1.5">
                        {delivery.clientInfo?.name || delivery.clientName || 'Client inconnu'}
                      </h3>
                      <div className="flex items-start text-gray-500 text-sm mb-2">
                        <MapPin size={14} className="mr-1.5 mt-0.5 flex-shrink-0" style={{ color: '#667eea' }} />
                        <span className="line-clamp-2 leading-relaxed">
                          {delivery.clientInfo?.address || delivery.address || 'Adresse non spécifiée'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        📞 {delivery.clientInfo?.phone || delivery.phone || 'Téléphone non disponible'}
                      </p>
                    </div>
                    <ChevronRight 
                      size={20} 
                      className="text-gray-400 ml-2 flex-shrink-0 cursor-pointer"
                      onClick={() => onSelectDelivery(delivery)}
                    />
                  </div>
                  
                  {/* Informations colis */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: '#f0f0f5' }}>
                        <Package size={16} style={{ color: '#667eea' }} />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 text-sm">
                          {pendingPackages.length} colis
                        </span>
                        {delivery.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            📝 {delivery.notes.substring(0, 30)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg" style={{ color: '#667eea' }}>
                        {deliveryAmount.toLocaleString('fr-FR')} FCFA
                      </div>
                      {delivery.totalAmount > deliveryAmount && (
                        <div className="text-xs text-gray-500 line-through">
                          {delivery.totalAmount.toLocaleString('fr-FR')} FCFA
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <button
                      onClick={() => onSelectDelivery(delivery)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm active:scale-95 transition-transform"
                    >
                      Détails
                    </button>
                    <div className="flex gap-2">
                      {getActionButton(delivery)}
                    </div>
                  </div>
                  
                  {/* Bouton upload reçu pour les transferts */}
                  {delivery.deliveryType === 'transfer' && delivery.status === 'accepted' && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                      <button
                        onClick={() => {
                          // Ici vous pourriez ouvrir un modal d'upload
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = 'image/*,.pdf';
                          fileInput.onchange = async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              try {
                                const result = await apiService.deliveries.uploadTransferReceipt(delivery.id, file);
                                if (result.success) {
                                  alert('Reçu uploadé avec succès !');
                                  fetchDeliveriesAndStats();
                                }
                              } catch (error) {
                                alert(error.message);
                              }
                            }
                          };
                          fileInput.click();
                        }}
                        className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform shadow-sm flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Uploader reçu de transfert
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bouton flottant pour rafraîchir */}
      <button
        onClick={fetchDeliveriesAndStats}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        style={{ zIndex: 50 }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};

export default HomeTab;