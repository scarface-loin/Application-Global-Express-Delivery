
import { db, storage } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Récupère le résumé journalier des partenaires pour une date donnée
 */
export const fetchDailySummary = async (dateStr) => {
  try {
    // 1. Définir la plage de date (00:00:00 à 23:59:59)
    const startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // 2. Récupérer les livraisons partenaires validées/livrées ce jour-là
    // On suppose que le paiement se base sur la date de LIVRAISON
    const qLiv = query(
      collection(db, 'livraison_partenaire'),
      where('statut', '==', 'livre'), // Seules les livrées comptent
      where('dateLivraison', '>=', startISO),
      where('dateLivraison', '<=', endISO)
    );

    const snapshot = await getDocs(qLiv);
    
    // 3. Récupérer les paiements déjà effectués pour cette date
    const qPay = query(
      collection(db, 'paiements_partenaires'),
      where('dateBilan', '==', dateStr)
    );
    const paySnapshot = await getDocs(qPay);
    const paiementsMap = {};
    paySnapshot.forEach(doc => {
      const data = doc.data();
      paiementsMap[data.partenaireId] = data;
    });

    // 4. Grouper par partenaire
    const partnersMap = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const pid = data.partenaireId;

      if (!partnersMap[pid]) {
        partnersMap[pid] = {
          id: pid,
          nom: data.partenaireNom || 'Partenaire Inconnu',
          type: data.type || 'Standard',
          livraisonsEffectuees: 0,
          totalLivraisons: 0,   // Montant encaissé (totalGeneral)
          fraisLivraison: 0,    // Frais (coutPrestation)
          montantAPayer: 0,     // Net à reverser
          livraisons: [],
          statut: 'non_paye'
        };
      }

      // Calculs
      const montant = parseFloat(data.totalGeneral) || 0;
      const frais = parseFloat(data.coutPrestation) || 0;
      const net = montant - frais;

      partnersMap[pid].livraisonsEffectuees += 1;
      partnersMap[pid].totalLivraisons += montant;
      partnersMap[pid].fraisLivraison += frais;
      partnersMap[pid].montantAPayer += net;

      partnersMap[pid].livraisons.push({
        id: data.numeroSuivi,
        montant: montant,
        frais: frais,
        heure: new Date(data.dateLivraison).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
      });
    });

    // 5. Appliquer les statuts de paiement existants
    Object.keys(partnersMap).forEach(pid => {
      if (paiementsMap[pid]) {
        const pay = paiementsMap[pid];
        partnersMap[pid].statut = 'paye';
        partnersMap[pid].montantPaye = pay.montantPaye;
        partnersMap[pid].datePaiement = pay.datePaiement;
        partnersMap[pid].captureEcran = pay.captureEcranUrl;
        partnersMap[pid].paiementId = pay.id; // Pour référence
      }
    });

    return Object.values(partnersMap);

  } catch (error) {
    console.error("Erreur fetchDailySummary:", error);
    throw new Error("Impossible de charger le bilan.");
  }
};

/**
 * Enregistre un paiement partenaire avec preuve image
 */
export const savePartnerPayment = async (partnerId, partnerName, dateBilan, amount, imageFile) => {
  try {
    // 1. Upload de l'image sur Storage
    // Chemin: preuves_paiement/YYYY-MM-DD/partnerId_timestamp.jpg
    const timestamp = Date.now();
    const storageRef = ref(storage, `preuves_paiement/${dateBilan}/${partnerId}_${timestamp}`);
    
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // 2. Création du document de paiement dans Firestore
    const paiementData = {
      partenaireId: partnerId,
      partenaireNom: partnerName,
      dateBilan: dateBilan, // La date concernée par le paiement
      montantPaye: parseFloat(amount),
      captureEcranUrl: downloadURL,
      datePaiement: new Date().toISOString(), // Date réelle de l'action
      creePar: 'ADMIN', // À remplacer par l'ID admin réel si dispo
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'paiements_partenaires'), paiementData);

    return {
      success: true,
      paiementId: docRef.id,
      captureEcranUrl: downloadURL,
      datePaiement: paiementData.datePaiement
    };

  } catch (error) {
    console.error("Erreur savePartnerPayment:", error);
    throw new Error("Échec de l'enregistrement du paiement.");
  }
};