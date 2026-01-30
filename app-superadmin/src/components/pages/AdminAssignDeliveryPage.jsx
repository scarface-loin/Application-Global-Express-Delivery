import React, { useState, useEffect } from 'react';
import {
  FiPackage,
  FiTruck,
  FiUser,
  FiMapPin,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronRight,
  FiRefreshCw // Ajout de l'icône refresh
} from 'react-icons/fi';
import { fetchLivraisonsEnAttente, assignLivraisonToLivreur, fetchActiveLivreurs } from './logic/AdminAssignDeliveryLogic';

export default function AdminAssignDeliveryPage() {
  const [livraisons, setLivraisons] = useState([]);
  const [livreurs, setLivreurs] = useState([]);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // État pour le bouton refresh
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const [livraisonsData, livreursData] = await Promise.all([
        fetchLivraisonsEnAttente(),
        fetchActiveLivreurs()
      ]);
      
      setLivraisons(livraisonsData);
      setLivreurs(livreursData);
      
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleAssign = async (livraisonId, livreurId, livreurNom) => {
    try {
      await assignLivraisonToLivreur(livraisonId, livreurId, livreurNom);
      
      // Mise à jour locale optimiste (supprime de la liste sans recharger API)
      setLivraisons(prev => prev.filter(l => l.id !== livraisonId));
      setSelectedLivraison(null);
      
      // Feedback utilisateur
      setSuccessMessage(`Livraison attribuée à ${livreurNom} avec succès !`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error("Erreur d'attribution:", err);
      alert("Erreur lors de l'attribution : " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des commandes partenaires...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <FiTruck className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attribution Partenaires</h1>
              <p className="text-sm text-gray-600">Commandes issues de "livraison_partenaire"</p>
            </div>
          </div>

          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {/* Messages Feedback */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <FiAlertCircle className="text-red-600" size={20} />
            <p className="text-sm text-red-900 font-semibold">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <FiCheckCircle className="text-green-600" size={20} />
            <p className="text-sm text-green-900 font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500">
            <p className="text-sm text-gray-600 mb-1">En attente d'attribution</p>
            <p className="text-3xl font-bold text-gray-900">{livraisons.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Livreurs disponibles</p>
            <p className="text-3xl font-bold text-gray-900">{livreurs.length}</p>
          </div>
        </div>

        {/* Liste des livraisons */}
        {livraisons.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FiCheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tout est à jour</h3>
            <p className="text-sm text-gray-600">Toutes les commandes partenaires ont été attribuées.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {livraisons.map((livraison) => (
              <div
                key={livraison.id}
                onClick={() => setSelectedLivraison(livraison)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer p-4 group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Info Gauche */}
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${livraison.type === 'course' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                      {livraison.type === 'course' ? <FiPackage size={24} /> : <FiTruck size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{livraison.partenaireNom}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 font-mono">{livraison.numeroSuivi}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiMapPin size={14} />
                          <span>
                            {livraison.type === 'course' 
                              ? `Vers: ${livraison.quartier}` 
                              : `Vers: ${livraison.villeDestination}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiClock size={14} />
                          <span>
                            {new Date(livraison.dateCreation).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Droite & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                     <div className="text-right">
                       <p className="text-xs text-gray-500 mb-1">{livraison.nbArticles} article(s)</p>
                       <p className="font-bold text-blue-600 text-lg">{livraison.total.toLocaleString()} FCFA</p>
                     </div>
                     <div className="bg-gray-50 p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                       <FiChevronRight className="text-gray-400 group-hover:text-blue-500" size={24} />
                     </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'attribution */}
      {selectedLivraison && (
        <AssignModal
          livraison={selectedLivraison}
          livreurs={livreurs}
          onAssign={handleAssign}
          onClose={() => setSelectedLivraison(null)}
        />
      )}
    </div>
  );
}

// Modal d'attribution (Sous-composant)
const AssignModal = ({ livraison, livreurs, onAssign, onClose }) => {
  const [selectedLivreur, setSelectedLivreur] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les livreurs
  const filteredLivreurs = livreurs.filter(l => 
    l.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selectedLivreur) return;
    setIsSubmitting(true);
    await onAssign(livraison.id, selectedLivreur.id, selectedLivreur.nom);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Attribuer la course</h2>
            <p className="text-sm text-gray-500 mt-1">Choisissez un livreur disponible</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <FiAlertCircle className="text-gray-500" size={24} transform="rotate(45)" /> {/* Croix simulée */}
          </button>
        </div>

        {/* Corps Modal */}
        <div className="p-6 overflow-y-auto">
          
          {/* Résumé Course */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-blue-900">{livraison.partenaireNom}</span>
              <span className="font-bold text-blue-700">{livraison.total.toLocaleString()} FCFA</span>
            </div>
            <div className="text-sm text-blue-800 flex gap-2 items-center">
              <FiMapPin size={14} />
              {livraison.type === 'course' ? livraison.quartier : livraison.villeDestination}
            </div>
          </div>

          {/* Recherche */}
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Rechercher un livreur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Liste Livreurs */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Livreurs disponibles ({filteredLivreurs.length})
            </p>
            
            {filteredLivreurs.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Aucun livreur trouvé.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {filteredLivreurs.map((livreur) => (
                  <button
                    key={livreur.id}
                    onClick={() => setSelectedLivreur(livreur)}
                    className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between group ${
                      selectedLivreur?.id === livreur.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                         selectedLivreur?.id === livreur.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {livreur.nom.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${selectedLivreur?.id === livreur.id ? 'text-blue-900' : 'text-gray-900'}`}>
                          {livreur.nom}
                        </p>
                        <p className="text-xs text-gray-500">{livreur.telephone}</p>
                      </div>
                    </div>
                    
                    {selectedLivreur?.id === livreur.id && (
                      <FiCheckCircle className="text-blue-600" size={20} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLivreur || isSubmitting}
            className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {isSubmitting ? 'Attribution...' : 'Confirmer'}
          </button>
        </div>

      </div>
    </div>
  );
};