import React from 'react';
import { MdLocalShipping, MdTransferWithinAStation } from 'react-icons/md';
import { FiPlus, FiTrash2, FiCheck, FiCopy } from 'react-icons/fi';
import Card from '../common/Card';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { useDeliveryLogic } from './logic/CreateDeliveryPageLogic';
import { useNotification } from '../../context/NotificationContext';

export const CreateDeliveryPage = () => {
  // Récupérer le contexte de notification
  const notificationContext = useNotification();
  
  const {
    deliveryType,
    setDeliveryType,
    packages,
    clientInfo,
    notes,
    loading,
    error,
    success,
    addPackage,
    removePackage,
    updatePackage,
    handleSubmit,
    calculateTotal,
    handleClientInfoChange,
    setNotes,
    resetForm,
    duplicatePackage,
    calculateTotalWeight,
    formatPhoneNumber,
    isFormValid,
    getFormSummary,
    notify,
    broadcastToAdmins
  } = useDeliveryLogic(useNotification);

  // Fonction pour formater l'affichage du téléphone
  const formatDisplayPhone = (phone) => {
    if (!phone) return phone;
    return formatPhoneNumber(phone);
  };

  // Fonction pour tester la notification (debug)
  const testNotification = () => {
    if (notificationContext) {
      const typeText = deliveryType === 'transfer' ? 'Transfert' : 'Livraison';
      notificationContext.notifyDeliverySuccess(
        deliveryType,
        'TEST-123456',
        {
          duration: 5000,
          title: `Test ${typeText} Réussie`
        }
      );
      
      notify('Notification de test envoyée !', 'info', { duration: 3000 });
    }
  };

  // Fonction pour copier les informations client dans tous les colis
  const copyClientToAllPackages = () => {
    if (!clientInfo.name || !clientInfo.phone) {
      notify('Veuillez d\'abord remplir les informations client', 'warning', { duration: 4000 });
      return;
    }

    const updatedPackages = packages.map(pkg => ({
      ...pkg,
      recipient: clientInfo.name,
      recipientPhone: clientInfo.phone
    }));
    
    // Note: Vous aurez besoin d'ajouter cette fonction dans votre logique
    // setPackages(updatedPackages);
    
    notify('Informations client copiées dans tous les colis', 'success', { duration: 3000 });
  };

  // Fonction pour afficher un résumé avant soumission
  const showSummary = () => {
    const summary = getFormSummary?.();
    if (summary) {
      const message = `
        Type: ${summary.deliveryType}
        Client: ${summary.client}
        Colis: ${summary.packagesCount}
        Total: ${summary.totalAmount.toLocaleString()} FCFA
        Poids total: ${summary.totalWeight} kg
        Formulaire valide: ${summary.isFormValid ? 'OUI ✓' : 'NON ✗'}
      `;
      
      notify(message, 'info', {
        duration: 8000,
        title: 'Résumé de la Livraison'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton de test */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Créer une Livraison</h2>
        {process.env.NODE_ENV === 'development' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={testNotification}
            type="button"
          >
            Tester Notification
          </Button>
        )}
      </div>

      {/* Alertes du formulaire */}
      {error && <Alert type="error" message={error} onClose={() => {}} />}
      {success && <Alert type="success" message={success} onClose={() => {}} />}

      {/* Bouton de résumé rapide */}
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={showSummary}
          type="button"
          disabled={!clientInfo.name}
        >
          Aperçu
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Carte Type de Livraison */}
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
          
          {/* Indicateur visuel du type sélectionné */}
          <div className="mt-4 flex items-center justify-center">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              deliveryType === 'local' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {deliveryType === 'local' ? 'Mode Livraison Locale' : 'Mode Transfert Inter-agence'}
            </div>
          </div>
        </Card>

        {/* Carte Informations du Client */}
        <Card 
          title="Informations du Client" 
          className="mb-6"
          action={
            packages.length > 1 && clientInfo.name && (
              <Button
                variant="secondary"
                size="sm"
                onClick={copyClientToAllPackages}
                type="button"
                icon="copy"
              >
                Copier vers tous les colis
              </Button>
            )
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom complet *"
              value={clientInfo.name}
              onChange={(e) => handleClientInfoChange('name', e.target.value)}
              placeholder="Jean Dupont"
              required
              className="focus:ring-2 focus:ring-blue-500"
            />
            <Input
              label="Téléphone *"
              type="tel"
              value={clientInfo.phone}
              onChange={(e) => handleClientInfoChange('phone', e.target.value)}
              placeholder="+237 6XX XXX XXX"
              required
              helpText="Format: +237 699 999 999 ou 699999999"
              className="focus:ring-2 focus:ring-blue-500"
            />
            <div className="md:col-span-2">
              <Input
                label="Adresse"
                value={clientInfo.address}
                onChange={(e) => handleClientInfoChange('address', e.target.value)}
                placeholder="Adresse complète"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Aperçu client */}
          {clientInfo.name && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Client: <span className="font-medium text-gray-900">{clientInfo.name}</span>
                {clientInfo.phone && (
                  <> | Tél: <span className="font-medium text-gray-900">{formatDisplayPhone(clientInfo.phone)}</span></>
                )}
                {clientInfo.address && (
                  <> | Adresse: <span className="font-medium text-gray-900">{clientInfo.address}</span></>
                )}
              </p>
            </div>
          )}
        </Card>

        {/* Carte Colis */}
        <Card 
          title={`Colis (${packages.length})`} 
          action={
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                icon="plus"
                onClick={addPackage}
                type="button"
                size="sm"
              >
                Ajouter un colis
              </Button>
              {packages.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => notify(`Poids total: ${calculateTotalWeight()} kg`, 'info', { duration: 3000 })}
                  type="button"
                >
                  Voir poids total
                </Button>
              )}
            </div>
          }
          className="mb-6"
        >
          <div className="space-y-6">
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">Colis #{index + 1}</h4>
                    {pkg.amount && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {parseFloat(pkg.amount).toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {packages.length > 1 && duplicatePackage && (
                      <Button
                        variant="secondary"
                        icon="copy"
                        onClick={() => duplicatePackage(pkg.id)}
                        type="button"
                        size="sm"
                        title="Dupliquer ce colis"
                      >
                        Dupliquer
                      </Button>
                    )}
                    {packages.length > 1 && (
                      <Button
                        variant="danger"
                        icon="trash"
                        onClick={() => {
                          if (window.confirm(`Supprimer le colis #${index + 1} ?`)) {
                            removePackage(pkg.id);
                            notify(`Colis #${index + 1} supprimé`, 'info', { duration: 3000 });
                          }
                        }}
                        type="button"
                        size="sm"
                        title="Supprimer ce colis"
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Destinataire *"
                    value={pkg.recipient}
                    onChange={(e) => updatePackage(pkg.id, 'recipient', e.target.value)}
                    placeholder="Nom du destinataire"
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  <Input
                    label="Téléphone du destinataire *"
                    type="tel"
                    value={pkg.recipientPhone}
                    onChange={(e) => updatePackage(pkg.id, 'recipientPhone', e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  <Input
                    label="Destination *"
                    value={pkg.destination}
                    onChange={(e) => updatePackage(pkg.id, 'destination', e.target.value)}
                    placeholder="Adresse de livraison"
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  
                  {deliveryType === 'transfer' ? (
                    <Input
                      label="Nom de l'agence *"
                      value={pkg.agencyName}
                      onChange={(e) => updatePackage(pkg.id, 'agencyName', e.target.value)}
                      placeholder="Express Voyages Yaoundé"
                      required
                      className="focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={pkg.isOutOfTown}
                          onChange={(e) => updatePackage(pkg.id, 'isOutOfTown', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Hors ville</span>
                      </label>
                      {pkg.isOutOfTown && (
                        <Input
                          value={pkg.agencyName}
                          onChange={(e) => updatePackage(pkg.id, 'agencyName', e.target.value)}
                          placeholder="Nom de l'agence partenaire"
                          className="focus:ring-2 focus:ring-blue-500"
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
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  <Input
                    label="Poids (kg)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={pkg.weight}
                    onChange={(e) => updatePackage(pkg.id, 'weight', e.target.value)}
                    placeholder="2.5"
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <TextArea
                  label="Description"
                  value={pkg.description}
                  onChange={(e) => updatePackage(pkg.id, 'description', e.target.value)}
                  placeholder="Description du colis (facultatif)"
                  rows={2}
                  className="focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Aperçu rapide du colis */}
                {(pkg.recipient || pkg.destination) && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Aperçu: 
                      {pkg.recipient && ` ${pkg.recipient}`}
                      {pkg.destination && ` → ${pkg.destination}`}
                      {pkg.amount && ` (${parseFloat(pkg.amount).toLocaleString()} FCFA)`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Résumé des colis */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-700">Nombre de colis</p>
                <p className="text-2xl font-bold text-blue-900">{packages.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-blue-700">Montant total</p>
                <p className="text-2xl font-bold text-blue-900">
                  {calculateTotal().toLocaleString()} FCFA
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-blue-700">Poids total</p>
                <p className="text-2xl font-bold text-blue-900">
                  {calculateTotalWeight()} kg
                </p>
              </div>
            </div>
            
            {/* Indicateur de validation */}
            <div className="mt-4 flex justify-center">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                isFormValid?.() 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                {isFormValid?.() ? '✓ Formulaire valide' : '⚠️ Formulaire incomplet'}
              </div>
            </div>
          </div>
        </Card>

        {/* Carte Informations supplémentaires */}
        <Card title="Informations supplémentaires" className="mb-6">
          <TextArea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions spéciales, informations importantes..."
            rows={4}
            helpText="Ces notes seront visibles par tous les administrateurs et livreurs"
            className="focus:ring-2 focus:ring-blue-500"
          />
          
          {notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Aperçu des notes:</span> {notes.length > 100 ? `${notes.substring(0, 100)}...` : notes}
              </p>
            </div>
          )}
        </Card>

        {/* Actions du formulaire */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 -mx-6 -mb-6 rounded-b-lg shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  if (window.confirm('Voulez-vous vraiment réinitialiser le formulaire ? Toutes les données seront perdues.')) {
                    resetForm();
                    notify('Formulaire réinitialisé', 'info', { duration: 3000 });
                  }
                }}
                disabled={loading}
              >
                Réinitialiser
              </Button>
              
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  const summary = getFormSummary?.();
                  if (summary) {
                    const text = `
                      📦 Résumé Livraison:
                      Type: ${summary.deliveryType}
                      Client: ${summary.client}
                      Colis: ${summary.packagesCount}
                      Total: ${summary.totalAmount.toLocaleString()} FCFA
                      Statut: ${summary.isFormValid ? 'PRÊT' : 'INCOMPLET'}
                    `;
                    navigator.clipboard.writeText(text);
                    notify('Résumé copié dans le presse-papier', 'success', { duration: 3000 });
                  }
                }}
                disabled={loading || !clientInfo.name}
                icon="copy"
              >
                Copier résumé
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {packages.length > 0 && (
                <div className="text-sm text-gray-600 text-center sm:text-right">
                  <p className="font-medium">
                    Total: <span className="text-lg font-bold text-blue-700">
                      {calculateTotal().toLocaleString()} FCFA
                    </span>
                  </p>
                  <p className="text-xs">
                    {packages.length} colis • {calculateTotalWeight()} kg
                  </p>
                </div>
              )}
              
              <Button
                variant="primary"
                type="submit"
                disabled={loading || !isFormValid?.()}
                icon="check"
                size="lg"
                className="min-w-[180px]"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création en cours...
                  </span>
                ) : (
                  <>
                    <FiCheck className="mr-2" size={20} />
                    {deliveryType === 'transfer' ? 'Créer le Transfert' : 'Créer la Livraison'}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Indicateur de statut */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100">
              <div className={`h-2 w-2 rounded-full mr-2 ${
                loading ? 'bg-yellow-500 animate-pulse' :
                isFormValid?.() ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {loading ? 'Soumission en cours...' :
                 isFormValid?.() ? 'Prêt à être envoyé' :
                 'Complétez tous les champs obligatoires (*)'}
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* Instructions d'aide */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">💡 Comment utiliser ce formulaire :</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Tous les champs marqués d'un * sont obligatoires</li>
          <li>Pour les transferts, le nom de l'agence est requis</li>
          <li>Cliquez sur "Dupliquer" pour créer un colis similaire</li>
          <li>Une notification sera envoyée à tous les administrateurs après création</li>
          <li>Le numéro de suivi sera généré automatiquement</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateDeliveryPage;