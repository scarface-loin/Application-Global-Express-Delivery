import React, { useState } from 'react';
import { 
  FiCheckCircle, 
  FiCalendar, 
  FiPackage, 
  FiChevronRight, 
  FiAlertCircle,
  FiUser
} from 'react-icons/fi';
// Assurez-vous que le fichier ValidationModal.jsx est dans le même dossier
import ValidationModal from './modal/ValidationModal';

export default function ValidationPage() {
  const [selectedLivreur, setSelectedLivreur] = useState(null);

  // Données simulées (identiques à votre source)
  const [livreurs, setLivreurs] = useState([
    {
      id: 'DM-001',
      nom: 'Jean Dupont',
      photo: '👨‍🦱',
      nbLivraisons: 3,
      totalCollecte: 19300,
      statut: 'en_attente',
      date: new Date().toISOString(),
      detteMensuelle: 5000,
      livraisons: [
        {
          id: 'DEL-001', type: 'course', quartier: 'Bonapriso',
          articles: [{ nom: 'Pizza', quantite: 2, cout: 3500 }, { nom: 'Coca', quantite: 1, cout: 1000 }],
          coutLivraison: 1000, hasExpedition: false
        },
        {
          id: 'DEL-002', type: 'expedition', quartier: 'Douala',
          articles: [{ nom: 'Colis', quantite: 1, cout: 5000 }],
          coutLivraison: 2000, hasExpedition: true, fraisExpedition: 1500
        },
        {
          id: 'DEL-003', type: 'course', quartier: 'Akwa',
          articles: [{ nom: 'Documents', quantite: 5, cout: 500 }],
          coutLivraison: 800, hasExpedition: false
        }
      ]
    },
    {
      id: 'DM-002',
      nom: 'Marie Kouam',
      photo: '👩',
      nbLivraisons: 5,
      totalCollecte: 28500,
      statut: 'en_attente',
      date: new Date().toISOString(),
      detteMensuelle: 0,
      livraisons: [
        {
          id: 'DEL-004', type: 'course', quartier: 'Bonanjo',
          articles: [{ nom: 'Repas', quantite: 3, cout: 4000 }],
          coutLivraison: 1500, hasExpedition: false
        },
        {
          id: 'DEL-005', type: 'expedition', quartier: 'Bepanda',
          articles: [{ nom: 'Colis urgent', quantite: 1, cout: 8000 }],
          coutLivraison: 2500, hasExpedition: true, fraisExpedition: 2000
        }
      ]
    },
    {
      id: 'DM-003',
      nom: 'Paul Nkongo',
      photo: '👨',
      nbLivraisons: 2,
      totalCollecte: 12000,
      statut: 'valide',
      date: new Date(Date.now() - 86400000).toISOString(),
      detteMensuelle: 12000,
      livraisons: []
    }
  ]);

  // Helpers pour l'affichage
  const formatAmount = (amount) => `${amount.toLocaleString()} FCFA`;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'en_attente':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">En attente</span>;
      case 'valide':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Validé</span>;
      default:
        return null;
    }
  };

  // Callback appelé quand la validation réussit dans la popup
  const handleValidationSuccess = (livreurId) => {
    setLivreurs(prevLivreurs => 
      prevLivreurs.map(l => 
        l.id === livreurId ? { ...l, statut: 'valide' } : l
      )
    );
    setSelectedLivreur(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <FiCheckCircle className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Validation</h1>
              <p className="text-sm text-gray-600">Journées des livreurs</p>
            </div>
          </div>
        </div>

        {/* Info date */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <FiCalendar size={16} />
          <span>{formatDate(new Date().toISOString())}</span>
        </div>

        {/* Liste des livreurs */}
        <div className="space-y-3">
          {livreurs.map((livreur) => (
            <div
              key={livreur.id}
              onClick={() => livreur.statut === 'en_attente' && setSelectedLivreur(livreur)}
              className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
                livreur.statut === 'en_attente' 
                  ? 'border-blue-200 hover:border-blue-400 hover:shadow-md active:scale-[0.98] cursor-pointer' 
                  : 'border-gray-200 opacity-75'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{livreur.photo}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{livreur.nom}</h3>
                      <p className="text-xs text-gray-500">{livreur.id}</p>
                    </div>
                  </div>
                  {livreur.statut === 'en_attente' ? (
                    <FiChevronRight className="text-blue-500" size={24} />
                  ) : (
                    getStatutBadge(livreur.statut)
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FiPackage className="text-blue-600" size={16} />
                      <span className="text-xs text-gray-600">Livraisons</span>
                    </div>
                    <p className="text-xl font-bold text-blue-700">{livreur.nbLivraisons}</p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FiCheckCircle className="text-green-600" size={16} />
                      <span className="text-xs text-gray-600">Collecté</span>
                    </div>
                    <p className="text-sm font-bold text-green-700">
                      {formatAmount(livreur.totalCollecte)}
                    </p>
                  </div>
                </div>

                {livreur.detteMensuelle > 0 && (
                  <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-red-700 font-medium">Dette mensuelle:</span>
                      <span className="text-sm font-bold text-red-700">{formatAmount(livreur.detteMensuelle)}</span>
                    </div>
                  </div>
                )}

                {livreur.statut === 'en_attente' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-orange-600">
                      <FiAlertCircle size={14} />
                      <span className="text-xs font-medium">En attente de validation</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats globales en bas de page */}
        <div className="mt-6 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg p-5 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-3">Aujourd'hui</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-75">En attente</p>
              <p className="text-3xl font-bold">
                {livreurs.filter(l => l.statut === 'en_attente').length}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-75">Validés</p>
              <p className="text-3xl font-bold">
                {livreurs.filter(l => l.statut === 'valide').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Intégration de la Popup (Modal) */}
      {selectedLivreur && (
        <ValidationModal 
          livreur={selectedLivreur}
          onClose={() => setSelectedLivreur(null)}
          onValidateSuccess={handleValidationSuccess}
        />
      )}
    </div>
  );
}