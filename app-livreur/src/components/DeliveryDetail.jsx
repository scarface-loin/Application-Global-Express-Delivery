// components/DeliveryDetail.jsx
import React, { useState } from 'react';
import { MapPin, Phone, CheckCircle2, XCircle, Clock, Package, AlertCircle, X } from 'lucide-react';

const DeliveryDetail = ({ delivery, onBack, onUpdatePackage }) => {
  // État pour gérer la modale de rejet
  const [rejectingPackageId, setRejectingPackageId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Liste des raisons courantes pour gagner du temps
  const commonReasons = [
    "Client absent",
    "Refus de payer",
    "Colis endommagé",
    "Mauvaise commande",
    "Adresse introuvable"
  ];

  const handlePackageAction = async (packageId, newStatus) => {
    // Si c'est une livraison réussie, on procède directement
    if (newStatus === 'delivered') {
      await onUpdatePackage(delivery.id, packageId, newStatus);
    } 
    // Si c'est un rejet ('failed'), on ouvre la modale pour demander la raison
    else if (newStatus === 'failed') {
      setRejectingPackageId(packageId);
      setRejectionReason('');
    }
  };

  const confirmRejection = async () => {
    if (!rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      // On passe le statut 'failed' et la raison
      await onUpdatePackage(delivery.id, rejectingPackageId, 'failed', rejectionReason);
      
      // Réinitialiser l'état après succès
      setRejectingPackageId(null);
      setRejectionReason('');
    } catch (error) {
      console.error("Erreur lors du rejet", error);
      // Optionnel: Afficher une alerte à l'utilisateur
    } finally {
      setIsSubmitting(false);
    }
  };

  const allDelivered = delivery.packages.every(p => p.status === 'delivered');
  const allProcessed = delivery.packages.every(p => p.status !== 'pending');

  return (
    <>
      <div className={`h-full overflow-y-auto ${rejectingPackageId ? 'overflow-hidden' : ''}`} style={{ backgroundColor: '#f2f2f7' }}>
        {/* Header iOS-style */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-gray-200/50">
          <div className="px-4 pt-14 pb-3">
            <button 
              onClick={onBack} 
              className="flex items-center -ml-2 px-2 py-1 active:opacity-50 transition-opacity"
              style={{ WebkitTapHighlightColor: 'transparent', color: '#667eea' }}
            >
              <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-base">Retour</span>
            </button>
          </div>
        </div>

        <div className="px-4 pt-4 pb-24">
          {/* Info client card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{delivery.clientName}</h1>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-9 h-9 rounded-full flex items-center justify-center mr-3 flex-shrink-0" style={{ backgroundColor: '#f0f0f5' }}>
                  <MapPin size={18} style={{ color: '#667eea' }} />
                </div>
                <div className="flex-1 pt-1.5">
                  <p className="text-sm text-gray-500 mb-0.5">Adresse</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{delivery.address}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-9 h-9 rounded-full flex items-center justify-center mr-3 flex-shrink-0" style={{ backgroundColor: '#f0f0f5' }}>
                  <Phone size={18} style={{ color: '#667eea' }} />
                </div>
                <div className="flex-1 pt-1.5">
                  <p className="text-sm text-gray-500 mb-0.5">Téléphone</p>
                  <a href={`tel:${delivery.phone}`} className="text-sm font-medium" style={{ color: '#667eea' }}>
                    {delivery.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Status banner */}
          {allProcessed && (
            <div className={`rounded-2xl p-4 mb-4 ${
              allDelivered 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-center">
                {allDelivered ? (
                  <CheckCircle2 className="text-green-600 mr-3 flex-shrink-0" size={22} />
                ) : (
                  <Clock className="text-orange-600 mr-3 flex-shrink-0" size={22} />
                )}
                <div>
                  <p className={`font-semibold text-sm ${allDelivered ? 'text-green-900' : 'text-orange-900'}`}>
                    {allDelivered ? 'Livraison terminée' : 'Livraison partielle'}
                  </p>
                  <p className={`text-xs ${allDelivered ? 'text-green-700' : 'text-orange-700'}`}>
                    {allDelivered ? 'Tous les colis livrés' : 'Certains colis rejetés'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Packages list */}
          <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">
            Colis ({delivery.packages.length})
          </h2>

          <div className="space-y-3">
            {delivery.packages.map(pkg => (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all ${
                  pkg.status === 'delivered' ? 'opacity-60' : ''
                }`}
              >
                <div className="mb-3">
                  <div className="flex items-center mb-2 flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ 
                      backgroundColor: '#f0f0f5',
                      color: '#667eea'
                    }}>
                      {pkg.reference}
                    </span>
                    {pkg.status === 'delivered' && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        ✓ Livré
                      </span>
                    )}
                    {/* MODIFIÉ ICI: On vérifie le statut 'failed' */}
                    {pkg.status === 'failed' && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                        ✗ Rejeté
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">{pkg.description}</p>
                  <div className="flex items-center text-xl font-bold" style={{ color: '#667eea' }}>
                    <span className="mr-1">₣</span>
                    {pkg.amount.toLocaleString('fr-FR')} FCFA
                  </div>
                  {/* MODIFIÉ ICI: On vérifie le statut 'failed' pour afficher la raison */}
                  {pkg.status === 'failed' && pkg.rejectionReason && (
                    <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                      Motif: {pkg.rejectionReason}
                    </p>
                  )}
                </div>

                {pkg.status === 'pending' && (
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handlePackageAction(pkg.id, 'delivered')}
                      className="flex-1 bg-green-500 text-white py-3.5 rounded-xl font-semibold active:bg-green-600 transition-colors flex items-center justify-center shadow-sm"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <CheckCircle2 size={19} className="mr-2" />
                      Livré
                    </button>
                    <button
                      // MODIFIÉ ICI: On envoie 'failed' au clic
                      onClick={() => handlePackageAction(pkg.id, 'failed')}
                      className="flex-1 bg-red-500 text-white py-3.5 rounded-xl font-semibold active:bg-red-600 transition-colors flex items-center justify-center shadow-sm"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <XCircle size={19} className="mr-2" />
                      Rejeté
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODALE DE REJET (Aucun changement nécessaire ici) */}
      {rejectingPackageId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-6 sm:p-6">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setRejectingPackageId(null)}
          ></div>

          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <AlertCircle size={20} className="text-red-500 mr-2" />
                  Motif du rejet
                </h3>
                <button 
                  onClick={() => setRejectingPackageId(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélection rapide
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {commonReasons.map(reason => (
                    <button
                      key={reason}
                      onClick={() => setRejectionReason(reason)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        rejectionReason === reason
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Précisions
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Expliquez pourquoi le colis est rejeté..."
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm min-h-[100px]"
                  autoFocus
                />
              </div>

              <button
                onClick={confirmRejection}
                disabled={!rejectionReason.trim() || isSubmitting}
                className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-sm flex items-center justify-center transition-all ${
                  !rejectionReason.trim() || isSubmitting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-500 active:bg-red-600'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi...
                  </span>
                ) : (
                  'Confirmer le rejet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeliveryDetail;