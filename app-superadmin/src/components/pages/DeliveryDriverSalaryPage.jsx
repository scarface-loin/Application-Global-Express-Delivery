import React, { useState, useEffect, useCallback } from 'react';
import {
    FiDollarSign, FiCheckCircle, FiX, FiFileText,
    FiSettings, FiDownload, FiAlertCircle, FiList,
    FiArrowLeft, FiChevronDown, FiChevronUp, FiAward, FiCalendar
} from 'react-icons/fi';

import DeliveryLoader from '../common/DeliveryLoader';
import motoGif from '../../assets/moto-livraison.gif';

import {
    fetchSalaryData, updateDriverSalaryConfig, addSalaryDeduction, cloturerCycle, payerCycle,
    generateSalaryPDF, generateIndividualSalaryPDF, downloadSalaryPDFDirectly, formatCycleLabel, DUREE_CYCLE,
    saveSalarySnapshot
} from './logic/DeliveryDriverSalaryPageLogic';

// ===================================================================================
// UTILITAIRES
// ===================================================================================
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0 FCFA';
    return `${Math.abs(Math.round(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} FCFA`;
};

const statutCycleBadge = (statut) => {
    switch (statut) {
        case 'paye': return 'bg-green-100 text-green-700';
        case 'cloture': return 'bg-yellow-100 text-yellow-700';
        case 'ecoule': return 'bg-orange-100 text-orange-700';
        default: return 'bg-indigo-100 text-indigo-700';
    }
};

const statutCycleLabel = (statut) => {
    switch (statut) {
        case 'paye': return '✓ Payé';
        case 'cloture': return '🔒 Clôturé';
        case 'ecoule': return '⏰ Écoulé';
        default: return '▶ En cours';
    }
};

// ===================================================================================
// MODAUX SIMPLES
// ===================================================================================
const SalaryConfigModal = ({ config, onClose, onSave }) => { /* ... Code existant inchangé ... */ };
const DriverConfigModal = ({ livreur, onClose, onSave }) => { /* ... Code existant inchangé ... */ };
const AddDeductionModal = ({ livreur, onClose, onSave }) => { /* ... Code existant inchangé ... */ };
const PayCycleModal = ({ livreur, cycle, onClose, onSave }) => { /* ... Code existant inchangé ... */ };

