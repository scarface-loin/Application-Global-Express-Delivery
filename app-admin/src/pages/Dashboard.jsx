import React, { useState, useEffect } from 'react';
import { FiPackage, FiClock, FiTruck, FiCheckCircle, FiUsers, FiDollarSign } from 'react-icons/fi';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { apiRequest } from '../../services/api';

export const Dashboard = () => {
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [deliveries, deliveryMen, statsData] = await Promise.all([
          apiRequest('/admin/deliveries?limit=5&sort=-createdAt'),
          apiRequest('/admin/delivery-men'),
          apiRequest('/admin/deliveries/stats'),
        ]);

        setRecentDeliveries(deliveries.data || []);
        
        if (statsData) {
          setStats(statsData);
        } else {
          const total = deliveries.data?.length || 0;
          const pending = deliveries.data?.filter(d => d.status === 'pending').length || 0;
          const inProgress = deliveries.data?.filter(d => d.status === 'in_progress').length || 0;
          const delivered = deliveries.data?.filter(d => d.status === 'delivered').length || 0;
          
          setStats({
            total,
            pending,
            inProgress,
            delivered,
            deliveryMen: deliveryMen.data?.length || 0,
            totalAmount: 0,
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Livraisons',
      value: stats.total,
      icon: <FiPackage size={32} />,
      color: 'bg-blue-500',
      trend: '+12%',
    },
    {
      title: 'En Attente',
      value: stats.pending,
      icon: <FiClock size={32} />,
      color: 'bg-yellow-500',
      trend: '-5%',
    },
    {
      title: 'En Cours',
      value: stats.inProgress,
      icon: <FiTruck size={32} />,
      color: 'bg-purple-500',
      trend: '+8%',
    },
    {
      title: 'Livrées',
      value: stats.delivered,
      icon: <FiCheckCircle size={32} />,
      color: 'bg-green-500',
      trend: '+15%',
    },
    {
      title: 'Livreurs Actifs',
      value: stats.deliveryMen,
      icon: <FiUsers size={32} />,
      color: 'bg-indigo-500',
      trend: '+3%',
    },
    {
      title: 'Chiffre Total',
      value: `${(stats.totalAmount || 0).toLocaleString()} FCFA`,
      icon: <FiDollarSign size={32} />,
      color: 'bg-emerald-500',
      trend: '+20%',
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
        <p className="text-gray-600">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <div className="text-xs text-gray-500">
                <span className="text-green-600">{stat.trend}</span> vs mois dernier
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card title="Livraisons Récentes">
          {recentDeliveries.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Aucune livraison récente</p>
          ) : (
            <div className="space-y-3">
              {recentDeliveries.map((delivery) => (
                <div key={delivery._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Livraison #{delivery._id?.slice(-6)}</span>
                      <Badge type={
                        delivery.status === 'delivered' ? 'success' :
                        delivery.status === 'in_progress' ? 'info' :
                        delivery.status === 'pending' ? 'warning' : 'default'
                      }>
                        {delivery.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {delivery.clientInfo?.name} • {delivery.deliveryType === 'local' ? 'Locale' : 'Transfert'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{delivery.totalAmount?.toLocaleString()} FCFA</p>
                    <p className="text-xs text-gray-500">
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Actions Rapides">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700">
              <FiPlus /> Créer une nouvelle livraison
            </button>
            <button className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-green-700">
              <FiUsers /> Ajouter un livreur
            </button>
            <button className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-purple-700">
              <FiSearch /> Suivre un colis
            </button>
            <button className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors text-yellow-700">
              <FiFilter /> Voir les rapports
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;