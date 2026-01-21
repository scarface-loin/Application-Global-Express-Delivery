import { useState } from 'react';
import { apiRequest } from '../../../services/api';

// Note: Vous devrez passer le hook useNotification en paramètre
// ou l'importer directement si le contexte est dans le même scope
// Pour cet exemple, je vais créer une version qui accepte le hook en paramètre

export const useDeliveryLogic = (useNotificationHook) => {
  // Initialiser les notifications si le hook est disponible
  let notificationContext = null;
  try {
    if (useNotificationHook) {
      notificationContext = useNotificationHook();
    }
  } catch (error) {
    console.log('Notification context not available:', error);
  }

  // États du formulaire
  const [deliveryType, setDeliveryType] = useState('local');
  const [packages, setPackages] = useState([{
    id: Date.now(),
    recipient: '',
    recipientPhone: '',
    destination: '',
    isOutOfTown: false,
    agencyName: '',
    amount: '',
    weight: '',
    description: ''
  }]);

  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fonction helper pour les notifications
  const notify = (message, type = 'success', options = {}) => {
    if (notificationContext) {
      switch (type) {
        case 'success':
          return notificationContext.notifySuccess(message, options);
        case 'error':
          return notificationContext.notifyError(message, options);
        case 'warning':
          return notificationContext.notifyWarning(message, options);
        case 'info':
          return notificationContext.notifyInfo(message, options);
        default:
          return notificationContext.addNotification({ message, type, ...options });
      }
    }
    return null;
  };

  // Fonction spécifique pour les notifications de livraison
  const notifyDelivery = (deliveryType, trackingNumber, options = {}) => {
    if (notificationContext && notificationContext.notifyDeliverySuccess) {
      return notificationContext.notifyDeliverySuccess(deliveryType, trackingNumber, options);
    }
    return null;
  };

  // Fonction pour simuler une notification WebSocket aux autres admins
  const broadcastToAdmins = (event, data) => {
    console.log(`[BROADCAST TO ADMINS] ${event}:`, data);

    // Simuler l'envoi aux autres administrateurs
    // Dans une vraie application, utiliseriez WebSocket ou SSE
    // Exemple : socket.emit('admin-event', { event, data });

    // Ici, on peut émettre un event personnalisé pour les autres onglets
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const eventData = {
          type: 'admin-notification',
          event,
          data,
          timestamp: new Date().toISOString(),
          source: `delivery-creator-${Date.now()}`
        };

        // Stocker dans localStorage pour la communication entre onglets
        localStorage.setItem('last-admin-notification', JSON.stringify(eventData));

        // Déclencher un event custom
        window.dispatchEvent(new CustomEvent('admin-notification', {
          detail: eventData
        }));
      } catch (e) {
        console.error('Error broadcasting to admins:', e);
      }
    }
  };

  // Gestion des colis
  const addPackage = () => {
    setPackages([...packages, {
      id: Date.now() + Math.random(),
      recipient: '',
      recipientPhone: '',
      destination: '',
      isOutOfTown: false,
      agencyName: '',
      amount: '',
      weight: '',
      description: ''
    }]);
  };

  const removePackage = (id) => {
    if (packages.length > 1) {
      setPackages(packages.filter(pkg => pkg.id !== id));
    }
  };

  const updatePackage = (id, field, value) => {
    setPackages(packages.map(pkg =>
      pkg.id === id ? { ...pkg, [field]: value } : pkg
    ));
  };

  // Gestion des informations client
  const handleClientInfoChange = (field, value) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
  };

  // Calcul du total
  const calculateTotal = () => {
    return packages.reduce((total, pkg) => {
      const amount = parseFloat(pkg.amount) || 0;
      return total + amount;
    }, 0);
  };

  // Réinitialisation du formulaire
  const resetForm = () => {
    setPackages([{
      id: Date.now(),
      recipient: '',
      recipientPhone: '',
      destination: '',
      isOutOfTown: false,
      agencyName: '',
      amount: '',
      weight: '',
      description: ''
    }]);
    setClientInfo({ name: '', phone: '', address: '' });
    setNotes('');
    setError('');
    setSuccess('');
  };

  // Validation des données
  const validateForm = () => {
    const errors = [];

    // Validation du client
    if (!clientInfo.name?.trim()) {
      errors.push('Le nom du client est requis');
    }

    if (!clientInfo.phone?.trim()) {
      errors.push('Le téléphone du client est requis');
    }

    // Validation du format de téléphone (cameroon format)
    const phoneRegex = /^(\+237)?[6-9][0-9]{8}$/;
    const cleanedPhone = clientInfo.phone.replace(/\s+/g, '');
    if (clientInfo.phone && !phoneRegex.test(cleanedPhone)) {
      errors.push('Le format du téléphone est invalide. Exemple: +237 699 999 999 ou 699999999');
    }

    // Validation des colis
    packages.forEach((pkg, index) => {
      const packageNumber = index + 1;

      if (!pkg.recipient?.trim()) {
        errors.push(`Le destinataire du colis #${packageNumber} est requis`);
      }

      if (!pkg.recipientPhone?.trim()) {
        errors.push(`Le téléphone du destinataire du colis #${packageNumber} est requis`);
      }

      // Validation du téléphone du destinataire
      const cleanedRecipientPhone = pkg.recipientPhone.replace(/\s+/g, '');
      if (pkg.recipientPhone && !phoneRegex.test(cleanedRecipientPhone)) {
        errors.push(`Le format du téléphone du destinataire #${packageNumber} est invalide`);
      }

      if (!pkg.destination?.trim()) {
        errors.push(`La destination du colis #${packageNumber} est requise`);
      }

      const amount = parseFloat(pkg.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Le montant du colis #${packageNumber} doit être un nombre supérieur à 0`);
      }

      if (amount > 10000000) { // 10 millions FCFA max
        errors.push(`Le montant du colis #${packageNumber} ne peut pas dépasser 10,000,000 FCFA`);
      }

      // Validation pour les transferts
      if (deliveryType === 'transfer' && !pkg.agencyName?.trim()) {
        errors.push(`Le nom de l'agence est requis pour le colis #${packageNumber} (transfert)`);
      }

      // Validation du poids si renseigné
      if (pkg.weight) {
        const weight = parseFloat(pkg.weight);
        if (isNaN(weight) || weight <= 0) {
          errors.push(`Le poids du colis #${packageNumber} doit être un nombre supérieur à 0`);
        }
        if (weight > 100) { // 100kg max
          errors.push(`Le poids du colis #${packageNumber} ne peut pas dépasser 100kg`);
        }
      }
    });

    // Validation du nombre de colis
    if (packages.length === 0) {
      errors.push('Au moins un colis est requis');
    }

    if (packages.length > 10) {
      errors.push('Vous ne pouvez pas créer plus de 10 colis à la fois');
    }

    return errors;
  };

  // Préparation des données pour l'API
  const prepareDeliveryData = () => {
    console.log('Préparation des données avec:', {
      deliveryType,
      clientInfo,
      packages,
      notes
    });

    const preparedPackages = packages.map(pkg => ({
      recipient: pkg.recipient?.trim() || '',
      recipientPhone: pkg.recipientPhone?.replace(/\s+/g, '') || '',
      destination: pkg.destination?.trim() || '',
      isOutOfTown: pkg.isOutOfTown || false,
      agencyName: pkg.agencyName?.trim() || '',
      amount: parseFloat(pkg.amount) || 0,
      weight: pkg.weight ? parseFloat(pkg.weight) : null,
      description: pkg.description?.trim() || ''
    }));

    // ← NE PAS INCLURE totalAmount, il est calculé côté serveur
    return {
      deliveryType,
      clientInfo: {
        name: clientInfo.name?.trim() || '',
        phone: clientInfo.phone?.replace(/\s+/g, '') || '',
        address: clientInfo.address?.trim() || ''
      },
      packages: preparedPackages,
      notes: notes?.trim() || ''
      // totalAmount: SUPPRIMÉ - calculé automatiquement côté backend
    };
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      console.log('Début de la soumission...');

      // Validation
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        const errorMessage = 'Erreurs de validation:\n• ' + validationErrors.join('\n• ');

        // Afficher notification d'erreur
        if (validationErrors.length === 1) {
          notify(validationErrors[0], 'error', { duration: 6000 });
        } else {
          notify(`Il y a ${validationErrors.length} erreurs de validation`, 'error', { duration: 6000 });
        }

        throw new Error(errorMessage);
      }

      // Préparation des données
      const deliveryData = prepareDeliveryData();

      console.log('Données préparées pour l\'API:', deliveryData);

      // Vérification finale des données
      if (!deliveryData.deliveryType) {
        throw new Error('Type de livraison manquant');
      }

      if (!deliveryData.clientInfo.name) {
        throw new Error('Nom du client manquant');
      }

      if (!deliveryData.clientInfo.phone) {
        throw new Error('Téléphone du client manquant');
      }

      if (!deliveryData.packages || deliveryData.packages.length === 0) {
        throw new Error('Aucun colis défini');
      }

      // Vérifier que tous les montants sont des nombres
      deliveryData.packages.forEach((pkg, index) => {
        if (typeof pkg.amount !== 'number' || isNaN(pkg.amount)) {
          throw new Error(`Colis #${index + 1}: Le montant doit être un nombre valide`);
        }
      });


      console.log('Envoi des données à l\'API...', JSON.stringify(deliveryData, null, 2));

      // Envoi à l'API
      const response = await apiRequest('/admin/deliveries', {
        method: 'POST',
        body: JSON.stringify(deliveryData),
      });

      console.log('Réponse API reçue:', response);

      // Gestion de la réponse
      let successMessage = 'Livraison créée avec succès !';

      // Trouver l'ID de différentes manières
      const deliveryId = response.id || response._id || response.data?.id || response.data?._id;
      if (deliveryId) {
        successMessage += `\nID: ${deliveryId}`;
      }

      // Trouver le numéro de suivi
      const trackingNumber = response.trackingNumber || response.data?.trackingNumber || 'N/A';
      if (trackingNumber && trackingNumber !== 'N/A') {
        successMessage += `\nNuméro de suivi: ${trackingNumber}`;
      }

      // SUCCÈS PRINCIPAL - Afficher la popup de notification
      const typeText = deliveryType === 'transfer' ? 'Transfert' : 'Livraison';

      // Notification globale popup
      notifyDelivery(deliveryType, trackingNumber, {
        duration: 8000,
        title: `${typeText} Réussie 🎉`
      });

      // Notification additionnelle pour tous les administrateurs
      broadcastToAdmins('delivery-created', {
        deliveryType,
        trackingNumber,
        clientName: clientInfo.name,
        packageCount: packages.length,
        timestamp: new Date().toISOString()
      });

      // Afficher aussi le message dans le formulaire
      setSuccess(successMessage);

      // Notifier avec un message plus détaillé dans la popup
      notify(
        `${typeText} créée pour ${clientInfo.name}\n Colis: ${packages.length}`,
        'success',
        {
          duration: 10000,
          title: `${typeText} Enregistrée ✓`
        }
      );

      // Réinitialisation après un délai (optionnel)
      setTimeout(() => {
        resetForm();
      }, 5000);

    } catch (err) {
      console.error('Erreur lors de la création:', err);

      // Gestion des erreurs spécifiques
      let errorMessage = err.message || 'Erreur lors de la création de la livraison';

      // Si c'est une erreur HTTP avec des données JSON
      if (err.responseData) {
        try {
          const errorData = typeof err.responseData === 'string'
            ? JSON.parse(err.responseData)
            : err.responseData;

          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = 'Erreurs de validation:\n' +
              errorData.errors.map(e => `• ${e.field || e.path}: ${e.message}`).join('\n');
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Erreur de parsing de l\'erreur:', parseError);
        }
      }

      // Messages d'erreur spécifiques basés sur le contenu
      if (err.message.includes('400') || err.message.includes('Bad Request')) {
        errorMessage = errorMessage || 'Données invalides. Vérifiez les informations saisies.';
      } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        notify('Session expirée. Redirection...', 'error', { duration: 3000 });
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.reload();
        }, 2000);
      } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
        errorMessage = 'Permission refusée.';
      } else if (err.message.includes('500') || err.message.includes('Internal Server')) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
      }

      // Afficher notification d'erreur globale
      notify(errorMessage, 'error', {
        duration: 8000,
        title: 'Erreur de Création ⚠️'
      });

      setError(errorMessage);

      // Afficher plus de détails en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur détaillée:', {
          message: err.message,
          stack: err.stack,
          name: err.name,
          data: err.responseData
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ajouter un colis avec des valeurs par défaut
  const addPackageWithDefaults = (defaultValues = {}) => {
    setPackages([...packages, {
      id: Date.now() + Math.random(),
      recipient: defaultValues.recipient || '',
      recipientPhone: defaultValues.recipientPhone || '',
      destination: defaultValues.destination || '',
      isOutOfTown: defaultValues.isOutOfTown || false,
      agencyName: defaultValues.agencyName || '',
      amount: defaultValues.amount || '',
      weight: defaultValues.weight || '',
      description: defaultValues.description || ''
    }]);
  };

  // Fonction pour dupliquer un colis
  const duplicatePackage = (id) => {
    const packageToDuplicate = packages.find(pkg => pkg.id === id);
    if (packageToDuplicate) {
      addPackageWithDefaults({
        ...packageToDuplicate,
        id: undefined // L'ID sera généré automatiquement
      });

      // Notifier l'action
      notify('Colis dupliqué avec succès', 'info', { duration: 3000 });
    }
  };

  // Fonction pour calculer le poids total
  const calculateTotalWeight = () => {
    return packages.reduce((total, pkg) => {
      const weight = parseFloat(pkg.weight) || 0;
      return total + weight;
    }, 0);
  };

  // Fonction pour formater le numéro de téléphone
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('237')) {
      return `+237 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    } else if (cleaned.length === 9 && cleaned.startsWith('6')) {
      return `+237 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
    }

    return phone;
  };

  // Fonction pour valider un seul colis
  const validatePackage = (pkg, index) => {
    const errors = [];
    const packageNumber = index + 1;

    if (!pkg.recipient?.trim()) {
      errors.push(`Destinataire du colis #${packageNumber} requis`);
    }

    if (!pkg.recipientPhone?.trim()) {
      errors.push(`Téléphone du destinataire du colis #${packageNumber} requis`);
    }

    if (!pkg.destination?.trim()) {
      errors.push(`Destination du colis #${packageNumber} requise`);
    }

    const amount = parseFloat(pkg.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Montant du colis #${packageNumber} doit être supérieur à 0`);
    }

    if (deliveryType === 'transfer' && !pkg.agencyName?.trim()) {
      errors.push(`Nom de l'agence du colis #${packageNumber} requis`);
    }

    return errors;
  };

  // Fonction pour nettoyer un numéro de téléphone
  const cleanPhoneNumber = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  // Mettre à jour le state du colis en fonction du type de livraison
  const updatePackageByDeliveryType = (id, field, value) => {
    const updatedPackages = packages.map(pkg => {
      if (pkg.id === id) {
        const updatedPkg = { ...pkg, [field]: value };

        // Si on change le type de livraison, on ajuste les champs
        if (deliveryType === 'transfer') {
          updatedPkg.isOutOfTown = true;
          if (!updatedPkg.agencyName) {
            updatedPkg.agencyName = '';
          }
        }

        return updatedPkg;
      }
      return pkg;
    });

    setPackages(updatedPackages);
  };

  // Fonction pour vérifier si le formulaire est valide
  const isFormValid = () => {
    return validateForm().length === 0;
  };

  // Fonction pour obtenir un résumé des données
  const getFormSummary = () => {
    return {
      deliveryType: deliveryType === 'local' ? 'Livraison Locale' : 'Transfert',
      client: clientInfo.name,
      phone: clientInfo.phone,
      packagesCount: packages.length,
      totalAmount: calculateTotal(),
      totalWeight: calculateTotalWeight(),
      isFormValid: isFormValid()
    };
  };

  // Retourner toutes les fonctions et états nécessaires
  return {
    // États
    deliveryType,
    packages,
    clientInfo,
    notes,
    loading,
    error,
    success,

    // Setters
    setDeliveryType,
    setNotes,

    // Fonctions principales
    addPackage,
    removePackage,
    updatePackage,
    handleSubmit,
    calculateTotal,
    handleClientInfoChange,
    resetForm,

    // Fonctions utilitaires
    addPackageWithDefaults,
    duplicatePackage,
    calculateTotalWeight,
    formatPhoneNumber,
    validatePackage,
    cleanPhoneNumber,
    updatePackageByDeliveryType,

    // Nouvelles fonctions
    isFormValid,
    getFormSummary,

    // Fonctions de notification (si disponibles)
    notify: (message, type, options) => notify(message, type, options),
    broadcastToAdmins,
  };
};

