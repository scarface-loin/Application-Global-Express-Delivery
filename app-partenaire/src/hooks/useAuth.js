/**
 * 🎣 HOOK useAuth - Gestion authentification + partenaire
 */

import { useState, useEffect, useCallback } from 'react';
import {
  authenticatePartenaire,
  saveAuth,
  getAuth,
  clearAuth,
  fetchPartenaireInfo
} from '../services/firebase.service';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPartenaire, setCurrentPartenaire] = useState(null);
  const [partenaireInfo, setPartenaireInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(() => {
    const partenaire = getAuth();
    if (partenaire?.id) {
      setCurrentPartenaire(partenaire);
      setIsAuthenticated(true);
      loadPartenaireInfo(partenaire.id);
    }
    setLoading(false);
  }, []);

  const loadPartenaireInfo = async (partenaireId) => {
    try {
      const info = await fetchPartenaireInfo(partenaireId);
      setPartenaireInfo(info);
    } catch (err) {
      console.error('Erreur chargement info:', err);
    }
  };

  const login = useCallback(async (telephone, motDePasse) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authenticatePartenaire(telephone, motDePasse);
      
      if (result.success) {
        saveAuth(result.partenaire);
        setCurrentPartenaire(result.partenaire);
        setIsAuthenticated(true);
        await loadPartenaireInfo(result.partenaire.id);
        return { success: true, partenaire: result.partenaire };
      }
    } catch (err) {
      const errorMessage = err.message || 'Erreur de connexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setCurrentPartenaire(null);
    setPartenaireInfo(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    currentPartenaire,
    partenaireInfo,
    loading,
    error,
    login,
    logout
  };
};