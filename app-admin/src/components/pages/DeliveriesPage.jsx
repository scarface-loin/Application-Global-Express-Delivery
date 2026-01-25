import React, { useState } from 'react';
import { 
  FiSearch, 
  FiPackage, 
  FiEye, 
  FiTrash2, 
  FiRefreshCw,
  FiX,
  FiAlertCircle,
  FiUser,
  FiCalendar,
  FiDollarSign
} from 'react-icons/fi';

export default function DeliveriesPage() {
  // États
  const [deliveries, setDeliveries] = useState([
    {
      id: 'DEL-001',
      type: 'course',
      quartier: 'Bonapriso',
      numeroDestinataire: '+237699999999',
      coutLivraison: 1000,
      articles: [
        { nom: 'Pizza Margherita', quantite: 2, cout: 3500 },
        { nom: 'Coca-Cola', quantite: 1, cout: 1000 }
      ],
      total: 9000,
      trackingNumber: 'TRK-2026012501234',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'DEL-002',
      type: 'expedition',
      quartier: 'Bonamoussadi',
      numeroDestinataire: '+237677777777',
      coutLivraison: 2000,
      articles: [
        { nom: 'Documents', quantite: 1, cout: 0 }
      ],
      total: 2000,
      trackingNumber: 'TRK-2026012501235',
      status: 'delivered',
      deliveryManName: 'Jean Dupont',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ]);
  
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState(null);

  // Filtrer les livraisons
  const filteredDeliveries = deliveries.filter(delivery => {
    if (filters.status && delivery.status !== filters.status) return false;
    if (filters.type && delivery.type !== filters.type) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        delivery.id.toLowerCase().includes(search) ||
        delivery.trackingNumber.toLowerCase().includes(search) ||
        delivery.quartier.toLowerCase().includes(search) ||
        delivery.numeroDestinataire.includes(search)
      );
    }
    return true;
  });

  // Fonctions utilitaires
  const formatAmount = (amount) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'En attente',
      assigned: 'Assignée',
      accepted: 'Acceptée',
      in_progress: 'En cours',
      delivered: 'Livrée',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-purple-100 text-purple-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-200 text-green-900',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateArticlesTotal = (articles) => {
    return articles.reduce((sum, article) => {
      return sum + (article.quantite * article.cout);
    }, 0);
  };

  // Actions
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Données actualisées');
    }, 1000);
  };

  const handleDelete = (delivery) => {
    setDeliveryToDelete(delivery);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setDeliveries(deliveries.filter(d => d.id !== deliveryToDelete.id));
    setShowDeleteConfirm(false);
    setDeliveryToDelete(null);
    alert(`Livraison ${deliveryToDelete.id} supprimée`);
  };

  const openDetailsModal = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filtres compacts */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              {filteredDeliveries.length} livraison{filteredDeliveries.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Actualiser"
            >
              <FiRefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Recherche */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/* Filtres en ligne */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="">Tous types</option>
                <option value="course">Course</option>
                <option value="expedition">Expédition</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="">Tous statuts</option>
                <option value="pending">En attente</option>
                <option value="assigned">Assignée</option>
                <option value="in_progress">En cours</option>
                <option value="delivered">Livrée</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des livraisons */}
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FiPackage className="mx-auto text-gray-400 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Aucune livraison trouvée
            </h3>
            <p className="text-sm text-gray-600">
              {deliveries.length === 0 
                ? 'Commencez par créer une nouvelle livraison' 
                : 'Essayez de modifier vos critères de recherche'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* En-tête de la carte */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base truncate">
                        {delivery.id}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {delivery.trackingNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        delivery.type === 'course' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {delivery.type === 'course' ? '🏃' : '📦'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {getStatusText(delivery.status)}
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatAmount(delivery.total)}
                    </span>
                  </div>
                </div>

                {/* Contenu de la carte */}
                <div className="p-4 space-y-3">
                  {/* Quartier */}
                  <div className="flex items-center gap-2 text-sm">
                    <FiPackage className="text-gray-400 flex-shrink-0" size={16} />
                    <span className="font-medium text-gray-900">{delivery.quartier}</span>
                  </div>

                  {/* Téléphone */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-xs">📞</span>
                    <span>{delivery.numeroDestinataire}</span>
                  </div>

                  {/* Articles */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {delivery.articles.length} article{delivery.articles.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatAmount(calculateArticlesTotal(delivery.articles))} + {formatAmount(delivery.coutLivraison)} livraison
                    </span>
                  </div>

                  {/* Livreur si assigné */}
                  {delivery.deliveryManName && (
                    <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg">
                      <FiUser className="text-blue-600" size={14} />
                      <span className="text-blue-800 font-medium">{delivery.deliveryManName}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FiCalendar size={12} />
                    <span>{formatDate(delivery.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
                  <button
                    onClick={() => openDetailsModal(delivery)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <FiEye size={16} />
                    Détails
                  </button>
                  
                  {delivery.status !== 'completed' && (
                    <button
                      onClick={() => handleDelete(delivery)}
                      className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Détails */}
        {showDetailsModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Détails</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* Informations principales */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">ID</p>
                    <p className="font-bold text-sm">{selectedDelivery.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Type</p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      selectedDelivery.type === 'course' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedDelivery.type === 'course' ? 'Course' : 'Expédition'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600 mb-1">Tracking</p>
                    <p className="font-medium text-sm">{selectedDelivery.trackingNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600 mb-1">Statut</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDelivery.status)}`}>
                      {getStatusText(selectedDelivery.status)}
                    </span>
                  </div>
                </div>

                {/* Informations de livraison */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">📍 Livraison</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600">Quartier</p>
                      <p className="font-medium text-sm">{selectedDelivery.quartier}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Téléphone destinataire</p>
                      <p className="font-medium text-sm">{selectedDelivery.numeroDestinataire}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Coût de livraison</p>
                      <p className="font-medium text-sm text-blue-600">{formatAmount(selectedDelivery.coutLivraison)}</p>
                    </div>
                    {selectedDelivery.deliveryManName && (
                      <div>
                        <p className="text-xs text-gray-600">Livreur</p>
                        <p className="font-medium text-sm">{selectedDelivery.deliveryManName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Articles */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">
                    🛍️ Articles ({selectedDelivery.articles.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedDelivery.articles.map((article, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{article.nom}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Qté: {article.quantite} × {formatAmount(article.cout)}
                          </p>
                        </div>
                        <p className="font-bold text-blue-700 ml-2 whitespace-nowrap">
                          {formatAmount(article.quantite * article.cout)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Récapitulatif */}
                <div className="border-t pt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total articles:</span>
                      <span className="font-semibold">
                        {formatAmount(calculateArticlesTotal(selectedDelivery.articles))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Livraison:</span>
                      <span className="font-semibold">
                        {formatAmount(selectedDelivery.coutLivraison)}
                      </span>
                    </div>
                    <div className="pt-2 border-t-2 border-blue-300 flex justify-between">
                      <span className="font-bold text-gray-800">TOTAL:</span>
                      <span className="font-bold text-xl text-blue-700">
                        {formatAmount(selectedDelivery.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCalendar size={14} />
                    <span>Créée le: {formatDate(selectedDelivery.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t px-4 sm:px-6 py-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmation Suppression */}
        {showDeleteConfirm && deliveryToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <FiAlertCircle className="text-red-600" size={24} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Confirmer</h2>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Supprimer la livraison <strong>{deliveryToDelete.id}</strong> ?
                Cette action est irréversible.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeliveryToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}