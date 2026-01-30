/**
 * 🏷️ COMPOSANT StatusBadge - Badge de statut
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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}