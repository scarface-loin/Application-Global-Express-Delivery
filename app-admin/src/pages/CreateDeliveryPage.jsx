import React, { useState } from 'react';
import { MdLocalShipping, MdTransferWithinAStation } from 'react-icons/md';
import { FiPlus, FiTrash2, FiCheck } from 'react-icons/fi';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import TextArea from '../components/common/TextArea';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import { apiRequest } from '../../services/api';

export const CreateDeliveryPage = () => {
  const [deliveryType, setDeliveryType] = useState('local');
  const [packages, setPackages] = useState([{ id: Date.now(), recipient: '', recipientPhone: '', destination: '', isOutOfTown: false, agencyName: '', amount: '', weight: '', description: '' }]);
  const [clientInfo, setClientInfo] = useState({ name: '', phone: '', address: '' });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addPackage = () => {
    setPackages([...packages, { id: Date.now(), recipient: '', recipientPhone: '', destination: '', isOutOfTown: false, agencyName: '', amount: '', weight: '', description: '' }]);
  };

  const removePackage = (id) => {
    if (packages.length > 1) {
      setPackages(packages.filter(pkg => pkg.id !== id));
    }
  };

  const updatePackage = (id, field, value) => {
    setPackages(packages.map(pkg => 
      pkg.id === id ? { ...pkg, [field]: value } : pkg
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const deliveryData = {
        deliveryType,
        clientInfo,
        packages: packages.map(pkg => ({
          recipient: pkg.recipient,
          recipientPhone: pkg.recipientPhone,
          destination: pkg.destination,
          isOutOfTown: deliveryType === 'transfer' ? true : pkg.isOutOfTown,
          agencyName: deliveryType === 'transfer' ? pkg.agencyName : undefined,
          amount: parseFloat(pkg.amount),
          weight: pkg.weight ? parseFloat(pkg.weight) : undefined,
          description: pkg.description || undefined,
        })),
        notes: notes || undefined,
      };

      const response = await apiRequest('/admin/deliveries', {
        method: 'POST',
        body: JSON.stringify(deliveryData),
      });

      setSuccess(`Livraison créée avec succès ! ID: ${response.id}`);
      // Réinitialiser le formulaire
      setPackages([{ id: Date.now(), recipient: '', recipientPhone: '', destination: '', isOutOfTown: false, agencyName: '', amount: '', weight: '', description: '' }]);
      setClientInfo({ name: '', phone: '', address: '' });
      setNotes('');
    } catch (err) {
      setError(err.message || 'Erreur lors de la création de la livraison');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return packages.reduce((total, pkg) => total + (parseFloat(pkg.amount) || 0), 0);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Créer une Livraison</h2>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <form onSubmit={handleSubmit}>
        <Card title="Type de Livraison" className="mb-6">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setDeliveryType('local')}
              className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                deliveryType === 'local'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <MdLocalShipping size={48} className="mb-3" />
              <span className="text-lg font-semibold">Livraison Locale</span>
              <span className="text-sm text-gray-600 mt-1">Dans la même ville</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType('transfer')}
              className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                deliveryType === 'transfer'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
              }`}
            >
              <MdTransferWithinAStation size={48} className="mb-3" />
              <span className="text-lg font-semibold">Transfert</span>
              <span className="text-sm text-gray-600 mt-1">Vers une agence extérieure</span>
            </button>
          </div>
        </Card>

        <Card title="Informations du Client" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom complet *"
              value={clientInfo.name}
              onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
              placeholder="Jean Dupont"
              required
            />
            <Input
              label="Téléphone *"
              type="tel"
              value={clientInfo.phone}
              onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
              placeholder="+237 6XX XXX XXX"
              required
            />
            <div className="md:col-span-2">
              <Input
                label="Adresse"
                value={clientInfo.address}
                onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>
          </div>
        </Card>

        <Card 
          title={`Colis (${packages.length})`} 
          action={
            <Button 
              variant="secondary" 
              icon="plus"
              onClick={addPackage}
              type="button"
            >
              Ajouter un colis
            </Button>
          }
          className="mb-6"
        >
          <div className="space-y-6">
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Colis #{index + 1}</h4>
                  {packages.length > 1 && (
                    <Button
                      variant="danger"
                      icon="trash"
                      onClick={() => removePackage(pkg.id)}
                      type="button"
                      size="sm"
                    >
                      Supprimer
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Destinataire *"
                    value={pkg.recipient}
                    onChange={(e) => updatePackage(pkg.id, 'recipient', e.target.value)}
                    placeholder="Nom du destinataire"
                    required
                  />
                  <Input
                    label="Téléphone du destinataire *"
                    type="tel"
                    value={pkg.recipientPhone}
                    onChange={(e) => updatePackage(pkg.id, 'recipientPhone', e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    required
                  />
                  <Input
                    label="Destination *"
                    value={pkg.destination}
                    onChange={(e) => updatePackage(pkg.id, 'destination', e.target.value)}
                    placeholder="Adresse de livraison"
                    required
                  />
                  
                  {deliveryType === 'transfer' ? (
                    <Input
                      label="Nom de l'agence *"
                      value={pkg.agencyName}
                      onChange={(e) => updatePackage(pkg.id, 'agencyName', e.target.value)}
                      placeholder="Express Voyages Yaoundé"
                      required
                    />
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <input
                          type="checkbox"
                          checked={pkg.isOutOfTown}
                          onChange={(e) => updatePackage(pkg.id, 'isOutOfTown', e.target.checked)}
                          className="mr-2"
                        />
                        Hors ville
                      </label>
                      {pkg.isOutOfTown && (
                        <Input
                          value={pkg.agencyName}
                          onChange={(e) => updatePackage(pkg.id, 'agencyName', e.target.value)}
                          placeholder="Nom de l'agence"
                        />
                      )}
                    </div>
                  )}
                  
                  <Input
                    label="Montant (FCFA) *"
                    type="number"
                    min="0"
                    step="50"
                    value={pkg.amount}
                    onChange={(e) => updatePackage(pkg.id, 'amount', e.target.value)}
                    placeholder="5000"
                    required
                  />
                  <Input
                    label="Poids (kg)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={pkg.weight}
                    onChange={(e) => updatePackage(pkg.id, 'weight', e.target.value)}
                    placeholder="2.5"
                  />
                </div>
                <TextArea
                  label="Description"
                  value={pkg.description}
                  onChange={(e) => updatePackage(pkg.id, 'description', e.target.value)}
                  placeholder="Description du colis (facultatif)"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total des colis: {packages.length}</span>
              <span className="text-xl font-bold text-blue-700">
                Total: {calculateTotal().toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </Card>

        <Card title="Informations supplémentaires" className="mb-6">
          <TextArea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions spéciales, informations importantes..."
          />
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              setPackages([{ id: Date.now(), recipient: '', recipientPhone: '', destination: '', isOutOfTown: false, agencyName: '', amount: '', weight: '', description: '' }]);
              setClientInfo({ name: '', phone: '', address: '' });
              setNotes('');
            }}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            icon="check"
          >
            {loading ? 'Création en cours...' : 'Créer la livraison'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateDeliveryPage;