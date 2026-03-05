import React, { useState, useEffect } from 'react';
import {
  FiPackage,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiUser,
  FiFileText,
  FiDollarSign,
  FiInbox,
} from 'react-icons/fi';
import FacturePartenaireModal from './modal/FacturePartenaireModal';
import { fetchPartnerDeliveriesToInvoice } from './logic/FacturePartenairePageLogic';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatAmount = (amount) =>
  `${(amount || 0).toLocaleString('fr-FR')} FCFA`;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const safeDate = (val) => {
  if (!val) return null;
  if (typeof val?.toDate === 'function') return val.toDate();
  return new Date(val);
};

// ─── Badge statut ─────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const styles =
    type === 'course'
      ? 'bg-sky-100 text-sky-700 border border-sky-200'
      : 'bg-amber-100 text-amber-700 border border-amber-200';
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${styles}`}>
      {type === 'course' ? 'Course' : 'Expédition'}
    </span>
  );
};

// ─── Skeleton loader ───────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-200 rounded-full" />
        <div className="h-3 w-24 bg-slate-100 rounded-full" />
      </div>
      <div className="h-8 w-8 bg-slate-100 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-xl" />
      ))}
    </div>
  </div>
);

// ─── Carte livraison ───────────────────────────────────────────────────────────
const DeliveryCard = ({ delivery, onClick }) => {
  const dateCreation = safeDate(delivery.dateCreation);

  return (
    <div
      onClick={() => onClick(delivery)}
      className="group bg-white rounded-2xl border-2 border-slate-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/60 active:scale-[0.985] cursor-pointer transition-all duration-200"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md shadow-violet-200 flex-shrink-0">
              <FiFileText className="text-white" size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800 text-sm tracking-tight">
                  {delivery.numeroSuivi}
                </span>
                <TypeBadge type={delivery.type} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {delivery.partenaireNom}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
            <FiChevronRight className="text-violet-500 group-hover:translate-x-0.5 transition-transform" size={16} />
          </div>
        </div>

        {/* Infos grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Date */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-1 text-slate-400 mb-1">
              <FiClock size={10} />
              <span className="uppercase tracking-wider font-bold text-[9px]">Date</span>
            </div>
            <p className="font-bold text-slate-700 leading-tight">
              {dateCreation ? formatDate(dateCreation) : '—'}
            </p>
          </div>

          {/* Destination */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-1 text-slate-400 mb-1">
              <FiMapPin size={10} />
              <span className="uppercase tracking-wider font-bold text-[9px]">Destination</span>
            </div>
            <p className="font-bold text-slate-700 leading-tight truncate">
              {delivery.quartier}
            </p>
          </div>

          {/* Montant */}
          <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
            <div className="flex items-center gap-1 text-violet-400 mb-1">
              <FiDollarSign size={10} />
              <span className="uppercase tracking-wider font-bold text-[9px]">Montant</span>
            </div>
            <p className="font-bold text-violet-700 leading-tight">
              {formatAmount(delivery.coutLivraisonPartenaire)}
            </p>
          </div>
        </div>

        {/* Client si disponible */}
        {delivery.nomClient && delivery.nomClient !== 'N/A' && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <FiUser size={11} />
            <span>Client : <span className="text-slate-600 font-medium">{delivery.nomClient}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Page principale ───────────────────────────────────────────────────────────
export default function FacturePartenairePage() {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchPartnerDeliveriesToInvoice();
      setDeliveries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleValidationSuccess = () => {
    setSelectedDelivery(null);
    loadData(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <FiPackage className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Factures Partenaires
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                Livraisons livrées en attente de dépôt
              </p>
            </div>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="w-9 h-9 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center hover:border-violet-300 hover:bg-violet-50 transition-all shadow-sm"
            title="Actualiser"
          >
            <FiRefreshCw
              size={15}
              className={`text-violet-500 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* ── Compteur ── */}
        {!loading && deliveries.length > 0 && (
          <div className="mb-5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full">
              <FiInbox size={12} />
              {deliveries.length} en attente de validation
            </span>
          </div>
        )}

        {/* ── Erreur ── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-5 text-sm">
            <FiAlertCircle className="flex-shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-bold">Erreur de chargement</p>
              <p className="text-red-500 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && deliveries.length === 0 && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="text-emerald-500" size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tout est à jour !</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
              Aucune livraison partenaire n'est en attente de validation financière.
            </p>
          </div>
        )}

        {/* ── Liste des livraisons ── */}
        {!loading && deliveries.length > 0 && (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onClick={setSelectedDelivery}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal validation ── */}
      {selectedDelivery && (
        <FacturePartenaireModal
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          onValidateSuccess={handleValidationSuccess}
        />
      )}
    </div>
  );
}