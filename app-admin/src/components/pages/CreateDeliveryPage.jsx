import React, { useState, useEffect } from 'react'; // Ajout de useEffect
import { FiPlus, FiTrash2, FiCheck, FiUser } from 'react-icons/fi';
// Import de la nouvelle fonction fetchActiveLivreurs
import { createDeliveryInFirebase, fetchActiveLivreurs } from './logic/CreateDeliveryPageLogic';

export default function CreateDeliveryPage() {
  const [deliveryType, setDeliveryType] = useState('course');
  
  // Modification du formData pour stocker ID et Nom séparément
  const [formData, setFormData] = useState({
    livreurId: '',   // ID technique
    livreurNom: '',  // Nom pour affichage
    // Pour Course
    quartier: '',
    numeroDestinataire: '',
    coutLivraison: '',
    // Pour Expédition
    nomClient: '',
    contactClient: '',
    villeDestination: '',
    coutExpedition: '1000',
  });

  const [articles, setArticles] = useState([
    { id: 1, nom: '', quantite: '', cout: '' }
  ]);
  const [loading, setLoading] = useState(false);
  
  // État pour stocker la liste des livreurs venant de Firebase
  const [livreurs, setLivreurs] = useState([]);

  // --- NOUVEAU : Chargement des livreurs au montage du composant ---
  useEffect(() => {
    const loadLivreurs = async () => {
      const data = await fetchActiveLivreurs();
      setLivreurs(data);
    };
    loadLivreurs();
  }, []);

  // --- NOUVEAU : Gestionnaire de changement de livreur ---
  const handleLivreurChange = (e) => {
    const selectedId = e.target.value;
    // On trouve le livreur complet dans la liste pour récupérer son nom
    const selectedLivreur = livreurs.find(l => l.id === selectedId);
    
    setFormData({ 
      ...formData, 
      livreurId: selectedId,
      livreurNom: selectedLivreur ? selectedLivreur.nom : '' 
    });
  };

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
    if (deliveryType === 'course') {
      const livraisonCout = parseFloat(formData.coutLivraison) || 0;
      return articlesTotal + livraisonCout;
    } else {
      const expeditionCout = parseFloat(formData.coutExpedition) || 0;
      return articlesTotal + expeditionCout;
    }
  };

  const isFormValid = () => {
    const hasLivreur = formData.livreurId; // Vérifie l'ID
    const hasValidArticles = articles.every(a => a.nom && a.quantite && a.cout);

    if (deliveryType === 'course') {
      const hasBasicInfo = formData.quartier && formData.numeroDestinataire && formData.coutLivraison;
      return hasLivreur && hasBasicInfo && hasValidArticles;
    } else {
      const hasExpeditionInfo = formData.nomClient && formData.contactClient && formData.villeDestination;
      return hasLivreur && hasExpeditionInfo && hasValidArticles;
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const result = await createDeliveryInFirebase(formData, articles, deliveryType);

      if (result.success) {
        alert(`✅ ${deliveryType === 'course' ? 'Course' : 'Expédition'} créée avec succès!\nNuméro de suivi: ${result.trackingNumber}`);

        // Reset du formulaire
        setFormData({
          livreurId: '',
          livreurNom: '',
          quartier: '',
          numeroDestinataire: '',
          coutLivraison: '',
          nomClient: '',
          contactClient: '',
          villeDestination: '',
          coutExpedition: '1000',
        });
        setArticles([{ id: Date.now(), nom: '', quantite: '', cout: '' }]);
      }
    } catch (error) {
      alert("❌ Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
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

          {/* Choix du livreur (Dynamique maintenant) */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiUser className="inline mr-1" />
              Livreur assigné *
            </label>
            <select
              value={formData.livreurId}
              onChange={handleLivreurChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base font-medium"
            >
              <option value="">Sélectionner un livreur</option>
              {livreurs.length === 0 && (
                 <option disabled>Chargement des livreurs...</option>
              )}
              {livreurs.map(livreur => (
                <option key={livreur.id} value={livreur.id}>
                  {livreur.nom}
                </option>
              ))}
            </select>
            {/* Petit lien pour ajouter un livreur si la liste est vide */}
            {livreurs.length === 0 && !loading && (
               <p className="text-xs text-orange-500 mt-2">
                 Aucun livreur actif trouvé. Veuillez en créer un d'abord.
               </p>
            )}
          </div>

          {/* Informations selon le type (Reste inchangé) */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            {/* ... Le reste du formulaire (Champs texte) reste identique ... */}
            {/* Copie le bloc "Informations selon le type" de ton fichier original ici */}
             <h2 className="text-base font-bold text-gray-800 mb-3">
              📍 {deliveryType === 'course' ? 'Informations de livraison' : 'Informations client'}
            </h2>

            <div className="space-y-3">
              {deliveryType === 'course' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Quartier *
                    </label>
                    <input
                      type="text"
                      value={formData.quartier}
                      onChange={(e) => setFormData({ ...formData, quartier: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, numeroDestinataire: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, coutLivraison: e.target.value })}
                      placeholder="1000"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Nom du client *
                    </label>
                    <input
                      type="text"
                      value={formData.nomClient}
                      onChange={(e) => setFormData({ ...formData, nomClient: e.target.value })}
                      placeholder="Ex: Marie Dupont"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Contact *
                    </label>
                    <input
                      type="tel"
                      value={formData.contactClient}
                      onChange={(e) => setFormData({ ...formData, contactClient: e.target.value })}
                      placeholder="+237 6XX XXX XXX"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Ville de destination *
                    </label>
                    <input
                      type="text"
                      value={formData.villeDestination}
                      onChange={(e) => setFormData({ ...formData, villeDestination: e.target.value })}
                      placeholder="Ex: Yaoundé, Bafoussam..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Coût d'expédition (FCFA) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formData.coutExpedition}
                      onChange={(e) => setFormData({ ...formData, coutExpedition: e.target.value })}
                      placeholder="1000"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Articles (Reste inchangé) */}
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

            {/* Récapitulatif (Reste inchangé) */}
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total articles:</span>
                  <span className="font-semibold text-gray-900">
                    {calculateArticlesTotal().toLocaleString()} FCFA
                  </span>
                </div>
                {deliveryType === 'course' ? (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Livraison:</span>
                    <span className="font-semibold text-gray-900">
                      {(parseFloat(formData.coutLivraison) || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Expédition:</span>
                    <span className="font-semibold text-gray-900">
                      {(parseFloat(formData.coutExpedition) || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                )}
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
              <span className="font-bold">💡 Astuce:</span> Tous les champs marqués (*) sont obligatoires.
              Le total inclut les frais de {deliveryType === 'course' ? 'livraison' : 'expédition'}.
            </p>
          </div>
        </div>

        {/* Bouton fixe en bas */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid()}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${loading || !isFormValid()
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
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${isFormValid()
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
                }`}>
                <div className={`h-2 w-2 rounded-full ${isFormValid() ? 'bg-green-500' : 'bg-yellow-500'
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