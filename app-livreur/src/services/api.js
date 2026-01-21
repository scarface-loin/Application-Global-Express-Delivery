// ==================== src/services/api.js ====================
/**
 * Service API pour le livreur - Compatible JSX/React
 * Version: 1.0.0
 */

// Configuration
const API_BASE_URL = 'https://application-global-express-delivery-back.onrender.com/api'; // Remplacez par votre URL

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

    // Configuration de la requête
    const config = {
      ...options,
      headers,
      // Ajouter un timeout
      signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : null
    };

    // Si c'est FormData, on laisse le navigateur gérer le Content-Type
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);

      // Gérer les réponses sans contenu
      if (response.status === 204) {
        return { success: true };
      }

      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Vérifier si la réponse est OK
      if (!response.ok) {
        const error = {
          status: response.status,
          message: data.message || data.error || 'Une erreur est survenue',
          data: data
        };
        
        // Gérer les erreurs d'authentification
        if (response.status === 401) {
          tokenService.clearAll();
          // Émettre un événement pour que les composants React puissent réagir
          window.dispatchEvent(new CustomEvent('auth-error'));
        }
        
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Gérer les erreurs réseau
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

  // Méthodes HTTP simplifiées
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

// Service API principal
const apiService = {
  /**
   * ==================== AUTHENTIFICATION ====================
   */
  auth: {
    // Connexion
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

    // Déconnexion
    async logout() {
      try {
        await http.post('/auth/logout');
      } catch (error) {
        console.warn('Erreur lors de la déconnexion:', error);
      } finally {
        tokenService.clearAll();
      }
    },

    // Changer le mot de passe
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

    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
      return !!tokenService.getToken();
    },

    // Obtenir l'utilisateur courant
    getCurrentUser() {
      return tokenService.getUser();
    },

    // Obtenir le token
    getToken() {
      return tokenService.getToken();
    }
  },

  /**
   * ==================== LIVRAISONS (FONCTIONNALITÉS LIVREUR) ====================
   */
  deliveries: {
    // Obtenir les livraisons du livreur (avec filtres optionnels)
    async getAll(filters = {}) {
      try {
        const deliveries = await http.get('/deliveries', filters);
        return {
          success: true,
          data: deliveries,
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

    // Accepter une livraison
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

    // Mettre à jour le statut d'une livraison
    async updateStatus(deliveryId, status) {
      try {
        const result = await http.patch(`/deliveries/${deliveryId}/status`, { status });
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

    // Mettre à jour le statut d'un colis
    async updatePackageStatus(deliveryId, packageId, status) {
      try {
        const result = await http.patch(
          `/deliveries/${deliveryId}/packages/${packageId}/status`,
          { status }
        );
        return {
          success: true,
          data: result,
          message: result.message || 'Statut du colis mis à jour'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    },

    // Uploader un reçu de transfert
    async uploadTransferReceipt(deliveryId, file) {
      try {
        const formData = new FormData();
        formData.append('receipt', file);
        
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

    // Méthodes utilitaires pour les statuts
    async startDelivery(deliveryId) {
      return this.updateStatus(deliveryId, 'in_progress');
    },

    async completeDelivery(deliveryId) {
      return this.updateStatus(deliveryId, 'delivered');
    },

    async cancelDelivery(deliveryId) {
      return this.updateStatus(deliveryId, 'cancelled');
    }
  },

  /**
   * ==================== NOTIFICATIONS ====================
   */
  notifications: {
    // Obtenir toutes les notifications
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

    // Marquer une notification comme lue
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

    // Marquer toutes les notifications comme lues
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
    // Obtenir le profil
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

    // Mettre à jour le profil
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

    // Changer le mot de passe
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

    // Mettre à jour la photo de profil
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
    // Suivre un colis
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
    }
  },

  /**
   * ==================== STATISTIQUES ====================
   */
  stats: {
    // Obtenir les statistiques du livreur
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

    // Obtenir l'historique
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
    }
  },

  /**
   * ==================== UTILITAIRES ====================
   */
  utils: {
    // Vérifier la santé de l'API
    async healthCheck() {
      try {
        await http.get('/health');
        return { success: true, online: true };
      } catch (error) {
        return { success: false, online: false, message: error.message };
      }
    },

    // Données mockées pour le développement
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
              { id: 'p1', description: 'Colis fragile', amount: 8000 },
              { id: 'p2', description: 'Documents', amount: 7000 }
            ],
            createdAt: '2024-01-21T10:30:00'
          },
          {
            id: '2',
            clientInfo: { name: 'Jean Martin', phone: '698765432' },
            status: 'pending',
            deliveryType: 'transfer',
            totalAmount: 25000,
            packages: [
              { id: 'p3', description: 'Équipement', amount: 25000 }
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
          rating: 4.5
        }
      };
    }
  },

  /**
   * ==================== HOOKS UTILES POUR REACT ====================
   */
  hooks: {
    // Hook personnalisé pour utiliser l'API dans les composants
    useApi() {
      // Cette fonction serait utilisée dans un hook React personnalisé
      return {
        // Retourne des fonctions d'aide pour les composants
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

        // Gérer les erreurs d'authentification
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
export { tokenService, http };