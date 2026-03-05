import React, { useState, useMemo, useEffect } from 'react';
import { 
  FiX, FiCheck, FiPackage, FiChevronDown, FiChevronUp, FiRefreshCw, FiTool, FiAlertCircle
} from 'react-icons/fi';

export default function ValidationModal({ livreur, onClose, onValidateSuccess }) {
  const [localLivraisons, setLocalLivraisons] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nouveaux états pour gérer le Cash et le Garage
  const [cashRecu, setCashRecu] = useState(0);
  const [fraisExpeditionMap, setFraisExpeditionMap] = useState({});
  const [showGarage, setShowGarage] = useState(false);
  const [garageData, setGarageData] = useState({
    motif: '',
    montantEstime: 0
  });

  // --- MODIFICATION ICI : Initialisation des données au montage ---
  useEffect(() => {
    const initData = livreur.livraisons.map(liv => {
      
      const newArticles = liv.articles.map(art => ({
        ...art,
        quantiteLivree: parseInt(art.quantiteCommandee || 0), // Pré-rempli livré par défaut
        quantiteRetournee: 0,                  // Rien n'est retourné par défaut
        quantitePerdue: 0
      }));
      
      
      const isExp = liv.infosLivraison?.type === 'expedition' || liv.type === 'expedition';
      return { ...liv, articles: newArticles, fraisAppliques: !isExp, isExpedition: isExp };
    });
    setLocalLivraisons(initData);

    // Pré-remplir les frais expédition avec coutPrestation (modifiable par l'admin)
    const expMap = {};
    initData.forEach(liv => {
      if (liv.isExpedition) expMap[liv.id] = parseFloat(liv.coutPrestation || 0);
    });
    setFraisExpeditionMap(expMap);

  }, [livreur]);

  // --- TOTAUX GLOBAUX ---
  const totals = useMemo(() => {
    let theorique = 0;     // Montant brut encaissé sur les courses normales
    let totalFraisExp = 0; // Frais avancés par le livreur pour les expéditions
    let perduArticles = 0;

    localLivraisons.forEach(liv => {
      let livTotal = 0;

      liv.articles.forEach(art => {
        perduArticles += (art.quantitePerdue * art.coutUnitaire);
        if (!liv.isExpedition) {
          const valLivree = art.quantiteLivree * art.coutUnitaire;
          theorique += valLivree;
          livTotal += valLivree;
        }
      });

      if (!liv.isExpedition && liv.fraisAppliques) {
        theorique += liv.coutPrestation;
        livTotal += liv.coutPrestation;
      }

      if (liv.isExpedition) {
        const fraisExp = parseFloat(fraisExpeditionMap[liv.id] || 0);
        totalFraisExp += fraisExp;
        livTotal = fraisExp;
      }

      liv.totalCalcule = livTotal;
    });

    // Net à déposer = encaissements courses − frais expédition avancés de la poche du livreur
    const netADeposer = Math.max(0, theorique - totalFraisExp);

    return { theorique: netADeposer, theoriquebrut: theorique, totalFraisExp, perduArticles };
  }, [localLivraisons, fraisExpeditionMap]);

  // Met à jour le cash reçu par défaut quand le théorique change
  useEffect(() => {
    setCashRecu(totals.theorique);
  }, [totals.theorique]);

  // Tous les articles doivent avoir reste === 0 pour autoriser la validation
  const tousRenseignes = localLivraisons.length > 0 && localLivraisons.every(liv =>
    liv.articles.every(art =>
      (art.quantiteLivree + art.quantiteRetournee + art.quantitePerdue) === art.quantiteCommandee
    )
  );

  // Calcul du cash manquant (Dette financière)
  const cashManquant = Math.max(0, totals.theorique - cashRecu);

  // --- LOGIQUE DE CALCUL ARTICLES ---
  const updateArticleQuantity = (livraisonIndex, articleIndex, type, delta) => {
    const newLivraisons = [...localLivraisons];
    const article = newLivraisons[livraisonIndex].articles[articleIndex];
    const currentTotalAssigned = article.quantiteLivree + article.quantiteRetournee + article.quantitePerdue;
    
    // Logique pour augmenter/diminuer
    if (delta > 0) {
      if (currentTotalAssigned < article.quantiteCommandee) article[type] += 1;
    } else {
      if (article[type] > 0) article[type] -= 1;
    }

    // Gestion intelligente des frais : si au moins 1 article est livré, on active les frais
    const hasDeliveredItem = newLivraisons[livraisonIndex].articles.some(a => a.quantiteLivree > 0);
    newLivraisons[livraisonIndex].fraisAppliques = hasDeliveredItem;

    setLocalLivraisons(newLivraisons);
  };

  const toggleFrais = (index) => {
    const newLivraisons = [...localLivraisons];
    newLivraisons[index].fraisAppliques = !newLivraisons[index].fraisAppliques;
    setLocalLivraisons(newLivraisons);
  };

  // --- VALIDATION FINALE ---
  const handleConfirm = async () => {
    if (!tousRenseignes) return; // Bouton désactivé, sécurité en plus

    // Vérification Garage
    if (showGarage && (!garageData.motif || garageData.montantEstime <= 0)) {
      alert("Veuillez remplir le motif et le montant pour le Garage.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onValidateSuccess({
        montantTheorique: totals.theorique,
        montantRecu: parseFloat(cashRecu),
        montantPerduArticles: totals.perduArticles,
        livraisons: localLivraisons,
        notes: notes,
        garageRequest: showGarage ? {
          actif: true,
          motif: garageData.motif,
          description: notes,
          montantEstime: parseFloat(garageData.montantEstime)
        } : null
      });
    } catch (e) {
      alert("Erreur: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Validation: {livreur.nom}</h2>
            <p className="text-sm text-gray-500">Renseignez chaque article avant de valider</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <FiX size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Corps Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50">
          
          {/* SECTION 1: Résumé Financier & Encaissement */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              
              {/* Total Net à Déposer */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">À Déposer (Net)</p>
                <p className="text-2xl font-bold text-blue-900">{totals.theorique.toLocaleString()} F</p>
                {totals.totalFraisExp > 0 ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[10px] text-gray-500">Encaissé : {totals.theoriquebrut.toLocaleString()} F</p>
                    <p className="text-[10px] text-orange-600 font-bold">− {totals.totalFraisExp.toLocaleString()} F frais expédition</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-blue-400">Courses encaissées + frais livraison</p>
                )}
              </div>

              {/* Saisie Montant Reçu */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs font-bold text-green-600 uppercase mb-1">Montant Reçu (Cash)</p>
                <input 
                  type="number"
                  value={cashRecu}
                  onChange={(e) => setCashRecu(parseFloat(e.target.value) || 0)}
                  className="w-full text-2xl font-bold text-green-900 bg-transparent border-b-2 border-green-200 focus:border-green-500 outline-none"
                />
                <p className="text-[10px] text-green-400">Modifiez si perte d'argent</p>
              </div>

              {/* Écart / Manquant */}
              <div className={`p-3 rounded-lg border ${cashManquant > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-xs font-bold uppercase mb-1 ${cashManquant > 0 ? 'text-red-600' : 'text-gray-500'}`}>Manquant (Dette)</p>
                <p className={`text-2xl font-bold ${cashManquant > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {cashManquant.toLocaleString()} F
                </p>
                {totals.perduArticles > 0 && (
                   <p className="text-[10px] text-red-400">+ {totals.perduArticles.toLocaleString()} F de marchandises</p>
                )}
              </div>
            </div>

            {/* Bouton Garage */}
            <div className="flex justify-end">
              <button 
                onClick={() => {
                  setShowGarage(!showGarage);
                  if(!showGarage && cashManquant > 0) {
                     setGarageData(prev => ({...prev, montantEstime: cashManquant}));
                  }
                }}
                className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${showGarage ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <FiTool />
                {showGarage ? "Annuler Garage" : "Déclarer un passage au Garage ?"}
              </button>
            </div>

            {/* Formulaire Garage */}
            {showGarage && (
              <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100 animate-fade-in">
                <div className="flex items-start gap-2 mb-3">
                  <FiAlertCircle className="text-orange-500 mt-1" />
                  <p className="text-xs text-orange-800">
                    Cette demande sera envoyée au Super Admin pour validation. 
                    Le montant déclaré ici sera ajouté à la dette du livreur en attendant la validation.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500">Motif (ex: Vidange, Panne)</label>
                    <input 
                      type="text"
                      value={garageData.motif}
                      onChange={(e) => setGarageData({...garageData, motif: e.target.value})}
                      className="w-full mt-1 p-2 border border-orange-200 rounded-lg text-sm focus:ring-orange-500"
                      placeholder="Ex: Pneu crevé"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Montant dépensé</label>
                    <input 
                      type="number"
                      value={garageData.montantEstime}
                      onChange={(e) => setGarageData({...garageData, montantEstime: e.target.value})}
                      className="w-full mt-1 p-2 border border-orange-200 rounded-lg text-sm focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Liste des Livraisons (Articles) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Détail des colis</h3>
            {localLivraisons.map((liv, lIdx) => {
              const isExpanded = expandedId === liv.id;
              const articlesTotal = liv.articles.reduce((acc, a) => acc + a.quantiteCommandee, 0);
              const assignedTotal = liv.articles.reduce((acc, a) => acc + a.quantiteLivree + a.quantiteRetournee + a.quantitePerdue, 0);
              const isFullyAssigned = articlesTotal === assignedTotal;

              return (
                <div key={liv.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-blue-300 shadow-md' : 'border-gray-200'}`}>
                  
                  <div 
                    onClick={() => toggleExpand(liv.id)}
                    className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isFullyAssigned ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        <FiPackage />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{liv.trackingNumber}</p>
                        <p className="text-xs text-gray-500">
                          {liv.infosLivraison?.type === 'expedition'
                            ? liv.infosLivraison?.villeDestination || 'Ville inconnue'
                            : liv.infosLivraison?.quartier || liv.quartier || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{liv.totalCalcule.toLocaleString()} F</p>
                      </div>
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase mb-2 px-1">
                        <div className="col-span-4">Article</div>
                        <div className="col-span-2 text-center text-green-600">Livré</div>
                        <div className="col-span-2 text-center text-blue-600">Retour</div>
                        <div className="col-span-2 text-center text-red-600">Perdu</div>
                        <div className="col-span-2 text-right">Reste</div>
                      </div>

                      <div className="space-y-2">
                        {liv.articles.map((art, aIdx) => {
                          const reste = art.quantiteCommandee - (art.quantiteLivree + art.quantiteRetournee + art.quantitePerdue);
                          return (
                            <div key={aIdx} className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-4">
                                <p className="text-xs font-bold text-gray-800">{art.nom}</p>
                                <p className="text-[10px] text-gray-500">{art.coutUnitaire.toLocaleString()} F</p>
                              </div>

                              <div className="col-span-2 flex justify-center bg-green-50 rounded">
                                <button onClick={() => updateArticleQuantity(lIdx, aIdx, 'quantiteLivree', -1)} className="px-2 font-bold text-green-700">-</button>
                                <span className="text-xs font-bold text-green-800 py-1 w-4 text-center">{art.quantiteLivree}</span>
                                <button onClick={() => updateArticleQuantity(lIdx, aIdx, 'quantiteLivree', 1)} className="px-2 font-bold text-green-700">+</button>
                              </div>

                              <div className="col-span-2 flex justify-center bg-blue-50 rounded">
                                <button onClick={() => updateArticleQuantity(lIdx, aIdx, 'quantiteRetournee', -1)} className="px-2 font-bold text-blue-700">-</button>
                                <span className="text-xs font-bold text-blue-800 py-1 w-4 text-center">{art.quantiteRetournee}</span>
                                <button onClick={() => updateArticleQuantity(lIdx, aIdx, 'quantiteRetournee', 1)} className="px-2 font-bold text-blue-700">+</button>
                              </div>

                              <div className="col-span-2 flex justify-center bg-red-50 rounded">
                                <button onClick={() => updateArticleQuantity(lIdx, aIdx, 'quantitePerdue', -1)} className="px-2 font-bold text-red-700">-</button>
                                <span className="text-xs font-bold text-red-800 py-1 w-4 text-center">{art.quantitePerdue}</span>
                                <button onClick={() => updateArticleQuantity(lIdx, aIdx, 'quantitePerdue', 1)} className="px-2 font-bold text-red-700">+</button>
                              </div>

                              <div className="col-span-2 text-right">
                                {reste === 0 ? <FiCheck className="ml-auto text-green-500" /> : <span className="text-xs font-bold text-orange-500">{reste}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {!liv.isExpedition && (
                        // Course normale uniquement : checkbox frais de livraison
                        <div className="mt-2 flex items-center gap-2">
                          <input type="checkbox" checked={liv.fraisAppliques} onChange={() => toggleFrais(lIdx)} />
                          <span className="text-xs text-gray-700">Appliquer frais livraison ({liv.coutPrestation} F)</span>
                        </div>
                      )}
                      {liv.isExpedition && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-[10px] font-bold text-orange-700 uppercase mb-2">
                            🚚 Frais expédition agence (dépense)
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={fraisExpeditionMap[liv.id] ?? 0}
                              onChange={(e) => setFraisExpeditionMap(prev => ({
                                ...prev,
                                [liv.id]: parseFloat(e.target.value) || 0
                              }))}
                              className="flex-1 p-2 border border-orange-300 rounded-lg text-sm font-bold text-orange-900 bg-white focus:ring-2 focus:ring-orange-400 outline-none"
                            />
                            <span className="text-xs text-orange-700 font-semibold">FCFA</span>
                          </div>
                          <p className="text-[10px] text-orange-500 mt-1">
                            Pré-rempli avec les frais de la livraison — modifiable si besoin
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
             <textarea 
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Notes générales..."
               className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               rows="2"
             ></textarea>
           </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white rounded-b-3xl">
          {!tousRenseignes && (
            <p className="text-center text-xs text-red-500 font-semibold mb-2 flex items-center justify-center gap-1">
              <FiAlertCircle size={13} />
              Tous les articles doivent être renseignés pour valider
            </p>
          )}
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !tousRenseignes}
            className={`w-full py-4 font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 transition-all 
              ${!tousRenseignes
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : cashManquant > 0
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-green-200'}
            `}
          >
            {isSubmitting ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
            {isSubmitting ? 'Validation...' : !tousRenseignes ? 'Articles incomplets...' : `Valider ${cashManquant > 0 ? '(Avec Dette)' : 'Session'}`}
          </button>
        </div>

      </div>
    </div>
  );
}