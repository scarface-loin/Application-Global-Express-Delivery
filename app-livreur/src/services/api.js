// ==================== src/services/api.js ====================
/**
 * Service API pour le livreur - Compatible JSX/React
 * Version: 2.1.0 - Ajout du module de Réconciliation (Caisse & Retours)
 */

// Configuration
const API_BASE_URL = 'https://application-global-express-delivery-back.onrender.com/api';

// Service de gestion des tokens
const tokenService = {
  getToken() {
    return localStorage.getItem('authToken');
  },

  setToken(token) {
    localStorage.setItem('authToken', token);
  },

  removeToken() {
    localStorage.removeItem('authToken');
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  removeUser() {
    localStorage.removeItem('user');
  },

  clearAll() {
    this.removeToken();
    this.removeUser();
  },

  getHeaders(additionalHeaders = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...additionalHeaders
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }
};

// Gestionnaire des requêtes HTTP
const http = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = tokenService.getHeaders(options.headers || {});

    const config = {
      ...options,
      headers,
      signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : null
    };

    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 204) {
        return { success: true };
      }

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error = {
          status: response.status,
          message: data.message || data.error || 'Une erreur est survenue',
          data: data
        };

        if (response.status === 401) {
          tokenService.clearAll();
          window.dispatchEvent(new CustomEvent('auth-error'));
        }

        throw error;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);

      if (error.name === 'AbortError') {
        throw {
          message: 'La requête a expiré. Veuillez réessayer.',
          timeout: true
        };
      }

      if (!navigator.onLine) {
        throw {
          message: 'Pas de connexion internet',
          offline: true
        };
      }

      throw error;
    }
  },

  get(endpoint, params = {}) {
    const queryString = Object.keys(params).length > 0
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  },

  post(endpoint, data) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(endpoint, {
      method: 'POST',
      body
    });
  },

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  patch(endpoint, data) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(endpoint, {
      method: 'PATCH',
      body
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// Mappage des statuts pour la compatibilité
const statusMapper = {
  // Anciens statuts vers nouveaux
  accepted: 'in_progress', // L'acceptation d'une livraison la met maintenant en "in_progress"

  // Traduction des statuts pour l'affichage
  getDeliveryStatusText(status) {
    const statusMap = {
      'pending': 'En attente',
      'assigned': 'Assignée',
      'in_progress': 'En cours',
      'issue_reported': 'Problème signalé',
      'delivered': 'Livrée',
      'transferred': 'Transférée',
      'failed': 'Échouée',
      'cancelled': 'Annulée',
      'completed': 'Terminée' // Pour l'historique uniquement
    };
    return statusMap[status] || status;
  },

  getPackageStatusText(status) {
    const statusMap = {
      'pending': 'En attente',
      'picked_up': 'Récupéré',
      'in_transit': 'En transit',
      'at_agency': 'En agence',
      'delivered': 'Livré',
      'transferred': 'Transféré',
      'failed': 'Échec'
    };
    return statusMap[status] || status;
  }
};

// Service API principal
const apiService = {
  /**
   * ==================== AUTHENTIFICATION ====================
   */
  auth: {
    async login(credentials) {
      try {
        const response = await http.post('/auth/login', credentials);

        if (response.token) {
          tokenService.setToken(response.token);

          if (response.user) {
            tokenService.setUser(response.user);
          }

          return {
            success: true,
            token: response.token,
            user: response.user,
            mustChangePassword: response.mustChangePassword || false,
            message: response.message || 'Connexion réussie'
          };
        }

        return {
          success: false,
          message: response.message || 'Échec de la connexion'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message || 'Erreur de connexion',
          status: error.status
        };
      }
    },

    async logout() {
      try {
        await http.post('/auth/logout');
      } catch (error) {
        console.warn('Erreur lors de la déconnexion:', error);
      } finally {
        tokenService.clearAll();
      }
    },

    async changePassword(currentPassword, newPassword) {
      try {
        const response = await http.patch('/auth/change-password', {
          currentPassword,
          newPassword
        });

        return {
          success: true,
          message: response.message || 'Mot de passe changé avec succès'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    isAuthenticated() {
      return !!tokenService.getToken();
    },

    getCurrentUser() {
      return tokenService.getUser();
    },

    getToken() {
      return tokenService.getToken();
    }
  },

  /**
   * ==================== LIVRAISONS (FONCTIONNALITÉS LIVREUR) ====================
   */
  deliveries: {
    // Obtenir les livraisons du livreur selon le statut
    async getAll(filters = {}) {
      try {
        const deliveries = await http.get('/deliveries', filters);

        // Normaliser les statuts si nécessaire
        const normalizedDeliveries = deliveries.map(delivery => ({
          ...delivery,
          // Si l'API retourne encore 'accepted', on le convertit en 'in_progress'
          status: delivery.status === 'accepted' ? 'in_progress' : delivery.status
        }));

        return {
          success: true,
          data: normalizedDeliveries,
          count: deliveries.length
        };
      } catch (error) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la récupération des livraisons',
          data: [],
          count: 0
        };
      }
    },

    // Obtenir une livraison spécifique
    async getById(deliveryId) {
      try {
        const delivery = await http.get(`/deliveries/${deliveryId}`);

        // Normaliser les statuts
        if (delivery.status === 'accepted') {
          delivery.status = 'in_progress';
        }

        return {
          success: true,
          data: delivery
        };
      } catch (error) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la récupération de la livraison',
          data: null
        };
      }
    },

    // Accepter une livraison (devient "in_progress" dans le nouveau système)
    async acceptDelivery(deliveryId) {
      try {
        const result = await http.post(`/deliveries/${deliveryId}/accept`);
        return {
          success: true,
          data: result,
          message: result.message || 'Livraison acceptée avec succès'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    // Nouvelle méthode : Signaler un problème sur une livraison
    async reportIssue(deliveryId, issueData) {
      try {
        const result = await http.post(`/deliveries/${deliveryId}/report-issue`, issueData);
        return {
          success: true,
          data: result,
          message: result.message || 'Problème signalé avec succès'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    // Nouvelle méthode : Résoudre un problème signalé
    async resolveIssue(deliveryId) {
      try {
        const result = await http.post(`/deliveries/${deliveryId}/resolve-issue`);
        return {
          success: true,
          data: result,
          message: result.message || 'Problème résolu avec succès'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    // Mettre à jour le statut d'une livraison avec les nouvelles transitions
    async updateStatus(deliveryId, status, data = {}) {
      try {
        const result = await http.patch(`/deliveries/${deliveryId}/status`, { status, ...data });
        return {
          success: true,
          data: result,
          message: result.message || 'Statut mis à jour'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    // Marquer une livraison comme transférée
    async markAsTransferred(deliveryId, transferData) {
      try {
        const result = await http.post(`/deliveries/${deliveryId}/transfer`, transferData);
        return {
          success: true,
          data: result,
          message: result.message || 'Livraison marquée comme transférée'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    // Marquer une livraison comme échouée
    async markAsFailed(deliveryId, reason) {
      try {
        const result = await http.post(`/deliveries/${deliveryId}/fail`, { reason });
        return {
          success: true,
          data: result,
          message: result.message || 'Livraison marquée comme échouée'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    // Mettre à jour le statut d'un colis avec les nouvelles transitions
    // ==================== CODE ACTUEL (INCORRECT) ====================
    // Mettre à jour le statut d'un colis avec les nouvelles transitions
    // ==================== CODE CORRIGÉ ====================
    // Mettre à jour le statut d'un colis avec les nouvelles transitions
    // ==================== src/services/api.js (Vérifier que c'est bien cette version) ====================

// ... dans apiService.deliveries
async updatePackageStatus(deliveryId, packageId, status, reason = null) {
  try {
    const payload = {
      status: status
    };

    if (status === 'failed' && reason) {
      // ✅ C'EST LE BON NOM DE CHAMP
      payload.rejectionReason = reason; 
    }
    
    const result = await http.patch(
      `/deliveries/${deliveryId}/packages/${packageId}/status`,
      payload 
    );
    
    return {
      success: true,
      data: result,
      // ...
    };
  } catch (error) {
    // ...
  }
},

    // Marquer un colis comme récupéré
    async markPackageAsPickedUp(deliveryId, packageId) {
      return this.updatePackageStatus(deliveryId, packageId, 'picked_up');
    },

    // Marquer un colis comme en transit
    async markPackageAsInTransit(deliveryId, packageId) {
      return this.updatePackageStatus(deliveryId, packageId, 'in_transit');
    },

    // Marquer un colis comme livré
    async markPackageAsDelivered(deliveryId, packageId, proofData = {}) {
      return this.updatePackageStatus(deliveryId, packageId, 'delivered', proofData);
    },

    // Marquer un colis comme en agence
    async markPackageAsAtAgency(deliveryId, packageId) {
      return this.updatePackageStatus(deliveryId, packageId, 'at_agency');
    },

    // Marquer un colis comme transféré
    async markPackageAsTransferred(deliveryId, packageId, transferData = {}) {
      return this.updatePackageStatus(deliveryId, packageId, 'transferred', transferData);
    },

    // Marquer un colis comme échoué
    async markPackageAsFailed(deliveryId, packageId, reason) {
      return this.updatePackageStatus(deliveryId, packageId, 'failed', { reason });
    },

    // Relancer un colis échoué
    async retryFailedPackage(deliveryId, packageId) {
      return this.updatePackageStatus(deliveryId, packageId, 'pending');
    },

    // Uploader un reçu de transfert
    async uploadTransferReceipt(deliveryId, file, receiptType = 'transfer') {
      try {
        const formData = new FormData();
        formData.append('receipt', file);
        formData.append('type', receiptType);

        const result = await http.post(
          `/deliveries/${deliveryId}/upload-receipt`,
          formData
        );

        return {
          success: true,
          data: result,
          message: result.message || 'Reçu uploadé avec succès'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    // Uploader une preuve de livraison
    async uploadDeliveryProof(deliveryId, packageId, file) {
      try {
        const formData = new FormData();
        formData.append('proof', file);
        formData.append('packageId', packageId);

        const result = await http.post(
          `/deliveries/${deliveryId}/upload-proof`,
          formData
        );

        return {
          success: true,
          data: result,
          message: result.message || 'Preuve de livraison uploadée'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    // Méthodes utilitaires pour les statuts (maintenant simplifiées)
    async startDelivery(deliveryId) {
      return this.updateStatus(deliveryId, 'in_progress');
    },

    // Marquer la livraison comme "delivered" quand tous les colis sont livrés/transférés
    async markDeliveryAsDelivered(deliveryId) {
      return this.updateStatus(deliveryId, 'delivered');
    },

    async cancelDelivery(deliveryId, reason) {
      return this.updateStatus(deliveryId, 'cancelled', { reason });
    },

    // Vérifier si une livraison peut être marquée comme "delivered"
    canMarkAsDelivered(delivery) {
      if (!delivery.packages || !Array.isArray(delivery.packages)) return false;

      const allPackagesFinal = delivery.packages.every(pkg =>
        pkg.status === 'delivered' || pkg.status === 'transferred'
      );

      const isEligibleStatus = delivery.status === 'in_progress' ||
        delivery.status === 'issue_reported';

      return isEligibleStatus && allPackagesFinal;
    },

    // Obtenir les statistiques des colis d'une livraison
    getPackageStats(delivery) {
      if (!delivery.packages || !Array.isArray(delivery.packages)) {
        return { total: 0, delivered: 0, transferred: 0, failed: 0, inProgress: 0 };
      }

      return {
        total: delivery.packages.length,
        delivered: delivery.packages.filter(p => p.status === 'delivered').length,
        transferred: delivery.packages.filter(p => p.status === 'transferred').length,
        failed: delivery.packages.filter(p => p.status === 'failed').length,
        inProgress: delivery.packages.filter(p =>
          !['delivered', 'transferred', 'failed'].includes(p.status)
        ).length
      };
    }
  },

  /**
   * ==================== CLÔTURE & RÉCONCILIATION (NOUVEAU) ====================
   */
  reconciliation: {
    // Récupérer le bilan actuel
    async getSummary() {
      try {
        // AJOUT DE '/deliveries' car la route est dans delivery.routes.js
        const result = await http.get('/deliveries/reconciliation/summary');

        return {
          success: true,
          data: result.data || result // Gestion souple des formats de réponse
        };
      } catch (error) {
        console.error('Erreur récupération bilan:', error);
        return {
          success: false,
          message: error.message || 'Impossible de récupérer le bilan',
          // Données vides en cas d'erreur pour éviter le crash de l'UI
          data: {
            cash: { totalAmount: 0, count: 0, items: [] },
            returns: { count: 0, items: [] }
          }
        };
      }
    },

    // Envoyer une demande de versement
    async submitRequest(amountDeclared) {
      try {
        // AJOUT DE '/deliveries' ici aussi
        const result = await http.post('/deliveries/reconciliation/request', {
          amountDeclared
        });

        return {
          success: true,
          data: result,
          message: result.message || 'Demande de clôture envoyée'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    }
  },

  /**
   * ==================== NOTIFICATIONS ====================
   */
  notifications: {
    async getAll(filters = {}) {
      try {
        const notifications = await http.get('/notifications', filters);
        const unreadCount = notifications.filter(n => !n.read).length;

        return {
          success: true,
          data: notifications,
          unreadCount
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: [],
          unreadCount: 0
        };
      }
    },

    async markAsRead(notificationId) {
      try {
        const result = await http.patch(`/notifications/${notificationId}/read`);
        return {
          success: true,
          data: result,
          message: result.message || 'Notification marquée comme lue'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    async markAllAsRead() {
      try {
        const result = await http.patch('/notifications/read-all');
        return {
          success: true,
          data: result,
          message: result.message || 'Toutes les notifications marquées comme lues'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    }
  },

  /**
   * ==================== PROFIL ====================
   */
  profile: {
    async get() {
      try {
        const profile = await http.get('/profile');
        return {
          success: true,
          data: profile
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: null
        };
      }
    },

    async update(profileData) {
      try {
        const result = await http.patch('/profile', profileData);
        return {
          success: true,
          data: result,
          message: result.message || 'Profil mis à jour'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    async changePassword(currentPassword, newPassword) {
      try {
        const result = await http.patch('/profile/password', {
          currentPassword,
          newPassword
        });

        return {
          success: true,
          data: result,
          message: result.message || 'Mot de passe changé avec succès'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    async updateProfilePicture(file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await http.post('/profile/picture', formData);

        return {
          success: true,
          data: result,
          message: result.message || 'Photo de profil mise à jour'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    }
  },

  /**
   * ==================== SUIVI DE COLIS ====================
   */
  tracking: {
    async trackPackage(trackingNumber) {
      try {
        const result = await http.get(`/tracking/${trackingNumber}`);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: null
        };
      }
    },

    // Nouveau : Obtenir l'historique d'un colis
    async getPackageHistory(trackingNumber) {
      try {
        const result = await http.get(`/tracking/${trackingNumber}/history`);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: []
        };
      }
    }
  },

  /**
   * ==================== STATISTIQUES ====================
   */
  stats: {
    async getPersonalStats() {
      try {
        const result = await http.get('/stats/personal');
        return {
          success: true,
          data: result
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: null
        };
      }
    },

    async getHistory(period = 'week') {
      try {
        const result = await http.get('/history', { period });
        return {
          success: true,
          data: result
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: []
        };
      }
    },

    // Nouveau : Obtenir les statistiques par statut
    async getStatsByStatus() {
      try {
        const result = await http.get('/stats/by-status');
        return {
          success: true,
          data: result
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: {}
        };
      }
    }
  },

  /**
   * ==================== UTILITAIRES ====================
   */
  utils: {
    // Fonctions utilitaires pour les statuts
    statusMapper,

    // Vérifier la validité d'une transition de statut pour une livraison
    isValidDeliveryTransition(currentStatus, newStatus) {
      const validTransitions = {
        'pending': ['assigned', 'cancelled'],
        'assigned': ['in_progress', 'cancelled'],
        'in_progress': ['delivered', 'transferred', 'failed', 'issue_reported'],
        'issue_reported': ['in_progress', 'failed', 'cancelled'],
        'delivered': ['completed'], // Seulement pour l'admin
        'transferred': [], // Final
        'failed': [], // Final
        'cancelled': [] // Final
      };

      return validTransitions[currentStatus]?.includes(newStatus) || false;
    },

    // Vérifier la validité d'une transition de statut pour un colis
    isValidPackageTransition(currentStatus, newStatus) {
      const validTransitions = {
        'pending': ['picked_up'],
        'picked_up': ['in_transit', 'failed'],
        'in_transit': ['delivered', 'at_agency', 'transferred', 'failed'],
        'at_agency': ['transferred'],
        'transferred': [], // Final
        'delivered': [], // Final
        'failed': ['pending'] // Retry possible
      };

      return validTransitions[currentStatus]?.includes(newStatus) || false;
    },

    async healthCheck() {
      try {
        await http.get('/health');
        return { success: true, online: true };
      } catch (error) {
        return { success: false, online: false, message: error.message };
      }
    },

    getMockDeliveries() {
      return {
        success: true,
        data: [
          {
            id: '1',
            clientInfo: { name: 'Marie Dubois', phone: '612345678' },
            status: 'assigned',
            deliveryType: 'local',
            totalAmount: 15000,
            packages: [
              {
                id: 'p1',
                description: 'Colis fragile',
                amount: 8000,
                status: 'pending',
                recipient: 'Jean Martin',
                trackingNumber: 'TRK001'
              },
              {
                id: 'p2',
                description: 'Documents',
                amount: 7000,
                status: 'pending',
                recipient: 'Sophie Dupont',
                trackingNumber: 'TRK002'
              }
            ],
            createdAt: '2024-01-21T10:30:00'
          },
          {
            id: '2',
            clientInfo: { name: 'Jean Martin', phone: '698765432' },
            status: 'in_progress',
            deliveryType: 'transfer',
            totalAmount: 25000,
            packages: [
              {
                id: 'p3',
                description: 'Équipement',
                amount: 25000,
                status: 'in_transit',
                recipient: 'Alain Bernard',
                trackingNumber: 'TRK003'
              }
            ],
            createdAt: '2024-01-21T09:15:00'
          }
        ]
      };
    },

    getMockProfile() {
      return {
        success: true,
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '612345678',
          matricule: 'LIV-001',
          totalDeliveries: 45,
          completedDeliveries: 38,
          failedDeliveries: 3,
          transferredDeliveries: 4,
          rating: 4.5
        }
      };
    }
  },

  /**
   * ==================== HOOKS UTILES POUR REACT ====================
   */
  hooks: {
    useApi() {
      return {
        fetchWithLoading: async (apiCall, setLoading, setError) => {
          try {
            setLoading(true);
            setError(null);
            return await apiCall();
          } catch (error) {
            setError(error.message);
            throw error;
          } finally {
            setLoading(false);
          }
        },

        handleAuthError: (error, navigate) => {
          if (error.status === 401) {
            tokenService.clearAll();
            navigate('/login');
          }
        }
      };
    }
  }
};

// Export pour utilisation dans les composants JSX
export default apiService;

// Export des utilitaires séparément si besoin
export { tokenService, http, statusMapper };