import React, { useState, useEffect } from 'react';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiCheck, 
  FiX, 
  FiUser, 
  FiPhone, 
  FiMapPin, 
  FiCalendar,
  FiPackage,
  FiDollarSign,
  FiActivity,
  FiPercent,
  FiClock,
  FiStar,
  FiAlertCircle,
  FiRefreshCw,
  FiLock,
  FiUpload,
  FiFileText,
  FiShield
} from 'react-icons/fi';
import { FaMotorcycle } from 'react-icons/fa';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import { apiRequest } from '../../services/api';

// Sous-composant: Formulaire d'édition du livreur
const DeliveryManForm = ({ deliveryMan, onClose, onSuccess }) => {
  const isEdit = !!deliveryMan;
  const [formData, setFormData] = useState({
    name: deliveryMan?.name || '',
    phone: deliveryMan?.phone || '',
    matricule: deliveryMan?.matricule || '',
    isActive: deliveryMan?.isActive ?? true,
  });
  const [files, setFiles] = useState({
    permit: null,
    cni: null,
    contract: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        // Modification
        await apiRequest(`/admin/delivery-men/${deliveryMan._id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: formData.name,
            isActive: formData.isActive,
          }),
        });
      } else {
        // Création
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('phone', formData.phone);
        formDataToSend.append('matricule', formData.matricule);
        
        if (files.permit) formDataToSend.append('permit', files.permit);
        if (files.cni) formDataToSend.append('cni', files.cni);
        if (files.contract) formDataToSend.append('contract', files.contract);

        const token = localStorage.getItem('token');
        // Utilisation de API_BASE_URL importé
        const response = await fetch(`${API_BASE_URL}/admin/delivery-men`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erreur lors de la création');
        }
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEdit ? "Modifier le livreur" : "Nouveau livreur"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <Input
          label="Nom complet"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        {!isEdit && (
          <>
            <Input
              label="Téléphone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Matricule"
              value={formData.matricule}
              onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permis de conduire *
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setFiles({ ...files, permit: e.target.files[0] })}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNI *
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setFiles({ ...files, cni: e.target.files[0] })}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contrat *
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setFiles({ ...files, contract: e.target.files[0] })}
                className="w-full"
                required
              />
            </div>
          </>
        )}

        {isEdit && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Livreur actif
            </label>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Sous-composant: Formulaire de mise à jour de documents
const DocumentUpdateForm = ({ deliveryManId, onClose, onSuccess }) => {
  const [files, setFiles] = useState({
    permit: null,
    cni: null,
    contract: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!files.permit && !files.cni && !files.contract) {
      setError('Veuillez sélectionner au moins un document');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (files.permit) formData.append('permit', files.permit);
      if (files.cni) formData.append('cni', files.cni);
      if (files.contract) formData.append('contract', files.contract);

      const token = localStorage.getItem('token');
      // Utilisation de API_BASE_URL importé
      const response = await fetch(`${API_BASE_URL}/admin/delivery-men/${deliveryManId}/documents`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Mettre à jour les documents">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permis de conduire
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => setFiles({ ...files, permit: e.target.files[0] })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNI
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => setFiles({ ...files, cni: e.target.files[0] })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contrat
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => setFiles({ ...files, contract: e.target.files[0] })}
            className="w-full"
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};


// Sous-composant: Modal de confirmation pour actions dangereuses
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmer", variant = "danger" }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="text-center">
          <FiAlertCircle className="mx-auto text-red-500 mb-3" size={48} />
          <p className="text-gray-700">{message}</p>
        </div>

        <div className="flex gap-2 justify-center pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Annuler
          </Button>
          <Button variant={variant} onClick={onConfirm} type="button">
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Sous-composant: Carte de statistiques
const StatsCard = ({ title, value, icon, color = "blue", trend = null }) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`${colors[color]} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

// Sous-composant: Historique des livraisons
const DeliveryHistory = ({ deliveries }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'delivered': { type: 'success', text: 'Livrée' },
      'in_progress': { type: 'info', text: 'En cours' },
      'pending': { type: 'warning', text: 'En attente' },
      'cancelled': { type: 'error', text: 'Annulée' },
    };
    
    const statusInfo = statusMap[status] || { type: 'default', text: status };
    return <Badge type={statusInfo.type}>{statusInfo.text}</Badge>;
  };

  return (
    <Card title="Livraisons du livreur">
      {deliveries.length === 0 ? (
        <div className="text-center py-8">
          <FiPackage className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-600">Aucune livraison pour ce livreur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    Livraison #{delivery._id?.slice(-6) || delivery.id?.slice(-6) || index + 1}
                  </span>
                  {getStatusBadge(delivery.status)}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Client: {delivery.clientInfo?.name || 'N/A'}</p>
                  <p className="flex items-center gap-1">
                    <FiClock size={12} /> {formatDate(delivery.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">{delivery.totalAmount?.toLocaleString() || '0'} FCFA</p>
                <p className="text-xs text-gray-500">
                  {delivery.packages?.length || 0} colis
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// Composant principal: Détails du livreur
const DeliveryManDetails = ({ deliveryMan, deliveryManId, onBack, onUpdate }) => {
  // États
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliveryManData, setDeliveryManData] = useState(null);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Charger les données
  useEffect(() => {
    if (deliveryMan || deliveryManId) {
      fetchDeliveryManData();
    }
  }, [deliveryMan, deliveryManId]);

  const fetchDeliveryManData = async () => {
    setLoading(true);
    setError('');
    
    try {
      let deliveryManIdToUse = null;
      
      // Déterminer l'ID à utiliser
      if (deliveryMan && deliveryMan._id) {
        deliveryManIdToUse = deliveryMan._id;
      } else if (deliveryManId) {
        deliveryManIdToUse = deliveryManId;
      } else if (deliveryMan && deliveryMan.id) {
        deliveryManIdToUse = deliveryMan.id;
      }

      // Si on a directement l'objet deliveryMan complet, on l'utilise
      if (deliveryMan && deliveryMan._id) {
        setDeliveryManData(deliveryMan);
        
        // Essayer de charger l'historique des livraisons si l'endpoint existe
        if (deliveryMan._id) {
          try {
            const historyResponse = await apiRequest(`/admin/delivery-men/${deliveryMan._id}/deliveries`);
            setDeliveryHistory(historyResponse.data || historyResponse || []);
          } catch (historyError) {
            console.warn('Endpoint des livraisons non disponible, utilisation des données par défaut');
            // Si l'endpoint n'existe pas, utiliser des données vides
            setDeliveryHistory([]);
          }
        }
      } 
      // Sinon, récupérer par ID
      else if (deliveryManIdToUse) {
        const response = await apiRequest(`/admin/delivery-men/${deliveryManIdToUse}`);
        setDeliveryManData(response.data || response);
        
        // Essayer de charger l'historique des livraisons
        try {
          const historyResponse = await apiRequest(`/admin/delivery-men/${deliveryManIdToUse}/deliveries`);
          setDeliveryHistory(historyResponse.data || historyResponse || []);
        } catch (historyError) {
          console.warn('Endpoint des livraisons non disponible');
          setDeliveryHistory([]);
        }
      } else {
        throw new Error('Aucun ID de livreur fourni');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur lors du chargement des données du livreur');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des actions
  const handleResetPassword = async () => {
    if (!deliveryManData?._id) return;
    
    setActionLoading(true);
    try {
      await apiRequest(`/admin/delivery-men/${deliveryManData._id}/reset-password`, {
        method: 'POST',
      });
      alert('Mot de passe réinitialisé à 0000');
      setShowResetPasswordModal(false);
    } catch (error) {
      alert('Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActivation = async () => {
    if (!deliveryManData?._id) return;
    
    setActionLoading(true);
    try {
      await apiRequest(`/admin/delivery-men/${deliveryManData._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isActive: !deliveryManData.isActive,
        }),
      });
      
      // Mettre à jour les données locales
      setDeliveryManData(prev => ({
        ...prev,
        isActive: !prev.isActive
      }));
      
      setShowDeactivateModal(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Erreur lors de la modification du statut');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deliveryManData?._id) return;
    
    setActionLoading(true);
    try {
      await apiRequest(`/admin/delivery-men/${deliveryManData._id}`, {
        method: 'DELETE',
      });
      
      alert('Livreur supprimé avec succès');
      if (onBack) onBack();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Erreur lors de la suppression du livreur');
    } finally {
      setActionLoading(false);
    }
  };

  // Calcul des statistiques
  const calculateStats = () => {
    const stats = {
      totalDeliveries: deliveryHistory.length,
      delivered: deliveryHistory.filter(d => d.status === 'delivered').length,
      inProgress: deliveryHistory.filter(d => d.status === 'in_progress' || d.status === 'assigned').length,
      cancelled: deliveryHistory.filter(d => d.status === 'cancelled').length,
      totalAmount: deliveryHistory.reduce((sum, d) => sum + (parseFloat(d.totalAmount) || 0), 0),
    };
    
    stats.successRate = stats.totalDeliveries > 0 
      ? Math.round((stats.delivered / stats.totalDeliveries) * 100)
      : 0;
    
    stats.averageDeliveryTime = 45; // En minutes (simulé)
    
    return stats;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !deliveryManData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
            <FiArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Détails du livreur</h2>
        </div>
        
        <Card>
          <div className="text-center py-12">
            <FiAlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
            <p className="text-gray-600 mb-4">{error || 'Livreur non trouvé'}</p>
            <Button variant="secondary" onClick={onBack}>
              Retour à la liste
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Détails du livreur</h2>
            <p className="text-gray-600">Gestion complète du livreur</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon="refresh"
            onClick={fetchDeliveryManData}
            disabled={actionLoading}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Section principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche: Informations du livreur */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte d'identité du livreur */}
          <Card>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo/avatar */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {deliveryManData.photo ? (
                    <img 
                      src={deliveryManData.photo} 
                      alt={deliveryManData.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <FaMotorcycle size={48} className="text-white" />
                  )}
                </div>
              </div>

              {/* Informations */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{deliveryManData.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        deliveryManData.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {deliveryManData.isActive ? '✅ Actif' : '❌ Inactif'}
                      </span>
                      <Badge type="primary">
                        Matricule: {deliveryManData.matricule || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <p className="text-sm text-gray-600">Membre depuis</p>
                    <p className="font-medium">
                      {deliveryManData.createdAt 
                        ? new Date(deliveryManData.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FiPhone className="text-gray-400" />
                      <span className="font-medium">Téléphone</span>
                    </div>
                    <p className="text-gray-700">{deliveryManData.phone || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="text-gray-400" />
                      <span className="font-medium">Dernière connexion</span>
                    </div>
                    <p className="text-gray-700">
                      {deliveryManData.lastLogin 
                        ? new Date(deliveryManData.lastLogin).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Jamais'}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`p-3 rounded-lg border ${deliveryManData.permit ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Permis</span>
                        {deliveryManData.permit ? (
                          <FiCheck className="text-green-600" />
                        ) : (
                          <FiX className="text-red-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {deliveryManData.permit ? 'Validé' : 'Manquant'}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${deliveryManData.cni ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">CNI</span>
                        {deliveryManData.cni ? (
                          <FiCheck className="text-green-600" />
                        ) : (
                          <FiX className="text-red-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {deliveryManData.cni ? 'Validée' : 'Manquante'}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${deliveryManData.contract ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Contrat</span>
                        {deliveryManData.contract ? (
                          <FiCheck className="text-green-600" />
                        ) : (
                          <FiX className="text-red-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {deliveryManData.contract ? 'Validé' : 'Manquant'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Livraisons totales"
              value={stats.totalDeliveries}
              icon={<FiPackage size={24} />}
              color="blue"
            />
            
            <StatsCard
              title="Taux de réussite"
              value={`${stats.successRate}%`}
              icon={<FiPercent size={24} />}
              color="green"
            />
            
            <StatsCard
              title="Montant total"
              value={`${stats.totalAmount.toLocaleString()} FCFA`}
              icon={<FiDollarSign size={24} />}
              color="purple"
            />
            
            <StatsCard
              title="Temps moyen"
              value={`${stats.averageDeliveryTime} min`}
              icon={<FiClock size={24} />}
              color="yellow"
            />
          </div>

          {/* Historique des livraisons */}
          <DeliveryHistory deliveries={deliveryHistory} />
        </div>

        {/* Colonne droite: Actions et informations */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <Card title="Actions rapides">
            <div className="space-y-2">
              <Button
                variant="primary"
                icon="edit"
                onClick={() => setShowEditForm(true)}
                className="w-full justify-start"
              >
                Modifier les informations
              </Button>
              
              <Button
                variant="secondary"
                icon="upload"
                onClick={() => setShowDocumentForm(true)}
                className="w-full justify-start"
              >
                Mettre à jour les documents
              </Button>
              
              <Button
                variant="secondary"
                icon="lock"
                onClick={() => setShowResetPasswordModal(true)}
                className="w-full justify-start"
              >
                Réinitialiser le mot de passe
              </Button>
              
              <Button
                variant={deliveryManData.isActive ? "warning" : "success"}
                icon={deliveryManData.isActive ? "x" : "check"}
                onClick={() => setShowDeactivateModal(true)}
                className="w-full justify-start"
              >
                {deliveryManData.isActive ? 'Désactiver le livreur' : 'Activer le livreur'}
              </Button>
              
              <Button
                variant="danger"
                icon="trash"
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce livreur ?')) {
                    handleDelete();
                  }
                }}
                className="w-full justify-start"
              >
                Supprimer définitivement
              </Button>
            </div>
          </Card>

          {/* Notes et informations */}
          <Card title="Notes">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {deliveryManData.notes || 'Aucune note pour ce livreur.'}
              </p>
              
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ajouter une note..."
                rows="3"
              />
              
              <Button variant="secondary" size="sm">
                Enregistrer la note
              </Button>
            </div>
          </Card>

          {/* Informations de contact */}
          <Card title="Coordonnées de contact">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiPhone className="text-gray-400" />
                <span className="font-medium">Téléphone principal</span>
              </div>
              <p className="text-gray-700">{deliveryManData.phone || 'N/A'}</p>
              
              {deliveryManData.email && (
                <>
                  <div className="flex items-center gap-2 mt-4">
                    <FiUser className="text-gray-400" />
                    <span className="font-medium">Email</span>
                  </div>
                  <p className="text-gray-700">{deliveryManData.email}</p>
                </>
              )}
              
              {deliveryManData.address && (
                <>
                  <div className="flex items-center gap-2 mt-4">
                    <FiMapPin className="text-gray-400" />
                    <span className="font-medium">Adresse</span>
                  </div>
                  <p className="text-gray-700">{deliveryManData.address}</p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showEditForm && deliveryManData._id && (
        <DeliveryManEditForm
          deliveryMan={deliveryManData}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            fetchDeliveryManData();
            if (onUpdate) onUpdate();
          }}
        />
      )}

      {showDocumentForm && deliveryManData._id && (
        <DocumentUpdateForm
          deliveryManId={deliveryManData._id}
          onClose={() => setShowDocumentForm(false)}
          onSuccess={() => {
            setShowDocumentForm(false);
            fetchDeliveryManData();
            if (onUpdate) onUpdate();
          }}
        />
      )}

      <ConfirmationModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        onConfirm={handleResetPassword}
        title="Réinitialiser le mot de passe"
        message="Êtes-vous sûr de vouloir réinitialiser le mot de passe de ce livreur ? Le nouveau mot de passe sera '0000'."
        confirmText="Réinitialiser"
        variant="warning"
      />

      <ConfirmationModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleToggleActivation}
        title={deliveryManData.isActive ? "Désactiver le livreur" : "Activer le livreur"}
        message={
          deliveryManData.isActive 
            ? "Êtes-vous sûr de vouloir désactiver ce livreur ? Il ne pourra plus recevoir de nouvelles livraisons."
            : "Êtes-vous sûr de vouloir activer ce livreur ? Il pourra à nouveau recevoir des livraisons."
        }
        confirmText={deliveryManData.isActive ? "Désactiver" : "Activer"}
        variant={deliveryManData.isActive ? "warning" : "success"}
      />
    </div>
  );
};

export default DeliveryManDetails;