// src/components/pages/HistoryPage.jsx
import React, { useState } from 'react';
import { 
  FiSearch, 
  FiPackage, 
  FiEye, 
  FiFilter,
  FiX,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiSlash
} from 'react-icons/fi';

export default function HistoryPage() {
  // --- Données simulées (Historique = passées) ---
  const [deliveries] = useState([
    {
      id: 'DEL-002',
      type: 'expedition',
      quartier: 'Bonamoussadi',
      numeroDestinataire: '+237677777777',
      coutLivraison: 2000,
      articles: [{ nom: 'Documents', quantite: 1, cout: 0 }],
      total: 2000,
      trackingNumber: 'TRK-2026012501235',
      status: 'delivered', // Livré
      deliveryManName: 'Jean Dupont',
      createdAt: '2025-01-24T14:30:00.000Z', // Hier
      completedAt: '2025-01-24T16:45:00.000Z'
    },
    {
      id: 'DEL-005',
      type: 'course',
      quartier: 'Akwa',
      numeroDestinataire: '+237699887766',
      coutLivraison: 1500,
      articles: [
        { nom: 'Repas Traiteur', quantite: 3, cout: 2500 },
        { nom: 'Jus', quantite: 3, cout: 500 }
      ],
      total: 10500,
      trackingNumber: 'TRK-2026012309876',
      status: 'cancelled', // Annulé
      deliveryManName: null,
      createdAt: '2025-01-23T10:00:00.000Z', // Avant-hier
    },
    {
      id: 'DEL-008',
      type: 'course',
      quartier: 'Bali',
      numeroDestinataire: '+237655443322',
      coutLivraison: 1000,
      articles: [{ nom: 'Fleurs', quantite: 1, cout: 5000 }],
      total: 6000,
      trackingNumber: 'TRK-2026012005555',
      status: 'completed', // Terminé
      deliveryManName: 'Paul Atangana',
      createdAt: '2025-01-20T09:15:00.000Z',
      completedAt: '2025-01-20T10:30:00.000Z'
    }
  ]);

  // Dates par défaut (Du 1er du mois à aujourd'hui)
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    search: '',
    status: '', // Tous, delivered, cancelled
    startDate: startOfMonth,
    endDate: today,
  });

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // --- Fonctions Utilitaires (Identiques à DeliveriesPage pour cohérence) ---
  const formatAmount = (amount) => `${amount.toLocaleString()} FCFA`;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return { label: 'Livrée', color: 'bg-green-100 text-green-800', icon: <FiCheckCircle /> };
      case 'cancelled':
        return { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: <FiSlash /> };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: <FiPackage /> };
    }
  };

  const calculateArticlesTotal = (articles) => {
    return articles.reduce((sum, article) => sum + (article.quantite * article.cout), 0);
  };

  // --- Logique de Filtrage (Incluant les Dates) ---
  const filteredDeliveries = deliveries.filter(delivery => {
    // 1. Recherche texte
    const search = filters.search.toLowerCase();
    const matchesSearch = 
      delivery.id.toLowerCase().includes(search) ||
      delivery.trackingNumber.toLowerCase().includes(search) ||
      delivery.quartier.toLowerCase().includes(search) ||
      delivery.numeroDestinataire.includes(search);

    // 2. Statut
    const matchesStatus = filters.status ? delivery.status === filters.status : true;

    // 3. Dates (Comparaison simple YYYY-MM-DD)
    const deliveryDate = delivery.createdAt.split('T')[0];
    const matchesDate = deliveryDate >= filters.startDate && deliveryDate <= filters.endDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calcul du total encaissé sur la période affichée (statistiques rapides)
  const totalPeriodRevenue = filteredDeliveries
    .filter(d => d.status === 'delivered' || d.status === 'completed')
    .reduce((acc, curr) => acc + curr.total, 0);

  const openDetailsModal = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      
      {/* --- Zone Filtres et En-tête --- */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex flex-col gap-4">
          
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FiCalendar className="text-blue-600" />
              Historique des Courses
            </h2>
            <div className="bg-blue-50 px-4 py-2 rounded-lg text-right">
              <p className="text-xs text-gray-500 font-medium">Total Période</p>
              <p className="text-lg font-bold text-blue-700">{formatAmount(totalPeriodRevenue)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Recherche */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ID, Client, Quartier..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Statut */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="delivered">Livrées / Terminées</option>
              <option value="cancelled">Annulées</option>
            </select>

            {/* Date Début */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-white px-1">Du</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Date Fin */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-white px-1">Au</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Liste des Livraisons --- */}
      <div className="max-w-7xl mx-auto px-4">
        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm">
            <FiFilter className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-gray-500 font-medium">Aucun historique trouvé pour cette période.</h3>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredDeliveries.map((delivery) => {
              const statusInfo = getStatusInfo(delivery.status);
              
              return (
                <div key={delivery.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  
                  {/* Indicateur Visuel Type + Date */}
                  <div className="flex flex-row sm:flex-col items-center gap-2 min-w-[80px]">
                    <div className={`p-3 rounded-full ${delivery.type === 'course' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {statusInfo.icon}
                    </div>
                    <div className="text-xs text-gray-500 text-center hidden sm:block">
                      {new Date(delivery.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                    
                    {/* Colonne ID & Tracking */}
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{delivery.id}</h3>
                      <p className="text-xs text-gray-500 truncate">{delivery.trackingNumber}</p>
                      <p className="text-xs text-gray-400 mt-1 sm:hidden">
                         {formatDate(delivery.createdAt)}
                      </p>
                    </div>

                    {/* Colonne Lieu & Client */}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{delivery.quartier}</p>
                      <p className="text-xs text-gray-500">{delivery.numeroDestinataire}</p>
                    </div>

                    {/* Colonne Livreur */}
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-500">Livreur</p>
                      {delivery.deliveryManName ? (
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          <FiUser size={12} /> {delivery.deliveryManName}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>

                    {/* Colonne Statut & Montant */}
                    <div className="text-right">
                       <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} mb-1`}>
                        {statusInfo.label}
                      </span>
                      <p className="font-bold text-gray-900">
                        {delivery.status !== 'cancelled' ? formatAmount(delivery.total) : <span className="text-gray-400 line-through">{formatAmount(delivery.total)}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Bouton Action */}
                  <div className="w-full sm:w-auto mt-2 sm:mt-0">
                    <button 
                      onClick={() => openDetailsModal(delivery)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      <FiEye /> Détails
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Modal Détails (Identique à DeliveriesPage) --- */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Détails Historique</h2>
                <p className="text-xs text-gray-500">{selectedDelivery.id}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Statut Gros Plan */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                 <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Statut final</p>
                    <span className={`text-lg font-bold ${selectedDelivery.status === 'cancelled' ? 'text-red-600' : 'text-green-600'}`}>
                      {getStatusInfo(selectedDelivery.status).label.toUpperCase()}
                    </span>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-gray-500">Date de fin</p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedDelivery.completedAt ? formatDate(selectedDelivery.completedAt) : formatDate(selectedDelivery.createdAt)}
                    </p>
                 </div>
              </div>

              {/* Contenu Livraisons */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-xl">
                   <h3 className="font-semibold text-gray-900 mb-2">📍 Destination</h3>
                   <p className="text-sm">{selectedDelivery.quartier}</p>
                   <p className="text-sm text-gray-500">{selectedDelivery.numeroDestinataire}</p>
                </div>
                <div className="p-4 border rounded-xl">
                   <h3 className="font-semibold text-gray-900 mb-2">👤 Livreur</h3>
                   {selectedDelivery.deliveryManName ? (
                     <p className="text-sm font-medium flex items-center gap-2">
                       <FiUser className="text-blue-500" /> {selectedDelivery.deliveryManName}
                     </p>
                   ) : (
                     <p className="text-sm text-gray-400 italic">Non assigné</p>
                   )}
                </div>
              </div>

              {/* Articles List */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                  <FiPackage /> Contenu de la commande
                </h3>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                   {selectedDelivery.articles.map((art, idx) => (
                     <div key={idx} className="flex justify-between p-3 border-b border-gray-100 last:border-0 text-sm">
                       <span>{art.quantite}x {art.nom}</span>
                       <span className="font-medium text-gray-700">{formatAmount(art.cout * art.quantite)}</span>
                     </div>
                   ))}
                   <div className="p-3 bg-gray-100 flex justify-between font-bold text-sm">
                      <span>Coût Livraison</span>
                      <span>{formatAmount(selectedDelivery.coutLivraison)}</span>
                   </div>
                </div>
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-center pt-2 border-t-2 border-dashed border-gray-200">
                <span className="text-lg font-bold text-gray-700">Total payé</span>
                <span className="text-2xl font-bold text-blue-700">{formatAmount(selectedDelivery.total)}</span>
              </div>
            </div>

            <div className="border-t px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}