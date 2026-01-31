import React, { useState } from 'react';
import { FiBriefcase, FiLogOut, FiPlus, FiPackage, FiTruck, FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from './hooks/useAuth';
import { useCommandes } from './hooks/useCommandes';
import CreateCommandeForm from './components/CreateCommandeForm';
import CommandeCard from './components/CommandeCard';
import CommandeModal from './components/CommandeModal';
import { formatCurrency } from './services/utils';

export default function PartenaireApp({ partenaireId, onLogout }) {
  const { partenaireInfo } = useAuth();
  const { commandes, stats, loading, filters, updateFilters, refreshCommandes } = useCommandes(partenaireId, partenaireInfo?.nom, false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshCommandes();
    setIsRefreshing(false);
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-b-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-base font-medium">Chargement de vos commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-6">
      
      {/* Header - Optimisé pour mobile */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-md">
                <FiBriefcase className="text-white" size={26} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                  {partenaireInfo?.nom || 'Partenaire'}
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">{partenaireInfo?.type || ''}</p>
              </div>
            </div>
            {/* Bouton déconnexion agrandi pour tactile */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors touch-manipulation"
            >
              <FiLogOut size={22} />
              <span className="hidden sm:inline font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 max-w-7xl mx-auto">
        
        {/* Statistiques - Grid responsive pour mobile */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2.5 bg-purple-100 rounded-xl">
                  <FiPackage className="text-purple-600" size={22} />
                </div>
                <p className="text-sm text-gray-600 font-medium">Total</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2.5 bg-orange-100 rounded-xl">
                  <FiClock className="text-orange-600" size={22} />
                </div>
                <p className="text-sm text-gray-600 font-medium">En attente</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.enAttente}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <FiTruck className="text-blue-600" size={22} />
                </div>
                <p className="text-sm text-gray-600 font-medium">En cours</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.enCours}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2.5 bg-green-100 rounded-xl">
                  <FiCheckCircle className="text-green-600" size={22} />
                </div>
                <p className="text-sm text-gray-600 font-medium">Livrées</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.livrees}</p>
            </div>
          </div>
        )}

        {/* Actions - Boutons optimisés pour tactile */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-5 py-4 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl active:shadow-md transition-all touch-manipulation"
            >
              <FiPlus size={22} />
              <span>Nouvelle commande</span>
            </button>

            {/* Bouton actualiser */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 px-5 py-4 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all disabled:opacity-50 touch-manipulation shadow-md"
              title="Actualiser la liste"
            >
              <FiRefreshCw size={22} className={isRefreshing ? "animate-spin text-purple-600" : ""} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>

          {/* Filtres - Sélecteurs agrandis pour mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={filters.statut}
              onChange={(e) => updateFilters({ statut: e.target.value })}
              className="px-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white font-medium shadow-sm appearance-none touch-manipulation"
            >
              <option value="tous">Tous les statuts</option>
              <option value="en_attente_attribution">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="livre">Livrées</option>
              <option value="non_livre">Non livrées</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => updateFilters({ type: e.target.value })}
              className="px-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white font-medium shadow-sm appearance-none touch-manipulation"
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
              className="px-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white font-medium shadow-sm touch-manipulation"
            />
          </div>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl mb-6 border-2 border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle commande</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-manipulation"
                aria-label="Fermer"
              >
                <span className="text-2xl text-gray-500">✕</span>
              </button>
            </div>
            <CreateCommandeForm
              partenaireId={partenaireId}
              partenaireNom={partenaireInfo?.nom}
              onSuccess={() => {
                setShowCreateForm(false);
              }}
            />
          </div>
        )}

        {/* Liste des commandes */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Mes commandes ({commandes.length})
          </h2>

          {commandes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-md border-2 border-gray-100">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-50 rounded-full mb-5">
                <FiPackage size={40} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Aucune commande</h3>
              <p className="text-gray-600 mb-6 text-base">Créez votre première commande pour commencer</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4 rounded-2xl font-bold hover:shadow-lg transition-all touch-manipulation"
              >
                <FiPlus size={22} /> Créer une commande
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        
        {/* Totaux */}
        {stats && stats.montantTotal > 0 && (
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2 font-medium">Montant total des commandes</p>
                <p className="text-4xl font-bold text-purple-700">{formatCurrency(stats.montantTotal)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-600 mb-2 font-medium">Montant livré</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.montantLivre)}</p>
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

      <style jsx>{`
        .touch-manipulation {
          touch-action: manipulation;
        }
        select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.75rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
      `}</style>
    </div>
  );
}