// Fonctions utilitaires exportables
export const formatPackageForAPI = (pkg, deliveryType) => {
  const packageData = {
    recipient: pkg.recipient.trim(),
    recipientPhone: pkg.recipientPhone.trim().replace(/\s+/g, ''),
    destination: pkg.destination.trim(),
    amount: parseFloat(pkg.amount),
  };

  if (deliveryType === 'transfer') {
    packageData.isOutOfTown = true;
    packageData.agencyName = pkg.agencyName?.trim() || '';
  } else {
    packageData.isOutOfTown = pkg.isOutOfTown || false;
    if (pkg.isOutOfTown && pkg.agencyName) {
      packageData.agencyName = pkg.agencyName.trim();
    }
  }

  if (pkg.weight) {
    const weight = parseFloat(pkg.weight);
    if (!isNaN(weight) && weight > 0) {
      packageData.weight = weight;
    }
  }

  if (pkg.description) {
    packageData.description = pkg.description.trim();
  }

  return packageData;
};

export const validateClientInfo = (clientInfo) => {
  const errors = [];

  if (!clientInfo.name?.trim()) {
    errors.push('Le nom du client est requis');
  }

  if (!clientInfo.phone?.trim()) {
    errors.push('Le téléphone du client est requis');
  }

  const phoneRegex = /^(\+237)?[6-9][0-9]{8}$/;
  const cleanedPhone = clientInfo.phone.replace(/\s+/g, '');
  if (clientInfo.phone && !phoneRegex.test(cleanedPhone)) {
    errors.push('Le format du téléphone est invalide');
  }

  return errors;
};

export const validatePackageForAPI = (pkg, index, deliveryType) => {
  const errors = [];
  const packageNumber = index + 1;

  if (!pkg.recipient?.trim()) {
    errors.push(`Destinataire du colis #${packageNumber} requis`);
  }

  if (!pkg.recipientPhone?.trim()) {
    errors.push(`Téléphone du destinataire du colis #${packageNumber} requis`);
  }

  if (!pkg.destination?.trim()) {
    errors.push(`Destination du colis #${packageNumber} requise`);
  }

  const amount = parseFloat(pkg.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push(`Montant du colis #${packageNumber} doit être supérieur à 0`);
  }

  if (deliveryType === 'transfer' && !pkg.agencyName?.trim()) {
    errors.push(`Nom de l'agence du colis #${packageNumber} requis`);
  }

  if (pkg.weight) {
    const weight = parseFloat(pkg.weight);
    if (isNaN(weight) || weight <= 0) {
      errors.push(`Poids du colis #${packageNumber} doit être supérieur à 0`);
    }
  }

  return errors;
};

// Fonction pour calculer les frais de livraison (exemple)
export const calculateDeliveryFees = (amount, isOutOfTown = false) => {
  let fees = 0;

  if (amount <= 5000) {
    fees = 500;
  } else if (amount <= 20000) {
    fees = 1000;
  } else if (amount <= 50000) {
    fees = 2000;
  } else if (amount <= 100000) {
    fees = 3500;
  } else {
    fees = 5000;
  }

  // Majoration pour hors ville
  if (isOutOfTown) {
    fees *= 1.5;
  }

  return Math.round(fees);
};

