import React, { useState, useEffect } from 'react';
import {
  FiAlertTriangle,
  FiDollarSign,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiSearch,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
import { apiRequest } from '../../services/api';

const DebtsManagementPage = () => {
  // États principaux
  const [activeTab, setActiveTab] = useState('overview'); // overview, pending, history
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Données
  const [statistics, setStatistics] = useState(null);
  const [pendingDebts, setPendingDebts] = useState([]);
  const [allDebts, setAllDebts] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDebts, setDriverDebts] = useState(null);
  
  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, paid, cancelled
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  
  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Formulaires
  const [cancelReason, setCancelReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // ============= CHARGEMENT DES DONNÉES =============
  
  const loadStatistics = async () => {
    try {
      const response = await apiRequest('/admin/debts/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const loadPendingDebts = async () => {
    try {
      const response = await apiRequest('/admin/debts/pending');
      setPendingDebts(response.data || []);
    } catch (error) {
      console.error('Erreur dettes en attente:', error);
    }
  };

  const loadAllDebts = async () => {
    setLoading(true);
    try {
      // Charger toutes les dettes (pending + paid + cancelled)
      const [pending, stats] = await Promise.all([
        apiRequest('/admin/debts/pending').catch(err => {
          console.warn('Endpoint /debts/pending non disponible:', err);
          return { data: [], summary: { count: 0, totalAmount: 0 } };
        }),
        apiRequest('/admin/debts/statistics').catch(err => {
          console.warn('Endpoint /debts/statistics non disponible:', err);
          return { 
            data: {
              totalPendingDebts: 0,
              totalPaidDebts: 0,
              pendingDebtsCount: 0,
              paidDebtsCount: 0,
              driversWithDebt: 0,
              topDebtors: []
            }
          };
        })
      ]);
      
      setPendingDebts(pending.data || []);
      setStatistics(stats.data || null);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setErrorMsg('⚠️ Les endpoints de gestion des dettes ne sont pas encore disponibles sur le serveur. Veuillez vérifier que le backend est à jour.');
    } finally {
      setLoading(false);
    }
  };

  const loadDriverDebts = async (driverId) => {
    try {
      const response = await apiRequest(`/admin/debts/driver/${driverId}/balance`).catch(err => {
        console.warn('Endpoint dettes livreur non disponible:', err);
        return {
          data: {
            driverId,
            driverName: selectedDriver?.driverName,
            debtBalance: 0,
            pendingDebts: [],
            lastDebtUpdate: new Date().toISOString()
          }
        };
      });
      setDriverDebts(response.data);
    } catch (error) {
      console.error('Erreur dettes livreur:', error);
      setErrorMsg('Erreur lors du chargement des dettes du livreur');
    }
  };

  // ============= ACTIONS =============

  const handleMarkAsPaid = async () => {
    if (!paymentReference.trim()) {
      setErrorMsg('Veuillez entrer une référence de paiement');
      return;
    }

    setProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    // 🔍 DEBUG: Afficher ce qui va être envoyé
    console.log('🚀 Envoi de la requête:', {
      url: `/admin/debts/${selectedDebt.id}/mark-paid`,
      debtId: selectedDebt.id,
      paymentReference: paymentReference.trim(),
      body: JSON.stringify({ paymentReference: paymentReference.trim() })
    });

    try {
      const response = await apiRequest(`/admin/debts/${selectedDebt.id}/mark-paid`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          paymentReference: paymentReference.trim() 
        })
      });

      console.log('✅ Réponse reçue:', response);

      if (response.success) {
        setSuccessMsg(`✅ Dette de ${formatAmount(selectedDebt.amount)} marquée comme payée`);
        setShowMarkPaidModal(false);
        setPaymentReference('');
        setSelectedDebt(null);
        loadAllDebts();
        // Fermer aussi le modal de détails
        setTimeout(() => {
          setShowDetailsModal(false);
        }, 1500);
      } else {
        setErrorMsg(response.error || 'Erreur lors du marquage de la dette');
      }
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      setErrorMsg(error.message || 'Erreur lors du marquage de la dette');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelDebt = async () => {
    if (!cancelReason.trim()) {
      setErrorMsg('Veuillez entrer une raison d\'annulation');
      return;
    }

    setProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await apiRequest(`/admin/debts/${selectedDebt.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          reason: cancelReason.trim() 
        })
      });

      if (response.success) {
        setSuccessMsg(`✅ Dette de ${formatAmount(selectedDebt.amount)} annulée avec succès`);
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedDebt(null);
        loadAllDebts();
        // Fermer aussi le modal de détails
        setTimeout(() => {
          setShowDetailsModal(false);
        }, 1500);
      } else {
        setErrorMsg(response.error || 'Erreur lors de l\'annulation');
      }
    } catch (error) {
      console.error('Erreur complète:', error);
      setErrorMsg(error.message || 'Erreur lors de l\'annulation');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDriverDetails = async (driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
    await loadDriverDebts(driver.driverId);
  };

  // ============= UTILITAIRES =============

  const formatAmount = (amount) => {
    return `${(amount || 0).toLocaleString()} FCFA`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const types = {
      pending: 'warning',
      paid: 'success',
      cancelled: 'default'
    };
    const labels = {
      pending: 'En attente',
      paid: 'Payée',
      cancelled: 'Annulée'
    };
    return <Badge type={types[status]}>{labels[status]}</Badge>;
  };

  const getReasonLabel = (reason) => {
    const labels = {
      settlement_shortage: 'Manque lors du versement',
      manual_entry: 'Saisie manuelle',
      other: 'Autre'
    };
    return labels[reason] || reason;
  };

  // Filtrer les dettes
  const filteredDebts = pendingDebts.filter(debt => {
    const matchSearch = debt.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       debt.driverMatricule?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchSearch;
  });

  // Regrouper les dettes par livreur
  const debtsByDriver = filteredDebts.reduce((acc, debt) => {
    const key = debt.driverId;
    if (!acc[key]) {
      acc[key] = {
        driverId: debt.driverId,
        driverName: debt.driverName,
        driverPhone: debt.driverPhone,
        driverMatricule: debt.driverMatricule,
        debts: [],
        totalAmount: 0
      };
    }
    acc[key].debts.push(debt);
    acc[key].totalAmount += debt.amount;
    return acc;
  }, {});

  const driversWithDebts = Object.values(debtsByDriver);

  // ============= EFFETS =============

  useEffect(() => {
    loadAllDebts();
  }, []);

  // ============= RENDU =============

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Dettes</h2>
          <p className="text-gray-600">
            Suivez et gérez les dettes des livreurs
          </p>
        </div>
        <button
          onClick={loadAllDebts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />
      )}
      {errorMsg && (
        <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />
      )}

      {/* Message si pas de données backend */}
      {!loading && statistics && statistics.totalPendingDebts === 0 && statistics.totalPaidDebts === 0 && (
        <Alert 
          type="info" 
          message="ℹ️ Les endpoints de gestion des dettes ne sont pas encore configurés sur votre serveur. Cette page affichera les données dès que les routes backend seront activées."
        />
      )}

      {/* Statistiques globales */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <FiAlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dettes en attente</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatAmount(statistics.totalPendingDebts)}
                </p>
                <p className="text-xs text-gray-500">{statistics.pendingDebtsCount} dettes</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <FiCheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dettes payées</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(statistics.totalPaidDebts)}
                </p>
                <p className="text-xs text-gray-500">{statistics.paidDebtsCount} dettes</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <FiUsers size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Livreurs endettés</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.driversWithDebt}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                <FiDollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dette moyenne</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatAmount(
                    statistics.driversWithDebt > 0 
                      ? statistics.totalPendingDebts / statistics.driversWithDebt 
                      : 0
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Top Débiteurs */}
      {statistics?.topDebtors && statistics.topDebtors.length > 0 && (
        <Card title="Top 5 Débiteurs">
          <div className="space-y-3">
            {statistics.topDebtors.map((debtor, index) => (
              <div key={debtor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{debtor.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {formatAmount(debtor.debtBalance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Barre de recherche et filtres */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="secondary" icon={<FiFilter />}>
            Filtres avancés
          </Button>
        </div>
      </Card>

      {/* Tableau des dettes par livreur */}
      <Card title={`Dettes en attente (${driversWithDebts.length} livreurs)`}>
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : driversWithDebts.length === 0 ? (
          <div className="text-center py-10">
            <FiCheckCircle size={48} className="mx-auto text-green-500 mb-3" />
            <p className="text-gray-500">Aucune dette en attente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Livreur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre de dettes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {driversWithDebts.map((driver) => (
                  <tr key={driver.driverId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{driver.driverName}</div>
                        <div className="text-sm text-gray-500">{driver.driverMatricule}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{driver.driverPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge type="warning">{driver.debts.length} dette(s)</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-red-600">
                        {formatAmount(driver.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewDriverDetails(driver)}
                        icon={<FiEye />}
                      >
                        Détails
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Détails des dettes d'un livreur */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDriver(null);
          setDriverDebts(null);
        }}
        title={`Dettes de ${selectedDriver?.driverName}`}
        size="lg"
      >
        {driverDebts ? (
          <div className="space-y-6">
            {/* Résumé */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Dette totale en attente</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatAmount(driverDebts.debtBalance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Dernière mise à jour</p>
                  <p className="text-sm font-medium">
                    {formatDate(driverDebts.lastDebtUpdate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Liste des dettes */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Détail des dettes ({driverDebts.pendingDebts.length})
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {driverDebts.pendingDebts.map((debt) => (
                  <div key={debt.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatAmount(debt.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {getReasonLabel(debt.reason)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Créée le {formatDate(debt.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDebt(debt);
                            setShowMarkPaidModal(true);
                          }}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          <FiCheckCircle className="inline mr-1" />
                          Marquer payée
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDebt(debt);
                            setShowCancelModal(true);
                          }}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          <FiXCircle className="inline mr-1" />
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        )}
      </Modal>

      {/* Modal Marquer comme payée */}
      <Modal
        isOpen={showMarkPaidModal}
        onClose={() => {
          setShowMarkPaidModal(false);
          setSelectedDebt(null);
          setPaymentReference('');
        }}
        title="Marquer la dette comme payée"
        size="md"
      >
        {selectedDebt && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Montant de la dette</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatAmount(selectedDebt.amount)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence de paiement *
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Ex: SALARY_2025_01_23"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Entrez une référence de paiement (salaire, remboursement, etc.)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowMarkPaidModal(false);
                  setPaymentReference('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                onClick={handleMarkAsPaid}
                loading={processing}
                disabled={!paymentReference.trim()}
                className="flex-1"
              >
                Confirmer le paiement
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Annuler dette */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedDebt(null);
          setCancelReason('');
        }}
        title="Annuler la dette"
        size="md"
      >
        {selectedDebt && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                <FiAlertTriangle className="inline mr-2" />
                Attention : Cette action est irréversible
              </p>
              <p className="text-sm text-gray-700">
                Dette de <strong>{formatAmount(selectedDebt.amount)}</strong> pour {selectedDriver?.driverName}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de l'annulation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Erreur de saisie, litige résolu..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelDebt}
                loading={processing}
                disabled={!cancelReason.trim()}
                className="flex-1"
              >
                Confirmer l'annulation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DebtsManagementPage;