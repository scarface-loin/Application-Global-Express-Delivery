// ==================== src/components/ReconciliationTab.jsx ====================
import React, { useState, useEffect } from 'react';
import { Wallet, PackageX, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiService from '../services/api';

const ReconciliationTab = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const result = await apiService.reconciliation.getSummary();
      
      if (result.success) {
        setSummary(result.data);
      } else {
        // Fallback si l'API n'est pas encore prête
        setSummary({
          cash: { totalAmount: 0, count: 0, items: [] },
          returns: { count: 0, items: [] }
        });
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le bilan.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSettlement = async () => {
    if (!summary?.cash?.totalAmount) return;

    if (!window.confirm(`Confirmer le versement de ${summary.cash.totalAmount.toLocaleString()} FCFA ?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiService.reconciliation.submitRequest(summary.cash.totalAmount);
      if (result.success) {
        setSuccessMsg("Demande de versement envoyée à l'admin !");
        // On recharge les données pour voir si le statut change (selon logique backend)
        setTimeout(fetchSummary, 2000); 
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erreur lors de la demande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-14 px-4 h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-10 border-b border-gray-200 px-4 pt-safe-top pb-3 shadow-sm max-w-md mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mt-2">Bilan & Caisse</h1>
        <p className="text-xs text-gray-500">Réconciliation de fin de journée</p>
      </div>

      <div className="mt-4 space-y-6">
        
        {/* Messages Succès / Erreur */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="text-green-600" size={24} />
            <p className="text-green-800 text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600" size={24} />
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* SECTION 1 : CASH / CAISSE */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Total Espèces</h2>
              <p className="text-xs text-gray-500">Argent en votre possession</p>
            </div>
          </div>

          <div className="text-center py-4 border-t border-b border-gray-100 my-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {summary?.cash?.totalAmount?.toLocaleString() || 0}
            </span>
            <span className="text-sm text-gray-500 font-medium ml-1">FCFA</span>
          </div>

          <div className="mt-4">
            <button
              onClick={handleRequestSettlement}
              disabled={submitting || !summary?.cash?.totalAmount}
              className={`w-full py-3 rounded-xl font-semibold text-white shadow-md transition-all active:scale-95
                ${!summary?.cash?.totalAmount 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
            >
              {submitting ? 'Traitement...' : 'Demander le versement'}
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">
              {summary?.cash?.count || 0} livraison(s) à régler
            </p>
          </div>
        </div>

        {/* SECTION 2 : RETOURS COLIS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <PackageX className="text-orange-600" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Retours à l'agence</h2>
              <p className="text-xs text-gray-500">Colis non livrés à ramener</p>
            </div>
          </div>

          {summary?.returns?.items?.length > 0 ? (
            <div className="space-y-3">
              {summary.returns.items.map((pkg, index) => (
                <div key={pkg.packageId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{pkg.trackingNumber || 'Sans N°'}</p>
                    <p className="text-xs text-red-500 font-medium mt-0.5">{pkg.reason || 'Échec livraison'}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              ))}
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100 text-xs text-orange-800">
                ⚠️ Veuillez scanner ces colis au dépôt pour valider le retour.
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm">Aucun colis à retourner.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReconciliationTab;