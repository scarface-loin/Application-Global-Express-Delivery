import React, { useState, useEffect } from 'react';
import { 
  FiCalendar,
  FiDollarSign,
  FiTruck,
  FiCheckCircle,
  FiImage,
  FiUpload,
  FiX,
  FiUser,
  FiFileText,
  FiDownload,
  FiEye,
  FiClock,
  FiAlertCircle,
  FiMessageSquare
} from 'react-icons/fi';
import { fetchDailySummary, savePartnerPayment } from './logic/DailySummaryLogic';

// ─────────────────────────────────────────────────────────────────────────────
// 1. MODAL PREUVE (Visualisation)
// ─────────────────────────────────────────────────────────────────────────────
function PaymentProofModal({ payment, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                <FiImage className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Preuve de paiement</h2>
                <p className="text-sm text-gray-600">{payment.partenaireNom || "Partenaire"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiX className="text-gray-600" size={24} />
            </button>
          </div>

          <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date paiement:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(payment.datePaiement).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Montant versé:</span>
                <span className="font-bold text-green-700">{payment.montantPaye?.toLocaleString()} FCFA</span>
              </div>
              {/* Affichage de la justification si elle existe */}
              {payment.justification && (
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <span className="block text-gray-500 text-xs mb-1">Note / Justification :</span>
                  <p className="text-gray-800 italic bg-white p-2 rounded border border-gray-200">
                    "{payment.justification}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Image justificative</h3>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-100 min-h-[200px] flex items-center justify-center">
              {payment.captureEcran ? (
                <img 
                  src={payment.captureEcran} 
                  alt="Preuve" 
                  className="w-full h-auto object-contain"
                />
              ) : (
                <span className="text-gray-400">Image indisponible</span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MODAL ENREGISTREMENT (Action)
// ─────────────────────────────────────────────────────────────────────────────
function RecordPaymentModal({ partner, dateBilan, onClose, onSaveSuccess }) {
  const [montantPaye, setMontantPaye] = useState(partner.montantAPayer); 
  const [justification, setJustification] = useState(''); // État pour la justification
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calcul dynamique de l'écart
  const montantTheorique = parseFloat(partner.montantAPayer) || 0;
  const montantSaisi = parseFloat(montantPaye) || 0;
  const ecart = montantSaisi - montantTheorique;
  const hasGap = Math.abs(ecart) > 5; // Tolérance de 5 FCFA

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSave = async () => {
    if (montantSaisi <= 0) {
      alert('Montant invalide');
      return;
    }
    
    // Validation Justification
    if (hasGap && !justification.trim()) {
      alert(`⚠️ Le montant diffère de ${ecart} FCFA. Vous devez obligatoirement saisir une justification.`);
      return;
    }

    if (!file) {
      alert('La preuve de paiement est obligatoire');
      return;
    }

    setLoading(true);
    try {
      // CORRECTION: On passe un objet complet comme défini dans DailySummaryLogic.js update
      const result = await savePartnerPayment({
        partnerId: partner.id,
        partnerName: partner.nom,
        dateBilan: dateBilan,
        montantPaye: montantSaisi,
        montantTheorique: montantTheorique,
        justification: justification,
        imageFile: file
      });
      
      onSaveSuccess(partner.id, montantSaisi, result.captureEcranUrl, result.datePaiement, justification);
      onClose();
    } catch (error) {
      alert("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
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
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <FiX className="text-gray-600" size={24} />
            </button>
          </div>

          {/* Récapitulatif rapide */}
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
             <div className="flex justify-between items-center mb-1">
               <span className="text-gray-600 text-sm">À payer (Théorique) :</span>
               <span className="font-bold text-blue-700 text-lg">{montantTheorique.toLocaleString()} FCFA</span>
             </div>
             <p className="text-xs text-blue-600">Basé sur {partner.livraisonsEffectuees} livraisons validées.</p>
          </div>

          {/* Formulaire */}
          <div className="space-y-5 mb-6">
            {/* Champ Montant */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Montant versé</label>
              <div className="relative">
                <input
                  type="number"
                  value={montantPaye}
                  onChange={(e) => setMontantPaye(e.target.value)}
                  className={`w-full pl-4 pr-12 py-3 border-2 rounded-xl outline-none font-semibold transition-colors ${hasGap ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-gray-200 focus:border-blue-500'}`}
                />
                <span className="absolute right-4 top-3 text-gray-500 font-bold">FCFA</span>
              </div>
              {hasGap && (
                <p className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                  <FiAlertCircle /> Écart détecté de {ecart > 0 ? '+' : ''}{ecart} FCFA
                </p>
              )}
            </div>

            {/* Champ Justification (Visible uniquement si écart) */}
            {hasGap && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FiMessageSquare className="text-amber-500"/> 
                  Justification <span className="text-red-500 text-xs">(Obligatoire)</span>
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ex: Retenue pour colis endommagé..."
                  rows="2"
                  className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 outline-none text-sm bg-amber-50/30"
                ></textarea>
              </div>
            )}

            {/* Champ Preuve */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Preuve (Capture d'écran)</label>
              {!preview ? (
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all group">
                  <FiUpload className="text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" size={32} />
                  <span className="text-sm text-gray-600 group-hover:text-blue-600">Cliquer pour uploader</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={preview} alt="Aperçu" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="bg-white text-red-500 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-red-50"
                      >
                        Changer
                      </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
              Annuler
            </button>
            <button 
              onClick={handleSave} 
              disabled={loading}
              className={`flex-1 py-3 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-70 transition-all ${hasGap ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
              {loading ? 'Envoi...' : (hasGap ? 'Justifier & Payer' : 'Confirmer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
export default function DailySummaryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [partnersData, setPartnersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'paye', 'non_paye'
  
  // Modals state
  const [selectedPartnerForPayment, setSelectedPartnerForPayment] = useState(null);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);

  // Charger les données quand la date change
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDailySummary(selectedDate);
      setPartnersData(data);
    } catch (error) {
      console.error(error);
      alert("Erreur chargement: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Callback après paiement réussi
  const handlePaymentSuccess = (partnerId, amount, proofUrl, datePaiement, justification) => {
    setPartnersData(prev => prev.map(p => {
      if (p.id === partnerId) {
        return {
          ...p,
          statut: 'paye',
          montantPaye: amount,
          captureEcran: proofUrl,
          datePaiement: datePaiement,
          justification: justification // Mise à jour locale
        };
      }
      return p;
    }));
  };

  const filteredPartners = partnersData.filter(p => filter === 'all' ? true : p.statut === filter);

  // Totaux
  const stats = {
    livraisons: partnersData.reduce((acc, p) => acc + p.livraisonsEffectuees, 0),
    brut: partnersData.reduce((acc, p) => acc + p.totalLivraisons, 0),
    frais: partnersData.reduce((acc, p) => acc + p.fraisLivraison, 0),
    netAPayer: partnersData.reduce((acc, p) => acc + p.montantAPayer, 0),
    dejaPaye: partnersData.filter(p => p.statut === 'paye').reduce((acc, p) => acc + (p.montantPaye || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & Date Picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiFileText className="text-green-600" />
              Bilan Partenaires
            </h1>
            <p className="text-gray-500 text-sm">Courses partenaires & Reversements</p>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <FiCalendar className="text-gray-500 ml-2" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none text-gray-700 font-semibold cursor-pointer"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<FiTruck className="text-blue-600" />} 
            label="Livraisons" 
            value={stats.livraisons} 
            bgColor="bg-blue-50"
          />
          <StatCard 
            icon={<FiDollarSign className="text-purple-600" />} 
            label="Total Brut" 
            value={stats.brut.toLocaleString()} 
            sub="FCFA"
            bgColor="bg-purple-50"
          />
           <StatCard 
            icon={<FiAlertCircle className="text-orange-600" />} 
            label="Net à reverser" 
            value={stats.netAPayer.toLocaleString()} 
            sub="FCFA"
            bgColor="bg-orange-50"
          />
          <StatCard 
            icon={<FiCheckCircle className="text-green-600" />} 
            label="Déjà Payé" 
            value={stats.dejaPaye.toLocaleString()} 
            sub="FCFA"
            bgColor="bg-green-50"
          />
        </div>

        {/* Filtres & Liste */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Tabs Filtres */}
          <div className="flex border-b border-gray-100 p-2 gap-2">
             {['all', 'non_paye', 'paye'].map((f) => (
               <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
               >
                 {f === 'all' ? 'Tous' : f === 'non_paye' ? 'À payer' : 'Payés'}
               </button>
             ))}
          </div>

          {/* Loading / Empty / List */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Calcul du bilan en cours...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FiUser size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Aucun partenaire trouvé pour cette date.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPartners.map((partner) => (
                <div key={partner.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    
                    {/* Info Partenaire */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-3 rounded-xl ${partner.statut === 'paye' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {partner.statut === 'paye' ? <FiCheckCircle size={20} /> : <FiClock size={20} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{partner.nom}</h3>
                        <p className="text-xs text-gray-500">{partner.type} • {partner.livraisonsEffectuees} course(s)</p>
                        
                        {/* Détail rapide montants */}
                        <div className="mt-2 text-sm flex items-center gap-3 text-gray-600 flex-wrap">
                          <span>Brut: {partner.totalLivraisons.toLocaleString()}</span>
                          <span className="text-red-500">Frais: -{partner.fraisLivraison.toLocaleString()}</span>
                          <span className="font-bold text-gray-900 border-l pl-3">Net: {partner.montantAPayer.toLocaleString()}</span>
                          {partner.montantPaye && partner.montantPaye !== partner.montantAPayer && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1">
                               Ajusté
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end w-full md:w-auto">
                      {partner.statut === 'non_paye' ? (
                        <button
                          onClick={() => setSelectedPartnerForPayment(partner)}
                          className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-sm transition-all flex items-center gap-2"
                        >
                          <FiDollarSign /> Payer
                        </button>
                      ) : (
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-700 mb-1">Payé {partner.montantPaye.toLocaleString()} FCFA</p>
                          <button
                            onClick={() => setSelectedPaymentProof(partner)}
                            className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center justify-end gap-1"
                          >
                            <FiEye size={12} /> Voir preuve & détails
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton Export PDF (Visuel uniquement pour l'instant) */}
        <div className="text-center pt-4">
          <button className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center justify-center gap-2 mx-auto">
            <FiDownload /> Télécharger le rapport global (PDF)
          </button>
        </div>

      </div>

      {/* Modals */}
      {selectedPartnerForPayment && (
        <RecordPaymentModal 
          partner={selectedPartnerForPayment}
          dateBilan={selectedDate}
          onClose={() => setSelectedPartnerForPayment(null)}
          onSaveSuccess={handlePaymentSuccess}
        />
      )}

      {selectedPaymentProof && (
        <PaymentProofModal 
          payment={selectedPaymentProof}
          onClose={() => setSelectedPaymentProof(null)}
        />
      )}

    </div>
  );
}

// Composant utilitaire
const StatCard = ({ icon, label, value, sub, bgColor }) => (
  <div className={`${bgColor} p-4 rounded-xl border border-gray-100 shadow-sm`}>
    <div className="flex items-center gap-2 mb-1 opacity-70">
      {icon}
      <span className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</span>
    </div>
    <p className="text-xl md:text-2xl font-bold text-gray-900">
      {value} <span className="text-xs font-normal text-gray-500">{sub}</span>
    </p>
  </div>
);