import React, { useState, useEffect, useCallback } from 'react';
import {
    FiDollarSign, FiCalendar, FiCheckCircle, FiX, FiEdit, FiSave,
    FiPackage, FiClock, FiSettings, FiEye, FiUpload, FiDownload,
    FiTrendingUp, FiMinus, FiPieChart, FiFileText
} from 'react-icons/fi';

import DeliveryLoader from '../common/DeliveryLoader';
import motoGif from '../../assets/moto-livraison.gif';

// IMPORT DES FONCTIONS DE LOGIQUE (y compris les fonctions PDF)
import {
    fetchSalaryData,
    updateDriverSalaryConfig,
    addSalaryDeduction,
    saveSalaryPayment,
    generateSalaryPDF,
    generateIndividualSalaryPDF,
    downloadSalaryPDFDirectly
} from './logic/DeliveryDriverSalaryPageLogic';

// ===================================================================================
// COMPOSANTS MODAUX
// ===================================================================================

const SalaryConfigModal = ({ config, onClose, onSave }) => {
    const [salaireBase, setSalaireBase] = useState(config.salaireBase);
    const [primeParLivraison, setPrimeParLivraison] = useState(config.primeParLivraison);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
                <h2 className="text-xl font-bold">Configuration Globale</h2>
                <div><label className="block text-sm font-bold mb-2">Salaire de Base (FCFA)</label><input type="number" value={salaireBase} onChange={(e) => setSalaireBase(Number(e.target.value))} className="w-full px-4 py-3 border-2 rounded-xl" /></div>
                <div><label className="block text-sm font-bold mb-2">Prime par Livraison (FCFA)</label><input type="number" value={primeParLivraison} onChange={(e) => setPrimeParLivraison(Number(e.target.value))} className="w-full px-4 py-3 border-2 rounded-xl" /></div>
                <div className="flex gap-2"><button onClick={() => onSave(salaireBase, primeParLivraison)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Enregistrer</button><button onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Annuler</button></div>
            </div>
        </div>
    );
};

const DriverConfigModal = ({ livreur, onClose, onSave }) => {
    const [salaireBase, setSalaireBase] = useState(livreur.salaireBase);
    const [primeParLivraison, setPrimeParLivraison] = useState(livreur.primeParLivraison);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
                <h2 className="text-xl font-bold">Configuration - {livreur.nom}</h2>
                <div><label className="block text-sm font-bold mb-2">Salaire de Base (FCFA)</label><input type="number" value={salaireBase} onChange={(e) => setSalaireBase(Number(e.target.value))} className="w-full px-4 py-3 border-2 rounded-xl" /></div>
                <div><label className="block text-sm font-bold mb-2">Prime par Livraison (FCFA)</label><input type="number" value={primeParLivraison} onChange={(e) => setPrimeParLivraison(Number(e.target.value))} className="w-full px-4 py-3 border-2 rounded-xl" /></div>
                <div className="flex gap-2"><button onClick={() => onSave(livreur.id, salaireBase, primeParLivraison)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Enregistrer</button><button onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Annuler</button></div>
            </div>
        </div>
    );
};

const AddDeductionModal = ({ livreur, onClose, onSave }) => {
    const [montant, setMontant] = useState('');
    const [motif, setMotif] = useState('');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
                <h2 className="text-xl font-bold text-red-600">Ajouter une Retenue - {livreur.nom}</h2>
                <div><label className="block text-sm font-bold mb-2">Montant (FCFA)</label><input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl" placeholder="0" /></div>
                <div><label className="block text-sm font-bold mb-2">Motif</label><textarea value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl" rows="3" placeholder="Ex: Casse matériel..." /></div>
                <div className="flex gap-2"><button onClick={() => onSave(livreur.id, Number(montant), motif)} disabled={!montant || !motif} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">Ajouter Retenue</button><button onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Annuler</button></div>
            </div>
        </div>
    );
};

const PaySalaryModal = ({ livreur, onClose, onSave }) => {
    const [montant, setMontant] = useState(livreur.salaireNet);
    const [imageFile, setImageFile] = useState(null);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
                <h2 className="text-xl font-bold text-green-600">Paiement - {livreur.nom}</h2>
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4"><p className="text-sm text-gray-600">Salaire net à payer:</p><p className="text-2xl font-black text-green-700">{livreur.salaireNet.toLocaleString()} FCFA</p></div>
                <div><label className="block text-sm font-bold mb-2">Montant payé (FCFA)</label><input type="number" value={montant} onChange={(e) => setMontant(Number(e.target.value))} className="w-full px-4 py-3 border-2 rounded-xl" /></div>
                <div><label className="block text-sm font-bold mb-2">Capture écran paiement</label><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full px-4 py-3 border-2 rounded-xl" /></div>
                <div className="flex gap-2"><button onClick={() => onSave(livreur.id, montant, imageFile)} disabled={!imageFile || !montant} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">Confirmer Paiement</button><button onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Annuler</button></div>
            </div>
        </div>
    );
};

