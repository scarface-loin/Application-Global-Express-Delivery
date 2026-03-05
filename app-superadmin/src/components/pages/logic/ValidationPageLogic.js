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
 */
export const fetchLivreursAValider = async () => {
  try {
    const qInterne = query(
      collection(db, "livraisons"), 
      where("dateValidation", "==", null), 
      where("livreurId", "!=", null)
    );

    const qPartenaire = query(
      collection(db, "livraison_partenaire"),
      where("statut", "==", "en_cours"), 
      where("livreurId", "!=", null)
    );

    const [snapInterne, snapPartenaire] = await Promise.all([
      getDocs(qInterne),
      getDocs(qPartenaire)
    ]);

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
        quantiteLivree: parseInt(art.quantiteCommandee || 0),
        quantiteRetournee: 0,
        quantitePerdue: 0,
        coutUnitaire: parseFloat(art.coutUnitaire || 0)
      }));

      const totalArticles = articles.reduce((sum, art) => sum + (art.quantiteLivree * art.coutUnitaire), 0);
      const coutPrestation = parseFloat(data.coutPrestation || 0);
      const montantTotalEstime = origine === 'partenaire' 
        ? parseFloat(data.totalGeneral || 0) 
        : (totalArticles + coutPrestation);

      livreursMap[lid].totalCollecte += montantTotalEstime;
      livreursMap[lid].nbLivraisons++;
      
      livreursMap[lid].livraisons.push({
        id: docSnap.id,
        origine: origine,
        trackingNumber: data.numeroSuivi,
        statutOriginal: data.statut,
        coutPrestation: coutPrestation,
        quartier: data.infosLivraison?.quartier || data.infosLivraison?.villeDestination || 'N/A',
        infosLivraison: data.infosLivraison || {},
        articles: articles,
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
 * Vérifie que tous les articles de toutes les livraisons ont un statut défini.
 * Un article est "sans statut" si quantiteLivree + quantiteRetournee + quantitePerdue === 0.
 * Retourne la liste des livraisons avec articles problématiques, ou [] si tout est OK.
 */
export const verifierArticlesSansStatut = (livraisons) => {
  const problemes = [];

  livraisons.forEach(liv => {
    const articlesSansStatut = (liv.articles || []).filter(art => {
      const livree = parseInt(art.quantiteLivree || 0);
      const retournee = parseInt(art.quantiteRetournee || 0);
      const perdue = parseInt(art.quantitePerdue || 0);
      return livree === 0 && retournee === 0 && perdue === 0;
    });

    if (articlesSansStatut.length > 0) {
      problemes.push({
        livraisonId: liv.id,
        tracking: liv.trackingNumber || liv.id,
        quartier: liv.quartier,
        articles: articlesSansStatut.map(a => a.nom || a.designation || 'Article sans nom')
      });
    }
  });

  return problemes;
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
  // Guard : bloquer si des articles n'ont aucun des 3 statuts
  const problemes = verifierArticlesSansStatut(livraisons);
  if (problemes.length > 0) {
    const details = problemes.map(p =>
      `• Livraison ${p.tracking} (${p.quartier}) : ${p.articles.join(', ')}`
    ).join('\n');
    throw new Error(
      `Impossible de valider : des articles n'ont aucun statut (livré / retourné / perdu) :\n\n${details}`
    );
  }

  try {
    const adminId = localStorage.getItem('admin_id') || 'ADMIN';
    const now = new Date().toISOString();
    const batchPromises = [];

    // 1. Mise à jour des livraisons individuelles
    livraisons.forEach(liv => {
      const collectionName = (liv.origine === 'partenaire') ? 'livraison_partenaire' : 'livraisons';
      const ref = doc(db, collectionName, liv.id);
      
      const isTotalementLivre = liv.articles.every(a => a.quantiteLivree > 0 && a.quantiteRetournee === 0);
      const isTotalementRetour = liv.articles.every(a => a.quantiteLivree === 0 && a.quantiteRetournee > 0);
      
      let statutFinal = 'partiel';
      if (isTotalementLivre) statutFinal = 'livre';
      else if (isTotalementRetour) statutFinal = 'non_livre';

      const updateData = {
        dateValidation: now,
        adminIdValidation: adminId,
        statut: statutFinal,
        articles: liv.articles,
        totalFinalEncaisse: liv.totalCalcule, 
        updatedAt: serverTimestamp()
      };

      // CORRECTION : dateLivraison est écrit pour TOUS les statuts partenaire validés,
      // pas uniquement 'livre'. C'est ce champ qui permet l'apparition dans le récapitulatif.
      if (liv.origine === 'partenaire') {
        updateData.dateLivraison = now;
      }

      batchPromises.push(updateDoc(ref, updateData));
    });

    // 2. Calcul des Dettes
    const cashManquant = Math.max(0, montantTheorique - montantRecu);
    const totalDetteAjoutee = cashManquant + montantPerduArticles;

    // 3. Enregistrement du versement global
    // Pour les expéditions (hors ville), le montant n'est pas encaissé par le livreur.
    // On calcule le montant attendu en ne comptant que les livraisons de type 'course'.
    const montantExpeditions = livraisons
      .filter(liv => liv.infosLivraison?.type === 'expedition')
      .reduce((sum, liv) => sum + (liv.totalCalcule || 0), 0);
    const montantAttenduFinal = Math.max(0, parseFloat(montantTheorique) - montantExpeditions);

    batchPromises.push(
      addDoc(collection(db, "versements_livreurs"), {
        livreurId,
        livreurNom,
        montantAttendu: montantAttenduFinal,
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

    // 4. Gestion Garage
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