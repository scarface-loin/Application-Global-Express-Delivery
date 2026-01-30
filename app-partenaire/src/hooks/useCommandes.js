/**
 * 🎣 HOOK useCommandes - Gestion commandes + stats
 */

import { useState, useEffect, useCallback } from 'react';
import { createLivraison, fetchCommandes, fetchStats } from '../services/firebase.service';
import { filterCommandes, extractStats } from '../services/utils';
import { AUTO_REFRESH_DELAY } from '../constants';

export const useCommandes = (partenaireId, partenaireNom, autoRefresh = false) => {
  const [commandes, setCommandes] = useState([]);
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ statut: 'tous', type: 'tous', search: '' });

  useEffect(() => {
    if (partenaireId) {
      loadCommandes();
    }
  }, [partenaireId]);

  useEffect(() => {
    if (autoRefresh && partenaireId) {
      const interval = setInterval(loadCommandes, AUTO_REFRESH_DELAY);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, partenaireId]);

  useEffect(() => {
    const filtered = filterCommandes(commandes, filters);
    setFilteredCommandes(filtered);
  }, [commandes, filters]);

  useEffect(() => {
    if (commandes.length > 0) {
      const localStats = extractStats(commandes);
      setStats(localStats);
    }
  }, [commandes]);

  const loadCommandes = useCallback(async () => {
    if (!partenaireId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchCommandes(partenaireId);
      setCommandes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [partenaireId]);

  const createCommande = useCallback(async (formData, articles, deliveryType) => {
    if (!partenaireId || !partenaireNom) {
      throw new Error('Informations manquantes');
    }

    const result = await createLivraison(partenaireId, partenaireNom, formData, articles, deliveryType);
    
    if (result.success) {
      await loadCommandes();
    }
    
    return result;
  }, [partenaireId, partenaireNom, loadCommandes]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    commandes: filteredCommandes,
    allCommandes: commandes,
    stats,
    loading,
    error,
    filters,
    createCommande,
    refreshCommandes: loadCommandes,
    updateFilters
  };
};