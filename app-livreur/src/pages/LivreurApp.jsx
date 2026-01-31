import React, { useState, useEffect } from 'react';
import { 
  FiPackage, 
  FiTruck,
  FiMapPin,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiAlertCircle,
  FiChevronRight,
  FiHome,
  FiList,
  FiUser as FiProfile, // Renamed to avoid conflict
  FiRefreshCw,
  FiBox
} from 'react-icons/fi';
import {
  fetchLivraisonsJour,
  fetchHistoriqueLivraisons,
  fetchLivreurInfo,
  updateLivraisonStatut,
  calculateSituationDuJour 
} from '../logic/LivreurAppLogic';
import ProfilePage from './ProfilePage'; // <--- ASSUREZ-VOUS QUE CE CHEMIN EST CORRECT

export default function LivreurApp({ livreurId, onLogout }) {
  const [activeTab, setActiveTab] = useState('home'); // home, history, profile
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  
  const [livreurInfo, setLivreurInfo] = useState(null);
  const [livraisonsJour, setLivraisonsJour] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (livreurId) { 
      loadData();
    }
  }, [livreurId]);

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
      setError(err.message);
    } finally {
      setLoading(false);
      if (refresh) setIsRefreshing(false);
    }
  };

  const situationDuJour = calculateSituationDuJour(livraisonsJour);
  const detteTotale = livreurInfo?.finance?.detteActuelle || 0;

  const marquerComme = async (livraison, nouveauStatut) => {
    try {
      await updateLivraisonStatut(livraison.id, livraison.origine, nouveauStatut);
      setLivraisonsJour(prev => 
        prev.map(l => l.id === livraison.id ? { ...l, statut: nouveauStatut } : l)
      );
      setSelectedLivraison(null);
    } catch (error) {
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

  const renderHomePage = () => {
    const enCours = livraisonsJour.filter(l => l.statut === 'en_cours');

    return (
      <div className="p-4 pb-24 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bonjour {livreurInfo?.nom.split(' ')[0]},</h1>
            <p className="text-sm text-gray-500">Prêt pour la tournée ?</p>
          </div>
          <button onClick={() => loadData(true)} className={`p-2.5 bg-white rounded-full shadow-sm text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`}>
            <FiRefreshCw size={18} />
          </button>
        </div>

        <div className={`rounded-2xl p-5 text-white shadow-lg ${detteTotale > 0 ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-red-200' : 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-200'}`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Solde de votre compte</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{detteTotale.toLocaleString()}</span>
            <span className="text-sm font-medium opacity-80">FCFA</span>
          </div>
          <p className="text-xs mt-2 opacity-90">
            {detteTotale > 0 ? "Ceci est votre dette validée par l'admin." : "Votre compte est à jour. Bravo !"}
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase">
            <FiCalendar className="text-blue-600" />
            Situation du jour
          </h2>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
             <div className="text-center">
                <p className="text-xs text-gray-500">Responsabilité actuelle (à remettre)</p>
                <p className="text-3xl font-bold text-blue-700">{situationDuJour.responsabiliteDuJour.toLocaleString()} F</p>
             </div>
             <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
               <div className="text-center">
                  <p className="text-xs text-gray-500">Espèces en main</p>
                  <p className="font-bold text-green-600">{situationDuJour.especesEnMain.toLocaleString()} F</p>
               </div>
               <div className="text-center">
                  <p className="text-xs text-gray-500">Valeur des colis</p>
                  <p className="font-bold text-orange-600">{situationDuJour.valeurColisEnMain.toLocaleString()} F</p>
               </div>
             </div>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase">
            <FiPackage className="text-blue-600" />
            Courses actives ({livraisonsJour.length})
          </h2>
          {isRefreshing ? <p className="text-center text-gray-500">Actualisation...</p> : (
            livraisonsJour.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-600 font-medium">Aucune course en attente.</p>
                <p className="text-xs text-green-600 mt-1 font-bold">Vous êtes libre ! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {livraisonsJour.map((livraison) => (
                  <div key={livraison.id} onClick={() => setSelectedLivraison(livraison)} 
                    className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all cursor-pointer active:scale-[0.98] ${
                      livraison.statut === 'en_cours' ? 'border-blue-200 hover:border-blue-400' :
                      livraison.statut === 'livre' ? 'border-green-200 opacity-70' : 'border-red-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            livraison.statut === 'en_cours' ? 'bg-blue-100 text-blue-600' : 
                            livraison.statut === 'livre' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {livraison.statut === 'livre' ? <FiCheckCircle/> : livraison.statut === 'non_livre' ? <FiXCircle/> : <FiTruck/>}
                          </div>
                          <div>
                             <p className="font-bold text-gray-800">{livraison.quartier || livraison.ville}</p>
                             <p className="text-xs text-gray-500">{livraison.trackingNumber}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{livraison.total.toLocaleString()} F</span>
                          {livraison.statut === 'en_cours' && <FiChevronRight className="text-blue-500" />}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    );
  };
  
  const renderHistoryPage = () => {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
              <FiList className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Historique</h2>
              <p className="text-sm text-gray-600">Mes livraisons validées par l'admin</p>
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
            {historique.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                 <div>
                    <p className="font-bold text-gray-800">{item.numeroSuivi}</p>
                    <p className="text-xs text-gray-500">
                      Validé le {item.date ? new Date(item.date).toLocaleDateString('fr-FR') : 'N/A'}
                    </p>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.statutFinal === 'livre' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   {item.statutFinal === 'livre' ? `Livré (${item.totalEncaisse.toLocaleString()} F)` : 'Retourné'}
                 </div>
              </div>
            ))}
          </div>
        )}
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

      {selectedLivraison && selectedLivraison.statut === 'en_cours' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slide-up">
            <h2 className="text-xl font-bold mb-4">{selectedLivraison.trackingNumber}</h2>
            
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
                          <a href={`tel:${selectedLivraison.contactClient}`} className="font-semibold text-blue-600 underline">
                            {selectedLivraison.contactClient}
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
                          <span className="font-semibold text-gray-900">{selectedLivraison.ville}</span>
                        </div>
                      </>
                    )}
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
                </div>
              </div>

            <div className="space-y-3 mt-6">
              <button
                onClick={() => marquerComme(selectedLivraison, 'livre')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FiCheckCircle size={20} />
                Marquer comme livrée
              </button>

              <button
                onClick={() => marquerComme(selectedLivraison, 'non_livre')}
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
              <span className="text-xs font-semibold capitalize">{tab === 'home' ? 'Accueil' : tab}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}