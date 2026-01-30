import React, { useState } from 'react';
import { 
  FiUser, 
  FiPhone,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiBriefcase
} from 'react-icons/fi';
import { createPartner } from './logic/CreatePartnerFormLogic';

export default function CreatePartnerFormPage() {
  const [formData, setFormData] = useState({
    nom: '',
    numero: '',
    type: ''
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null); // Pour les erreurs API
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const typesPartenaires = [
    { value: 'restaurant', label: '🍽️ Restaurant' },
    { value: 'pharmacie', label: '💊 Pharmacie' },
    { value: 'supermarche', label: '🛒 Supermarché' },
    { value: 'boutique', label: '👕 Boutique' },
    { value: 'boulangerie', label: '🥖 Boulangerie' },
    { value: 'epicerie', label: '🏪 Épicerie' },
    { value: 'autre', label: '📦 Autre' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Nettoyer les erreurs lors de la saisie
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (globalError) setGlobalError(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est obligatoire';
    }

    if (!formData.numero.trim()) {
      newErrors.numero = 'Le numéro est obligatoire';
    } else if (!/^\+?[0-9\s]{9,15}$/.test(formData.numero)) {
      newErrors.numero = 'Numéro de téléphone invalide';
    }

    if (!formData.type) {
      newErrors.type = 'Le type de partenaire est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setGlobalError(null);
    setSuccess(false);

    try {
      // Appel à la logique métier
      await createPartner(formData);

      setSuccess(true);
      
      // Réinitialisation après succès
      setTimeout(() => {
        setFormData({
          nom: '',
          numero: '',
          type: ''
        });
        setSuccess(false);
      }, 2000);

    } catch (err) {
      setGlobalError(err.message || "Une erreur est survenue lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
              <FiBriefcase className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nouveau Partenaire</h1>
              <p className="text-sm text-gray-600">Enregistrez un partenaire commercial</p>
            </div>
          </div>
        </div>

        {/* Affichage des erreurs globales (ex: doublon) */}
        {globalError && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-sm text-red-900 font-semibold">{globalError}</p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          
          {/* Carte des informations */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiBriefcase className="text-purple-600" size={20} />
              Informations du partenaire
            </h2>

            <div className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du partenaire <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    placeholder="Ex: Restaurant Le Goût"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition-colors ${
                      errors.nom ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                    }`}
                  />
                </div>
                {errors.nom && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle size={14} />
                    {errors.nom}
                  </p>
                )}
              </div>

              {/* Numéro */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Numéro de téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiPhone className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="tel"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    placeholder="Ex: 6 XX XX XX XX"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition-colors ${
                      errors.numero ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                    }`}
                  />
                </div>
                {errors.numero && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle size={14} />
                    {errors.numero}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de partenaire <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiBriefcase className="text-gray-400" size={20} />
                  </div>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none appearance-none bg-white transition-colors ${
                      errors.type ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                    }`}
                  >
                    <option value="">Sélectionner un type</option>
                    {typesPartenaires.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.type && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle size={14} />
                    {errors.type}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Aperçu */}
          {formData.nom && formData.numero && formData.type && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border-2 border-purple-200 p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Aperçu du compte</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nom:</span>
                  <span className="font-semibold text-gray-900">{formData.nom}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Identifiant (Tél):</span>
                  <span className="font-semibold text-gray-900">{formData.numero}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mot de passe défaut:</span>
                  <span className="font-bold text-purple-700">123456</span>
                </div>
              </div>
            </div>
          )}

          {/* Bouton de soumission */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
            <button
              onClick={handleSubmit}
              disabled={loading || success}
              className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                success 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-xl'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : success ? (
                <>
                  <FiCheckCircle size={20} />
                  Compte créé avec succès !
                </>
              ) : (
                <>
                  <FiUpload size={20} />
                  Créer le compte partenaire
                </>
              )}
            </button>

            {!success && (
              <p className="mt-3 text-xs text-center text-gray-500">
                Le mot de passe par défaut <span className="font-bold">123456</span> sera attribué automatiquement.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}