import React, { useState } from 'react';
import { FiX, FiPhone, FiMapPin, FiCheckCircle, FiAlertCircle, FiPackage } from 'react-icons/fi';
import { updateLivraisonStatut } from '../logic/LivreurAppLogic';

export default function LivraisonModal({ livraison, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [motif, setMotif] = useState('');

  const handleAction = async (statut) => {
    if (statut === 'non_livre' && !motif) {
      alert("Veuillez indiquer un motif");
      return;
    }

    setLoading(true);
    try {
      await updateLivraisonStatut(livraison.id, livraison.origine, statut, motif);
      onUpdate(); // Rafraîchir la liste parente
      onClose();
    } catch (error) {
      alert("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-5 border-b border-gray-100 flex justify-between items-center rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Détails Livraison</h2>
            <p className="text-xs text-gray-500">{livraison.trackingNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          
          {/* Montant à encaisser */}
          <div className="bg-gray-900 text-white p-4 rounded-xl text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Montant à encaisser</p>
            <p className="text-3xl font-bold">{livraison.total.toLocaleString()} FCFA</p>
            <p className="text-sm text-gray-400 mt-1 capitalize">{livraison.modePaiement}</p>
          </div>

          {/* Client & Destination */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FiMapPin size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Adresse de livraison</p>
                <p className="font-bold text-gray-900">{livraison.quartier}</p>
                <p className="text-sm text-gray-600">{livraison.adresseComplete || "Pas de précisions"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <FiPhone size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Contact Client</p>
                <p className="font-bold text-gray-900">{livraison.nomClient}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-blue-600 font-medium">{livraison.contactClient}</p>
                  <a 
                    href={`tel:${livraison.contactClient}`}
                    className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full"
                  >
                    Appeler
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Liste Articles */}
          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FiPackage /> Articles ({livraison.nbArticles})
            </h3>
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              {livraison.articles.map((art, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">{art.quantite}x {art.nom}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {!showReject ? (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button 
                onClick={() => setShowReject(true)}
                className="py-3.5 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <FiAlertCircle /> Échec
              </button>
              <button 
                onClick={() => handleAction('livre')}
                disabled={loading}
                className="py-3.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200"
              >
                {loading ? '...' : <><FiCheckCircle /> Livré</>}
              </button>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-xl space-y-3 animate-fade-in">
              <label className="text-sm font-bold text-red-800">Motif de non-livraison</label>
              <select 
                className="w-full p-3 rounded-lg border-red-200 focus:ring-red-500"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
              >
                <option value="">Sélectionner un motif...</option>
                <option value="Client absent">Client absent</option>
                <option value="Client injoignable">Client injoignable</option>
                <option value="Refus client">Refus du client</option>
                <option value="Adresse introuvable">Adresse introuvable</option>
                <option value="Reporté">Reporté à demain</option>
              </select>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowReject(false)}
                  className="flex-1 py-2 bg-white text-gray-600 font-bold rounded-lg border"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => handleAction('non_livre')}
                  disabled={loading}
                  className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg"
                >
                  Valider Échec
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}