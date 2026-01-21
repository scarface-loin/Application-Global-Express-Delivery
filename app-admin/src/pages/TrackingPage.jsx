import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Badge from '../components/common/Badge';
import { apiRequest } from '../../services/api';

export const TrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError('');
    setTrackingResult(null);

    try {
      const response = await apiRequest(`/admin/track/${trackingNumber}`);
      setTrackingResult(response);
    } catch (err) {
      setError(err.message || 'Numéro de suivi introuvable');
    } finally {
      setLoading(false);
    }
  };

  const getPackageStatus = (status) => {
    const statusMap = {
      'pending': { text: 'En attente', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      'picked_up': { text: 'Récupéré', color: 'text-blue-600', bg: 'bg-blue-100' },
      'in_transit': { text: 'En transit', color: 'text-purple-600', bg: 'bg-purple-100' },
      'at_agency': { text: 'À l\'agence', color: 'text-indigo-600', bg: 'bg-indigo-100' },
      'transferred': { text: 'Transféré', color: 'text-teal-600', bg: 'bg-teal-100' },
      'delivered': { text: 'Livré', color: 'text-green-600', bg: 'bg-green-100' },
      'failed': { text: 'Échec', color: 'text-red-600', bg: 'bg-red-100' },
    };
    return statusMap[status] || { text: status, color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const getDeliveryStatus = (status) => {
    const statusMap = {
      'pending': { text: 'En attente', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      'assigned': { text: 'Assignée', color: 'text-blue-600', bg: 'bg-blue-100' },
      'accepted': { text: 'Acceptée', color: 'text-indigo-600', bg: 'bg-indigo-100' },
      'in_progress': { text: 'En cours', color: 'text-purple-600', bg: 'bg-purple-100' },
      'transferred': { text: 'Transférée', color: 'text-teal-600', bg: 'bg-teal-100' },
      'delivered': { text: 'Livrée', color: 'text-green-600', bg: 'bg-green-100' },
      'cancelled': { text: 'Annulée', color: 'text-red-600', bg: 'bg-red-100' },
    };
    return statusMap[status] || { text: status, color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Suivi de Colis</h2>

      <Card>
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de suivi
            </label>
            <div className="flex gap-2">
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Entrez le numéro de suivi (ex: GE1K7M9P2X5A)"
                className="flex-1"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !trackingNumber.trim()}
                icon="search"
              >
                {loading ? 'Recherche...' : 'Suivre'}
              </Button>
            </div>
          </div>
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        </form>
      </Card>

      {trackingResult && (
        <Card title="Résultat du suivi">
          <div className="space-y-6">
            {/* Informations de la livraison */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Informations de la livraison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID Livraison</p>
                  <p className="font-medium">{trackingResult.delivery?.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">
                    {trackingResult.delivery?.deliveryType === 'local' ? 'Livraison Locale' : 'Transfert'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getDeliveryStatus(trackingResult.delivery?.status).bg
                  } ${getDeliveryStatus(trackingResult.delivery?.status).color}`}>
                    {getDeliveryStatus(trackingResult.delivery?.status).text}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Livreur</p>
                  <p className="font-medium">{trackingResult.delivery?.deliveryManName || 'Non assigné'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-medium">
                    {new Date(trackingResult.delivery?.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Informations du colis */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Informations du colis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Numéro de suivi</p>
                  <p className="font-medium">{trackingResult.package?.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getPackageStatus(trackingResult.package?.status).bg
                  } ${getPackageStatus(trackingResult.package?.status).color}`}>
                    {getPackageStatus(trackingResult.package?.status).text}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Destinataire</p>
                  <p className="font-medium">{trackingResult.package?.recipient}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{trackingResult.package?.recipientPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-medium">{trackingResult.package?.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-medium">{trackingResult.package?.amount?.toLocaleString()} FCFA</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-medium">{trackingResult.package?.description || 'Aucune description'}</p>
                </div>
              </div>
            </div>

            {/* Timeline du statut */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Historique du statut</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Colis créé</p>
                    <p className="text-sm text-gray-600">
                      {new Date(trackingResult.delivery?.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrackingPage;