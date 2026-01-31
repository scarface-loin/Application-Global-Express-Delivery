/**
 * 🎴 COMPOSANT CommandeCard - Carte de commande pour la liste (Optimisé Android)
 */

import React from 'react';
import { FiPackage, FiMapPin, FiClock } from 'react-icons/fi';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDate } from '../services/utils';

export default function CommandeCard({ commande, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl active:shadow-lg transition-all cursor-pointer border-2 border-gray-100 active:border-purple-300 touch-manipulation min-h-[160px]"
    >
      {/* En-tête avec icône et statut */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-sm">
            <FiPackage className="text-purple-600" size={24} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base">{commande.numeroSuivi}</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {commande.type === 'course' ? 'Course' : 'Expédition'}
            </p>
          </div>
        </div>
        <StatusBadge statut={commande.statut} />
      </div>

      {/* Informations de localisation et date */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 text-base text-gray-700">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <FiMapPin size={18} className="text-gray-500" />
          </div>
          <span className="font-medium truncate">
            {commande.quartier || commande.villeDestination || 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-base text-gray-700">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <FiClock size={18} className="text-gray-500" />
          </div>
          <span className="font-medium">{formatDate(commande.dateCreation, 'heure')}</span>
        </div>
      </div>

      {/* Footer avec articles et prix */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-purple-50 rounded-lg">
            <span className="text-sm font-semibold text-purple-700">
              {commande.nbArticles} article{commande.nbArticles > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <span className="text-xl font-bold text-purple-700">{formatCurrency(commande.total)}</span>
      </div>

      <style jsx>{`
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}