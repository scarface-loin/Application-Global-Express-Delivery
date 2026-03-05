import React, { useState, useEffect } from 'react';
import { 
  FiPackage, FiTruck, FiMapPin, FiPhone, FiCheckCircle, FiXCircle, 
  FiCalendar, FiUser, FiAlertCircle, FiHome, FiList, FiUser as FiProfile, 
  FiRefreshCw, FiBox, FiChevronDown, FiChevronUp, FiCopy, FiInfo,
  FiNavigation, FiNavigation2, FiSearch, FiX
} from 'react-icons/fi';
import {
  fetchLivraisonsJour,
  fetchHistoriqueLivraisons,
  fetchLivreurInfo,
  calculateSituationDuJour,
  calculerCycle25Jours
} from '../logic/LivreurAppLogic';
import ProfilePage from './ProfilePage';
import locationService from '../services/LocationService';

export default function LivreurApp({ livreurId, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [selectedHistorique, setSelectedHistorique] = useState(null);
  
  const [livreurInfo, setLivreurInfo] = useState(null);
  const [livraisonsJour, setLivraisonsJour] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // États pour la géolocalisation
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);

  // État pour l'expansion des items de l'historique (AJOUT IMPORTANT)
  const [expandedHistoryItems, setExpandedHistoryItems] = useState(new Set());
  // États pour la recherche et le filtre de l'historique
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  // Afficher le détail des dettes
  const [showDetteDetail, setShowDetteDetail] = useState(false);

  useEffect(() => {
    if (livreurId) { 
      loadData();
    }
  }, [livreurId]);

  // Gérer le suivi GPS quand les livraisons changent
  useEffect(() => {
    if (livreurId && livraisonsJour.length > 0) {
      startGPSTracking();
    } else {
      stopGPSTracking();
    }

    // Nettoyer à la déconnexion
    return () => {
      stopGPSTracking();
    };
  }, [livreurId, livraisonsJour]);

  // Mettre à jour la position actuelle périodiquement
  useEffect(() => {
    if (gpsActive) {
      const interval = setInterval(() => {
        const position = locationService.getLastPosition();
        setCurrentPosition(position);
      }, 5000); // Mettre à jour l'affichage toutes les 5 secondes

      return () => clearInterval(interval);
    }
  }, [gpsActive]);

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      setLoading(true);
      setError(null);
      
      const [info, livraisons, hist] = await Promise.all([
        fetchLivreurInfo(livreurId),
        fetchLivraisonsJour(livreurId),
        fetchHistoriqueLivraisons(livreurId)
      ]);
      
      setLivreurInfo(info);
      setLivraisonsJour(livraisons);
      setHistorique(hist);
      
    } catch (err) {
      console.error("Erreur de chargement:", err);
      
      if (err.message === "LIVREUR_NOT_FOUND") {
        alert("Votre compte n'existe plus ou a été désactivé.");
        onLogout();
        return;
      }
      
      setError(err.message);
    } finally {
      setLoading(false);
      if (refresh) setIsRefreshing(false);
    }
  };

  /**
   * Démarre le suivi GPS
   */
  const startGPSTracking = async () => {
    try {
      setGpsError(null);
      
      // Récupérer les IDs des livraisons actives (en_attente ou en_cours)
      const activeLivraisonsIds = livraisonsJour
        .filter(l => l.statut === 'en_attente' || l.statut === 'en_cours')
        .map(l => l.id);

      if (activeLivraisonsIds.length === 0) {
        console.log('⚠️ Aucune livraison active, GPS non démarré');
        return;
      }

      console.log('🎯 Démarrage GPS pour', activeLivraisonsIds.length, 'livraison(s)');

      await locationService.startTracking(livreurId, activeLivraisonsIds);
      setGpsActive(true);
      
      // Récupérer la position initiale
      const position = locationService.getLastPosition();
      setCurrentPosition(position);

    } catch (error) {
      console.error('❌ Erreur démarrage GPS:', error);
      setGpsError(error.message);
      setGpsActive(false);
    }
  };

  /**
   * Arrête le suivi GPS
   */
  const stopGPSTracking = async () => {
    try {
      await locationService.stopTracking();
      setGpsActive(false);
      setCurrentPosition(null);
      console.log('✅ GPS arrêté');
    } catch (error) {
      console.error('❌ Erreur arrêt GPS:', error);
    }
  };

  /**
   * Force une mise à jour manuelle du GPS
   */
  const forceGPSUpdate = () => {
    if (gpsActive) {
      locationService.forceUpdate();
    } else {
      startGPSTracking();
    }
  };

  /**
   * Gère l'expansion/collapse des items de l'historique
   */
  const toggleHistoryExpand = (itemId) => {
    setExpandedHistoryItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const situationDuJour = calculateSituationDuJour(livraisonsJour);
  const detteAncienne = livreurInfo?.finance?.detteActuelle || 0;
  const manquantTotal = detteAncienne + situationDuJour.responsabiliteDuJour;

  // --- Cycle de 25 jours ---
  // Priorité: 1) finance.dateDebutCycle  2) dateCreation du compte
  // 3) première livraison de l'historique  4) aujourd'hui (dernier recours)
  const _getHDate = (h) => {
    const raw = h.dateCreation || h.dateValidation;
    if (!raw) return null;
    const d = raw instanceof Date ? raw : (raw.toDate ? raw.toDate() : new Date(raw));
    return isNaN(d.getTime()) ? null : d;
  };

  const premiereDate = historique.length > 0
    ? historique.reduce((oldest, h) => {
        const d = _getHDate(h);
        return d && (!oldest || d < oldest) ? d : oldest;
      }, null)
    : null;

  const rawDateDebut =
    livreurInfo?.finance?.dateDebutCycle ||
    livreurInfo?.dateCreation ||
    premiereDate?.toISOString() ||
    new Date().toISOString();

  const dateDebutCycle = (() => {
    if (!rawDateDebut) return new Date();
    if (rawDateDebut instanceof Date) return rawDateDebut;
    if (rawDateDebut.toDate) return rawDateDebut.toDate();
    const d = new Date(rawDateDebut);
    return isNaN(d.getTime()) ? new Date() : d;
  })();

  const cycle25 = calculerCycle25Jours(dateDebutCycle);

  // --- Compteur livraisons réussies du cycle actuel ---
  const debutCycleActuel = new Date(dateDebutCycle);
  debutCycleActuel.setDate(debutCycleActuel.getDate() + (cycle25.numeroCycle - 1) * 25);
  const finCycleActuel = new Date(debutCycleActuel);
  finCycleActuel.setDate(finCycleActuel.getDate() + 25);

  const livraisonsEffectuesCycle = historique.filter(h => {
    const d = _getHDate(h);
    const reussi = h.statutFinal === 'livre' || h.statutFinal === 'partiel';
    return d && reussi && d >= debutCycleActuel && d < finCycleActuel;
  }).length;

  // --- Lignes de dette explicites (depuis l'historique) ---
  const toutesLignesDette = historique.flatMap(h => h.lignesDette || []);
  
  // Retenue salaire déjà appliquée (depuis finance du livreur)
  const retenueSalaire = livreurInfo?.finance?.retenueSalaire || 0;
  const detteNette = Math.max(0, detteAncienne - retenueSalaire);

  // --- Historique filtré ---
  const historiqueFiltré = historique.filter(item => {
    const matchSearch = !searchQuery || 
      item.numeroSuivi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nomClient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.quartier?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatut = filterStatut === 'tous' || item.statutFinal === filterStatut;
    return matchSearch && matchStatut;
  });

  const cleanPhoneNumber = (phone) => {
    if (!phone) return '';
    return phone.toString().replace(/\s/g, '').replace(/-/g, '').replace(/\./g, '');
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text);
      alert("Numéro copié !");
    }
  };

  const getStatutBadge = (statut) => {
    if (statut === 'en_attente' || statut === 'en_cours') return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">À livrer</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{statut}</span>;
  };

  const getTypeCourseLabel = (type) => {
    if (type === 'course') return 'Livraison';
    if (type === 'livraison') return 'Livraison';
    return type || 'Livraison';
  };

  const renderGPSStatus = () => {
    if (livraisonsJour.length === 0) return null;

    return (
      <div className={`rounded-xl p-4 mb-4 ${
        gpsActive ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${gpsActive ? 'bg-green-500' : 'bg-orange-500'}`}>
              {gpsActive ? (
                <FiNavigation className="text-white animate-pulse" size={20} />
              ) : (
                <FiNavigation2 className="text-white" size={20} />
              )}
            </div>
            <div>
              <p className={`text-sm font-bold ${gpsActive ? 'text-green-900' : 'text-orange-900'}`}>
                {gpsActive ? 'GPS Actif' : 'GPS Inactif'}
              </p>
              {gpsActive && currentPosition && (
                <p className="text-xs text-green-700">
                  Précision: {currentPosition.accuracy}
                </p>
              )}
              {gpsError && (
                <p className="text-xs text-red-600">{gpsError}</p>
              )}
            </div>
          </div>
          <button
            onClick={forceGPSUpdate}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              gpsActive 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {gpsActive ? 'Rafraîchir' : 'Activer'}
          </button>
        </div>
      </div>
    );
  };

  const renderHomePage = () => {
    return (
      <div className="pb-20">
        {/* En-tête avec infos du livreur */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Bonjour, {livreurInfo?.nom || 'Livreur'}</h1>
              <p className="text-blue-100 text-sm">Courses du jour</p>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <FiRefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* --- COMPTEUR 25 JOURS --- */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-3 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-blue-100 uppercase tracking-wider">Performances — Cycle {cycle25.numeroCycle}</p>
                <p className="text-2xl font-bold text-white mt-0.5">{livraisonsEffectuesCycle} <span className="text-base font-normal text-blue-200">livraisons</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-200">Jour {cycle25.jourDansCycle} / 25</p>
                <p className="text-xs text-blue-300 mt-0.5">{cycle25.joursRestants} jour{cycle25.joursRestants > 1 ? 's' : ''} restant{cycle25.joursRestants > 1 ? 's' : ''}</p>
              </div>
            </div>
            {/* Barre de progression */}
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${cycle25.pourcentage}%` }}
              />
            </div>
          </div>

          {/* --- CARTE DETTE EXPLICITE --- */}
          {(detteNette > 0 || situationDuJour.responsabiliteDuJour > 0) && (
            <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 border-2 border-red-300/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-red-100 uppercase tracking-wider">Dette totale nette</p>
                  <p className="text-3xl font-bold text-white mt-1">{(detteNette + situationDuJour.responsabiliteDuJour).toLocaleString()} F</p>
                </div>
                <button 
                  onClick={() => setShowDetteDetail(v => !v)}
                  className="bg-red-600/30 p-3 rounded-full hover:bg-red-600/50 transition-all"
                >
                  <FiAlertCircle className="text-white" size={24} />
                </button>
              </div>
              
              <div className="space-y-1.5 pt-3 border-t border-red-400/30">
                {detteNette > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-100">Dette antérieure:</span>
                    <span className="text-white font-semibold">{detteNette.toLocaleString()} F</span>
                  </div>
                )}
                {retenueSalaire > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-200">Retenue salaire appliquée:</span>
                    <span className="text-green-300 font-semibold">-{retenueSalaire.toLocaleString()} F</span>
                  </div>
                )}
                {situationDuJour.responsabiliteDuJour > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-100">Courses du jour (en cours):</span>
                    <span className="text-white font-semibold">{situationDuJour.responsabiliteDuJour.toLocaleString()} F</span>
                  </div>
                )}
                <p className="text-xs text-red-200 mt-1 italic">⚠️ En attente de validation admin</p>
              </div>

              {/* --- DÉTAIL DES DETTES --- */}
              {showDetteDetail && toutesLignesDette.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-400/30 space-y-2">
                  <p className="text-xs text-red-100 font-bold uppercase tracking-wider">Détail des dettes</p>
                  {toutesLignesDette.map((ligne, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-red-600/20 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{ligne.motif}</p>
                        <p className="text-xs text-red-200">{ligne.numeroSuivi} • {new Date(ligne.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className="text-sm font-bold text-red-200">{ligne.montant.toLocaleString()} F</span>
                    </div>
                  ))}
                </div>
              )}
              {showDetteDetail && toutesLignesDette.length === 0 && (
                <div className="mt-3 pt-3 border-t border-red-400/30">
                  <p className="text-xs text-red-200 text-center">Aucun détail disponible</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* GPS Status */}
        <div className="p-4">
          {renderGPSStatus()}
        </div>

        {/* Liste des courses */}
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Mes courses ({livraisonsJour.length})</h2>
          
          {livraisonsJour.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center">
              <FiPackage className="text-gray-300 mx-auto mb-3" size={48} />
              <p className="text-gray-500 font-semibold">Aucune course aujourd'hui</p>
              <p className="text-gray-400 text-sm mt-1">Les nouvelles courses apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {livraisonsJour.map((livraison) => (
                <div
                  key={livraison.id}
                  onClick={() => setSelectedLivraison(livraison)}
                  className="bg-white rounded-2xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <FiTruck className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{livraison.trackingNumber}</p>
                        <p className="text-xs text-gray-500">{livraison.expediteur}</p>
                      </div>
                    </div>
                    {getStatutBadge(livraison.statut)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FiUser className="text-gray-400" size={16} />
                      <span className="text-gray-700 font-medium">{livraison.nomClient}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <FiMapPin className="text-gray-400" size={16} />
                      <span className="text-gray-600">{livraison.quartier}, {livraison.ville}</span>
                    </div>

                    {livraison.numeroDestinataire && (
                      <div className="flex items-center gap-2 text-sm">
                        <FiPhone className="text-gray-400" size={16} />
                        <span className="text-gray-600">{livraison.numeroDestinataire}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <FiBox className="text-gray-400" size={16} />
                        <span className="text-gray-600">{livraison.nbArticles} article(s)</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">{livraison.total.toLocaleString()} F</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryPage = () => {
    return (
      <div className="pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Historique</h1>
              <p className="text-blue-100 text-sm">Courses validées</p>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <FiRefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Statistiques rapides */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-100">Total courses</p>
                <p className="text-2xl font-bold">{historique.length}</p>
              </div>
              <div>
                <p className="text-xs text-blue-100">Total encaissé</p>
                <p className="text-2xl font-bold">
                  {historique.reduce((sum, h) => sum + h.totalEncaisse, 0).toLocaleString()} F
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- BARRE DE RECHERCHE & FILTRES --- */}
        <div className="p-4 space-y-3">
          {/* Recherche */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par n° suivi, client, quartier..."
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-400 outline-none shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Filtres statut */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'tous', label: 'Tous', color: 'bg-gray-900 text-white' },
              { id: 'livre', label: '✅ Livré', color: 'bg-green-600 text-white' },
              { id: 'retourne', label: '↩️ Retourné', color: 'bg-orange-500 text-white' },
              { id: 'perdu', label: '🔴 Perdu', color: 'bg-red-600 text-white' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatut(f.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterStatut === f.id ? f.color : 'bg-gray-100 text-gray-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Résultat de recherche */}
          {(searchQuery || filterStatut !== 'tous') && (
            <p className="text-xs text-gray-500">
              {historiqueFiltré.length} résultat{historiqueFiltré.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Liste de l'historique */}
        <div className="px-4 space-y-3">
          {historiqueFiltré.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center">
              <FiCalendar className="text-gray-300 mx-auto mb-3" size={48} />
              <p className="text-gray-500 font-semibold">
                {historique.length === 0 ? 'Aucun historique' : 'Aucun résultat'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {historique.length === 0 ? 'Vos courses validées apparaîtront ici' : 'Essayez d\'autres termes de recherche'}
              </p>
            </div>
          ) : (
            historiqueFiltré.map((item) => {
              const isExpanded = expandedHistoryItems.has(item.id);

              // Badge statut
              const getStatutHistBadge = (sf) => {
                if (sf === 'livre') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">✅ Livré</span>;
                if (sf === 'retourne') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">↩️ Retourné</span>;
                if (sf === 'perdu') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">🔴 Perdu</span>;
                if (sf === 'perdu_partiel') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">⚠️ Partiel/Perdu</span>;
                if (sf === 'partiel') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">🟡 Partiel</span>;
                return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{sf}</span>;
              };
              
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleHistoryExpand(item.id)}
                  >
                    {/* En-tête de la carte */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{item.numeroSuivi}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.dateValidation).toLocaleDateString('fr-FR', { 
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        {item.isExpedition ? (
                          <span className="text-xs text-gray-400 font-medium">Expédition (0 F)</span>
                        ) : (
                          <>
                            <p className="font-bold text-lg text-gray-900">{item.totalEncaisse.toLocaleString()} F</p>
                            {item.totalAttenduReel !== item.totalEncaisse && (
                              <p className="text-xs text-gray-400">/{item.totalAttenduReel.toLocaleString()} F attendus</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiUser size={14} />
                          <span className="font-medium">{item.nomClient}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FiMapPin size={14} />
                          <span>{item.quartier}</span>
                        </div>
                      </div>
                      {getStatutHistBadge(item.statutFinal)}
                    </div>

                    {/* Alerte manquant ou perdu */}
                    {(item.manquant > 0 || item.valeurPerdus > 0) && (
                      <div className="mt-2 flex items-center gap-2 bg-red-50 rounded-lg px-3 py-1.5">
                        <FiAlertCircle className="text-red-500 flex-shrink-0" size={14} />
                        <span className="text-xs text-red-700 font-semibold">
                          {item.valeurPerdus > 0 && `Colis perdu: ${item.valeurPerdus.toLocaleString()} F`}
                          {item.valeurPerdus > 0 && item.manquant > 0 && ' • '}
                          {item.manquant > 0 && `Manquant: ${item.manquant.toLocaleString()} F`}
                        </span>
                      </div>
                    )}
                    {/* Retour sans dette */}
                    {item.valeurRetournes > 0 && item.manquant === 0 && item.valeurPerdus === 0 && (
                      <div className="mt-2 flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-1.5">
                        <FiCheckCircle className="text-orange-500 flex-shrink-0" size={14} />
                        <span className="text-xs text-orange-700 font-semibold">
                          Colis retourné: {item.valeurRetournes.toLocaleString()} F (pas de dette)
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center mt-2">
                      {isExpanded ? <FiChevronUp className="text-gray-400" size={18} /> : <FiChevronDown className="text-gray-400" size={18} />}
                    </div>
                  </div>

                  {/* --- DÉTAILS ÉTENDUS --- */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t space-y-3">
                      
                      {/* Articles avec statuts */}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Articles ({item.articles?.length || 0})</p>
                        <div className="space-y-2">
                          {item.articles && item.articles.map((art, idx) => {
                            const sc = art.statutCalcule;
                            const qteAff = sc === 'livre' ? art.qteCommande : sc === 'partiel' ? art.qteLivree : art.qteCommande;
                            
                            let bgClass = 'bg-green-50 border-green-400';
                            let labelEl = <span className="flex items-center gap-1 text-green-700 text-xs font-semibold"><FiCheckCircle size={12}/> Livré: {qteAff}/{art.qteCommande}</span>;
                            let valeur = art.qteLivree * (art.coutUnitaire || 0);
                            
                            if (sc === 'retourne') {
                              bgClass = 'bg-orange-50 border-orange-400';
                              labelEl = <span className="flex items-center gap-1 text-orange-700 text-xs font-semibold"><FiXCircle size={12}/> Retourné ({art.qteCommande}) — pas de dette</span>;
                              valeur = 0;
                            } else if (sc === 'perdu') {
                              bgClass = 'bg-red-50 border-red-500';
                              labelEl = <span className="flex items-center gap-1 text-red-700 text-xs font-semibold"><FiXCircle size={12}/> Perdu ({art.qteCommande}) — dette: {(art.qteCommande * (art.coutUnitaire || 0)).toLocaleString()} F</span>;
                              valeur = art.qteCommande * (art.coutUnitaire || 0);
                            } else if (sc === 'partiel') {
                              bgClass = 'bg-yellow-50 border-yellow-400';
                              const qteNL = art.qteCommande - art.qteLivree;
                              labelEl = <div className="flex flex-col gap-0.5">
                                <span className="flex items-center gap-1 text-green-700 text-xs font-semibold"><FiCheckCircle size={12}/> Livré: {art.qteLivree}</span>
                                <span className="flex items-center gap-1 text-orange-700 text-xs font-semibold"><FiXCircle size={12}/> Retourné: {qteNL} — pas de dette</span>
                              </div>;
                            }

                            return (
                              <div key={idx} className={`p-2.5 rounded-lg border-l-4 ${bgClass}`}>
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-gray-900 text-sm">{art.nom}</span>
                                  <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full">
                                    {valeur.toLocaleString()} F
                                  </span>
                                </div>
                                {labelEl}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Résumé financier */}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Résumé financier</p>
                        <div className="space-y-1.5 text-sm">
                          {!item.isExpedition && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Total initial:</span>
                                <span className="font-medium">{item.totalAttendu.toLocaleString()} F</span>
                              </div>
                              {item.valeurRetournes > 0 && (
                                <div className="flex justify-between text-orange-700">
                                  <span>↩️ Colis retourné:</span>
                                  <span className="font-medium">-{item.valeurRetournes.toLocaleString()} F</span>
                                </div>
                              )}
                              {item.totalAttenduReel !== item.totalAttendu && (
                                <div className="flex justify-between font-semibold border-t pt-1.5">
                                  <span className="text-gray-700">Total attendu réel:</span>
                                  <span>{item.totalAttenduReel.toLocaleString()} F</span>
                                </div>
                              )}
                              <div className="flex justify-between text-green-700">
                                <span>✅ Encaissé:</span>
                                <span className="font-semibold">{item.totalEncaisse.toLocaleString()} F</span>
                              </div>
                              {item.valeurPerdus > 0 && (
                                <div className="flex justify-between text-red-600 border-t pt-1.5">
                                  <span>🔴 Valeur colis perdu (dette):</span>
                                  <span className="font-bold">{item.valeurPerdus.toLocaleString()} F</span>
                                </div>
                              )}
                              {item.manquant > 0 && (
                                <div className="flex justify-between text-red-600 border-t pt-1.5">
                                  <span>⚠️ Versement insuffisant (dette):</span>
                                  <span className="font-bold">{item.manquant.toLocaleString()} F</span>
                                </div>
                              )}
                              {item.manquant === 0 && item.valeurPerdus === 0 && (
                                <div className="flex justify-between text-green-600 border-t pt-1.5">
                                  <span>✅ Aucune dette sur cette livraison</span>
                                  <span className="font-semibold">0 F</span>
                                </div>
                              )}
                            </>
                          )}
                          {item.isExpedition && (
                            <p className="text-gray-500 text-xs italic">Expédition — montant à récupérer: 0 F</p>
                          )}
                        </div>
                      </div>

                      {/* Commentaire de validation */}
                      {item.commentaireValidation && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-bold text-blue-900 mb-1">COMMENTAIRE ADMIN</p>
                          <p className="text-sm text-blue-800">{item.commentaireValidation}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 text-center">
                        Validé par: <span className="font-semibold">{item.validePar}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (loading && !livreurInfo) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de l'application...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md text-center">
        <FiAlertCircle className="text-red-600 mx-auto mb-3" size={32} />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
        <p className="text-sm text-gray-600">{error}</p>
        <button onClick={() => loadData(true)} className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-xl font-semibold">
          Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-md mx-auto min-h-screen bg-gray-50 relative">
        {activeTab === 'home' && renderHomePage()}
        {activeTab === 'history' && renderHistoryPage()}
        {activeTab === 'profile' && (
          <ProfilePage
            livreurId={livreurId}
            onLogout={onLogout}
            historique={historique}
            livraisonsJour={livraisonsJour}
            cycle25={cycle25}
            livraisonsEffectuesCycle={livraisonsEffectuesCycle}
          />
        )}
      </main>

      {/* MODALE DE DÉTAIL DE LA LIVRAISON */}
      {selectedLivraison && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-1">{selectedLivraison.trackingNumber}</h2>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold">{getTypeCourseLabel(selectedLivraison.type)}</span> • {selectedLivraison.expediteur}
            </p>
            
            <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Client</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full mt-1">
                        <FiUser className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedLivraison.nomClient}</p>
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                          <FiMapPin size={14} /> {selectedLivraison.quartier}, {selectedLivraison.ville}
                        </p>
                        {selectedLivraison.adresseComplete && (
                           <p className="text-gray-500 text-xs mt-1 italic">{selectedLivraison.adresseComplete}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-2">
                        {selectedLivraison.numeroDestinataire ? (
                          <>
                            <a 
                              href={`tel:${cleanPhoneNumber(selectedLivraison.numeroDestinataire)}`}
                              className="col-span-3 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                            >
                              <FiPhone size={20} /> Appeler le client
                            </a>
                            <button 
                              onClick={() => copyToClipboard(selectedLivraison.numeroDestinataire)}
                              className="col-span-1 flex items-center justify-center bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 active:scale-95 transition-all"
                              title="Copier le numéro"
                            >
                              <FiCopy size={20} />
                            </button>
                          </>
                        ) : (
                          <div className="col-span-4 bg-gray-100 text-gray-500 py-3 rounded-xl text-center font-medium">
                            Numéro de téléphone indisponible
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Articles ({selectedLivraison.articles.length})</h3>
                  <div className="space-y-2">
                    {selectedLivraison.articles.map((article, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">{article.nom} x{article.quantiteCommandee}</span>
                        <span className="font-semibold text-gray-900">{(article.quantiteCommandee * (article.coutUnitaire || 0)).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Montant à collecter</span>
                    <span className="text-2xl font-bold text-blue-700">{selectedLivraison.total.toLocaleString()} FCFA</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Mode: {selectedLivraison.modePaiement === 'cash' ? 'Espèces' : selectedLivraison.modePaiement}</p>
                </div>
              </div>

            <div className="space-y-3 mt-6">
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl flex items-center gap-3 text-sm border border-yellow-200">
                <FiInfo size={24} className="flex-shrink-0" />
                <p>Le statut de cette course sera validé ce soir lors du point avec l'administrateur.</p>
              </div>

              <button
                onClick={() => setSelectedLivraison(null)}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-black transition-all active:scale-[0.98]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto flex justify-around items-center py-2">
          {['home', 'history', 'profile'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-all ${
                activeTab === tab ? 'bg-blue-100 text-blue-600' : 'text-gray-500'
              }`}
            >
              {tab === 'home' && <FiHome size={22} />}
              {tab === 'history' && <FiList size={22} />}
              {tab === 'profile' && <FiProfile size={22} />}
              <span className="text-xs font-semibold capitalize">
                {tab === 'home' ? 'Accueil' : tab === 'history' ? 'Historique' : 'Profil'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}