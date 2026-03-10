//--- START OF FILE DeliveryDriverSalaryPageLogic.js ---

import { db, storage } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Vérifie si une livraison est considérée comme réussie  
 */
const isDeliverySuccessful = (delivery) => {
  if (delivery.statut === 'livre' || delivery.statut === 'partiel') return true;
  if (delivery.articles && Array.isArray(delivery.articles)) {
    return delivery.articles.some(art => 
      art.quantiteLivree > 0 || 
      art.statut === 'livre' || 
      art.statut === 'ok'
    );
  }
  if (delivery.dateValidation) return true;
  return false;
};

/**
 * Calcule le nombre de jours ouvrables dans une période (cycle de paie)
 * Exclut les dimanches (jours non travaillés par défaut)
 */
const getJoursCyclePaie = () => 25; // Cycle fixe de 25 jours par mois


/**
 * Formate la période en nom de mois lisible (ex: "Mars 2025")
 */
const formatPeriodLabel = (period) => {
  const [year, month] = period.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/^./, c => c.toUpperCase());
};

/**
 * Récupère les données de salaires
 */
export const fetchSalaryData = async (period) => {
  try {
    const startDate = `${period}-01T00:00:00.000Z`;
    const endDate = `${period}-31T23:59:59.999Z`;

    const livreursQuery = query(collection(db, "livreurs"));
    
    const deliveriesQuery = query(
      collection(db, "livraisons"),
      where("dateCreation", ">=", startDate),
      where("dateCreation", "<=", endDate)
    );

    const versementsQuery = query(
      collection(db, "versements_livreurs"),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );

    const garagesQuery = query(
      collection(db, "demandes_garage"),
      where("statut", "==", "valide"),
      where("dateValidation", ">=", startDate),
      where("dateValidation", "<=", endDate)
    );

    const paymentsQuery = query(collection(db, "paiements_salaires"), where("periode", "==", period));

    const [livreursSnap, deliveriesSnap, versementsSnap, garagesSnap, paymentsSnap] = await Promise.all([
      getDocs(livreursQuery),
      getDocs(deliveriesQuery),
      getDocs(versementsQuery),
      getDocs(garagesQuery),
      getDocs(paymentsQuery)
    ]);

    const deliveriesByLivreur = {};
    deliveriesSnap.forEach(d => {
      const data = d.data();
      const lId = data.livreurId;
      if (lId) {
        if (!deliveriesByLivreur[lId]) deliveriesByLivreur[lId] = [];
        deliveriesByLivreur[lId].push(data);
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

    const garagesByLivreur = {};
    garagesSnap.forEach(g => {
      const data = g.data();
      const lId = data.livreurId || data.idLivreur;
      if (lId) {
        if (!garagesByLivreur[lId]) garagesByLivreur[lId] = [];
        garagesByLivreur[lId].push(data);
      }
    });

    const paymentsByLivreur = {};
    paymentsSnap.forEach(p => {
      const data = p.data();
      paymentsByLivreur[data.livreurId] = data;
    });

    // Calculer les jours du cycle de paie (jours ouvrables du mois)
    const joursCyclePaie = getJoursCyclePaie();

    const livreursData = [];
    livreursSnap.forEach(livreurDoc => {
      const livreur = { id: livreurDoc.id, ...livreurDoc.data() };
      const livreurId = livreur.id;
      
      const allDeliveries = deliveriesByLivreur[livreurId] || [];
      const versements = versementsByLivreur[livreurId] || [];
      const garages = garagesByLivreur[livreurId] || [];

      // CALCULS PERFORMANCE
      const totalAttribuees = allDeliveries.length;
      const livraisonsSucces = allDeliveries.filter(d => isDeliverySuccessful(d));
      const nombreSucces = livraisonsSucces.length;
      
      const tauxSucces = totalAttribuees > 0 
        ? Math.round((nombreSucces / totalAttribuees) * 100) 
        : 0;

      // Jours travaillés réels (présence distincte)
      const uniqueDays = new Set(allDeliveries.map(d => d.dateCreation?.split('T')[0])); 
      const joursTravailles = uniqueDays.size;

      // CALCULS FINANCIERS
      let detailsFinanciers = [];
      let totalDettes = 0;
      versements.forEach(v => {
        const montant = (v.montantManquant || 0) + (v.montantPerduMarchandise || 0);
        if (montant > 0) {
          totalDettes += montant;
          detailsFinanciers.push({
            type: 'dette',
            montant,
            motif: v.notes || "Manquant versement",
            date: v.date ? new Date(v.date).toLocaleDateString('fr-FR') : '-'
          });
        }
      });

      let totalRegularisations = 0;
      garages.forEach(g => {
        const montant = parseFloat(g.coutReel || g.montantValide || 0);
        if (montant > 0) {
          totalRegularisations += montant;
          detailsFinanciers.push({
            type: 'credit',
            montant,
            motif: `Garage: ${g.motif || 'Réparation'}`,
            date: g.dateValidation ? new Date(g.dateValidation).toLocaleDateString('fr-FR') : '-'
          });
        }
      });

      const totalManquantsCalculated = Math.max(0, totalDettes - totalRegularisations);
      const salaireBase = livreur.finance?.salaireBase || 50000;
      const primeParLivraison = livreur.finance?.primeParLivraison || 250;
      const primesLivraisons = nombreSucces * primeParLivraison;
      const salaireBrut = salaireBase + primesLivraisons;
      const salaireNet = salaireBrut - totalManquantsCalculated;

      const payment = paymentsByLivreur[livreurId];
      
      livreursData.push({
        id: livreurId,
        nom: livreur.nom,
        photo: livreur.photoUrl || '👨‍🦱',
        // CORRECTION: on expose les deux métriques distinctement
        joursTravailles,           // Jours de présence réelle
        joursCyclePaie,            // Jours ouvrables du cycle (identique pour tous)
        livraisonsTotal: totalAttribuees,
        livraisonsEffectuees: nombreSucces,
        tauxSucces,
        salaireBase,
        primeParLivraison,
        primesLivraisons,
        salaireBrut,
        manquants: detailsFinanciers, 
        totalManquants: totalManquantsCalculated, 
        salaireNet,
        statut: payment ? 'paye' : 'non_paye',
        montantPaye: payment?.montantPaye || 0,
        datePaiement: payment?.datePaiement || null,
        captureEcran: payment?.captureEcranUrl || null,
        numeroBulletin: `BUL-${period.replace('-', '')}-${livreurId.slice(-4).toUpperCase()}`
      });
    });

    return livreursData.sort((a,b) => a.nom.localeCompare(b.nom));

  } catch (error) {
    console.error("Erreur fetchSalaryData:", error);
    throw new Error("Impossible de charger les données de salaires.");
  }
};

export const updateDriverSalaryConfig = async (livreurId, salaireBase, primeParLivraison) => {
    try {
        const livreurRef = doc(db, "livreurs", livreurId);
        await updateDoc(livreurRef, {
            "finance.salaireBase": salaireBase,
            "finance.primeParLivraison": primeParLivraison,
            "updatedAt": serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        throw new Error("Échec de la mise à jour.");
    }
};

export const addSalaryDeduction = async (livreurId, livreurNom, montant, motif, period) => {
    try {
        const batch = writeBatch(db);
        const versementRef = doc(collection(db, "versements_livreurs"));
        batch.set(versementRef, {
          livreurId,
          livreurNom,
          montantManquant: montant,
          notes: `Déduction manuelle: ${motif}`,
          date: new Date().toISOString(),
          createdAt: serverTimestamp(),
          periodeSalaire: period
        });
        await batch.commit();
        return { success: true };
    } catch (error) {
        throw new Error("Erreur lors de l'ajout du manquant.");
    }
};

export const saveSalaryPayment = async (livreurId, livreurNom, montantPaye, period, imageFile) => {
    try {
        const timestamp = Date.now();
        const storageRef = ref(storage, `preuves_paiement_salaires/${period}/${livreurId}_${timestamp}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        const downloadURL = await getDownloadURL(uploadResult.ref);
    
        const paymentData = {
          livreurId, livreurNom, montantPaye, periode: period,
          captureEcranUrl: downloadURL,
          datePaiement: new Date().toISOString(),
          createdAt: serverTimestamp()
        };
    
        await addDoc(collection(db, 'paiements_salaires'), paymentData);
        return { success: true };
      } catch (error) {
        throw new Error("Échec de l'enregistrement du paiement.");
      }
};

// ============================================================================
// FONCTIONS UTILITAIRES PDF
// ============================================================================

const getLogoBase64 = async () => {
  try {
    const response = await fetch('/logo.png'); 
    if (!response.ok) throw new Error("Logo introuvable");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Logo non chargé (utiliser un logo.png dans public/):", e);
    return null;
  }
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 FCFA';
  const val = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${val} FCFA`;
};

const calculateSummary = (livreursData) => {
  const totalLivreurs = livreursData.length;
  const totalPayes = livreursData.filter(l => l.statut === 'paye').length;
  const totalNonPayes = totalLivreurs - totalPayes;
  
  const totalSalairesBrut = livreursData.reduce((sum, l) => sum + l.salaireBrut, 0);
  const totalManquants = livreursData.reduce((sum, l) => sum + l.totalManquants, 0);
  const totalSalairesNet = livreursData.reduce((sum, l) => sum + l.salaireNet, 0);
  const totalPaye = livreursData.reduce((sum, l) => sum + l.montantPaye, 0);
  const totalRestant = totalSalairesNet - totalPaye;
  
  const totalLivraisons = livreursData.reduce((sum, l) => sum + l.livraisonsTotal, 0);
  const totalLivraisonsEffectuees = livreursData.reduce((sum, l) => sum + l.livraisonsEffectuees, 0);
  const tauxSuccesMoyen = totalLivraisons > 0 
    ? Math.round((totalLivraisonsEffectuees / totalLivraisons) * 100) 
    : 0;

  return {
    totalLivreurs,
    totalPayes,
    totalNonPayes,
    totalSalairesBrut,
    totalManquants,
    totalSalairesNet,
    totalPaye,
    totalRestant,
    totalLivraisons,
    totalLivraisonsEffectuees,
    tauxSuccesMoyen
  };
};

const addFooter = (doc, pageNumber, totalPages, period) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Ligne séparatrice footer
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
  
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  
  // Gauche: Confidentiel
  doc.text('Document confidentiel - Usage interne uniquement', 14, pageHeight - 11);
  
  // Centre: Période
  doc.text(`Bulletin de paie - ${period || ''}`, pageWidth / 2, pageHeight - 11, { align: 'center' });
  
  // Droite: Pagination
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 14, pageHeight - 11, { align: 'right' });
};

// ============================================================================
// GENERATE SALARY PDF (RAPPORT COMPLET - UPLOAD + OPEN)
// ============================================================================
export const generateSalaryPDF = async (livreursData, period) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const logoData = await getLogoBase64(); 
    const periodLabel = formatPeriodLabel(period);
    
    let yPos = 0;
    
    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 38, 'F');
    
    if (logoData) {
        try { doc.addImage(logoData, 'PNG', 14, 8, 20, 20); } catch (err) {
            doc.setFillColor(255, 255, 255); doc.circle(22, 19, 9, 'F');
            doc.setTextColor(79, 70, 229); doc.setFontSize(10); doc.text('$', 19, 22);
        }
    } else {
        doc.setFillColor(255, 255, 255); doc.circle(22, 19, 9, 'F');
        doc.setTextColor(79, 70, 229); doc.setFontSize(10); doc.text('$', 19, 22);
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DE SALAIRES', 42, 17);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('fr-FR');
    doc.text(`Période: ${periodLabel}  •  Généré le: ${today}`, 42, 27);
    
    yPos = 52;

    // Résumé
    const summary = calculateSummary(livreursData);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Résumé Général', 14, yPos);
    yPos += 10;

    // Cards résumé
    const cardWidth = (pageWidth - 42) / 3;
    const cardHeight = 26;
    
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, yPos, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL LIVREURS', 14 + cardWidth/2, yPos + 8, { align: 'center' });
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(18);
    doc.text(summary.totalLivreurs.toString(), 14 + cardWidth/2, yPos + 20, { align: 'center' });
    
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14 + cardWidth + 7, yPos, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYÉS / NON PAYÉS', 14 + cardWidth + 7 + cardWidth/2, yPos + 8, { align: 'center' });
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(18);
    doc.text(`${summary.totalPayes} / ${summary.totalNonPayes}`, 14 + cardWidth + 7 + cardWidth/2, yPos + 20, { align: 'center' });
    
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(14 + (cardWidth + 7) * 2, yPos, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(202, 138, 4);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('MASSE SALARIALE NETTE', 14 + (cardWidth + 7) * 2 + cardWidth/2, yPos + 8, { align: 'center' });
    doc.setTextColor(133, 77, 14);
    doc.setFontSize(10);
    doc.text(formatCurrency(summary.totalSalairesNet), 14 + (cardWidth + 7) * 2 + cardWidth/2, yPos + 20, { align: 'center' });

    yPos += cardHeight + 14;

    // Tableau financier résumé
    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur Financier', 'Montant']],
      body: [
        ['Total brut des salaires', formatCurrency(summary.totalSalairesBrut)],
        ['Total déductions / manquants', `- ${formatCurrency(summary.totalManquants)}`],
        ['Total net à payer', formatCurrency(summary.totalSalairesNet)],
        ['Total déjà payé', formatCurrency(summary.totalPaye)],
        ['Restant à payer', formatCurrency(summary.totalRestant)],
      ],
      theme: 'plain',
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [75, 85, 99],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 4, bottom: 4, left: 8, right: 8 }
      },
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 3, bottom: 3, left: 8, right: 8 }
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 110 },
        1: { halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === 4) {
          data.cell.styles.fillColor = [254, 249, 195];
          data.cell.styles.textColor = [133, 77, 14];
        }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 14;
    
    // Tableau Livreurs
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Détail par Livreur', 14, yPos);
    yPos += 8;

    const tableData = livreursData.map(l => [
      l.nom,
      `${l.joursTravailles} / ${l.joursCyclePaie}`,
      `${l.livraisonsEffectuees}/${l.livraisonsTotal}`,
      `${l.tauxSucces}%`,
      formatCurrency(l.salaireBase),
      formatCurrency(l.primesLivraisons),
      formatCurrency(l.totalManquants) !== '0 FCFA' ? `- ${formatCurrency(l.totalManquants)}` : '-',
      formatCurrency(l.salaireNet),
      l.statut === 'paye' ? 'Payé' : 'Non payé'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Livreur', 'Présence', 'Livraisons', 'Taux', 'Base', 'Primes', 'Retenues', 'Net', 'Statut']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 4
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 13, halign: 'center' },
        4: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 24, halign: 'right', textColor: [21, 128, 61] },
        6: { cellWidth: 22, halign: 'right', textColor: [185, 28, 28] },
        7: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] },
        8: { cellWidth: 18, halign: 'center' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 8) {
          data.cell.styles.textColor = data.cell.raw === 'Payé' ? [21, 128, 61] : [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(doc, i, totalPages, periodLabel);
    }

    const pdfBlob = doc.output('blob');
    const timestamp = Date.now();
    const storageRef = ref(storage, `rapports_salaires/${period}_${timestamp}.pdf`);
    const uploadResult = await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    window.open(downloadURL, '_blank');

    return {
      success: true,
      url: downloadURL,
      filename: `rapport_salaires_${period}.pdf`
    };

  } catch (error) {
    console.error('Erreur generateSalaryPDF:', error);
    throw new Error('Impossible de générer le rapport PDF');
  }
};

