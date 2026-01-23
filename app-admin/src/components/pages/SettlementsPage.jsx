// src/pages/SettlementsPage.jsx
import React from 'react';
import { 
  FiDollarSign, 
  FiPackage, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiUser, 
  FiRefreshCw, 
  FiArrowRight,
  FiBox
} from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
import { useSettlementsLogic } from './logic/SettlementsPageLogic';

const SettlementsPage = () => {
  const {
    drivers,
    loading,
    selectedDriver,
    driverDetails,
    detailsLoading,
    showSettleModal,
    processing,
    successMsg,
    setSuccessMsg,
    handleOpenSettleModal,
    handleCloseModal,
    handleConfirmSettlement,
    formatAmount,
    refreshData
  } = useSettlementsLogic();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Caisse & Versements</h2>
          <p className="text-gray-600">
            Validez les encaissements et les retours colis des livreurs.
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 p-2 rounded-lg hover:bg-blue-50"
        >
          <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {successMsg && (
        <Alert 
          type="success" 
          message={successMsg} 
          onClose={() => setSuccessMsg('')} 
        />
      )}

      {/* Résumé Global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <FiDollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total en circulation</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(drivers.reduce((acc, d) => acc + d.cashInHand, 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
              <FiPackage size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Retours en attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.reduce((acc, d) => acc + d.pendingReturns, 0)} colis
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des livreurs */}
      <Card title="Livreurs avec solde à verser">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <FiCheckCircle size={40} className="mx-auto mb-3 text-green-500" />
            <p>Tout est à jour ! Aucun versement en attente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Livreur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash à verser</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <FiUser className="text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-gray-900">{formatAmount(driver.cashInHand)}</span>
                      <div className="text-xs text-gray-500">{driver.deliveriesCount} livraisons</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.pendingReturns > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {driver.pendingReturns} à récupérer
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.hasPendingRequest ? (
                        <Badge type="warning">Demande envoyée</Badge>
                      ) : (
                        <Badge type="default">En attente</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleOpenSettleModal(driver)}
                        icon="arrow-right"
                      >
                        Encasser
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Validation */}
      <Modal
        isOpen={showSettleModal}
        onClose={handleCloseModal}
        title="Validation du versement"
        size="lg"
      >
        {selectedDriver && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Livreur</p>
                <p className="font-bold text-lg">{selectedDriver.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total à percevoir</p>
                <p className="font-bold text-2xl text-green-600">{formatAmount(selectedDriver.cashInHand)}</p>
              </div>
            </div>

            {detailsLoading ? (
              <div className="py-10 text-center">
                <LoadingSpinner />
                <p className="text-sm text-gray-500 mt-2">Chargement du détail...</p>
              </div>
            ) : (
              <>
                {/* Détail Cash */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <FiDollarSign /> Livraisons à encaisser
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Client</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {driverDetails?.deliveries.map((del) => (
                          <tr key={del.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{del.id}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{del.client}</td>
                            <td className="px-4 py-2 text-sm font-medium text-right">{formatAmount(del.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Détail Retours */}
                {selectedDriver.pendingReturns > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-orange-600">
                      <FiBox /> Colis à récupérer impérativement
                    </h3>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {driverDetails?.returns.map((pkg, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span className="font-medium text-orange-900">{pkg.tracking}</span>
                            <span className="text-orange-700">{pkg.reason}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 text-xs text-orange-800 flex items-center gap-1">
                        <FiAlertCircle />
                        Vérifiez que vous avez bien reçu ces colis physiques avant de valider.
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start">
                  <FiAlertCircle className="text-blue-500 mt-1 shrink-0" />
                  <p className="text-sm text-blue-700">
                    En cliquant sur "Confirmer la réception", le compteur de cash du livreur sera remis à zéro et les livraisons seront archivées.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="secondary" onClick={handleCloseModal} disabled={processing}>
                    Annuler
                  </Button>
                  <Button 
                    variant="success" 
                    onClick={handleConfirmSettlement} 
                    loading={processing}
                    icon="check-circle"
                  >
                    Confirmer la réception
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SettlementsPage;