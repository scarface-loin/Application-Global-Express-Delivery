import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiUserPlus, FiPhone, FiMapPin, FiCheckCircle, 
  FiAlertTriangle, FiXCircle, FiFilter, FiFileText, FiX, FiExternalLink 
} from 'react-icons/fi';
import { fetchAllLivreurs } from './logic/DeliveryMenListPageLogic'; // Import de la logique

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
          {/* Aperçu si c'est une image, sinon lien générique */}
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
        
        {/* Header Modal */}
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
          {/* Section Finance Rapide */}
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

          {/* Section Documents */}
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

          {/* Informations Contact */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Contact</h3>
            <div className="flex gap-4">
              <a href={`tel:${livreur.telephone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                <FiPhone /> {livreur.telephone}
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
  const [selectedLivreur, setSelectedLivreur] = useState(null); // Pour la modale

  // Chargement des données réelles
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
      case 'actif': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><FiCheckCircle /> Actif</span>;
      case 'bloque_finance': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1"><FiAlertTriangle /> Bloqué</span>;
      case 'suspendu': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1"><FiXCircle /> Suspendu</span>;
      default: return null;
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
              <option value="bloque_finance">Bloqués</option>
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
            {filteredLivreurs.map((livreur) => (
              <div key={livreur.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                        {livreur.nom.charAt(0)}
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
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <FiPhone /> Appeler
                  </a>
                  <button 
                    onClick={() => setSelectedLivreur(livreur)}
                    className="flex-1 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                  >
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Affichage de la modale si un livreur est sélectionné */}
      {selectedLivreur && (
        <DriverDetailsModal 
          livreur={selectedLivreur} 
          onClose={() => setSelectedLivreur(null)} 
        />
      )}
    </div>
  );
}