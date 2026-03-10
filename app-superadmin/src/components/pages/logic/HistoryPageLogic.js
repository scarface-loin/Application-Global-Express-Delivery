import { db } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';

// --- HELPER: Normalisation des statuts ---
const normalizeStatus = (rawStatus) => {
  if (!rawStatus) return 'unknown';
  const s = rawStatus.toLowerCase();
  if (['livre', 'valide', 'paye', 'terminé', 'delivered', 'termine'].includes(s)) return 'delivered';
  if (['non_livre', 'annule', 'rejet', 'echoue', 'cancelled', 'echec'].includes(s)) return 'cancelled';
  if (['partiel', 'partial', 'partiellement_livre', 'perdu_partiel'].includes(s)) return 'partiel';
  return s;
};

// --- HELPER: Formatage des données Firestore ---
const formatHistoryData = (docSnap, origine) => {
  const data = docSnap.data();
  const rawStatus = data.statut || 'unknown';
  return {
    id: docSnap.id,
    origine,
    type: data.type,
    quartier: data.infosLivraison?.quartier || data.infosLivraison?.villeDestination || 'N/A',
    numeroDestinataire: data.infosLivraison?.contactClient || data.infosLivraison?.numeroDestinataire || '',
    coutLivraison: data.coutPrestation || 0,
    articles: data.articles || [],
    total: data.totalGeneral || 0,
    trackingNumber: data.numeroSuivi || 'N/A',
    statut: normalizeStatus(rawStatus),
    rawStatus,
    livreurNom: data.livreurNom || null,
    dateCreation: data.dateCreation,
    dateFin: data.dateValidation || data.dateLivraison || data.dateNonLivraison || data.dateCreation
  };
};

/**
 * Récupère l'historique complet des livraisons
 */
export const fetchHistory = async ({ startDate, endDate, statut } = {}) => {
  try {
    // Valeurs par défaut sécurisées si les dates sont undefined/null/invalides
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const parsedStart = startDate ? new Date(startDate) : defaultStart;
    const parsedEnd   = endDate   ? new Date(endDate)   : defaultEnd;

    if (isNaN(parsedStart.getTime())) throw new Error(`Date de début invalide: ${startDate}`);
    if (isNaN(parsedEnd.getTime()))   throw new Error(`Date de fin invalide: ${endDate}`);

    const startISO = parsedStart.toISOString();
    parsedEnd.setHours(23, 59, 59, 999);
    const endISOString = parsedEnd.toISOString();

    const collections = ['livraisons', 'livraison_partenaire'];
    const promises = collections.map(col =>
      getDocs(query(
        collection(db, col),
        where("dateCreation", ">=", startISO),
        where("dateCreation", "<=", endISOString),
        orderBy("dateCreation", "desc")
      ))
    );

    const [snapInterne, snapPartenaire] = await Promise.all(promises);
    
    let allDeliveries = [];
    snapInterne.forEach(doc => allDeliveries.push(formatHistoryData(doc, 'interne')));
    snapPartenaire.forEach(doc => allDeliveries.push(formatHistoryData(doc, 'partenaire')));

    if (statut) {
      allDeliveries = allDeliveries.filter(d => d.statut === statut);
    }

    return allDeliveries.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

  } catch (error) {
    console.error("Erreur fetchHistory:", error);
    throw new Error("Impossible de charger l'historique. Vérifiez votre connexion.");
  }
};

/**
 * Met à jour une course de l'historique (super admin uniquement)
 * Fonctionne même sur les courses déjà validées/archivées
 * @param {string} deliveryId 
 * @param {string} origine - 'interne' | 'partenaire'
 * @param {object} updatedData 
 */
export const updateHistoryDelivery = async (deliveryId, origine, updatedData) => {
  try {
    const collectionName = origine === 'partenaire' ? 'livraison_partenaire' : 'livraisons';
    const docRef = doc(db, collectionName, deliveryId);

    const firestorePayload = {
      statut: updatedData.statut,
      coutPrestation: updatedData.coutLivraison,
      totalGeneral: updatedData.total,
      articles: updatedData.articles,
      livreurNom: updatedData.livreurNom,
      "infosLivraison.quartier": updatedData.quartier,
      "infosLivraison.numeroDestinataire": updatedData.numeroDestinataire,
      "infosLivraison.contactClient": updatedData.numeroDestinataire,
      // Horodatage de la modification pour traçabilité
      dateModificationAdmin: new Date().toISOString(),
    };

    await updateDoc(docRef, firestorePayload);
    return true;
  } catch (error) {
    console.error("Erreur updateHistoryDelivery:", error);
    throw new Error("Impossible de sauvegarder les modifications.");
  }
};

