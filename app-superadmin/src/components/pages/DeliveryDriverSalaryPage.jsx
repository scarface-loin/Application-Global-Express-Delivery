import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiDollarSign, FiUser, FiCalendar, FiTruck, FiCheckCircle, FiX, FiEdit, FiSave, 
  FiPackage, FiAlertCircle, FiClock, FiSettings, FiEye, FiUpload, FiDownload, 
  FiTrendingUp, FiMinus 
} from 'react-icons/fi';

// --- MODIFICATION: Importation des fonctions de logique ---
import {
  fetchSalaryData,
  updateDriverSalaryConfig,
  addSalaryDeduction,
  saveSalaryPayment
} from './logic/DeliveryDriverSalaryPageLogic'; // <-- Adaptez ce chemin !
import DeliveryLoader from '../common/DeliveryLoader'; // Supposant un composant de chargement
import motoGif from '../../assets/moto-livraison.gif'; // Supposant l'existence du GIF

// --- Les Modals (DriverConfigModal, AddDeductionModal, etc.) restent IDENTIQUES au fichier original ---
// ... (Copiez/collez les 5 composants Modals ici : SalaryConfigModal, DriverConfigModal, AddDeductionModal, PaySalaryModal, DriverDetailsModal)
// ... Pour la lisibilité, je ne les inclus pas à nouveau, mais ils sont nécessaires.
// --- La seule modification mineure est dans PaySalaryModal, on passe le 'file' et non le 'preview'

