import React, { useState, useEffect } from 'react';
import { 
  FiPackage, FiTruck, FiMapPin, FiPhone, FiCheckCircle, FiXCircle, 
  FiCalendar, FiUser, FiAlertCircle, FiHome, FiList, FiUser as FiProfile, 
  FiRefreshCw, FiBox, FiChevronDown, FiChevronUp, FiCopy, FiInfo,
  FiNavigation, FiNavigation2
} from 'react-icons/fi';
import {
  fetchLivraisonsJour,
  fetchHistoriqueLivraisons,
  fetchLivreurInfo,
  calculateSituationDuJour 
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
          <div className="flex items-center justify-between mb-6">
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

          {/* Carte Dette Totale */}
          {(detteAncienne > 0 || situationDuJour.responsabiliteDuJour > 0) && (
            <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 border-2 border-red-300/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-red-100 uppercase tracking-wider">Dette totale</p>
                  <p className="text-3xl font-bold text-white mt-1">{manquantTotal.toLocaleString()} F</p>
                </div>
                <div className="bg-red-600/30 p-3 rounded-full">
                  <FiAlertCircle className="text-white" size={28} />
                </div>
              </div>
              
              {/* Détail de la dette */}
              <div className="space-y-1.5 pt-3 border-t border-red-400/30">
                {detteAncienne > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-100">Dette ancienne:</span>
                    <span className="text-white font-semibold">{detteAncienne.toLocaleString()} F</span>
                  </div>
                )}
                {situationDuJour.responsabiliteDuJour > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-100">Courses du jour:</span>
                    <span className="text-white font-semibold">{situationDuJour.responsabiliteDuJour.toLocaleString()} F</span>
                  </div>
                )}
                <p className="text-xs text-red-200 mt-2 italic">
                  ⚠️ En attente de validation admin
                </p>
              </div>
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

        {/* Liste de l'historique */}
        <div className="p-4 space-y-3">
          {historique.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center">
              <FiCalendar className="text-gray-300 mx-auto mb-3" size={48} />
              <p className="text-gray-500 font-semibold">Aucun historique</p>
              <p className="text-gray-400 text-sm mt-1">Vos courses validées apparaîtront ici</p>
            </div>
          ) : (
            historique.map((item) => {
              const isExpanded = expandedHistoryItems.has(item.id);
              
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleHistoryExpand(item.id)}
                  >
                    {/* En-tête de la carte */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${
                          item.statutFinal === 'livre' ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                          {item.statutFinal === 'livre' ? (
                            <FiCheckCircle className="text-green-600" size={20} />
                          ) : (
                            <FiXCircle className="text-orange-600" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.numeroSuivi}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.dateValidation).toLocaleDateString('fr-FR', { 
                              day: '2-digit', 
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          {item.totalEncaisse.toLocaleString()} F
                        </p>
                        <p className="text-xs text-gray-500">
                          /{item.totalAttendu.toLocaleString()} F
                        </p>
                      </div>
                    </div>

                    {/* Info client */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <FiUser size={16} />
                      <span className="font-medium">{item.nomClient}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiMapPin size={16} />
                      <span>{item.quartier}</span>
                    </div>

                    {/* Indicateur expansion */}
                    <div className="flex items-center justify-center mt-3">
                      {isExpanded ? (
                        <FiChevronUp className="text-gray-400" size={20} />
                      ) : (
                        <FiChevronDown className="text-gray-400" size={20} />
                      )}
                    </div>
                  </div>

                  {/* Détails étendus */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t space-y-3">
                      {/* Liste de TOUS les articles avec leur état */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-bold text-gray-700 mb-3">ARTICLES ({item.articles?.length || 0})</p>
                        <div className="space-y-2">
                          {item.articles && item.articles.map((art, idx) => {
                            const qteCommandee = parseInt(art.quantiteCommandee) || 0;
                            const qteLivree = parseInt(art.quantiteLivree) || 0;
                            const qteNonLivree = qteCommandee - qteLivree;
                            const isFullyDelivered = qteLivree === qteCommandee;
                            const isPartiallyDelivered = qteLivree > 0 && qteLivree < qteCommandee;
                            const isNotDelivered = qteLivree === 0;
                            
                            return (
                              <div 
                                key={idx} 
                                className={`p-2 rounded-lg border-l-4 ${
                                  isFullyDelivered 
                                    ? 'bg-green-50 border-green-500' 
                                    : isPartiallyDelivered 
                                    ? 'bg-orange-50 border-orange-500'
                                    : 'bg-red-50 border-red-500'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-gray-900 text-sm">{art.nom}</span>
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white">
                                    {((qteLivree) * (art.coutUnitaire || 0)).toLocaleString()} F
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs">
                                  {isFullyDelivered && (
                                    <>
                                      <span className="flex items-center gap-1 text-green-700">
                                        <FiCheckCircle size={12} />
                                        <span className="font-semibold">Livré: {qteLivree}/{qteCommandee}</span>
                                      </span>
                                    </>
                                  )}
                                  
                                  {isPartiallyDelivered && (
                                    <>
                                      <span className="flex items-center gap-1 text-green-700">
                                        <FiCheckCircle size={12} />
                                        <span className="font-semibold">Livré: {qteLivree}</span>
                                      </span>
                                      <span className="text-gray-400">•</span>
                                      <span className="flex items-center gap-1 text-orange-700">
                                        <FiXCircle size={12} />
                                        <span className="font-semibold">Non livré: {qteNonLivree}</span>
                                      </span>
                                    </>
                                  )}
                                  
                                  {isNotDelivered && (
                                    <span className="flex items-center gap-1 text-red-700">
                                      <FiXCircle size={12} />
                                      <span className="font-semibold">Non livré: {qteCommandee}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Résumé financier */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-bold text-gray-700 mb-2">RÉSUMÉ FINANCIER</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total attendu:</span>
                            <span className="font-semibold text-gray-900">
                              {item.totalAttendu.toLocaleString()} F
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Montant encaissé:</span>
                            <span className="font-semibold text-green-600">
                              {item.totalEncaisse.toLocaleString()} F
                            </span>
                          </div>
                          {item.manquant > 0 && (
                            <div className="flex justify-between pt-1 border-t">
                              <span className="text-gray-600 font-medium">Manquant:</span>
                              <span className="font-bold text-red-600">
                                {item.manquant.toLocaleString()} F
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Commentaire de validation */}
                      {item.commentaireValidation && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-bold text-blue-900 mb-1">COMMENTAIRE</p>
                          <p className="text-sm text-blue-800">{item.commentaireValidation}</p>
                        </div>
                      )}

                      {/* Validateur */}
                      <p className="text-xs text-gray-500 text-center">
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
        {activeTab === 'profile' && <ProfilePage livreurId={livreurId} onLogout={onLogout} />}
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