// ===================================================================================
// CARTE DÉTAIL D'UN CYCLE — Journal Financier MJS
// ===================================================================================
const CycleDetailCard = ({ cycle, livreur, onPayCycle, onClotureCycle, onGenerateBulletin, pdfGenerating, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);

    const borderColor = cycle.statut === 'paye' ? 'border-green-200' : cycle.statut === 'cloture' ? 'border-yellow-200' : cycle.statut === 'ecoule' ? 'border-orange-200' : 'border-indigo-200';

    return (
        <div className={`border-2 ${borderColor} rounded-2xl overflow-hidden bg-white`}>
            {/* Header Cliquable */}
            <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${statutCycleBadge(cycle.statut)}`}>
                        {cycle.numero}
                    </div>
                    <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-800 text-sm">Cycle {cycle.numero}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statutCycleBadge(cycle.statut)}`}>{statutCycleLabel(cycle.statut)}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">
                            {new Date(cycle.dateDebut).toLocaleDateString('fr-FR')} → {new Date(cycle.dateFin).toLocaleDateString('fr-FR')}
                            {' · '}{cycle.joursTravailles}/{DUREE_CYCLE}j
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Net</p>
                        <p className="text-sm font-black text-indigo-700">{formatCurrency(cycle.salaireNet)}</p>
                    </div>
                    {open ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
                </div>
            </button>

            {/* Contenu Déplié */}
            {open && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                    <div className="flex items-center justify-between pt-3 sm:hidden">
                        <span className="text-xs text-gray-400 font-bold uppercase">Net à payer</span>
                        <span className="text-lg font-black text-indigo-700">{formatCurrency(cycle.salaireNet)}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Présence</p>
                            <p className="font-bold text-gray-800">{cycle.joursTravailles}<span className="text-xs font-normal text-gray-400">/{DUREE_CYCLE}j</span></p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Livraisons</p>
                            <p className="font-bold text-gray-800">{cycle.livraisonsEffectuees}<span className="text-xs font-normal text-gray-400">/{cycle.livraisonsTotal}</span></p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Taux</p>
                            <p className={`font-bold ${cycle.tauxSucces >= 80 ? 'text-green-600' : cycle.tauxSucces >= 60 ? 'text-orange-500' : 'text-red-500'}`}>{cycle.tauxSucces}%</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Retenues Nettes</p>
                            <p className={`font-bold text-sm ${cycle.totalManquants > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {cycle.totalManquants > 0 ? `-${formatCurrency(cycle.totalManquants)}` : '—'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Salaire de base</span><span className="font-bold text-gray-700">{formatCurrency(cycle.salaireBase)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Primes livraisons</span><span className="font-bold text-green-600">+{formatCurrency(cycle.primesLivraisons)}</span></div>
                        {cycle.totalManquants > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Total Dettes / Retenues</span><span className="font-bold text-red-600">-{formatCurrency(cycle.totalManquants)}</span></div>}
                        <div className="flex justify-between text-xs font-black border-t border-gray-200 pt-2"><span className="text-indigo-700">NET À PAYER</span><span className="text-indigo-700">{formatCurrency(cycle.salaireNet)}</span></div>
                    </div>

                    {/* NOUVEAU: Journal Financier */}
                    {cycle.manquants && cycle.manquants.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                            <p className="font-bold text-gray-800 text-xs mb-2 flex items-center gap-1">
                                <FiList size={13} /> Journal Financier
                            </p>
                            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {cycle.manquants.map((m, idx) => {
                                    const isNeutral = m.type === 'garage_valide';
                                    const textColor = isNeutral ? 'text-green-700' : 'text-red-700';
                                    const bgColor = isNeutral ? 'bg-green-50' : 'bg-transparent';
                                    const amountDisplay = isNeutral ? "Justifié (Entreprise)" : `-${formatCurrency(Math.abs(m.montant))}`;
                                    
                                    return (
                                        <li key={idx} className={`flex justify-between items-start gap-2 border-b border-gray-100 pb-1.5 last:border-0 ${bgColor} p-1 rounded`}>
                                            <div className="min-w-0">
                                                {m.date && m.date !== '-' && <span className="text-[10px] text-gray-400 block">{m.date}</span>}
                                                <span className={`text-xs ${textColor}`}>{isNeutral ? '🟢 ' : '🔴 '}{m.motif}</span>
                                            </div>
                                            <span className={`text-[11px] font-bold whitespace-nowrap flex-shrink-0 ${textColor}`}>
                                                {amountDisplay}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {cycle.statut === 'paye' && cycle.datePaiement && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                            <FiCheckCircle size={14} className="text-green-600 flex-shrink-0" />
                            <span className="text-xs text-green-700 font-bold">Payé le {new Date(cycle.datePaiement).toLocaleDateString('fr-FR')} · {formatCurrency(cycle.montantPaye)}</span>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                        {cycle.statut === 'ecoule' && <button onClick={() => onClotureCycle(livreur, cycle)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors">Clôturer</button>}
                        {cycle.statut === 'cloture' && <button onClick={() => onPayCycle(livreur, cycle)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"><FiDollarSign size={12} /> Payer</button>}
                        <button onClick={() => onGenerateBulletin(livreur, cycle)} disabled={pdfGenerating || cycle.joursTravailles === 0} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors disabled:opacity-40"><FiFileText size={12} /> Bulletin PDF</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===================================================================================
// MODAL DÉTAILS LIVREUR
// ===================================================================================
const DriverDetailsModal = ({ livreur, onClose, onPayCycle, onClotureCycle, onGenerateBulletin, pdfGenerating }) => {
    const cycles = [...(livreur.cycles || [])].reverse(); 
    const detteCourante = livreur.cycleEnCours ? livreur.cycleEnCours.totalManquants : 0;
    const cycleEnCours = livreur.cycleEnCours;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] sm:mx-4">
                <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-gray-100">
                    <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="flex-shrink-0 p-2 rounded-xl hover:bg-gray-100 text-gray-500"><FiArrowLeft size={20} /></button>
                        <span className="text-4xl flex-shrink-0">{livreur.photo}</span>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-xl font-black text-gray-900 truncate" title={livreur.nom}>{livreur.nom}</h2>
                            <p className="text-xs text-gray-400">
                                Cycles de {DUREE_CYCLE} jours · <span className={`font-bold ${detteCourante > 0 ? 'text-red-500' : 'text-gray-400'}`}>{detteCourante > 0 ? `Dette : -${formatCurrency(detteCourante)}` : 'Solde OK'}</span>
                            </p>
                        </div>
                        <button onClick={onClose} className="hidden sm:flex flex-shrink-0 p-2 rounded-xl hover:bg-gray-100 text-gray-400"><FiX size={20} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
                    {cycleEnCours && cycleEnCours.joursTravailles > 0 && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <p className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1"><FiAward size={12} /> Cycle en cours</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statutCycleBadge(cycleEnCours.statut)}`}>{statutCycleLabel(cycleEnCours.statut)}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="bg-white rounded-xl p-3"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Présence</p><p className="text-base font-bold">{cycleEnCours.joursTravailles}<span className="text-xs font-normal text-gray-400">/{DUREE_CYCLE}j</span></p></div>
                                <div className="bg-white rounded-xl p-3"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Livraisons</p><p className="text-base font-bold">{cycleEnCours.livraisonsEffectuees}/{cycleEnCours.livraisonsTotal}</p></div>
                                <div className="bg-white rounded-xl p-3"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Salaire brut</p><p className="text-base font-bold text-indigo-700">{formatCurrency(cycleEnCours.salaireBrut)}</p></div>
                                <div className="bg-white rounded-xl p-3"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Net à payer</p><p className="text-base font-bold text-green-700">{formatCurrency(cycleEnCours.salaireNet)}</p></div>
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><FiCalendar size={13} /> Historique ({cycles.length})</h3>
                        {cycles.length === 0 ? (
                            <div className="text-center py-10 text-gray-400"><FiAlertCircle size={32} className="mx-auto mb-2 opacity-40" /><p className="text-sm">Aucune activité</p></div>
                        ) : (
                            <div className="space-y-2">
                                {cycles.map((cycle, idx) => <CycleDetailCard key={cycle.numero} cycle={cycle} livreur={livreur} onPayCycle={onPayCycle} onClotureCycle={onClotureCycle} onGenerateBulletin={onGenerateBulletin} pdfGenerating={pdfGenerating} defaultOpen={idx === 0} />)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
                    <button onClick={onClose} className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm"><FiArrowLeft size={16} /> Retour à la liste</button>
                </div>
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
    const [filter, setFilter] = useState('all');
    const [modal, setModal] = useState({ type: null, data: null, extra: null });
    const [showConfigModal, setShowConfigModal] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchSalaryData();
            setLivreurs(data);
            await saveSalarySnapshot(data); // MAJ transparente de l'app livreur
        } catch (err) { alert(err.message); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const closeModal = () => setModal({ type: null, data: null, extra: null });

    const handleGenerateFullReport = async () => {
        try { setPdfGenerating(true); await generateSalaryPDF(livreurs); }
        catch (err) { alert('❌ ' + err.message); } finally { setPdfGenerating(false); }
    };

    const handleGenerateIndividualBulletin = async (livreur, cycle) => {
        try { setPdfGenerating(true); await generateIndividualSalaryPDF(livreur, cycle); }
        catch (err) { alert('❌ ' + err.message); } finally { setPdfGenerating(false); }
    };

    const handleDownloadPDFDirectly = async () => {
        try { setPdfGenerating(true); await downloadSalaryPDFDirectly(livreurs); }
        catch (err) { alert('❌ ' + err.message); } finally { setPdfGenerating(false); }
    };

    const filteredLivreurs = livreurs.filter(l => {
        if (filter === 'all') return true;
        if (filter === 'non_paye') return l.cycleEnCours?.statut !== 'paye';
        if (filter === 'paye') return l.cycleEnCours?.statut === 'paye';
        return true;
    });

    const totalNet = livreurs.reduce((sum, l) => sum + (l.cycleEnCours?.salaireNet || 0), 0);

    if (loading) return <DeliveryLoader gifUrl={motoGif} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #c7d2fe; border-radius: 10px; }`}</style>
            <div className="max-w-4xl mx-auto px-4 py-6">
                <header className="mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><FiDollarSign className="text-white" size={24} /></div>
                            <div><h1 className="text-2xl font-bold">Salaires Livreurs</h1><p className="text-xs text-gray-400">Cycles de {DUREE_CYCLE} jours travaillés</p></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <button onClick={handleGenerateFullReport} disabled={pdfGenerating || livreurs.length === 0} className="bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"><FiFileText size={20} /> Rapport Complet PDF</button>
                        <button onClick={handleDownloadPDFDirectly} disabled={pdfGenerating || livreurs.length === 0} className="bg-green-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"><FiDownload size={20} /> Télécharger PDF Direct</button>
                    </div>

                    <div className="flex gap-2">
                        {[['all', `Tous (${livreurs.length})`], ['non_paye', 'À payer'], ['paye', 'Payés']].map(([val, label]) => (
                            <button key={val} onClick={() => setFilter(val)} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${filter === val ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border hover:bg-gray-50'}`}>{label}</button>
                        ))}
                    </div>
                </header>

                <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl mb-8">
                    <p className="text-xs font-bold uppercase opacity-80">Masse salariale nette des cycles en cours</p>
                    <p className="text-3xl font-black">{totalNet.toLocaleString()} FCFA</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLivreurs.map((livreur) => {
                        const cycle = livreur.cycleEnCours;
                        const bilanCycle = cycle?.totalManquants || 0;
                        return (
                            <div key={livreur.id} className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-4xl flex-shrink-0">{livreur.photo}</span>
                                    <div className="flex-1 min-w-0">
                                        {/* NOM RACCOURCI AVEC TRUNCATE ICI */}
                                        <h3 className="font-bold text-gray-900 truncate" title={livreur.nom}>
                                            {livreur.nom}
                                        </h3>
                                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cycle?.tauxSucces >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {cycle?.tauxSucces || 0}% Succès
                                        </span>
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statutCycleBadge(cycle?.statut)}`}>{statutCycleLabel(cycle?.statut)}</span>
                                        {bilanCycle > 0 && <span className="text-[10px] font-bold whitespace-nowrap text-red-500">Dette: {formatCurrency(bilanCycle)}</span>}
                                    </div>
                                </div>

                                {cycle && cycle.joursTravailles > 0 ? (
                                    <>
                                        <div className="text-xs text-gray-400 font-medium truncate">Cycle {cycle.numero} · {new Date(cycle.dateDebut).toLocaleDateString('fr-FR')} → {new Date(cycle.dateFin).toLocaleDateString('fr-FR')}</div>
                                        <div className="flex justify-between items-end">
                                            <div><p className="text-[10px] text-gray-400 font-bold uppercase">Base + Primes</p><p className="text-sm font-bold">{formatCurrency(cycle.salaireBrut)}</p></div>
                                            <div className="text-right"><p className="text-[10px] text-gray-400 font-bold uppercase">Net à payer</p><p className="text-lg font-black text-indigo-700">{formatCurrency(cycle.salaireNet)}</p></div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-2xl p-3 text-center">
                                            <div className="flex flex-col justify-center"><p className="text-[9px] text-gray-400 uppercase truncate">Assigné</p><p className="font-bold">{cycle.livraisonsTotal}</p></div>
                                            <div className="flex flex-col justify-center"><p className="text-[9px] text-gray-400 uppercase truncate">Réussi</p><p className="font-bold text-green-600">{cycle.livraisonsEffectuees}</p></div>
                                            <div className="flex flex-col justify-center"><p className="text-[9px] text-gray-400 uppercase truncate">Présence</p><p className="font-bold text-indigo-600">{cycle.joursTravailles}<span className="text-[9px] text-gray-400 font-normal">/{DUREE_CYCLE}j</span></p></div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4 text-gray-400 text-sm"><FiAlertCircle className="mx-auto mb-1" />Aucune activité enregistrée</div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setModal({ type: 'details', data: livreur })} className="bg-gray-100 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"><FiList size={14} /> Détails / Payer</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODALS */}
            {modal.type === 'details' && (
                <DriverDetailsModal
                    livreur={modal.data}
                    onClose={closeModal}
                    onPayCycle={async (livreur, cycle) => {
                        if (window.confirm('Marquer ce cycle comme payé ?')) {
                            await payerCycle(livreur.id, livreur.nom, cycle, cycle.salaireNet, new File([""], "placeholder"));
                            loadData(); closeModal();
                        }
                    }}
                    onClotureCycle={async (livreur, cycle) => {
                        if (window.confirm('Clôturer et figer la dette de ce cycle ?')) {
                            await cloturerCycle(livreur.id, livreur.nom, cycle);
                            loadData();
                        }
                    }}
                    onGenerateBulletin={handleGenerateIndividualBulletin}
                    pdfGenerating={pdfGenerating}
                />
            )}
        </div>
    );
}