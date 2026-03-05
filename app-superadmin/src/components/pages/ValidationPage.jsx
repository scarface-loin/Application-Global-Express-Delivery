import React, { useState, useEffect } from 'react';
import {
  FiCheckCircle,
  FiCalendar,
  FiPackage,
  FiChevronRight,
  FiAlertCircle,
  FiUser,
  FiRefreshCw
} from 'react-icons/fi';
import ValidationModal from './modal/ValidationModal';
import { fetchLivreursAValider, validerSessionLivreur, verifierArticlesSansStatut } from './logic/ValidationPageLogic';

export default function ValidationPage() {
  const [livreurs, setLivreurs] = useState([]);
  const [selectedLivreur, setSelectedLivreur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chargement des données
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLivreursAValider();
      setLivreurs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  // ... dans ValidationPage.jsx
  // Remplacez la fonction handleValidationSuccess

  const handleValidationSuccess = async (validationData) => {
    if (!selectedLivreur) return;

    // Vérification avant envoi : articles sans statut ?
    const problemes = verifierArticlesSansStatut(validationData.livraisons || []);
    if (problemes.length > 0) {
      const details = problemes.map(p =>
        `• Livraison ${p.tracking} (${p.quartier}) : ${p.articles.join(', ')}`
      ).join('\n');
      setError(`Articles sans statut — veuillez affecter livré / retourné / perdu :\n${details}`);
      return; // Ne ferme PAS le modal
    }

    try {
      await validerSessionLivreur({
        livreurId: selectedLivreur.id,
        livreurNom: selectedLivreur.nom,
        ...validationData
      });

      setLivreurs(prev => prev.filter(l => l.id !== selectedLivreur.id));
      setSelectedLivreur(null);
      setError(null);
    } catch (err) {
      setError(err.message); // Affiche dans le bandeau rouge existant
    }
  };
  // Helpers Affichage
  const formatAmount = (amount) => `${amount.toLocaleString()} FCFA`;
  const formatDate = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des retours livreurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* En-tête */}
        <div className="mb-6 flex justify-between items-start">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <FiCheckCircle className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Validation</h1>
              <p className="text-sm text-gray-600">Retour de tournée & Encaissement</p>
            </div>
          </div>
          <button onClick={loadData} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 text-indigo-600">
            <FiRefreshCw />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 font-medium">
          <FiCalendar size={16} />
          <span className="capitalize">{formatDate()}</span>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-4 flex items-center gap-2 border border-red-200">
            <FiAlertCircle /> {error}
          </div>
        )}

        {/* Liste des livreurs */}
        {livreurs.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-gray-200">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tout est à jour !</h3>
            <p className="text-gray-500 text-sm mt-1">Aucun livreur en attente de validation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {livreurs.map((livreur) => (
              <div
                key={livreur.id}
                onClick={() => setSelectedLivreur(livreur)}
                className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 hover:border-blue-400 hover:shadow-md active:scale-[0.98] cursor-pointer transition-all"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                        {livreur.nom.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{livreur.nom}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                          En attente de clôture
                        </p>
                      </div>
                    </div>
                    <FiChevronRight className="text-blue-500" size={24} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <FiPackage className="text-gray-500" size={16} />
                        <span className="text-xs text-gray-600 font-bold uppercase">Colis Total</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800">{livreur.nbLivraisons}</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <div className="flex items-center gap-2 mb-1">
                        <FiCheckCircle className="text-green-600" size={16} />
                        <span className="text-xs text-green-700 font-bold uppercase">À Encaisser</span>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {formatAmount(livreur.totalCollecte)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Validation */}
      {selectedLivreur && (
        <ValidationModal
          livreur={selectedLivreur}
          onClose={() => setSelectedLivreur(null)}
          onValidateSuccess={handleValidationSuccess}
        />
      )}
    </div>
  );
}