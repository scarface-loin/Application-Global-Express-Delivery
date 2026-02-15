import { db } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy
} from 'firebase/firestore';

// --- HELPER: Normalisation des statuts (Vital pour le filtre) ---
const normalizeStatus = (rawStatus) => {
  if (!rawStatus) return 'unknown';
  
  const s = rawStatus.toLowerCase();
  
  // Liste des statuts considérés comme "Livrée / Validée"
  // D'après votre base de données, c'est souvent 'valide'
  if (['livre', 'valide', 'paye', 'terminé', 'delivered', 'termine'].includes(s)) {
    return 'delivered';
  }
  
  // Liste des statuts considérés comme "Annulée / Échec"
  if (['non_livre', 'annule', 'rejet', 'echoue', 'cancelled', 'echec'].includes(s)) {
    return 'cancelled';
  }

  return s; // Retourne le statut tel quel si pas dans les listes (ex: 'en_cours')
};

// --- HELPER: Formatage des données Firestore ---
const formatHistoryData = (docSnap, origine) => {
  const data = docSnap.data();
  const rawStatus = data.statut || 'unknown';

  return {
    id: docSnap.id,
    origine: origine,
    type: data.type,
    quartier: data.infosLivraison?.quartier || data.infosLivraison?.villeDestination || 'N/A',
    numeroDestinataire: data.infosLivraison?.contactClient || data.infosLivraison?.numeroDestinataire || '',
    coutLivraison: data.coutPrestation || 0,
    articles: data.articles || [],
    total: data.totalGeneral || 0,
    trackingNumber: data.numeroSuivi || 'N/A',
    // On normalise le statut pour que le filtre fonctionne
    statut: normalizeStatus(rawStatus),
    rawStatus: rawStatus, // On garde l'original au cas où
    livreurNom: data.livreurNom || null,
    dateCreation: data.dateCreation,
    // Date de fin prioritaire : validation > livraison > création
    dateFin: data.dateValidation || data.dateLivraison || data.dateNonLivraison || data.dateCreation
  };
};

/**
 * Récupère l'historique complet des livraisons
 * Note: Le filtrage par statut se fait côté client pour gérer les synonymes (valide = livre)
 */
export const fetchHistory = async ({ startDate, endDate, statut }) => {
  try {
    // Gestion des dates
    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate);
    endISO.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
    const endISOString = endISO.toISOString();

    const collections = ['livraisons', 'livraison_partenaire'];
    const promises = [];

    // On récupère TOUTES les courses de la période (Internal + Partenaire)
    collections.forEach(col => {
      let q = query(
        collection(db, col),
        where("dateCreation", ">=", startISO),
        where("dateCreation", "<=", endISOString),
        orderBy("dateCreation", "desc")
      );
      promises.push(getDocs(q));
    });

    const [snapInterne, snapPartenaire] = await Promise.all(promises);
    
    let allDeliveries = [];
    snapInterne.forEach(doc => allDeliveries.push(formatHistoryData(doc, 'interne')));
    snapPartenaire.forEach(doc => allDeliveries.push(formatHistoryData(doc, 'partenaire')));

    // Filtrage Côté Client (Plus fiable pour les statuts hétérogènes)
    if (statut) {
      allDeliveries = allDeliveries.filter(d => d.statut === statut);
    }

    // Tri final par date décroissante (nécessaire après le merge des 2 collections)
    return allDeliveries.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

  } catch (error) {
    console.error("Erreur fetchHistory:", error);
    throw new Error("Impossible de charger l'historique. Vérifiez votre connexion.");
  }
};

/**
 * Génère un rapport PDF robuste
 * Utilise l'approche fonctionnelle pour éviter les erreurs "doc.autoTable is not a function"
 */
export const generatePDFReport = async (deliveries, filters) => {
  try {
    // 1. Importations Dynamiques Robustes
    const jsPDFModule = await import('jspdf');
    // Gère les différences d'import selon l'environnement (Vite, Webpack, Node)
    const jsPDFConstructor = jsPDFModule.default?.jsPDF || jsPDFModule.default || jsPDFModule.jsPDF;

    if (!jsPDFConstructor) {
      throw new Error("Impossible de charger la librairie jsPDF");
    }

    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default; // La fonction autoTable(doc, options)

    // 2. Création du document
    const doc = new jsPDFConstructor();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- Helpers de formatage pour le PDF ---
    const formatMoney = (amount) => {
      if (amount === undefined || amount === null) return '0 F';
      // Remplace les espaces insécables problématiques par des espaces simples
      return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F";
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    };
    // ----------------------------------------

    // En-tête du rapport
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport Historique des Courses', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`, 14, 30);
    doc.text(`Genere le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    // Calculs Statistiques
    const delivered = deliveries.filter(d => d.statut === 'delivered');
    const cancelled = deliveries.filter(d => d.statut === 'cancelled');
    const totalRevenue = delivered.reduce((acc, d) => acc + d.total, 0);
    const totalDeliveryCost = delivered.reduce((acc, d) => acc + d.coutLivraison, 0);

    // Affichage des statistiques
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

    // Préparation des données du tableau principal
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

    // Génération Tableau Principal
    autoTable(doc, {
      startY: 85,
      head: [['No Suivi', 'Date', 'Quartier', 'Type', 'Livreur', 'Statut', 'Cout Liv.', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 25 }, // No Suivi
        1: { cellWidth: 22 }, // Date
        2: { cellWidth: 25 }, // Quartier
        3: { cellWidth: 20 }, // Type
        4: { cellWidth: 25 }, // Livreur
        5: { cellWidth: 20 }, // Statut
        6: { cellWidth: 20 }, // Cout
        7: { cellWidth: 20 }, // Total
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: function(data) {
        // Pied de page avec numérotation
        doc.setFontSize(8);
        doc.setTextColor(128);
        const pageNum = data.pageNumber; 
        doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // --- Tableau Récapitulatif par Statut ---
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
      footStyles: { fillColor: [229, 231, 235], textColor: 0, fontStyle: 'bold' }
    });

    // --- Tableau Récapitulatif par Type ---
    const interne = deliveries.filter(d => d.origine === 'interne');
    const partenaire = deliveries.filter(d => d.origine === 'partenaire');
    
    // Position Y dynamique après le tableau précédent
    const lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 100;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recapitulatif par Type', 14, lastY + 20);

    const typeSummary = [
      ['Type', 'Nombre', 'Livrees', 'Annulees', 'Revenu Total'],
      [
        'Interne',
        interne.length.toString(),
        interne.filter(d => d.statut === 'delivered').length.toString(),
        interne.filter(d => d.statut === 'cancelled').length.toString(),
        formatMoney(interne.filter(d => d.statut === 'delivered').reduce((acc, d) => acc + d.total, 0))
      ],
      [
        'Partenaire',
        partenaire.length.toString(),
        partenaire.filter(d => d.statut === 'delivered').length.toString(),
        partenaire.filter(d => d.statut === 'cancelled').length.toString(),
        formatMoney(partenaire.filter(d => d.statut === 'delivered').reduce((acc, d) => acc + d.total, 0))
      ]
    ];

    autoTable(doc, {
      startY: lastY + 25,
      head: [typeSummary[0]],
      body: typeSummary.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' }
    });

    // Sauvegarde du fichier
    const fileName = `Rapport_Historique_${formatDate(filters.startDate).replace(/\//g, '-')}_${formatDate(filters.endDate).replace(/\//g, '-')}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("Erreur generation PDF:", error);
    throw new Error(`Erreur PDF: ${error.message}`);
  }
};