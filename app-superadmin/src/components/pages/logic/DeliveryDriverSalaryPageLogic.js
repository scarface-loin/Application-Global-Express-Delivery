import { db, storage } from '../../../services/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  writeBatch,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================================
// CONSTANTES & UTILITAIRES DE BASE
// ============================================================================
export const DUREE_CYCLE = 25; // Durée fixe d'un cycle en jours de TRAVAIL

export const formatCycleLabel = (cycle) => {
  const debut = new Date(cycle.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fin = new Date(cycle.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `Cycle ${cycle.numero} — ${debut} au ${fin}`;
};

// Extrait la date "YYYY-MM-DD" de manière sécurisée (gère les dates strings et les Timestamps Firebase)
const toDayString = (dateInput) => {
  if (!dateInput) return null;
  try {
      const date = typeof dateInput?.toDate === 'function' ? dateInput.toDate() : new Date(dateInput);
      return date.toISOString().split('T')[0];
  } catch (e) {
      return null;
  }
};

// RÈGLE ALIGNÉE : Une livraison est réussie UNIQUEMENT si statut 'livre' ou 'partiel'
const isDeliverySuccessful = (delivery) => {
  return delivery.statut === 'livre' || delivery.statut === 'partiel';
};

// ============================================================================
// FETCH DONNÉES SALAIRES — Dette purement calculée depuis l'historique
// ============================================================================

export const fetchSalaryData = async () => {
  try {
    const livreursQuery = query(collection(db, "livreurs"));
    const livreursSnap = await getDocs(livreursQuery);

    // 1. Récupération globale alignée avec l'audit
    const [deliveriesSnap, partDeliveriesSnap, cyclesSnap, versementsSnap, garagesSnap] = await Promise.all([
      getDocs(collection(db, "livraisons")),
      getDocs(collection(db, "livraison_partenaire")),
      getDocs(collection(db, "cycles_livreurs")),
      getDocs(collection(db, "versements_livreurs")),
      getDocs(collection(db, "demandes_garage"))
    ]);

    // Regroupement de TOUTES les livraisons (Interne + Partenaire)
    const deliveriesByLivreur = {};
    const processDelivery = (d) => {
      const data = d.data();
      if (data.livreurId) {
        if (!deliveriesByLivreur[data.livreurId]) deliveriesByLivreur[data.livreurId] = [];
        deliveriesByLivreur[data.livreurId].push(data);
      }
    };
    deliveriesSnap.forEach(processDelivery);
    partDeliveriesSnap.forEach(processDelivery);

    const cyclesByLivreur = {};
    cyclesSnap.forEach(c => {
      const data = { id: c.id, ...c.data() };
      if (data.livreurId) {
        if (!cyclesByLivreur[data.livreurId]) cyclesByLivreur[data.livreurId] = [];
        cyclesByLivreur[data.livreurId].push(data);
      }
    });

    const versementsByLivreur = {};
    versementsSnap.forEach(v => {
      const data = v.data();
      if (data.livreurId) {
        if (!versementsByLivreur[data.livreurId]) versementsByLivreur[data.livreurId] = [];
        versementsByLivreur[data.livreurId].push(data);
      }
    });

    // Création de la Map de Garage (Clé: livreurId_YYYY-MM-DD)
    const garageMap = new Map();
    garagesSnap.forEach(g => {
        const data = g.data();
        if (data.livreurId) {
            const day = toDayString(data.dateCreation || data.createdAt);
            if (day) garageMap.set(`${data.livreurId}_${day}`, data);
        }
    });

    const livreursData = [];
    livreursSnap.forEach(livreurDoc => {
      const livreur = { id: livreurDoc.id, ...livreurDoc.data() };
      const livreurId = livreur.id;
      
      const allDeliveries = deliveriesByLivreur[livreurId] || [];
      const cyclesEnregistres = cyclesByLivreur[livreurId] || [];

      // Extraire jours travaillés via dateValidation (ou createdAt par défaut)
      const uniqueDatesSet = new Set();
      allDeliveries.forEach(d => {
        const dateStr = d.dateValidation || d.createdAt || d.dateCreation;
        const day = toDayString(dateStr);
        if (day) uniqueDatesSet.add(day);
      });
      const uniqueDates = Array.from(uniqueDatesSet).sort();

      const cyclesDynamiques = [];
      let numero = 1;
      let lastCycleFinObj = null;

      // Création des tranches de 25 jours
      for (let i = 0; i < uniqueDates.length; i += DUREE_CYCLE) {
        const chunk = uniqueDates.slice(i, i + DUREE_CYCLE);
        
        let dateDebutObj;
        if (lastCycleFinObj) {
            dateDebutObj = new Date(lastCycleFinObj.getTime() + 1);
        } else {
            dateDebutObj = new Date(chunk[0]);
            dateDebutObj.setUTCHours(0, 0, 0, 0);
        }

        let dateFinObj = new Date(chunk[chunk.length - 1]);
        const enregistre = cyclesEnregistres.find(ce => ce.cycleNumero === numero);
        let statut = 'en_cours';

        if (enregistre) {
            statut = enregistre.statut;
            if (enregistre.dateDebut) dateDebutObj = new Date(enregistre.dateDebut);
            if (enregistre.dateFin) dateFinObj = new Date(enregistre.dateFin);
            lastCycleFinObj = new Date(dateFinObj);
        } else if (chunk.length === DUREE_CYCLE) {
            statut = 'ecoule';
            dateFinObj.setUTCHours(23, 59, 59, 999);
            lastCycleFinObj = new Date(dateFinObj);
        } else {
            statut = 'en_cours';
            const now = new Date();
            if (dateFinObj < now) dateFinObj = now;
            dateFinObj.setUTCHours(23, 59, 59, 999);
            lastCycleFinObj = new Date(dateFinObj);
        }

        cyclesDynamiques.push({
            numero, dateDebut: dateDebutObj.toISOString(), dateFin: dateFinObj.toISOString(),
            joursTravailles: chunk.length, joursReels: chunk, statut, montantPaye: enregistre?.montantPaye || 0,
            datePaiement: enregistre?.datePaiement || null, captureEcranUrl: enregistre?.captureEcranUrl || null,
            firestoreId: enregistre?.id || null,
        });
        numero++;
      }

      // Si pas d'historique, on initialise un cycle vide
      if (cyclesDynamiques.length === 0) {
          cyclesDynamiques.push({ numero: 1, dateDebut: new Date().toISOString(), dateFin: new Date().toISOString(), joursTravailles: 0, joursReels: [], statut: 'en_cours', firestoreId: null });
      } else if (cyclesDynamiques[cyclesDynamiques.length - 1].statut !== 'en_cours') {
          const last = cyclesDynamiques[cyclesDynamiques.length - 1];
          const nextDebut = new Date(new Date(last.dateFin).getTime() + 1);
          cyclesDynamiques.push({ numero: last.numero + 1, dateDebut: nextDebut.toISOString(), dateFin: new Date().toISOString(), joursTravailles: 0, joursReels: [], statut: 'en_cours', firestoreId: null });
      }

      // Finalisation des données pour chaque cycle
      const cyclesAvecStats = cyclesDynamiques.map(cycle => {
        const joursCycle = cycle.joursReels || [];

        // Filtre les livraisons appartenant aux dates de CE cycle
        const livraisonsCycle = allDeliveries.filter(d => {
          const day = toDayString(d.dateValidation || d.createdAt || d.dateCreation);
          return joursCycle.includes(day);
        });

        // Calcul strict basé sur 'livre' et 'partiel'
        const totalAttribuees = livraisonsCycle.length;
        const nombreSucces = livraisonsCycle.filter(isDeliverySuccessful).length;
        const tauxSucces = totalAttribuees > 0 ? Math.round((nombreSucces / totalAttribuees) * 100) : 0;

        const salaireBase = livreur.finance?.salaireBase || 50000;
        const primeParLivraison = livreur.finance?.primeParLivraison || 250;
        const primesLivraisons = nombreSucces * primeParLivraison;
        const salaireBrut = cycle.joursTravailles > 0 ? (salaireBase + primesLivraisons) : 0;

        // --- RÈGLES STRICTES DE DETTE (Croisement Versements / Garage) ---
        let sommeTracee = 0;
        let detailsFinanciers = [];

        // Récupère les versements qui tombent dans les jours travaillés de ce cycle
        const versementsCycle = (versementsByLivreur[livreurId] || []).filter(v => {
            const dayStr = toDayString(v.date || v.createdAt);
            return joursCycle.includes(dayStr);
        });

        versementsCycle.forEach(v => {
            const vDateObj = v.date ? new Date(v.date) : (v.createdAt?.toDate?.() || new Date(v.createdAt));
            const dayStr = toDayString(vDateObj);
            const garageKey = `${livreurId}_${dayStr}`;
            const linkedGarage = garageMap.get(garageKey);

            // 1. Marchandise Perdue : TOUJOURS une dette
            const perduMarchandise = Number(v.montantPerduMarchandise || 0);
            if (perduMarchandise > 0) {
                detailsFinanciers.push({
                    type: 'dette_marchandise', 
                    montant: perduMarchandise,
                    motif: 'Marchandise Perdue (Déclaré au versement)',
                    date: vDateObj.toLocaleDateString('fr-FR')
                });
                sommeTracee += perduMarchandise;
            }

            // 2. Cash Manquant : Vérification de la justification Garage
            const manquantCash = Number(v.montantManquant || 0);
            if (manquantCash > 0) {
                if (linkedGarage && linkedGarage.statut === 'valide') {
                    // Justifié : PAS de dette
                    detailsFinanciers.push({
                        type: 'garage_valide', 
                        montant: manquantCash,
                        motif: `Demande Garage Validée: ${linkedGarage.motif || 'Entretien'}`,
                        date: vDateObj.toLocaleDateString('fr-FR')
                    });
                } else {
                    // Non Justifié / Rejeté : DETTE
                    let statusLabel = linkedGarage ? `Garage ${linkedGarage.statut.replace('_', ' ')}` : 'Aucune justification';
                    detailsFinanciers.push({
                        type: 'dette_cash', 
                        montant: manquantCash,
                        motif: `Cash Manquant (${statusLabel})`,
                        date: vDateObj.toLocaleDateString('fr-FR')
                    });
                    sommeTracee += manquantCash;
                }
            }
        });

        // 3. Retenues Manuelles
        const historiques = livreur.historiqueDettes || [];
        historiques.forEach(h => {
            const d = new Date(h.date);
            const debutDate = new Date(cycle.dateDebut);
            const finDate = new Date(cycle.dateFin);
            if (d >= debutDate && d <= finDate) {
                detailsFinanciers.push({
                    type: 'dette_manuelle', 
                    montant: h.montant, 
                    motif: `Retenue manuelle : ${h.motif}`,
                    date: d.toLocaleDateString('fr-FR')
                });
                sommeTracee += h.montant;
            }
        });

        // RÈGLE STRICTE : totalManquants est TOUJOURS calculé depuis le journal financier (sommeTracee).
        // On n'utilise JAMAIS la valeur stockée en Firestore (enregistre.totalManquants)
        // pour garantir la cohérence avec les entrées du journal (versements + garage + dettes manuelles).
        const totalManquants = sommeTracee;

        const salaireNet = salaireBrut - totalManquants;

        return {
          ...cycle, livraisonsTotal: totalAttribuees, livraisonsEffectuees: nombreSucces, tauxSucces,
          salaireBase, primeParLivraison, primesLivraisons, salaireBrut, totalManquants, salaireNet,
          manquants: detailsFinanciers, numeroBulletin: `BUL-C${cycle.numero}-${livreurId.slice(-4).toUpperCase()}`
        };
      });

      const cycleEnCours = cyclesAvecStats[cyclesAvecStats.length - 1];

      livreursData.push({
        id: livreurId, nom: livreur.nom || livreur.nomComplet, photo: livreur.photoUrl || '👨‍🦱', 
        detteInitiale: cycleEnCours ? cycleEnCours.totalManquants : 0,
        cycles: cyclesAvecStats, cycleEnCours: cycleEnCours || null, ...(cycleEnCours || {}),
      });
    });

    return livreursData.sort((a, b) => a.nom.localeCompare(b.nom));

  } catch (error) {
    console.error("Erreur fetchSalaryData:", error);
    throw new Error("Impossible de charger les données de salaires.");
  }
};

// ============================================================================
// SAUVEGARDE SNAPSHOT SALAIRES
// ============================================================================
export const saveSalarySnapshot = async (livreursData) => {
  try {
    const promises = livreursData.map(async (livreur) => {
      const cycle = livreur.cycleEnCours;
      if (!cycle) return;

      const snapshot = {
        livreurId: livreur.id,
        nom: livreur.nom,
        updatedAt: serverTimestamp(),
        detteEnCours: cycle.totalManquants || 0,
        cycleEnCours: {
          numero: cycle.numero,
          statut: cycle.statut,
          dateDebut: cycle.dateDebut,
          dateFin: cycle.dateFin,
          joursTravailles: cycle.joursTravailles || 0,
          livraisonsTotal: cycle.livraisonsTotal || 0,
          livraisonsEffectuees: cycle.livraisonsEffectuees || 0,
          tauxSucces: cycle.tauxSucces || 0,
          salaireBase: cycle.salaireBase || 0,
          primeParLivraison: cycle.primeParLivraison || 0,
          primesLivraisons: cycle.primesLivraisons || 0,
          salaireBrut: cycle.salaireBrut || 0,
          totalManquants: cycle.totalManquants || 0,
          salaireNet: cycle.salaireNet || 0,
          manquants: (cycle.manquants || []).map(m => ({
            type: m.type,
            montant: m.montant,
            motif: m.motif,
            date: m.date,
          })),
        },
        historiqueResume: (livreur.cycles || [])
          .filter(c => c.statut === 'paye' || c.statut === 'cloture')
          .map(c => ({
            numero: c.numero,
            statut: c.statut,
            salaireNet: c.salaireNet || 0,
            totalManquants: c.totalManquants || 0,
            montantPaye: c.montantPaye || 0,
            datePaiement: c.datePaiement || null,
          })),
      };

      const snapshotRef = doc(db, 'salary_snapshots', livreur.id);
      await setDoc(snapshotRef, snapshot);
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('[SalarySnapshot] Erreur de sauvegarde:', error);
  }
};

// ============================================================================
// ACTIONS SUR CYCLES & CONFIGURATIONS
// ============================================================================
export const cloturerCycle = async (livreurId, livreurNom, cycle) => {
  try {
    const batch = writeBatch(db);
    const cycleRef = doc(collection(db, 'cycles_livreurs'));
    batch.set(cycleRef, {
      livreurId, livreurNom, cycleNumero: cycle.numero,
      dateDebut: cycle.dateDebut, dateFin: cycle.dateFin,
      statut: 'cloture', clotureLe: new Date().toISOString(),
      totalManquants: cycle.totalManquants || 0,
      salaireBrut: cycle.salaireBrut || 0, salaireNet: cycle.salaireNet || 0,
      createdAt: serverTimestamp()
    });

    if (cycle.totalManquants > 0) {
      const livreurRef = doc(db, 'livreurs', livreurId);
      batch.update(livreurRef, { "finance.detteActuelle": increment(-cycle.totalManquants) });
    }
    await batch.commit();
    return { success: true };
  } catch (error) { throw new Error("Échec de la clôture du cycle."); }
};

export const payerCycle = async (livreurId, livreurNom, cycle, montantPaye, imageFile) => {
  try {
    const timestamp = Date.now();
    const storageRef = ref(storage, `preuves_paiement_cycles/${livreurId}_C${cycle.numero}_${timestamp}`);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    if (cycle.firestoreId) {
      await updateDoc(doc(db, 'cycles_livreurs', cycle.firestoreId), {
        statut: 'paye', montantPaye, captureEcranUrl: downloadURL,
        datePaiement: new Date().toISOString(), updatedAt: serverTimestamp()
      });
    } else {
      throw new Error("Le cycle doit d'abord être clôturé.");
    }
    return { success: true };
  } catch (error) { throw new Error("Échec de l'enregistrement du paiement du cycle."); }
};

export const updateDriverSalaryConfig = async (livreurId, salaireBase, primeParLivraison) => {
  try {
    await updateDoc(doc(db, "livreurs", livreurId), {
      "finance.salaireBase": salaireBase, "finance.primeParLivraison": primeParLivraison, "updatedAt": serverTimestamp()
    });
    return { success: true };
  } catch (error) { throw new Error("Échec de la mise à jour de la configuration."); }
};

export const addSalaryDeduction = async (livreurId, montant, motif) => {
  try {
    await updateDoc(doc(db, "livreurs", livreurId), {
      "finance.detteActuelle": increment(montant),
      historiqueDettes: arrayUnion({ montant, motif, date: new Date().toISOString() })
    });
    return { success: true };
  } catch (error) { throw new Error("Erreur lors de l'ajout de la retenue."); }
};

// ============================================================================
// PDF HELPERS & GENERATION
// ============================================================================
const getLogoBase64 = async () => {
  try {
    const response = await fetch('/logo.png'); 
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) { return null; }
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 FCFA';
  const val = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${val} FCFA`;
};

const calculateSummary = (livreursData) => {
  const totalLivreurs = livreursData.length;
  const totalPayes = livreursData.filter(l => l.cycleEnCours?.statut === 'paye').length;
  const totalNonPayes = totalLivreurs - totalPayes;
  const totalSalairesBrut = livreursData.reduce((sum, l) => sum + (l.cycleEnCours?.salaireBrut || 0), 0);
  const totalManquants = livreursData.reduce((sum, l) => sum + (l.cycleEnCours?.totalManquants || 0), 0);
  const totalSalairesNet = livreursData.reduce((sum, l) => sum + (l.cycleEnCours?.salaireNet || 0), 0);
  const totalPaye = livreursData.reduce((sum, l) => sum + (l.cycleEnCours?.montantPaye || 0), 0);
  const totalRestant = totalSalairesNet - totalPaye;
  const totalLivraisons = livreursData.reduce((sum, l) => sum + (l.cycleEnCours?.livraisonsTotal || 0), 0);
  const totalLivraisonsEffectuees = livreursData.reduce((sum, l) => sum + (l.cycleEnCours?.livraisonsEffectuees || 0), 0);
  const tauxSuccesMoyen = totalLivraisons > 0 ? Math.round((totalLivraisonsEffectuees / totalLivraisons) * 100) : 0;

  return { totalLivreurs, totalPayes, totalNonPayes, totalSalairesBrut, totalManquants, totalSalairesNet, totalPaye, totalRestant, totalLivraisons, totalLivraisonsEffectuees, tauxSuccesMoyen };
};

const addFooter = (doc, pageNumber, totalPages, label) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3); doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
  doc.setFontSize(7); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
  doc.text('Document confidentiel - Usage interne uniquement', 14, pageHeight - 11);
  doc.text(`Bulletin de paie — ${label}`, pageWidth / 2, pageHeight - 11, { align: 'center' });
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 14, pageHeight - 11, { align: 'right' });
};

export const downloadSalaryPDFDirectly = async (livreursData) => {
  try {
    const doc = new jsPDF();
    const logoData = await getLogoBase64();
    const today = new Date().toLocaleDateString('fr-FR');
    doc.setFillColor(30, 30, 50); doc.rect(0, 0, doc.internal.pageSize.width, 38, 'F');
    if (logoData) { try { doc.addImage(logoData, 'PNG', 14, 8, 20, 20); } catch (e) {} }
    
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text('RAPPORT DE SALAIRES', 42, 18);
    doc.setFontSize(9); doc.setTextColor(180, 180, 210); doc.text(`Cycles en cours  •  Généré le: ${today}`, 42, 27);
    
    autoTable(doc, {
      startY: 50,
      head: [['Livreur', 'Présence', 'Livraisons', 'Net', 'Statut']],
      body: livreursData.map(l => [
        l.nom, `${l.cycleEnCours?.joursTravailles || 0}j`, `${l.cycleEnCours?.livraisonsEffectuees || 0}`,
        formatCurrency(l.cycleEnCours?.salaireNet), l.cycleEnCours?.statut || 'N/A'
      ]),
      theme: 'grid', headStyles: { fillColor: [30, 30, 50], textColor: [255, 255, 255] }
    });
    doc.save(`rapport_salaires_cycles_${Date.now()}.pdf`);
    return { success: true };
  } catch (error) { throw new Error('Impossible de télécharger le PDF'); }
};

export const generateIndividualSalaryPDF = async (livreurData, cycle) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const logoData = await getLogoBase64();
    const cycleLabel = formatCycleLabel(cycle);
    const today = new Date().toLocaleDateString('fr-FR');

    doc.setFillColor(30, 30, 50); doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFillColor(99, 102, 241); doc.rect(0, 0, 5, 45, 'F');
    if (logoData) { try { doc.addImage(logoData, 'PNG', 14, 8, 22, 22); } catch(e) {} }

    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('SERVICE LIVRAISON', 42, 17);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 180, 210); doc.text('Gestion des Salaires & Performances', 42, 24);
    doc.setFontSize(8); doc.setTextColor(200, 200, 230); doc.text(`N° ${cycle.numeroBulletin}`, pageWidth - 14, 14, { align: 'right' });
    doc.text(`Émis le: ${today}`, pageWidth - 14, 21, { align: 'right' });

    doc.setFillColor(99, 102, 241); doc.rect(0, 45, pageWidth, 10, 'F');
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text('BULLETIN DE PAIE', pageWidth / 2, 51.5, { align: 'center' });

    let yPos = 65;
    doc.setFillColor(248, 250, 252); doc.roundedRect(14, yPos, pageWidth - 28, 22, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.4); doc.roundedRect(14, yPos, pageWidth - 28, 22, 3, 3, 'S');
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139); doc.text('EMPLOYÉ', 20, yPos + 7);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42); doc.text(livreurData.nom, 20, yPos + 15);
    doc.setFontSize(7); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold'); doc.text('MATRICULE', pageWidth - 70, yPos + 7);
    doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.text(livreurData.id.slice(-8).toUpperCase(), pageWidth - 70, yPos + 15);
    yPos += 30;

    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.text('Cycle & Présence', 14, yPos);
    doc.setDrawColor(99, 102, 241); doc.setLineWidth(1); doc.line(14, yPos + 2, 80, yPos + 2); yPos += 8;

    autoTable(doc, {
      startY: yPos,
      body: [
        ['Cycle de paie', `Cycle ${cycle.numero}`],
        ['Période du cycle', `${new Date(cycle.dateDebut).toLocaleDateString('fr-FR')} → ${new Date(cycle.dateFin).toLocaleDateString('fr-FR')}`],
        ['Jours de présence', cycle.joursTravailles.toString()],
      ],
      theme: 'plain', styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100, fillColor: [248, 250, 252] }, 1: { halign: 'right', fontStyle: 'bold' } }, margin: { left: 14, right: 14 }
    });
    yPos = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.text('Performance & Activité', 14, yPos);
    doc.setDrawColor(99, 102, 241); doc.setLineWidth(1); doc.line(14, yPos + 2, 90, yPos + 2); yPos += 8;

    autoTable(doc, {
      startY: yPos,
      body: [
        ['Livraisons attribuées', cycle.livraisonsTotal.toString()],
        ['Livraisons réussies', cycle.livraisonsEffectuees.toString()],
        ['Taux de succès', `${cycle.tauxSucces}%`],
      ],
      theme: 'plain', styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100, fillColor: [248, 250, 252] }, 1: { halign: 'right', fontStyle: 'bold' } }, margin: { left: 14, right: 14 }
    });
    yPos = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59); doc.text('Journal Financier & Rémunération', 14, yPos);
    doc.setDrawColor(99, 102, 241); doc.setLineWidth(1); doc.line(14, yPos + 2, 98, yPos + 2); yPos += 8;

    const remunerationData = [
      ['ÉLÉMENTS DU SALAIRE', '', 'MONTANT'],
      ['Salaire de base', '', formatCurrency(cycle.salaireBase)],
      [`Primes livraisons (${formatCurrency(cycle.primeParLivraison)} × ${cycle.livraisonsEffectuees})`, '', `+ ${formatCurrency(cycle.primesLivraisons)}`],
    ];

    const retenueRows = [];
    if (cycle.manquants && cycle.manquants.length > 0) {
      retenueRows.push(['JOURNAL FINANCIER (Dettes & Remboursements)', '', '']);
      cycle.manquants.forEach(m => {
        if (m.type === 'garage_valide') {
            retenueRows.push([`  • ${m.motif.slice(0, 60)}`, m.date, `(Justifié)`]);
        } else {
            retenueRows.push([`  • ${m.motif.slice(0, 60)}`, m.date, `- ${formatCurrency(Math.abs(m.montant))}`]);
        }
      });
    }

    autoTable(doc, {
      startY: yPos,
      body: [...remunerationData, ...retenueRows],
      theme: 'plain', styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' } },
      didParseCell: (data) => {
        const raw = data.cell.raw || '';
        if (['ÉLÉMENTS DU SALAIRE', 'JOURNAL FINANCIER (Dettes & Remboursements)'].includes(raw)) {
          data.cell.styles.fillColor = [243, 244, 246]; data.cell.styles.fontStyle = 'bold'; data.cell.styles.fontSize = 7.5;
        }
        if (data.column.index === 2 && typeof raw === 'string' && raw.startsWith('-')) data.cell.styles.textColor = [185, 28, 28];
        if (data.column.index === 2 && typeof raw === 'string' && raw.startsWith('+')) data.cell.styles.textColor = [21, 128, 61];
      }, margin: { left: 14, right: 14 }
    });
    yPos = doc.lastAutoTable.finalY + 6;

    doc.setFillColor(243, 244, 246); doc.roundedRect(14, yPos, pageWidth - 28, 10, 2, 2, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('SALAIRE BRUT', 20, yPos + 7); doc.text(formatCurrency(cycle.salaireBrut), pageWidth - 20, yPos + 7, { align: 'right' });
    yPos += 14;

    doc.setFillColor(254, 249, 195); doc.roundedRect(14, yPos, pageWidth - 28, 14, 3, 3, 'F');
    doc.setDrawColor(202, 138, 4); doc.setLineWidth(0.8); doc.roundedRect(14, yPos, pageWidth - 28, 14, 3, 3, 'S');
    doc.setFontSize(11); doc.setTextColor(133, 77, 14); doc.text('NET À PAYER', 20, yPos + 9); doc.setFontSize(13); doc.text(formatCurrency(cycle.salaireNet), pageWidth - 20, yPos + 10, { align: 'right' });
    
    addFooter(doc, 1, 1, cycleLabel);
    const pdfBlob = doc.output('blob');
    const fileName = `Bulletin_${livreurData.nom.replace(/\s+/g, '_')}_Cycle${cycle.numero}.pdf`;
    doc.save(fileName);
    uploadBytes(ref(storage, `bulletins_salaires/cycle${cycle.numero}/${livreurData.id}_${Date.now()}.pdf`), pdfBlob).catch(e => console.error(e));

    return { success: true };
  } catch (error) { throw new Error('Impossible de générer le bulletin de salaire'); }
};

export const generateSalaryPDF = async (livreursData) => {
  try {
    const doc = new jsPDF();
    const summary = calculateSummary(livreursData);
    doc.setFillColor(79, 70, 229); doc.rect(0, 0, doc.internal.pageSize.width, 38, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text('RAPPORT DE SALAIRES', 14, 17);
    
    autoTable(doc, {
      startY: 50,
      head: [['Livreur', 'Cycle/Présence', 'Livraisons', 'Taux', 'Base', 'Primes', 'Retenues', 'Net']],
      body: livreursData.map(l => {
        const c = l.cycleEnCours || {};
        return [
          l.nom, `C${c.numero||'-'} (${c.joursTravailles||0}j)`, `${c.livraisonsEffectuees||0}/${c.livraisonsTotal||0}`,
          `${c.tauxSucces||0}%`, formatCurrency(c.salaireBase), formatCurrency(c.primesLivraisons),
          c.totalManquants !== 0 ? `-${formatCurrency(c.totalManquants)}` : '-', formatCurrency(c.salaireNet)
        ];
      }),
      theme: 'grid', styles: { fontSize: 7 }
    });

    doc.save(`Rapport_Salaires_Cycles_${Date.now()}.pdf`);
    return { success: true };
  } catch (error) { throw new Error('Impossible de générer le rapport PDF'); }
};