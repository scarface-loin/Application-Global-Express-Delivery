import { db, storage } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where,  
  getDocs, 
  doc,
  addDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const fetchDailySummary = async (dateStr) => {
  try {
    const startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // MODIFICATION : On interroge les 3 statuts validés en parallèle.
    // Firestore ne supporte pas le OR natif sur un même champ, d'où les 3 requêtes.
    const statutsValides = ['livre', 'partiel', 'non_livre'];

    const queries = statutsValides.map(statut =>
      getDocs(query(
        collection(db, 'livraison_partenaire'),
        where('statut', '==', statut),
        where('dateLivraison', '>=', startISO),
        where('dateLivraison', '<=', endISO)
      ))
    );

    const [snapLivre, snapPartiel, snapNonLivre] = await Promise.all(queries);

    // Fusion des 3 snapshots en un seul tableau de docs
    const allDocs = [
      ...snapLivre.docs,
      ...snapPartiel.docs,
      ...snapNonLivre.docs,
    ];

    // Chargement des paiements existants pour la journée
    const qPay = query(
      collection(db, 'paiements_partenaires'),
      where('dateBilan', '==', dateStr)
    );
    const paySnapshot = await getDocs(qPay);
    const paiementsMap = {};
    paySnapshot.forEach(d => {
      const data = d.data();
      paiementsMap[data.partenaireId] = { ...data, id: d.id };
    });

    const partnersMap = {};

    allDocs.forEach(docSnap => {
      const data = docSnap.data();
      const pid = data.partenaireId;

      if (!partnersMap[pid]) {
        partnersMap[pid] = {
          id: pid,
          nom: data.partenaireNom || 'Partenaire Inconnu',
          type: data.type || 'Standard',
          livraisonsEffectuees: 0,
          livraisonsPartielles: 0,   // NOUVEAU : compteur partiel
          livraisonsNonLivrees: 0,   // NOUVEAU : compteur non livré
          totalLivraisons: 0,
          fraisLivraison: 0,
          montantAPayer: 0,
          livraisons: [],
          statut: 'non_paye'
        };
      }

      const montant = parseFloat(data.totalGeneral) || 0;
      const frais = parseFloat(data.coutPrestation) || 0;
      const net = montant - frais;
      const statutLivraison = data.statut; // 'livre', 'partiel' ou 'non_livre'

      partnersMap[pid].livraisonsEffectuees += 1;

      // NOUVEAU : compteurs par statut pour affichage détaillé
      if (statutLivraison === 'partiel') partnersMap[pid].livraisonsPartielles += 1;
      if (statutLivraison === 'non_livre') partnersMap[pid].livraisonsNonLivrees += 1;

      // On comptabilise le montant réel encaissé (totalFinalEncaisse si dispo, sinon totalGeneral)
      const montantEncaisse = parseFloat(data.totalFinalEncaisse ?? data.totalGeneral) || 0;
      const fraisEncaisse = statutLivraison === 'non_livre' ? 0 : frais; // Pas de frais si non livré
      const netEncaisse = montantEncaisse - fraisEncaisse;

      partnersMap[pid].totalLivraisons += montantEncaisse;
      partnersMap[pid].fraisLivraison += fraisEncaisse;
      partnersMap[pid].montantAPayer += netEncaisse;

      partnersMap[pid].livraisons.push({
        id: data.numeroSuivi,
        docId: docSnap.id,
        statut: statutLivraison, // NOUVEAU : statut visible dans le détail
        montant: montantEncaisse,
        frais: fraisEncaisse,
        heure: new Date(data.dateLivraison).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
    });

    // Fusion avec les paiements déjà enregistrés
    Object.keys(partnersMap).forEach(pid => {
      if (paiementsMap[pid]) {
        const pay = paiementsMap[pid];
        partnersMap[pid].statut = 'paye';
        partnersMap[pid].montantPaye = pay.montantPaye;
        partnersMap[pid].datePaiement = pay.datePaiement;
        partnersMap[pid].captureEcran = pay.captureEcranUrl;
        partnersMap[pid].paiementId = pay.id;
        partnersMap[pid].justification = pay.justification || null;
      }
    });

    return Object.values(partnersMap);

  } catch (error) {
    console.error("Erreur fetchDailySummary:", error);
    throw new Error("Impossible de charger le bilan.");
  }
};

/**
 * Enregistre un paiement partenaire, gère la justification et notifie
 */
export const savePartnerPayment = async ({
  partnerId, 
  partnerName, 
  dateBilan, 
  montantPaye,
  montantTheorique,
  justification,
  imageFile
}) => {
  try {
    const adminId = localStorage.getItem('admin_id') || 'SUPER_ADMIN';
    const montantVerser = parseFloat(montantPaye);
    const montantAttendu = parseFloat(montantTheorique);
    const ecart = montantVerser - montantAttendu;

    if (Math.abs(ecart) > 5 && (!justification || justification.trim() === '')) {
      throw new Error(`Le montant diffère de ${ecart} FCFA. Une justification est obligatoire.`);
    }

    if (!imageFile) throw new Error("La capture d'écran de la preuve est obligatoire.");
    
    const timestamp = Date.now();
    const storageRef = ref(storage, `preuves_paiement/${dateBilan}/${partnerId}_${timestamp}`);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    const batch = writeBatch(db);

    const paiementRef = doc(collection(db, 'paiements_partenaires'));
    const paiementData = {
      partenaireId: partnerId,
      partenaireNom: partnerName,
      dateBilan: dateBilan,
      montantPaye: montantVerser,
      montantTheorique: montantAttendu,
      ecart: ecart,
      justification: justification || null,
      captureEcranUrl: downloadURL,
      datePaiement: new Date().toISOString(),
      creePar: adminId,
      createdAt: serverTimestamp()
    };
    batch.set(paiementRef, paiementData);

    const notifRef = doc(collection(db, 'notifications_partenaires'));
    
    let messageNotif = `Votre paiement de ${montantVerser.toLocaleString('fr-FR')} FCFA pour la journée du ${new Date(dateBilan).toLocaleDateString('fr-FR')} a été effectué.`;
    
    if (Math.abs(ecart) > 5) {
      messageNotif += ` (Ajustement : ${justification})`;
    }

    const notifData = {
      partenaireId: partnerId,
      titre: "Paiement Reçu 💰",
      message: messageNotif,
      type: 'paiement_recu',
      date: new Date().toISOString(),
      montant: montantVerser,
      preuveUrl: downloadURL,
      lu: false,
      createdAt: serverTimestamp()
    };
    batch.set(notifRef, notifData);

    await batch.commit();

    return {
      success: true,
      paiementId: paiementRef.id,
      captureEcranUrl: downloadURL,
      datePaiement: paiementData.datePaiement
    };

  } catch (error) {
    console.error("Erreur savePartnerPayment:", error);
    throw new Error(error.message || "Échec de l'enregistrement du paiement.");
  }
};