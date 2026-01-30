import React, { useState } from 'react';
import { 
  FiCalendar,
  FiDollarSign,
  FiTruck,
  FiCheckCircle,
  FiImage,
  FiUpload,
  FiX,
  FiUser,
  FiPackage,
  FiFileText,
  FiDownload,
  FiEye,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';

// Modal de visualisation de preuve de paiement
function PaymentProofModal({ payment, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                <FiImage className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Preuve de paiement</h2>
                <p className="text-sm text-gray-600">{payment.partenaire}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="text-gray-600" size={24} />
            </button>
          </div>

          {/* Infos du paiement */}
          <div className="mb-6 bg-gray-50 rounded-xl p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold text-gray-900">{payment.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Livraisons:</span>
                <span className="font-semibold text-gray-900">{payment.nombreLivraisons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Montant payé:</span>
                <span className="font-bold text-green-700">{payment.montantPaye.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Capture d'écran */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Capture d'écran du paiement</h3>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <img 
                src={payment.captureEcran} 
                alt="Preuve de paiement" 
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Bouton de fermeture */}
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-[0.98]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal d'enregistrement de paiement
function RecordPaymentModal({ partner, onClose, onSaveSuccess }) {
  const [montantPaye, setMontantPaye] = useState('');
  const [captureEcran, setCaptureEcran] = useState(null);
  const [capturePreview, setCapturePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCaptureEcran(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!montantPaye || parseFloat(montantPaye) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    if (!captureEcran) {
      alert('Veuillez ajouter une capture d\'écran du paiement');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      onSaveSuccess(partner.id, parseFloat(montantPaye), capturePreview);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                <FiDollarSign className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Enregistrer paiement</h2>
                <p className="text-sm text-gray-600">{partner.nom}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="text-gray-600" size={24} />
            </button>
          </div>

          {/* Récapitulatif */}
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Livraisons effectuées:</span>
                <span className="font-semibold text-gray-900">{partner.livraisonsEffectuees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total livraisons:</span>
                <span className="text-gray-900">{partner.totalLivraisons.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frais de livraison:</span>
                <span className="text-red-600">-{partner.fraisLivraison.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="font-bold text-gray-900">À payer:</span>
                <span className="font-bold text-blue-700 text-lg">{partner.montantAPayer.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Montant payé */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Montant payé <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <FiDollarSign className="text-gray-400" size={20} />
              </div>
              <input
                type="number"
                value={montantPaye}
                onChange={(e) => setMontantPaye(e.target.value)}
                placeholder="Entrer le montant payé"
                className="w-full pl-12 pr-16 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900 font-semibold"
                min="0"
                step="100"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
                FCFA
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Montant recommandé: {partner.montantAPayer.toLocaleString()} FCFA
            </p>
          </div>

          {/* Upload capture d'écran */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Capture d'écran du paiement <span className="text-red-500">*</span>
            </label>
            
            {!capturePreview ? (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <FiUpload className="mx-auto text-gray-400 mb-3" size={40} />
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Cliquer pour ajouter une image
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG ou JPEG (max 5MB)
                  </p>
                </div>
              </label>
            ) : (
              <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden">
                <img 
                  src={capturePreview} 
                  alt="Preview" 
                  className="w-full h-auto"
                />
                <button
                  onClick={() => {
                    setCaptureEcran(null);
                    setCapturePreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <button
              onClick={handleSave}
              disabled={loading || !montantPaye || !captureEcran || parseFloat(montantPaye) <= 0}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement en cours...
                </>
              ) : (
                <>
                  <FiCheckCircle size={20} />
                  Enregistrer le paiement
                </>
              )}
            </button>

            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-[0.98] disabled:opacity-50"
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
export default function DailySummaryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filter, setFilter] = useState('all'); // all, paye, non_paye

  const [partenaires, setPartenaires] = useState([
    {
      id: 'PART-001',
      nom: 'Restaurant Le Goût',
      type: 'Restaurant',
      livraisonsEffectuees: 8,
      totalLivraisons: 72000,
      fraisLivraison: 8000,
      montantAPayer: 64000,
      statut: 'non_paye',
      livraisons: [
        { id: 'LIV-001', montant: 9000, frais: 1000, heure: '08:30' },
        { id: 'LIV-005', montant: 12000, frais: 1000, heure: '10:15' },
        { id: 'LIV-008', montant: 8500, frais: 1000, heure: '12:45' },
        { id: 'LIV-012', montant: 11000, frais: 1000, heure: '14:20' },
        { id: 'LIV-015', montant: 9500, frais: 1000, heure: '16:00' },
        { id: 'LIV-018', montant: 7000, frais: 1000, heure: '17:30' },
        { id: 'LIV-021', montant: 8000, frais: 1000, heure: '19:00' },
        { id: 'LIV-024', montant: 7000, frais: 1000, heure: '20:15' },
      ]
    },
    {
      id: 'PART-002',
      nom: 'Shop Express',
      type: 'E-commerce',
      livraisonsEffectuees: 5,
      totalLivraisons: 250000,
      fraisLivraison: 25000,
      montantAPayer: 225000,
      statut: 'paye',
      montantPaye: 225000,
      datePaiement: new Date().toISOString(),
      captureEcran: 'https://placehold.co/600x400/22c55e/white?text=Payment+Proof',
      livraisons: [
        { id: 'LIV-002', montant: 50000, frais: 5000, heure: '09:00' },
        { id: 'LIV-006', montant: 45000, frais: 5000, heure: '11:30' },
        { id: 'LIV-010', montant: 55000, frais: 5000, heure: '13:45' },
        { id: 'LIV-014', montant: 50000, frais: 5000, heure: '15:20' },
        { id: 'LIV-019', montant: 50000, frais: 5000, heure: '18:00' },
      ]
    },
    {
      id: 'PART-003',
      nom: 'Pharmacie Santé Plus',
      type: 'Pharmacie',
      livraisonsEffectuees: 12,
      totalLivraisons: 120000,
      fraisLivraison: 18000,
      montantAPayer: 102000,
      statut: 'non_paye',
      livraisons: [
        { id: 'LIV-003', montant: 10000, frais: 1500, heure: '08:00' },
        { id: 'LIV-007', montant: 8500, frais: 1500, heure: '09:30' },
        { id: 'LIV-009', montant: 11000, frais: 1500, heure: '10:45' },
        { id: 'LIV-011', montant: 9000, frais: 1500, heure: '12:00' },
        { id: 'LIV-013', montant: 10500, frais: 1500, heure: '13:30' },
        { id: 'LIV-016', montant: 9500, frais: 1500, heure: '15:00' },
        { id: 'LIV-017', montant: 11000, frais: 1500, heure: '16:30' },
        { id: 'LIV-020', montant: 10000, frais: 1500, heure: '17:45' },
        { id: 'LIV-022', montant: 12000, frais: 1500, heure: '18:30' },
        { id: 'LIV-023', montant: 9500, frais: 1500, heure: '19:15' },
        { id: 'LIV-025', montant: 10000, frais: 1500, heure: '20:00' },
        { id: 'LIV-026', montant: 9000, frais: 1500, heure: '20:45' },
      ]
    },
    {
      id: 'PART-004',
      nom: 'Boulangerie Moderne',
      type: 'Boulangerie',
      livraisonsEffectuees: 6,
      totalLivraisons: 22200,
      fraisLivraison: 4800,
      montantAPayer: 17400,
      statut: 'paye',
      montantPaye: 17400,
      datePaiement: new Date().toISOString(),
      captureEcran: 'https://placehold.co/600x400/22c55e/white?text=Mobile+Money',
      livraisons: [
        { id: 'LIV-004', montant: 3700, frais: 800, heure: '07:00' },
        { id: 'LIV-027', montant: 4000, frais: 800, heure: '07:45' },
        { id: 'LIV-028', montant: 3500, frais: 800, heure: '08:30' },
        { id: 'LIV-029', montant: 3800, frais: 800, heure: '09:15' },
        { id: 'LIV-030', montant: 3600, frais: 800, heure: '10:00' },
        { id: 'LIV-031', montant: 3600, frais: 800, heure: '11:00' },
      ]
    },
  ]);

  const handleSavePayment = (partnerId, montantPaye, captureEcran) => {
    setPartenaires(prevPartenaires =>
      prevPartenaires.map(p =>
        p.id === partnerId
          ? {
              ...p,
              statut: 'paye',
              montantPaye: montantPaye,
              datePaiement: new Date().toISOString(),
              captureEcran: captureEcran
            }
          : p
      )
    );
    setSelectedPartner(null);
  };

  const filteredPartenaires = partenaires.filter(p => {
    if (filter === 'all') return true;
    return p.statut === filter;
  });

  const totalLivraisons = partenaires.reduce((sum, p) => sum + p.livraisonsEffectuees, 0);
  const totalMontantBrut = partenaires.reduce((sum, p) => sum + p.totalLivraisons, 0);
  const totalFrais = partenaires.reduce((sum, p) => sum + p.fraisLivraison, 0);
  const totalAPayer = partenaires.reduce((sum, p) => sum + p.montantAPayer, 0);
  const totalPaye = partenaires.filter(p => p.statut === 'paye').reduce((sum, p) => sum + (p.montantPaye || 0), 0);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <FiFileText className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bilan Journalier</h1>
              <p className="text-sm text-gray-600">Gestion des paiements partenaires</p>
            </div>
          </div>

          {/* Sélecteur de date */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <FiCalendar className="inline mr-2" />
              Date du bilan
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-gray-900 font-semibold"
            />
          </div>

          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300'
              }`}
            >
              Tous ({partenaires.length})
            </button>
            <button
              onClick={() => setFilter('paye')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                filter === 'paye'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300'
              }`}
            >
              ✓ Payés ({partenaires.filter(p => p.statut === 'paye').length})
            </button>
            <button
              onClick={() => setFilter('non_paye')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                filter === 'non_paye'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300'
              }`}
            >
              ⏳ En attente ({partenaires.filter(p => p.statut === 'non_paye').length})
            </button>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiTruck className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total livraisons</p>
                <p className="text-2xl font-bold text-gray-900">{totalLivraisons}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiDollarSign className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Montant brut</p>
                <p className="text-xl font-bold text-gray-900">{totalMontantBrut.toLocaleString()}</p>
                <p className="text-xs text-gray-500">FCFA</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiAlertCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Frais totaux</p>
                <p className="text-xl font-bold text-red-700">{totalFrais.toLocaleString()}</p>
                <p className="text-xs text-gray-500">FCFA</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Payé</p>
                <p className="text-xl font-bold text-green-700">{totalPaye.toLocaleString()}</p>
                <p className="text-xs text-gray-500">sur {totalAPayer.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des partenaires */}
        <div className="space-y-4">
          {filteredPartenaires.map((partenaire) => (
            <div
              key={partenaire.id}
              className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden"
            >
              {/* En-tête partenaire */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      partenaire.statut === 'paye' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      <FiUser className={partenaire.statut === 'paye' ? 'text-green-600' : 'text-orange-600'} size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{partenaire.nom}</h3>
                      <p className="text-xs text-gray-500">{partenaire.type}</p>
                    </div>
                  </div>
                  {partenaire.statut === 'paye' ? (
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                      <FiCheckCircle size={14} />
                      Payé
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 flex items-center gap-1">
                      <FiClock size={14} />
                      En attente
                    </span>
                  )}
                </div>

                {/* Stats partenaire */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Livraisons</p>
                    <p className="font-bold text-gray-900">{partenaire.livraisonsEffectuees}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total brut</p>
                    <p className="font-bold text-gray-900">{partenaire.totalLivraisons.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Frais</p>
                    <p className="font-bold text-red-600">-{partenaire.fraisLivraison.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Détails */}
              <div className="p-4">
                {/* Montant à payer */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Montant à payer au partenaire:</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {partenaire.montantAPayer.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                {/* Détails des livraisons */}
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2">
                    <FiPackage size={16} />
                    Voir les {partenaire.livraisonsEffectuees} livraisons
                  </summary>
                  <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                    {partenaire.livraisons.map((livraison, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">{livraison.id}</span>
                          <span className="text-xs text-gray-500">{livraison.heure}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Montant: {livraison.montant.toLocaleString()} FCFA</span>
                          <span className="text-red-600">Frais: -{livraison.frais.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>

                {/* Actions */}
                {partenaire.statut === 'non_paye' ? (
                  <button
                    onClick={() => setSelectedPartner(partenaire)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <FiDollarSign size={20} />
                    Enregistrer le paiement
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-700">Montant payé:</span>
                        <span className="font-bold text-green-700">{partenaire.montantPaye.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FiClock size={12} />
                        <span>{formatDate(partenaire.datePaiement)} à {formatTime(partenaire.datePaiement)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPayment(partenaire)}
                      className="w-full bg-blue-100 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <FiEye size={20} />
                      Voir la preuve de paiement
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucun partenaire */}
        {filteredPartenaires.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full inline-block mb-4">
              <FiUser className="text-gray-400" size={48} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun partenaire</h3>
            <p className="text-sm text-gray-600">
              Aucun partenaire {filter === 'paye' ? 'payé' : filter === 'non_paye' ? 'en attente de paiement' : ''} pour cette date.
            </p>
          </div>
        )}

        {/* Récapitulatif final */}
        <div className="mt-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-4">Récapitulatif du {formatDate(selectedDate)}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="opacity-90">Total livraisons:</span>
              <span className="text-2xl font-bold">{totalLivraisons}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-90">Montant brut total:</span>
              <span className="text-xl font-bold">{totalMontantBrut.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-90">Frais de livraison totaux:</span>
              <span className="text-xl font-bold">-{totalFrais.toLocaleString()} FCFA</span>
            </div>
            <div className="pt-3 border-t border-white/30 flex items-center justify-between">
              <span className="font-bold">Total à payer aux partenaires:</span>
              <span className="text-2xl font-bold">{totalAPayer.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-90">Déjà payé:</span>
              <span className="text-xl font-bold">{totalPaye.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-90">Reste à payer:</span>
              <span className="text-xl font-bold">{(totalAPayer - totalPaye).toLocaleString()} FCFA</span>
            </div>
          </div>

          {/* Bouton d'export */}
          <button className="w-full mt-4 bg-white text-green-700 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <FiDownload size={20} />
            Télécharger le rapport PDF
          </button>
        </div>
      </div>

      {/* Modal d'enregistrement de paiement */}
      {selectedPartner && (
        <RecordPaymentModal 
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onSaveSuccess={handleSavePayment}
        />
      )}

      {/* Modal de visualisation de preuve */}
      {selectedPayment && (
        <PaymentProofModal 
          payment={{
            partenaire: selectedPayment.nom,
            date: formatDate(selectedPayment.datePaiement),
            nombreLivraisons: selectedPayment.livraisonsEffectuees,
            montantPaye: selectedPayment.montantPaye,
            captureEcran: selectedPayment.captureEcran
          }}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}