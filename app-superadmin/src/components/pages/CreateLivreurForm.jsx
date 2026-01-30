import { createLivreurInFirebase } from './logic/CreateLivreurFormLogic';
import React, { useState } from 'react';
import {
  FiUser,
  FiPhone,
  FiCreditCard,
  FiFileText,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiX
} from 'react-icons/fi';

export default function CreateLivreurForm() {
  const [formData, setFormData] = useState({
    nom: '',
    numero: '',
    permis: null,
    cni: null,
    contratTravail: null
  });

  const [fileNames, setFileNames] = useState({
    permis: '',
    cni: '',
    contratTravail: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, [fieldName]: 'Fichier trop volumineux (max 5MB)' }));
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, [fieldName]: 'Format non supporté (JPG, PNG, PDF uniquement)' }));
        return;
      }

      setFormData(prev => ({ ...prev, [fieldName]: file }));
      setFileNames(prev => ({ ...prev, [fieldName]: file.name }));
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const removeFile = (fieldName) => {
    setFormData(prev => ({ ...prev, [fieldName]: null }));
    setFileNames(prev => ({ ...prev, [fieldName]: '' }));
    const fileInput = document.getElementById(`file-${fieldName}`);
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est obligatoire';
    }

    if (!formData.numero.trim()) {
      newErrors.numero = 'Le numéro est obligatoire';
    } else if (!/^\+?[0-9]{9,15}$/.test(formData.numero.replace(/\s/g, ''))) {
      newErrors.numero = 'Numéro de téléphone invalide';
    }

    if (!formData.permis) {
      newErrors.permis = 'Le permis de conduire est obligatoire';
    }

    if (!formData.cni) {
      newErrors.cni = 'La CNI est obligatoire';
    }

    if (!formData.contratTravail) {
      newErrors.contratTravail = 'Le contrat de travail est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => { // Ajoute async
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 2. Appel à la nouvelle logique
      // Note: formData ici contient déjà les objets File grâce à ton handleFileChange
      const result = await createLivreurInFirebase(formData);

      if (result.success) {
        setSuccess(true);
        // Reset du formulaire...
        setTimeout(() => {
          setFormData({
            nom: '',
            numero: '',
            permis: null,
            cni: null,
            contratTravail: null
          });
          setFileNames({ permis: '', cni: '', contratTravail: '' });
          setSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      // Afficher l'erreur dans l'UI si tu as un state d'erreur global
      alert("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const FileUploadField = ({ label, name, icon: Icon, accept = "image/*,application/pdf" }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>

      {!fileNames[name] ? (
        <label className={`block cursor-pointer ${errors[name] ? 'border-red-300' : 'border-gray-300'}`}>
          <input
            type="file"
            id={`file-${name}`}
            accept={accept}
            onChange={(e) => handleFileChange(e, name)}
            className="hidden"
          />
          <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all hover:border-blue-400 hover:bg-blue-50 ${errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-blue-100 rounded-full">
                <Icon className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Cliquez pour télécharger
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG ou PDF (max 5MB)
                </p>
              </div>
            </div>
          </div>
        </label>
      ) : (
        <div className="border-2 border-green-300 bg-green-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {fileNames[name]}
                </p>
                <p className="text-xs text-gray-600">Fichier ajouté</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeFile(name)}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <FiX className="text-red-600" size={20} />
            </button>
          </div>
        </div>
      )}

      {errors[name] && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <FiAlertCircle size={14} />
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <FiUser className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nouveau Livreur</h1>
              <p className="text-sm text-gray-600">Enregistrez un nouveau livreur</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser className="text-blue-600" size={20} />
              Informations personnelles
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom complet <span className="text-red-500">*</span>
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
                    placeholder="Ex: Jean Dupont"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none ${errors.nom ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
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
                    placeholder="Ex: +237 6 XX XX XX XX"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none ${errors.numero ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
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
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiFileText className="text-blue-600" size={20} />
              Documents requis
            </h2>

            <div className="space-y-4">
              <FileUploadField
                label="Permis de conduire"
                name="permis"
                icon={FiCreditCard}
              />

              <FileUploadField
                label="Carte Nationale d'Identité (CNI)"
                name="cni"
                icon={FiCreditCard}
              />

              <FileUploadField
                label="Contrat de travail"
                name="contratTravail"
                icon={FiFileText}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
            <button
              onClick={handleSubmit}
              disabled={loading || success}
              className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${success
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-xl'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement en cours...
                </>
              ) : success ? (
                <>
                  <FiCheckCircle size={20} />
                  Livreur enregistré avec succès !
                </>
              ) : (
                <>
                  <FiUpload size={20} />
                  Enregistrer le livreur
                </>
              )}
            </button>

            {!success && (
              <p className="mt-3 text-xs text-center text-gray-500">
                Tous les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires
              </p>
            )}
          </div>

        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex gap-3">
            <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-blue-900">Information importante</p>
              <p className="text-xs text-blue-700 mt-1">
                Assurez-vous que tous les documents soumis sont valides et à jour.
                Les fichiers acceptés sont JPG, PNG et PDF avec une taille maximale de 5MB.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}