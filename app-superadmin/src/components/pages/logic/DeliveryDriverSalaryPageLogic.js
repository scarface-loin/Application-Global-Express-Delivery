import { db, storage } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  increment,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Récupère toutes les données nécessaires pour le calcul des salaires pour une période donnée.
 * Prend en compte les validations GARAGE pour réduire la dette affichée.
 * @param {string} period - La période au format "YYYY-MM"
 */
export const fetchSalaryData = async (period) => {
  try {
    // 1. Définir la plage de dates
    const startDate = new Date(`${period}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1, 0); 
    endDate.setHours(23, 59, 59, 999);

    // 2. Requêtes
    const livreursQuery = query(collection(db, "livreurs"));
    
    // Livraisons (Primes)
    const deliveriesQuery = query(
      collection(db, "livraisons"),
      where("dateValidation", ">=", startDate.toISOString()),
      where("dateValidation", "<=", endDate.toISOString())
    );

    // Manquants (Dettes créées)
    const versementsQuery = query(
      collection(db, "versements_livreurs"),
      where("date", ">=", startDate.toISOString()),
      where("date", "<=", endDate.toISOString())
    );

    // Garages Validés (Dettes annulées/Régularisations)
    // On regarde la dateValidation car c'est à ce moment que la dette est effacée
    const garagesQuery = query(
      collection(db, "demandes_garage"),
      where("statut", "==", "valide"),
      where("dateValidation", ">=", startDate.toISOString()),
      where("dateValidation", "<=", endDate.toISOString())
    );

    // Paiements déjà effectués
    const paymentsQuery = query(collection(db, "paiements_salaires"), where("periode", "==", period));

    // Exécution parallèle
    const [livreursSnap, deliveriesSnap, versementsSnap, garagesSnap, paymentsSnap] = await Promise.all([
      getDocs(livreursQuery),
      getDocs(deliveriesQuery),
      getDocs(versementsQuery),
      getDocs(garagesQuery),
      getDocs(paymentsQuery)
    ]);

    // 3. Organisation des données
    const deliveriesByLivreur = {};
    deliveriesSnap.forEach(d => {
      const data = d.data();
      if (!deliveriesByLivreur[data.livreurId]) deliveriesByLivreur[data.livreurId] = [];
      deliveriesByLivreur[data.livreurId].push(data);
    });

    const versementsByLivreur = {};
    versementsSnap.forEach(v => {
      const data = v.data();
      if (!versementsByLivreur[data.livreurId]) versementsByLivreur[data.livreurId] = [];
      versementsByLivreur[data.livreurId].push(data);
    });

    const garagesByLivreur = {};
    garagesSnap.forEach(g => {
      const data = g.data();
      // On utilise livreurId ou idLivreur selon ce qui a été enregistré
      const lId = data.livreurId || data.idLivreur; 
      if (!garagesByLivreur[lId]) garagesByLivreur[lId] = [];
      garagesByLivreur[lId].push(data);
    });

    const paymentsByLivreur = {};
    paymentsSnap.forEach(p => {
      const data = p.data();
      paymentsByLivreur[data.livreurId] = data;
    });

    // 4. Construction de l'objet final
    const livreursData = [];
    livreursSnap.forEach(livreurDoc => {
      const livreur = { id: livreurDoc.id, ...livreurDoc.data() };
      const livreurId = livreur.id;
      
      const deliveries = deliveriesByLivreur[livreurId] || [];
      const versements = versementsByLivreur[livreurId] || [];
      const garages = garagesByLivreur[livreurId] || [];

      // Stats activité
      const livraisonsEffectuees = deliveries.length;
      const uniqueDays = new Set(deliveries.map(d => new Date(d.dateValidation).toISOString().split('T')[0]));
      const joursTravailles = uniqueDays.size;

      // --- CALCUL DU NET MANQUANT (Dettes - Garages) ---
      
      // Liste détaillée pour l'affichage (Mélange dettes et régularisations)
      let detailsFinanciers = [];

      // A. Les Dettes (Versements manquants)
      let totalDettes = 0;
      versements.forEach(v => {
        const montant = (v.montantManquant || 0) + (v.montantPerduMarchandise || 0);
        if (montant > 0) {
          totalDettes += montant;
          detailsFinanciers.push({
            type: 'dette', // Pour couleur rouge
            montant: montant,
            motif: v.notes || "Manquant versement",
            date: new Date(v.date).toLocaleDateString('fr-FR')
          });
        }
      });

      // B. Les Régularisations (Garages Validés)
      let totalRegularisations = 0;
      garages.forEach(g => {
        const montant = parseFloat(g.coutReel || g.montantValide || 0);
        if (montant > 0) {
          totalRegularisations += montant;
          detailsFinanciers.push({
            type: 'credit', // Pour couleur verte
            montant: montant, // Sera affiché en positif pour dire "Dette annulée"
            motif: `Régularisation Garage: ${g.motif || 'Réparation'}`,
            date: new Date(g.dateValidation).toLocaleDateString('fr-FR')
          });
        }
      });

      // Le total manquant réel est la différence
      // Si négatif (on lui doit de l'argent), on met à 0 pour les manquants (ou on gère un bonus)
      // Ici on suppose que le garage annule juste la dette.
      let totalManquantsCalculated = totalDettes - totalRegularisations;
      if (totalManquantsCalculated < 0) totalManquantsCalculated = 0;

      // Calculs Salaires
      const salaireBase = livreur.finance?.salaireBase || 50000;
      const primeParLivraison = livreur.finance?.primeParLivraison || 250;
      const primesLivraisons = livraisonsEffectuees * primeParLivraison;
      const salaireBrut = salaireBase + primesLivraisons;
      const salaireNet = salaireBrut - totalManquantsCalculated;

      const payment = paymentsByLivreur[livreurId];
      
      livreursData.push({
        id: livreurId,
        nom: livreur.nom,
        photo: livreur.photoUrl || '👨‍🦱',
        joursTravailles,
        livraisonsEffectuees,
        salaireBase,
        primeParLivraison,
        primesLivraisons,
        salaireBrut,
        
        // On passe la liste mixte pour l'afficher dans le modal détails
        manquants: detailsFinanciers, 
        
        // C'est ce chiffre qui sera soustrait du salaire
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

/**
 * Met à jour la configuration salariale.
 */
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
    console.error("Erreur updateDriverSalaryConfig:", error);
    throw new Error("Échec de la mise à jour de la configuration.");
  }
};

/**
 * Ajoute une déduction manuelle.
 */
export const addSalaryDeduction = async (livreurId, livreurNom, montant, motif, period) => {
  try {
    const batch = writeBatch(db);

    const versementRef = doc(collection(db, "versements_livreurs"));
    batch.set(versementRef, {
      livreurId,
      livreurNom,
      montantManquant: montant,
      montantPerduMarchandise: 0,
      notes: `Déduction manuelle: ${motif}`,
      date: new Date().toISOString(),
      adminId: localStorage.getItem('admin_id') || 'ADMIN',
      createdAt: serverTimestamp(),
      periodeSalaire: period
    });

    const livreurRef = doc(db, "livreurs", livreurId);
    batch.update(livreurRef, {
      "finance.detteActuelle": increment(montant)
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Erreur addSalaryDeduction:", error);
    throw new Error("Impossible d'ajouter la déduction.");
  }
};

/**
 * Enregistre le paiement du salaire.
 */
export const saveSalaryPayment = async (livreurId, livreurNom, montantPaye, period, imageFile) => {
  try {
    const timestamp = Date.now();
    const storageRef = ref(storage, `preuves_paiement_salaires/${period}/${livreurId}_${timestamp}`);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    const paymentData = {
      livreurId,
      livreurNom,
      montantPaye,
      periode: period,
      captureEcranUrl: downloadURL,
      datePaiement: new Date().toISOString(),
      creePar: localStorage.getItem('admin_id') || 'ADMIN',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'paiements_salaires'), paymentData);
    
    return { 
      success: true, 
      captureEcran: downloadURL, 
      datePaiement: paymentData.datePaiement 
    };
  } catch (error) {
    console.error("Erreur saveSalaryPayment:", error);
    throw new Error("Échec de l'enregistrement du paiement.");
  }
};