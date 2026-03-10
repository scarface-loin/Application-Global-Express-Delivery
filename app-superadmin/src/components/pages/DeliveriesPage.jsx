import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiPackage, FiEye, FiTrash2, FiRefreshCw,
  FiX, FiAlertCircle, FiUser, FiCalendar, FiEdit2, FiSave, FiPlus, FiMinus
} from 'react-icons/fi';

import { fetchActiveDeliveries, deleteDeliveryFromFirebase, updateDelivery } from './logic/DeliveriesPageLogic';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  
  const [filters, setFilters] = useState({ status: '', type: '', search: '' });
  
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState(null);

  // --- EDIT MODAL STATE ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { loadData(); }, []);

  const filteredDeliveries = deliveries.filter(delivery => {
    if (filters.status && delivery.status !== filters.status) return false;
    if (filters.type && delivery.type !== filters.type) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        (delivery.id && delivery.id.toLowerCase().includes(search)) ||
        (delivery.trackingNumber && delivery.trackingNumber.toLowerCase().includes(search)) ||
        (delivery.quartier && delivery.quartier.toLowerCase().includes(search)) ||
        (delivery.deliveryManName && delivery.deliveryManName.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const formatAmount = (amount) => (amount || 0).toLocaleString() + ' FCFA';
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const map = {
      'en_attente': 'En attente', 'assigne': 'Assignée',
      'en_cours': 'En cours', 'livre': 'Livrée', 'annule': 'Annulée'
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

  const recalculateTotal = (articles, coutLivraison) => {
    const articlesTotal = (articles || []).reduce((sum, art) => {
      return sum + ((art.quantiteCommandee || 0) * (art.coutUnitaire || 0));
    }, 0);
    return articlesTotal + (Number(coutLivraison) || 0);
  };

  // --- ACTIONS ---
  const handleRefresh = () => loadData();

  const handleDelete = (delivery) => {
    setDeliveryToDelete(delivery);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDeliveryFromFirebase(deliveryToDelete.id);
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

  // --- EDIT HANDLERS ---
  const openEditModal = (delivery) => {
    setEditingDelivery(delivery);
    setEditForm({
      quartier: delivery.quartier || '',
      numeroDestinataire: delivery.numeroDestinataire || '',
      coutLivraison: delivery.coutLivraison || 0,
      status: delivery.status || 'en_attente',
      articles: (delivery.articles || []).map(a => ({ ...a })),
    });
    setShowEditModal(true);
  };

  const handleEditField = (field, value) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      updated.total = recalculateTotal(updated.articles, updated.coutLivraison);
      return updated;
    });
  };

  const handleArticleChange = (index, field, value) => {
    setEditForm(prev => {
      const articles = prev.articles.map((art, i) =>
        i === index ? { ...art, [field]: field === 'nom' ? value : Number(value) } : art
      );
      return { ...prev, articles, total: recalculateTotal(articles, prev.coutLivraison) };
    });
  };

  const handleAddArticle = () => {
    setEditForm(prev => {
      const articles = [...prev.articles, { nom: '', quantiteCommandee: 1, coutUnitaire: 0 }];
      return { ...prev, articles, total: recalculateTotal(articles, prev.coutLivraison) };
    });
  };

  const handleRemoveArticle = (index) => {
    setEditForm(prev => {
      const articles = prev.articles.filter((_, i) => i !== index);
      return { ...prev, articles, total: recalculateTotal(articles, prev.coutLivraison) };
    });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const updatedData = {
        quartier: editForm.quartier,
        numeroDestinataire: editForm.numeroDestinataire,
        coutLivraison: Number(editForm.coutLivraison),
        status: editForm.status,
        articles: editForm.articles,
        total: recalculateTotal(editForm.articles, editForm.coutLivraison),
      };

      await updateDelivery(editingDelivery.id, editingDelivery.source, updatedData);

      // Mise à jour locale
      setDeliveries(prev => prev.map(d =>
        d.id === editingDelivery.id
          ? { ...d, ...updatedData }
          : d
      ));

      setShowEditModal(false);
      setEditingDelivery(null);
    } catch (error) {
      alert("Erreur lors de la sauvegarde : " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const computedTotal = recalculateTotal(editForm.articles, editForm.coutLivraison);

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
          <div className="flex justify-center items-center py-20">
            <FiRefreshCw size={32} className="animate-spin text-blue-500" />
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="text-center py-16">
            <FiPackage size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune livraison en cours</h3>
            <p className="text-sm text-gray-600">Tout est validé ou aucune course n'a été créée.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base truncate">{delivery.trackingNumber}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">ID: {delivery.id}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ml-2 ${
                      delivery.type === 'course' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {delivery.type === 'course' ? '🏃' : '📦'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {getStatusText(delivery.status)}
                    </span>
                    <span className="text-lg font-bold text-green-600">{formatAmount(delivery.total)}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FiPackage className="text-gray-400 flex-shrink-0" size={16} />
                    <span className="font-medium text-gray-900">{delivery.quartier}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-xs">📞</span>
                    <span>{delivery.numeroDestinataire}</span>
                  </div>
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

                {/* Actions — 3 boutons dont Modifier */}
                <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
                  <button
                    onClick={() => openDetailsModal(delivery)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <FiEye size={16} />
                    Détails
                  </button>
                  <button
                    onClick={() => openEditModal(delivery)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium text-sm"
                  >
                    <FiEdit2 size={16} />
                    Modifier
                  </button>
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

        {/* ===================== MODAL DÉTAILS ===================== */}
        {showDetailsModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
              <button onClick={() => setShowDetailsModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
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

        {/* ===================== MODAL MODIFIER ===================== */}
        {showEditModal && editingDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <FiX />
              </button>

              <h2 className="text-xl font-bold mb-1">Modifier la livraison</h2>
              <p className="text-xs text-gray-400 mb-5">{editingDelivery.trackingNumber}</p>

              <div className="space-y-5">

                {/* Statut */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Statut</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => handleEditField('status', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-orange-400 focus:outline-none text-sm"
                  >
                    <option value="en_attente">En attente</option>
                    <option value="assigne">Assignée</option>
                    <option value="en_cours">En cours</option>
                    <option value="annule">Annulée</option>
                  </select>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Destination / Quartier</label>
                  <input
                    type="text"
                    value={editForm.quartier}
                    onChange={(e) => handleEditField('quartier', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-orange-400 focus:outline-none text-sm"
                    placeholder="Quartier ou ville"
                  />
                </div>

                {/* Contact destinataire */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contact destinataire</label>
                  <input
                    type="text"
                    value={editForm.numeroDestinataire}
                    onChange={(e) => handleEditField('numeroDestinataire', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-orange-400 focus:outline-none text-sm"
                    placeholder="Numéro de téléphone"
                  />
                </div>

                {/* Coût livraison */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Coût de livraison (FCFA)</label>
                  <input
                    type="number"
                    value={editForm.coutLivraison}
                    onChange={(e) => handleEditField('coutLivraison', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-orange-400 focus:outline-none text-sm"
                    min="0"
                  />
                </div>

                {/* Articles */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Articles</label>
                    <button
                      onClick={handleAddArticle}
                      className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline"
                    >
                      <FiPlus size={13} /> Ajouter
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editForm.articles && editForm.articles.map((art, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                        <input
                          type="text"
                          value={art.nom}
                          onChange={(e) => handleArticleChange(i, 'nom', e.target.value)}
                          placeholder="Nom article"
                          className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-orange-400"
                        />
                        <input
                          type="number"
                          value={art.quantiteCommandee}
                          onChange={(e) => handleArticleChange(i, 'quantiteCommandee', e.target.value)}
                          placeholder="Qté"
                          className="w-14 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-orange-400"
                          min="1"
                        />
                        <input
                          type="number"
                          value={art.coutUnitaire}
                          onChange={(e) => handleArticleChange(i, 'coutUnitaire', e.target.value)}
                          placeholder="Prix"
                          className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-orange-400"
                          min="0"
                        />
                        <button
                          onClick={() => handleRemoveArticle(i)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <FiMinus size={14} />
                        </button>
                      </div>
                    ))}
                    {editForm.articles?.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">Aucun article</p>
                    )}
                  </div>
                </div>

                {/* Récapitulatif total */}
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Nouveau total</span>
                  <span className="text-lg font-bold text-orange-600">{formatAmount(computedTotal)}</span>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors disabled:opacity-60"
                  >
                    {saving ? <FiRefreshCw size={15} className="animate-spin" /> : <FiSave size={15} />}
                    {saving ? 'Sauvegarde...' : 'Enregistrer'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ===================== MODAL SUPPRESSION ===================== */}
        {showDeleteConfirm && deliveryToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
              <FiAlertCircle className="text-red-500 mx-auto mb-4" size={40} />
              <h3 className="text-lg font-bold mb-2">Supprimer la livraison ?</h3>
              <p className="text-gray-600 text-sm mb-6">
                Voulez-vous vraiment supprimer la livraison <b>{deliveryToDelete.trackingNumber}</b> ? Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium">
                  Annuler
                </button>
                <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
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