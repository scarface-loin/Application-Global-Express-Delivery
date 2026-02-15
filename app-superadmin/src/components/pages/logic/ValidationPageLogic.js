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

/**
 * CHARGEMENT DES DONNÉES
 * MODIFICATION : Force l'affichage en "Livré" par défaut
 */
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
      
      // --- LOGIQUE MODIFIÉE POUR L'INTERFACE ---
      // On force la quantité livrée au maximum (comme si succès)
      // On met la quantité retournée à 0
      const articles = (data.articles || []).map(art => ({
        ...art,
        quantiteLivree: parseInt(art.quantiteCommandee || 0), // Force Vert au max
        quantiteRetournee: 0,                                 // Force Bleu à 0
        quantitePerdue: 0,                                    // Force Rouge à 0
        coutUnitaire: parseFloat(art.coutUnitaire || 0)
      }));

      // Calcul du montant théorique de CETTE livraison (Articles + Livraison)
      // On recalcule car on vient de forcer le statut "Livré"
      const totalArticles = articles.reduce((sum, art) => sum + (art.quantiteLivree * art.coutUnitaire), 0);
      const coutPrestation = parseFloat(data.coutPrestation || 0);
      const montantTotalEstime = totalArticles + coutPrestation;

      // On ajoute ce montant au total que le livreur doit ramener (Total à encaisser)
      livreursMap[lid].totalCollecte += montantTotalEstime;
      
      livreursMap[lid].nbLivraisons++;
      livreursMap[lid].livraisons.push({
        id: docSnap.id,
        origine: origine,
        trackingNumber: data.numeroSuivi,
        statutOriginal: data.statut, // On garde l'info originale au cas où
        coutPrestation: coutPrestation,
        quartier: data.infosLivraison?.quartier || 'N/A',
        articles: articles, // Contient nos valeurs forcées "Livrées"
        totalCalcule: montantTotalEstime
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
  montantTheorique, 
  montantRecu,      
  montantPerduArticles,
  garageRequest,    
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
      
      // Détermination du statut final basé sur les quantités validées
      const isTotalementLivre = liv.articles.every(a => a.quantiteLivree > 0 && a.quantiteRetournee === 0);
      const isTotalementRetour = liv.articles.every(a => a.quantiteLivree === 0 && a.quantiteRetournee > 0);
      
      let statutFinal = 'partiel';
      if (isTotalementLivre) statutFinal = 'livre';
      else if (isTotalementRetour) statutFinal = 'non_livre';

      batchPromises.push(
        updateDoc(ref, {
          dateValidation: now,
          adminIdValidation: adminId,
          statut: statutFinal, // Statut mis à jour selon la validation admin
          articles: liv.articles,
          totalFinalEncaisse: liv.totalCalcule, 
          updatedAt: serverTimestamp()
        })
      );
    });

    // 2. Calcul des Dettes
    const cashManquant = Math.max(0, montantTheorique - montantRecu);
    const totalDetteAjoutee = cashManquant + montantPerduArticles;

    // 3. Enregistrement du versement global
    batchPromises.push(
      addDoc(collection(db, "versements_livreurs"), {
        livreurId,
        livreurNom,
        montantAttendu: parseFloat(montantTheorique),
        montantVerse: parseFloat(montantRecu),
        montantManquant: parseFloat(cashManquant),
        montantPerduMarchandise: parseFloat(montantPerduArticles),
        date: now,
        nbCourses: livraisons.length,
        adminId,
        notes: notes || "",
        garageDemande: garageRequest ? true : false,
        createdAt: serverTimestamp()
      })
    );

    // 4. Gestion de la Demande Garage
    if (garageRequest && garageRequest.actif) {
      batchPromises.push(
        addDoc(collection(db, "demandes_garage"), {
          livreurId,
          livreurNom,
          motif: garageRequest.motif,
          description: garageRequest.description || "Demande créée lors de la validation",
          montantManquant: parseFloat(garageRequest.montantEstime || 0),
          urgence: 'normale',
          statut: 'en_attente',
          dateCreation: now,
          creePar: adminId
        })
      );
      
      batchPromises.push(
         addDoc(collection(db, "notifications_admin"), {
           type: "demande_garage",
           message: `Nouvelle demande garage pour ${livreurNom}`,
           lu: false,
           createdAt: serverTimestamp(),
           demandeId: null
         })
      );
    }

    // 5. Mise à jour de la dette du livreur
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