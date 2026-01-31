import React, { useState, useEffect } from 'react';
import {
  FiTool,
  FiCalendar,
  FiTruck,
  FiChevronRight,
  FiAlertCircle,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiLoader
} from 'react-icons/fi';
import {
  fetchDemandesGarage,
  validerDemandeGarage,
  rejeterDemandeGarage
} from './logic/GarageValidationPageLogic'; // Assurez-vous que le chemin est correct

// --- COMPOSANT MODAL ---
function GarageValidationModal({ demande, onClose, onActionSuccess }) {
  const [cout, setCout] = useState(demande.montantManquant || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Gère la validation de la demande
  const handleValidation = async () => {
    const coutFinal = parseFloat(cout);
    if (!cout || coutFinal <= 0) {
      setError('Veuillez entrer un coût valide.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await validerDemandeGarage(demande.id, demande.idLivreur, coutFinal);
      onActionSuccess(demande.id, coutFinal, false); // Met à jour l'UI parent
      onClose();
    } catch (err) {
      console.error(err);
      setError("Échec de la validation. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  // Gère le rejet de la demande
  const handleReject = async () => {
    if (window.confirm(`Êtes-vous sûr de rejeter la demande de ${demande.nomLivreur} ? Cette action est irréversible.`)) {
      setLoading(true);
      setError('');
      try {
        await rejeterDemandeGarage(demande.id);
        onActionSuccess(demande.id, null, true); // Met à jour l'UI parent
        onClose();
      } catch (err) {
        console.error(err);
        setError("Échec du rejet. Réessayez.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl">
              <FiTool className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Validation Garage</h2>
              <p className="text-sm text-gray-600">{demande.nomLivreur}</p>
            </div>
          </div>
          <div className="space-y-4 mb-6">
            {demande.motif && (
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-1">Motif</p>
                <p className="text-sm text-gray-800">{demande.motif}</p>
              </div>
            )}
            {demande.description && (
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-1">Description</p>
                <p className="text-sm text-gray-800">{demande.description}</p>
              </div>
            )}
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs text-red-700 mb-1">Montant estimé (manquant)</p>
              <p className="text-lg font-bold text-red-800">{`${(demande.montantManquant || 0).toLocaleString()} FCFA`}</p>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Coût Réel de la Réparation *
            </label>
            <div className="relative">
              <FiDollarSign className="absolute inset-y-0 left-4 flex items-center text-gray-400" size={20} />
              <input
                type="number"
                value={cout}
                onChange={(e) => { setCout(e.target.value); setError(''); }}
                placeholder="Entrez le montant réel"
                className="w-full pl-12 pr-20 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-lg font-semibold"
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-gray-500 font-medium">FCFA</span>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><FiAlertCircle size={14} />{error}</p>
            )}
          </div>
          <div className="space-y-3">
            <button
              onClick={handleValidation}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <FiLoader className="animate-spin" /> : <FiCheckCircle size={20} />}
              {loading ? 'Validation...' : 'Valider et Soustraire la Dette'}
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="w-full bg-red-500 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiXCircle size={20} />
              Rejeter la Demande
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-[0.98]"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPOSANT PAGE PRINCIPALE ---
export default function GarageValidationPage() {
  const [demandes, setDemandes] = useState([]);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDemandesGarage();
        setDemandes(data);
      } catch (err) {
        setError("Impossible de charger les demandes. Vérifiez votre connexion.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Met à jour l'état local après une action (validation/rejet) sans recharger la page
  const handleActionSuccess = (demandeId, cout, isRejected = false) => {
    setDemandes(prevDemandes =>
      prevDemandes.map(d =>
        d.id === demandeId
          ? {
            ...d,
            statut: isRejected ? 'rejete' : 'valide',
            coutReel: isRejected ? null : cout,
            dateValidation: new Date().toISOString()
          }
          : d
      )
    );
    setSelectedDemande(null);
  };

  const formatAmount = (amount) => `${amount.toLocaleString()} FCFA`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const getStatutBadge = (statut) => {
    switch (statut) {
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
    switch (urgence) {
      case 'haute':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Urgent</span>;
      case 'normale':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Normal</span>;
      default:
        return null;
    }
  };

  const demandesEnAttente = demandes.filter(d => d.statut === 'en_attente');
  const demandesTraitees = demandes.filter(d => d.statut !== 'en_attente');

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="text-orange-500 animate-spin" size={48} />
        <p className="ml-4 text-lg text-gray-600">Chargement des demandes...</p>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <FiAlertCircle className="text-red-500" size={48} />
        <p className="mt-4 text-lg text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* En-tête */}
        <div className="mb-6 flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
            <FiTool className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Validation Garage</h1>
            <p className="text-sm text-gray-600">{`${demandesEnAttente.length} demande(s) en attente`}</p>
          </div>
        </div>

        {/* Demandes en attente */}
        {demandesEnAttente.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-3">À Valider</h2>
            <div className="space-y-3 mb-6">
              {demandesEnAttente.map((demande) => (
                <div key={demande.id} onClick={() => setSelectedDemande(demande)} className="bg-white rounded-2xl shadow-sm border-2 border-orange-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center">{demande.nomLivreur.charAt(0)}</div>
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
                    <div className="bg-orange-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Motif</p>
                      <p className="text-sm font-semibold text-gray-900">{demande.motif}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Historique */}
        {demandesTraitees.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Historique</h2>
            <div className="space-y-3">
              {demandesTraitees.map((demande) => (
                <div key={demande.id} className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 opacity-80">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center">{demande.nomLivreur.charAt(0)}</div>
                        <div>
                          <h3 className="font-bold text-gray-900">{demande.nomLivreur}</h3>
                          <p className="text-xs text-gray-500">{demande.motif}</p>
                        </div>
                      </div>
                      {getStatutBadge(demande.statut)}
                    </div>
                    {demande.statut === 'valide' && (
                      <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-xs text-gray-600">Coût validé:</span>
                        <span className="text-sm font-bold text-green-700">{formatAmount(demande.coutReel)}</span>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      Traité le {formatDate(demande.dateValidation)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de validation */}
      {selectedDemande && (
        <GarageValidationModal
          demande={selectedDemande}
          onClose={() => setSelectedDemande(null)}
          onActionSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}


