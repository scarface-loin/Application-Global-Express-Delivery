// src/pages/logic/SettlementsPageLogic.js
import { useState, useEffect } from 'react';
import adminApi from '../../../services/adminApi'; // Assure-toi que le chemin est bon

export const useSettlementsLogic = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // États pour le Modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [driverDetails, setDriverDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Charger la liste des livreurs
  const loadDrivers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await adminApi.reconciliation.getDriversWithBalance();
      // Selon ta doc, les livreurs sont dans response.data
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
    
    try {
      const response = await adminApi.reconciliation.getDriverDetails(driver.driverId || driver.id);
      // Selon ta doc, les détails sont dans response.data
      
      // Adaptation du format pour l'affichage si nécessaire
      const rawData = response.data;
      
      // On structure les données pour faciliter l'affichage dans le modal
      setDriverDetails({
        summary: rawData.summary,
        deliveries: rawData.cashDetails.map(d => ({
          id: d.deliveryId,
          client: d.clientName,
          amount: d.amount,
          type: d.deliveryType
        })),
        returns: rawData.returnDetails.map(r => ({
          tracking: r.trackingNumber,
          reason: r.reason,
          status: r.status
        }))
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
  };

  // 3. Confirmer le versement (Appel POST /settle)
  const handleConfirmSettlement = async () => {
    if (!selectedDriver || !driverDetails) return;
    
    setProcessing(true);
    try {
      // Préparation du body selon ta doc
      const payload = {
        driverId: selectedDriver.driverId || selectedDriver.id,
        amountCollected: driverDetails.summary.totalCash, // On prend le montant calculé par le système
        confirmReturns: true // Par défaut on valide aussi les retours
      };

      await adminApi.reconciliation.settleDriver(payload);
      
      setSuccessMsg(`Versement de ${formatAmount(payload.amountCollected)} validé avec succès.`);
      
      // Fermer le modal et rafraîchir la liste
      handleCloseModal();
      loadDrivers(); // Recharger la liste pour faire disparaître le livreur traité
      
      // Nettoyer le message après 5 sec
      setTimeout(() => setSuccessMsg(''), 5000);

    } catch (error) {
      console.error("Erreur lors du versement:", error);
      // Afficher l'erreur renvoyée par l'API (ex: montant incorrect)
      alert(error.message || "Erreur lors de la validation du versement.");
    } finally {
      setProcessing(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  return {
    drivers,
    loading,
    selectedDriver,
    driverDetails,
    detailsLoading,
    showSettleModal,
    processing,
    successMsg,
    errorMsg,
    setSuccessMsg,
    handleOpenSettleModal,
    handleCloseModal,
    handleConfirmSettlement,
    formatAmount,
    refreshData: loadDrivers
  };
};