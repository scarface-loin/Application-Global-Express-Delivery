import React, { useState } from 'react';
import { FiX, FiUploadCloud, FiDollarSign, FiFileText } from 'react-icons/fi';
// CORRECTION : Import du bon nom de fonction depuis la logique
import { validerFacturePartenaire } from '../logic/FacturePartenairePageLogic';

export default function FacturePartenaireModal({ delivery, onClose, onValidateSuccess }) {
  // Pré-remplir avec le montant original
  const [cost, setCost] = useState(delivery.coutLivraisonPartenaire || '');
  const [justification, setJustification] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation simple côté client
      if (!imageFile) {
        throw new Error("Veuillez télécharger une capture d'écran du dépôt (preuve de paiement).");
      }

      // CORRECTION : Appel avec les paramètres attendus par FacturePartenairePageLogic.js
      await validerFacturePartenaire({
        deliveryId: delivery.id,
        partenaireId: delivery.partenaireId,
        partenaireNom: delivery.partenaireNom,
        coutLivraisonOriginal: delivery.coutLivraisonPartenaire,
        coutLivraisonValide: parseFloat(cost),
        justification: justification,
        imageConfirmation: imageFile, // Le fichier est obligatoire
        numeroSuivi: delivery.numeroSuivi,
      });

      onValidateSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Valider le dépôt</h2>
            <p className="text-xs text-slate-500">Livraison {delivery.numeroSuivi}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <FiX className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info Partenaire */}
          <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm flex items-center gap-2">
             <span className="font-bold">Partenaire :</span> {delivery.partenaireNom}
          </div>

          {/* Champ Coût */}
          <div>
            <label htmlFor="cost" className="block text-sm font-bold text-slate-700 mb-1">
              Montant à verser (FCFA)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiDollarSign className="text-slate-400" />
              </div>
              <input
                type="number"
                id="cost"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all font-semibold text-slate-800"
                required
              />
            </div>
            {delivery.coutLivraisonPartenaire !== parseFloat(cost) && (
              <p className="text-xs text-amber-600 mt-1 font-medium">
                ⚠️ Le montant a été modifié (Original: {delivery.coutLivraisonPartenaire})
              </p>
            )}
          </div>

          {/* Champ Preuve (Fichier) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Preuve de dépôt (Capture d'écran) <span className="text-red-500">*</span>
            </label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl ${imageFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'} transition-all cursor-pointer relative`}>
              <div className="space-y-1 text-center">
                <FiUploadCloud className={`mx-auto h-10 w-10 ${imageFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                <div className="flex text-sm text-slate-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none">
                    <span>{imageFile ? imageFile.name : "Télécharger une image"}</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                {!imageFile && <p className="text-xs text-slate-500">PNG, JPG jusqu'à 5MB</p>}
              </div>
            </div>
          </div>

          {/* Champ Justification (Optionnel) */}
          <div>
            <label htmlFor="justification" className="block text-sm font-bold text-slate-700 mb-1">
              Note / Justification (Optionnel)
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FiFileText className="text-slate-400" />
              </div>
              <textarea
                id="justification"
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Frais ajustés suite à..."
                className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !imageFile}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi...
                </>
              ) : (
                'Valider et Payer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}