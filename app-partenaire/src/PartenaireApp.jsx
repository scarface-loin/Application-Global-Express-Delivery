import React, { useState } from 'react';
// Ajoutez FiRefreshCw aux imports
import { FiBriefcase, FiLogOut, FiPlus, FiPackage, FiTruck, FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from './hooks/useAuth';
import { useCommandes } from './hooks/useCommandes';
import CreateCommandeForm from './components/CreateCommandeForm';
import CommandeCard from './components/CommandeCard';
import CommandeModal from './components/CommandeModal';
import { formatCurrency } from './services/utils';

export default function PartenaireApp({ partenaireId, onLogout }) {
  const { partenaireInfo } = useAuth();
  
  // CORRECTION ICI : Changement de "true" à "false" pour arrêter l'actualisation automatique
  // On récupère aussi "refreshCommandes" pour le bouton manuel
  const { commandes, stats, loading, filters, updateFilters, refreshCommandes } = useCommandes(partenaireId, partenaireInfo?.nom, false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fonction pour gérer le clic sur le bouton actualiser
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshCommandes();
    setIsRefreshing(false);
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      
      {/* Header (inchangé) */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <FiBriefcase className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{partenaireInfo?.nom || 'Partenaire'}</h1>
                <p className="text-sm text-gray-600">{partenaireInfo?.type || ''}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <FiLogOut size={20} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Statistiques (inchangé) */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* ... (vos cartes de stats restent ici) ... */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiPackage className="text-purple-600" size={20} />
                </div>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FiClock className="text-orange-600" size={20} />
                </div>
                <p className="text-sm text-gray-600">En attente</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.enAttente}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiTruck className="text-blue-600" size={20} />
                </div>
                <p className="text-sm text-gray-600">En cours</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.enCours}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiCheckCircle className="text-green-600" size={20} />
                </div>
                <p className="text-sm text-gray-600">Livrées</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.livrees}</p>
            </div>
          </div>
        )}

        {/* Actions et filtres MODIFIÉS */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <FiPlus size={20} />
            Nouvelle commande
          </button>

          {/* AJOUT DU BOUTON ACTUALISER */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            title="Actualiser la liste"
          >
            <FiRefreshCw size={20} className={isRefreshing ? "animate-spin text-purple-600" : ""} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <select
            value={filters.statut}
            onChange={(e) => updateFilters({ statut: e.target.value })}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
          >
            <option value="tous">Tous les statuts</option>
            <option value="en_attente_attribution">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="livre">Livrées</option>
            <option value="non_livre">Non livrées</option>
          </select>

          {/* ... reste des filtres ... */}
           <select
            value={filters.type}
            onChange={(e) => updateFilters({ type: e.target.value })}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
          >
            <option value="tous">Tous les types</option>
            <option value="course">Courses</option>
            <option value="expedition">Expéditions</option>
          </select>

          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
          />
        </div>

        {/* ... Reste du code (Formulaire, Liste, Modal) inchangé ... */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle commande</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <CreateCommandeForm
              partenaireId={partenaireId}
              partenaireNom={partenaireInfo?.nom}
              onSuccess={() => {
                setShowCreateForm(false);
                // Le hook useCommandes gère déjà le rafraîchissement après création
                // via la fonction createCommande
              }}
            />
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Mes commandes ({commandes.length})
          </h2>

          {commandes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
               {/* ... contenu vide ... */}
               <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FiPackage size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune commande</h3>
              <p className="text-gray-600 mb-6">Créez votre première commande pour commencer</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700"
              >
                <FiPlus /> Créer une commande
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {commandes.map((commande) => (
                <CommandeCard
                  key={commande.id}
                  commande={commande}
                  onClick={() => setSelectedCommande(commande)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* ... Total ... */}
        {stats && stats.montantTotal > 0 && (
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Montant total des commandes</p>
                <p className="text-3xl font-bold text-purple-700">{formatCurrency(stats.montantTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Montant livré</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.montantLivre)}</p>
              </div>
            </div>
          </div>
        )}

      </div>
       {/* Modal de détails */}
      {selectedCommande && (
        <CommandeModal
          commande={selectedCommande}
          onClose={() => setSelectedCommande(null)}
        />
      )}
    </div>
  );
}