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

    // 4. Gestion Garage — avec détails complets de la session
    if (garageRequest && garageRequest.actif) {

      // Résumé des livraisons de la session
      const livraisonsResume = livraisons.map(liv => {
        const livrees  = liv.articles.filter(a => parseInt(a.quantiteLivree  || 0) > 0);
        const retours  = liv.articles.filter(a => parseInt(a.quantiteRetournee || 0) > 0);
        const perdues  = liv.articles.filter(a => parseInt(a.quantitePerdue  || 0) > 0);
        return {
          livraisonId:    liv.id,
          tracking:       liv.trackingNumber || liv.id,
          quartier:       liv.quartier || 'N/A',
          origine:        liv.origine,
          totalCalcule:   parseFloat(liv.totalCalcule || 0),
          coutPrestation: parseFloat(liv.coutPrestation || 0),
          nbArticlesLivres:    livrees.length,
          nbArticlesRetournes: retours.length,
          nbArticlesPerdus:    perdues.length,
          articles: liv.articles.map(a => ({
            nom:               a.nom || a.designation || 'Article',
            quantiteCommandee: parseInt(a.quantiteCommandee || 0),
            quantiteLivree:    parseInt(a.quantiteLivree   || 0),
            quantiteRetournee: parseInt(a.quantiteRetournee|| 0),
            quantitePerdue:    parseInt(a.quantitePerdue   || 0),
            coutUnitaire:      parseFloat(a.coutUnitaire   || 0),
          }))
        };
      });

      batchPromises.push(
        addDoc(collection(db, "demandes_garage"), {
          // ── Identifiants ──────────────────────────────────────────
          livreurId,
          livreurNom,
          creePar: adminId,
          statut: 'en_attente',
          dateCreation: now,

          // ── Motif garage ──────────────────────────────────────────
          motif:       garageRequest.motif,
          description: garageRequest.description || "Demande créée lors de la validation",
          montantManquant: parseFloat(garageRequest.montantEstime || 0),
          urgence: 'normale',

          // ── Détails financiers de la session ─────────────────────
          session: {
            date:                    now,
            nbCourses:               livraisons.length,

            // Montants
            montantTheorique:        parseFloat(montantTheorique),
            montantRecu:             parseFloat(montantRecu),
            cashManquant:            parseFloat(cashManquant),
            montantPerduArticles:    parseFloat(montantPerduArticles),
            totalDetteAjoutee:       parseFloat(totalDetteAjoutee),
            montantAttenduFinal:     parseFloat(montantAttenduFinal),

            // Écart
            ecartCash: parseFloat(montantTheorique) - parseFloat(montantRecu),

            // Notes admin
            notes: notes || "",

            // Livraisons détaillées
            livraisons: livraisonsResume,

            // Récap articles globaux
            totalArticlesLivres:    livraisons.reduce((s, l) =>
              s + l.articles.filter(a => parseInt(a.quantiteLivree || 0) > 0).length, 0),
            totalArticlesRetournes: livraisons.reduce((s, l) =>
              s + l.articles.filter(a => parseInt(a.quantiteRetournee || 0) > 0).length, 0),
            totalArticlesPerdus:    livraisons.reduce((s, l) =>
              s + l.articles.filter(a => parseInt(a.quantitePerdue || 0) > 0).length, 0),
          }
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