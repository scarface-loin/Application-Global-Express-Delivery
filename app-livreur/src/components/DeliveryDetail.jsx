// components/DeliveryDetail.jsx
import React from 'react';
import { MapPin, Phone, CheckCircle2, XCircle, Clock, Package } from 'lucide-react';

const DeliveryDetail = ({ delivery, onBack, onUpdatePackage }) => {
  const handlePackageAction = async (packageId, newStatus) => {
    await onUpdatePackage(delivery.id, packageId, newStatus);
  };

  const allDelivered = delivery.packages.every(p => p.status === 'delivered');
  const allProcessed = delivery.packages.every(p => p.status !== 'pending');

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#f2f2f7' }}>
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
                  {pkg.status === 'rejected' && (
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
                    onClick={() => handlePackageAction(pkg.id, 'rejected')}
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
  );
};

export default DeliveryDetail;