// ============================================================================
// GENERATE INDIVIDUAL PDF — BULLETIN DE SALAIRE PROFESSIONNEL
// ============================================================================
export const generateIndividualSalaryPDF = async (livreurData, period) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const logoData = await getLogoBase64();
    const periodLabel = formatPeriodLabel(period);
    const today = new Date().toLocaleDateString('fr-FR');

    // ── BANDEAU HEADER EMPLOYEUR ──────────────────────────────────────────────
    doc.setFillColor(30, 30, 50);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Accent bar gauche coloré
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(0, 0, 5, 45, 'F');

    if (logoData) {
      try { doc.addImage(logoData, 'PNG', 14, 8, 22, 22); } catch(e) {}
    } else {
      doc.setFillColor(99, 102, 241);
      doc.roundedRect(14, 8, 22, 22, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('LIV', 25, 22, { align: 'center' });
    }

    // Nom entreprise
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICE LIVRAISON', 42, 17);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 210);
    doc.text('Gestion des Salaires & Performances', 42, 24);

    // Numéro bulletin & date (côté droit)
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 230);
    doc.text(`N° ${livreurData.numeroBulletin || `BUL-${period.replace('-', '')}`}`, pageWidth - 14, 14, { align: 'right' });
    doc.text(`Émis le: ${today}`, pageWidth - 14, 21, { align: 'right' });
    doc.text(`Période: ${periodLabel}`, pageWidth - 14, 28, { align: 'right' });

    // Titre BULLETIN DE SALAIRE
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 45, pageWidth, 10, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('BULLETIN DE PAIE', pageWidth / 2, 51.5, { align: 'center' });

    let yPos = 65;

    // ── SECTION EMPLOYÉ ──────────────────────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, yPos, pageWidth - 28, 22, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, yPos, pageWidth - 28, 22, 3, 3, 'S');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('EMPLOYÉ', 20, yPos + 7);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(livreurData.nom, 20, yPos + 15);

    // Infos droite: matricule
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('MATRICULE', pageWidth - 70, yPos + 7);
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(livreurData.id.slice(-8).toUpperCase(), pageWidth - 70, yPos + 15);

    // Fonction
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('FONCTION', pageWidth/2, yPos + 7);
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text('Livreur', pageWidth/2, yPos + 15);

    yPos += 30;

    // ── SECTION PÉRIODE & CYCLE ───────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Période & Présence', 14, yPos);

    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1);
    doc.line(14, yPos + 2, 80, yPos + 2);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      body: [
        ['Période de paie', periodLabel],
        ['Cycle de paie (jours ouvrables)', livreurData.joursCyclePaie.toString()],
        ['Jours de présence effective', livreurData.joursTravailles.toString()],
        ['Jours d\'absence', (livreurData.joursCyclePaie - livreurData.joursTravailles).toString()],
        ['Taux de présence', `${livreurData.joursCyclePaie > 0 ? Math.round((livreurData.joursTravailles / livreurData.joursCyclePaie) * 100) : 0}%`],
      ],
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 6, right: 6 } },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100, fillColor: [248, 250, 252], textColor: [71, 85, 105] },
        1: { halign: 'right', fontStyle: 'bold', textColor: [30, 41, 59] }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === 3 && data.column.index === 1) {
          const absences = livreurData.joursCyclePaie - livreurData.joursTravailles;
          if (absences > 0) data.cell.styles.textColor = [185, 28, 28];
        }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 12;

    // ── SECTION PERFORMANCE ───────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Performance & Activité', 14, yPos);
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1);
    doc.line(14, yPos + 2, 90, yPos + 2);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      body: [
        ['Livraisons attribuées', livreurData.livraisonsTotal.toString()],
        ['Livraisons réussies', livreurData.livraisonsEffectuees.toString()],
        ['Livraisons échouées / retournées', (livreurData.livraisonsTotal - livreurData.livraisonsEffectuees).toString()],
        ['Taux de succès', `${livreurData.tauxSucces}%`],
      ],
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 6, right: 6 } },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100, fillColor: [248, 250, 252], textColor: [71, 85, 105] },
        1: { halign: 'right', fontStyle: 'bold', textColor: [30, 41, 59] }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === 3 && data.column.index === 1) {
          data.cell.styles.textColor = livreurData.tauxSucces >= 80 ? [21, 128, 61] : [185, 28, 28];
        }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 12;

    // ── SECTION RÉMUNÉRATION ──────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Détail de la Rémunération', 14, yPos);
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1);
    doc.line(14, yPos + 2, 98, yPos + 2);
    yPos += 8;

    const remunerationData = [
      ['ÉLÉMENTS DU SALAIRE', '', 'MONTANT'],
      ['Salaire de base mensuel', '', formatCurrency(livreurData.salaireBase)],
      [`Prime de livraison (${formatCurrency(livreurData.primeParLivraison)} × ${livreurData.livraisonsEffectuees} livraisons)`, '', `+ ${formatCurrency(livreurData.primesLivraisons)}`],
    ];

    // Lignes de retenues
    const retenueRows = [];
    if (livreurData.totalManquants > 0) {
      retenueRows.push(['RETENUES & DÉDUCTIONS', '', '']);
      if (livreurData.manquants && livreurData.manquants.length > 0) {
        livreurData.manquants.filter(m => m.type === 'dette').forEach(m => {
          retenueRows.push([`  • ${m.motif.slice(0, 45)}`, m.date, `- ${formatCurrency(m.montant)}`]);
        });
      } else {
        retenueRows.push(['  • Total manquants / dettes', '', `- ${formatCurrency(livreurData.totalManquants)}`]);
      }
    }

    // Crédits garage
    if (livreurData.manquants && livreurData.manquants.some(m => m.type === 'credit')) {
      retenueRows.push(['CRÉDITS / RÉGULARISATIONS', '', '']);
      livreurData.manquants.filter(m => m.type === 'credit').forEach(m => {
        retenueRows.push([`  • ${m.motif.slice(0, 45)}`, m.date, `+ ${formatCurrency(m.montant)}`]);
      });
    }

    const allRows = [
      ...remunerationData,
      ...retenueRows,
    ];

    autoTable(doc, {
      startY: yPos,
      body: allRows,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 6, right: 6 } },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 25, halign: 'center', textColor: [100, 116, 139] },
        2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        const raw = data.cell.raw || '';
        // En-têtes de section
        if (raw === 'ÉLÉMENTS DU SALAIRE' || raw === 'RETENUES & DÉDUCTIONS' || raw === 'CRÉDITS / RÉGULARISATIONS') {
          data.cell.styles.fillColor = [243, 244, 246];
          data.cell.styles.textColor = [71, 85, 105];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 7.5;
        }
        // Montants négatifs en rouge
        if (data.column.index === 2 && typeof raw === 'string' && raw.startsWith('-')) {
          data.cell.styles.textColor = [185, 28, 28];
        }
        // Montants positifs en vert (primes)
        if (data.column.index === 2 && typeof raw === 'string' && raw.startsWith('+')) {
          data.cell.styles.textColor = [21, 128, 61];
        }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 6;

    // ── LIGNE TOTAUX : BRUT + NET ─────────────────────────────────────────────
    // Salaire Brut
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, yPos, pageWidth - 28, 10, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('SALAIRE BRUT', 20, yPos + 7);
    doc.text(formatCurrency(livreurData.salaireBrut), pageWidth - 20, yPos + 7, { align: 'right' });
    yPos += 14;

    // Salaire Net (mis en évidence)
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(14, yPos, pageWidth - 28, 14, 3, 3, 'F');
    doc.setDrawColor(202, 138, 4);
    doc.setLineWidth(0.8);
    doc.roundedRect(14, yPos, pageWidth - 28, 14, 3, 3, 'S');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(133, 77, 14);
    doc.text('NET À PAYER', 20, yPos + 9);
    doc.setFontSize(13);
    doc.text(formatCurrency(livreurData.salaireNet), pageWidth - 20, yPos + 10, { align: 'right' });

    yPos += 22;

    // ── STATUT PAIEMENT ───────────────────────────────────────────────────────
    const isPaye = livreurData.statut === 'paye';
    doc.setFillColor(isPaye ? 220 : 254, isPaye ? 252 : 226, isPaye ? 231 : 226);
    doc.roundedRect(14, yPos, pageWidth - 28, isPaye ? 20 : 14, 3, 3, 'F');
    doc.setDrawColor(isPaye ? 21 : 185, isPaye ? 128 : 28, isPaye ? 61 : 28);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, yPos, pageWidth - 28, isPaye ? 20 : 14, 3, 3, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    if (isPaye) {
      doc.setTextColor(21, 128, 61);
      doc.text('✓  SALAIRE PAYÉ', 22, yPos + 8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Montant versé: ${formatCurrency(livreurData.montantPaye)}`, 22, yPos + 15);
      if (livreurData.datePaiement) {
        doc.text(`Date de paiement: ${new Date(livreurData.datePaiement).toLocaleDateString('fr-FR')}`, pageWidth - 20, yPos + 15, { align: 'right' });
      }
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text('⚠  EN ATTENTE DE PAIEMENT', 22, yPos + 9);
    }

    yPos += (isPaye ? 20 : 14) + 14;

    // ── ZONE SIGNATURES ───────────────────────────────────────────────────────
    if (yPos < pageHeight - 55) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);

      const sigWidth = (pageWidth - 42) / 2;

      // Signature Responsable
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(14, yPos + 18, 14 + sigWidth, yPos + 18);
      doc.text('Signature du Responsable', 14 + sigWidth / 2, yPos + 24, { align: 'center' });
      doc.text('Date: ___________________', 14 + sigWidth / 2, yPos + 30, { align: 'center' });

      // Signature Employé
      doc.line(14 + sigWidth + 14, yPos + 18, pageWidth - 14, yPos + 18);
      doc.text('Signature du Livreur', 14 + sigWidth + 14 + sigWidth / 2, yPos + 24, { align: 'center' });
      doc.text('(Lu et approuvé)', 14 + sigWidth + 14 + sigWidth / 2, yPos + 30, { align: 'center' });
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    addFooter(doc, 1, 1, periodLabel);

    // ── UPLOAD & OPEN ─────────────────────────────────────────────────────────
    const pdfBlob = doc.output('blob');
    const timestamp = Date.now();
    const storageRef = ref(storage, `bulletins_salaires/${period}/${livreurData.id}_${timestamp}.pdf`);
    const uploadResult = await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    window.open(downloadURL, '_blank');

    return {
      success: true,
      url: downloadURL,
      filename: `bulletin_salaire_${livreurData.nom}_${period}.pdf`
    };

  } catch (error) {
    console.error('Erreur generateIndividualSalaryPDF:', error);
    throw new Error('Impossible de générer le bulletin de salaire');
  }
};

// ============================================================================
// DOWNLOAD DIRECTLY (RAPPORT COMPLET DIRECT)
// ============================================================================
export const downloadSalaryPDFDirectly = async (livreursData, period) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const logoData = await getLogoBase64(); 
    const periodLabel = formatPeriodLabel(period);
    
    let yPos = 0;
    
    // Header
    doc.setFillColor(30, 30, 50);
    doc.rect(0, 0, pageWidth, 38, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 5, 38, 'F');
    
    if (logoData) {
        try { doc.addImage(logoData, 'PNG', 14, 8, 20, 20); } catch (err) {
            doc.setFillColor(99, 102, 241); doc.roundedRect(14, 8, 20, 20, 3, 3, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.text('LIV', 24, 20, { align: 'center' });
        }
    } else {
        doc.setFillColor(99, 102, 241); doc.roundedRect(14, 8, 20, 20, 3, 3, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.text('LIV', 24, 20, { align: 'center' });
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DE SALAIRES', 42, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 210);
    const today = new Date().toLocaleDateString('fr-FR');
    doc.text(`Période: ${periodLabel}  •  Généré le: ${today}`, 42, 27);
    
    yPos = 50;

    // Résumé
    const summary = calculateSummary(livreursData);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Résumé Général', 14, yPos);
    yPos += 10;

    // Cards
    const cardWidth = (pageWidth - 42) / 3;
    const cardHeight = 26;
    
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, yPos, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL LIVREURS', 14 + cardWidth/2, yPos + 8, { align: 'center' });
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(18);
    doc.text(summary.totalLivreurs.toString(), 14 + cardWidth/2, yPos + 20, { align: 'center' });
    
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14 + cardWidth + 7, yPos, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYÉS / NON PAYÉS', 14 + cardWidth + 7 + cardWidth/2, yPos + 8, { align: 'center' });
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(18);
    doc.text(`${summary.totalPayes} / ${summary.totalNonPayes}`, 14 + cardWidth + 7 + cardWidth/2, yPos + 20, { align: 'center' });
    
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(14 + (cardWidth + 7) * 2, yPos, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(202, 138, 4);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('MASSE SALARIALE NETTE', 14 + (cardWidth + 7) * 2 + cardWidth/2, yPos + 8, { align: 'center' });
    doc.setTextColor(133, 77, 14);
    doc.setFontSize(10);
    doc.text(formatCurrency(summary.totalSalairesNet), 14 + (cardWidth + 7) * 2 + cardWidth/2, yPos + 20, { align: 'center' });

    yPos += cardHeight + 14;

    // Tableau financier résumé
    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur Financier', 'Montant']],
      body: [
        ['Total brut des salaires', formatCurrency(summary.totalSalairesBrut)],
        ['Total déductions / manquants', `- ${formatCurrency(summary.totalManquants)}`],
        ['Total net à payer', formatCurrency(summary.totalSalairesNet)],
        ['Total déjà payé', formatCurrency(summary.totalPaye)],
        ['Restant à payer', formatCurrency(summary.totalRestant)],
      ],
      theme: 'plain',
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [75, 85, 99],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 4, bottom: 4, left: 8, right: 8 }
      },
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 3, bottom: 3, left: 8, right: 8 }
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 110 },
        1: { halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === 4) {
          data.cell.styles.fillColor = [254, 249, 195];
          data.cell.styles.textColor = [133, 77, 14];
        }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 14;
    
    // Tableau Livreurs
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Détail par Livreur', 14, yPos);
    yPos += 8;

    const tableData = livreursData.map(l => [
      l.nom,
      `${l.joursTravailles} / ${l.joursCyclePaie}`,
      `${l.livraisonsEffectuees}/${l.livraisonsTotal}`,
      `${l.tauxSucces}%`,
      formatCurrency(l.salaireBase),
      formatCurrency(l.primesLivraisons),
      l.totalManquants > 0 ? `- ${formatCurrency(l.totalManquants)}` : '-',
      formatCurrency(l.salaireNet),
      l.statut === 'paye' ? 'Payé' : 'Non payé'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Livreur', 'Présence', 'Livraisons', 'Taux', 'Base', 'Primes', 'Retenues', 'Net', 'Statut']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [30, 30, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 4
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 13, halign: 'center' },
        4: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 24, halign: 'right', textColor: [21, 128, 61] },
        6: { cellWidth: 22, halign: 'right', textColor: [185, 28, 28] },
        7: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] },
        8: { cellWidth: 18, halign: 'center' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 8) {
          data.cell.styles.textColor = data.cell.raw === 'Payé' ? [21, 128, 61] : [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(doc, i, totalPages, periodLabel);
    }

    doc.save(`rapport_salaires_${period}.pdf`);

    return { success: true };

  } catch (error) {
    console.error('Erreur downloadSalaryPDFDirectly:', error);
    throw new Error('Impossible de télécharger le PDF');
  }
};