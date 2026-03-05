import React, { useState, useEffect } from 'react';
import {
  FiUser, FiLock, FiLogOut, FiSave, FiCheck, FiAlertTriangle,
  FiTrendingUp, FiPackage, FiCheckCircle, FiXCircle, FiAlertCircle,
  FiNavigation, FiNavigation2, FiRefreshCw, FiCalendar, FiAward,
  FiDollarSign, FiClock, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { fetchLivreurInfo, updateLivreurPassword, calculerCycle25Jours } from '../logic/LivreurAppLogic';
import locationService from '../services/LocationService';

// ─────────────────────────────────────────────
// Mini-composant: Carte stat (inspiré DeliveryDriverSalaryPage)
// ─────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'blue', icon: Icon }) => {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'bg-blue-100 text-blue-600' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'bg-green-100 text-green-600' },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'bg-red-100 text-red-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'bg-orange-100 text-orange-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'bg-purple-100 text-purple-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'bg-indigo-100 text-indigo-600' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`${c.bg} rounded-2xl p-4 flex flex-col gap-2`}>
      {Icon && (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon size={16} />
        </div>
      )}
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
};

// ─────────────────────────────────────────────
// Mini-composant: Barre de taux de succès
// ─────────────────────────────────────────────
const TauxBar = ({ taux }) => {
  const color = taux >= 80 ? 'bg-green-500' : taux >= 60 ? 'bg-orange-400' : 'bg-red-500';
  const label = taux >= 80 ? 'Excellent' : taux >= 60 ? 'Moyen' : 'À améliorer';
  const labelColor = taux >= 80 ? 'text-green-600' : taux >= 60 ? 'text-orange-500' : 'text-red-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500">Taux de succès</span>
        <span className={`text-xs font-bold ${labelColor}`}>{label}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(taux, 100)}%` }}
        />
      </div>
      <p className="text-right text-xs font-bold text-gray-700 mt-1">{taux}%</p>
    </div>
  );
};

// ─────────────────────────────────────────────
// Mini-composant: Bloc GPS
// ─────────────────────────────────────────────
const GPSStatusBlock = ({ livreurId, livraisonsActives = [] }) => {
  const [gpsActive, setGpsActive] = useState(locationService.isActive());
  const [position, setPosition] = useState(locationService.getLastPosition());
  const [activating, setActivating] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Rafraîchir l'état GPS toutes les 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setGpsActive(locationService.isActive());
      setPosition(locationService.getLastPosition());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleActivate = async () => {
    setActivating(true);
    setGpsError(null);
    try {
      const ids = livraisonsActives.map(l => l.id);
      await locationService.startTracking(livreurId, ids);
      setGpsActive(true);
      setPosition(locationService.getLastPosition());
    } catch (err) {
      setGpsError(err.message || 'Impossible d\'activer le GPS');
    } finally {
      setActivating(false);
    }
  };

  const handleStop = async () => {
    await locationService.stopTracking();
    setGpsActive(false);
    setPosition(null);
  };

  const lastSeen = position?.updatedAt
    ? new Date(position.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className={`rounded-2xl p-4 border-2 transition-all ${
      gpsActive
        ? 'bg-green-50 border-green-200'
        : 'bg-orange-50 border-orange-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${gpsActive ? 'bg-green-500' : 'bg-orange-400'}`}>
            {gpsActive
              ? <FiNavigation className="text-white animate-pulse" size={20} />
              : <FiNavigation2 className="text-white" size={20} />
            }
          </div>
          <div>
            <p className={`font-bold text-sm ${gpsActive ? 'text-green-900' : 'text-orange-900'}`}>
              Suivi GPS {gpsActive ? 'Actif' : 'Inactif'}
            </p>
            <p className={`text-xs ${gpsActive ? 'text-green-600' : 'text-orange-600'}`}>
              {gpsActive ? 'Position partagée avec l\'admin' : 'Admin ne peut pas vous localiser'}
            </p>
          </div>
        </div>

        {/* Bouton principal */}
        {gpsActive ? (
          <button
            onClick={handleStop}
            className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
          >
            Arrêter
          </button>
        ) : (
          <button
            onClick={handleActivate}
            disabled={activating}
            className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center gap-1"
          >
            {activating ? <FiRefreshCw size={12} className="animate-spin" /> : null}
            {activating ? 'Activation...' : 'Activer'}
          </button>
        )}
      </div>

      {/* Détails position */}
      {gpsActive && position && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="bg-white rounded-xl p-2 text-center">
            <p className="text-[9px] text-gray-400 uppercase font-bold">Précision</p>
            <p className="text-sm font-bold text-gray-800">±{Math.round(position.accuracy || 0)}m</p>
          </div>
          <div className="bg-white rounded-xl p-2 text-center">
            <p className="text-[9px] text-gray-400 uppercase font-bold">Vitesse</p>
            <p className="text-sm font-bold text-gray-800">
              {position.speed ? `${Math.round(position.speed * 3.6)} km/h` : '-- km/h'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-2 text-center">
            <p className="text-[9px] text-gray-400 uppercase font-bold">MAJ</p>
            <p className="text-sm font-bold text-gray-800">{lastSeen || '--:--'}</p>
          </div>
        </div>
      )}

      {/* Erreur GPS */}
      {gpsError && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-2.5">
          <p className="text-xs text-red-700 font-medium">{gpsError}</p>
          <p className="text-xs text-red-500 mt-0.5">Vérifiez les permissions dans votre navigateur</p>
        </div>
      )}

      {/* Message si inactif et pas d'erreur */}
      {!gpsActive && !gpsError && (
        <p className="text-xs text-orange-600 mt-1">
          ⚠️ Activez le GPS pour que l'admin puisse suivre vos livraisons en temps réel.
        </p>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
export default function ProfilePage({
  livreurId,
  onLogout,
  onPasswordChanged,
  forcePasswordChange = false,
  // Props injectées depuis LivreurApp pour le bilan
  historique = [],
  livraisonsJour = [],
  cycle25 = null,
  livraisonsEffectuesCycle = 0,
}) {
  const [livreur, setLivreur] = useState(null);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDetteDetail, setShowDetteDetail] = useState(false);

  useEffect(() => {
    if (livreurId) {
      fetchLivreurInfo(livreurId)
        .then(setLivreur)
        .catch(err => {
          if (err.message === 'LIVREUR_NOT_FOUND') {
            onLogout();
          } else {
            setStatus(s => ({ ...s, error: 'Erreur de chargement du profil.' }));
          }
        });
    }
  }, [livreurId, onLogout]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    if (passwords.new !== passwords.confirm) {
      setStatus({ loading: false, error: 'Les mots de passe ne correspondent pas', success: '' });
      return;
    }
    if (passwords.new.length < 6) {
      setStatus({ loading: false, error: 'Minimum 6 caractères', success: '' });
      return;
    }
    try {
      await updateLivreurPassword(livreurId, passwords.new);
      setStatus({ loading: false, error: '', success: 'Mot de passe modifié !' });
      setPasswords({ current: '', new: '', confirm: '' });
      if (onPasswordChanged) onPasswordChanged();
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: '' });
    }
  };

  if (!livreur) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ── Cycle de référence ──────────────────────────────────────────────────
  // Priorité : 1) finance.dateDebutCycle  2) dateCreation compte livreur
  // 3) première livraison de l'historique  4) aujourd'hui en dernier recours
  const _getDateRef = (h) => {
    if (h.dateCreation) return h.dateCreation instanceof Date ? h.dateCreation : new Date(h.dateCreation);
    if (h.dateValidation) return h.dateValidation instanceof Date ? h.dateValidation : new Date(h.dateValidation);
    return null;
  };

  const premiereLivraison = historique.length > 0
    ? historique.reduce((oldest, h) => {
        const d = _getDateRef(h);
        if (!d || isNaN(d.getTime())) return oldest;
        return (!oldest || d < oldest) ? d : oldest;
      }, null)
    : null;

  const rawDateDebut =
    livreur?.finance?.dateDebutCycle ||
    livreur?.dateCreation ||
    premiereLivraison?.toISOString() ||
    new Date().toISOString();

  // Normaliser en Date propre (gère Timestamp Firestore, string ISO, Date)
  const dateDebutCycle = (() => {
    if (!rawDateDebut) return new Date();
    if (rawDateDebut instanceof Date) return rawDateDebut;
    if (rawDateDebut.toDate) return rawDateDebut.toDate(); // Firestore Timestamp
    const d = new Date(rawDateDebut);
    return isNaN(d.getTime()) ? new Date() : d;
  })();

  const cycleData = cycle25 || calculerCycle25Jours(dateDebutCycle);

  // Plage exacte du cycle actuel
  const debutCycleActuel = new Date(dateDebutCycle);
  debutCycleActuel.setDate(debutCycleActuel.getDate() + (cycleData.numeroCycle - 1) * 25);
  const finCycleActuel = new Date(debutCycleActuel);
  finCycleActuel.setDate(finCycleActuel.getDate() + 25);

  // ── Historique du cycle actuel ───────────────────────────────────────────
  // On filtre sur dateCreation (jour réel de travail), fallback sur dateValidation
  const historiqueCycleActuel = historique.filter(h => {
    const d = _getDateRef(h);
    return d && !isNaN(d.getTime()) && d >= debutCycleActuel && d < finCycleActuel;
  });

  // ── Jours travaillés déduits de l'historique ─────────────────────────────
  const toDateStr = (h) => {
    const d = _getDateRef(h);
    if (!d || isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  };

  // Tout l'historique : nb de jours distincts où le livreur a eu des livraisons
  const joursUniques = new Set(historique.map(toDateStr).filter(Boolean));
  const joursTravailles = joursUniques.size;

  // Même chose mais uniquement sur le cycle actuel
  const joursUniquesCycle = new Set(historiqueCycleActuel.map(toDateStr).filter(Boolean));
  const joursTravaillesCycle = joursUniquesCycle.size;

  // ── Compteurs statut — tout l'historique ────────────────────────────────
  const totalHistorique     = historique.length;
  const livraisonsReussies  = historique.filter(h => h.statutFinal === 'livre' || h.statutFinal === 'partiel').length;
  const livraisonsRetournees = historique.filter(h => h.statutFinal === 'retourne').length;
  const livraisonsPerdues   = historique.filter(h => h.statutFinal === 'perdu' || h.statutFinal === 'perdu_partiel').length;
  const tauxSucces = totalHistorique > 0
    ? Math.round((livraisonsReussies / totalHistorique) * 100)
    : 0;

  // ── Compteurs cycle actuel ───────────────────────────────────────────────
  const nbCycleTotal    = historiqueCycleActuel.length;
  const nbCycleReussies = historiqueCycleActuel.filter(h => h.statutFinal === 'livre' || h.statutFinal === 'partiel').length;
  // Priorité à la prop injectée depuis LivreurApp, sinon calcul direct depuis historique
  const nbEffectuesCycle = livraisonsEffectuesCycle || nbCycleReussies;

  // ── Financier ────────────────────────────────────────────────────────────
  const totalEncaisse = historique.reduce((s, h) => s + (h.totalEncaisse || 0), 0);
  const totalDettes   = historique.reduce((s, h) => s + (h.manquant || 0) + (h.valeurPerdus || 0), 0);

  const detteAncienne     = livreur?.finance?.detteActuelle || 0;
  const retenueSalaire    = livreur?.finance?.retenueSalaire || 0;
  const detteNette        = Math.max(0, detteAncienne - retenueSalaire);

  const salaireBase       = livreur?.finance?.salaireBase || 0;
  const primeParLivraison = livreur?.finance?.primeParLivraison || 0;
  const primesEstimees    = nbEffectuesCycle * primeParLivraison;
  const salaireEstime     = salaireBase + primesEstimees - detteNette;

  // ── Lignes de dette détaillées ───────────────────────────────────────────
  const toutesLignesDette = historique.flatMap(h => h.lignesDette || []);

  // ── GPS : livraisons actives du jour ─────────────────────────────────────
  const livraisonsActives = livraisonsJour.filter(
    l => l.statut === 'en_attente' || l.statut === 'en_cours'
  );

  return (
    <div className="pb-28 space-y-0">

      {/* ── HERO HEADER ────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white px-5 pt-8 pb-10 rounded-b-[2.5rem] shadow-xl">

        {/* Alerte premier login */}
        {forcePasswordChange && (
          <div className="mb-4 bg-orange-400/20 border border-orange-300/40 rounded-2xl p-3 flex items-start gap-3">
            <FiAlertTriangle size={18} className="text-orange-200 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-white">Action requise</p>
              <p className="text-xs text-blue-100 mt-0.5">Changez votre mot de passe pour accéder à l'app.</p>
            </div>
          </div>
        )}

        {/* Identité */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {livreur.photoUrl
              ? <img src={livreur.photoUrl} alt="Profil" className="h-full w-full object-cover" />
              : <FiUser size={28} className="text-white" />
            }
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black">{livreur.nom}</h1>
            <p className="text-blue-200 text-sm">{livreur.telephone}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-green-400/20 border border-green-300/40 text-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ● Actif
              </span>
              {tauxSucces >= 80 && (
                <span className="bg-yellow-400/20 border border-yellow-300/40 text-yellow-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ⭐ Top Livreur
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cycle 25 jours */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Cycle {cycleData.numeroCycle} — Performance</p>
              <p className="text-3xl font-black mt-0.5">
                {nbEffectuesCycle}
                <span className="text-base font-normal text-blue-200 ml-1">livraison{nbEffectuesCycle > 1 ? 's' : ''} réussie{nbEffectuesCycle > 1 ? 's' : ''}</span>
              </p>
              {nbCycleTotal > nbEffectuesCycle && (
                <p className="text-[10px] text-blue-300 mt-0.5">
                  {nbCycleTotal} assignée{nbCycleTotal > 1 ? 's' : ''} • {nbCycleTotal - nbEffectuesCycle} non livrée{nbCycleTotal - nbEffectuesCycle > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-200">Jour <span className="font-bold text-white">{cycleData.jourDansCycle}</span> / 25</p>
              <p className="text-[10px] text-blue-300 mt-0.5">{joursTravaillesCycle} j. travaillé{joursTravaillesCycle > 1 ? 's' : ''}</p>
              <p className="text-[10px] text-blue-300">{cycleData.joursRestants} j. restant{cycleData.joursRestants > 1 ? 's' : ''}</p>
            </div>
          </div>
          {/* Barre progression */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-700"
              style={{ width: `${cycleData.pourcentage}%` }}
            />
          </div>
          <p className="text-right text-[10px] text-blue-200 mt-1">{cycleData.pourcentage}% du cycle écoulé</p>
        </div>
      </div>

      {/* ── CORPS ───────────────────────────────────── */}
      <div className="px-4 -mt-4 space-y-4">

        {/* ── GPS STATUS ─────────────────────────── */}
        <section>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 px-1">Suivi en temps réel</p>
          <GPSStatusBlock livreurId={livreurId} livraisonsActives={livraisonsActives} />
        </section>

        {/* ── BILAN PERFORMANCE ─────────────────── */}
        <section>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Bilan de performance</p>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-5">

            {/* Taux de succès visuel */}
            <TauxBar taux={tauxSucces} />

            {/* Grid stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Cours. réussies" value={livraisonsReussies} sub={`/ ${totalHistorique} total`} color="green" icon={FiCheckCircle} />
              <StatCard label="Retournées" value={livraisonsRetournees} sub="colis rendu" color="orange" icon={FiPackage} />
              <StatCard label="Perdues" value={livraisonsPerdues} sub="génère une dette" color="red" icon={FiAlertCircle} />
              <StatCard label="Ce cycle" value={nbEffectuesCycle} sub={`${joursTravaillesCycle} j. travaillés`} color="blue" icon={FiCalendar} />
              <StatCard label="Total jours" value={joursTravailles} sub="depuis le début" color="indigo" icon={FiClock} />
            </div>

            {/* Séparateur */}
            <div className="border-t border-dashed border-gray-100" />

            {/* Financier */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Résumé financier</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total encaissé (historique)</span>
                  <span className="font-bold text-green-700">{totalEncaisse.toLocaleString()} F</span>
                </div>
                {totalDettes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dettes générées</span>
                    <span className="font-bold text-red-600">{totalDettes.toLocaleString()} F</span>
                  </div>
                )}
                {salaireBase > 0 && (
                  <>
                    <div className="border-t border-dashed pt-1.5 flex justify-between">
                      <span className="text-gray-500">Salaire base</span>
                      <span className="font-semibold">{salaireBase.toLocaleString()} F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Primes estimées ({nbEffectuesCycle} × {primeParLivraison.toLocaleString()} F)</span>
                      <span className="font-semibold text-indigo-700">+{primesEstimees.toLocaleString()} F</span>
                    </div>
                    {detteNette > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dette nette retenue</span>
                        <span className="font-semibold text-red-600">-{detteNette.toLocaleString()} F</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-bold text-gray-900">Net estimé ce cycle</span>
                      <span className={`font-black text-lg ${salaireEstime >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                        {salaireEstime.toLocaleString()} F
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── DÉTAIL DETTES ─────────────────────── */}
        {(detteNette > 0 || toutesLignesDette.length > 0) && (
          <section>
            <button
              onClick={() => setShowDetteDetail(v => !v)}
              className="w-full flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-xl">
                  <FiAlertCircle className="text-red-600" size={18} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-red-800 text-sm">Dette nette</p>
                  <p className="text-xs text-red-500">{toutesLignesDette.length} entrée{toutesLignesDette.length > 1 ? 's' : ''} • Appuyez pour voir le détail</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-red-700">{detteNette.toLocaleString()} F</span>
                {showDetteDetail ? <FiChevronUp size={16} className="text-red-400" /> : <FiChevronDown size={16} className="text-red-400" />}
              </div>
            </button>

            {showDetteDetail && (
              <div className="bg-white border border-red-100 rounded-2xl mt-1 overflow-hidden shadow-sm">
                {retenueSalaire > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-green-50 border-b border-green-100">
                    <div>
                      <p className="text-sm font-bold text-green-800">Retenue salaire appliquée</p>
                      <p className="text-xs text-green-600">Déduite du paiement précédent</p>
                    </div>
                    <span className="font-black text-green-700">-{retenueSalaire.toLocaleString()} F</span>
                  </div>
                )}
                {toutesLignesDette.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Aucun détail disponible</p>
                ) : (
                  toutesLignesDette.map((ligne, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-4 py-3 ${idx < toutesLignesDette.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-800">{ligne.motif}</p>
                        <p className="text-xs text-gray-400">
                          {ligne.numeroSuivi && <span className="font-medium">{ligne.numeroSuivi} • </span>}
                          {new Date(ligne.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-sm font-black text-red-600">{ligne.montant.toLocaleString()} F</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        )}

        {/* ── SÉCURITÉ / MOT DE PASSE ───────────── */}
        <section>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Compte & Sécurité</p>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setShowPasswordForm(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <FiLock className="text-blue-600" size={18} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-sm">Mot de passe</p>
                  <p className="text-xs text-gray-400">Modifier votre mot de passe</p>
                </div>
              </div>
              {showPasswordForm
                ? <FiChevronUp className="text-gray-400" size={18} />
                : <FiChevronDown className="text-gray-400" size={18} />
              }
            </button>

            {(showPasswordForm || forcePasswordChange) && (
              <div className="px-5 pb-5 border-t border-gray-50">
                {forcePasswordChange && (
                  <div className="mt-4 mb-4 bg-orange-50 border border-orange-200 rounded-xl p-3 flex gap-2">
                    <FiAlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-700">Vous devez changer votre mot de passe avant de continuer.</p>
                  </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-3 mt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Confirmer</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="••••••"
                      required
                    />
                  </div>
                  {status.error && <p className="text-red-500 text-xs">{status.error}</p>}
                  {status.success && (
                    <p className="text-green-600 text-xs flex items-center gap-1">
                      <FiCheck size={12} /> {status.success}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={status.loading || passwords.new.length < 6 || passwords.new !== passwords.confirm}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 disabled:opacity-40 transition-all"
                  >
                    {status.loading
                      ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Enregistrement...</>
                      : <><FiSave size={15} /> Enregistrer</>
                    }
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* ── DÉCONNEXION ───────────────────────── */}
        {!forcePasswordChange && (
          <section className="pb-4">
            <button
              onClick={onLogout}
              className="w-full py-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-red-100 transition-all"
            >
              <FiLogOut size={18} /> Déconnexion
            </button>
          </section>
        )}

      </div>
    </div>
  );
}