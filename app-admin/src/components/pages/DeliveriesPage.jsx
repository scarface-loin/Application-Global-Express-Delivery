import React from 'react';
import { 
  FiSearch, 
  FiPackage, 
  FiEye, 
  FiCheck, 
  FiTrash2, 
  FiDownload, 
  FiPlus,
  FiFilter,
  FiUser,
  FiCalendar,
  FiMapPin,
  FiDollarSign,
  FiRefreshCw,
  FiX,
  FiCheckCircle,
  FiCreditCard,
  FiClock,
  FiArchive,
  FiAlertCircle,
  FiTruck
} from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
import { useDeliveriesLogic } from './logic/DeliveriesPageLogic';

export const DeliveriesPage = ({ onNavigate }) => {
  const {
    // États
    deliveries,
    filteredDeliveries,
    loading,
    error,
    success,
    filters,
    pagination,
    showAssignModal,
    selectedDeliveryForAssign,
    deliveryMen,
    selectedDeliveryMan,
    assigning,
    showDetailsModal,
    selectedDeliveryDetails,
    showPaymentModal,
    selectedDeliveryForPayment,
    completing,
    paymentAmount,
    paymentMethod,
    stats,
    
    // Setters
    setShowAssignModal,
    setSelectedDeliveryForAssign,
    setSelectedDeliveryMan,
    setShowDetailsModal,
    setShowPaymentModal,
    setSelectedDeliveryForPayment,
    setPaymentAmount,
    setPaymentMethod,
    setError,
    setSuccess,
    setSelectedDeliveryDetails,
    
    // Fonctions
    handleFilterChange,
    handlePageChange,
    handleDelete,
    handleAssignDelivery,
    handleQuickAssign,
    handleCompleteDelivery,
    openQuickAssignModal,
    openPaymentModal,
    openDetailsModal,
    handleExport,
    formatDeliveryId,
    formatDate,
    formatAmount,
    getPackageCount,
    getFirstRecipient,
    getStatusText,
    getPackageStatusText,
    areAllPackagesDelivered,
    getDeliveredPackagesCount,
    refreshData,
    convertFirestoreTimestamp,
  } = useDeliveriesLogic(onNavigate);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {filters.showCompleted ? 'Historique des Livraisons' : 'Gestion des Livraisons'}
          </h2>
          <p className="text-gray-600">
            {stats.total} livraisons • {filters.showCompleted ? `${stats.completed} terminées` : `${stats.pending} en attente`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center">
            <button
              onClick={refreshData}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mr-4 p-2 rounded-lg hover:bg-blue-50"
              title="Actualiser les données"
            >
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>
          
          <Button
            variant={filters.showCompleted ? "secondary" : "primary"}
            icon={filters.showCompleted ? "clock" : "archive"}
            onClick={() => handleFilterChange('showCompleted', !filters.showCompleted)}
          >
            {filters.showCompleted ? 'Voir les livraisons en cours' : 'Voir l\'historique'}
          </Button>
          
          {!filters.showCompleted && (
            <Button
              variant="primary"
              icon="plus"
              onClick={() => window.location.hash = '#create-delivery'}
            >
              Nouvelle Livraison
            </Button>
          )}
          
          <Button
            variant="secondary"
            icon="download"
            onClick={handleExport}
            disabled={filteredDeliveries.length === 0}
          >
            Exporter
          </Button>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <Alert 
          type="error" 
          message={error} 
          onClose={() => setError('')}
          autoClose={5000}
        />
      )}
      {success && (
        <Alert 
          type="success" 
          message={success} 
          onClose={() => setSuccess('')}
          autoClose={3000}
        />
      )}

      {/* Filtres */}
      <Card title="Filtres">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {!filters.showCompleted && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
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
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Période
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toute période</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="last_month">Mois dernier</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="ID, client, téléphone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Statistiques rapides */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
          
          {!filters.showCompleted ? (
            <>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                <p className="text-sm text-gray-600">En attente</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">{stats.assigned}</p>
                <p className="text-sm text-gray-600">Assignées</p>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-700">{stats.inProgress}</p>
                <p className="text-sm text-gray-600">En cours</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
                <p className="text-sm text-gray-600">À terminer</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
                <p className="text-sm text-gray-600">Annulées</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                <p className="text-sm text-gray-600">Terminées</p>
              </div>
              <div className="text-center p-3 bg-green-100 rounded-lg">
                <p className="text-2xl font-bold text-green-800">
                  {formatAmount(stats.completedAmount)}
                </p>
                <p className="text-sm text-gray-600">Montant perçu</p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Liste des livraisons */}
      {loading && deliveries.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            {filters.showCompleted ? (
              <FiArchive className="mx-auto text-gray-400 mb-4" size={48} />
            ) : (
              <FiPackage className="mx-auto text-gray-400 mb-4" size={48} />
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filters.showCompleted 
                ? 'Aucune livraison terminée' 
                : deliveries.length === 0 
                  ? 'Aucune livraison trouvée' 
                  : 'Aucun résultat ne correspond à votre recherche'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.showCompleted 
                ? 'Les livraisons terminées apparaîtront ici' 
                : deliveries.length === 0 
                  ? 'Commencez par créer une nouvelle livraison' 
                  : 'Essayez de modifier vos critères de recherche'}
            </p>
            {!filters.showCompleted && deliveries.length === 0 && (
              <Button
                variant="primary"
                icon="plus"
                onClick={() => window.location.hash = '#create-delivery'}
              >
                Créer une livraison
              </Button>
            )}
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
                      {filters.showCompleted ? 'Livreur' : 'Colis'}
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
                  {filteredDeliveries.map((delivery) => {
                    const status = delivery.status;
                    const isCompleted = status === 'completed';
                    const allPackagesDelivered = areAllPackagesDelivered(delivery);
                    const deliveredCount = getDeliveredPackagesCount(delivery);
                    const totalPackages = getPackageCount(delivery);
                    
                    return (
                      <tr key={delivery.id || Math.random()} 
                          className={`hover:bg-gray-50 transition-colors ${
                            isCompleted ? 'bg-green-50 hover:bg-green-100' : ''
                          }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDeliveryId(delivery.id)}
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
                              {delivery.clientInfo?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {delivery.clientInfo?.phone || 'N/A'}
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
                                status === 'completed' ? 'success' :
                                status === 'delivered' ? 'info' :
                                status === 'cancelled' ? 'error' :
                                status === 'in_progress' ? 'warning' :
                                status === 'accepted' ? 'info' :
                                status === 'assigned' ? 'purple' :
                                status === 'pending' ? 'default' : 'default'
                              }>
                                {getStatusText(status)}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          {filters.showCompleted ? (
                            <div className="flex items-center gap-2">
                              <FiUser className="text-blue-500" size={16} />
                              <div>
                                <p className="text-sm font-medium">
                                  {delivery.deliveryManName || 'Non assigné'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <FiPackage className="text-blue-500" size={14} />
                                <span className="text-sm font-medium text-gray-900">
                                  {totalPackages} colis
                                </span>
                              </div>
                              
                              {/* Indicateur de progression des colis */}
                              {totalPackages > 0 && (
                                <div className="mt-1">
                                  <div className="flex items-center gap-1">
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full ${
                                          allPackagesDelivered ? 'bg-green-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${(deliveredCount / totalPackages) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {deliveredCount}/{totalPackages}
                                    </span>
                                  </div>
                                  
                                  {/* Alerte si tous les colis sont livrés mais la livraison n'est pas terminée */}
                                  {allPackagesDelivered && !isCompleted && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                                      <FiAlertCircle size={12} />
                                      <span>Prêt à terminer</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-500 mt-1">
                                {getFirstRecipient(delivery)}
                              </div>
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            <FiDollarSign className="inline mr-1" />
                            {formatAmount(delivery.totalAmount)}
                          </div>
                          {isCompleted && delivery.paymentMethod && (
                            <div className="text-xs text-green-600 mt-1">
                              <FiCreditCard className="inline mr-1" size={12} />
                              {delivery.paymentMethod === 'cash' ? 'Espèces' : 
                               delivery.paymentMethod === 'card' ? 'Carte' : 
                               delivery.paymentMethod === 'mobile_money' ? 'Mobile Money' :
                               delivery.paymentMethod === 'transfer' ? 'Virement' :
                               delivery.paymentMethod}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiCalendar className="mr-2" size={14} />
                            {isCompleted && delivery.completedAt 
                              ? formatDate(delivery.completedAt)
                              : formatDate(delivery.createdAt)
                            }
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {/* Bouton Voir détails */}
                            <button
                              onClick={() => openDetailsModal(delivery)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Voir détails"
                            >
                              <FiEye size={18} />
                            </button>
                            
                            {/* Boutons pour les livraisons NON terminées */}
                            {!isCompleted && !filters.showCompleted && (
                              <>
                                {/* Bouton Assigner - visible seulement pour les livraisons en attente */}
                                {status === 'pending' && (
                                  <button
                                    onClick={() => openQuickAssignModal(delivery)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                    title="Assigner à un livreur"
                                  >
                                    <FiTruck size={18} />
                                  </button>
                                )}
                                
                                {/* Bouton Terminer - visible si tous les colis sont livrés OU si le statut est delivered */}
                                {(allPackagesDelivered || status === 'delivered') && (
                                  <button
                                    onClick={() => openPaymentModal(delivery)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors animate-pulse"
                                    title="Marquer comme terminée (paiement reçu)"
                                  >
                                    <FiCheckCircle size={18} />
                                  </button>
                                )}
                                
                                {/* Bouton Annuler - visible pour les livraisons non terminées */}
                                {!['delivered', 'completed', 'cancelled'].includes(status) && (
                                  <button
                                    onClick={() => handleDelete(delivery.id)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Annuler la livraison"
                                  >
                                    <FiTrash2 size={18} />
                                  </button>
                                )}
                              </>
                            )}
                            
                            {/* Afficher le livreur si assigné mais pas terminé */}
                            {!isCompleted && !filters.showCompleted && 
                             ['assigned', 'accepted', 'in_progress'].includes(status) && 
                             delivery.deliveryManName && (
                              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                                <FiUser size={12} />
                                {delivery.deliveryManName.split(' ')[0] || 'Livreur'}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal d'assignation rapide */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedDeliveryForAssign(null);
          setSelectedDeliveryMan('');
        }}
        title="Assigner rapidement"
        size="md"
      >
        {selectedDeliveryForAssign && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-800">
                Assigner la livraison : {formatDeliveryId(selectedDeliveryForAssign.id)}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Client: {selectedDeliveryForAssign.clientInfo?.name}
              </p>
              <p className="text-sm text-blue-700">
                Montant: {formatAmount(selectedDeliveryForAssign.totalAmount)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionnez un livreur :
              </label>
              {deliveryMen.length === 0 ? (
                <div className="text-center py-4">
                  <FiUser className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-gray-600">Aucun livreur disponible</p>
                  <Button
                    variant="secondary"
                    onClick={() => window.location.hash = '#deliverymen'}
                    className="mt-3"
                  >
                    Gérer les livreurs
                  </Button>
                </div>
              ) : (
                <select
                  value={selectedDeliveryMan}
                  onChange={(e) => setSelectedDeliveryMan(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={assigning}
                >
                  <option value="">Choisissez un livreur...</option>
                  {deliveryMen
                    .filter(dm => dm.isActive !== false)
                    .map((dm, index) => (
                      <option 
                        key={dm.id || `dm-${index}`} 
                        value={dm.id}
                      >
                        {dm.name} - {dm.phone} {dm.matricule ? `(${dm.matricule})` : ''}
                      </option>
                    ))
                  }
                </select>
              )}
            </div>
            
            {selectedDeliveryMan && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  Livreur sélectionné: {
                    deliveryMen.find(dm => dm.id === selectedDeliveryMan)?.name
                  }
                </p>
              </div>
            )}
            
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedDeliveryForAssign(null);
                  setSelectedDeliveryMan('');
                }}
                disabled={assigning}
                icon="x"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleQuickAssign}
                disabled={!selectedDeliveryMan || assigning}
                icon="check"
                loading={assigning}
              >
                {assigning ? 'Assignation...' : 'Assigner'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmation de paiement/terminaison */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedDeliveryForPayment(null);
          setPaymentAmount('');
          setPaymentMethod('cash');
        }}
        title="Confirmer le paiement"
        size="md"
      >
        {selectedDeliveryForPayment && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">
                Livraison : {formatDeliveryId(selectedDeliveryForPayment.id)}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Client: {selectedDeliveryForPayment.clientInfo?.name}
              </p>
              <p className="text-sm text-green-700">
                Livreur: {selectedDeliveryForPayment.deliveryManName || 'Non assigné'}
              </p>
            </div>

            {/* Afficher l'état des colis */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">
                État des colis ({getDeliveredPackagesCount(selectedDeliveryForPayment)}/{getPackageCount(selectedDeliveryForPayment)} livrés)
              </p>
              <div className="space-y-1">
                {selectedDeliveryForPayment.packages?.map((pkg, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {pkg.status === 'delivered' ? (
                      <FiCheckCircle className="text-green-500" size={14} />
                    ) : (
                      <FiClock className="text-gray-400" size={14} />
                    )}
                    <span className={pkg.status === 'delivered' ? 'text-green-700' : 'text-gray-600'}>
                      Colis #{index + 1} - {pkg.recipient} - {getPackageStatusText(pkg.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avertissement si tous les colis ne sont pas livrés */}
            {!areAllPackagesDelivered(selectedDeliveryForPayment) && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="text-yellow-600 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      Attention : Tous les colis ne sont pas encore livrés
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Vous pouvez quand même terminer la livraison si nécessaire, mais assurez-vous que c'est intentionnel.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant à recevoir
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {formatAmount(selectedDeliveryForPayment.totalAmount)}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant reçu
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Entrez le montant reçu"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={completing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode de paiement
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={completing}
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Carte bancaire</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="transfer">Virement</option>
                </select>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-medium">Note :</span> Une fois terminée, cette livraison 
                  sera déplacée dans l'historique et ne sera plus visible dans l'écran du livreur.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedDeliveryForPayment(null);
                  setPaymentAmount('');
                  setPaymentMethod('cash');
                }}
                disabled={completing}
                icon="x"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleCompleteDelivery}
                disabled={completing}
                icon="check-circle"
                loading={completing}
              >
                {completing ? 'Traitement...' : 'Confirmer le paiement'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de détails */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDeliveryDetails(null);
        }}
        title="Détails de la livraison"
        size="lg"
      >
        {selectedDeliveryDetails && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">ID Livraison</p>
                <p className="font-bold text-lg">
                  {formatDeliveryId(selectedDeliveryDetails.id)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <Badge type={selectedDeliveryDetails.deliveryType === 'local' ? 'primary' : 'success'}>
                  {selectedDeliveryDetails.deliveryType === 'local' ? 'Locale' : 'Transfert'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <Badge type={
                  selectedDeliveryDetails.status === 'completed' ? 'success' :
                  selectedDeliveryDetails.status === 'delivered' ? 'info' :
                  selectedDeliveryDetails.status === 'cancelled' ? 'error' :
                  selectedDeliveryDetails.status === 'in_progress' ? 'warning' :
                  selectedDeliveryDetails.status === 'accepted' ? 'info' :
                  selectedDeliveryDetails.status === 'assigned' ? 'purple' :
                  selectedDeliveryDetails.status === 'pending' ? 'default' : 'default'
                }>
                  {getStatusText(selectedDeliveryDetails.status)}
                </Badge>
              </div>
            </div>

            {/* Informations client */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nom complet</p>
                  <p className="font-medium">{selectedDeliveryDetails.clientInfo?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{selectedDeliveryDetails.clientInfo?.phone || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Adresse</p>
                  <p className="font-medium">{selectedDeliveryDetails.clientInfo?.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Livreur assigné */}
            {selectedDeliveryDetails.deliveryManName && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Livreur assigné</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiUser className="text-blue-500" size={20} />
                  <div>
                    <p className="font-medium">{selectedDeliveryDetails.deliveryManName}</p>
                    {selectedDeliveryDetails.deliveryManId && (
                      <p className="text-xs text-gray-500">
                        ID: {selectedDeliveryDetails.deliveryManId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Colis avec état détaillé */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  Colis ({selectedDeliveryDetails.packages?.length || 0})
                </h3>
                <div className="text-sm">
                  <span className={`font-medium ${
                    areAllPackagesDelivered(selectedDeliveryDetails) ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {getDeliveredPackagesCount(selectedDeliveryDetails)}/{getPackageCount(selectedDeliveryDetails)} livrés
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {selectedDeliveryDetails.packages?.map((pkg, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    pkg.status === 'delivered' ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Colis #{index + 1}</span>
                        <Badge type={pkg.status === 'delivered' ? 'success' : 'default'}>
                          {getPackageStatusText(pkg.status)}
                        </Badge>
                      </div>
                      <span className="font-medium text-blue-600">
                        {formatAmount(pkg.amount)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">N° de suivi</p>
                        <p className="font-medium">{pkg.trackingNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Poids</p>
                        <p className="font-medium">{pkg.weight} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Destinataire</p>
                        <p className="font-medium">{pkg.recipient}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Téléphone</p>
                        <p className="font-medium">{pkg.recipientPhone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-gray-600">Destination</p>
                        <p className="font-medium">{pkg.destination}</p>
                      </div>
                      {pkg.description && (
                        <div className="md:col-span-2">
                          <p className="text-gray-600">Description</p>
                          <p className="font-medium">{pkg.description}</p>
                        </div>
                      )}
                    </div>
                    
                    {pkg.updatedAt && (
                      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                        Dernière mise à jour: {formatDate(pkg.updatedAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Informations de paiement si terminée */}
            {selectedDeliveryDetails.status === 'completed' && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Paiement reçu</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Montant</p>
                    <p className="font-medium text-green-600">
                      {formatAmount(selectedDeliveryDetails.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mode de paiement</p>
                    <p className="font-medium">
                      {selectedDeliveryDetails.paymentMethod === 'cash' ? 'Espèces' : 
                       selectedDeliveryDetails.paymentMethod === 'card' ? 'Carte bancaire' : 
                       selectedDeliveryDetails.paymentMethod === 'mobile_money' ? 'Mobile Money' :
                       selectedDeliveryDetails.paymentMethod === 'transfer' ? 'Virement' :
                       selectedDeliveryDetails.paymentMethod}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date de paiement</p>
                    <p className="font-medium">
                      {formatDate(selectedDeliveryDetails.completedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Historique des dates */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Historique</h3>
              <div className="space-y-2 text-sm">
                {selectedDeliveryDetails.createdAt && (
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-400" size={14} />
                    <span className="text-gray-600">Créée le:</span>
                    <span className="font-medium">{formatDate(selectedDeliveryDetails.createdAt)}</span>
                  </div>
                )}
                {selectedDeliveryDetails.assignedAt && (
                  <div className="flex items-center gap-2">
                    <FiUser className="text-gray-400" size={14} />
                    <span className="text-gray-600">Assignée le:</span>
                    <span className="font-medium">{formatDate(selectedDeliveryDetails.assignedAt)}</span>
                  </div>
                )}
                {selectedDeliveryDetails.acceptedAt && (
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-gray-400" size={14} />
                    <span className="text-gray-600">Acceptée le:</span>
                    <span className="font-medium">{formatDate(selectedDeliveryDetails.acceptedAt)}</span>
                  </div>
                )}
                {selectedDeliveryDetails.completedAt && (
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-green-500" size={14} />
                    <span className="text-gray-600">Terminée le:</span>
                    <span className="font-medium">{formatDate(selectedDeliveryDetails.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDeliveryDetails(null);
                }}
                icon="x"
              >
                Fermer
              </Button>
              
              {selectedDeliveryDetails.status === 'pending' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setTimeout(() => {
                      openQuickAssignModal(selectedDeliveryDetails);
                    }, 300);
                  }}
                  icon="check"
                >
                  Assigner
                </Button>
              )}
              
              {(selectedDeliveryDetails.status === 'delivered' || areAllPackagesDelivered(selectedDeliveryDetails)) && 
               selectedDeliveryDetails.status !== 'completed' && (
                <Button
                  variant="success"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setTimeout(() => {
                      openPaymentModal(selectedDeliveryDetails);
                    }, 300);
                  }}
                  icon="check-circle"
                >
                  Confirmer paiement
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeliveriesPage;