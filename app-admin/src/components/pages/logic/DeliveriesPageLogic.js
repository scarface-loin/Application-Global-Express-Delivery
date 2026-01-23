import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../../services/api';

export const useDeliveriesLogic = (onNavigate) => {
  // États principaux
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // État pour forcer le rafraîchissement
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // États pour les filtres
  const [filters, setFilters] = useState({
    status: '',
    deliveryType: '',
    search: '',
    dateRange: '',
    showCompleted: false,
  });

  // États pour la pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  // États pour le modal d'assignation rapide
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDeliveryForAssign, setSelectedDeliveryForAssign] = useState(null);
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState('');
  const [assigning, setAssigning] = useState(false);

  // États pour le modal de détails
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDeliveryDetails, setSelectedDeliveryDetails] = useState(null);

  // État pour le modal de confirmation de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDeliveryForPayment, setSelectedDeliveryForPayment] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Fonction pour convertir les timestamps Firestore
  const convertFirestoreTimestamp = useCallback((timestamp) => {
    if (!timestamp) return null;
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
    }
    return new Date(timestamp);
  }, []);

  // Fonction pour vérifier si tous les colis sont livrés
  const areAllPackagesDelivered = useCallback((delivery) => {
    if (!delivery.packages || !Array.isArray(delivery.packages) || delivery.packages.length === 0) {
      return false;
    }
    // Vérifier si tous les colis sont "delivered" ou "transferred"
    return delivery.packages.every(pkg =>
      pkg.status === 'delivered' || pkg.status === 'transferred'
    );
  }, []);

  // Fonction pour mettre à jour automatiquement le statut de la livraison
  const updateDeliveryStatusIfNeeded = useCallback(async (delivery) => {
    // Vérifier si la livraison doit être marquée comme "delivered"
    if (areAllPackagesDelivered(delivery) && delivery.status !== 'delivered') {
      try {
        const deliveryId = delivery.id;

        // Mettre à jour le statut côté serveur
        await apiRequest(`/admin/deliveries/${deliveryId}/auto-complete`, {
          method: 'POST',
          body: JSON.stringify({
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
            autoCompleted: true
          }),
        });

        console.log(`✅ Livraison ${deliveryId} automatiquement marquée comme livrée`);
        return true;
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour automatique:', error);
        return false;
      }
    }
    return false;
  }, [areAllPackagesDelivered]);
  // Charger les données initiales
  useEffect(() => {
    fetchDeliveries();
    fetchDeliveryMen();
  }, [pagination.page, filters.status, filters.deliveryType, refreshTrigger, filters.showCompleted]);

  // Filtrer les résultats localement pour la recherche
  useEffect(() => {
    console.log('🔍 Application des filtres...');
    console.log('📊 Total des livraisons:', deliveries.length);
    console.log('⚙️ Filtres actuels:', filters);

    let filtered = deliveries.filter(delivery => {
      const searchLower = filters.search.toLowerCase();

      // Filtrer par statut (si le filtre est activé)
      if (filters.showCompleted) {
        // Afficher seulement les livraisons terminées (status = 'completed')
        if (delivery.status !== 'completed') {
          return false;
        }
      } else {
        // Afficher toutes les livraisons SAUT terminées
        if (delivery.status === 'completed') {
          return false;
        }
      }

      // Recherche textuelle
      const matchesSearch = !filters.search || (
        (delivery.id && delivery.id.toLowerCase().includes(searchLower)) ||
        (delivery.clientInfo?.name && delivery.clientInfo.name.toLowerCase().includes(searchLower)) ||
        (delivery.clientInfo?.phone && delivery.clientInfo.phone.includes(searchLower)) ||
        (delivery.deliveryManName && delivery.deliveryManName.toLowerCase().includes(searchLower)) ||
        (delivery.packages?.some(pkg =>
          (pkg.recipient && pkg.recipient.toLowerCase().includes(searchLower)) ||
          (pkg.trackingNumber && pkg.trackingNumber.toLowerCase().includes(searchLower)) ||
          (pkg.destination && pkg.destination.toLowerCase().includes(searchLower))
        ))
      );

      return matchesSearch;
    });

    // Appliquer le filtre de statut supplémentaire si défini
    if (filters.status && !filters.showCompleted) {
      filtered = filtered.filter(delivery => delivery.status === filters.status);
    }

    // Appliquer le filtre de type de livraison
    if (filters.deliveryType) {
      filtered = filtered.filter(delivery => delivery.deliveryType === filters.deliveryType);
    }

    console.log(`✅ ${filtered.length} livraisons après filtrage`);
    setFilteredDeliveries(filtered);
  }, [deliveries, filters.search, filters.status, filters.deliveryType, filters.showCompleted]);

  // Fonction pour charger les livraisons
  const fetchDeliveries = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/admin/deliveries?page=${pagination.page}&limit=${pagination.limit}`;
      if (filters.status && !filters.showCompleted) url += `&status=${filters.status}`;
      if (filters.deliveryType) url += `&deliveryType=${filters.deliveryType}`;
      if (filters.dateRange) url += `&dateRange=${filters.dateRange}`;
      // Dans fetchDeliveries, ajustez l'URL pour les nouveaux statuts
      if (filters.status && !filters.showCompleted) {
        // Si le filtre est "delivered", on veut aussi inclure "completed" ?
        if (filters.status === 'delivered') {
          url += `&status=delivered,completed`;
        } else {
          url += `&status=${filters.status}`;
        }
      }
      if (filters.showCompleted) {
        url += `&status=completed`;
      }

      console.log('🔍 Appel API pour récupérer les livraisons:', url);

      const response = await apiRequest(url);

      console.log('📦 Données reçues de l\'API:', response);

      // L'API retourne directement un tableau, pas un objet avec data
      let deliveriesData = Array.isArray(response) ? response : [];

      console.log('📊 Nombre de livraisons récupérées:', deliveriesData.length);

      // Log des statuts pour debug
      console.log('📊 Distribution des statuts:');
      const statusCount = {};
      deliveriesData.forEach(delivery => {
        statusCount[delivery.status] = (statusCount[delivery.status] || 0) + 1;
      });
      console.log('Statuts:', statusCount);

      // Normaliser les données et vérifier les statuts
      const normalizedDeliveries = deliveriesData.map(delivery => ({
        ...delivery,
        createdAt: convertFirestoreTimestamp(delivery.createdAt),
        updatedAt: convertFirestoreTimestamp(delivery.updatedAt),
        assignedAt: convertFirestoreTimestamp(delivery.assignedAt),
        acceptedAt: convertFirestoreTimestamp(delivery.acceptedAt),
        completedAt: convertFirestoreTimestamp(delivery.completedAt),
        transferredAt: convertFirestoreTimestamp(delivery.transferredAt),
        packages: (delivery.packages || []).map(pkg => ({
          ...pkg,
          createdAt: convertFirestoreTimestamp(pkg.createdAt),
          updatedAt: convertFirestoreTimestamp(pkg.updatedAt),
        }))
      }));

      console.log('📦 Livraisons normalisées:', normalizedDeliveries);

      // Vérifier et mettre à jour automatiquement les livraisons si nécessaire
      for (const delivery of normalizedDeliveries) {
        await updateDeliveryStatusIfNeeded(delivery);
      }

      setDeliveries(normalizedDeliveries);
      setPagination(prev => ({
        ...prev,
        total: normalizedDeliveries.length || 0,
      }));
    } catch (error) {
      console.error('❌ Erreur:', error);
      setError('Erreur lors du chargement des livraisons');
      setDeliveries([]);
      setFilteredDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les livreurs
  const fetchDeliveryMen = async () => {
    try {
      const response = await apiRequest('/admin/delivery-men');
      // L'API retourne probablement directement un tableau
      const deliveryMenData = Array.isArray(response) ? response : [];
      setDeliveryMen(deliveryMenData);
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
      setDeliveryMen([]);
    }
  };

  // Fonction pour forcer le rafraîchissement
  const refreshData = useCallback(() => {
    console.log('🔄 Rafraîchissement des données...');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Gestion des filtres
  const handleFilterChange = useCallback((key, value) => {
    console.log(`🎛️ Changement de filtre: ${key} = ${value}`);
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Gestion de la pagination
  const handlePageChange = useCallback((newPage) => {
    console.log(`📄 Changement de page: ${newPage}`);
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Fonction pour obtenir le texte du statut
  const getStatusText = useCallback((status) => {
    const statusMap = {
      'pending': 'En attente',
      'assigned': 'Assignée',
      'in_progress': 'En cours',
      'issue_reported': 'Problème signalé',
      'delivered': 'Livrée',
      'transferred': 'Transférée',
      'failed': 'Échouée',
      'cancelled': 'Annulée',
      // Anciens statuts conservés pour compatibilité
      'accepted': 'Acceptée', // Peut être retiré si non utilisé
      'completed': 'Terminée', // Conserver pour l'historique
    };
    return statusMap[status] || status;
  }, []);

  // Fonction pour obtenir le texte du statut des colis
  const getPackageStatusText = useCallback((status) => {
    const statusMap = {
      'pending': 'En attente',
      'picked_up': 'Récupéré',
      'in_transit': 'En transit',
      'at_agency': 'En agence',
      'delivered': 'Livré',
      'transferred': 'Transféré',
      'failed': 'Échec',
    };
    return statusMap[status] || status;
  }, []);

  // Fonction pour marquer une livraison comme terminée
  const handleCompleteDelivery = async () => {
    if (!selectedDeliveryForPayment) return;

    setCompleting(true);
    setError('');

    try {
      const deliveryId = selectedDeliveryForPayment.id;

      // Vérifier que tous les colis sont livrés ou transférés
      if (!areAllPackagesDelivered(selectedDeliveryForPayment)) {
        setError('Tous les colis doivent être livrés ou transférés avant de terminer la livraison');
        setCompleting(false);
        return;
      }

      // Vérifier que la livraison est en statut "delivered"
      if (selectedDeliveryForPayment.status !== 'delivered') {
        setError('La livraison doit être marquée comme "livrée" avant d\'être complétée');
        setCompleting(false);
        return;
      }

      // Préparer les données pour l'API
      const requestBody = {
        status: 'completed', // Statut final pour l'historique
        paymentReceived: true,
        paymentAmount: paymentAmount || selectedDeliveryForPayment.totalAmount,
        paymentMethod: paymentMethod,
        completedAt: new Date().toISOString(),
      };

      const response = await apiRequest(`/admin/deliveries/${deliveryId}/complete`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      setSuccess(`Livraison #${formatDeliveryId(deliveryId)} marquée comme terminée`);

      // Fermer le modal et réinitialiser
      setShowPaymentModal(false);
      setSelectedDeliveryForPayment(null);
      setPaymentAmount('');
      setPaymentMethod('cash');

      // Rafraîchir les données
      refreshData();

    } catch (error) {
      console.error('Erreur de complétion:', error);
      setError(error.message || 'Erreur lors du marquage comme terminée');
    } finally {
      setCompleting(false);
    }
  };

  // Ouvrir le modal de paiement/terminaison
  const openPaymentModal = useCallback((delivery) => {
    console.log('💰 Ouverture du modal de paiement pour:', delivery.id);
    setSelectedDeliveryForPayment(delivery);
    setPaymentAmount(delivery.totalAmount || '');
    setShowPaymentModal(true);
  }, []);

  // Fonction pour supprimer une livraison
  const handleDelete = async (deliveryId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette livraison ?')) return;

    try {
      await apiRequest(`/admin/deliveries/${deliveryId}`, {
        method: 'DELETE',
      });
      setSuccess('Livraison annulée avec succès');
      refreshData();
    } catch (error) {
      setError(error.message || 'Erreur lors de la suppression');
    }
  };

  // Fonction pour assigner une livraison via la page dédiée
  const handleAssignDelivery = useCallback((deliveryId) => {
    if (onNavigate) {
      onNavigate('assign-delivery', deliveryId);
    } else {
      window.location.hash = `#assign-${deliveryId}`;
    }
  }, [onNavigate]);

  // Fonction pour l'assignation rapide via modal
  const handleQuickAssign = async () => {
    if (!selectedDeliveryMan || !selectedDeliveryForAssign) {
      setError('Veuillez sélectionner un livreur');
      return;
    }

    setAssigning(true);
    setError('');

    try {
      const deliveryId = selectedDeliveryForAssign.id;

      // Préparer les données pour l'API
      const requestBody = {
        deliveryManId: selectedDeliveryMan.trim()
      };

      const response = await apiRequest(`/admin/deliveries/${deliveryId}/assign`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      setSuccess(`Livraison #${formatDeliveryId(deliveryId)} assignée avec succès`);

      // Fermer le modal immédiatement
      setShowAssignModal(false);
      setSelectedDeliveryForAssign(null);
      setSelectedDeliveryMan('');

      // Rafraîchir les données
      refreshData();

    } catch (error) {
      console.error('Erreur d\'assignation:', error);
      setError(error.message || 'Erreur lors de l\'assignation');
    } finally {
      setAssigning(false);
    }
  };

  // Ouvrir le modal d'assignation rapide
  const openQuickAssignModal = useCallback((delivery) => {
    console.log('🚚 Ouverture du modal d\'assignation rapide pour:', delivery.id);
    setSelectedDeliveryForAssign(delivery);
    setShowAssignModal(true);
    setSelectedDeliveryMan('');
  }, []);

  // Ouvrir le modal de détails
  const openDetailsModal = async (delivery) => {
    try {
      const deliveryId = delivery.id;
      const response = await apiRequest(`/admin/deliveries/${deliveryId}`);
      // L'API retourne probablement directement l'objet livraison
      const deliveryData = response;

      // Normaliser les timestamps
      const normalizedDelivery = {
        ...deliveryData,
        createdAt: convertFirestoreTimestamp(deliveryData.createdAt),
        updatedAt: convertFirestoreTimestamp(deliveryData.updatedAt),
        assignedAt: convertFirestoreTimestamp(deliveryData.assignedAt),
        acceptedAt: convertFirestoreTimestamp(deliveryData.acceptedAt),
        completedAt: convertFirestoreTimestamp(deliveryData.completedAt),
        transferredAt: convertFirestoreTimestamp(deliveryData.transferredAt),
        packages: (deliveryData.packages || []).map(pkg => ({
          ...pkg,
          createdAt: convertFirestoreTimestamp(pkg.createdAt),
          updatedAt: convertFirestoreTimestamp(pkg.updatedAt),
        }))
      };

      setSelectedDeliveryDetails(normalizedDelivery);
      setShowDetailsModal(true);
    } catch (error) {
      setError('Erreur lors du chargement des détails');
    }
  };

  // Fonctions utilitaires pour formater les données
  const formatDeliveryId = useCallback((id) => {
    if (!id) return 'N/A';
    if (typeof id === 'string' && id.length >= 8) {
      return `#${id.slice(-8)}`;
    }
    return `#${id}`;
  }, []);

  const canMarkAsDelivered = useCallback((delivery) => {
    if (!delivery.packages || !Array.isArray(delivery.packages)) return false;

    // Vérifier si tous les colis sont en statut final
    const allPackagesFinal = delivery.packages.every(pkg =>
      pkg.status === 'delivered' ||
      pkg.status === 'transferred' ||
      pkg.status === 'failed'
    );

    // La livraison doit être en cours ou avec problème signalé
    const isEligibleStatus = delivery.status === 'in_progress' ||
      delivery.status === 'issue_reported';

    return isEligibleStatus && allPackagesFinal;
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Date invalide';
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Date invalide';
    }
  }, []);

  const formatAmount = useCallback((amount) => {
    if (amount === null || amount === undefined) return '0 FCFA';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0 FCFA';
    return `${numAmount.toLocaleString()} FCFA`;
  }, []);

  const getPackageCount = useCallback((delivery) => {
    if (!delivery.packages) return 0;
    return Array.isArray(delivery.packages) ? delivery.packages.length : 0;
  }, []);

  const getFirstRecipient = useCallback((delivery) => {
    if (!delivery.packages || !Array.isArray(delivery.packages) || delivery.packages.length === 0) {
      return 'Aucun colis';
    }
    return delivery.packages[0]?.recipient || 'Destinataire inconnu';
  }, []);

  // Obtenir le nombre de colis livrés
  const getDeliveredPackagesCount = useCallback((delivery) => {
    if (!delivery.packages || !Array.isArray(delivery.packages)) return 0;
    return delivery.packages.filter(pkg => pkg.status === 'delivered').length;
  }, []);

  // Exporter les données
  const handleExport = () => {
    if (filteredDeliveries.length === 0) {
      setError('Aucune donnée à exporter');
      return;
    }

    try {
      const exportData = filteredDeliveries.map(delivery => ({
        ID: formatDeliveryId(delivery.id),
        Client: delivery.clientInfo?.name || 'N/A',
        Téléphone: delivery.clientInfo?.phone || 'N/A',
        Type: delivery.deliveryType === 'local' ? 'Locale' : 'Transfert',
        Statut: getStatusText(delivery.status),
        'Nombre de colis': getPackageCount(delivery),
        'Colis livrés': getDeliveredPackagesCount(delivery),
        Montant: formatAmount(delivery.totalAmount),
        'Date création': formatDate(delivery.createdAt),
        'Livreur': delivery.deliveryManName || 'Non assigné',
        'Date livraison': formatDate(delivery.deliveredAt),
        'Date paiement': formatDate(delivery.completedAt),
        'Problèmes signalés': delivery.status === 'issue_reported' ? 'Oui' : 'Non',
      }));

      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `livraisons_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`${exportData.length} livraisons exportées avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setError('Erreur lors de l\'export des données');
    }
  };

  // Calculer les statistiques (mise à jour en temps réel)
  const getStats = useCallback(() => {
    // Utiliser filteredDeliveries pour les statistiques affichées
    const currentDeliveries = filters.showCompleted
      ? deliveries.filter(d => d.status === 'completed')
      : deliveries.filter(d => d.status !== 'completed');

    const stats = {
      total: currentDeliveries.length,
      pending: currentDeliveries.filter(d => d.status === 'pending').length,
      assigned: currentDeliveries.filter(d => d.status === 'assigned').length,
      inProgress: currentDeliveries.filter(d => d.status === 'in_progress').length,
      issueReported: currentDeliveries.filter(d => d.status === 'issue_reported').length,
      delivered: currentDeliveries.filter(d => d.status === 'delivered').length,
      transferred: currentDeliveries.filter(d => d.status === 'transferred').length,
      failed: currentDeliveries.filter(d => d.status === 'failed').length,
      cancelled: currentDeliveries.filter(d => d.status === 'cancelled').length,
      completed: deliveries.filter(d => d.status === 'completed').length, // Historique
      totalAmount: currentDeliveries.reduce((sum, d) => sum + (parseFloat(d.totalAmount) || 0), 0),
      completedAmount: deliveries
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + (parseFloat(d.totalAmount) || 0), 0),
    };

    console.log('📈 Statistiques calculées:', stats);
    return stats;
  }, [deliveries, filters.showCompleted]);
  const stats = getStats();

  return {
    // États
    deliveries,
    filteredDeliveries,
    loading,
    error,
    success,
    filters,
    pagination,
    showAssignModal,
    selectedDeliveryForAssign,
    deliveryMen,
    selectedDeliveryMan,
    assigning,
    showDetailsModal,
    selectedDeliveryDetails,
    showPaymentModal,
    selectedDeliveryForPayment,
    completing,
    paymentAmount,
    paymentMethod,
    stats,

    // Setters
    setShowAssignModal,
    setSelectedDeliveryForAssign,
    setSelectedDeliveryMan,
    setShowDetailsModal,
    setShowPaymentModal,
    setSelectedDeliveryForPayment,
    setPaymentAmount,
    setPaymentMethod,
    setSelectedDeliveryDetails,
    setError,
    setSuccess,

    // Fonctions
    handleFilterChange,
    handlePageChange,
    handleDelete,
    handleAssignDelivery,
    handleQuickAssign,
    handleCompleteDelivery,
    openQuickAssignModal,
    openPaymentModal,
    openDetailsModal,
    handleExport,
    formatDeliveryId,
    formatDate,
    formatAmount,
    getPackageCount,
    getFirstRecipient,
    getStatusText,
    getPackageStatusText,
    areAllPackagesDelivered,
    canMarkAsDelivered,
    getDeliveredPackagesCount,
    refreshData,
    convertFirestoreTimestamp,
  };
};