/**
 * Génère un rapport PDF robuste
 */
export const generatePDFReport = async (deliveries, filters) => {
  try {
    const jsPDFModule = await import('jspdf');
    const jsPDFConstructor = jsPDFModule.default?.jsPDF || jsPDFModule.default || jsPDFModule.jsPDF;
    if (!jsPDFConstructor) throw new Error("Impossible de charger la librairie jsPDF");

    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default;

    const doc = new jsPDFConstructor();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const formatMoney = (amount) => {
      if (amount === undefined || amount === null) return '0 F';
      return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F";
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    };

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport Historique des Courses', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`, 14, 30);
    doc.text(`Genere le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    const delivered = deliveries.filter(d => d.statut === 'delivered');
    const cancelled = deliveries.filter(d => d.statut === 'cancelled');
    const totalRevenue = delivered.reduce((acc, d) => acc + d.total, 0);
    const totalDeliveryCost = delivered.reduce((acc, d) => acc + d.coutLivraison, 0);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques Globales', 14, 46);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total des courses: ${deliveries.length}`, 14, 52);
    doc.text(`Courses livrees / validees: ${delivered.length}`, 14, 58);
    doc.text(`Courses annulees / echec: ${cancelled.length}`, 14, 64);
    doc.text(`Revenu total: ${formatMoney(totalRevenue)}`, 14, 70);
    doc.text(`Cout total de livraison: ${formatMoney(totalDeliveryCost)}`, 14, 76);

    const tableData = deliveries.map(d => [
      d.trackingNumber,
      formatDate(d.dateCreation),
      d.quartier,
      d.origine === 'interne' ? 'Interne' : 'Partenaire',
      d.livreurNom || '-',
      d.statut === 'delivered' ? 'Validee' : 'Annulee',
      formatMoney(d.coutLivraison),
      formatMoney(d.total)
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['No Suivi', 'Date', 'Quartier', 'Type', 'Livreur', 'Statut', 'Cout Liv.', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 25 }, 1: { cellWidth: 22 }, 2: { cellWidth: 25 },
        3: { cellWidth: 20 }, 4: { cellWidth: 25 }, 5: { cellWidth: 20 },
        6: { cellWidth: 20 }, 7: { cellWidth: 20 },
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: function(data) {
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Recapitulatif par Statut', 14, 20);

    const statusSummary = [
      ['Statut', 'Nombre', 'Revenu Total'],
      ['Livrees / Validees', delivered.length.toString(), formatMoney(totalRevenue)],
      ['Annulees / Echec', cancelled.length.toString(), formatMoney(cancelled.reduce((acc, d) => acc + d.total, 0))],
      ['TOTAL', deliveries.length.toString(), formatMoney(deliveries.reduce((acc, d) => acc + d.total, 0))]
    ];

    autoTable(doc, {
      startY: 30,
      head: [statusSummary[0]],
      body: statusSummary.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    });

    const interne = deliveries.filter(d => d.origine === 'interne');
    const partenaire = deliveries.filter(d => d.origine === 'partenaire');
    const lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 100;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recapitulatif par Type', 14, lastY + 20);

    autoTable(doc, {
      startY: lastY + 25,
      head: [['Type', 'Nombre', 'Livrees', 'Annulees', 'Revenu Total']],
      body: [
        [
          'Interne', interne.length.toString(),
          interne.filter(d => d.statut === 'delivered').length.toString(),
          interne.filter(d => d.statut === 'cancelled').length.toString(),
          formatMoney(interne.filter(d => d.statut === 'delivered').reduce((acc, d) => acc + d.total, 0))
        ],
        [
          'Partenaire', partenaire.length.toString(),
          partenaire.filter(d => d.statut === 'delivered').length.toString(),
          partenaire.filter(d => d.statut === 'cancelled').length.toString(),
          formatMoney(partenaire.filter(d => d.statut === 'delivered').reduce((acc, d) => acc + d.total, 0))
        ]
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' }
    });

    const fileName = `Rapport_Historique_${formatDate(filters.startDate).replace(/\//g, '-')}_${formatDate(filters.endDate).replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    return { success: true, fileName };

  } catch (error) {
    console.error("Erreur generation PDF:", error);
    throw new Error(`Erreur PDF: ${error.message}`);
  }
};