import React from 'react';
import { FiPackage, FiMapPin, FiClock, FiUser, FiBriefcase } from 'react-icons/fi';

export default function LivraisonCard({ livraison, onClick }) {
  const isPartenaire = livraison.origine === 'partenaire';

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer mb-3"
    >
      {/* Header Carte */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isPartenaire ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
            {isPartenaire ? <FiBriefcase size={18} /> : <FiPackage size={18} />}
          </div>
          <div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPartenaire ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
              {isPartenaire ? 'Partenaire' : 'Interne'}
            </span>
            <h3 className="font-bold text-gray-800 text-sm mt-0.5">{livraison.trackingNumber}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">{livraison.total.toLocaleString()} F</p>
          <p className="text-xs text-gray-500">{livraison.modePaiement}</p>
        </div>
      </div>

      {/* Détails */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <FiUser className="text-gray-400" size={16} />
          <span className="font-medium text-gray-800">{livraison.nomClient}</span>
        </div>
        <div className="flex items-start gap-2">
          <FiMapPin className="text-gray-400 mt-0.5" size={16} />
          <span>
            {livraison.quartier} 
            {livraison.ville && <span className="text-gray-400">, {livraison.ville}</span>}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <FiClock size={12} /> Reçu à {livraison.heureAttribution}
        </span>
        <span className="font-medium text-gray-400">
          {livraison.nbArticles} article(s)
        </span>
      </div>
    </div>
  );
}