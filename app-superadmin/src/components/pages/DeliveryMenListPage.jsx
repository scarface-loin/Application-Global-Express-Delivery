import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiUserPlus, FiPhone, FiMapPin, FiCheckCircle, 
  FiAlertTriangle, FiXCircle, FiFilter, FiFileText, FiX, FiExternalLink,
  FiLock, FiUnlock, FiAlertCircle
} from 'react-icons/fi';
import { fetchAllLivreurs, bloquerLivreur, debloquerLivreur } from './logic/DeliveryMenListPageLogic';

// --- MODAL CONFIRMATION BLOCAGE ---
const BlockConfirmModal = ({ livreur, onConfirm, onCancel }) => {
  const [raison, setRaison] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(raison);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <FiLock className="text-red-600" size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Bloquer le livreur</h3>
            <p className="text-xs text-gray-500">{livreur.nom}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
            <FiAlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-red-700">
              Ce livreur ne pourra plus accepter de nouvelles courses. Vous pourrez le débloquer à tout moment.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Raison du blocage <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              placeholder="Ex: Comportement signalé, retards répétés..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none transition-all"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <FiLock size={14} />
            )}
            Confirmer le blocage
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL CONFIRMATION DÉBLOCAGE ---
const UnblockConfirmModal = ({ livreur, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">

        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <FiUnlock className="text-green-600" size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Débloquer le livreur</h3>
            <p className="text-xs text-gray-500">{livreur.nom}</p>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-600">
            Le livreur <span className="font-semibold text-gray-900">{livreur.nom}</span> sera de nouveau actif et pourra accepter des courses.
          </p>
          {livreur.raisonBlocage && (
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Raison du blocage initial</p>
              <p className="text-sm text-gray-700">{livreur.raisonBlocage}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <FiUnlock size={14} />
            )}
            Débloquer
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL DÉTAILS & DOCUMENTS ---
const DriverDetailsModal = ({ livreur, onClose }) => {
  if (!livreur) return null;

  const DocumentCard = ({ title, url }) => (
    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
        <FiFileText /> {title}
      </h4>
      {url ? (
        <div className="space-y-2">
          <div className="h-32 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center relative group">
            <img 
              src={url} 
              alt={title} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x300?text=Document+PDF"; }} 
            />
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold gap-2"
            >
              <FiExternalLink /> Ouvrir
            </a>
          </div>
        </div>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
          <FiXCircle size={24} />
          <span className="text-xs mt-1">Non fourni</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {livreur.nom.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{livreur.nom}</h2>
              <p className="text-xs text-gray-500">{livreur.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiX size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Alerte si suspendu */}
          {livreur.statut === 'suspendu' && (
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 flex gap-3 items-start">
              <FiLock className="text-gray-500 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-semibold text-gray-700">Livreur bloqué</p>
                {livreur.raisonBlocage && (
                  <p className="text-xs text-gray-500 mt-0.5">{livreur.raisonBlocage}</p>
                )}
                {livreur.dateBloquage && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(livreur.dateBloquage).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 mb-3">Situation Financière</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Dette actuelle:</span>
                <span className={`font-bold ${livreur.finance.detteActuelle > livreur.finance.plafondDette ? 'text-red-600' : 'text-gray-900'}`}>
                  {livreur.finance.detteActuelle.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plafond:</span>
                <span className="font-medium text-gray-900">{livreur.finance.plafondDette.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiFileText className="text-blue-600" /> Documents Légaux
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DocumentCard title="CNI" url={livreur.documents?.cniUrl} />
              <DocumentCard title="Permis" url={livreur.documents?.permisUrl} />
              <DocumentCard title="Contrat" url={livreur.documents?.contratUrl} />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Contact</h3>
            <div className="flex gap-4">
              <a href={`tel:${livreur.telephone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                <FiPhone /> {livreur.telephone}
              </a>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
export default function DeliveryMenListPage() {
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLivreur, setSelectedLivreur] = useState(null);

  // États pour les modales blocage/déblocage
  const [livreurABloquer, setLivreurABloquer] = useState(null);
  const [livreurADebloquer, setLivreurADebloquer] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAllLivreurs();
        setLivreurs(data);
      } catch (error) {
        alert("Erreur de chargement des livreurs");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Handlers blocage ---
  const handleConfirmBlocage = async (raison) => {
    if (!livreurABloquer) return;
    try {
      await bloquerLivreur(livreurABloquer.id, raison);
      // Mise à jour locale immédiate (pas besoin de re-fetch)
      setLivreurs(prev =>
        prev.map(l =>
          l.id === livreurABloquer.id
            ? { ...l, statut: 'suspendu', disponible: false, raisonBlocage: raison || 'Bloqué par admin', dateBloquage: new Date().toISOString() }
            : l
        )
      );
      setLivreurABloquer(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleConfirmDeblocage = async () => {
    if (!livreurADebloquer) return;
    try {
      await debloquerLivreur(livreurADebloquer.id);
      setLivreurs(prev =>
        prev.map(l =>
          l.id === livreurADebloquer.id
            ? { ...l, statut: 'actif', disponible: true, raisonBlocage: null, dateBloquage: null }
            : l
        )
      );
      setLivreurADebloquer(null);
    } catch (error) {
      alert(error.message);
    }
  };

  // Filtrage
  const filteredLivreurs = livreurs.filter(livreur => {
    const matchSearch = 
      livreur.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      livreur.telephone.includes(searchTerm);
    const matchStatus = filterStatus === 'all' ? true : livreur.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'actif':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
            <FiCheckCircle /> Actif
          </span>
        );
      case 'bloque_finance':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
            <FiAlertTriangle /> Bloqué (finance)
          </span>
        );
      case 'suspendu':
        return (
          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1">
            <FiLock size={11} /> Suspendu
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Filtres */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="relative min-w-[200px]">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
            >
              <option value="all">Tous statuts</option>
              <option value="actif">Actifs</option>
              <option value="bloque_finance">Bloqués (finance)</option>
              <option value="suspendu">Suspendus</option>
            </select>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredLivreurs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">Aucun livreur trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLivreurs.map((livreur) => {
              const isSuspendu = livreur.statut === 'suspendu';
              return (
                <div
                  key={livreur.id}
                  className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border overflow-hidden ${
                    isSuspendu ? 'border-gray-300 opacity-80' : 'border-gray-100'
                  }`}
                >
                  <div className="p-5 border-b border-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                          isSuspendu
                            ? 'bg-gray-400'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {isSuspendu ? <FiLock size={18} /> : livreur.nom.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{livreur.nom}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <FiMapPin size={10} /> {livreur.disponible ? "Disponible" : "Indisponible"}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(livreur.statut)}
                    </div>

                    {/* Raison blocage si suspendu */}
                    {isSuspendu && livreur.raisonBlocage && (
                      <div className="mt-1 flex items-start gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <FiAlertCircle size={12} className="shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{livreur.raisonBlocage}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-gray-50 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Dette Actuelle</span>
                      <span className={`font-bold ${livreur.finance.detteActuelle > livreur.finance.plafondDette ? 'text-red-600' : 'text-gray-900'}`}>
                        {livreur.finance.detteActuelle.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${livreur.finance.detteActuelle > livreur.finance.plafondDette ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min((livreur.finance.detteActuelle / livreur.finance.plafondDette) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-4 flex gap-2">
                    <a 
                      href={`tel:${livreur.telephone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      <FiPhone size={14} /> Appeler
                    </a>
                    <button 
                      onClick={() => setSelectedLivreur(livreur)}
                      className="flex-1 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors text-sm"
                    >
                      Détails
                    </button>
                    {/* Bouton Bloquer / Débloquer */}
                    {isSuspendu ? (
                      <button
                        onClick={() => setLivreurADebloquer(livreur)}
                        title="Débloquer le livreur"
                        className="px-3 py-2.5 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-colors flex items-center gap-1 text-sm"
                      >
                        <FiUnlock size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setLivreurABloquer(livreur)}
                        title="Bloquer le livreur"
                        className="px-3 py-2.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors flex items-center gap-1 text-sm"
                      >
                        <FiLock size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale détails */}
      {selectedLivreur && (
        <DriverDetailsModal 
          livreur={selectedLivreur} 
          onClose={() => setSelectedLivreur(null)} 
        />
      )}

      {/* Modale confirmation blocage */}
      {livreurABloquer && (
        <BlockConfirmModal
          livreur={livreurABloquer}
          onConfirm={handleConfirmBlocage}
          onCancel={() => setLivreurABloquer(null)}
        />
      )}

      {/* Modale confirmation déblocage */}
      {livreurADebloquer && (
        <UnblockConfirmModal
          livreur={livreurADebloquer}
          onConfirm={handleConfirmDeblocage}
          onCancel={() => setLivreurADebloquer(null)}
        />
      )}
    </div>
  );
}
