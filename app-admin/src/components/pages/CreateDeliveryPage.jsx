import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiCheck, FiPackage } from 'react-icons/fi';

export default function CreateDeliveryPage() {
  const [deliveryType, setDeliveryType] = useState('course');
  const [formData, setFormData] = useState({
    quartier: '',
    numeroDestinataire: '',
    coutLivraison: '',
  });
  const [articles, setArticles] = useState([
    { id: 1, nom: '', quantite: '', cout: '' }
  ]);
  const [loading, setLoading] = useState(false);

  const addArticle = () => {
    setArticles([...articles, { 
      id: Date.now(), 
      nom: '', 
      quantite: '', 
      cout: '' 
    }]);
  };

  const removeArticle = (id) => {
    if (articles.length > 1) {
      setArticles(articles.filter(article => article.id !== id));
    }
  };

  const updateArticle = (id, field, value) => {
    setArticles(articles.map(article => 
      article.id === id ? { ...article, [field]: value } : article
    ));
  };

  const calculateArticlesTotal = () => {
    return articles.reduce((sum, article) => {
      const quantite = parseFloat(article.quantite) || 0;
      const cout = parseFloat(article.cout) || 0;
      return sum + (quantite * cout);
    }, 0);
  };

  const calculateGrandTotal = () => {
    const articlesTotal = calculateArticlesTotal();
    const livraisonCout = parseFloat(formData.coutLivraison) || 0;
    return articlesTotal + livraisonCout;
  };

  const isFormValid = () => {
    const hasBasicInfo = formData.quartier && formData.numeroDestinataire && formData.coutLivraison;
    const hasValidArticles = articles.every(a => a.nom && a.quantite && a.cout);
    return hasBasicInfo && hasValidArticles;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      const delivery = {
        type: deliveryType,
        ...formData,
        articles: articles,
        total: calculateGrandTotal(),
        trackingNumber: `TRK-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      console.log('Livraison créée:', delivery);
      alert(`✅ ${deliveryType === 'course' ? 'Course' : 'Expédition'} créée avec succès!\nNuméro de suivi: ${delivery.trackingNumber}`);
      
      setFormData({ quartier: '', numeroDestinataire: '', coutLivraison: '' });
      setArticles([{ id: Date.now(), nom: '', quantite: '', cout: '' }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="space-y-4">
          {/* Type de service */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type de service *
            </label>
            <select
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base font-medium"
            >
              <option value="course">🏃 Course</option>
              <option value="expedition">📦 Expédition</option>
            </select>
            <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                {deliveryType === 'course' 
                  ? '💨 Livraison rapide en ville' 
                  : '🚚 Envoi vers une destination'}
              </p>
            </div>
          </div>

          {/* Informations de base */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-base font-bold text-gray-800 mb-3">📍 Informations</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Quartier *
                </label>
                <input
                  type="text"
                  value={formData.quartier}
                  onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                  placeholder="Ex: Bonapriso, Bonamoussadi..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Numéro du destinataire *
                </label>
                <input
                  type="tel"
                  value={formData.numeroDestinataire}
                  onChange={(e) => setFormData({...formData, numeroDestinataire: e.target.value})}
                  placeholder="+237 6XX XXX XXX"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Coût de livraison (FCFA) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.coutLivraison}
                  onChange={(e) => setFormData({...formData, coutLivraison: e.target.value})}
                  placeholder="1000"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-gray-800">🛍️ Articles ({articles.length})</h2>
              <button
                type="button"
                onClick={addArticle}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <FiPlus size={16} />
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {articles.map((article, index) => (
                <div key={article.id} className="border-2 border-gray-200 rounded-xl p-3 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-gray-700 text-sm">Article #{index + 1}</span>
                    {articles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArticle(article.id)}
                        className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={article.nom}
                        onChange={(e) => updateArticle(article.id, 'nom', e.target.value)}
                        placeholder="Ex: Pizza, Document..."
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantité *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={article.quantite}
                          onChange={(e) => updateArticle(article.id, 'quantite', e.target.value)}
                          placeholder="1"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Prix (FCFA) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={article.cout}
                          onChange={(e) => updateArticle(article.id, 'cout', e.target.value)}
                          placeholder="2000"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {article.nom && article.quantite && article.cout && (
                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      Sous-total: <span className="font-bold text-blue-700">
                        {(parseFloat(article.quantite) * parseFloat(article.cout)).toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Récapitulatif */}
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total articles:</span>
                  <span className="font-semibold text-gray-900">
                    {calculateArticlesTotal().toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Livraison:</span>
                  <span className="font-semibold text-gray-900">
                    {(parseFloat(formData.coutLivraison) || 0).toLocaleString()} FCFA
                  </span>
                </div>
                <div className="pt-2 border-t-2 border-blue-300 flex justify-between items-center">
                  <span className="font-bold text-gray-800">TOTAL:</span>
                  <span className="font-bold text-xl text-blue-700">
                    {calculateGrandTotal().toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Aide */}
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
            <p className="text-xs text-blue-800">
              <span className="font-bold">💡 Astuce:</span> Tous les champs marqués (*) sont obligatoires. Le total est calculé automatiquement.
            </p>
          </div>
        </div>

        {/* Bouton fixe en bas */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid()}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                loading || !isFormValid()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Création en cours...
                </>
              ) : (
                <>
                  <FiCheck size={20} />
                  Créer la {deliveryType === 'course' ? 'course' : 'expédition'}
                </>
              )}
            </button>

            <div className="mt-2 text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                isFormValid() 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  isFormValid() ? 'bg-green-500' : 'bg-yellow-500'
                } animate-pulse`}></div>
                {isFormValid() ? 'Prêt à envoyer' : 'Complétez tous les champs (*)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}