// Modal de configuration globale des salaires
function SalaryConfigModal({ config, onClose, onSave }) {
  const [salaireBase, setSalaireBase] = useState(config.salaireBase);
  const [primeParLivraison, setPrimeParLivraison] = useState(config.primeParLivraison);

  const handleSave = () => {
    onSave(parseFloat(salaireBase), parseFloat(primeParLivraison));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl">
                <FiSettings className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Configuration Salariale</h2>
                <p className="text-sm text-gray-600">Paramètres par défaut</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="text-gray-600" size={24} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Salaire de base (25 jours)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <FiDollarSign className="text-gray-400" size={20} />
                </div>
                <input
                  type="number"
                  value={salaireBase}
                  onChange={(e) => setSalaireBase(e.target.value)}
                  className="w-full pl-12 pr-16 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 font-semibold"
                  min="0"
                  step="1000"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
                  FCFA
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Prime par livraison
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <FiDollarSign className="text-gray-400" size={20} />
                </div>
                <input
                  type="number"
                  value={primeParLivraison}
                  onChange={(e) => setPrimeParLivraison(e.target.value)}
                  className="w-full pl-12 pr-16 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 font-semibold"
                  min="0"
                  step="50"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
                  FCFA
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            >
              <FiSave className="inline mr-2" size={20} />
              Enregistrer les paramètres
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-[0.98]"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverConfigModal({ livreur, onClose, onSave }) {
  const [salaireBase, setSalaireBase] = useState(livreur.salaireBase);
  const [primeParLivraison, setPrimeParLivraison] = useState(livreur.primeParLivraison);

  const handleSave = () => {
    onSave(livreur.id, parseFloat(salaireBase), parseFloat(primeParLivraison));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                <FiEdit className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Configuration</h2>
                <p className="text-sm text-gray-600">{livreur.nom}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="text-gray-600" size={24} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Salaire de base personnalisé
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <FiDollarSign className="text-gray-400" size={20} />
                </div>
                <input
                  type="number"
                  value={salaireBase}
                  onChange={(e) => setSalaireBase(e.target.value)}
                  className="w-full pl-12 pr-16 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900 font-semibold"
                  min="0"
                  step="1000"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
                  FCFA
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Prime par livraison personnalisée
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <FiDollarSign className="text-gray-400" size={20} />
                </div>
                <input
                  type="number"
                  value={primeParLivraison}
                  onChange={(e) => setPrimeParLivraison(e.target.value)}
                  className="w-full pl-12 pr-16 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900 font-semibold"
                  min="0"
                  step="50"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
                  FCFA
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            >
              <FiSave className="inline mr-2" size={20} />
              Enregistrer
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-[0.98]"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddDeductionModal({ livreur, onClose, onSave }) {
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');

  const handleSave = () => {
    if (!montant || parseFloat(montant) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    if (!motif.trim()) {
      alert('Veuillez entrer un motif');
      return;
    }
    onSave(livreur.id, parseFloat(montant), motif);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl">
                <FiMinus className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ajouter un manquant</h2>
                <p className="text-sm text-gray-600">{livreur.nom}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="text-gray-600" size={24} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Montant du manquant <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <FiDollarSign className="text-gray-400" size={20} />
                </div>
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Entrer le montant"
                  className="w-full pl-12 pr-16 py-3.5 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none text-gray-900 font-semibold"
                  min="0"
                  step="100"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
                  FCFA
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Motif <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex: Colis endommagé, Retard, etc."
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none text-gray-900 resize-none"
                rows="3"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSave}
              disabled={!montant || !motif.trim() || parseFloat(montant) <= 0}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheckCircle className="inline mr-2" size={20} />
              Ajouter le manquant
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-[0.98]"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaySalaryModal({ livreur, onClose, onSave }) {
  const [montantPaye, setMontantPaye] = useState(livreur.salaireNet.toString());
  const [captureEcran, setCaptureEcran] = useState(null); // This will hold the File object
  const [capturePreview, setCapturePreview] = useState(null); // This will hold the data URL for preview
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCaptureEcran(file); // Store the file
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturePreview(reader.result); // Generate preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!montantPaye || parseFloat(montantPaye) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    if (!captureEcran) {
      alert('Veuillez ajouter une capture d\'écran du paiement');
      return;
    }

    setLoading(true);
    // onSave now is async and will handle the closure of the modal
    await onSave(livreur.id, parseFloat(montantPaye), captureEcran);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                <FiDollarSign className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Payer le salaire</h2>
                <p className="text-sm text-gray-600">{livreur.nom}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="text-gray-600" size={24} />
            </button>
          </div>

          {/* ... (le JSX du récapitulatif est le même) ... */}
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Récapitulatif du salaire</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Jours travaillés:</span>
                <span className="font-semibold text-gray-900">{livreur.joursTravailles}/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Livraisons:</span>
                <span className="font-semibold text-gray-900">{livreur.livraisonsEffectuees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salaire de base:</span>
                <span className="text-gray-900">{livreur.salaireBase.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Primes livraisons:</span>
                <span className="text-green-600">+{livreur.primesLivraisons.toLocaleString()} FCFA</span>
              </div>
              {livreur.manquants.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Manquants:</span>
                  <span className="text-red-600">-{livreur.totalManquants.toLocaleString()} FCFA</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="font-bold text-gray-900">Salaire net:</span>
                <span className="font-bold text-blue-700 text-lg">{livreur.salaireNet.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
          {/* ... (le JSX du montant payé est le même) ... */}
           <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Montant payé <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <FiDollarSign className="text-gray-400" size={20} />
              </div>
              <input
                type="number"
                value={montantPaye}
                onChange={(e) => setMontantPaye(e.target.value)}
                placeholder="Entrer le montant payé"
                className="w-full pl-12 pr-16 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-gray-900 font-semibold"
                min="0"
                step="100"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
                FCFA
              </div>
            </div>
          </div>
          {/* ... (le JSX de l'upload est le même) ... */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Capture d'écran du paiement <span className="text-red-500">*</span>
            </label>
            {!capturePreview ? (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
                  <FiUpload className="mx-auto text-gray-400 mb-3" size={40} />
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Cliquer pour ajouter une image
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG ou JPEG (max 5MB)
                  </p>
                </div>
              </label>
            ) : (
              <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden">
                <img src={capturePreview} alt="Preview" className="w-full h-auto" />
                <button
                  onClick={() => {
                    setCaptureEcran(null);
                    setCapturePreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSave}
              disabled={loading || !montantPaye || !captureEcran || parseFloat(montantPaye) <= 0}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <FiCheckCircle size={20} />
                  Confirmer le paiement
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



function DriverDetailsModal({ livreur, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{livreur.photo}</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{livreur.nom}</h2>
                <p className="text-sm text-gray-600">{livreur.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="text-gray-600" size={24} />
            </button>
          </div>

          {/* Performance */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Performance du mois</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiCalendar className="text-blue-600" size={20} />
                  <span className="text-xs text-gray-600">Jours travaillés</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{livreur.joursTravailles}/25</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiPackage className="text-green-600" size={20} />
                  <span className="text-xs text-gray-600">Livraisons</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{livreur.livraisonsEffectuees}</p>
              </div>
            </div>
          </div>

          {/* Calcul du salaire */}
          <div className="mb-6 bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Calcul du salaire</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Salaire de base:</span>
                <span className="font-semibold text-gray-900">{livreur.salaireBase.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prime par livraison:</span>
                <span className="text-gray-600">{livreur.primeParLivraison} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre de livraisons:</span>
                <span className="text-gray-600">× {livreur.livraisonsEffectuees}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-600">Total primes:</span>
                <span className="font-semibold text-green-600">+{livreur.primesLivraisons.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salaire brut:</span>
                <span className="font-bold text-gray-900">{livreur.salaireBrut.toLocaleString()} FCFA</span>
              </div>
              
              {/* Ligne Résumé des dettes/régularisations */}
              {livreur.totalManquants > 0 && (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Déductions nettes (Dettes - Garages):</span>
                  <span className="font-semibold text-red-600">-{livreur.totalManquants.toLocaleString()} FCFA</span>
                </div>
              )}
              
              <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900">Salaire net à payer:</span>
                <span className="font-bold text-blue-700 text-lg">{livreur.salaireNet.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Détails financiers (Dettes et Crédits) */}
          {livreur.manquants && livreur.manquants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Détails financiers ({livreur.manquants.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {livreur.manquants.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`border rounded-lg p-3 ${
                      item.type === 'credit' 
                        ? 'bg-green-50 border-green-200' // Style pour Régularisation Garage
                        : 'bg-red-50 border-red-200'     // Style pour Dette
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${
                        item.type === 'credit' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {/* Affiche + ou - selon le type */}
                        {item.type === 'credit' ? '+' : '-'}{item.montant.toLocaleString()} FCFA
                      </span>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      {item.type === 'credit' && <FiCheckCircle className="text-green-600" size={12} />}
                      {item.motif}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statut de paiement */}
          {livreur.statut === 'paye' && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiCheckCircle className="text-green-600" size={20} />
                <span className="font-bold text-green-700">Salaire payé</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant payé:</span>
                  <span className="font-bold text-green-700">{livreur.montantPaye.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de paiement:</span>
                  <span className="text-gray-600">{new Date(livreur.datePaiement).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              {livreur.captureEcran && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Preuve de paiement :</p>
                  <img src={livreur.captureEcran} alt="Preuve" className="w-full rounded-lg border border-gray-200" />
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-[0.98]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}


// Page principale
export default function DeliveryDriverSalaryPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [filter, setFilter] = useState('all');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [configGlobale, setConfigGlobale] = useState({
    salaireBase: 50000,
    primeParLivraison: 250
  });
  
  const [livreurs, setLivreurs] = useState([]);

  // --- MODIFICATION: Gestion du chargement des données ---
  const loadSalaryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSalaryData(selectedPeriod);
      setLivreurs(data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les données des salaires. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadSalaryData();
  }, [loadSalaryData]);

  // --- MODIFICATION: Connexion des actions aux fonctions de la logique ---
  const handleSaveGlobalConfig = (salaireBase, primeParLivraison) => {
    setConfigGlobale({ salaireBase, primeParLivraison });
    // Note: This only affects the UI default. A real implementation might save this to a 'settings' collection.
    setShowConfigModal(false);
  };

  const handleSaveDriverConfig = async (driverId, salaireBase, primeParLivraison) => {
    try {
      await updateDriverSalaryConfig(driverId, salaireBase, primeParLivraison);
      await loadSalaryData(); // Refresh data
      alert("Configuration du livreur mise à jour !");
      setSelectedDriver(null);
      setModalType(null);
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleAddDeduction = async (driverId, montant, motif) => {
    try {
      const selectedLivreur = livreurs.find(l => l.id === driverId);
      if (!selectedLivreur) return;

      await addSalaryDeduction(driverId, selectedLivreur.nom, montant, motif, selectedPeriod);
      await loadSalaryData(); // Refresh data
      alert("Manquant ajouté avec succès.");
      setSelectedDriver(null);
      setModalType(null);
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handlePaySalary = async (driverId, montantPaye, captureEcranFile) => {
    try {
      const selectedLivreur = livreurs.find(l => l.id === driverId);
      if (!selectedLivreur) return;

      await saveSalaryPayment(driverId, selectedLivreur.nom, montantPaye, selectedPeriod, captureEcranFile);
      await loadSalaryData(); // Refresh data
      alert("Paiement enregistré avec succès !");
      setSelectedDriver(null);
      setModalType(null);
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  // Le reste de la logique (filtrage, calculs totaux) reste le même mais opère sur les données de Firestore.
  const filteredLivreurs = livreurs.filter(l => {
    if (filter === 'all') return true;
    return l.statut === filter;
  });

  const totalSalaireBrut = livreurs.reduce((sum, l) => sum + l.salaireBrut, 0);
  const totalManquants = livreurs.reduce((sum, l) => sum + l.totalManquants, 0);
  const totalSalaireNet = livreurs.reduce((sum, l) => sum + l.salaireNet, 0);
  const totalPaye = livreurs.filter(l => l.statut === 'paye').reduce((sum, l) => sum + (l.montantPaye || 0), 0);

  // --- MODIFICATION: Affichage pendant le chargement ou en cas d'erreur ---
  if (loading) {
    return <DeliveryLoader gifUrl={motoGif} />;
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-xl font-bold text-red-700">Une erreur est survenue</h3>
          <p className="text-red-600">{error}</p>
          <button onClick={loadSalaryData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* L'ensemble du JSX pour l'affichage de la page reste le même que dans le fichier original */}
        {/* ... (Copiez/collez ici toute la structure JSX à partir de la div "En-tête") ... */}
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <FiDollarSign className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion Salaires Livreurs</h1>
                <p className="text-sm text-gray-600">Période de 25 jours</p>
              </div>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all"
            >
              <FiSettings className="text-gray-700" size={24} />
            </button>
          </div>

          {/* Sélecteur de période */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <FiCalendar className="inline mr-2" />
              Période (Mois)
            </label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-gray-900 font-semibold"
            />
          </div>

          {/* Config actuelle */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Configuration actuelle</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Salaire de base:</span>
                <p className="font-bold text-purple-700">{configGlobale.salaireBase.toLocaleString()} FCFA</p>
              </div>
              <div>
                <span className="text-gray-600">Prime par livraison:</span>
                <p className="font-bold text-purple-700">{configGlobale.primeParLivraison} FCFA</p>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
              }`}
            >
              Tous ({livreurs.length})
            </button>
            <button
              onClick={() => setFilter('paye')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                filter === 'paye'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
              }`}
            >
              ✓ Payés ({livreurs.filter(l => l.statut === 'paye').length})
            </button>
            <button
              onClick={() => setFilter('non_paye')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                filter === 'non_paye'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
              }`}
            >
              ⏳ À payer ({livreurs.filter(l => l.statut === 'non_paye').length})
            </button>
          </div>
        </div>
         {/* ... (et ainsi de suite pour tout le reste du JSX) ... */}
        
        {/* Statistiques globales */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiTrendingUp className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Salaire brut total</p>
                <p className="text-xl font-bold text-gray-900">{totalSalaireBrut.toLocaleString()}</p>
                <p className="text-xs text-gray-500">FCFA</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiAlertCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Manquants totaux</p>
                <p className="text-xl font-bold text-red-700">{totalManquants.toLocaleString()}</p>
                <p className="text-xs text-gray-500">FCFA</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiDollarSign className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Salaire net total</p>
                <p className="text-xl font-bold text-purple-700">{totalSalaireNet.toLocaleString()}</p>
                <p className="text-xs text-gray-500">FCFA</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Déjà payé</p>
                <p className="text-xl font-bold text-green-700">{totalPaye.toLocaleString()}</p>
                <p className="text-xs text-gray-500">sur {totalSalaireNet.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des livreurs */}
        <div className="space-y-4">
          {filteredLivreurs.map((livreur) => (
            <div
              key={livreur.id}
              className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden"
            >
              {/* En-tête livreur */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{livreur.photo}</div>
                    <div>
                      <h3 className="font-bold text-gray-900">{livreur.nom}</h3>
                      <p className="text-xs text-gray-500">{livreur.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {livreur.statut === 'paye' ? (
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                        <FiCheckCircle size={14} />
                        Payé
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 flex items-center gap-1">
                        <FiClock size={14} />
                        À payer
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats rapides */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Jours</p>
                    <p className="font-bold text-gray-900">{livreur.joursTravailles}/25</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Livraisons</p>
                    <p className="font-bold text-gray-900">{livreur.livraisonsEffectuees}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Primes</p>
                    <p className="font-bold text-green-600">+{livreur.primesLivraisons.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Corps */}
              <div className="p-4">
                {/* Calcul salaire */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salaire de base:</span>
                      <span className="text-gray-900">{livreur.salaireBase.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Primes ({livreur.primeParLivraison} × {livreur.livraisonsEffectuees}):</span>
                      <span className="text-green-600">+{livreur.primesLivraisons.toLocaleString()} FCFA</span>
                    </div>
                    {livreur.manquants.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Manquants ({livreur.manquants.length}):</span>
                        <span className="text-red-600">-{livreur.totalManquants.toLocaleString()} FCFA</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="font-bold text-gray-900">Salaire net:</span>
                      <span className="font-bold text-blue-700 text-lg">{livreur.salaireNet.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => {
                      setSelectedDriver(livreur);
                      setModalType('config');
                    }}
                    className="bg-blue-100 text-blue-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <FiEdit size={16} />
                    Config
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDriver(livreur);
                      setModalType('deduction');
                    }}
                    className="bg-red-100 text-red-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <FiMinus size={16} />
                    Manquant
                  </button>
                </div>

                {livreur.statut === 'non_paye' ? (
                  <button
                    onClick={() => {
                      setSelectedDriver(livreur);
                      setModalType('pay');
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-2"
                  >
                    <FiDollarSign size={20} />
                    Payer le salaire
                  </button>
                ) : (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 mb-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Payé le:</span>
                      <span className="font-bold text-green-700">
                        {new Date(livreur.datePaiement).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedDriver(livreur);
                    setModalType('details');
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <FiEye size={20} />
                  Voir les détails
                </button>
              </div>
            </div>
          ))}
        </div>
      
        {/* Modals */}
        {showConfigModal && (
          <SalaryConfigModal
            config={configGlobale}
            onClose={() => setShowConfigModal(false)}
            onSave={handleSaveGlobalConfig}
          />
        )}

        {selectedDriver && modalType === 'config' && (
          <DriverConfigModal
            livreur={selectedDriver}
            onClose={() => setSelectedDriver(null)}
            onSave={handleSaveDriverConfig}
          />
        )}

        {selectedDriver && modalType === 'deduction' && (
          <AddDeductionModal
            livreur={selectedDriver}
            onClose={() => setSelectedDriver(null)}
            onSave={handleAddDeduction}
          />
        )}

        {selectedDriver && modalType === 'pay' && (
          <PaySalaryModal
            livreur={selectedDriver}
            onClose={() => setSelectedDriver(null)}
            onSave={handlePaySalary}
          />
        )}

        {selectedDriver && modalType === 'details' && (
          <DriverDetailsModal
            livreur={selectedDriver}
            onClose={() => setSelectedDriver(null)}
          />
        )}
      </div>
    </div>
  );
}