// Fonction pour générer un récapitulatif
export const generateSummary = (deliveryType, clientInfo, packages, notes) => {
  const totalAmount = packages.reduce((sum, pkg) => sum + (parseFloat(pkg.amount) || 0), 0);
  const totalWeight = packages.reduce((sum, pkg) => sum + (parseFloat(pkg.weight) || 0), 0);

  return {
    type: deliveryType === 'local' ? 'Livraison Locale' : 'Transfert',
    client: {
      name: clientInfo.name,
      phone: clientInfo.phone,
      address: clientInfo.address || 'Non spécifiée',
    },
    packages: packages.length,
    totalAmount,
    totalWeight: totalWeight > 0 ? `${totalWeight} kg` : 'Non spécifié',
    notes: notes || 'Aucune note',
    timestamp: new Date().toISOString(),
  };
};

// Fonction helper pour gérer les erreurs d'API
export const handleApiError = (error) => {
  console.error('API Error:', error);

  if (error.response) {
    // La requête a été faite et le serveur a répondu avec un statut d'erreur
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);

    return {
      status: error.response.status,
      data: error.response.data,
      message: error.response.data?.error || `Erreur ${error.response.status}`
    };
  } else if (error.request) {
    // La requête a été faite mais aucune réponse n'a été reçue
    console.error('No response received:', error.request);
    return {
      status: 0,
      message: 'Pas de réponse du serveur. Vérifiez votre connexion.'
    };
  } else {
    // Une erreur s'est produite lors de la configuration de la requête
    console.error('Request setup error:', error.message);
    return {
      status: -1,
      message: error.message || 'Erreur lors de la configuration de la requête'
    };
  }
};

