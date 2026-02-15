import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { FiNavigation2, FiMapPin, FiClock, FiPackage } from 'react-icons/fi';

/**
 * Composant de suivi en temps réel pour les clients
 * Affiche la position actuelle du livreur sur une carte
 * 
 * @param {string} livraisonId - ID de la livraison à suivre
 * @param {string} googleMapsApiKey - Clé API Google Maps (optionnel)
 */
export default function LiveDeliveryTracking({ livraisonId, googleMapsApiKey }) {
  const [livreurPosition, setLivreurPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!livraisonId) {
      setError("ID de livraison manquant");
      setLoading(false);
      return;
    }

    const db = getDatabase();
    const positionRef = ref(db, `livraisons_tracking/${livraisonId}/livreur_position`);

    console.log('🔍 Écoute de la position pour livraison:', livraisonId);

    // Écouter les changements en temps réel
    const handleUpdate = (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        console.log('📍 Position reçue:', data);
        setLivreurPosition(data);
        setLastUpdate(new Date(data.updatedAt || data.timestamp));
        setError(null);
      } else {
        console.log('⚠️ Aucune position disponible');
        setLivreurPosition(null);
      }
      
      setLoading(false);
    };

    const handleError = (err) => {
      console.error('❌ Erreur Firebase:', err);
      setError("Impossible de charger la position du livreur");
      setLoading(false);
    };

    // S'abonner aux mises à jour
    onValue(positionRef, handleUpdate, handleError);

    // Nettoyer l'abonnement à la déconnexion
    return () => {
      console.log('🧹 Nettoyage de l\'abonnement');
      off(positionRef, 'value', handleUpdate);
    };
  }, [livraisonId]);

  // Calculer le temps écoulé depuis la dernière mise à jour
  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return null;
    
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 1000); // en secondes
    
    if (diff < 60) return `il y a ${diff} seconde${diff > 1 ? 's' : ''}`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} minute${Math.floor(diff / 60) > 1 ? 's' : ''}`;
    return `il y a ${Math.floor(diff / 3600)} heure${Math.floor(diff / 3600) > 1 ? 's' : ''}`;
  };

  // Ouvrir Google Maps avec la position
  const openInGoogleMaps = () => {
    if (!livreurPosition) return;
    
    const url = `https://www.google.com/maps/search/?api=1&query=${livreurPosition.latitude},${livreurPosition.longitude}`;
    window.open(url, '_blank');
  };

  // Ouvrir Apple Plans (pour iOS/Safari)
  const openInAppleMaps = () => {
    if (!livreurPosition) return;
    
    const url = `maps://maps.apple.com/?q=${livreurPosition.latitude},${livreurPosition.longitude}`;
    window.location.href = url;
  };

  // Calculer la distance approximative (nécessite la position du client)
  const calculateDistance = (clientLat, clientLng) => {
    if (!livreurPosition) return null;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = (livreurPosition.latitude - clientLat) * Math.PI / 180;
    const dLon = (livreurPosition.longitude - clientLng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(clientLat * Math.PI / 180) * Math.cos(livreurPosition.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  };

  // État de chargement
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div>
            <p className="font-bold text-gray-900">Recherche du livreur...</p>
            <p className="text-sm text-gray-500">Connexion au système de suivi en temps réel</p>
          </div>
        </div>
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
        <div className="flex items-start gap-3">
          <div className="bg-red-600 p-2 rounded-full">
            <FiPackage className="text-white" size={20} />
          </div>
          <div>
            <p className="font-bold text-red-900">Erreur de suivi</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Aucune position disponible
  if (!livreurPosition) {
    return (
      <div className="bg-orange-50 rounded-2xl shadow-lg p-6 border-2 border-orange-200">
        <div className="flex items-start gap-3">
          <div className="bg-orange-600 p-2 rounded-full">
            <FiNavigation2 className="text-white" size={20} />
          </div>
          <div>
            <p className="font-bold text-orange-900">Livreur en préparation</p>
            <p className="text-sm text-orange-700 mt-1">
              Votre livreur n'a pas encore démarré sa tournée. Le suivi sera disponible dès son départ.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage avec position
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      
      {/* Header avec status */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full animate-pulse">
              <FiNavigation2 size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">Livreur en route</p>
              <p className="text-sm text-green-100">Suivi en temps réel actif</p>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1.5 rounded-full">
            <p className="text-xs font-bold">EN DIRECT</p>
          </div>
        </div>
      </div>

      {/* Carte (placeholder - à remplacer par Google Maps) */}
      <div className="bg-gray-100 h-64 relative">
        {googleMapsApiKey ? (
          // Ici, vous pouvez intégrer Google Maps
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-600">Carte Google Maps ici</p>
          </div>
        ) : (
          // Vue simplifiée sans carte
          <div className="w-full h-full flex flex-col items-center justify-center p-6">
            <FiMapPin className="text-gray-400 mb-3" size={48} />
            <p className="text-gray-700 font-bold text-center">
              Latitude: {livreurPosition.latitude.toFixed(6)}
            </p>
            <p className="text-gray-700 font-bold text-center">
              Longitude: {livreurPosition.longitude.toFixed(6)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-xs">
              <button
                onClick={openInGoogleMaps}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
              >
                Google Maps
              </button>
              <button
                onClick={openInAppleMaps}
                className="bg-gray-800 text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-gray-900 transition-colors"
              >
                Apple Plans
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Informations détaillées */}
      <div className="p-4 space-y-3">
        
        {/* Précision GPS */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-1.5 rounded-full">
              <FiNavigation2 className="text-blue-600" size={16} />
            </div>
            <span className="text-sm font-medium text-gray-700">Précision GPS</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            ± {Math.round(livreurPosition.accuracy)} mètres
          </span>
        </div>

        {/* Vitesse (si disponible) */}
        {livreurPosition.speed !== null && livreurPosition.speed > 0 && (
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-1.5 rounded-full">
                <FiNavigation2 className="text-purple-600" size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700">Vitesse</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {Math.round(livreurPosition.speed * 3.6)} km/h
            </span>
          </div>
        )}

        {/* Dernière mise à jour */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-1.5 rounded-full">
              <FiClock className="text-green-600" size={16} />
            </div>
            <span className="text-sm font-medium text-gray-700">Dernière mise à jour</span>
          </div>
          <span className="text-sm font-bold text-green-700">
            {getTimeSinceUpdate()}
          </span>
        </div>

        {/* Message informatif */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs text-blue-800">
            ℹ️ La position de votre livreur est mise à jour automatiquement toutes les 10 secondes.
          </p>
        </div>

      </div>
    </div>
  );
}

/**
 * EXEMPLE D'UTILISATION AVEC GOOGLE MAPS
 * 
 * import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
 * 
 * function LiveDeliveryTrackingWithMap({ livraisonId }) {
 *   const [livreurPosition, setLivreurPosition] = useState(null);
 *   const { isLoaded } = useLoadScript({
 *     googleMapsApiKey: 'VOTRE_API_KEY'
 *   });
 * 
 *   useEffect(() => {
 *     const db = getDatabase();
 *     const positionRef = ref(db, `livraisons_tracking/${livraisonId}/livreur_position`);
 *     
 *     const unsubscribe = onValue(positionRef, (snapshot) => {
 *       const data = snapshot.val();
 *       if (data) {
 *         setLivreurPosition({
 *           lat: data.latitude,
 *           lng: data.longitude
 *         });
 *       }
 *     });
 * 
 *     return () => unsubscribe();
 *   }, [livraisonId]);
 * 
 *   if (!isLoaded || !livreurPosition) return <div>Chargement...</div>;
 * 
 *   return (
 *     <GoogleMap
 *       center={livreurPosition}
 *       zoom={15}
 *       mapContainerStyle={{ width: '100%', height: '400px' }}
 *       options={{
 *         zoomControl: true,
 *         streetViewControl: false,
 *         mapTypeControl: false,
 *         fullscreenControl: true
 *       }}
 *     >
 *       <Marker 
 *         position={livreurPosition} 
 *         title="Votre livreur"
 *         icon={{
 *           url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
 *         }}
 *       />
 *     </GoogleMap>
 *   );
 * }
 */