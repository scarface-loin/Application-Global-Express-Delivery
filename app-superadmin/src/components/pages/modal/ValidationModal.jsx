import React, { useState, useEffect } from 'react';
import { 
  FiCheck, FiX, FiEdit2, FiTruck, FiPackage, 
  FiCheckCircle, FiTool, FiCalendar, FiMapPin, 
  FiXCircle, FiAlertTriangle, FiMinus, FiPlus
} from 'react-icons/fi';

export default function ValidationModal({ livreur, onClose, onValidateSuccess }) {
  // --- États ---
  const [carburant, setCarburant] = useState('5000');
  const [editingExpedition, setEditingExpedition] = useState(null);
  const [expeditionFees, setExpeditionFees] = useState({});
  const [isGarageVisit, setIsGarageVisit] = useState(false);
  const [garageNote, setGarageNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // NOUVEAU : On gère des quantités au lieu d'un statut unique
  const [deliveryQuantities, setDeliveryQuantities] = useState({});
  const [deliveryReasons, setDeliveryReasons] = useState({}); // { 'id-idx-type': 'raison' }
  const [editingArticle, setEditingArticle] = useState(null);

  const NON_LIVREE_REASONS = ['Client absent', 'Adresse incorrecte', 'Refus partiel/total', 'Argent insuffisant', 'Autre'];

  // --- Initialisation ---
  useEffect(() => {
    if (livreur) {
      const fees = {};
      const quantities = {};
      
      livreur.livraisons.forEach(liv => {
        if (liv.hasExpedition) {
          fees[liv.id] = liv.fraisExpedition || 0;
        }
        liv.articles.forEach((art, idx) => {
          const key = `${liv.id}-${idx}`;
          // Par défaut, tout est considéré comme LIVRÉ
          quantities[key] = {
            livree: art.quantite,
            non_livree: 0,
            perdu: 0
          };
        });
      });
      
      setExpeditionFees(fees);
      setDeliveryQuantities(quantities);
      setDeliveryReasons({});
      setCarburant('5000');
      setIsGarageVisit(false);
      setGarageNote('');
    }
  }, [livreur]);

  // --- Logique de modification des quantités ---
  const updateQuantity = (key, type, delta, maxTotal) => {
    setDeliveryQuantities(prev => {
      const current = prev[key];
      let newState = { ...current };

      // Si on modifie "non_livree" ou "perdu"
      if (type !== 'livree') {
        const newValue = newState[type] + delta;
        // Vérifications bornes
        if (newValue < 0) return prev;
        
        // Calcul du reste disponible pour "livree"
        const otherType = type === 'non_livree' ? 'perdu' : 'non_livree';
        const remainingForLivree = maxTotal - (newValue + newState[otherType]);
        
        if (remainingForLivree < 0) return prev; // Impossible de dépasser le total

        newState[type] = newValue;
        newState.livree = remainingForLivree;
      }
      return { ...prev, [key]: newState };
    });
  };

  // --- Calculs mis à jour ---
  const calculateTotalCollected = () => {
    let total = 0;
    livreur.livraisons.forEach(delivery => {
      delivery.articles.forEach((article, idx) => {
        const key = `${delivery.id}-${idx}`;
        const qty = deliveryQuantities[key];
        if (qty) {
          total += qty.livree * article.cout;
        }
      });
    });
    return total;
  };

  const calculateTotalLost = () => {
    let total = 0;
    livreur.livraisons.forEach(delivery => {
      delivery.articles.forEach((article, idx) => {
        const key = `${delivery.id}-${idx}`;
        const qty = deliveryQuantities[key];
        if (qty) {
          total += qty.perdu * article.cout;
        }
      });
    });
    return total;
  };

  const calculateTotalExpeditionFees = () => {
    return livreur.livraisons.reduce((sum, delivery) => {
      if (delivery.hasExpedition) {
        return sum + (expeditionFees[delivery.id] || delivery.fraisExpedition || 0);
      }
      return sum;
    }, 0);
  };

  const calculateExpectedAmount = () => {
    const total = calculateTotalCollected();
    const fees = calculateTotalExpeditionFees();
    const carburantCost = parseFloat(carburant) || 0;
    const lostAmount = calculateTotalLost();
    return total - fees - carburantCost - lostAmount;
  };

  // --- Helpers ---
  const formatAmount = (amount) => `${amount.toLocaleString()} FCFA`;
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  // --- Validation ---
  const handleValidate = () => {
    const missingReasons = [];
    livreur.livraisons.forEach(liv => {
      liv.articles.forEach((article, idx) => {
        const key = `${liv.id}-${idx}`;
        const qty = deliveryQuantities[key];
        if (!qty) return;

        // Vérifier raison pour non_livree
        if (qty.non_livree > 0 && !deliveryReasons[`${key}-non_livree`]) {
          missingReasons.push(`${article.nom} (Non livré)`);
        }
        // Vérifier raison pour perdu
        if (qty.perdu > 0 && !deliveryReasons[`${key}-perdu`]) {
          missingReasons.push(`${article.nom} (Perdu)`);
        }
      });
    });

    if (missingReasons.length > 0) {
      alert(`⚠️ Veuillez indiquer la raison pour :\n- ${missingReasons.join('\n- ')}`);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmValidation = () => {
    setLoading(true);
    setTimeout(() => {
      const expectedAmount = calculateExpectedAmount();
      alert(`✅ Validation enregistrée!\nMontant attendu: ${formatAmount(expectedAmount)}`);
      setLoading(false);
      setShowConfirmModal(false);
      onValidateSuccess(livreur.id);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      <div className="w-full h-full flex flex-col overflow-hidden">
        
        {/* Header - Mobile Optimized */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 shrink-0 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">{livreur.photo}</div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{livreur.nom}</h2>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>{livreur.id}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full active:bg-gray-200 transition-colors">
                    <FiX size={22} className="text-gray-600" />
                </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <FiCalendar size={12} />
                <span>{formatDate(livreur.date)}</span>
            </div>
        </div>

        {/* Corps scrollable - Mobile First */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 pb-32">
            
            {/* --- Section Articles Simplifiée --- */}
            {livreur.livraisons.map((delivery) => (
                <div key={delivery.id} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                    {/* En-tête livraison */}
                    <div className="flex items-start gap-2 mb-3 pb-2 border-b border-gray-100">
                        <FiMapPin className="text-gray-400 mt-0.5 shrink-0" size={16} />
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 text-sm truncate">{delivery.quartier}</div>
                            <div className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded inline-block mt-1">{delivery.type}</div>
                        </div>
                    </div>

                    {/* Articles */}
                    <div className="space-y-3">
                        {delivery.articles.map((article, idx) => {
                            const articleKey = `${delivery.id}-${idx}`;
                            const qty = deliveryQuantities[articleKey] || { livree: article.quantite, non_livree: 0, perdu: 0 };
                            const isEditing = editingArticle === articleKey;

                            return (
                                <div key={idx} className="border-2 border-gray-100 rounded-xl p-3">
                                    
                                    {/* Header Article - Simplifié */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded shrink-0">{article.quantite}</span>
                                              <p className="font-bold text-gray-900 text-sm truncate">{article.nom}</p>
                                            </div>
                                            <p className="text-xs text-gray-500">{article.cout.toLocaleString()} FCFA/u</p>
                                        </div>
                                        
                                        {/* Toggle Edit Button */}
                                        <button 
                                          onClick={() => setEditingArticle(isEditing ? null : articleKey)}
                                          className={`p-2.5 rounded-lg transition-all shrink-0 ${isEditing ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}
                                        >
                                            {isEditing ? <FiCheck size={18} /> : <FiEdit2 size={18} />}
                                        </button>
                                    </div>

                                    {/* Statut Summary - Toujours visible */}
                                    {!isEditing && (
                                      <div className="space-y-1.5">
                                        {qty.livree > 0 && (
                                          <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                                            <span className="text-xs font-medium text-green-700">Livrés</span>
                                            <span className="text-sm font-bold text-green-700">{qty.livree} • +{formatAmount(qty.livree * article.cout)}</span>
                                          </div>
                                        )}
                                        {qty.non_livree > 0 && (
                                          <div className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                                            <span className="text-xs font-medium text-orange-700">Non livrés</span>
                                            <span className="text-sm font-bold text-orange-700">{qty.non_livree}</span>
                                          </div>
                                        )}
                                        {qty.perdu > 0 && (
                                          <div className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                                            <span className="text-xs font-medium text-red-700">Perdus</span>
                                            <span className="text-sm font-bold text-red-700">{qty.perdu} • -{formatAmount(qty.perdu * article.cout)}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Zone d'édition Mobile - Swipe-friendly */}
                                    {isEditing && (
                                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                                        
                                        {/* Livré - Non éditable mais visible */}
                                        <div className="bg-green-50 rounded-lg p-3 border-2 border-green-200">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-green-800 uppercase">Livrés</span>
                                            <FiCheckCircle className="text-green-600" size={16} />
                                          </div>
                                          <div className="text-center py-1">
                                            <span className="text-3xl font-bold text-green-700">{qty.livree}</span>
                                            <span className="text-xs text-green-600 block">sur {article.quantite}</span>
                                          </div>
                                        </div>

                                        {/* Non Livré - Touch Optimized */}
                                        <div className="bg-orange-50 rounded-lg p-3 border-2 border-orange-200">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-orange-800 uppercase">Non livrés (Retour)</span>
                                            <FiXCircle className="text-orange-600" size={16} />
                                          </div>
                                          
                                          <div className="flex items-center justify-center gap-3 mb-2">
                                            <button 
                                              onClick={() => updateQuantity(articleKey, 'non_livree', -1, article.quantite)}
                                              className="w-12 h-12 rounded-xl bg-white border-2 border-orange-300 text-orange-700 font-bold text-xl active:bg-orange-100 disabled:opacity-30 disabled:active:bg-white transition-colors"
                                              disabled={qty.non_livree <= 0}
                                            >
                                              <FiMinus className="mx-auto" size={20} />
                                            </button>
                                            <span className="font-bold text-3xl text-gray-900 w-12 text-center">{qty.non_livree}</span>
                                            <button 
                                              onClick={() => updateQuantity(articleKey, 'non_livree', 1, article.quantite)}
                                              className="w-12 h-12 rounded-xl bg-white border-2 border-orange-300 text-orange-700 font-bold text-xl active:bg-orange-100 disabled:opacity-30 disabled:active:bg-white transition-colors"
                                              disabled={qty.livree <= 0}
                                            >
                                              <FiPlus className="mx-auto" size={20} />
                                            </button>
                                          </div>
                                          
                                          {qty.non_livree > 0 && (
                                            <select 
                                              className="w-full text-sm border-2 border-orange-300 rounded-lg p-2.5 focus:border-orange-500 focus:outline-none bg-white"
                                              value={deliveryReasons[`${articleKey}-non_livree`] || ''}
                                              onChange={(e) => setDeliveryReasons({...deliveryReasons, [`${articleKey}-non_livree`]: e.target.value})}
                                            >
                                                <option value="">Raison...</option>
                                                {NON_LIVREE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                          )}
                                        </div>

                                        {/* Perdu - Touch Optimized */}
                                        <div className="bg-red-50 rounded-lg p-3 border-2 border-red-200">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-red-800 uppercase">Perdus (Dette)</span>
                                            <FiAlertTriangle className="text-red-600" size={16} />
                                          </div>
                                          
                                          <div className="flex items-center justify-center gap-3 mb-2">
                                            <button 
                                              onClick={() => updateQuantity(articleKey, 'perdu', -1, article.quantite)}
                                              className="w-12 h-12 rounded-xl bg-white border-2 border-red-300 text-red-700 font-bold text-xl active:bg-red-100 disabled:opacity-30 disabled:active:bg-white transition-colors"
                                              disabled={qty.perdu <= 0}
                                            >
                                              <FiMinus className="mx-auto" size={20} />
                                            </button>
                                            <span className="font-bold text-3xl text-gray-900 w-12 text-center">{qty.perdu}</span>
                                            <button 
                                              onClick={() => updateQuantity(articleKey, 'perdu', 1, article.quantite)}
                                              className="w-12 h-12 rounded-xl bg-white border-2 border-red-300 text-red-700 font-bold text-xl active:bg-red-100 disabled:opacity-30 disabled:active:bg-white transition-colors"
                                              disabled={qty.livree <= 0}
                                            >
                                              <FiPlus className="mx-auto" size={20} />
                                            </button>
                                          </div>
                                          
                                          {qty.perdu > 0 && (
                                            <input 
                                              type="text"
                                              placeholder="Circonstances de la perte..."
                                              className="w-full text-sm border-2 border-red-300 rounded-lg p-2.5 focus:border-red-500 focus:outline-none bg-white"
                                              value={deliveryReasons[`${articleKey}-perdu`] || ''}
                                              onChange={(e) => setDeliveryReasons({...deliveryReasons, [`${articleKey}-perdu`]: e.target.value})}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Frais Expédition - Simplifié */}
                    {delivery.hasExpedition && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Frais expédition</span>
                                {editingExpedition === delivery.id ? (
                                    <div className="flex gap-2 items-center">
                                        <input 
                                          type="number" 
                                          className="w-24 p-2 border-2 border-blue-300 rounded-lg text-right font-bold focus:outline-none focus:border-blue-500" 
                                          value={expeditionFees[delivery.id] || 0} 
                                          onChange={(e) => setExpeditionFees({...expeditionFees, [delivery.id]: parseFloat(e.target.value) || 0})} 
                                          autoFocus 
                                        />
                                        <button 
                                          onClick={() => setEditingExpedition(null)} 
                                          className="p-2 bg-green-500 text-white rounded-lg active:bg-green-600"
                                        >
                                          <FiCheck size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                      onClick={() => setEditingExpedition(delivery.id)}
                                      className="flex items-center gap-2 active:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
                                    >
                                        <span className="font-bold text-red-600">-{formatAmount(expeditionFees[delivery.id] || 0)}</span>
                                        <FiEdit2 size={14} className="text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* --- Dépenses & Garage - Mobile Stack --- */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                        <FiTruck className="text-red-600"/> Dépenses
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Frais Expédition</span>
                            <span className="font-bold text-red-600">-{formatAmount(calculateTotalExpeditionFees())}</span>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Carburant</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={carburant} 
                                    onChange={(e) => setCarburant(e.target.value)} 
                                    className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl font-bold text-right text-lg focus:border-blue-400 focus:outline-none"
                                />
                                <span className="text-sm font-medium text-gray-500 shrink-0">FCFA</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                            <FiTool className="text-orange-600"/> Passage Garage
                        </h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isGarageVisit} 
                            onChange={(e) => setIsGarageVisit(e.target.checked)} 
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {isGarageVisit && (
                        <textarea 
                            value={garageNote} 
                            onChange={(e) => setGarageNote(e.target.value)}
                            placeholder="Note pour le garage..."
                            className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm resize-none focus:border-blue-400 focus:outline-none"
                            rows="3"
                        />
                    )}
                </div>
            </div>

            {/* --- Résumé - Mobile Optimized --- */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-4 text-white">
                <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                    <FiCheckCircle /> Récapitulatif
                </h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-blue-100">Collecté</span>
                        <span className="font-bold text-base">+{formatAmount(calculateTotalCollected())}</span>
                    </div>
                    {calculateTotalLost() > 0 && (
                      <div className="flex justify-between items-center text-red-200">
                        <span>Pertes</span>
                        <span className="font-bold text-base">-{formatAmount(calculateTotalLost())}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center opacity-90">
                        <span className="text-blue-100">Dépenses</span>
                        <span className="font-bold text-base">-{formatAmount(calculateTotalExpeditionFees() + (parseFloat(carburant)||0))}</span>
                    </div>
                    <div className="border-t border-white/30 my-2 pt-3 flex justify-between items-center">
                        <span className="font-bold text-base">Montant Attendu</span>
                        <span className="font-bold text-2xl">{formatAmount(calculateExpectedAmount())}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer - Fixed Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-3 flex gap-2 shadow-2xl z-20">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 active:bg-gray-200 transition-colors text-base"
            >
                Annuler
            </button>
            <button 
              onClick={handleValidate} 
              className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-green-600 active:bg-green-700 shadow-lg flex items-center justify-center gap-2 text-base"
            >
                <FiCheckCircle size={20} /> Valider
            </button>
        </div>

        {/* Modal Confirmation - Mobile Optimized */}
        {showConfirmModal && (
            <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <FiCheckCircle className="text-green-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Confirmer ?</h2>
                    <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Montant attendu</p>
                        <p className="text-3xl font-bold text-gray-900">{formatAmount(calculateExpectedAmount())}</p>
                    </div>
                    
                    {calculateTotalLost() > 0 && (
                        <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 text-left">
                            <p className="text-red-800 font-bold text-sm flex items-center gap-2 mb-2">
                                <FiAlertTriangle size={18} /> Dette générée
                            </p>
                            <p className="text-red-700 text-sm">
                                Articles perdus : <strong className="text-base">{formatAmount(calculateTotalLost())}</strong>
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button 
                          onClick={() => setShowConfirmModal(false)} 
                          className="flex-1 py-3.5 rounded-xl bg-gray-200 font-bold text-gray-700 text-base active:bg-gray-300"
                        >
                          Retour
                        </button>
                        <button 
                          onClick={confirmValidation} 
                          disabled={loading} 
                          className="flex-1 py-3.5 rounded-xl bg-green-600 text-white font-bold active:bg-green-700 disabled:opacity-50 text-base"
                        >
                            {loading ? 'Validation...' : 'Confirmer'}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}