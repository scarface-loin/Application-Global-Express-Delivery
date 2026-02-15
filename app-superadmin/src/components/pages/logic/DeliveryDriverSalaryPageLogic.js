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
        joursTravailles,
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
        captureEcran: payment?.captureEcranUrl || null
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
// FONCTIONS DE GÉNÉRATION PDF
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

const addFooter = (doc, pageNumber, totalPages) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Page ${pageNumber} / ${totalPages}`,
    doc.internal.pageSize.width - 20,
    pageHeight - 10,
    { align: 'right' }
  );
};

// ============================================================================
// GENERATE SALARY PDF (UPLOAD + OPEN)
// ============================================================================
export const generateSalaryPDF = async (livreursData, period) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const logoData = await getLogoBase64(); 
    
    let yPos = 0;
    
    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    if (logoData) {
        try { doc.addImage(logoData, 'PNG', 14, 8, 18, 18); } catch (err) {
            doc.setFillColor(255, 255, 255); doc.circle(20, 17, 8, 'F'); doc.text('$', 17, 21);
        }
    } else {
        doc.setFillColor(255, 255, 255); doc.circle(20, 17, 8, 'F'); doc.text('$', 17, 21);
    }
    
    yPos = 18;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DE SALAIRES', 40, yPos);
    
    yPos = 28;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('fr-FR');
    doc.text(`Periode: ${period}  •  Genere le: ${today}`, 40, yPos);
    
    yPos = 50;

    // Résumé
    const summary = calculateSummary(livreursData);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Resume General', 14, yPos);
    yPos += 10;

    // Cards
    const cardWidth = (pageWidth - 42) / 3;
    const cardHeight = 25;
    
    // Card 1
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(8);
    doc.text('TOTAL LIVREURS', 14 + cardWidth/2, yPos + 7, { align: 'center' });
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(16);
    doc.text(summary.totalLivreurs.toString(), 14 + cardWidth/2, yPos + 18, { align: 'center' });
    
    // Card 2
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14 + cardWidth + 7, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(8);
    doc.text('PAYES / NON PAYES', 14 + cardWidth + 7 + cardWidth/2, yPos + 7, { align: 'center' });
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(16);
    doc.text(`${summary.totalPayes} / ${summary.totalNonPayes}`, 14 + cardWidth + 7 + cardWidth/2, yPos + 18, { align: 'center' });
    
    // Card 3
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(14 + (cardWidth + 7) * 2, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(202, 138, 4);
    doc.setFontSize(8);
    doc.text('TOTAL SALAIRES NET', 14 + (cardWidth + 7) * 2 + cardWidth/2, yPos + 7, { align: 'center' });
    doc.setTextColor(133, 77, 14);
    doc.setFontSize(12);
    doc.text(formatCurrency(summary.totalSalairesNet), 14 + (cardWidth + 7) * 2 + cardWidth/2, yPos + 18, { align: 'center' });

    yPos += cardHeight + 15;

    // Tableau financier résumé
    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur Financier', 'Montant']],
      body: [
        ['Total paye', formatCurrency(summary.totalPaye)],
        ['Restant a payer', formatCurrency(summary.totalRestant)],
      ],
      theme: 'plain',
      headStyles: {
        fillColor: [249, 250, 251],
        textColor: [75, 85, 99],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }
      },
      styles: {
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 6, right: 6 }
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100 },
        1: { halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 15;
    
    // Tableau Livreur (Flexible)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Detail par Livreur', 14, yPos);
    yPos += 8;

    const tableData = livreursData.map(l => [
      l.nom,
      l.joursTravailles.toString(),
      `${l.livraisonsEffectuees}/${l.livraisonsTotal}`,
      `${l.tauxSucces}%`,
      formatCurrency(l.salaireNet),
      l.statut === 'paye' ? 'Paye' : 'Non paye'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Livreur', 'Jours', 'Liv.', 'Taux', 'Net a payer', 'Statut']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 4
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { fontStyle: 'bold' }, // Flexible
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] },
        5: { cellWidth: 22, halign: 'center' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 5) {
          if (data.cell.raw === 'Paye') {
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 14, right: 14 }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(doc, i, totalPages);
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
// GENERATE INDIVIDUAL PDF (BULLETIN)
// ============================================================================
export const generateIndividualSalaryPDF = async (livreurData, period) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const logoData = await getLogoBase64();

    let yPos = 0;

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    if (logoData) {
        try { doc.addImage(logoData, 'PNG', 14, 8, 18, 18); } catch(e) {}
    } else {
        doc.setFillColor(255, 255, 255); doc.circle(20, 17, 8, 'F'); doc.text('$', 17, 21);
    }
    
    yPos = 18;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BULLETIN DE SALAIRE', 40, yPos);
    
    yPos = 28;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('fr-FR');
    doc.text(`Periode: ${period}  •  Genere le: ${today}`, 40, yPos);
    
    yPos = 50;

    // Nom Livreur
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, yPos, pageWidth - 28, 14, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(`Livreur: ${livreurData.nom}`, 20, yPos + 9);
    yPos += 24;

    // Performance
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('Performance', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      body: [
        ['Jours travailles', livreurData.joursTravailles.toString()],
        ['Livraisons attribuees', livreurData.livraisonsTotal.toString()],
        ['Livraisons effectuees', livreurData.livraisonsEffectuees.toString()],
        ['Taux de succes', `${livreurData.tauxSucces}%`],
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 90, fillColor: [249, 250, 251] },
        1: { cellWidth: 90, halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 12;

    // Remuneration
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Remuneration', 14, yPos);
    yPos += 8;

    const remunerationData = [
      ['Salaire de base', formatCurrency(livreurData.salaireBase)],
      ['Prime par livraison', formatCurrency(livreurData.primeParLivraison)],
      ['Nombre de livraisons reussies', livreurData.livraisonsEffectuees.toString()],
      ['Total primes de livraison', formatCurrency(livreurData.primesLivraisons)],
      ['SALAIRE BRUT', formatCurrency(livreurData.salaireBrut)],
      ['Manquants/Deductions', `- ${formatCurrency(livreurData.totalManquants)}`],
      ['SALAIRE NET A PAYER', formatCurrency(livreurData.salaireNet)],
    ];

    autoTable(doc, {
      startY: yPos,
      body: remunerationData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100 },
        1: { cellWidth: 80, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.index === 4) data.cell.styles.fillColor = [243, 244, 246];
        if (data.row.index === 6) {
          data.cell.styles.fillColor = [254, 249, 195];
          data.cell.styles.textColor = [133, 77, 14];
        }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Manquants
    if (livreurData.manquants && livreurData.manquants.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Detail des Deductions', 14, yPos);
      yPos += 8;

      const manquantsData = livreurData.manquants.map(m => [
        m.type === 'dette' ? 'Dette' : 'Credit',
        formatCurrency(m.montant),
        m.motif.length > 50 ? m.motif.substring(0, 48) + '...' : m.motif,
        m.date
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Type', 'Montant', 'Motif', 'Date']],
        body: manquantsData,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [107, 114, 128], textColor: 255, fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
          2: { cellWidth: 100 },
          3: { cellWidth: 25, halign: 'center' }
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 15;
    }

    // Statut Paiement
    const isPaye = livreurData.statut === 'paye';
    doc.setFillColor(isPaye ? 220 : 254, isPaye ? 252 : 226, isPaye ? 231 : 226);
    doc.roundedRect(14, yPos, pageWidth - 28, 16, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    if (isPaye) {
      doc.setTextColor(21, 128, 61);
      doc.text(`PAYE - Montant: ${formatCurrency(livreurData.montantPaye)}`, 20, yPos + 8);
      if (livreurData.datePaiement) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${new Date(livreurData.datePaiement).toLocaleDateString('fr-FR')}`, 20, yPos + 13);
      }
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text('NON PAYE', 20, yPos + 10);
    }

    addFooter(doc, 1, 1);

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
// DOWNLOAD DIRECTLY (NOW WITH FULL DESIGN)
// ============================================================================
export const downloadSalaryPDFDirectly = async (livreursData, period) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const logoData = await getLogoBase64(); 
    
    let yPos = 0;
    
    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    if (logoData) {
        try { doc.addImage(logoData, 'PNG', 14, 8, 18, 18); } catch (err) {
            doc.setFillColor(255, 255, 255); doc.circle(20, 17, 8, 'F'); doc.text('$', 17, 21);
        }
    } else {
        doc.setFillColor(255, 255, 255); doc.circle(20, 17, 8, 'F'); doc.text('$', 17, 21);
    }
    
    yPos = 18;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DE SALAIRES', 40, yPos);
    
    yPos = 28;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('fr-FR');
    doc.text(`Periode: ${period}  •  Genere le: ${today}`, 40, yPos);
    
    yPos = 50;

    // Résumé
    const summary = calculateSummary(livreursData);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Resume General', 14, yPos);
    yPos += 10;

    // Cards
    const cardWidth = (pageWidth - 42) / 3;
    const cardHeight = 25;
    
    // Card 1
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(8);
    doc.text('TOTAL LIVREURS', 14 + cardWidth/2, yPos + 7, { align: 'center' });
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(16);
    doc.text(summary.totalLivreurs.toString(), 14 + cardWidth/2, yPos + 18, { align: 'center' });
    
    // Card 2
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14 + cardWidth + 7, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(8);
    doc.text('PAYES / NON PAYES', 14 + cardWidth + 7 + cardWidth/2, yPos + 7, { align: 'center' });
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(16);
    doc.text(`${summary.totalPayes} / ${summary.totalNonPayes}`, 14 + cardWidth + 7 + cardWidth/2, yPos + 18, { align: 'center' });
    
    // Card 3
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(14 + (cardWidth + 7) * 2, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(202, 138, 4);
    doc.setFontSize(8);
    doc.text('TOTAL SALAIRES NET', 14 + (cardWidth + 7) * 2 + cardWidth/2, yPos + 7, { align: 'center' });
    doc.setTextColor(133, 77, 14);
    doc.setFontSize(12);
    doc.text(formatCurrency(summary.totalSalairesNet), 14 + (cardWidth + 7) * 2 + cardWidth/2, yPos + 18, { align: 'center' });

    yPos += cardHeight + 15;

    // Tableau financier résumé
    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur Financier', 'Montant']],
      body: [
        ['Total paye', formatCurrency(summary.totalPaye)],
        ['Restant a payer', formatCurrency(summary.totalRestant)],
      ],
      theme: 'plain',
      headStyles: {
        fillColor: [249, 250, 251],
        textColor: [75, 85, 99],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }
      },
      styles: {
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 6, right: 6 }
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100 },
        1: { halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 15;
    
    // Tableau Livreur
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Detail par Livreur', 14, yPos);
    yPos += 8;

    const tableData = livreursData.map(l => [
      l.nom,
      l.joursTravailles.toString(),
      `${l.livraisonsEffectuees}/${l.livraisonsTotal}`,
      `${l.tauxSucces}%`,
      formatCurrency(l.salaireNet),
      l.statut === 'paye' ? 'Paye' : 'Non paye'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Livreur', 'Jours', 'Liv.', 'Taux', 'Net a payer', 'Statut']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 4
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { fontStyle: 'bold' }, 
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] },
        5: { cellWidth: 22, halign: 'center' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 5) {
          if (data.cell.raw === 'Paye') {
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 14, right: 14 }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(doc, i, totalPages);
    }

    // SAUVEGARDE DIRECTE
    doc.save(`rapport_salaires_${period}.pdf`);

    return { success: true };

  } catch (error) {
    console.error('Erreur downloadSalaryPDFDirectly:', error);
    throw new Error('Impossible de télécharger le PDF');
  }
};