// Fonction pour créer une notification personnalisée pour les admins
export const createAdminNotification = (data) => {
  const { deliveryType, trackingNumber, clientName, totalAmount } = data;
  const typeText = deliveryType === 'transfer' ? 'Transfert' : 'Livraison';

  return {
    id: `notification-${Date.now()}`,
    type: 'delivery-created',
    title: `Nouvelle ${typeText} Créée`,
    message: `${typeText} #${trackingNumber} créée pour ${clientName}`,
    details: {
      client: clientName,
      amount: totalAmount,
      timestamp: new Date().toISOString(),
      type: deliveryType
    },
    priority: 'medium',
    read: false,
    action: {
      type: 'view-delivery',
      path: `/admin/deliveries/${trackingNumber}`,
      label: 'Voir les détails'
    }
  };
};

// Fonction pour simuler un WebSocket (pour le développement)
export const simulateWebSocketNotification = (notificationData) => {
  if (typeof window !== 'undefined') {
    // Simuler une notification WebSocket
    const event = new CustomEvent('websocket-notification', {
      detail: {
        type: 'admin-notification',
        data: notificationData,
        timestamp: new Date().toISOString()
      }
    });

    window.dispatchEvent(event);

    // Simuler une notification pour d'autres onglets
    const storageEvent = new StorageEvent('storage', {
      key: 'admin-websocket-message',
      newValue: JSON.stringify(notificationData),
      url: window.location.href
    });

    window.dispatchEvent(storageEvent);
  }
};

export default useDeliveryLogic;