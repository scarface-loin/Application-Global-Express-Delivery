/**
 * 🎯 CONSTANTES DE L'APPLICATION PARTENAIRE
 */

// Statuts de commande
export const STATUTS = {
  EN_ATTENTE_ATTRIBUTION: 'en_attente_attribution',
  EN_COURS: 'en_cours',
  LIVRE: 'livre',
  NON_LIVRE: 'non_livre',
  ANNULE: 'annule'
};

export const STATUT_LABELS = {
  [STATUTS.EN_ATTENTE_ATTRIBUTION]: "En attente d'attribution",
  [STATUTS.EN_COURS]: 'En cours de livraison',
  [STATUTS.LIVRE]: 'Livrée',
  [STATUTS.NON_LIVRE]: 'Non livrée',
  [STATUTS.ANNULE]: 'Annulée'
};

export const STATUT_COLORS = {
  [STATUTS.EN_ATTENTE_ATTRIBUTION]: { bg: 'bg-orange-100', text: 'text-orange-700' },
  [STATUTS.EN_COURS]: { bg: 'bg-blue-100', text: 'text-blue-700' },
  [STATUTS.LIVRE]: { bg: 'bg-green-100', text: 'text-green-700' },
  [STATUTS.NON_LIVRE]: { bg: 'bg-red-100', text: 'text-red-700' },
  [STATUTS.ANNULE]: { bg: 'bg-gray-100', text: 'text-gray-700' }
};

// Types de commande
export const TYPES_COMMANDE = {
  COURSE: 'course',
  EXPEDITION: 'expedition'
};

// Modes de paiement
export const MODES_PAIEMENT = {
  CASH: 'cash',
  MOBILE_MONEY: 'mobile_money',
  CARTE: 'carte'
};

// Constantes diverses
export const DEVISE = 'FCFA';
export const LOCALE = 'fr-FR';
export const STORAGE_KEY = 'partenaire_auth';
export const AUTO_REFRESH_DELAY = 30000; // 30 secondes