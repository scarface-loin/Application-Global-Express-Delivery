// src/components/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import {
  FiPackage,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiUsers,
  FiDollarSign,
  FiPlus,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import Card from './Card';
import Badge from './Badge';
import DeliveryLoader from './DeliveryLoader';
import motoGif from '../../assets/moto-livraison.gif';
import { fetchDashboardData } from '../pages/logic/DashboardLogic'; 

// 1. AJOUT DE LA PROP setCurrentPage ICI
export const Dashboard = ({ setCurrentPage }) => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    delivered: 0,
    deliveryMen: 0,
    totalAmount: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { stats: fetchedStats, recentDeliveries: fetchedDeliveries } = await fetchDashboardData();
        setStats(fetchedStats);
        setRecentDeliveries(fetchedDeliveries);
      } catch (err) {
        console.error('Erreur lors du chargement du tableau de bord:', err);
        setError("Impossible de charger les données. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // ... (Le code des statCards et getStatusInfo reste identique) ...
  const statCards = [
    { title: 'Total Livraisons', value: stats.total, icon: <FiPackage size={32} />, color: 'bg-blue-500' },
    { title: 'En Attente', value: stats.pending, icon: <FiClock size={32} />, color: 'bg-yellow-500' },
    { title: 'En Cours', value: stats.inProgress, icon: <FiTruck size={32} />, color: 'bg-purple-500' },
    { title: 'Terminées', value: stats.delivered, icon: <FiCheckCircle size={32} />, color: 'bg-green-500' },
    { title: 'Livreurs Actifs', value: stats.deliveryMen, icon: <FiUsers size={32} />, color: 'bg-indigo-500' },
    { title: 'Chiffre d\'Affaires', value: `${(stats.totalAmount || 0).toLocaleString()} FCFA`, icon: <FiDollarSign size={32} />, color: 'bg-emerald-500' },
  ];

  const getStatusInfo = (status) => {
    switch (status) {
      case 'delivered': return { type: 'success', text: 'Livrée' };
      case 'in_progress': return { type: 'info', text: 'En cours' };
      case 'pending': default: return { type: 'warning', text: 'En attente' };
    }
  };

  if (loading) return <DeliveryLoader gifUrl={motoGif} onLoadingComplete={() => setLoading(false)} />;
  
  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-xl font-bold text-red-700">Une erreur est survenue</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
        <p className="text-gray-600">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} text-white p-2 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card title="Livraisons Récentes">
           {/* ... (Code d'affichage des livraisons récentes inchangé) ... */}
           {recentDeliveries.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Aucune livraison récente</p>
          ) : (
            <div className="space-y-3">
              {recentDeliveries.map((delivery) => {
                const statusInfo = getStatusInfo(delivery.status);
                return (
                  <div key={delivery._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">#{delivery._id?.slice(-6)}</span>
                        <Badge type={statusInfo.type}>{statusInfo.text}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{delivery.clientInfo?.name} • {delivery.deliveryType === 'local' ? 'Locale' : 'Transfert'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{delivery.totalAmount?.toLocaleString()} FCFA</p>
                      <p className="text-xs text-gray-500">{new Date(delivery.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* 2. MISE A JOUR DES BOUTONS D'ACTION */}
        <Card title="Actions Rapides">
          <div className="space-y-2">
            <button
              onClick={() => setCurrentPage('create-delivery')} 
              className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700"
            >
              <FiPlus /> Créer une nouvelle livraison
            </button>
            <button
              onClick={() => setCurrentPage('CreateLivreurForm')} 
              className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-green-700"
            >
              <FiUsers /> Ajouter un livreur
            </button>
            <button
              onClick={() => setCurrentPage('deliveries')} 
              className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-purple-700"
            >
              <FiSearch /> Suivre les colis
            </button>
            <button
              onClick={() => setCurrentPage('daily-summary')} 
              className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors text-yellow-700"
            >
              <FiFilter /> Voir les rapports
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;