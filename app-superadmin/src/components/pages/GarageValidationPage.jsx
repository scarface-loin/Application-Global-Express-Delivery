import React, { useState, useEffect, useCallback } from 'react';
import {
  FiTool, FiCalendar, FiTruck, FiChevronRight, FiAlertCircle,
  FiDollarSign, FiCheckCircle, FiXCircle, FiLoader, FiClock,
  FiUser, FiFileText, FiFilter, FiRefreshCw, FiAlertTriangle,
  FiTrendingDown, FiList, FiX
} from 'react-icons/fi';
import {
  fetchDemandesGarage,
  validerDemandeGarage,
  rejeterDemandeGarage
} from './logic/GarageValidationPageLogic';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const formatAmount = (n) => {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toLocaleString('fr-FR')} FCFA`;
};

const formatDate = (ds) => {
  if (!ds) return '—';
  const d = new Date(ds);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDateShort = (ds) => {
  if (!ds) return '—';
  const d = new Date(ds);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── BADGE STATUT ────────────────────────────────────────────────────────────

const StatutBadge = ({ statut }) => {
  const map = {
    en_attente: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'En attente' },
    valide:     { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Validé' },
    rejete:     { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Rejeté' },
  };
  const s = map[statut] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: statut };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const UrgenceBadge = ({ urgence }) => {
  if (urgence === 'haute') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
      <FiAlertTriangle size={10} /> URGENT
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
      Normal
    </span>
  );
};


// ─── DÉTAILS SESSION ─────────────────────────────────────────────────────────

function SessionDetails({ session }) {
  if (!session) return (
    <div className="bg-gray-50 rounded-2xl p-4 text-center text-xs text-gray-400">
      Aucune donnée de session disponible
    </div>
  );

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Résumé financier session */}
      <div className="bg-slate-900 rounded-2xl p-4 text-white">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Session du {formatDateShort(session.date)}</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-slate-400">Attendu</p>
            <p className="text-base font-black text-white">{formatAmount(session.montantTheorique)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Reçu</p>
            <p className="text-base font-black text-emerald-400">{formatAmount(session.montantRecu)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Cash manquant</p>
            <p className="text-base font-black text-red-400">{formatAmount(session.cashManquant)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Articles perdus</p>
            <p className="text-base font-black text-orange-400">{formatAmount(session.montantPerduArticles)}</p>
          </div>
        </div>
        {session.ecartCash > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-400">Dette totale ajoutée</span>
            <span className="text-sm font-black text-red-400">{formatAmount(session.totalDetteAjoutee)}</span>
          </div>
        )}
      </div>

      {/* Compteurs articles */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-emerald-700">{session.totalArticlesLivres ?? '—'}</p>
          <p className="text-[10px] text-emerald-600 font-bold">Livrés</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-amber-700">{session.totalArticlesRetournes ?? '—'}</p>
          <p className="text-[10px] text-amber-600 font-bold">Retournés</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-red-700">{session.totalArticlesPerdus ?? '—'}</p>
          <p className="text-[10px] text-red-600 font-bold">Perdus</p>
        </div>
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-[10px] text-blue-500 uppercase font-bold mb-1">Notes admin</p>
          <p className="text-xs text-blue-800">{session.notes}</p>
        </div>
      )}

      {/* Détail par livraison (expandable) */}
      {session.livraisons && session.livraisons.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between py-2 px-3 bg-gray-100 rounded-xl text-xs font-bold text-gray-600"
          >
            <span>{session.nbCourses} livraison{session.nbCourses > 1 ? 's' : ''} de la session</span>
            <span>{expanded ? '▲ Réduire' : '▼ Voir détail'}</span>
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {session.livraisons.map((liv, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-gray-800">{liv.tracking}</p>
                      <p className="text-[10px] text-gray-400">{liv.quartier} · {liv.origine}</p>
                    </div>
                    <p className="text-xs font-black text-indigo-700">{formatAmount(liv.totalCalcule)}</p>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✓ {liv.nbArticlesLivres} livré{liv.nbArticlesLivres > 1 ? 's' : ''}</span>
                    {liv.nbArticlesRetournes > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">↩ {liv.nbArticlesRetournes} retour</span>}
                    {liv.nbArticlesPerdus > 0 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">✗ {liv.nbArticlesPerdus} perdu</span>}
                  </div>
                  {/* Articles détaillés */}
                  {liv.articles && liv.articles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {liv.articles.map((art, j) => (
                        <div key={j} className="flex justify-between text-[10px] text-gray-500">
                          <span className="truncate max-w-[140px]">{art.nom}</span>
                          <span className="flex gap-2 flex-shrink-0">
                            {art.quantiteLivree > 0 && <span className="text-emerald-600">✓{art.quantiteLivree}</span>}
                            {art.quantiteRetournee > 0 && <span className="text-amber-600">↩{art.quantiteRetournee}</span>}
                            {art.quantitePerdue > 0 && <span className="text-red-600">✗{art.quantitePerdue}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MODAL VALIDATION ────────────────────────────────────────────────────────

function GarageValidationModal({ demande, onClose, onActionSuccess }) {
  const [cout, setCout] = useState(demande.montantManquant || '');
  const [motifRejet, setMotifRejet] = useState('');
  const [mode, setMode] = useState('valider'); // 'valider' | 'rejeter'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleValidation = async () => {
    const coutFinal = parseFloat(cout);
    if (!cout || coutFinal <= 0) { setError('Veuillez entrer un coût valide.'); return; }
    setLoading(true); setError('');
    try {
      await validerDemandeGarage(demande.id, demande.idLivreur, coutFinal, demande);
      onActionSuccess(demande.id, coutFinal, false);
      onClose();
    } catch (err) {
      setError("Échec de la validation. Réessayez.");
    } finally { setLoading(false); }
  };

  const handleReject = async () => {
    setLoading(true); setError('');
    try {
      await rejeterDemandeGarage(demande.id, demande, motifRejet);
      onActionSuccess(demande.id, null, true);
      onClose();
    } catch (err) {
      setError("Échec du rejet. Réessayez.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <FiTool className="text-white" size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Validation Garage</p>
              <h2 className="text-base font-bold text-gray-900">{demande.nomLivreur}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Détails complets de la demande */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Véhicule</p>
              <p className="text-sm font-semibold text-gray-800">{demande.vehicule}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Immatriculation</p>
              <p className="text-sm font-semibold text-gray-800">{demande.immatriculation}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Date demande</p>
              <p className="text-xs font-semibold text-gray-800">{formatDateShort(demande.date)}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Urgence</p>
              <UrgenceBadge urgence={demande.urgence} />
            </div>
          </div>

          {demande.motif && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <p className="text-[10px] text-orange-600 uppercase font-bold mb-1">Motif</p>
              <p className="text-sm text-gray-800 font-medium">{demande.motif}</p>
            </div>
          )}
          {demande.description && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-[10px] text-amber-600 uppercase font-bold mb-1">Description</p>
              <p className="text-sm text-gray-700">{demande.description}</p>
            </div>
          )}

          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-red-600 uppercase font-bold mb-1">Montant estimé</p>
              <p className="text-xl font-black text-red-700">{formatAmount(demande.montantManquant)}</p>
            </div>
            <FiTrendingDown className="text-red-300" size={32} />
          </div>

          {/* ── Détails de la session à l'origine de cette demande ── */}
          {demande.session && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                <FiFileText size={12} /> Session d'origine
              </p>
              <SessionDetails session={demande.session} />
            </div>
          )}

          {/* Onglets Valider / Rejeter */}
          <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
            <button
              onClick={() => setMode('valider')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'valider' ? 'bg-white shadow text-emerald-700' : 'text-gray-500'}`}
            >
              ✓ Valider
            </button>
            <button
              onClick={() => setMode('rejeter')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'rejeter' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
            >
              ✕ Rejeter
            </button>
          </div>

          {mode === 'valider' ? (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Coût réel de la réparation *</label>
              <div className="relative">
                <input
                  type="number"
                  value={cout}
                  onChange={(e) => { setCout(e.target.value); setError(''); }}
                  placeholder="Montant réel"
                  className="w-full pl-4 pr-20 py-3.5 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-lg font-bold"
                />
                <span className="absolute inset-y-0 right-4 flex items-center text-gray-400 text-sm font-medium">FCFA</span>
              </div>
              {cout && demande.montantManquant && (
                <div className={`text-xs font-semibold px-3 py-2 rounded-xl ${parseFloat(cout) < demande.montantManquant ? 'bg-emerald-50 text-emerald-700' : parseFloat(cout) > demande.montantManquant ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                  {parseFloat(cout) < demande.montantManquant
                    ? `✓ Économie de ${formatAmount(demande.montantManquant - parseFloat(cout))}`
                    : parseFloat(cout) > demande.montantManquant
                    ? `⚠ Dépassement de ${formatAmount(parseFloat(cout) - demande.montantManquant)}`
                    : '= Montant identique à l\'estimation'}
                </div>
              )}
              {error && <p className="text-sm text-red-600 flex items-center gap-1"><FiAlertCircle size={14} />{error}</p>}
              <button
                onClick={handleValidation}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <FiLoader className="animate-spin" size={18} /> : <FiCheckCircle size={18} />}
                {loading ? 'Validation en cours...' : 'Confirmer la Validation'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Motif du rejet (optionnel)</label>
              <textarea
                value={motifRejet}
                onChange={(e) => setMotifRejet(e.target.value)}
                placeholder="Expliquez pourquoi la demande est rejetée..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-400 outline-none text-sm resize-none"
              />
              {error && <p className="text-sm text-red-600 flex items-center gap-1"><FiAlertCircle size={14} />{error}</p>}
              <button
                onClick={handleReject}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <FiLoader className="animate-spin" size={18} /> : <FiXCircle size={18} />}
                {loading ? 'Rejet en cours...' : 'Confirmer le Rejet'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CARTE DEMANDE ────────────────────────────────────────────────────────────

function DemandeCard({ demande, onClick, isProcessed }) {
  return (
    <div
      onClick={demande.statut === 'en_attente' ? onClick : undefined}
      className={`bg-white rounded-2xl border-2 transition-all ${
        demande.statut === 'en_attente'
          ? 'border-orange-200 hover:border-orange-400 hover:shadow-lg cursor-pointer active:scale-[0.99]'
          : 'border-gray-100 opacity-80'
      }`}
    >
      <div className="p-4">
        {/* Header carte */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg text-white ${
              demande.urgence === 'haute' ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-orange-400 to-amber-500'
            }`}>
              {(demande.nomLivreur || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{demande.nomLivreur}</h3>
              <p className="text-[11px] text-gray-400 font-mono">{demande.idLivreur?.slice(-8)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatutBadge statut={demande.statut} />
            {demande.urgence === 'haute' && <UrgenceBadge urgence={demande.urgence} />}
          </div>
        </div>

        {/* Infos véhicule */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <FiTruck size={12} />
          <span className="font-medium">{demande.vehicule}</span>
          {demande.immatriculation !== 'N/A' && (
            <span className="bg-gray-100 px-2 py-0.5 rounded-md font-mono text-gray-600">{demande.immatriculation}</span>
          )}
        </div>

        {/* Motif */}
        <div className={`rounded-xl p-3 mb-3 ${demande.statut === 'en_attente' ? 'bg-orange-50' : 'bg-gray-50'}`}>
          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Motif</p>
          <p className="text-sm font-semibold text-gray-800 line-clamp-2">{demande.motif}</p>
        </div>

        {/* Montants */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-red-50 rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-red-400 uppercase font-bold mb-0.5">Estimé</p>
            <p className="text-sm font-black text-red-700">{formatAmount(demande.montantManquant)}</p>
          </div>
          <div className={`rounded-xl p-2.5 text-center ${demande.coutReel !== null ? 'bg-emerald-50' : 'bg-gray-50'}`}>
            <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Validé</p>
            <p className={`text-sm font-black ${demande.coutReel !== null ? 'text-emerald-700' : 'text-gray-300'}`}>
              {demande.coutReel !== null ? formatAmount(demande.coutReel) : '—'}
            </p>
          </div>
        </div>

        {/* Motif rejet */}
        {demande.statut === 'rejete' && demande.motifRejet && (
          <div className="bg-red-50 rounded-xl p-3 mb-3">
            <p className="text-[10px] text-red-400 uppercase font-bold mb-1">Motif du rejet</p>
            <p className="text-xs text-red-700">{demande.motifRejet}</p>
          </div>
        )}

        {/* Dates + Action */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <FiCalendar size={10} />
              <span>Demande: {formatDateShort(demande.date)}</span>
            </div>
            {demande.dateValidation && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <FiCheckCircle size={10} />
                <span>Traité: {formatDateShort(demande.dateValidation)}</span>
              </div>
            )}
          </div>
          {demande.statut === 'en_attente' && (
            <div className="flex items-center gap-1 text-orange-500 text-xs font-bold">
              Traiter <FiChevronRight size={14} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function GarageValidationPage() {
  const [demandes, setDemandes] = useState([]);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatut, setFilterStatut] = useState('tous');
  const [activeTab, setActiveTab] = useState('demandes'); // 'demandes' | 'resume'

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDemandesGarage();
      setDemandes(data);
    } catch (err) {
      setError("Impossible de charger les demandes. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleActionSuccess = (demandeId, cout, isRejected = false) => {
    setDemandes(prev =>
      prev.map(d =>
        d.id === demandeId
          ? { ...d, statut: isRejected ? 'rejete' : 'valide', coutReel: isRejected ? null : cout, dateValidation: new Date().toISOString() }
          : d
      )
    );
    setSelectedDemande(null);
  };

  // ── Stats ──
  const enAttente     = demandes.filter(d => d.statut === 'en_attente');
  const validees      = demandes.filter(d => d.statut === 'valide');
  const rejetees      = demandes.filter(d => d.statut === 'rejete');
  const totalEstime   = demandes.reduce((s, d) => s + (d.montantManquant || 0), 0);
  const totalValide   = validees.reduce((s, d) => s + (d.coutReel || 0), 0);
  const economie      = validees.reduce((s, d) => s + ((d.montantManquant || 0) - (d.coutReel || 0)), 0);

  // ── Filtrage ──
  const filteredDemandes = filterStatut === 'tous' ? demandes
    : demandes.filter(d => d.statut === filterStatut);

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 gap-4">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center animate-pulse">
        <FiTool className="text-white" size={28} />
      </div>
      <p className="text-gray-500 font-medium">Chargement des demandes...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 gap-4 p-8">
      <FiAlertCircle className="text-red-400" size={48} />
      <p className="text-red-600 font-semibold text-center">{error}</p>
      <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm">
        <FiRefreshCw size={14} /> Réessayer
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200">
              <FiTool className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Garage</h1>
              <p className="text-xs text-gray-400">{enAttente.length} en attente · {demandes.length} au total</p>
            </div>
          </div>
          <button onClick={loadData} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-orange-500 transition-colors shadow-sm">
            <FiRefreshCw size={18} />
          </button>
        </div>

        {/* ── STATS RAPIDES ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-amber-500 rounded-2xl p-4 text-white">
            <p className="text-xs font-bold opacity-80 mb-1">En attente</p>
            <p className="text-3xl font-black">{enAttente.length}</p>
            <p className="text-xs opacity-70 mt-1">{formatAmount(enAttente.reduce((s,d) => s + (d.montantManquant||0), 0))}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 mb-1">Total validé</p>
            <p className="text-2xl font-black text-emerald-600">{formatAmount(totalValide)}</p>
            <p className="text-xs text-gray-400 mt-1">{validees.length} demande{validees.length > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 mb-1">Économies réalisées</p>
            <p className={`text-xl font-black ${economie >= 0 ? 'text-sky-600' : 'text-red-500'}`}>{formatAmount(Math.abs(economie))}</p>
            <p className="text-xs text-gray-400 mt-1">vs estimations</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 mb-1">Rejetées</p>
            <p className="text-2xl font-black text-red-500">{rejetees.length}</p>
            <p className="text-xs text-gray-400 mt-1">{formatAmount(rejetees.reduce((s,d) => s+(d.montantManquant||0),0))} non déduits</p>
          </div>
        </div>

        {/* ── ONGLETS ── */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
          <button
            onClick={() => setActiveTab('demandes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'demandes' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            <FiList size={14} /> Demandes
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'resume' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            <FiFileText size={14} /> Résumé
          </button>
        </div>

        {activeTab === 'demandes' && (
          <>
            {/* ── FILTRES ── */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { key: 'tous', label: `Tous (${demandes.length})` },
                { key: 'en_attente', label: `En attente (${enAttente.length})` },
                { key: 'valide', label: `Validés (${validees.length})` },
                { key: 'rejete', label: `Rejetés (${rejetees.length})` },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatut(f.key)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    filterStatut === f.key
                      ? 'bg-gray-900 text-white shadow'
                      : 'bg-white border border-gray-200 text-gray-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* ── LISTE ── */}
            {filteredDemandes.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FiTool size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucune demande</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDemandes.map(d => (
                  <DemandeCard
                    key={d.id}
                    demande={d}
                    onClick={() => setSelectedDemande(d)}
                    isProcessed={d.statut !== 'en_attente'}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'resume' && (
          <div className="space-y-4">
            {/* Résumé financier */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm">Résumé Financier Global</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { label: 'Total demandes', value: demandes.length, isNumber: true },
                  { label: 'Montant total estimé', value: formatAmount(totalEstime) },
                  { label: 'Montant total validé', value: formatAmount(totalValide), color: 'text-emerald-600' },
                  { label: 'Économies / Dépassements', value: `${economie >= 0 ? '-' : '+'} ${formatAmount(Math.abs(economie))}`, color: economie >= 0 ? 'text-sky-600' : 'text-red-500' },
                  { label: 'Demandes en attente', value: enAttente.length, isNumber: true, color: 'text-amber-600' },
                  { label: 'Demandes validées', value: validees.length, isNumber: true, color: 'text-emerald-600' },
                  { label: 'Demandes rejetées', value: rejetees.length, isNumber: true, color: 'text-red-500' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className={`text-sm font-bold ${row.color || 'text-gray-900'}`}>
                      {row.isNumber ? row.value : row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Liste des validations avec détails session */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm">Sessions de Validation</h3>
              </div>
              {validees.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-400 text-sm">Aucune validation effectuée</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {validees.map(d => (
                    <div key={d.id} className="px-5 py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{d.nomLivreur}</p>
                          <p className="text-xs text-gray-400">{d.vehicule} · {d.immatriculation}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-600 text-sm">{formatAmount(d.coutReel)}</p>
                          <p className="text-[10px] text-gray-400">validé</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>{d.motif}</span>
                        <span>{formatDate(d.dateValidation)}</span>
                      </div>
                      {d.montantManquant && (
                        <div className="mt-1.5 text-[11px]">
                          <span className={`font-semibold ${d.coutReel < d.montantManquant ? 'text-sky-600' : 'text-red-500'}`}>
                            {d.coutReel < d.montantManquant
                              ? `✓ Économie: ${formatAmount(d.montantManquant - d.coutReel)}`
                              : d.coutReel > d.montantManquant
                              ? `⚠ Dépassement: ${formatAmount(d.coutReel - d.montantManquant)}`
                              : '= Montant identique'}
                          </span>
                        </div>
                      )}
                      {/* Session d'origine inline dans le résumé */}
                      {d.session && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Session d'origine</p>
                          <div className="grid grid-cols-3 gap-1.5 mb-2">
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-[9px] text-gray-400">Attendu</p>
                              <p className="text-xs font-black text-gray-700">{formatAmount(d.session.montantTheorique)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-[9px] text-gray-400">Reçu</p>
                              <p className="text-xs font-black text-emerald-600">{formatAmount(d.session.montantRecu)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-[9px] text-gray-400">Manquant</p>
                              <p className="text-xs font-black text-red-500">{formatAmount(d.session.cashManquant)}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400">{d.session.nbCourses} course{d.session.nbCourses > 1 ? 's' : ''} · {d.session.totalArticlesLivres ?? 0} livrés · {d.session.totalArticlesRetournes ?? 0} retours · {d.session.totalArticlesPerdus ?? 0} perdus</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rejetées */}
            {rejetees.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900 text-sm">Demandes Rejetées</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {rejetees.map(d => (
                    <div key={d.id} className="px-5 py-4">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{d.nomLivreur}</p>
                          <p className="text-xs text-gray-400">{d.motif}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-500 text-sm">{formatAmount(d.montantManquant)}</p>
                          <p className="text-[10px] text-gray-400">non déduit</p>
                        </div>
                      </div>
                      {d.motifRejet && (
                        <p className="text-[11px] text-red-500 mt-1">Motif: {d.motifRejet}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">{formatDate(d.dateValidation)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedDemande && (
        <GarageValidationModal
          demande={selectedDemande}
          onClose={() => setSelectedDemande(null)}
          onActionSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}