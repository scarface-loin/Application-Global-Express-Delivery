// src/pages/logic/SettlementsPageLogic.js
import { useState, useEffect } from 'react';
import adminApi from '../../../services/adminApi';

export const useSettlementsLogic = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // États pour le Modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [driverDetails, setDriverDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // ✨ NOUVEAU : États pour le formulaire de versement
  const [amountCollected, setAmountCollected] = useState('');
  const [confirmReturns, setConfirmReturns] = useState(true);
  const [showValidationForm, setShowValidationForm] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Charger la liste des livreurs
  const loadDrivers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await adminApi.reconciliation.getDriversWithBalance();
      setDrivers(response.data || []);
    } catch (error) {
      console.error("Erreur chargement livreurs:", error);
      setErrorMsg("Impossible de charger la liste des livreurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  // 2. Ouvrir le modal et charger les détails
  const handleOpenSettleModal = async (driver) => {
    setSelectedDriver(driver);
    setShowSettleModal(true);
    setDetailsLoading(true);
    setDriverDetails(null);
    setShowValidationForm(false); // Réinitialiser le formulaire
    setAmountCollected(''); // Réinitialiser le montant
    
    try {
      const response = await adminApi.reconciliation.getDriverDetails(driver.driverId || driver.id);
      const rawData = response.data;
      
      setDriverDetails({
        driverId: rawData.driverId,
        driverName: rawData.name,
        driverPhone: rawData.phone,
        driverMatricule: rawData.matricule,
        summary: {
          totalCash: rawData.summary.totalCash,
          deliveredCount: rawData.summary.deliveredCount,
          pendingReturns: rawData.summary.pendingReturns,
          currentDebt: rawData.summary.currentDebt,
          pendingRequest: rawData.summary.pendingRequest
        },
        cashDetails: rawData.cashDetails || [],
        returnDetails: rawData.returnDetails || []
      });

    } catch (error) {
      console.error("Erreur chargement détails:", error);
      alert("Impossible de récupérer les détails du versement.");
      handleCloseModal();
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSettleModal(false);
    setSelectedDriver(null);
    setDriverDetails(null);
    setAmountCollected('');
    setShowValidationForm(false);
    setConfirmReturns(true);
  };

  // ✨ NOUVEAU : Afficher le formulaire de validation
  const handleShowValidationForm = () => {
    setShowValidationForm(true);
    // Pré-remplir avec le montant attendu (optionnel)
    setAmountCollected(driverDetails?.summary?.totalCash?.toString() || '');
  };

  // ✨ NOUVEAU : Calculer la différence
  const calculateDifference = () => {
    if (!driverDetails || !amountCollected) return 0;
    const expected = driverDetails.summary.totalCash;
    const collected = parseFloat(amountCollected) || 0;
    return expected - collected;
  };

  // 3. Confirmer le versement avec montant saisi par l'admin
  const handleConfirmSettlement = async () => {
    if (!selectedDriver || !driverDetails) return;
    
    // Validation du montant
    if (!amountCollected || parseFloat(amountCollected) < 0) {
      alert("Veuillez entrer un montant valide.");
      return;
    }

    const collected = parseFloat(amountCollected);
    const expected = driverDetails.summary.totalCash;
    const difference = expected - collected;

    // ✨ Confirmation si différence importante
    if (Math.abs(difference) > 0) {
      const confirmMsg = difference > 0 
        ? `⚠️ ATTENTION : Le montant collecté (${formatAmount(collected)}) est INFÉRIEUR au montant attendu (${formatAmount(expected)}).\n\nDIFFÉRENCE : ${formatAmount(difference)}\n\nCette différence sera enregistrée comme DETTE et prélevée sur le salaire du livreur.\n\nVoulez-vous continuer ?`
        : `ℹ️ Le montant collecté (${formatAmount(collected)}) est SUPÉRIEUR au montant attendu (${formatAmount(expected)}).\n\nEXCÉDENT : ${formatAmount(Math.abs(difference))}\n\nVoulez-vous continuer ?`;
      
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }
    
    setProcessing(true);
    try {
      const payload = {
        driverId: selectedDriver.driverId || selectedDriver.id,
        amountCollected: collected,
        confirmReturns
      };

      const response = await adminApi.reconciliation.settleDriver(payload);
      
      // ✨ Message personnalisé selon qu'il y a une dette ou non
      if (response.data.debtGenerated > 0) {
        setSuccessMsg(
          `✅ Versement validé avec succès !\n\n` +
          `Montant collecté : ${formatAmount(collected)}\n` +
          `⚠️ Dette enregistrée : ${formatAmount(response.data.debtGenerated)}\n` +
          `Dette totale du livreur : ${formatAmount(response.data.newTotalDebt)}\n\n` +
          `Cette dette sera prélevée sur le salaire du livreur.`
        );
      } else {
        setSuccessMsg(
          `✅ Versement de ${formatAmount(collected)} validé avec succès !\n` +
          (difference < 0 ? `\nExcédent de ${formatAmount(Math.abs(difference))} enregistré.` : '')
        );
      }
      
      handleCloseModal();
      loadDrivers(); // Recharger la liste
      
      // Nettoyer le message après 8 secondes
      setTimeout(() => setSuccessMsg(''), 8000);

    } catch (error) {
      console.error("Erreur lors du versement:", error);
      const errorMessage = error.response?.data?.error || error.message || "Erreur lors de la validation du versement.";
      setErrorMsg(errorMessage);
      
      // Nettoyer l'erreur après 5 secondes
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setProcessing(false);
    }
  };

  // ✨ NOUVEAU : Formater les montants
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '0 XAF';
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(amount) + ' XAF';
  };

  // ✨ NOUVEAU : Valider le montant saisi
  const isValidAmount = () => {
    const collected = parseFloat(amountCollected);
    return !isNaN(collected) && collected >= 0;
  };

  // ✨ NOUVEAU : Obtenir le style d'alerte selon la différence
  const getDifferenceAlertType = () => {
    const diff = calculateDifference();
    if (diff > 0) return 'warning'; // Dette
    if (diff < 0) return 'info'; // Excédent
    return 'success'; // Montant exact
  };

  return {
    // États de base
    drivers,
    loading,
    selectedDriver,
    driverDetails,
    detailsLoading,
    showSettleModal,
    processing,
    successMsg,
    errorMsg,
    
    // ✨ NOUVEAUX : États du formulaire
    amountCollected,
    setAmountCollected,
    confirmReturns,
    setConfirmReturns,
    showValidationForm,
    
    // ✨ NOUVEAUX : Fonctions utilitaires
    calculateDifference,
    isValidAmount,
    getDifferenceAlertType,
    
    // Fonctions d'action
    setSuccessMsg,
    setErrorMsg,
    handleOpenSettleModal,
    handleCloseModal,
    handleShowValidationForm,
    handleConfirmSettlement,
    formatAmount,
    refreshData: loadDrivers
  };
};