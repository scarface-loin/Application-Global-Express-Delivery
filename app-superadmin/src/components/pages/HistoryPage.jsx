import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiPackage, FiEye, FiFilter, FiX, FiUser, 
  FiCalendar, FiCheckCircle, FiSlash, FiDownload, FiAlertTriangle 
} from 'react-icons/fi';
import { fetchHistory, generatePDFReport } from './logic/HistoryPageLogic';

export default function HistoryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // --- CORRECTION: Logique de date pour éviter les problèmes de fuseau horaire ---
  // Cette fonction garantit que l'on obtient la date locale au format YYYY-MM-DD
  const getLocalDateString = (date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const now = new Date();
  const today = getLocalDateString(now);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonth = getLocalDateString(firstDayOfMonth);
  // --- FIN CORRECTION ---

  const [filters, setFilters] = useState({
    search: '',
    statut: '',
    startDate: startOfMonth, // Utilise la valeur corrigée
    endDate: today,          // Utilise la valeur corrigée
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

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      await generatePDFReport(filteredDeliveries, filters);
    } catch (err) {
      alert('Erreur lors de la génération du PDF: ' + err.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const formatAmount = (amount) => `${(amount || 0).toLocaleString()} FCFA`;
  
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
      case 'livre':
      case 'valide':
        return { label: 'Livrée / Validée', color: 'bg-green-100 text-green-800', icon: <FiCheckCircle /> };
      case 'cancelled':
      case 'non_livre':
      case 'annule':
        return { label: 'Échec / Annulée', color: 'bg-red-100 text-red-800', icon: <FiSlash /> };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: <FiPackage /> };
    }
  };

  const renderArticleStatus = (art) => {
    if (art.quantitePerdue > 0) {
      return (
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <FiAlertTriangle className="mr-1" /> PERDU ({art.quantitePerdue})
        </span>
      );
    }
    if (art.quantiteRetournee > 0) {
      return (
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
          <FiSlash className="mr-1" /> RETOURNÉ ({art.quantiteRetournee})
        </span>
      );
    }
    if (art.quantiteRejetee > 0) {
      return (
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800 border border-gray-300">
          REJETÉ ({art.quantiteRejetee})
        </span>
      );
    }
    if (art.quantiteLivree > 0) {
      const isPartial = art.quantiteLivree < art.quantiteCommandee;
      return (
        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isPartial ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'} border ${isPartial ? 'border-yellow-200' : 'border-green-200'}`}>
          <FiCheckCircle className="mr-1" /> {isPartial ? `LIVRÉ PARTIEL (${art.quantiteLivree})` : 'LIVRÉ'}
        </span>
      );
    }
    return <span className="ml-2 text-xs text-gray-400 italic">(Non livré)</span>;
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const search = filters.search.toLowerCase();
    const tNumber = delivery.trackingNumber || '';
    const quartier = delivery.quartier || '';
    const livreur = delivery.livreurNom || '';
    
    return (
      tNumber.toLowerCase().includes(search) ||
      quartier.toLowerCase().includes(search) ||
      livreur.toLowerCase().includes(search)
    );
  });

  const totalPeriodRevenue = filteredDeliveries
    .filter(d => d.statut === 'delivered' || d.statut === 'valide' || d.statut === 'livre')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      
      {/* --- Filtres --- */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FiCalendar className="text-blue-600" />
              Historique des Courses
            </h2>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 px-4 py-2 rounded-lg text-right hidden sm:block">
                <p className="text-xs text-gray-500 font-medium">Total Période</p>
                <p className="text-lg font-bold text-blue-700">{formatAmount(totalPeriodRevenue)}</p>
              </div>
              <button
                onClick={handleGeneratePDF}
                disabled={generatingPDF || filteredDeliveries.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                <FiDownload />
                {generatingPDF ? 'Génération...' : 'Rapport PDF'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"/>
            </div>
            <select value={filters.statut} onChange={(e) => setFilters({...filters, statut: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none bg-white">
              <option value="">Tous les statuts</option>
              <option value="delivered">Livrées / Validées</option>
              <option value="cancelled">Échecs / Annulées</option>
            </select>
            <div className="relative">
              <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            </div>
            <div className="relative">
              <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            </div>
          </div>
        </div>
      </div>

      {/* --- Liste --- */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="text-center py-10">Chargement...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm">
            <FiFilter className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-gray-500 font-medium">Aucun historique trouvé.</h3>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredDeliveries.map((delivery) => {
              const statusInfo = getStatusInfo(delivery.statut);
              
              return (
                <div key={delivery.id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md transition-shadow">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full items-center">
                    <div>
                      <p className="font-bold text-gray-900 text-sm truncate">{delivery.trackingNumber}</p>
                      <p className="text-xs text-gray-500">{delivery.quartier}</p>
                      <p className={`mt-1 text-xs font-bold ${delivery.origine === 'interne' ? 'text-blue-600' : 'text-purple-600'}`}>
                        {delivery.origine === 'interne' ? 'Interne' : 'Partenaire'}
                      </p>
                    </div>

                    <div className="hidden sm:block">
                      {delivery.livreurNom ? (
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          <FiUser size={12} /> {delivery.livreurNom}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                       <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} mb-1`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                      <p className="font-bold text-gray-900">
                        {formatAmount(delivery.total)}
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto mt-2 sm:mt-0">
                    <button onClick={() => setSelectedDelivery(delivery)} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                      <FiEye /> Détails
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Modal Détails --- */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Header Modal */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Détails de la course</h2>
                <p className="text-xs text-gray-500 font-mono mt-1">{selectedDelivery.trackingNumber}</p>
              </div>
              <button onClick={() => setSelectedDelivery(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <FiX size={24} />
              </button>
            </div>
            
            {/* Body Modal */}
            <div className="p-6 space-y-6">
              
              {/* Statut Global */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Statut final</p>
                    <div className={`flex items-center gap-2 text-lg font-bold ${getStatusInfo(selectedDelivery.statut).color.split(' ')[1]}`}>
                      {getStatusInfo(selectedDelivery.statut).icon}
                      {getStatusInfo(selectedDelivery.statut).label.toUpperCase()}
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Date de fin</p>
                    <p className="text-sm font-semibold text-gray-800">{formatDate(selectedDelivery.dateFin)}</p>
                 </div>
              </div>

              {/* Infos Destination */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-xl">
                   <h3 className="text-xs text-gray-500 uppercase font-bold mb-2">Destination</h3>
                   <p className="text-sm font-medium text-gray-900">{selectedDelivery.quartier}</p>
                </div>
                <div className="p-3 border rounded-xl">
                   <h3 className="text-xs text-gray-500 uppercase font-bold mb-2">Client</h3>
                   <p className="text-sm font-medium text-gray-900">{selectedDelivery.numeroDestinataire || 'N/A'}</p>
                </div>
              </div>

              {/* Liste des Articles */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FiPackage /> Contenu & Statut
                </h3>
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                   {selectedDelivery.articles.map((art, idx) => (
                     <div key={idx} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-gray-50 transition-colors">
                       <div className="flex-1">
                         <div className="flex items-center flex-wrap gap-1">
                            <span className="font-bold text-gray-900 mr-1">{art.quantiteCommandee}x</span>
                            <span className="text-sm text-gray-700 mr-2">{art.nom}</span>
                            {renderArticleStatus(art)}
                         </div>
                       </div>
                       <div className="text-right min-w-[80px]">
                         <span className="text-sm font-medium text-gray-600">
                           {formatAmount(art.totalLignePrevu || (art.coutUnitaire * art.quantiteCommandee))}
                         </span>
                       </div>
                     </div>
                   ))}
                   
                   <div className="p-3 flex justify-between items-center bg-gray-50 text-sm">
                      <span className="text-gray-600">Coût Livraison</span>
                      <span className="font-medium">{formatAmount(selectedDelivery.coutLivraison)}</span>
                   </div>
                </div>
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-200">
                <span className="text-lg font-bold text-gray-800">Total Général</span>
                <span className="text-2xl font-bold text-blue-700">{formatAmount(selectedDelivery.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
