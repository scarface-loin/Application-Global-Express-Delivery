import React, { useState, useEffect, useCallback } from 'react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiCalendar,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiChevronDown,
  FiChevronUp,
  FiBarChart2,
  FiDollarSign,
  FiUsers,
  FiMapPin,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiLayers,
} from 'react-icons/fi';
import {
  fetchDeliveryFeesReport,
  compareDeliveryFeesPeriods,
  fetchAverageFees,
} from './logic/DeliveryFeesReportLogic';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `${Math.round(n || 0).toLocaleString('fr-FR')} FCFA`;

const fmtShort = (n) =>
  Math.round(n || 0).toLocaleString('fr-FR');

const today = () => new Date().toISOString().split('T')[0];

const firstDayOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const fmtDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const deltaColor = (val) => {
  const n = parseFloat(val);
  if (n > 0) return 'text-emerald-600';
  if (n < 0) return 'text-red-500';
  return 'text-gray-400';
};

const DeltaIcon = ({ val }) => {
  const n = parseFloat(val);
  if (n > 0) return <FiTrendingUp className="inline ml-1" size={13} />;
  if (n < 0) return <FiTrendingDown className="inline ml-1" size={13} />;
  return null;
};

// ─── Sous-composants ──────────────────────────────────────────────────────────

const Pill = ({ children, color = 'blue' }) => {
  const palette = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    orange: 'bg-orange-100 text-orange-700',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${palette[color]}`}>
      {children}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, accent = '#3b82f6', loading }) => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}18` }}
      >
        <Icon size={16} style={{ color: accent }} />
      </div>
    </div>
    {loading ? (
      <div className="h-7 w-28 bg-gray-100 rounded animate-pulse" />
    ) : (
      <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
    )}
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

