
/**
 * 📝 COMPOSANT CreateCommandeForm - Formulaire de création (Design Amélioré)
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
    nomClient: '',        // Utilisé pour course et expédition
    contactClient: '',    // Utilisé pour expédition
    villeDestination: '', // Utilisé pour expédition
    coutLivraison: '1000',
    coutExpedition: '5000',
    instructionsLivraison: '',
    modePaiement: 'cash'
  });
  
  // Articles par défaut vide pour forcer l'ajout conscient
  const [articles, setArticles] = useState([{ nom: '', quantite: 1, cout: '' }]);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // --- HANDLERS ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
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

    // Validation
    const validation = deliveryType === 'course'
      ? validateCourseForm(formData, articles)
      : validateExpeditionForm(formData, articles);

    if (!validation.isValid) {
      setErrors(validation.errors);
      // Scroll to top error ?
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
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <FiCheckCircle size={40} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Commande Créée !</h3>
        <p className="text-gray-600">Votre demande a été transmise avec succès.</p>
        <div className="mt-6 w-full bg-gray-100 h-2 rounded-full overflow-hidden max-w-xs">
          <div className="h-full bg-green-500 animate-progress"></div>
        </div>
      </div>
    );
  }

  const totaux = calculateTotal();

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      
      {/* 1. SÉLECTEUR DE TYPE */}
      <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          onClick={() => setDeliveryType('course')}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
            deliveryType === 'course'
              ? 'bg-white text-purple-700 shadow-md ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiPackage size={20} /> Course Locale
        </button>
        <button
          type="button"
          onClick={() => setDeliveryType('expedition')}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
            deliveryType === 'expedition'
              ? 'bg-white text-blue-700 shadow-md ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiTruck size={20} /> Expédition
        </button>
      </div>

      {errors.general && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center gap-3">
          <FiAlertCircle className="text-red-600" size={24} />
          <p className="text-red-800 font-medium">{errors.general}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* COLONNE GAUCHE : INFOS LIVRAISON */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <span className={`p-1.5 rounded-lg ${deliveryType === 'course' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
              <FiMapPin />
            </span>
            Détails Livraison
          </h3>

          {deliveryType === 'course' ? (
            // CHAMPS COURSE
            <div className="space-y-4">
              <InputGroup 
                label="Nom du client (Optionnel)" 
                icon={<FiUser />} 
                name="nomClient" 
                value={formData.nomClient} 
                onChange={handleInputChange} 
                placeholder="Ex: Client Pressé"
              />
              <InputGroup 
                label="Quartier de livraison" 
                icon={<FiMapPin />} 
                name="quartier" 
                value={formData.quartier} 
                onChange={handleInputChange} 
                placeholder="Ex: Bonapriso"
                error={errors.quartier}
                required
              />
              <InputGroup 
                label="Téléphone du destinataire" 
                icon={<FiPhone />} 
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
                icon={<FiDollarSign />} 
                name="coutLivraison" 
                value={formData.coutLivraison} 
                onChange={handleInputChange} 
                error={errors.coutLivraison}
                type="number"
              />
            </div>
          ) : (
            // CHAMPS EXPEDITION
            <div className="space-y-4">
              <InputGroup 
                label="Nom du client" 
                icon={<FiUser />} 
                name="nomClient" 
                value={formData.nomClient} 
                onChange={handleInputChange} 
                error={errors.nomClient}
                required
              />
              <InputGroup 
                label="Ville de destination" 
                icon={<FiMapPin />} 
                name="villeDestination" 
                value={formData.villeDestination} 
                onChange={handleInputChange} 
                placeholder="Ex: Yaoundé"
                error={errors.villeDestination}
                required
              />
              <InputGroup 
                label="Contact client" 
                icon={<FiPhone />} 
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
                icon={<FiDollarSign />} 
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
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
              <FiShoppingBag />
            </span>
            Articles à livrer
          </h3>

          <div className="space-y-3">
            {articles.map((article, index) => (
              <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Nom de l'article"
                    value={article.nom}
                    onChange={(e) => handleArticleChange(index, 'nom', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                  <div className="flex gap-2">
                    <div className="w-1/3">
                      <input
                        type="number"
                        placeholder="Qté"
                        min="1"
                        value={article.quantite}
                        onChange={(e) => handleArticleChange(index, 'quantite', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                      />
                    </div>
                    <div className="flex-1 relative">
                       <input
                        type="number"
                        placeholder="Prix Unit."
                        min="0"
                        value={article.cout}
                        onChange={(e) => handleArticleChange(index, 'cout', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-gray-400">FCFA</span>
                    </div>
                  </div>
                </div>
                
                {articles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArticle(index)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addArticle}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all text-sm font-semibold flex items-center justify-center gap-2"
            >
              <FiPlus /> Ajouter un article
            </button>
            {errors.articles && <p className="text-xs text-red-500 text-center">{errors.articles}</p>}
          </div>

          {/* Résumé Financier */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl mt-6">
            <div className="space-y-2 text-sm text-gray-300 border-b border-gray-700 pb-3 mb-3">
              <div className="flex justify-between">
                <span>Total Articles ({articles.length})</span>
                <span>{formatCurrency(totaux.totalArticles)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frais de livraison</span>
                <span>{formatCurrency(totaux.frais)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">Total à encaisser</span>
              <span className="font-bold text-2xl text-green-400">{formatCurrency(totaux.totalGeneral)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* BOUTON SUBMIT */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={saving}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-3 ${
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
              {deliveryType === 'course' ? <FiPackage size={24} /> : <FiTruck size={24} />}
              Confirmer la commande
            </>
          )}
        </button>
      </div>

    </form>
  );
}

// Composant Helper pour les Inputs
const InputGroup = ({ label, icon, error, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
      <input
        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all ${
          error 
            ? 'border-red-300 focus:border-red-500 bg-red-50' 
            : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'
        }`}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
  </div>
);