/**
 * 📝 COMPOSANT CreateCommandeForm - Formulaire de création (Optimisé Android)
 */

import React, { useState } from 'react';
import { 
  FiPackage, 
  FiTruck, 
  FiPlus, 
  FiX, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiUser, 
  FiPhone, 
  FiMapPin, 
  FiDollarSign,
  FiShoppingBag 
} from 'react-icons/fi';
import { useCommandes } from '../hooks/useCommandes';
import { validateCourseForm, validateExpeditionForm, formatCurrency } from '../services/utils';

export default function CreateCommandeForm({ partenaireId, partenaireNom, onSuccess }) {
  const { createCommande, loading: saving } = useCommandes(partenaireId, partenaireNom);
  
  const [deliveryType, setDeliveryType] = useState('course');
  const [formData, setFormData] = useState({
    quartier: '',
    numeroDestinataire: '',
    nomClient: '',
    contactClient: '',
    villeDestination: '',
    coutLivraison: '1000',
    coutExpedition: '5000',
    instructionsLivraison: '',
    modePaiement: 'cash'
  });
  
  const [articles, setArticles] = useState([{ nom: '', quantite: 1, cout: '' }]);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // --- HANDLERS ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleArticleChange = (index, field, value) => {
    const newArticles = [...articles];
    newArticles[index][field] = value;
    setArticles(newArticles);
    if (errors.articles) setErrors(prev => ({ ...prev, articles: null }));
  };

  const addArticle = () => {
    setArticles([...articles, { nom: '', quantite: 1, cout: '' }]);
  };

  const removeArticle = (index) => {
    if (articles.length > 1) {
      setArticles(articles.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    const totalArticles = articles.reduce((sum, art) => 
      sum + (parseFloat(art.quantite || 0) * parseFloat(art.cout || 0)), 0
    );
    const frais = parseFloat(
      deliveryType === 'course' ? formData.coutLivraison : formData.coutExpedition
    ) || 0;
    return { totalArticles, frais, totalGeneral: totalArticles + frais };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    const validation = deliveryType === 'course'
      ? validateCourseForm(formData, articles)
      : validateExpeditionForm(formData, articles);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      const result = await createCommande(formData, articles, deliveryType);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess(result);
        }, 2000);
      }
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  // --- RENDER ---

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-5 shadow-lg">
          <FiCheckCircle size={48} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Commande Créée !</h3>
        <p className="text-gray-600 text-base">Votre demande a été transmise avec succès.</p>
        <div className="mt-8 w-full bg-gray-200 h-2.5 rounded-full overflow-hidden max-w-xs">
          <div className="h-full bg-green-500 animate-progress"></div>
        </div>
      </div>
    );
  }

  const totaux = calculateTotal();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      
      {/* 1. SÉLECTEUR DE TYPE - Boutons tactiles agrandis */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setDeliveryType('course')}
          className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all text-base touch-manipulation ${
            deliveryType === 'course'
              ? 'bg-white text-purple-700 shadow-md ring-2 ring-purple-100'
              : 'text-gray-500 hover:text-gray-700 active:bg-gray-50'
          }`}
        >
          <FiPackage size={22} /> Course Locale
        </button>
        <button
          type="button"
          onClick={() => setDeliveryType('expedition')}
          className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all text-base touch-manipulation ${
            deliveryType === 'expedition'
              ? 'bg-white text-blue-700 shadow-md ring-2 ring-blue-100'
              : 'text-gray-500 hover:text-gray-700 active:bg-gray-50'
          }`}
        >
          <FiTruck size={22} /> Expédition
        </button>
      </div>

      {errors.general && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
          <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
          <p className="text-red-800 font-medium text-base">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLONNE GAUCHE : INFOS LIVRAISON */}
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3 border-b-2 border-gray-200 pb-3">
            <span className={`p-2 rounded-xl ${deliveryType === 'course' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
              <FiMapPin size={20} />
            </span>
            Détails Livraison
          </h3>

          {deliveryType === 'course' ? (
            // CHAMPS COURSE
            <div className="space-y-5">
              <InputGroup 
                label="Nom du client (Optionnel)" 
                icon={<FiUser size={20} />} 
                name="nomClient" 
                value={formData.nomClient} 
                onChange={handleInputChange} 
                placeholder="Ex: Client Pressé"
              />
              <InputGroup 
                label="Quartier de livraison" 
                icon={<FiMapPin size={20} />} 
                name="quartier" 
                value={formData.quartier} 
                onChange={handleInputChange} 
                placeholder="Ex: Bonapriso"
                error={errors.quartier}
                required
              />
              <InputGroup 
                label="Téléphone du destinataire" 
                icon={<FiPhone size={20} />} 
                name="numeroDestinataire" 
                value={formData.numeroDestinataire} 
                onChange={handleInputChange} 
                placeholder="6XX XXX XXX"
                error={errors.numeroDestinataire}
                required
                type="tel"
              />
              <InputGroup 
                label="Coût de la livraison (FCFA)" 
                icon={<FiDollarSign size={20} />} 
                name="coutLivraison" 
                value={formData.coutLivraison} 
                onChange={handleInputChange} 
                error={errors.coutLivraison}
                type="number"
              />
            </div>
          ) : (
            // CHAMPS EXPEDITION
            <div className="space-y-5">
              <InputGroup 
                label="Nom du client" 
                icon={<FiUser size={20} />} 
                name="nomClient" 
                value={formData.nomClient} 
                onChange={handleInputChange} 
                error={errors.nomClient}
                required
              />
              <InputGroup 
                label="Ville de destination" 
                icon={<FiMapPin size={20} />} 
                name="villeDestination" 
                value={formData.villeDestination} 
                onChange={handleInputChange} 
                placeholder="Ex: Yaoundé"
                error={errors.villeDestination}
                required
              />
              <InputGroup 
                label="Contact client" 
                icon={<FiPhone size={20} />} 
                name="contactClient" 
                value={formData.contactClient} 
                onChange={handleInputChange} 
                placeholder="6XX XXX XXX"
                error={errors.contactClient}
                required
                type="tel"
              />
              <InputGroup 
                label="Coût de l'expédition (FCFA)" 
                icon={<FiDollarSign size={20} />} 
                name="coutExpedition" 
                value={formData.coutExpedition} 
                onChange={handleInputChange} 
                error={errors.coutExpedition}
                type="number"
              />
            </div>
          )}
        </div>

        {/* COLONNE DROITE : ARTICLES */}
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3 border-b-2 border-gray-200 pb-3">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <FiShoppingBag size={20} />
            </span>
            Articles à livrer
          </h3>

          <div className="space-y-3">
            {articles.map((article, index) => (
              <div key={index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-2xl border-2 border-gray-200">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    placeholder="Nom de l'article"
                    value={article.nom}
                    onChange={(e) => handleArticleChange(index, 'nom', e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none touch-manipulation"
                  />
                  <div className="flex gap-3">
                    <div className="w-1/3">
                      <input
                        type="number"
                        placeholder="Qté"
                        min="1"
                        value={article.quantite}
                        onChange={(e) => handleArticleChange(index, 'quantite', e.target.value)}
                        className="w-full px-3 py-3.5 bg-white border-2 border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none touch-manipulation"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        placeholder="Prix Unit."
                        min="0"
                        value={article.cout}
                        onChange={(e) => handleArticleChange(index, 'cout', e.target.value)}
                        className="w-full pl-4 pr-12 py-3.5 bg-white border-2 border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none touch-manipulation"
                      />
                      <span className="absolute right-4 top-3.5 text-sm text-gray-400 font-medium">FCFA</span>
                    </div>
                  </div>
                </div>
                
                {articles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArticle(index)}
                    className="p-3 text-red-400 hover:text-red-600 active:bg-red-50 rounded-xl transition-colors mt-1 touch-manipulation"
                  >
                    <FiX size={22} />
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addArticle}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-purple-400 hover:text-purple-600 active:bg-purple-50 transition-all text-base font-bold flex items-center justify-center gap-2 touch-manipulation"
            >
              <FiPlus size={20} /> Ajouter un article
            </button>
            {errors.articles && <p className="text-sm text-red-500 text-center font-medium">{errors.articles}</p>}
          </div>

          {/* Résumé Financier - Card agrandi pour mobile */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="space-y-3 text-base text-gray-300 border-b border-gray-700 pb-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Articles ({articles.length})</span>
                <span className="font-bold">{formatCurrency(totaux.totalArticles)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Frais de livraison</span>
                <span className="font-bold">{formatCurrency(totaux.frais)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">Total à encaisser</span>
              <span className="font-bold text-3xl text-green-400">{formatCurrency(totaux.totalGeneral)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* BOUTON SUBMIT - Hauteur tactile optimale */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={saving}
          className={`w-full py-5 rounded-2xl font-bold text-white text-lg shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 touch-manipulation ${
            deliveryType === 'course' 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
          } disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Traitement en cours...
            </>
          ) : (
            <>
              {deliveryType === 'course' ? <FiPackage size={26} /> : <FiTruck size={26} />}
              Confirmer la commande
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .touch-manipulation {
          touch-action: manipulation;
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </form>
  );
}

// Composant Helper pour les Inputs - Optimisé tactile
const InputGroup = ({ label, icon, error, ...props }) => (
  <div>
    <label className="block text-base font-bold text-gray-700 mb-2 ml-1">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
      <input
        className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl text-gray-900 text-base placeholder-gray-400 outline-none transition-all touch-manipulation ${
          error 
            ? 'border-red-300 focus:border-red-500 bg-red-50' 
            : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'
        }`}
        {...props}
      />
    </div>
    {error && <p className="text-sm text-red-500 mt-2 ml-1 font-medium">{error}</p>}
  </div>
);