const BarRow = ({ label, value, max, color = '#3b82f6', sub }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 truncate max-w-[55%]">{label}</span>
        <span className="text-sm font-bold text-gray-900">{fmt(value)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
};

const SectionTitle = ({ children, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-3">
    {Icon && <Icon className="text-gray-400" size={16} />}
    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{children}</h2>
  </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────

export default function DeliveryFeesReportPage() {
  // Filtres
  const [startDate, setStartDate] = useState(firstDayOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [origine, setOrigine] = useState('');
  const [type, setType] = useState('');

  // Données
  const [rapport, setRapport] = useState(null);
  const [moyennes, setMoyennes] = useState(null);
  const [comparaison, setComparaison] = useState(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showComparaison, setShowComparaison] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'detail' | 'comparaison'

  // ── Chargement ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, m] = await Promise.all([
        fetchDeliveryFeesReport({ startDate, endDate, origine: origine || null, type: type || null }),
        fetchAverageFees({ startDate, endDate }),
      ]);
      setRapport(r);
      setMoyennes(m);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, origine, type]);

  useEffect(() => {
    load();
  }, []);

  // ── Comparaison période précédente ──────────────────────────────────────────
  const loadComparaison = async () => {
    try {
      // Calcul de la période précédente de même durée
      const diffMs = new Date(endDate) - new Date(startDate);
      const prevEnd = new Date(startDate);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd.getTime() - diffMs);

      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];

      const comp = await compareDeliveryFeesPeriods(
        { startDate: prevStartStr, endDate: prevEndStr },
        { startDate, endDate }
      );
      setComparaison(comp);
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Export CSV simple ────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!rapport?.detail?.length) return;
    const headers = ['N° Suivi', 'Origine', 'Type', 'Partenaire', 'Livreur', 'Quartier', 'Frais prestation (FCFA)', 'Total commande (FCFA)', 'Statut', 'Date création'];
    const rows = rapport.detail.map(e => [
      e.numeroSuivi,
      e.origine,
      e.type,
      e.partenaireNom || '-',
      e.livreurNom || '-',
      e.quartier,
      e.fraisPrestation,
      e.totalGeneral,
      e.statut,
      fmtDate(e.dateCreation),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frais_livraison_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Données dérivées ─────────────────────────────────────────────────────────
  const totaux = rapport?.totaux || {};
  const detail = rapport?.detail || [];
  const jourMax = rapport?.ventilationJournaliere?.[0]?.fraisPrestation || 1;
  const partenaireMax = rapport?.ventilationPartenaire?.[0]?.fraisPrestation || 1;

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* ── En-tête ── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
              <FiDollarSign className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Frais de Livraison</h1>
              <p className="text-xs text-gray-500">Revenus générés par la prestation</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 text-blue-600 disabled:opacity-50"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── Filtres ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FiFilter size={14} className="text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filtres</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Du</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Au</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Origine</label>
              <select
                value={origine}
                onChange={e => setOrigine(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Toutes</option>
                <option value="interne">Interne</option>
                <option value="partenaire">Partenaire</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Tous</option>
                <option value="course">Course</option>
                <option value="expedition">Expédition</option>
              </select>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <FiRefreshCw className="animate-spin" size={14} /> : <FiBarChart2 size={14} />}
            {loading ? 'Chargement...' : 'Générer le rapport'}
          </button>
        </div>

        {/* ── Erreur ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm">
            <FiAlertCircle size={16} /> {error}
          </div>
        )}

        {/* ── Onglets ── */}
        {(rapport || loading) && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-4">
            {[
              { id: 'overview', label: 'Vue d\'ensemble' },
              { id: 'detail', label: 'Détail' },
              { id: 'comparaison', label: 'Comparaison' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'comparaison' && !comparaison) loadComparaison();
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB : VUE D'ENSEMBLE */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-4">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={FiDollarSign}
                label="Frais encaissés"
                value={fmt(totaux.totalFraisPrestation)}
                accent="#3b82f6"
                loading={loading}
              />
              <StatCard
                icon={FiPackage}
                label="Livraisons"
                value={fmtShort(totaux.nbLivraisons)}
                sub={`Interne: ${totaux.nbInternes || 0} · Part.: ${totaux.nbPartenaires || 0}`}
                accent="#8b5cf6"
                loading={loading}
              />
              <StatCard
                icon={FiLayers}
                label="Valeur commandes"
                value={fmt(totaux.totalCommandesValeur)}
                accent="#10b981"
                loading={loading}
              />
              <StatCard
                icon={FiTrendingUp}
                label="Frais moyen / liv."
                value={moyennes ? fmt(moyennes.fraisMoyenGlobal) : '—'}
                accent="#f59e0b"
                loading={loading}
              />
            </div>

            {/* Répartition type */}
            {rapport && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <SectionTitle icon={FiLayers}>Répartition par type</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                    <p className="text-xs font-bold text-blue-500 uppercase mb-1">Courses</p>
                    <p className="text-2xl font-black text-blue-700">{totaux.nbCourses || 0}</p>
                    {moyennes && (
                      <p className="text-xs text-blue-400 mt-1">moy. {fmt(moyennes.fraisMoyenCourse)}</p>
                    )}
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
                    <p className="text-xs font-bold text-purple-500 uppercase mb-1">Expéditions</p>
                    <p className="text-2xl font-black text-purple-700">{totaux.nbExpeditions || 0}</p>
                    {moyennes && (
                      <p className="text-xs text-purple-400 mt-1">moy. {fmt(moyennes.fraisMoyenExpedition)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Ventilation par jour */}
            {rapport?.ventilationJournaliere?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <SectionTitle icon={FiCalendar}>Par jour</SectionTitle>
                <div className="space-y-3">
                  {rapport.ventilationJournaliere.slice(0, 7).map(j => (
                    <BarRow
                      key={j.date}
                      label={fmtDate(j.date)}
                      value={j.fraisPrestation}
                      max={jourMax}
                      color="#3b82f6"
                      sub={`${j.nbLivraisons} livraison${j.nbLivraisons > 1 ? 's' : ''}`}
                    />
                  ))}
                  {rapport.ventilationJournaliere.length > 7 && (
                    <p className="text-xs text-gray-400 text-center">
                      + {rapport.ventilationJournaliere.length - 7} jours supplémentaires
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Ventilation par partenaire */}
            {rapport?.ventilationPartenaire?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <SectionTitle icon={FiUsers}>Top partenaires</SectionTitle>
                <div className="space-y-3">
                  {rapport.ventilationPartenaire.map((p, i) => (
                    <div key={p.nom} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
                        ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <BarRow
                          label={p.nom}
                          value={p.fraisPrestation}
                          max={partenaireMax}
                          color={i === 0 ? '#f59e0b' : '#8b5cf6'}
                          sub={`${p.nbLivraisons} livraison${p.nbLivraisons > 1 ? 's' : ''}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Résumé période vide */}
            {rapport && !loading && totaux.nbLivraisons === 0 && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiPackage className="text-gray-400" size={24} />
                </div>
                <p className="font-bold text-gray-700">Aucune livraison validée</p>
                <p className="text-sm text-gray-400 mt-1">sur la période sélectionnée</p>
              </div>
            )}

            {/* Export */}
            {rapport?.detail?.length > 0 && (
              <button
                onClick={exportCSV}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl text-sm hover:bg-gray-50 shadow-sm"
              >
                <FiDownload size={15} />
                Exporter en CSV ({detail.length} lignes)
              </button>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB : DÉTAIL */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'detail' && (
          <div className="space-y-3">
            {loading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
                ))}
              </div>
            )}

            {!loading && detail.length === 0 && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                <p className="font-bold text-gray-700">Aucune livraison sur cette période</p>
              </div>
            )}

            {!loading && detail.map(entry => (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{entry.numeroSuivi}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <Pill color={entry.origine === 'partenaire' ? 'purple' : 'blue'}>
                        {entry.origine}
                      </Pill>
                      <Pill color={entry.type === 'expedition' ? 'orange' : 'gray'}>
                        {entry.type}
                      </Pill>
                      <Pill color={entry.statut === 'livre' ? 'green' : entry.statut === 'partiel' ? 'orange' : 'gray'}>
                        {entry.statut}
                      </Pill>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-blue-700">{fmt(entry.fraisPrestation)}</p>
                    <p className="text-xs text-gray-400">total: {fmt(entry.totalGeneral)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {entry.partenaireNom && (
                    <span className="flex items-center gap-1">
                      <FiUsers size={11} /> {entry.partenaireNom}
                    </span>
                  )}
                  {entry.livreurNom && (
                    <span className="flex items-center gap-1">
                      <FiCheckCircle size={11} /> {entry.livreurNom}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <FiMapPin size={11} /> {entry.quartier}
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <FiClock size={11} /> {fmtDate(entry.dateCreation)}
                  </span>
                </div>
              </div>
            ))}

            {!loading && detail.length > 0 && (
              <button
                onClick={exportCSV}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl text-sm hover:bg-gray-50 shadow-sm"
              >
                <FiDownload size={15} />
                Exporter en CSV
              </button>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB : COMPARAISON */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'comparaison' && (
          <div className="space-y-4">
            {!comparaison && !loading && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <FiClock className="mx-auto text-gray-300 mb-3" size={36} />
                <p className="text-gray-500 text-sm">Chargement de la comparaison…</p>
              </div>
            )}

            {comparaison && (
              <>
                {/* Header périodes */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <SectionTitle icon={FiCalendar}>Périodes comparées</SectionTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 font-medium">Période précédente</p>
                      <p className="text-xs font-bold text-gray-700 mt-1">
                        {fmtDate(comparaison.periodeA.periode.startDate)} → {fmtDate(comparaison.periodeA.periode.endDate)}
                      </p>
                    </div>
                    <FiArrowRight className="text-gray-300" size={18} />
                    <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                      <p className="text-xs text-blue-400 font-medium">Période actuelle</p>
                      <p className="text-xs font-bold text-blue-700 mt-1">
                        {fmtDate(comparaison.periodeB.periode.startDate)} → {fmtDate(comparaison.periodeB.periode.endDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Frais prestation */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <SectionTitle icon={FiDollarSign}>Frais de prestation</SectionTitle>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400">Avant</p>
                      <p className="text-lg font-black text-gray-700">
                        {fmt(comparaison.evolution.fraisPrestation.valeurA)}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                      <p className="text-xs text-blue-400">Maintenant</p>
                      <p className="text-lg font-black text-blue-700">
                        {fmt(comparaison.evolution.fraisPrestation.valeurB)}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center justify-center gap-1 text-sm font-bold ${deltaColor(comparaison.evolution.fraisPrestation.deltaPercent)}`}>
                    <span>
                      {parseFloat(comparaison.evolution.fraisPrestation.deltaPercent) > 0 ? '+' : ''}
                      {comparaison.evolution.fraisPrestation.deltaPercent}%
                    </span>
                    <DeltaIcon val={comparaison.evolution.fraisPrestation.deltaPercent} />
                    <span className="text-gray-400 font-normal text-xs ml-1">vs période précédente</span>
                  </div>
                </div>

                {/* Nb livraisons */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <SectionTitle icon={FiPackage}>Nombre de livraisons</SectionTitle>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400">Avant</p>
                      <p className="text-2xl font-black text-gray-700">
                        {comparaison.evolution.nbLivraisons.valeurA}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                      <p className="text-xs text-blue-400">Maintenant</p>
                      <p className="text-2xl font-black text-blue-700">
                        {comparaison.evolution.nbLivraisons.valeurB}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center justify-center gap-1 text-sm font-bold ${deltaColor(comparaison.evolution.nbLivraisons.deltaPercent)}`}>
                    <span>
                      {parseFloat(comparaison.evolution.nbLivraisons.deltaPercent) > 0 ? '+' : ''}
                      {comparaison.evolution.nbLivraisons.deltaPercent}%
                    </span>
                    <DeltaIcon val={comparaison.evolution.nbLivraisons.deltaPercent} />
                    <span className="text-gray-400 font-normal text-xs ml-1">vs période précédente</span>
                  </div>
                </div>

                {/* Top jours période actuelle */}
                {comparaison.periodeB.ventilationJournaliere?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <SectionTitle icon={FiCalendar}>Meilleurs jours (période actuelle)</SectionTitle>
                    <div className="space-y-3">
                      {comparaison.periodeB.ventilationJournaliere.slice(0, 5).map(j => (
                        <BarRow
                          key={j.date}
                          label={fmtDate(j.date)}
                          value={j.fraisPrestation}
                          max={comparaison.periodeB.ventilationJournaliere[0]?.fraisPrestation || 1}
                          color="#3b82f6"
                          sub={`${j.nbLivraisons} livraison${j.nbLivraisons > 1 ? 's' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}