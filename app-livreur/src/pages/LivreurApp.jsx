import React, { useState, useEffect } from 'react';
import { 
  FiPackage, 
  FiTruck,
  FiMapPin,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiAlertCircle,
  FiChevronRight,
  FiHome,
  FiList,
  FiPieChart
} from 'react-icons/fi';
import {
  fetchLivraisonsJour,
  fetchHistoriqueLivraisons,
  fetchLivreurInfo,
  updateLivraisonStatut,
  calculateSolde
} from './logic/LivreurAppLogic';

export default function LivreurApp({ livreurId: propLivreurId, onLogout }) {
  const [activeTab, setActiveTab] = useState('today'); // today, history, balance
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  
  // États
  const [livreurInfo, setLivreurInfo] = useState(null);
  const [livraisonsJour, setLivraisonsJour] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ID du livreur connecté
  // Utilise la prop si fournie, sinon fallback sur un ID en dur pour les tests
  const livreurId = propLivreurId || "LIV-1706345678901";

  // Chargement des données au montage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Chargement en parallèle
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calcul du solde dynamique
  const solde = livraisonsJour.length > 0 ? calculateSolde(livraisonsJour) : {
    totalRecuMatin: 0,
    nombreTotal: 0,
    nombreLivrees: 0,
    nombreEnCours: 0,
    nombreNonLivrees: 0,
    montantVerse: 0,
    montantNonLivre: 0,
    soldeActuel: 0
  };

  const marquerComme = async (livraisonId, nouveauStatut) => {
    try {
      // Mise à jour dans Firebase
      await updateLivraisonStatut(livraisonId, nouveauStatut);
      
      // Mise à jour locale immédiate pour l'UI
      setLivraisonsJour(prevLivraisons => 
        prevLivraisons.map(l => 
          l.id === livraisonId 
            ? { 
                ...l, 
                statut: nouveauStatut,
                heureLivraison: nouveauStatut === 'livre' 
                  ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) 
                  : undefined
              } 
            : l
        )
      );
      
      setSelectedLivraison(null);
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'en_cours':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">En cours</span>;
      case 'livre':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">✓ Livrée</span>;
      case 'non_livre':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">✗ Non livrée</span>;
      default:
        return null;
    }
  };

  const getPrioriteBadge = (priorite) => {
    if (priorite === 'haute') {
      return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">🔥 Urgent</span>;
    }
    return null;
  };

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Écran d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <FiAlertCircle className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Erreur</h2>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Page du jour
  const renderTodayPage = () => {
    const enCours = livraisonsJour.filter(l => l.statut === 'en_cours');
    const livrees = livraisonsJour.filter(l => l.statut === 'livre');
    const nonLivrees = livraisonsJour.filter(l => l.statut === 'non_livre');

    return (
      <div className="space-y-4">
        {/* Stats du jour */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white bg-opacity-20 rounded-xl">
              <FiCalendar size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Mes livraisons du jour</h2>
              <p className="text-sm opacity-90">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-xs opacity-75">Total</p>
              <p className="text-2xl font-bold">{livraisonsJour.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-xs opacity-75">Livrées</p>
              <p className="text-2xl font-bold">{solde.nombreLivrees}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-xs opacity-75">En cours</p>
              <p className="text-2xl font-bold">{solde.nombreEnCours}</p>
            </div>
          </div>
        </div>

        {/* Solde rapide */}
        <div className={`rounded-2xl shadow-md p-4 border-2 ${
          solde.soldeActuel === 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Solde actuel</p>
              <p className={`text-2xl font-bold ${
                solde.soldeActuel === 0 ? 'text-green-700' : 'text-orange-700'
              }`}>
                {solde.soldeActuel.toLocaleString()} FCFA
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              solde.soldeActuel === 0 ? 'bg-green-200' : 'bg-orange-200'
            }`}>
              <FiDollarSign className={solde.soldeActuel === 0 ? 'text-green-700' : 'text-orange-700'} size={24} />
            </div>
          </div>
        </div>

        {/* Livraisons en cours */}
        {enCours.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <FiTruck className="text-blue-600" size={20} />
              <h3 className="text-lg font-bold text-gray-900">En cours ({enCours.length})</h3>
            </div>
            <div className="space-y-3">
              {enCours.map((livraison) => (
                <div
                  key={livraison.id}
                  onClick={() => setSelectedLivraison(livraison)}
                  className="bg-white rounded-2xl shadow-sm border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          {livraison.type === 'course' ? (
                            <FiPackage className="text-blue-600" size={20} />
                          ) : (
                            <FiTruck className="text-blue-600" size={20} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{livraison.entreprise}</h4>
                          <p className="text-xs text-gray-500">Attribué à {livraison.heureAttribution}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getPrioriteBadge(livraison.priorite)}
                        <FiChevronRight className="text-blue-500" size={24} />
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {livraison.type === 'course' ? (
                        <>
                          <div className="flex items-center gap-2 text-sm">
                            <FiMapPin className="text-gray-400" size={14} />
                            <span className="text-gray-700">{livraison.quartier}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FiPhone className="text-gray-400" size={14} />
                            <span className="text-gray-700">{livraison.numeroDestinataire}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-sm">
                            <FiUser className="text-gray-400" size={14} />
                            <span className="text-gray-700">{livraison.nomClient}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FiMapPin className="text-gray-400" size={14} />
                            <span className="text-gray-700">{livraison.villeDestination}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Montant</span>
                      <span className="text-lg font-bold text-blue-700">
                        {livraison.total.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Livraisons terminées */}
        {livrees.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-6">
              <FiCheckCircle className="text-green-600" size={20} />
              <h3 className="text-lg font-bold text-gray-900">Livrées aujourd'hui ({livrees.length})</h3>
            </div>
            <div className="space-y-3">
              {livrees.map((livraison) => (
                <div
                  key={livraison.id}
                  className="bg-white rounded-2xl shadow-sm border-2 border-green-200 opacity-75"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <FiCheckCircle className="text-green-600" size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{livraison.entreprise}</h4>
                          <p className="text-xs text-gray-500">Livré à {livraison.heureLivraison}</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-700">{livraison.total.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Non livrées */}
        {nonLivrees.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-6">
              <FiXCircle className="text-red-600" size={20} />
              <h3 className="text-lg font-bold text-gray-900">Non livrées ({nonLivrees.length})</h3>
            </div>
            <div className="space-y-3">
              {nonLivrees.map((livraison) => (
                <div
                  key={livraison.id}
                  className="bg-white rounded-2xl shadow-sm border-2 border-red-200"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-xl">
                          <FiXCircle className="text-red-600" size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{livraison.entreprise}</h4>
                          <p className="text-xs text-red-600">À retourner</p>
                        </div>
                      </div>
                      <span className="font-bold text-red-700">{livraison.total.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Message si aucune livraison */}
        {livraisonsJour.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune livraison aujourd'hui</h3>
            <p className="text-sm text-gray-600">Vous n'avez pas encore de livraisons attribuées.</p>
          </div>
        )}
      </div>
    );
  };

  // Page historique
  const renderHistoryPage = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
              <FiList className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Historique</h2>
              <p className="text-sm text-gray-600">Mes livraisons passées</p>
            </div>
          </div>
        </div>

        {historique.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun historique</h3>
            <p className="text-sm text-gray-600">Vos livraisons validées apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historique.map((jour, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {new Date(jour.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                      <p className="text-xs text-gray-500">{jour.livraisons} livraisons</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                      jour.solde === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {jour.solde === 0 ? '✓ Soldé' : `${jour.solde.toLocaleString()} FCFA`}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-600">Total</p>
                      <p className="text-sm font-bold text-blue-700">{jour.livraisons}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-600">Livrées</p>
                      <p className="text-sm font-bold text-green-700">{jour.livrees}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-600">Non livrées</p>
                      <p className="text-sm font-bold text-red-700">{jour.nonLivrees}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total reçu:</span>
                      <span className="font-semibold text-gray-900">{jour.montantTotal.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Versé:</span>
                      <span className="font-semibold text-green-700">{jour.montantVerse.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Page solde
  const renderBalancePage = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
              <FiPieChart className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mon solde</h2>
              <p className="text-sm text-gray-600">Suivi financier du jour</p>
            </div>
          </div>
        </div>

        {/* Solde principal */}
        <div className={`rounded-2xl shadow-lg p-6 ${
          solde.soldeActuel === 0 
            ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
            : 'bg-gradient-to-br from-orange-500 to-red-600'
        }`}>
          <div className="text-center text-white">
            <p className="text-sm opacity-90 mb-2">Solde actuel</p>
            <p className="text-5xl font-bold mb-2">{solde.soldeActuel.toLocaleString()}</p>
            <p className="text-lg opacity-90">FCFA</p>
            <div className="mt-4 pt-4 border-t border-white border-opacity-30">
              <p className="text-xs opacity-75">
                {solde.soldeActuel === 0 
                  ? '✓ Vous êtes à jour!' 
                  : '⚠️ Montant à remettre en fin de journée'}
              </p>
            </div>
          </div>
        </div>

        {/* Détails */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">Détails du jour</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <FiPackage className="text-blue-700" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total reçu ce matin</p>
                  <p className="font-semibold text-gray-900">Livraisons: {solde.nombreTotal}</p>
                </div>
              </div>
              <p className="font-bold text-blue-700">{solde.totalRecuMatin.toLocaleString()} FCFA</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-200 rounded-lg">
                  <FiCheckCircle className="text-green-700" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Livrées et versées</p>
                  <p className="font-semibold text-gray-900">Livraisons: {solde.nombreLivrees}</p>
                </div>
              </div>
              <p className="font-bold text-green-700">+{solde.montantVerse.toLocaleString()} FCFA</p>
            </div>

            {solde.nombreNonLivrees > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-200 rounded-lg">
                    <FiXCircle className="text-red-700" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Non livrées à retourner</p>
                    <p className="font-semibold text-gray-900">Livraisons: {solde.nombreNonLivrees}</p>
                  </div>
                </div>
                <p className="font-bold text-red-700">{solde.montantNonLivre.toLocaleString()} FCFA</p>
              </div>
            )}

            {solde.nombreEnCours > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-200 rounded-lg">
                    <FiTruck className="text-orange-700" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">En cours de livraison</p>
                    <p className="font-semibold text-gray-900">Livraisons: {solde.nombreEnCours}</p>
                  </div>
                </div>
                <p className="font-bold text-orange-700">
                  {(solde.totalRecuMatin - solde.montantVerse - solde.montantNonLivre).toLocaleString()} FCFA
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Explication */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex gap-3">
            <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Comment fonctionne le solde?</p>
              <ul className="space-y-1 text-xs">
                <li>• Le matin, vous recevez des colis à livrer</li>
                <li>• Votre solde est négatif (-) du montant total</li>
                <li>• À chaque livraison réussie, le solde remonte</li>
                <li>• Le soir, vous versez l'argent collecté</li>
                <li>• Les colis non livrés doivent être retournés</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl">
              {livreurInfo?.photoUrl ? (
                <img src={livreurInfo.photoUrl} alt={livreurInfo.nom} className="h-full w-full rounded-full object-cover" />
              ) : (
                '👨‍🦱'
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold">{livreurInfo?.nom || 'Livreur'}</h1>
              <p className="text-xs opacity-90">{livreurId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs opacity-75">Solde actuel</p>
              <p className={`text-lg font-bold ${solde.soldeActuel === 0 ? 'text-green-300' : 'text-orange-300'}`}>
                {solde.soldeActuel.toLocaleString()} F
              </p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {activeTab === 'today' && renderTodayPage()}
        {activeTab === 'history' && renderHistoryPage()}
        {activeTab === 'balance' && renderBalancePage()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto flex justify-around items-center px-4 py-3">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'today'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            <FiHome size={24} />
            <span className="text-xs font-semibold">Aujourd'hui</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-purple-100 text-purple-600'
                : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            <FiList size={24} />
            <span className="text-xs font-semibold">Historique</span>
          </button>

          <button
            onClick={() => setActiveTab('balance')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'balance'
                ? 'bg-green-100 text-green-600'
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            <FiPieChart size={24} />
            <span className="text-xs font-semibold">Solde</span>
          </button>
        </div>
      </div>

      {/* Modal de détails de livraison */}
      {selectedLivraison && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* En-tête */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                    {selectedLivraison.type === 'course' ? (
                      <FiPackage className="text-white" size={24} />
                    ) : (
                      <FiTruck className="text-white" size={24} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedLivraison.entreprise}</h2>
                    <p className="text-sm text-gray-600">{selectedLivraison.trackingNumber}</p>
                  </div>
                </div>
                {getPrioriteBadge(selectedLivraison.priorite)}
              </div>

              {/* Informations */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Destination</h3>
                  <div className="space-y-2">
                    {selectedLivraison.type === 'course' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <FiMapPin className="text-blue-600" size={18} />
                          <span className="font-semibold text-gray-900">{selectedLivraison.quartier}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiPhone className="text-blue-600" size={18} />
                          <a href={`tel:${selectedLivraison.numeroDestinataire}`} className="font-semibold text-blue-600 underline">
                            {selectedLivraison.numeroDestinataire}
                          </a>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <FiUser className="text-blue-600" size={18} />
                          <span className="font-semibold text-gray-900">{selectedLivraison.nomClient}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiPhone className="text-blue-600" size={18} />
                          <a href={`tel:${selectedLivraison.contactClient}`} className="font-semibold text-blue-600 underline">
                            {selectedLivraison.contactClient}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiMapPin className="text-blue-600" size={18} />
                          <span className="font-semibold text-gray-900">{selectedLivraison.villeDestination}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Articles */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Articles ({selectedLivraison.articles.length})</h3>
                  <div className="space-y-2">
                    {selectedLivraison.articles.map((article, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">{article.nom} x{article.quantite}</span>
                        <span className="font-semibold text-gray-900">{(article.quantite * article.cout).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Montant */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Montant à collecter</span>
                    <span className="text-2xl font-bold text-blue-700">{selectedLivraison.total.toLocaleString()} FCFA</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Incluant {selectedLivraison.fraisLivraison.toLocaleString()} FCFA de frais de livraison</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => marquerComme(selectedLivraison.id, 'livre')}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <FiCheckCircle size={20} />
                  Marquer comme livrée
                </button>

                <button
                  onClick={() => marquerComme(selectedLivraison.id, 'non_livre')}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <FiXCircle size={20} />
                  Marquer comme non livrée
                </button>

                <button
                  onClick={() => setSelectedLivraison(null)}
                  className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-[0.98]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}