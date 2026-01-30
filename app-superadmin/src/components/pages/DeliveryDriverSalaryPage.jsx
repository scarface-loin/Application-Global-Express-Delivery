import React, { useState } from 'react';
import { 
  FiDollarSign,
  FiUser,
  FiCalendar,
  FiTruck,
  FiCheckCircle,
  FiX,
  FiEdit,
  FiSave,
  FiPackage,
  FiAlertCircle,
  FiClock,
  FiSettings,
  FiEye,
  FiUpload,
  FiDownload,
  FiTrendingUp,
  FiMinus
} from 'react-icons/fi';

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

// Modal de configuration individuelle
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

// Modal d'ajout de manquant
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

// Modal de paiement du salaire
function PaySalaryModal({ livreur, onClose, onSave }) {
  const [montantPaye, setMontantPaye] = useState(livreur.salaireNet.toString());
  const [captureEcran, setCaptureEcran] = useState(null);
  const [capturePreview, setCapturePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCaptureEcran(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!montantPaye || parseFloat(montantPaye) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    if (!captureEcran) {
      alert('Veuillez ajouter une capture d\'écran du paiement');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onSave(livreur.id, parseFloat(montantPaye), capturePreview);
      setLoading(false);
    }, 1000);
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

          {/* Récapitulatif */}
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

          {/* Montant payé */}
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

          {/* Upload capture */}
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

          {/* Boutons */}
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

// Modal de visualisation des détails
function DriverDetailsModal({ livreur, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
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
              {livreur.manquants.length > 0 && (
                <>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Manquants:</span>
                    <span className="font-semibold text-red-600">-{livreur.totalManquants.toLocaleString()} FCFA</span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900">Salaire net:</span>
                <span className="font-bold text-blue-700 text-lg">{livreur.salaireNet.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Manquants */}
          {livreur.manquants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Manquants ({livreur.manquants.length})</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {livreur.manquants.map((manquant, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-red-700">-{manquant.montant.toLocaleString()} FCFA</span>
                      <span className="text-xs text-gray-500">{manquant.date}</span>
                    </div>
                    <p className="text-xs text-gray-600">{manquant.motif}</p>
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
  const [modalType, setModalType] = useState(null); // 'config', 'deduction', 'pay', 'details'
  const [filter, setFilter] = useState('all'); // all, paye, non_paye

  const [configGlobale, setConfigGlobale] = useState({
    salaireBase: 50000,
    primeParLivraison: 250
  });

  const [livreurs, setLivreurs] = useState([
    {
      id: 'DM-001',
      nom: 'Jean Dupont',
      photo: '👨‍🦱',
      joursTravailles: 25,
      livraisonsEffectuees: 120,
      salaireBase: 50000,
      primeParLivraison: 250,
      primesLivraisons: 30000,
      salaireBrut: 80000,
      manquants: [],
      totalManquants: 0,
      salaireNet: 80000,
      statut: 'non_paye'
    },
    {
      id: 'DM-002',
      nom: 'Marie Kouam',
      photo: '👩',
      joursTravailles: 23,
      livraisonsEffectuees: 95,
      salaireBase: 50000,
      primeParLivraison: 250,
      primesLivraisons: 23750,
      salaireBrut: 73750,
      manquants: [
        { montant: 5000, motif: 'Colis endommagé', date: '15/01/2026' }
      ],
      totalManquants: 5000,
      salaireNet: 68750,
      statut: 'paye',
      montantPaye: 68750,
      datePaiement: new Date().toISOString(),
      captureEcran: 'https://placehold.co/600x400/22c55e/white?text=Payment+Proof'
    },
    {
      id: 'DM-003',
      nom: 'Paul Nkongo',
      photo: '👨',
      joursTravailles: 24,
      livraisonsEffectuees: 110,
      salaireBase: 55000,
      primeParLivraison: 300,
      primesLivraisons: 33000,
      salaireBrut: 88000,
      manquants: [
        { montant: 3000, motif: 'Retard livraison', date: '10/01/2026' },
        { montant: 2000, motif: 'Client non satisfait', date: '18/01/2026' }
      ],
      totalManquants: 5000,
      salaireNet: 83000,
      statut: 'non_paye'
    },
    {
      id: 'DM-004',
      nom: 'Sarah Mballa',
      photo: '👩‍🦱',
      joursTravailles: 22,
      livraisonsEffectuees: 88,
      salaireBase: 50000,
      primeParLivraison: 250,
      primesLivraisons: 22000,
      salaireBrut: 72000,
      manquants: [],
      totalManquants: 0,
      salaireNet: 72000,
      statut: 'non_paye'
    },
    {
      id: 'DM-005',
      nom: 'Eric Mbida',
      photo: '👨‍🦰',
      joursTravailles: 25,
      livraisonsEffectuees: 130,
      salaireBase: 50000,
      primeParLivraison: 250,
      primesLivraisons: 32500,
      salaireBrut: 82500,
      manquants: [],
      totalManquants: 0,
      salaireNet: 82500,
      statut: 'paye',
      montantPaye: 82500,
      datePaiement: new Date().toISOString(),
      captureEcran: 'https://placehold.co/600x400/22c55e/white?text=Mobile+Money'
    },
  ]);

  const handleSaveGlobalConfig = (salaireBase, primeParLivraison) => {
    setConfigGlobale({ salaireBase, primeParLivraison });
    setShowConfigModal(false);
  };

  const handleSaveDriverConfig = (driverId, salaireBase, primeParLivraison) => {
    setLivreurs(prevLivreurs =>
      prevLivreurs.map(l => {
        if (l.id === driverId) {
          const primesLivraisons = l.livraisonsEffectuees * primeParLivraison;
          const salaireBrut = salaireBase + primesLivraisons;
          const salaireNet = salaireBrut - l.totalManquants;
          return {
            ...l,
            salaireBase,
            primeParLivraison,
            primesLivraisons,
            salaireBrut,
            salaireNet
          };
        }
        return l;
      })
    );
    setSelectedDriver(null);
    setModalType(null);
  };

  const handleAddDeduction = (driverId, montant, motif) => {
    setLivreurs(prevLivreurs =>
      prevLivreurs.map(l => {
        if (l.id === driverId) {
          const newManquant = {
            montant,
            motif,
            date: new Date().toLocaleDateString('fr-FR')
          };
          const newManquants = [...l.manquants, newManquant];
          const totalManquants = l.totalManquants + montant;
          const salaireNet = l.salaireBrut - totalManquants;
          return {
            ...l,
            manquants: newManquants,
            totalManquants,
            salaireNet
          };
        }
        return l;
      })
    );
    setSelectedDriver(null);
    setModalType(null);
  };

  const handlePaySalary = (driverId, montantPaye, captureEcran) => {
    setLivreurs(prevLivreurs =>
      prevLivreurs.map(l =>
        l.id === driverId
          ? {
              ...l,
              statut: 'paye',
              montantPaye,
              datePaiement: new Date().toISOString(),
              captureEcran
            }
          : l
      )
    );
    setSelectedDriver(null);
    setModalType(null);
  };

  const filteredLivreurs = livreurs.filter(l => {
    if (filter === 'all') return true;
    return l.statut === filter;
  });

  const totalSalaireBrut = livreurs.reduce((sum, l) => sum + l.salaireBrut, 0);
  const totalManquants = livreurs.reduce((sum, l) => sum + l.totalManquants, 0);
  const totalSalaireNet = livreurs.reduce((sum, l) => sum + l.salaireNet, 0);
  const totalPaye = livreurs.filter(l => l.statut === 'paye').reduce((sum, l) => sum + (l.montantPaye || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
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

        {/* Message si aucun livreur */}
        {filteredLivreurs.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full inline-block mb-4">
              <FiUser className="text-gray-400" size={48} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun livreur</h3>
            <p className="text-sm text-gray-600">
              Aucun livreur {filter === 'paye' ? 'payé' : filter === 'non_paye' ? 'à payer' : ''} pour cette période.
            </p>
          </div>
        )}

        {/* Récapitulatif final */}
        <div className="mt-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-4">
            Récapitulatif {new Date(selectedPeriod + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="opacity-90">Nombre de livreurs:</span>
              <span className="text-2xl font-bold">{livreurs.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-90">Salaire brut total:</span>
              <span className="text-xl font-bold">{totalSalaireBrut.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-90">Manquants totaux:</span>
              <span className="text-xl font-bold">-{totalManquants.toLocaleString()} FCFA</span>
            </div>
            <div className="pt-3 border-t border-white/30 flex items-center justify-between">
              <span className="font-bold">Salaire net total:</span>
              <span className="text-2xl font-bold">{totalSalaireNet.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-90">Déjà payé:</span>
              <span className="text-xl font-bold">{totalPaye.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-90">Reste à payer:</span>
              <span className="text-xl font-bold">{(totalSalaireNet - totalPaye).toLocaleString()} FCFA</span>
            </div>
          </div>

          <button className="w-full mt-4 bg-white text-indigo-700 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <FiDownload size={20} />
            Télécharger le rapport PDF
          </button>
        </div>
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
          onClose={() => {
            setSelectedDriver(null);
            setModalType(null);
          }}
          onSave={handleSaveDriverConfig}
        />
      )}

      {selectedDriver && modalType === 'deduction' && (
        <AddDeductionModal
          livreur={selectedDriver}
          onClose={() => {
            setSelectedDriver(null);
            setModalType(null);
          }}
          onSave={handleAddDeduction}
        />
      )}

      {selectedDriver && modalType === 'pay' && (
        <PaySalaryModal
          livreur={selectedDriver}
          onClose={() => {
            setSelectedDriver(null);
            setModalType(null);
          }}
          onSave={handlePaySalary}
        />
      )}

      {selectedDriver && modalType === 'details' && (
        <DriverDetailsModal
          livreur={selectedDriver}
          onClose={() => {
            setSelectedDriver(null);
            setModalType(null);
          }}
        />
      )}
    </div>
  );
}