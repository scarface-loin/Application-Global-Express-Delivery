import React, { useState, useEffect } from 'react';
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
import { fetchHistory } from './logic/HistoryPageLogic';

export default function HistoryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    search: '',
    statut: '',
    startDate: startOfMonth,
    endDate: today,
  });

  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchHistory({
          startDate: filters.startDate,
          endDate: filters.endDate,
          statut: filters.statut,
        });
        setDeliveries(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filters.startDate, filters.endDate, filters.statut]);

  const formatAmount = (amount) => `${amount.toLocaleString()} FCFA`;
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'delivered':
        return { label: 'Livrée', color: 'bg-green-100 text-green-800', icon: <FiCheckCircle /> };
      case 'cancelled':
        return { label: 'Échec/Annulée', color: 'bg-red-100 text-red-800', icon: <FiSlash /> };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: <FiPackage /> };
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const search = filters.search.toLowerCase();
    return (
      delivery.trackingNumber.toLowerCase().includes(search) ||
      delivery.quartier.toLowerCase().includes(search) ||
      (delivery.livreurNom && delivery.livreurNom.toLowerCase().includes(search))
    );
  });

  const totalPeriodRevenue = filteredDeliveries
    .filter(d => d.statut === 'delivered')
    .reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      
      {/* --- Zone Filtres (Inchangée) --- */}
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
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"/>
            </div>
            <select value={filters.statut} onChange={(e) => setFilters({...filters, statut: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none bg-white">
              <option value="">Tous les statuts</option>
              <option value="delivered">Livrées</option>
              <option value="cancelled">Échecs / Annulées</option>
            </select>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-white px-1">Du</span>
              <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-white px-1">Au</span>
              <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="text-center py-10">Chargement...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm">
            <FiFilter className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-gray-500 font-medium">Aucun historique trouvé pour cette période.</h3>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredDeliveries.map((delivery) => {
              const statusInfo = getStatusInfo(delivery.statut);
              
              return (
                <div key={delivery.id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  
                  {/* --- SECTION CORRIGÉE --- */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full items-center">
                    
                    {/* Colonne 1: Numéro et Quartier */}
                    <div>
                      <p className="font-bold text-gray-900 text-sm truncate">{delivery.trackingNumber}</p>
                      <p className="text-xs text-gray-500">{delivery.quartier}</p>
                      <p className={`mt-1 text-xs font-bold ${delivery.origine === 'interne' ? 'text-blue-600' : 'text-purple-600'}`}>
                        {delivery.origine === 'interne' ? 'Interne' : 'Partenaire'}
                      </p>
                    </div>

                    {/* Colonne 2: Livreur */}
                    <div className="hidden sm:block">
                      {delivery.livreurNom ? (
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          <FiUser size={12} /> {delivery.livreurNom}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>

                    {/* Colonne 3: Statut & Montant */}
                    <div className="text-left sm:text-right">
                       <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} mb-1`}>
                        {statusInfo.label}
                      </span>
                      <p className="font-bold text-gray-900">
                        {formatAmount(delivery.total)}
                      </p>
                    </div>
                  </div>
                  {/* --- FIN SECTION CORRIGÉE --- */}


                  {/* Bouton Action (Inchangé) */}
                  <div className="w-full sm:w-auto mt-2 sm:mt-0">
                    <button onClick={() => setSelectedDelivery(delivery)} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium">
                      <FiEye /> Détails
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Modal Détails (Inchangé) --- */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* ... Le contenu de la modale reste le même pour afficher tous les détails ... */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Détails Historique</h2>
                <p className="text-xs text-gray-500">{selectedDelivery.trackingNumber}</p>
              </div>
              <button onClick={() => setSelectedDelivery(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Statut final</p>
                    <span className={`text-lg font-bold ${selectedDelivery.statut === 'cancelled' ? 'text-red-600' : 'text-green-600'}`}>
                      {getStatusInfo(selectedDelivery.statut).label.toUpperCase()}
                    </span>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-gray-500">Date de fin</p>
                    <p className="text-sm font-medium text-gray-800">{formatDate(selectedDelivery.dateFin)}</p>
                 </div>
              </div>
              <div className="p-4 border rounded-xl">
                 <h3 className="font-semibold text-gray-900 mb-2">📍 Destination</h3>
                 <p className="text-sm">{selectedDelivery.quartier}</p>
                 <p className="text-sm text-gray-500">{selectedDelivery.numeroDestinataire}</p>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2">Contenu</h3>
                <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                   {selectedDelivery.articles.map((art, idx) => (
                     <div key={idx} className="flex justify-between">
                       <span>{art.quantiteCommandee || art.quantite}x {art.nom}</span>
                     </div>
                   ))}
                   <div className="pt-2 border-t flex justify-between font-bold">
                      <span>Coût Livraison</span>
                      <span>{formatAmount(selectedDelivery.coutLivraison)}</span>
                   </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-dashed">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-blue-700">{formatAmount(selectedDelivery.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}