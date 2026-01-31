import { db } from '../../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  increment 
} from 'firebase/firestore';

// ... (Garder fetchLivreursAValider inchangé) ...
export const fetchLivreursAValider = async () => {
  try {
    const qInterne = query(collection(db, "livraisons"), where("dateValidation", "==", null), where("livreurId", "!=", null));
    const qPartenaire = query(collection(db, "livraison_partenaire"), where("dateValidation", "==", null), where("livreurId", "!=", null));
    const [snapInterne, snapPartenaire] = await Promise.all([getDocs(qInterne), getDocs(qPartenaire)]);
    const livreursMap = {};

    const processDoc = (docSnap, origine) => {
      const data = docSnap.data();
      const lid = data.livreurId;
      if (!livreursMap[lid]) {
        livreursMap[lid] = {
          id: lid,
          nom: data.livreurNom || 'Livreur Inconnu',
          livraisons: [],
          totalCollecte: 0,
          nbLivraisons: 0,
          statut: 'en_attente'
        };
      }
      
      const articles = (data.articles || []).map(art => ({
        ...art,
        quantiteLivree: data.statut === 'livre' ? art.quantiteCommandee : 0,
        quantiteRetournee: data.statut === 'non_livre' ? art.quantiteCommandee : 0,
        quantitePerdue: 0,
        coutUnitaire: parseFloat(art.coutUnitaire || 0)
      }));

      const montant = data.totalGeneral || 0;
      if (data.statut === 'livre') {
        livreursMap[lid].totalCollecte += montant;
      }
      
      livreursMap[lid].nbLivraisons++;
      livreursMap[lid].livraisons.push({
        id: docSnap.id,
        origine: origine,
        trackingNumber: data.numeroSuivi,
        statutOriginal: data.statut,
        coutPrestation: parseFloat(data.coutPrestation || 0),
        quartier: data.infosLivraison?.quartier || 'N/A',
        articles: articles, 
      });
    };

    snapInterne.forEach(d => processDoc(d, 'interne'));
    snapPartenaire.forEach(d => processDoc(d, 'partenaire'));
    
    return Object.values(livreursMap);

  } catch (error) {
    console.error(error);
    throw new Error("Impossible de charger les livreurs.");
  }
};

/**
 * CLÔTURE FINALE AVEC GESTION GARAGE ET CASH MANQUANT
 */
export const validerSessionLivreur = async ({ 
  livreurId, 
  livreurNom, 
  livraisons, 
  montantTheorique, // Ce qu'il devait avoir
  montantRecu,      // Ce qu'il a donné (Cash)
  montantPerduArticles, // Valeur des marchandises perdues
  garageRequest,    // Objet { actif: true, motif: "...", montantEstime: 10000 }
  notes 
}) => {
  try {
    const adminId = localStorage.getItem('admin_id') || 'ADMIN';
    const now = new Date().toISOString();
    const batchPromises = [];

    // 1. Mise à jour des livraisons individuelles
    livraisons.forEach(liv => {
      const collectionName = liv.origine === 'partenaire' ? 'livraison_partenaire' : 'livraisons';
      const ref = doc(db, collectionName, liv.id);
      
      batchPromises.push(
        updateDoc(ref, {
          dateValidation: now,
          adminIdValidation: adminId,
          statut: 'valide',
          articles: liv.articles,
          totalFinalEncaisse: liv.totalCalcule, 
          updatedAt: serverTimestamp()
        })
      );
    });

    // 2. Calcul des Dettes
    // Cash manquant = Ce qu'il devait avoir - Ce qu'il a donné
    const cashManquant = Math.max(0, montantTheorique - montantRecu);
    
    // Total à ajouter à la dette = Cash Manquant + Marchandise Perdue
    const totalDetteAjoutee = cashManquant + montantPerduArticles;

    // 3. Enregistrement du versement global
    batchPromises.push(
      addDoc(collection(db, "versements_livreurs"), {
        livreurId,
        livreurNom,
        montantAttendu: parseFloat(montantTheorique),
        montantVerse: parseFloat(montantRecu),
        montantManquant: parseFloat(cashManquant), // Cash perdu/gardé
        montantPerduMarchandise: parseFloat(montantPerduArticles),
        date: now,
        nbCourses: livraisons.length,
        adminId,
        notes: notes || "",
        garageDemande: garageRequest ? true : false,
        createdAt: serverTimestamp()
      })
    );

    // 4. Gestion de la Demande Garage (Si activée)
    if (garageRequest && garageRequest.actif) {
      batchPromises.push(
        addDoc(collection(db, "demandes_garage"), {
          livreurId,
          livreurNom,
          motif: garageRequest.motif,
          description: garageRequest.description || "Demande créée lors de la validation",
          montantManquant: parseFloat(garageRequest.montantEstime || 0), // Souvent égal au cash manquant
          urgence: 'normale',
          statut: 'en_attente', // Pour validation Super Admin
          dateCreation: now,
          creePar: adminId
        })
      );
      
      // Notification Admin (optionnel, selon ta structure)
      batchPromises.push(
         addDoc(collection(db, "notifications_admin"), {
           type: "demande_garage",
           message: `Nouvelle demande garage pour ${livreurNom}`,
           lu: false,
           createdAt: serverTimestamp(),
           demandeId: null // Sera mis à jour si on faisait autrement, mais ici c'est ok
         })
      );
    }

    // 5. Mise à jour de la dette du livreur
    // On ajoute TOUT en dette. Si le garage est validé plus tard par le Super Admin, 
    // la fonction 'validerDemandeGarage' viendra REDUIRE cette dette.
    if (totalDetteAjoutee > 0) {
      const livreurRef = doc(db, "livreurs", livreurId);
      batchPromises.push(
        updateDoc(livreurRef, {
          "finance.detteActuelle": increment(totalDetteAjoutee)
        })
      );
    }
    
    await Promise.all(batchPromises);
    return { success: true };

  } catch (error) {
    console.error("Erreur validerSessionLivreur:", error);
    throw new Error("Échec de la validation.");
  }
};