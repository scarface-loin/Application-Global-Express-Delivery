// src/services/adminApi.js
import { apiRequest } from './api';

const adminApi = {
  reconciliation: {
    // 1. Liste des livreurs (GET)
    getDriversWithBalance: async () => {
      return apiRequest('/admin/reconciliation/drivers', {
        method: 'GET'
      });
    },

    // 2. Détails d'un livreur (GET)
    getDriverDetails: async (driverId) => {
      return apiRequest(`/admin/reconciliation/drivers/${driverId}/details`, {
        method: 'GET'
      });
    },

    // 3. Valider le versement (POST)
    settleDriver: async (data) => {
      // data = { driverId, amountCollected, confirmReturns }
      return apiRequest('/admin/reconciliation/settle', {
        method: 'POST',
        body: data
      });
    },

    // 4. Historique (GET)
    getHistory: async (filters = {}) => {
      // Construction de la Query String
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/admin/reconciliation/history${params ? `?${params}` : ''}`;
      
      return apiRequest(endpoint, {
        method: 'GET'
      });
    },

    // 5. Stats (GET)
    getStats: async () => {
      return apiRequest('/admin/reconciliation/stats', {
        method: 'GET'
      });
    }
  }
};

export default adminApi;