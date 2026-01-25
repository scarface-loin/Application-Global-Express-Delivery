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
  FiBox,
  FiAlertTriangle
} from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
//import { useSettlementsLogic } from './logic/SettlementsPageLogic';

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
    errorMsg,
    setSuccessMsg,
    setErrorMsg,
    // ✨ NOUVEAUX états
    amountCollected,
    setAmountCollected,
    confirmReturns,
    setConfirmReturns,
    showValidationForm,
    // ✨ NOUVELLES fonctions
    calculateDifference,
    isValidAmount,
    getDifferenceAlertType,
    handleOpenSettleModal,
    handleCloseModal,
    handleShowValidationForm,
    handleConfirmSettlement,
    formatAmount,
    refreshData
  } = useSettlementsLogic();

  const difference = calculateDifference();
  const expectedAmount = driverDetails?.summary?.totalCash || 0;

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

      {/* Messages de succès/erreur */}
      {successMsg && (
        <Alert 
          type="success" 
          message={successMsg} 
          onClose={() => setSuccessMsg('')} 
        />
      )}
      {errorMsg && (
        <Alert 
          type="error" 
          message={errorMsg} 
          onClose={() => setErrorMsg('')} 
        />
      )}

      {/* Résumé Global */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        {/* ✨ NOUVEAU : Carte dettes totales */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <FiAlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dettes totales</p>
              <p className="text-2xl font-bold text-red-600">
                {formatAmount(drivers.reduce((acc, d) => acc + (d.debtBalance || 0), 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <FiUser size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Livreurs</p>
              <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dette actuelle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.driverId || driver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <FiUser className="text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.phone}</div>
                          <div className="text-xs text-gray-400">{driver.matricule}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">{formatAmount(driver.cashInHand)}</span>
                      <div className="text-xs text-gray-500">{driver.deliveredCount} colis</div>
                    </td>
                    {/* ✨ NOUVELLE colonne : Dette */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.debtBalance > 0 ? (
                        <div>
                          <span className="text-sm font-bold text-red-600">
                            {formatAmount(driver.debtBalance)}
                          </span>
                          <div className="text-xs text-gray-500">À déduire du salaire</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.pendingReturns > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
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
                        Encaisser
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
            {/* En-tête avec infos livreur */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Livreur</p>
                <p className="font-bold text-lg">{selectedDriver.name}</p>
                <p className="text-sm text-gray-500">{selectedDriver.matricule}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total attendu</p>
                <p className="font-bold text-2xl text-green-600">
                  {formatAmount(selectedDriver.cashInHand)}
                </p>
              </div>
            </div>

            {/* ✨ NOUVEAU : Affichage dette actuelle si existe */}
            {driverDetails?.summary?.currentDebt > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                <FiAlertTriangle className="text-red-600 mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Dette actuelle</p>
                  <p className="text-sm text-red-700">
                    Ce livreur a déjà une dette de{' '}
                    <strong>{formatAmount(driverDetails.summary.currentDebt)}</strong>{' '}
                    qui sera prélevée sur son salaire.
                  </p>
                </div>
              </div>
            )}

            {detailsLoading ? (
              <div className="py-10 text-center">
                <LoadingSpinner />
                <p className="text-sm text-gray-500 mt-2">Chargement du détail...</p>
              </div>
            ) : (
              <>
                {/* Détail Cash */}
                {driverDetails?.cashDetails && driverDetails.cashDetails.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <FiDollarSign /> Livraisons à encaisser ({driverDetails.cashDetails.length})
                    </h3>
                    <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tracking</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Client</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Destination</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Montant</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {driverDetails.cashDetails.map((pkg) => (
                            <tr key={pkg.packageId}>
                              <td className="px-4 py-2 text-sm font-mono text-gray-900">{pkg.trackingNumber}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{pkg.clientName}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{pkg.destination}</td>
                              <td className="px-4 py-2 text-sm font-medium text-right text-green-600">
                                {formatAmount(pkg.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Détail Retours */}
                {driverDetails?.returnDetails && driverDetails.returnDetails.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-orange-600">
                      <FiBox /> Colis à récupérer impérativement ({driverDetails.returnDetails.length})
                    </h3>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <ul className="space-y-2">
                        {driverDetails.returnDetails.map((pkg, idx) => (
                          <li key={idx} className="flex justify-between text-sm border-b border-orange-200 pb-2 last:border-0">
                            <div>
                              <span className="font-mono font-medium text-orange-900">{pkg.trackingNumber}</span>
                              <p className="text-xs text-orange-700">{pkg.recipient}</p>
                            </div>
                            <span className="text-orange-700 text-xs">{pkg.reason}</span>
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

                {/* ✨ NOUVEAU : Formulaire de saisie du montant */}
                {!showValidationForm ? (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex gap-3 items-start mb-4">
                      <FiAlertCircle className="text-blue-500 mt-1 shrink-0" />
                      <p className="text-sm text-blue-700">
                        Avant de valider, vous devez saisir le montant réellement collecté auprès du livreur.
                      </p>
                    </div>
                    <Button 
                      variant="primary" 
                      onClick={handleShowValidationForm}
                      className="w-full"
                    >
                      Saisir le montant collecté
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold text-gray-900 mb-4">Validation du versement</h4>
                    
                    {/* Montant attendu */}
                    <div className="mb-4 p-3 bg-white rounded border">
                      <label className="text-sm text-gray-600 block mb-1">Montant attendu</label>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatAmount(expectedAmount)}
                      </div>
                    </div>

                    {/* Saisie montant collecté */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Montant collecté (XAF) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={amountCollected}
                        onChange={(e) => setAmountCollected(e.target.value)}
                        placeholder="Entrez le montant collecté"
                        className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={processing}
                      />
                    </div>

                    {/* ✨ NOUVEAU : Affichage de la différence */}
                    {amountCollected && isValidAmount() && difference !== 0 && (
                      <div className={`p-4 rounded-lg mb-4 ${
                        difference > 0 
                          ? 'bg-red-50 border-2 border-red-300' 
                          : 'bg-blue-50 border-2 border-blue-300'
                      }`}>
                        <div className="flex items-start gap-3">
                          {difference > 0 ? (
                            <FiAlertTriangle className="text-red-600 mt-1 shrink-0" size={24} />
                          ) : (
                            <FiAlertCircle className="text-blue-600 mt-1 shrink-0" size={24} />
                          )}
                          <div className="flex-1">
                            {difference > 0 ? (
                              <>
                                <p className="font-bold text-red-800 text-lg mb-2">
                                  ⚠️ DIFFÉRENCE : -{formatAmount(difference)}
                                </p>
                                <p className="text-sm text-red-700">
                                  Le livreur a versé <strong>MOINS</strong> que prévu. Cette différence sera{' '}
                                  <strong>enregistrée comme DETTE</strong> et prélevée sur son prochain salaire.
                                </p>
                                <p className="text-xs text-red-600 mt-2">
                                  Dette totale après validation :{' '}
                                  <strong>
                                    {formatAmount((driverDetails?.summary?.currentDebt || 0) + difference)}
                                  </strong>
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-blue-800 text-lg mb-2">
                                  ℹ️ EXCÉDENT : +{formatAmount(Math.abs(difference))}
                                </p>
                                <p className="text-sm text-blue-700">
                                  Le livreur a versé <strong>PLUS</strong> que prévu. Cet excédent sera enregistré.
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Confirmation retours */}
                    {driverDetails?.returnDetails && driverDetails.returnDetails.length > 0 && (
                      <div className="mb-4">
                        <label className="flex items-center gap-2 p-3 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={confirmReturns}
                            onChange={(e) => setConfirmReturns(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            disabled={processing}
                          />
                          <span className="text-sm text-gray-700">
                            Je confirme avoir récupéré les <strong>{driverDetails.returnDetails.length}</strong> colis 
                            retournés et les avoir réintégrés dans le stock de l'agence.
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          setAmountCollected('');
                          handleShowValidationForm();
                        }}
                        disabled={processing}
                        className="flex-1"
                      >
                        Modifier
                      </Button>
                      <Button 
                        variant="success" 
                        onClick={handleConfirmSettlement} 
                        loading={processing}
                        disabled={!isValidAmount() || processing}
                        icon="check-circle"
                        className="flex-1"
                      >
                        Valider le versement
                      </Button>
                    </div>
                  </div>
                )}

                {/* Info globale */}
                {!showValidationForm && (
                  <div className="bg-gray-50 p-4 rounded-lg flex gap-3 items-start text-sm text-gray-600">
                    <FiAlertCircle className="text-gray-400 mt-1 shrink-0" />
                    <p>
                      En validant le versement, le solde du livreur sera remis à zéro. Les livraisons 
                      seront archivées et les retours marqués comme reçus à l'agence.
                    </p>
                  </div>
                )}

                {/* Bouton annuler en bas */}
                {!showValidationForm && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button variant="secondary" onClick={handleCloseModal}>
                      Annuler
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SettlementsPage;