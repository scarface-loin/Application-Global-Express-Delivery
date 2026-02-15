import { getDatabase, ref, set, onDisconnect } from 'firebase/database';

class LocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.livreurId = null;
    this.activeLivraisonsIds = [];
    this.database = null;
    this.lastPosition = null;
    this.updateInterval = null;
    this.wakeLock = null;
    this.isPageVisible = true;
    this.backgroundInterval = null;
    this.visibilityChangeHandler = null;
  }

  async startTracking(livreurId, livraisonsIds = []) {
    try {
      console.log('🚀 Démarrage du suivi GPS pour livreur:', livreurId);
      console.log('📦 Livraisons actives:', livraisonsIds);

      this.livreurId = livreurId;
      this.activeLivraisonsIds = livraisonsIds;
      this.database = getDatabase();

      if (!navigator.geolocation) {
        throw new Error('La géolocalisation n\'est pas supportée par votre navigateur');
      }

      const permission = await this.checkPermission();
      if (!permission) {
        throw new Error('Permission de géolocalisation refusée');
      }

      await this.requestWakeLock();
      this.setupVisibilityHandler();
      this.startGeolocationWatch();
      this.startPeriodicUpdates();

      this.isTracking = true;
      console.log('✅ Suivi GPS activé avec succès');
      return { success: true };

    } catch (error) {
      console.error('❌ Erreur démarrage GPS:', error);
      throw error;
    }
  }

  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('🔒 Wake Lock activé - L\'écran restera actif');

        this.wakeLock.addEventListener('release', () => {
          console.log('🔓 Wake Lock libéré');
        });
      } else {
        console.log('⚠️ Wake Lock non supporté sur ce navigateur');
      }
    } catch (err) {
      console.warn('⚠️ Impossible d\'activer Wake Lock:', err);
    }
  }

  setupVisibilityHandler() {
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        console.log('📱 App passée en arrière-plan');
        this.isPageVisible = false;
        this.handleBackgroundMode();
      } else {
        console.log('📱 App revenue au premier plan');
        this.isPageVisible = true;
        this.handleForegroundMode();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    window.addEventListener('beforeunload', () => {
      this.sendFinalUpdate();
    });

    window.addEventListener('pagehide', () => {
      this.sendFinalUpdate();
    });
  }

  handleBackgroundMode() {
    console.log('🌙 Mode arrière-plan activé - Augmentation de la fréquence');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.backgroundInterval = setInterval(() => {
      if (this.lastPosition) {
        console.log('🔄 Mise à jour en arrière-plan');
        this.sendLocationUpdate(this.lastPosition);
      }
    }, 5000);

    if (this.lastPosition) {
      this.sendLocationUpdate(this.lastPosition);
    }
  }

  handleForegroundMode() {
    console.log('☀️ Mode premier plan activé - Retour à la fréquence normale');
    
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
    }

    this.startPeriodicUpdates();
    this.forceUpdate();
  }

  startGeolocationWatch() {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handleError(error),
      options
    );
  }

  startPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      if (this.lastPosition && this.isPageVisible) {
        this.sendLocationUpdate(this.lastPosition);
      }
    }, 10000);
  }

  async checkPermission() {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state === 'granted' || result.state === 'prompt';
      }
      return true;
    } catch (error) {
      console.warn('Impossible de vérifier les permissions:', error);
      return true;
    }
  }

  handlePositionUpdate(position) {
    const coords = position.coords;
    
    this.lastPosition = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      speed: coords.speed || 0,
      heading: coords.heading || 0,
      timestamp: position.timestamp,
      updatedAt: new Date().toISOString(),
      isBackground: !this.isPageVisible,
    };

    console.log('📍 Nouvelle position:', {
      lat: coords.latitude.toFixed(6),
      lng: coords.longitude.toFixed(6),
      accuracy: `${coords.accuracy.toFixed(0)}m`,
      background: !this.isPageVisible,
    });

    this.sendLocationUpdate(this.lastPosition);
  }

  async sendLocationUpdate(locationData) {
    if (!this.database || !this.livreurId) {
      console.warn('⚠️ Base de données ou livreurId non initialisé');
      return;
    }

    try {
      const timestamp = Date.now();

      const livreurLocationRef = ref(this.database, `livreurs_positions/${this.livreurId}`);
      await set(livreurLocationRef, {
        ...locationData,
        livreurId: this.livreurId,
        isActive: true,
        lastUpdate: timestamp,
      });

      for (const livraisonId of this.activeLivraisonsIds) {
        const livraisonLocationRef = ref(
          this.database,
          `livraisons_tracking/${livraisonId}/livreur_position`
        );

        await set(livraisonLocationRef, {
          ...locationData,
          livreurId: this.livreurId,
          livraisonId: livraisonId,
          lastUpdate: timestamp,
        });

        onDisconnect(livraisonLocationRef).remove();
      }

      onDisconnect(livreurLocationRef).set({
        livreurId: this.livreurId,
        isActive: false,
        lastUpdate: timestamp,
      });

      const bgMarker = locationData.isBackground ? '(arrière-plan)' : '';
      console.log(`✅ Position envoyée ${bgMarker} pour ${this.activeLivraisonsIds.length} livraison(s)`);

    } catch (error) {
      console.error('❌ Erreur envoi position:', error);
    }
  }

  sendFinalUpdate() {
    if (this.lastPosition && this.database && this.livreurId) {
      const livreurLocationRef = ref(this.database, `livreurs_positions/${this.livreurId}`);
      
      navigator.sendBeacon(
        'https://app-global-express-delivery-default-rtdb.firebaseio.com/livreurs_positions/' + 
        this.livreurId + '.json',
        JSON.stringify({
          ...this.lastPosition,
          livreurId: this.livreurId,
          isActive: false,
          lastUpdate: Date.now(),
        })
      );
      
      console.log('📤 Mise à jour finale envoyée via sendBeacon');
    }
  }

  handleError(error) {
    let errorMessage = '';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permission de géolocalisation refusée';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Position indisponible';
        break;
      case error.TIMEOUT:
        errorMessage = 'Délai de géolocalisation dépassé';
        break;
      default:
        errorMessage = 'Erreur de géolocalisation inconnue';
    }

    console.error('❌ Erreur GPS:', errorMessage, error);
  }

  updateActiveLivraisons(livraisonsIds) {
    console.log('🔄 Mise à jour des livraisons actives:', livraisonsIds);
    
    const removedIds = this.activeLivraisonsIds.filter(id => !livraisonsIds.includes(id));
    
    for (const livraisonId of removedIds) {
      this.removeTrackingForLivraison(livraisonId);
    }

    this.activeLivraisonsIds = livraisonsIds;

    if (this.lastPosition) {
      this.sendLocationUpdate(this.lastPosition);
    }
  }

  async removeTrackingForLivraison(livraisonId) {
    if (!this.database) return;

    try {
      const livraisonLocationRef = ref(
        this.database,
        `livraisons_tracking/${livraisonId}`
      );
      await set(livraisonLocationRef, null);
      console.log(`🗑️ Suivi supprimé pour livraison: ${livraisonId}`);
    } catch (error) {
      console.error('Erreur suppression tracking:', error);
    }
  }

  async stopTracking() {
    console.log('🛑 Arrêt du suivi GPS');

    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
    }

    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
      } catch (err) {
        console.warn('Erreur libération Wake Lock:', err);
      }
    }

    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    if (this.database && this.livreurId) {
      const livreurLocationRef = ref(this.database, `livreurs_positions/${this.livreurId}`);
      await set(livreurLocationRef, {
        livreurId: this.livreurId,
        isActive: false,
        lastUpdate: Date.now(),
      });

      for (const livraisonId of this.activeLivraisonsIds) {
        await this.removeTrackingForLivraison(livraisonId);
      }
    }

    this.isTracking = false;
    this.lastPosition = null;
    this.activeLivraisonsIds = [];
    
    console.log('✅ Suivi GPS arrêté');
  }

  getLastPosition() {
    return this.lastPosition;
  }

  isActive() {
    return this.isTracking;
  }

  forceUpdate() {
    if (!this.isTracking) {
      console.warn('⚠️ Le suivi GPS n\'est pas actif');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }
}

const locationService = new LocationService();

export default locationService;