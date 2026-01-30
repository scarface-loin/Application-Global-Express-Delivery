import React, { useState } from 'react';
import { 
  FiTool, 
  FiCalendar, 
  FiTruck, 
  FiChevronRight, 
  FiAlertCircle,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';

// Modal pour entrer le coût et valider
function GarageValidationModal({ demande, onClose, onValidateSuccess }) {
  const [cout, setCout] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleValidation = async () => {
    if (!cout || parseFloat(cout) <= 0) {
      setError('Veuillez entrer un coût valide');
      return;
    }

    setLoading(true);
    setError('');

    // Simuler un appel API
    setTimeout(() => {
      onValidateSuccess(demande.id, parseFloat(cout));
      setLoading(false);
    }, 1000);
  };

  const handleReject = () => {
    if (window.confirm(`Êtes-vous sûr de rejeter la demande de ${demande.nomLivreur} ?`)) {
      onValidateSuccess(demande.id, null, true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl">
              <FiTool className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">Validation Garage</h2>
              <p className="text-sm text-gray-600">{demande.nomLivreur}</p>
            </div>
          </div>

          {/* Informations de la demande */}
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">ID Livreur</p>
                  <p className="font-semibold text-gray-900">{demande.idLivreur}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Véhicule</p>
                  <p className="font-semibold text-gray-900">{demande.vehicule}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Date de demande</p>
              <p className="font-semibold text-blue-900">
                {new Date(demande.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {demande.motif && (
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-1">Motif</p>
                <p className="text-sm text-gray-800">{demande.motif}</p>
              </div>
            )}

            {demande.description && (
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-1">Description du problème</p>
                <p className="text-sm text-gray-800">{demande.description}</p>
              </div>
            )}
          </div>

          {/* Saisie du coût */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Coût de la réparation *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiDollarSign className="text-gray-400" size={20} />
              </div>
              <input
                type="number"
                value={cout}
                onChange={(e) => {
                  setCout(e.target.value);
                  setError('');
                }}
                placeholder="Entrez le montant"
                className="w-full pl-12 pr-20 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-lg font-semibold"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">FCFA</span>
              </div>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <FiAlertCircle size={14} />
                {error}
              </p>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <button
              onClick={handleValidation}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiCheckCircle size={20} />
              {loading ? 'Validation en cours...' : 'Valider et Confirmer'}
            </button>

            <button
              onClick={handleReject}
              disabled={loading}
              className="w-full bg-red-500 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiXCircle size={20} />
              Rejeter la demande
            </button>

            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page principale
export default function GarageValidationPage() {
  const [selectedDemande, setSelectedDemande] = useState(null);

  // Données simulées des demandes de passage au garage
  const [demandes, setDemandes] = useState([
    {
      id: 'GAR-001',
      idLivreur: 'DM-001',
      nomLivreur: 'Jean Dupont',
      photo: '👨‍🦱',
      vehicule: 'Moto Yamaha',
      immatriculation: 'DLA-123-AB',
      motif: 'Panne mécanique',
      description: 'Problème au niveau du moteur, bruit anormal et perte de puissance',
      statut: 'en_attente',
      date: new Date().toISOString(),
      urgence: 'haute'
    },
    {
      id: 'GAR-002',
      idLivreur: 'DM-002',
      nomLivreur: 'Marie Kouam',
      photo: '👩',
      vehicule: 'Scooter Honda',
      immatriculation: 'DLA-456-CD',
      motif: 'Entretien régulier',
      description: 'Révision des 10 000 km, changement d\'huile et vérification freins',
      statut: 'en_attente',
      date: new Date(Date.now() - 3600000).toISOString(),
      urgence: 'normale'
    },
    {
      id: 'GAR-003',
      idLivreur: 'DM-003',
      nomLivreur: 'Paul Nkongo',
      photo: '👨',
      vehicule: 'Moto Suzuki',
      immatriculation: 'DLA-789-EF',
      motif: 'Accident léger',
      description: 'Rétroviseur cassé et rayure sur le carénage',
      statut: 'valide',
      cout: 25000,
      date: new Date(Date.now() - 86400000).toISOString(),
      dateValidation: new Date(Date.now() - 7200000).toISOString(),
      urgence: 'haute'
    },
    {
      id: 'GAR-004',
      idLivreur: 'DM-004',
      nomLivreur: 'Sarah Mballa',
      photo: '👩‍🦱',
      vehicule: 'Moto TVS',
      immatriculation: 'DLA-321-GH',
      motif: 'Problème électrique',
      description: 'Phare avant ne fonctionne plus',
      statut: 'rejete',
      date: new Date(Date.now() - 172800000).toISOString(),
      dateValidation: new Date(Date.now() - 86400000).toISOString(),
      urgence: 'normale'
    }
  ]);

  const formatAmount = (amount) => `${amount.toLocaleString()} FCFA`;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'en_attente':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">En attente</span>;
      case 'valide':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Validé</span>;
      case 'rejete':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Rejeté</span>;
      default:
        return null;
    }
  };

  const getUrgenceBadge = (urgence) => {
    switch(urgence) {
      case 'haute':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Urgent</span>;
      case 'normale':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Normal</span>;
      default:
        return null;
    }
  };

  const handleValidationSuccess = (demandeId, cout, isRejected = false) => {
    setDemandes(prevDemandes => 
      prevDemandes.map(d => 
        d.id === demandeId 
          ? { 
              ...d, 
              statut: isRejected ? 'rejete' : 'valide',
              cout: isRejected ? null : cout,
              dateValidation: new Date().toISOString()
            } 
          : d
      )
    );
    setSelectedDemande(null);
  };

  const demandesEnAttente = demandes.filter(d => d.statut === 'en_attente');
  const demandesTraitees = demandes.filter(d => d.statut !== 'en_attente');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
              <FiTool className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Validation Garage</h1>
              <p className="text-sm text-gray-600">Demandes de passage au garage</p>
            </div>
          </div>
        </div>

        {/* Info date */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <FiCalendar size={16} />
          <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        {/* Demandes en attente */}
        {demandesEnAttente.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-3">En attente de validation</h2>
            <div className="space-y-3 mb-6">
              {demandesEnAttente.map((demande) => (
                <div
                  key={demande.id}
                  onClick={() => setSelectedDemande(demande)}
                  className="bg-white rounded-2xl shadow-sm border-2 border-orange-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{demande.photo}</div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{demande.nomLivreur}</h3>
                          <p className="text-xs text-gray-500">{demande.idLivreur}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getUrgenceBadge(demande.urgence)}
                        <FiChevronRight className="text-orange-500" size={24} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-orange-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FiTruck className="text-orange-600" size={16} />
                          <span className="text-xs text-gray-600">Véhicule</span>
                        </div>
                        <p className="text-sm font-bold text-orange-700">{demande.vehicule}</p>
                        <p className="text-xs text-gray-600">{demande.immatriculation}</p>
                      </div>

                      <div className="bg-yellow-50 rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Motif</p>
                        <p className="text-sm font-semibold text-gray-900">{demande.motif}</p>
                        {demande.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{demande.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-orange-600">
                          <FiAlertCircle size={14} />
                          <span className="text-xs font-medium">En attente de validation</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(demande.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Demandes traitées */}
        {demandesTraitees.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Historique</h2>
            <div className="space-y-3">
              {demandesTraitees.map((demande) => (
                <div
                  key={demande.id}
                  className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 opacity-75"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{demande.photo}</div>
                        <div>
                          <h3 className="font-bold text-gray-900">{demande.nomLivreur}</h3>
                          <p className="text-xs text-gray-500">{demande.vehicule}</p>
                        </div>
                      </div>
                      {getStatutBadge(demande.statut)}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 mb-2">
                      <p className="text-xs text-gray-600">Motif: {demande.motif}</p>
                    </div>

                    {demande.cout && (
                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Coût validé:</span>
                          <span className="text-sm font-bold text-green-700">{formatAmount(demande.cout)}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Validé le {formatDate(demande.dateValidation)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Stats globales */}
        <div className="mt-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg p-5 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-3">Statistiques</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs opacity-75">En attente</p>
              <p className="text-3xl font-bold">{demandesEnAttente.length}</p>
            </div>
            <div>
              <p className="text-xs opacity-75">Validées</p>
              <p className="text-3xl font-bold">
                {demandes.filter(d => d.statut === 'valide').length}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-75">Rejetées</p>
              <p className="text-3xl font-bold">
                {demandes.filter(d => d.statut === 'rejete').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de validation */}
      {selectedDemande && (
        <GarageValidationModal 
          demande={selectedDemande}
          onClose={() => setSelectedDemande(null)}
          onValidateSuccess={handleValidationSuccess}
        />
      )}
    </div>
  );
}