const DriverDetailsModal = ({ livreur, onClose, selectedPeriod }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 my-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-5xl">{livreur.photo}</span>
                        <div><h2 className="text-2xl font-bold">{livreur.nom}</h2><span className={`text-sm font-bold px-3 py-1 rounded-full ${livreur.statut === 'paye' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{livreur.statut === 'paye' ? 'Payé' : 'Non Payé'}</span></div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><FiX size={24} /></button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Période</p><p className="text-lg font-bold">{selectedPeriod}</p></div>
                    <div className="bg-green-50 rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Jours travaillés</p><p className="text-lg font-bold">{livreur.joursTravailles}</p></div>
                    <div className="bg-orange-50 rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Livraisons</p><p className="text-lg font-bold">{livreur.livraisonsEffectuees}/{livreur.livraisonsTotal}</p></div>
                    <div className="bg-purple-50 rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Taux de succès</p><p className="text-lg font-bold">{livreur.tauxSucces}%</p></div>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Salaire de base:</span><span className="font-bold">{livreur.salaireBase.toLocaleString()} F</span></div>
                    <div className="flex justify-between text-green-600"><span>Primes livraisons:</span><span className="font-bold">+{livreur.primesLivraisons.toLocaleString()} F</span></div>
                    <div className="flex justify-between text-red-600"><span>Manquants/Dettes:</span><span className="font-bold">-{livreur.totalManquants.toLocaleString()} F</span></div>
                    <div className="flex justify-between pt-2 border-t-2 font-bold text-lg text-indigo-700"><span>Net à payer:</span><span>{livreur.salaireNet.toLocaleString()} FCFA</span></div>
                </div>

                {livreur.statut === 'paye' && <div className="p-3 bg-green-50 border rounded-xl"><p className="text-sm font-bold text-green-700">Paiement effectué le {new Date(livreur.datePaiement).toLocaleDateString()}</p></div>}
            </div>
        </div>
    );
};

// ===================================================================================
// COMPOSANT PRINCIPAL
// ===================================================================================

export default function DeliveryDriverSalaryPage() {
    const [livreurs, setLivreurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [filter, setFilter] = useState('all');
    const [modal, setModal] = useState({ type: null, data: null });
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configGlobale, setConfigGlobale] = useState({ salaireBase: 50000, primeParLivraison: 250 });

    const loadData = useCallback(async () => {
        setLoading(true);
        try { 
            setLivreurs(await fetchSalaryData(selectedPeriod)); 
        } catch (err) { 
            alert(err.message); 
        } finally { 
            setLoading(false); 
        }
    }, [selectedPeriod]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSaveDriverConfig = async (id, base, prime) => { 
        try { 
            await updateDriverSalaryConfig(id, base, prime); 
            await loadData(); 
            setModal({ type: null, data: null }); 
        } catch(err) { 
            alert(err.message) 
        }
    };

    const handleAddDeduction = async (id, montant, motif) => { 
        try { 
            await addSalaryDeduction(id, "", montant, motif, selectedPeriod); 
            await loadData(); 
            setModal({ type: null, data: null }); 
        } catch(err){ 
            alert(err.message) 
        }
    };

    const handlePaySalary = async (id, montant, file) => { 
        try { 
            await saveSalaryPayment(id, "", montant, selectedPeriod, file); 
            await loadData(); 
            setModal({ type: null, data: null }); 
        } catch(err){ 
            alert(err.message) 
        }
    };

    // NOUVELLES FONCTIONS POUR LA GÉNÉRATION PDF
    const handleGenerateFullReport = async () => {
        try {
            setPdfGenerating(true);
            const result = await generateSalaryPDF(livreurs, selectedPeriod);
            
            if (result.success) {
                alert('✅ Rapport PDF généré avec succès!');
                window.open(result.url, '_blank');
            }
        } catch (error) {
            console.error('Erreur génération PDF:', error);
            alert('❌ ' + error.message);
        } finally {
            setPdfGenerating(false);
        }
    };

    const handleGenerateIndividualBulletin = async (livreur) => {
        try {
            setPdfGenerating(true);
            const result = await generateIndividualSalaryPDF(livreur, selectedPeriod);
            
            if (result.success) {
                alert(`✅ Bulletin généré pour ${livreur.nom}`);
                window.open(result.url, '_blank');
            }
        } catch (error) {
            console.error('Erreur génération bulletin:', error);
            alert('❌ ' + error.message);
        } finally {
            setPdfGenerating(false);
        }
    };

    const handleDownloadPDFDirectly = () => {
        try {
            setPdfGenerating(true);
            downloadSalaryPDFDirectly(livreurs, selectedPeriod);
            alert('✅ Téléchargement lancé!');
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            alert('❌ ' + error.message);
        } finally {
            setPdfGenerating(false);
        }
    };

    const filteredLivreurs = livreurs.filter(l => filter === 'all' || l.statut === filter);
    const totalNet = livreurs.reduce((sum, l) => sum + l.salaireNet, 0);

    if (loading) return <DeliveryLoader gifUrl={motoGif} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-4xl mx-auto px-4 py-6">
                <header className="mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
                                <FiDollarSign className="text-white" size={24} />
                            </div>
                            <h1 className="text-2xl font-bold">Salaires Livreurs</h1>
                        </div>
                        <button onClick={() => setShowConfigModal(true)} className="p-3 bg-white border-2 rounded-xl shadow-sm">
                            <FiSettings size={24} />
                        </button>
                    </div>

                    <input 
                        type="month" 
                        value={selectedPeriod} 
                        onChange={(e) => setSelectedPeriod(e.target.value)} 
                        className="w-full px-4 py-3 border-2 rounded-xl font-bold bg-white shadow-sm" 
                    />

                    {/* BOUTONS DE GÉNÉRATION PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <button 
                            onClick={handleGenerateFullReport}
                            disabled={pdfGenerating || livreurs.length === 0}
                            className="bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            {pdfGenerating ? (
                                <>⏳ Génération...</>
                            ) : (
                                <>
                                    <FiFileText size={20} />
                                    Rapport Complet PDF
                                </>
                            )}
                        </button>

                        <button 
                            onClick={handleDownloadPDFDirectly}
                            disabled={pdfGenerating || livreurs.length === 0}
                            className="bg-green-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            <FiDownload size={20} />
                            Télécharger PDF Direct
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => setFilter('all')} 
                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border'}`}
                        >
                            Tous ({livreurs.length})
                        </button>
                        <button 
                            onClick={() => setFilter('non_paye')} 
                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm ${filter === 'non_paye' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border'}`}
                        >
                            À payer
                        </button>
                    </div>
                </header>

                <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl mb-8">
                    <p className="text-xs font-bold uppercase opacity-80">Masse salariale totale</p>
                    <p className="text-3xl font-black">{totalNet.toLocaleString()} FCFA</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLivreurs.map((livreur) => (
                        <div key={livreur.id} className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{livreur.photo}</span>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{livreur.nom}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${livreur.tauxSucces >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {livreur.tauxSucces}% Succès
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Net à payer</p>
                                    <p className="text-lg font-black text-indigo-700">{livreur.salaireNet.toLocaleString()} F</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-2xl p-3 text-center">
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase">Assig.</p>
                                    <p className="font-bold">{livreur.livraisonsTotal}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase">Réuss.</p>
                                    <p className="font-bold text-green-600">{livreur.livraisonsEffectuees}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase">Jours</p>
                                    <p className="font-bold">{livreur.joursTravailles}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setModal({ type: 'details', data: livreur })} 
                                    className="bg-gray-100 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                                >
                                    <FiEye /> Détails
                                </button>
                                {livreur.statut === 'non_paye' ? (
                                    <button 
                                        onClick={() => setModal({ type: 'pay', data: livreur })} 
                                        className="bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs"
                                    >
                                        Payer
                                    </button>
                                ) : (
                                    <button className="bg-green-100 text-green-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                        <FiCheckCircle /> Payé
                                    </button>
                                )}
                            </div>
                            
                            {/* BOUTON BULLETIN INDIVIDUEL */}
                            <button
                                onClick={() => handleGenerateIndividualBulletin(livreur)}
                                disabled={pdfGenerating}
                                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"
                            >
                                <FiFileText size={16} />
                                Bulletin PDF
                            </button>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setModal({ type: 'config', data: livreur })} 
                                    className="flex-1 py-2 text-gray-400 hover:text-indigo-600 text-xs font-bold border rounded-lg"
                                >
                                    Config.
                                </button>
                                <button 
                                    onClick={() => setModal({ type: 'deduction', data: livreur })} 
                                    className="flex-1 py-2 text-gray-400 hover:text-red-600 text-xs font-bold border rounded-lg"
                                >
                                    Retenue
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Inclusions des Modales */}
            {showConfigModal && (
                <SalaryConfigModal 
                    config={configGlobale} 
                    onClose={() => setShowConfigModal(false)} 
                    onSave={(s,p) => { 
                        setConfigGlobale({salaireBase: s, primeParLivraison: p}); 
                        setShowConfigModal(false); 
                    }} 
                />
            )}
            {modal.type === 'config' && (
                <DriverConfigModal 
                    livreur={modal.data} 
                    onClose={() => setModal({type: null, data: null})} 
                    onSave={handleSaveDriverConfig} 
                />
            )}
            {modal.type === 'deduction' && (
                <AddDeductionModal 
                    livreur={modal.data} 
                    onClose={() => setModal({type: null, data: null})} 
                    onSave={handleAddDeduction} 
                />
            )}
            {modal.type === 'pay' && (
                <PaySalaryModal 
                    livreur={modal.data} 
                    onClose={() => setModal({type: null, data: null})} 
                    onSave={handlePaySalary} 
                />
            )}
            {modal.type === 'details' && (
                <DriverDetailsModal 
                    livreur={modal.data} 
                    onClose={() => setModal({type: null, data: null})} 
                    selectedPeriod={selectedPeriod} 
                />
            )}
        </div>
    );
}