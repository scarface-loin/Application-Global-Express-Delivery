import React, { useState, useEffect } from 'react'; // Ajout de useEffect
import { 
  FiSearch, FiPackage, FiEye, FiTrash2, FiRefreshCw,
  FiX, FiAlertCircle, FiUser, FiCalendar
} from 'react-icons/fi';

// --- IMPORT DE LA LOGIQUE ---
import { fetchActiveDeliveries, deleteDeliveryFromFirebase } from './logic/DeliveriesPageLogic';

export default function DeliveriesPage() {
  // On commence avec une liste vide, on va la remplir via Firebase
  const [deliveries, setDeliveries] = useState([]); 
  
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });
  
  const [loading, setLoading] = useState(true); // Chargement activé par défaut
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState(null);

  // --- CHARGEMENT DES DONNÉES ---
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchActiveDeliveries();
      setDeliveries(data);
    } catch (error) {
      alert("Erreur de chargement: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- FILTRES (Reste inchangé) ---
  const filteredDeliveries = deliveries.filter(delivery => {
    if (filters.status && delivery.status !== filters.status) return false;
    if (filters.type && delivery.type !== filters.type) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        // On vérifie que les champs existent avant de faire toLowerCase()
        (delivery.id && delivery.id.toLowerCase().includes(search)) ||
        (delivery.trackingNumber && delivery.trackingNumber.toLowerCase().includes(search)) ||
        (delivery.quartier && delivery.quartier.toLowerCase().includes(search)) ||
        (delivery.deliveryManName && delivery.deliveryManName.toLowerCase().includes(search))
      );
    }
    return true;
  });

  // --- FORMATTERS (Restent inchangés) ---
  const formatAmount = (amount) => (amount || 0).toLocaleString() + ' FCFA';
  
  const formatDate = (dateString) => {
    if(!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const map = {
      'en_attente': 'En attente',
      'assigne': 'Assignée',
      'en_cours': 'En cours',
      'livre': 'Livrée',
      'annule': 'Annulée'
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    const map = {
      'en_attente': 'bg-yellow-100 text-yellow-800',
      'assigne': 'bg-purple-100 text-purple-800',
      'en_cours': 'bg-blue-100 text-blue-800',
      'livre': 'bg-green-100 text-green-800',
      'annule': 'bg-red-100 text-red-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateArticlesTotal = (articles) => {
    if (!articles) return 0;
    return articles.reduce((sum, article) => {
      return sum + (article.quantiteCommandee * article.coutUnitaire);
    }, 0);
  };

  // --- ACTIONS ---
  const handleRefresh = () => {
    loadData();
  };

  const handleDelete = (delivery) => {
    setDeliveryToDelete(delivery);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDeliveryFromFirebase(deliveryToDelete.id); // Suppression Firebase
      
      // Mise à jour locale pour éviter de recharger toute la page
      setDeliveries(deliveries.filter(d => d.id !== deliveryToDelete.id));
      
      setShowDeleteConfirm(false);
      setDeliveryToDelete(null);
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  const openDetailsModal = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  // ... LE RESTE DU RENDER (JSX) RESTE IDENTIQUE ...
  // Assure-toi juste que dans le JSX, tu utilises les bons noms de champs 
  // (ex: article.quantiteCommandee au lieu de article.quantite si c'est ce que la logique renvoie)

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              {filteredDeliveries.length} livraison{filteredDeliveries.length > 1 ? 's' : ''} en cours
            </p>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Actualiser"
            >
              <FiRefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {/* ... (Garder tes inputs de filtres ici) ... */}
           <div className="space-y-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Rechercher (ID, Quartier, Livreur)..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
             <div className="grid grid-cols-2 gap-2">
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="">Tous types</option>
                <option value="course">Course</option>
                <option value="expedition">Expédition</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="">Tous statuts</option>
                <option value="en_attente">En attente</option>
                <option value="assigne">Assignée</option>
                <option value="en_cours">En cours</option>
                <option value="livre">Livrée (Non validée)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
           <div className="text-center py-10">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
             <p className="mt-2 text-gray-500">Chargement des courses...</p>
           </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FiPackage className="mx-auto text-gray-400 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Aucune livraison en cours
            </h3>
            <p className="text-sm text-gray-600">
              Tout est validé ou aucune course n'a été créée.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                 {/* ... Le contenu de tes cartes reste identique, assure-toi juste d'utiliser les variables delivery.xxx ... */}
                 
                 <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      {/* En Firestore l'ID est long, on affiche le Tracking Number en gros */}
                      <h3 className="font-bold text-gray-900 text-base truncate">
                        {delivery.trackingNumber}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">ID: {delivery.id}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        delivery.type === 'course' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {delivery.type === 'course' ? '🏃' : '📦'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {getStatusText(delivery.status)}
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatAmount(delivery.total)}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Quartier */}
                  <div className="flex items-center gap-2 text-sm">
                    <FiPackage className="text-gray-400 flex-shrink-0" size={16} />
                    <span className="font-medium text-gray-900">{delivery.quartier}</span>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-xs">📞</span>
                    <span>{delivery.numeroDestinataire}</span>
                  </div>

                  {/* Livreur */}
                  {delivery.deliveryManName ? (
                    <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg">
                      <FiUser className="text-blue-600" size={14} />
                      <span className="text-blue-800 font-medium">{delivery.deliveryManName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm bg-yellow-50 px-3 py-2 rounded-lg">
                       <span className="text-yellow-800 font-medium text-xs">Non assigné</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FiCalendar size={12} />
                    <span>Créée le: {formatDate(delivery.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
                  <button
                    onClick={() => openDetailsModal(delivery)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <FiEye size={16} />
                    Détails
                  </button>
                  
                  {/* On ne peut supprimer que si ce n'est pas encore livré/validé */}
                  <button
                    onClick={() => handleDelete(delivery)}
                    className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* --- MODALES --- */}
        
        {/* Modal Détails */}
        {showDetailsModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
             {/* ... (Le contenu de ta modal reste le même, adapte juste les champs si besoin) ... */}
             <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                >
                  <FiX />
                </button>
                
                <h2 className="text-xl font-bold mb-4">Détails de la livraison</h2>
                
                <div className="space-y-4">
                   <div className="bg-gray-50 p-3 rounded-lg">
                     <p className="text-xs text-gray-500">Numéro de suivi</p>
                     <p className="font-bold">{selectedDelivery.trackingNumber}</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-medium capitalize">{selectedDelivery.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Statut</p>
                        <p className="font-medium capitalize">{getStatusText(selectedDelivery.status)}</p>
                      </div>
                   </div>

                   <div className="border-t pt-3">
                     <h3 className="font-bold mb-2">Articles</h3>
                     {selectedDelivery.articles.map((art, i) => (
                       <div key={i} className="flex justify-between text-sm py-1">
                          {/* Note: Dans la logique create, c'est quantiteCommandee */}
                          <span>{art.quantiteCommandee || art.quantite}x {art.nom}</span>
                          <span className="font-medium">{formatAmount((art.quantiteCommandee || art.quantite) * art.coutUnitaire)}</span>
                       </div>
                     ))}
                   </div>

                   <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-bold">Total à encaisser</span>
                      <span className="text-xl font-bold text-blue-600">{formatAmount(selectedDelivery.total)}</span>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Modal Confirmation Suppression */}
        {showDeleteConfirm && deliveryToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
               <FiAlertCircle className="text-red-500 mx-auto mb-4" size={40} />
               <h3 className="text-lg font-bold mb-2">Supprimer la livraison ?</h3>
               <p className="text-gray-600 text-sm mb-6">
                 Voulez-vous vraiment supprimer la livraison <b>{deliveryToDelete.trackingNumber}</b> ? 
                 Cette action est irréversible.
               </p>
               <div className="flex gap-3">
                 <button 
                   onClick={() => setShowDeleteConfirm(false)}
                   className="flex-1 py-2 bg-gray-100 rounded-lg font-medium"
                 >
                   Annuler
                 </button>
                 <button 
                   onClick={confirmDelete}
                   className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                 >
                   Supprimer
                 </button>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}