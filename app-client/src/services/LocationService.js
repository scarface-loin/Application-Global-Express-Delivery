import { getDatabase, ref, onValue, off } from 'firebase/database';

/**
 * LocationService - Interface Web Admin
 * Écoute en temps réel la position d'un ou plusieurs livreurs
 * depuis Firebase Realtime Database.
 *
 * Structure Firebase attendue (écrite par l'app Flutter) :
 * livreurs_positions/{livreurId} → {
 *   latitude, longitude, accuracy, speed, heading,
 *   isActive, lastUpdate, updatedAt, livreurId
 * }
 *
 * livraisons_tracking/{livraisonId}/livreur_position → { ...même structure }
 */
class LocationService {
  constructor() {
    this.database = getDatabase();

    // Map des listeners actifs : livreurId → unsubscribe function
    this._livreurListeners = new Map();

    // Map des listeners par livraison : livraisonId → unsubscribe function
    this._livraisonListeners = new Map();

    // Map des dernières positions connues : livreurId → positionData
    this._positions = new Map();
  }

  // ─────────────────────────────────────────────────────────────
  // ÉCOUTER UN LIVREUR PAR SON ID
  // ─────────────────────────────────────────────────────────────

  /**
   * Démarre l'écoute temps réel de la position d'un livreur.
   *
   * @param {string} livreurId - L'ID du livreur dans Firebase
   * @param {function} onPositionUpdate - Callback appelé à chaque mise à jour
   *   Reçoit : { livreurId, latitude, longitude, accuracy, speed,
   *              heading, isActive, lastUpdate, updatedAt }
   * @param {function} onError - Callback en cas d'erreur (optionnel)
   */
  watchLivreur(livreurId, onPositionUpdate, onError = null) {
    if (!livreurId) {
      console.warn('⚠️ watchLivreur: livreurId manquant');
      return;
    }

    // Si un listener existe déjà pour ce livreur, on le stoppe d'abord
    this.unwatchLivreur(livreurId);

    console.log(`👁️ Écoute démarrée pour livreur: ${livreurId}`);

    const livreurRef = ref(this.database, `livreurs_positions/${livreurId}`);

    const unsubscribe = onValue(
      livreurRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.log(`ℹ️ Aucune position disponible pour livreur: ${livreurId}`);
          onPositionUpdate({
            livreurId,
            isActive: false,
            latitude: null,
            longitude: null,
            lastUpdate: null,
          });
          return;
        }

        const data = snapshot.val();

        const position = {
          livreurId,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          accuracy: data.accuracy ?? null,
          speed: data.speed ?? 0,
          heading: data.heading ?? 0,
          isActive: data.isActive === true,
          lastUpdate: data.lastUpdate ?? null,
          updatedAt: data.updatedAt ?? null,
        };

        // Mettre à jour le cache interne
        this._positions.set(livreurId, position);

        console.log(`📍 Position reçue [${livreurId}]:`, {
          lat: position.latitude?.toFixed(6),
          lng: position.longitude?.toFixed(6),
          précision: position.accuracy ? `±${Math.round(position.accuracy)}m` : 'N/A',
          actif: position.isActive,
          vitesse: position.speed ? `${(position.speed * 3.6).toFixed(1)} km/h` : '0 km/h',
        });

        onPositionUpdate(position);
      },
      (error) => {
        console.error(`❌ Erreur écoute position [${livreurId}]:`, error);
        if (onError) onError(error);
      }
    );

    // Stocker la fonction d'arrêt
    this._livreurListeners.set(livreurId, unsubscribe);
  }

  /**
   * Arrête l'écoute de la position d'un livreur.
   * @param {string} livreurId
   */
  unwatchLivreur(livreurId) {
    if (this._livreurListeners.has(livreurId)) {
      const unsubscribe = this._livreurListeners.get(livreurId);
      unsubscribe(); // Détache le listener Firebase
      this._livreurListeners.delete(livreurId);
      this._positions.delete(livreurId);
      console.log(`🔕 Écoute arrêtée pour livreur: ${livreurId}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ÉCOUTER PLUSIEURS LIVREURS EN MÊME TEMPS
  // ─────────────────────────────────────────────────────────────

  /**
   * Écoute plusieurs livreurs simultanément.
   *
   * @param {string[]} livreurIds - Liste des IDs livreurs
   * @param {function} onPositionUpdate - Callback appelé pour chaque mise à jour
   *   Reçoit la position d'UN livreur à la fois (voir watchLivreur)
   * @param {function} onError - Callback erreur (optionnel)
   */
  watchMultipleLivreurs(livreurIds, onPositionUpdate, onError = null) {
    if (!Array.isArray(livreurIds) || livreurIds.length === 0) {
      console.warn('⚠️ watchMultipleLivreurs: liste vide ou invalide');
      return;
    }

    console.log(`👁️ Écoute de ${livreurIds.length} livreur(s):`, livreurIds);

    for (const livreurId of livreurIds) {
      this.watchLivreur(livreurId, onPositionUpdate, onError);
    }
  }

  /**
   * Arrête l'écoute de tous les livreurs.
   */
  unwatchAll() {
    console.log(`🔕 Arrêt de tous les listeners (${this._livreurListeners.size} livreur(s))`);
    for (const livreurId of this._livreurListeners.keys()) {
      this.unwatchLivreur(livreurId);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ÉCOUTER PAR LIVRAISON
  // ─────────────────────────────────────────────────────────────

  /**
   * Écoute la position du livreur associé à une livraison spécifique.
   *
   * @param {string} livraisonId
   * @param {function} onPositionUpdate
   * @param {function} onError
   */
  watchLivraison(livraisonId, onPositionUpdate, onError = null) {
    if (!livraisonId) return;

    this.unwatchLivraison(livraisonId);

    console.log(`👁️ Écoute démarrée pour livraison: ${livraisonId}`);

    const livraisonRef = ref(
      this.database,
      `livraisons_tracking/${livraisonId}/livreur_position`
    );

    const unsubscribe = onValue(
      livraisonRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onPositionUpdate({
            livraisonId,
            isActive: false,
            latitude: null,
            longitude: null,
            lastUpdate: null,
          });
          return;
        }

        const data = snapshot.val();

        const position = {
          livraisonId,
          livreurId: data.livreurId ?? null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          accuracy: data.accuracy ?? null,
          speed: data.speed ?? 0,
          heading: data.heading ?? 0,
          isActive: data.isActive === true,
          lastUpdate: data.lastUpdate ?? null,
          updatedAt: data.updatedAt ?? null,
        };

        console.log(`📍 Position reçue [livraison: ${livraisonId}]:`, {
          lat: position.latitude?.toFixed(6),
          lng: position.longitude?.toFixed(6),
          actif: position.isActive,
        });

        onPositionUpdate(position);
      },
      (error) => {
        console.error(`❌ Erreur écoute livraison [${livraisonId}]:`, error);
        if (onError) onError(error);
      }
    );

    this._livraisonListeners.set(livraisonId, unsubscribe);
  }

  /**
   * Arrête l'écoute d'une livraison.
   * @param {string} livraisonId
   */
  unwatchLivraison(livraisonId) {
    if (this._livraisonListeners.has(livraisonId)) {
      const unsubscribe = this._livraisonListeners.get(livraisonId);
      unsubscribe();
      this._livraisonListeners.delete(livraisonId);
      console.log(`🔕 Écoute livraison arrêtée: ${livraisonId}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITAIRES
  // ─────────────────────────────────────────────────────────────

  /**
   * Retourne la dernière position connue d'un livreur (depuis le cache).
   * @param {string} livreurId
   * @returns {object|null}
   */
  getLastPosition(livreurId) {
    return this._positions.get(livreurId) ?? null;
  }

  /**
   * Retourne toutes les positions connues.
   * @returns {Map<string, object>}
   */
  getAllPositions() {
    return this._positions;
  }

  /**
   * Vérifie si un livreur est actuellement actif (GPS allumé).
   * @param {string} livreurId
   * @returns {boolean}
   */
  isLivreurActive(livreurId) {
    const pos = this._positions.get(livreurId);
    return pos?.isActive === true;
  }

  /**
   * Retourne le nombre de secondes depuis la dernière mise à jour GPS.
   * @param {string} livreurId
   * @returns {number|null}
   */
  getSecondsSinceLastUpdate(livreurId) {
    const pos = this._positions.get(livreurId);
    if (!pos?.lastUpdate) return null;
    return Math.floor((Date.now() - pos.lastUpdate) / 1000);
  }
}

// Instance singleton exportée
const locationService = new LocationService();
export default locationService;