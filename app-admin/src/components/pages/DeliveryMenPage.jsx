import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiCheck, FiAlertCircle, FiUpload, FiLock, FiRefreshCw, FiUsers} from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import { apiRequest, API_BASE_URL } from '../../services/api';

// ✅ Fonction utilitaire pour nettoyer les numéros de téléphone
const normalizePhone = (phone) => {
  // Enlève tout sauf les chiffres
  return phone.replace(/\D/g, '');
};

// Sous-composant: Formulaire de livreur
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
        // ✅ Nettoyer le téléphone avant envoi
        formDataToSend.append('phone', normalizePhone(formData.phone));
        formDataToSend.append('matricule', formData.matricule);
        
        if (files.permit) formDataToSend.append('permit', files.permit);
        if (files.cni) formDataToSend.append('cni', files.cni);
        if (files.contract) formDataToSend.append('contract', files.contract);

        const token = localStorage.getItem('token');
        // ✅ Utiliser API_BASE_URL importé au lieu de process.env
        const response = await fetch(`${API_BASE_URL}/admin/delivery-men`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Erreur lors de la création');
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
              placeholder="+237650802785 ou 650802785"
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
                className="w-full border border-gray-300 rounded-lg p-2"
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
                className="w-full border border-gray-300 rounded-lg p-2"
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
                className="w-full border border-gray-300 rounded-lg p-2"
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
      // ✅ Utiliser API_BASE_URL importé
      const response = await fetch(`${API_BASE_URL}/admin/delivery-men/${deliveryManId}/documents`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Erreur lors de la mise à jour');
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
            className="w-full border border-gray-300 rounded-lg p-2"
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
            className="w-full border border-gray-300 rounded-lg p-2"
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
            className="w-full border border-gray-300 rounded-lg p-2"
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

// Sous-composant: Détails du livreur
const DeliveryManDetails = ({ deliveryMan, onBack, onUpdate }) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!window.confirm('Réinitialiser le mot de passe de ce livreur ?')) return;

    setLoading(true);
    try {
      await apiRequest(`/admin/delivery-men/${deliveryMan._id}/reset-password`, {
        method: 'POST',
      });
      alert('Mot de passe réinitialisé à 0000');
    } catch (error) {
      alert('Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Désactiver ce livreur ?')) return;

    setLoading(true);
    try {
      await apiRequest(`/admin/delivery-men/${deliveryMan._id}`, {
        method: 'DELETE',
      });
      onUpdate();
      onBack();
    } catch (error) {
      alert('Erreur lors de la désactivation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          ← Retour
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Détails du livreur</h2>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">{deliveryMan.name}</h3>
              <p className="text-gray-600">{deliveryMan.phone}</p>
              <p className="text-gray-600">Matricule: {deliveryMan.matricule}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              deliveryMan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {deliveryMan.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Documents</h4>
            <div className="space-y-2">
              {/* Ces éléments sont fixes, pas besoin de key */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>Permis de conduire</span>
                <span className={deliveryMan.documents?.permit ? 'text-green-600' : 'text-red-600'}>
                  {deliveryMan.documents?.permit ? '✓ Validé' : '✗ Manquant'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>CNI</span>
                <span className={deliveryMan.documents?.cni ? 'text-green-600' : 'text-red-600'}>
                  {deliveryMan.documents?.cni ? '✓ Validé' : '✗ Manquant'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>Contrat</span>
                <span className={deliveryMan.documents?.contract ? 'text-green-600' : 'text-red-600'}>
                  {deliveryMan.documents?.contract ? '✓ Validé' : '✗ Manquant'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 flex flex-wrap gap-2">
            <Button
              variant="primary"
              icon="edit"
              onClick={() => setShowEditForm(true)}
            >
              Modifier
            </Button>
            <Button
              variant="secondary"
              icon="upload"
              onClick={() => setShowDocumentForm(true)}
            >
              Mettre à jour les documents
            </Button>
            <Button
              variant="secondary"
              icon="lock"
              onClick={handleResetPassword}
              disabled={loading}
            >
              Réinitialiser le mot de passe
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={handleDeactivate}
              disabled={loading}
            >
              Désactiver
            </Button>
          </div>
        </div>
      </Card>

      {showEditForm && (
        <DeliveryManForm
          deliveryMan={deliveryMan}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            onUpdate();
          }}
        />
      )}

      {showDocumentForm && (
        <DocumentUpdateForm
          deliveryManId={deliveryMan._id}
          onClose={() => setShowDocumentForm(false)}
          onSuccess={() => {
            setShowDocumentForm(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

// Composant principal: Page de gestion des livreurs
const DeliveryMenPage = ({ onNavigate }) => {
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  useEffect(() => {
    fetchDeliveryMen();
  }, []);

  const fetchDeliveryMen = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/admin/delivery-men');
      setDeliveryMen(response || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveryMen = deliveryMen.filter(dm => {
    const matchesSearch = searchTerm === '' || 
      dm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dm.phone.includes(searchTerm) ||
      dm.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
      (filterActive === 'active' && dm.isActive) ||
      (filterActive === 'inactive' && !dm.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (deliveryMan) => {
    setSelectedDeliveryMan(deliveryMan);
    if (onNavigate) {
      onNavigate('deliveryman-details', deliveryMan);
    }
  };

  if (selectedDeliveryMan) {
    return (
      <DeliveryManDetails
        deliveryMan={selectedDeliveryMan}
        onBack={() => setSelectedDeliveryMan(null)}
        onUpdate={() => {
          fetchDeliveryMen();
          setSelectedDeliveryMan(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Livreurs</h2>
        <Button
          variant="primary"
          icon="plus"
          onClick={() => setShowCreateForm(true)}
        >
          Nouveau Livreur
        </Button>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <div className="relative">
              <FiEye className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, téléphone, matricule..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs seulement</option>
              <option value="inactive">Inactifs seulement</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              icon="refresh"
              onClick={fetchDeliveryMen}
              disabled={loading}
              className="w-full"
            >
              Actualiser
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : filteredDeliveryMen.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FiUsers className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun livreur trouvé</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterActive !== 'all' 
                ? 'Aucun résultat ne correspond à votre recherche.' 
                : 'Commencez par ajouter un nouveau livreur.'}
            </p>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => setShowCreateForm(true)}
            >
              Ajouter un livreur
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeliveryMen.map((dm) => (
            <Card
              key={dm._id} // ✅ Cette key est correcte
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(dm)}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{dm.name}</h3>
                    <p className="text-sm text-gray-600">{dm.phone}</p>
                    <p className="text-xs text-gray-500 mt-1">Matricule: {dm.matricule}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    dm.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {dm.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Ces éléments sont fixes, pas besoin de key */}
                    <div className={`text-center p-2 rounded ${dm.documents?.permit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className="text-xs font-medium">Permis</div>
                      <div className="text-lg">{dm.documents?.permit ? '✓' : '✗'}</div>
                    </div>
                    <div className={`text-center p-2 rounded ${dm.documents?.cni ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className="text-xs font-medium">CNI</div>
                      <div className="text-lg">{dm.documents?.cni ? '✓' : '✗'}</div>
                    </div>
                    <div className={`text-center p-2 rounded ${dm.documents?.contract ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className="text-xs font-medium">Contrat</div>
                      <div className="text-lg">{dm.documents?.contract ? '✓' : '✗'}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-600">
                      Livraisons: <span className="font-medium">{dm.stats?.totalDeliveries || 0}</span>
                    </div>
                    <div className="text-gray-600">
                      Taux: <span className="font-medium">{dm.stats?.successRate || 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(dm);
                    }}
                  >
                    <FiEye className="mr-1" /> Voir
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Action assigner ici
                    }}
                  >
                    <FiCheck /> Assigner
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Statistiques */}
      {!loading && deliveryMen.length > 0 && (
        <Card title="Statistiques">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{deliveryMen.length}</div>
              <div className="text-sm text-gray-600">Total livreurs</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {deliveryMen.filter(dm => dm.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Actifs</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">
                {deliveryMen.filter(dm => !dm.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Inactifs</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {deliveryMen.filter(dm => dm.documents?.permit && dm.documents?.cni && dm.documents?.contract).length}
              </div>
              <div className="text-sm text-gray-600">Documents complets</div>
            </div>
          </div>
        </Card>
      )}

      {showCreateForm && (
        <DeliveryManForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            fetchDeliveryMen();
            setShowCreateForm(false);
          }}
        />
      )}
    </div>
  );
};

export default DeliveryMenPage;