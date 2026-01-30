/**
 * 🛠️ UTILITAIRES - Formatage, Validation, Helpers
 */

import { DEVISE, LOCALE } from '../constants';

// ==================== FORMATAGE ====================

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return `0 ${DEVISE}`;
  return `${Number(amount).toLocaleString(LOCALE)} ${DEVISE}`;
};

export const formatDate = (date, type = 'complet') => {
  if (!date) return '--';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = type === 'heure' 
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
  
  return dateObj.toLocaleString(LOCALE, options);
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('+237') && cleaned.length === 13) {
    const num = cleaned.substring(4);
    return `+237 ${num.substring(0, 3)} ${num.substring(3, 6)} ${num.substring(6)}`;
  }
  return cleaned;
};

export const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// ==================== VALIDATION ====================

export const validatePhoneNumber = (phone) => {
  if (!phone) return { isValid: false, error: 'Numéro requis' };
  const cleaned = phone.replace(/\s+/g, '');
  const regex = /^\+?237\s?6\d{8}$/;
  if (!regex.test(cleaned)) {
    return { isValid: false, error: 'Numéro invalide (format: +237 6XX XXX XXX)' };
  }
  return { isValid: true };
};

export const validateTextField = (value, fieldName = 'Ce champ') => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} est requis` };
  }
  return { isValid: true };
};

export const validateAmount = (amount) => {
  if (!amount || isNaN(amount) || amount < 0) {
    return { isValid: false, error: 'Montant invalide' };
  }
  return { isValid: true };
};

export const validateCourseForm = (formData, articles) => {
  const errors = {};
  
  if (!formData.quartier?.trim()) errors.quartier = 'Quartier requis';
  
  const phoneValidation = validatePhoneNumber(formData.numeroDestinataire);
  if (!phoneValidation.isValid) errors.numeroDestinataire = phoneValidation.error;
  
  const coutValidation = validateAmount(formData.coutLivraison);
  if (!coutValidation.isValid) errors.coutLivraison = coutValidation.error;
  
  if (!articles || articles.length === 0) {
    errors.articles = 'Ajoutez au moins un article';
  } else {
    articles.forEach((art, i) => {
      if (!art.nom?.trim()) errors[`article_${i}_nom`] = 'Nom requis';
      if (!art.quantite || art.quantite < 1) errors[`article_${i}_quantite`] = 'Quantité invalide';
      if (!art.cout || art.cout < 0) errors[`article_${i}_cout`] = 'Coût invalide';
    });
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateExpeditionForm = (formData, articles) => {
  const errors = {};
  
  if (!formData.nomClient?.trim()) errors.nomClient = 'Nom client requis';
  if (!formData.villeDestination?.trim()) errors.villeDestination = 'Ville requise';
  
  const phoneValidation = validatePhoneNumber(formData.contactClient);
  if (!phoneValidation.isValid) errors.contactClient = phoneValidation.error;
  
  const coutValidation = validateAmount(formData.coutExpedition);
  if (!coutValidation.isValid) errors.coutExpedition = coutValidation.error;
  
  if (!articles || articles.length === 0) {
    errors.articles = 'Ajoutez au moins un article';
  } else {
    articles.forEach((art, i) => {
      if (!art.nom?.trim()) errors[`article_${i}_nom`] = 'Nom requis';
      if (!art.quantite || art.quantite < 1) errors[`article_${i}_quantite`] = 'Quantité invalide';
      if (!art.cout || art.cout < 0) errors[`article_${i}_cout`] = 'Coût invalide';
    });
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

// ==================== HELPERS ====================

export const generateTrackingNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TRK-${timestamp}-${random}`;
};

export const calculateTotal = (articles, coutPrestation) => {
  const totalArticles = articles.reduce((sum, art) => {
    return sum + (parseFloat(art.quantite) * parseFloat(art.cout));
  }, 0);
  return {
    totalArticles,
    coutPrestation: parseFloat(coutPrestation) || 0,
    totalGeneral: totalArticles + (parseFloat(coutPrestation) || 0)
  };
};

export const formatArticlesForFirebase = (articles) => {
  return articles.map((art, index) => ({
    id: index + 1,
    nom: art.nom.trim(),
    coutUnitaire: parseFloat(art.cout),
    quantiteCommandee: parseInt(art.quantite, 10),
    quantiteLivree: 0,
    quantiteRejetee: 0,
    motifRejet: null,
    totalLignePrevu: parseInt(art.quantite, 10) * parseFloat(art.cout)
  }));
};

export const filterCommandes = (commandes, filters) => {
  if (!filters) return commandes;
  
  return commandes.filter(cmd => {
    if (filters.statut && filters.statut !== 'tous' && cmd.statut !== filters.statut) {
      return false;
    }
    if (filters.type && filters.type !== 'tous' && cmd.type !== filters.type) {
      return false;
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matches = 
        cmd.numeroSuivi?.toLowerCase().includes(search) ||
        cmd.quartier?.toLowerCase().includes(search) ||
        cmd.villeDestination?.toLowerCase().includes(search);
      if (!matches) return false;
    }
    return true;
  });
};

export const extractStats = (commandes) => {
  const stats = {
    total: commandes.length,
    enAttente: 0,
    enCours: 0,
    livrees: 0,
    nonLivrees: 0,
    montantTotal: 0,
    montantLivre: 0
  };
  
  commandes.forEach(cmd => {
    stats.montantTotal += cmd.total || 0;
    
    switch (cmd.statut) {
      case 'en_attente_attribution':
        stats.enAttente++;
        break;
      case 'en_cours':
        stats.enCours++;
        break;
      case 'livre':
        stats.livrees++;
        stats.montantLivre += cmd.total || 0;
        break;
      case 'non_livre':
        stats.nonLivrees++;
        break;
    }
  });
  
  return stats;
};