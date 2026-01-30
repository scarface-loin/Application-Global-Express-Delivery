/**
 * 🎴 COMPOSANT CommandeCard - Carte de commande pour la liste
 */

import React from 'react';
import { FiPackage, FiMapPin, FiClock } from 'react-icons/fi';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDate } from '../services/utils';

export default function CommandeCard({ commande, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FiPackage className="text-purple-600" size={20} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{commande.numeroSuivi}</p>
            <p className="text-xs text-gray-600">{commande.type === 'course' ? 'Course' : 'Expédition'}</p>
          </div>
        </div>
        <StatusBadge statut={commande.statut} />
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <FiMapPin size={16} className="text-gray-400" />
          <span>{commande.quartier || commande.villeDestination || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <FiClock size={16} className="text-gray-400" />
          <span>{formatDate(commande.dateCreation, 'heure')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-600">{commande.nbArticles} article(s)</span>
        <span className="text-lg font-bold text-purple-700">{formatCurrency(commande.total)}</span>
      </div>
    </div>
  );
}