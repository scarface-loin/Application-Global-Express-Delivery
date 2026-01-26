import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiCheck, FiUser, FiPackage, FiMapPin, FiPhone, FiClock } from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import { apiRequest } from '../../services/api';

const AssignDeliveryPage = ({ deliveryId, onBack, onSuccess }) => {
  const [delivery, setDelivery] = useState(null);
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, [deliveryId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer les détails de la livraison
      const deliveryResponse = await apiRequest(`/admin/deliveries/${deliveryId}`);
      setDelivery(deliveryResponse.data || deliveryResponse);
      
      // Récupérer tous les livreurs
      const deliveryMenResponse = await apiRequest('/admin/delivery-men');
      const allDeliveryMen = deliveryMenResponse.data || deliveryMenResponse || [];
      
      // Filtrer seulement les livreurs actifs
      const activeDeliveryMen = allDeliveryMen.filter(dm => dm.isActive !== false);
      setDeliveryMen(activeDeliveryMen);
      
      // Pré-sélectionner si déjà assigné
      if (deliveryResponse.data?.deliveryMan || deliveryResponse.deliveryMan) {
        setSelectedDeliveryMan(deliveryResponse.data?.deliveryMan?._id || deliveryResponse.deliveryMan?._id);
      }
    } catch (error) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDeliveryMan) {
      setError('Veuillez sélectionner un livreur');
      return;
    }

    setAssigning(true);
    setError('');
    
    try {
      // Utiliser l'endpoint fourni
      await apiRequest(`/admin/deliveries/${deliveryId}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          deliveryManId: selectedDeliveryMan
        })
      });
      
      setSuccess('Livraison assignée avec succès au livreur');
      
      // Recharger les données pour voir la mise à jour
      setTimeout(() => {
        fetchData();
      }, 1000);
      
      // Optionnel : retour automatique après 2 secondes
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Erreur d\'assignation:', error);
      setError(error.message || 'Erreur lors de l\'assignation de la livraison');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const deliveryData = delivery?.data || delivery;
  const deliveryManId = selectedDeliveryMan;
  const selectedDeliveryManData = deliveryMen.find(dm => dm._id === deliveryManId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <FiArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Assigner une Livraison</h2>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations de la livraison */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Détails de la Livraison">
            {deliveryData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FiPackage className="text-blue-500" />
                      <span className="font-medium">ID Livraison</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      #{deliveryData._id?.slice(-8) || deliveryId?.slice(-8)}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FiClock className="text-gray-500" />
                      <span className="font-medium">Statut actuel</span>
                    </div>
                    <Badge type={
                      deliveryData.status === 'pending' ? 'warning' :
                      deliveryData.status === 'assigned' ? 'info' :
                      deliveryData.status === 'in_progress' ? 'primary' :
                      deliveryData.status === 'delivered' ? 'success' : 'default'
                    }>
                      {deliveryData.status || 'En attente'}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Informations du Client</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nom</p>
                      <p className="font-medium">{deliveryData.clientInfo?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="font-medium">{deliveryData.clientInfo?.phone || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Adresse</p>
                      <p className="font-medium">{deliveryData.clientInfo?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Colis à livrer</h3>
                  <div className="space-y-3">
                    {deliveryData.packages?.map((pkg, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">Colis #{index + 1}</span>
                          <span className="text-sm font-medium text-blue-600">
                            {parseFloat(pkg.amount || 0).toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <FiUser size={14} className="text-gray-400" />
                            <span>Destinataire: {pkg.recipient}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiPhone size={14} className="text-gray-400" />
                            <span>Téléphone: {pkg.recipientPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiMapPin size={14} className="text-gray-400" />
                            <span>Destination: {pkg.destination}</span>
                          </div>
                          {pkg.description && (
                            <p className="text-gray-600 mt-2">{pkg.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total des colis: {deliveryData.packages?.length || 0}</span>
                      <span className="text-lg font-bold text-blue-700">
                        Total: {parseFloat(deliveryData.totalAmount || 0).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>

                {deliveryData.notes && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg">
                      {deliveryData.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Sélection du livreur */}
        <div className="space-y-6">
          <Card title="Sélection du Livreur">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choisissez un livreur actif
                </label>
                
                {deliveryMen.length === 0 ? (
                  <div className="text-center py-8">
                    <FiUser className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600 mb-2">Aucun livreur disponible</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Tous les livreurs sont inactifs ou occupés
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => window.location.hash = '#deliverymen'}
                      className="w-full"
                    >
                      Gérer les livreurs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {deliveryMen.map(dm => (
                      <div
                        key={dm._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedDeliveryMan === dm._id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedDeliveryMan(dm._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FiUser className="text-blue-500" />
                              <p className="font-medium">{dm.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                dm.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {dm.isActive ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              <p className="text-gray-600">
                                <FiPhone size={12} className="inline mr-1" />
                                {dm.phone}
                              </p>
                              <p className="text-gray-600">
                                Matricule: {dm.matricule}
                              </p>
                            </div>
                            
                            <div className="flex gap-2 mt-3">
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                Livraisons: {dm.stats?.totalDeliveries || 0}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                Taux: {dm.stats?.successRate || 0}%
                              </span>
                            </div>
                          </div>
                          
                          {selectedDeliveryMan === dm._id && (
                            <div className="ml-2">
                              <FiCheck className="text-green-500" size={20} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedDeliveryManData && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Sélectionné:</span> {selectedDeliveryManData.name}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {selectedDeliveryManData.phone}
                  </p>
                </div>
              )}

              {deliveryMen.length > 0 && (
                <div className="pt-4 border-t">
                  <Button
                    variant="primary"
                    onClick={handleAssign}
                    disabled={!selectedDeliveryMan || assigning}
                    className="w-full justify-center"
                    icon="check"
                  >
                    {assigning ? 'Assignation en cours...' : 'Assigner la livraison'}
                  </Button>
                  
                  {deliveryData?.deliveryMan && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Cette livraison est déjà assignée à {deliveryData.deliveryMan.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card title="Instructions">
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-start gap-2">
                <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Le livreur recevra une notification</span>
              </p>
              <p className="flex items-start gap-2">
                <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Le statut passera à "assignée"</span>
              </p>
              <p className="flex items-start gap-2">
                <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Vous pouvez suivre l'avancement dans la liste</span>
              </p>
              <p className="flex items-start gap-2">
                <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Le livreur pourra accepter/refuser via son app</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignDeliveryPage;