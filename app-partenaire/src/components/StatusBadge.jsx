/**
 * 🏷️ COMPOSANT StatusBadge - Badge de statut (Optimisé Android)
 */

import React from 'react';
import { STATUT_LABELS, STATUT_COLORS } from '../constants';

export default function StatusBadge({ statut }) {
  if (!statut) return null;

  const colors = STATUT_COLORS[statut] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  const label = STATUT_LABELS[statut] || statut;
  
  const icon = statut === 'livre' ? '✓' : 
               statut === 'non_livre' ? '✗' :
               statut === 'en_cours' ? '🚚' : null;

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${colors.bg} ${colors.text} shadow-sm`}>
      {icon && <span className="text-base">{icon}</span>}
      <span className="leading-none">{label}</span>
    </span>
  );
}