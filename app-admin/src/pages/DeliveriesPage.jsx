import React, { useState, useEffect } from 'react';
import { FiSearch, FiPackage, FiEye, FiCheck, FiTrash2 } from 'react-icons/fi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { apiRequest } from '../../services/api';

export const DeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    deliveryType: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    fetchDeliveries();
  }, [pagination.page, filters.status, filters.deliveryType]);

  useEffect(() => {
    const filtered = deliveries.filter(delivery => {
      const searchLower = filters.search.toLowerCase();
      return (
        delivery._id.toLowerCase().includes(searchLower) ||
        delivery.clientInfo?.name.toLowerCase().includes(searchLower) ||
        delivery.clientInfo?.phone.includes(searchLower) ||
        delivery.packages?.some(pkg => 
          pkg.recipient.toLowerCase().includes(searchLower) ||
          pkg.trackingNumber?.toLowerCase().includes(searchLower)
        )
      );
    });
    setFilteredDeliveries(filtered);
  }, [deliveries, filters.search]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      let url = `/admin/deliveries?page=${pagination.page}&limit=${pagination.limit}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.deliveryType) url += `&deliveryType=${filters.deliveryType}`;

      const response = await apiRequest(url);
      setDeliveries(response.data || []);
      setFilteredDeliveries(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || response.data?.length || 0,
      }));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'En attente',
      'assigned': 'Assignée',
      'accepted': 'Acceptée',
      'in_progress': 'En cours',
      'transferred': 'Transférée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
    };
    return statusMap[status] || status;
  };

  const handleDelete = async (deliveryId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette livraison ?')) return;

    try {
      await apiRequest(`/admin/deliveries/${deliveryId}`, {
        method: 'DELETE',
      });
      fetchDeliveries();
    } catch (error) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Livraisons</h2>
        <div className="flex gap-2">
          <Button
            variant="primary"
            icon="plus"
            onClick={() => window.location.hash = '#create-delivery'}
          >
            Nouvelle Livraison
          </Button>
          <Button
            variant="secondary"
            icon="download"
          >
            Exporter
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="assigned">Assignée</option>
              <option value="accepted">Acceptée</option>
              <option value="in_progress">En cours</option>
              <option value="transferred">Transférée</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.deliveryType}
              onChange={(e) => handleFilterChange('deliveryType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              <option value="local">Locale</option>
              <option value="transfer">Transfert</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="ID, nom client, téléphone, tracking..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des livraisons */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredDeliveries.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FiPackage className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune livraison</h3>
            <p className="text-gray-600">Commencez par créer une nouvelle livraison</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID / Tracking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type / Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Colis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{delivery._id.slice(-8)}
                          </div>
                          {delivery.packages?.[0]?.trackingNumber && (
                            <div className="text-xs text-gray-500">
                              {delivery.packages[0].trackingNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {delivery.clientInfo?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {delivery.clientInfo?.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge type={delivery.deliveryType === 'local' ? 'primary' : 'success'}>
                            {delivery.deliveryType === 'local' ? 'Locale' : 'Transfert'}
                          </Badge>
                          <div className="mt-1">
                            <Badge type={
                              delivery.status === 'delivered' ? 'success' :
                              delivery.status === 'cancelled' ? 'error' :
                              delivery.status === 'in_progress' ? 'info' :
                              delivery.status === 'pending' ? 'warning' : 'default'
                            }>
                              {getStatusText(delivery.status)}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {delivery.packages?.length || 0} colis
                        </div>
                        <div className="text-xs text-gray-500">
                          {delivery.packages?.[0]?.recipient}
                          {delivery.packages?.length > 1 && ` +${delivery.packages.length - 1} autres`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {delivery.totalAmount?.toLocaleString()} FCFA
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(delivery.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {/* Voir détails */}}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir détails"
                          >
                            <FiEye size={18} />
                          </button>
                          {delivery.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {/* Assigner */}}
                                className="text-green-600 hover:text-green-900"
                                title="Assigner"
                              >
                                <FiCheck size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(delivery._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Annuler"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeliveriesPage;