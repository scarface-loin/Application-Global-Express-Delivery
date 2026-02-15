import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { database, firestore } from './services/firebase';
import Map from './components/Map';
import { Package, Navigation, Phone, Clock, MapPin, Loader2 } from 'lucide-react';

// Fonction utilitaire pour lire l'URL
const getLivraisonId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || window.location.pathname.split('/').pop();
};

const DEFAULT_POS = { lat: 3.8667, lng: 11.5167 }; // Yaoundé

export default function App() {
  const [livraisonId] = useState(getLivraisonId());
  const [hasPermission, setHasPermission] = useState(false);
  const [clientPos, setClientPos] = useState(DEFAULT_POS);
  const [driverPos, setDriverPos] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [eta, setEta] = useState('--');
  const [distance, setDistance] = useState('--');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Gestion Permission Géolocalisation
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setClientPos({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setHasPermission(true);
        },
        () => {
          console.warn("Geo refusée, utilisation défaut");
          setHasPermission(true);
        }
      );
    } else {
      setHasPermission(true);
    }
  };

  // 2. Chargement des Infos Firebase
  useEffect(() => {
    if (!hasPermission || !livraisonId) return;

    const fetchInfo = async () => {
      try {
        // Chercher la livraison
        let docRef = doc(firestore, "livraisons", livraisonId);
        let snap = await getDoc(docRef);

        if (!snap.exists()) {
          docRef = doc(firestore, "livraison_partenaire", livraisonId);
          snap = await getDoc(docRef);
        }

        if (snap.exists()) {
          const data = snap.data();
          if (data.livreurId) {
            const livreurRef = doc(firestore, "livreurs", data.livreurId);
            const livreurSnap = await getDoc(livreurRef);
            if (livreurSnap.exists()) setDriverInfo(livreurSnap.data());
          }
        }
      } catch (err) {
        console.error("Erreur Firestore", err);
      }
    };

    fetchInfo();

    // Tracking Temps Réel
    const trackingRef = ref(database, `livraisons_tracking/${livraisonId}/livreur_position`);
    const unsubscribe = onValue(trackingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDriverPos({ lat: data.latitude, lng: data.longitude });
        setLastUpdate(new Date());
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [hasPermission, livraisonId]);

  // -- RENDU --

  if (!livraisonId) return <div className="h-screen flex items-center justify-center">Aucun ID de livraison</div>;

  if (!hasPermission) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
            <Navigation className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Autoriser la localisation</h2>
          <p className="text-gray-500 mb-8">Nécessaire pour calculer le temps d'arrivée précis.</p>
          <button
            onClick={requestLocation}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" /> Autoriser
          </button>
          <button onClick={() => setHasPermission(true)} className="mt-4 text-gray-400 hover:text-gray-600 font-medium">
            Passer cette étape
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative bg-gray-100 overflow-hidden font-sans">

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-20 p-4">
        <div className="absolute inset-0 bg-secondary/90 backdrop-blur-md rounded-b-3xl shadow-lg"></div>
        <div className="relative max-w-5xl mx-auto flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Global Express</h1>
              <p className="text-xs text-white/70 font-bold tracking-widest uppercase">Suivi Live</p>
            </div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-3 backdrop-blur-sm">
            <span className="text-xs font-bold text-white/70 uppercase">N°</span>
            <span className="font-mono font-bold">{livraisonId}</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500 rounded-full animate-pulse">
              <span className="text-[10px] font-bold">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* La Carte */}
      <Map
        clientPosition={clientPos}
        driverPosition={driverPos}
        setEta={setEta}
        setDistance={setDistance}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-medium animate-pulse">Recherche du livreur...</p>
        </div>
      )}

      {/* Info Panel - Version Compacte & Transparente */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-xs bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl z-30 p-3 transition-all duration-500 ease-out animate-in slide-in-from-bottom-10">

        {/* Info Livreur (Ultra Compact) */}
        {driverInfo && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold shadow-sm shrink-0">
              {driverInfo.photoURL ? (
                <img src={driverInfo.photoURL} alt="Driver" className="w-full h-full rounded-full object-cover" />
              ) : (
                driverInfo.nom?.charAt(0) || 'L'
              )}
            </div>
            <div className="flex-1 min-w-0 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-gray-900 truncate">{driverInfo.nom || 'Livreur'}</h3>
                <p className="text-[10px] text-gray-500 font-medium">En route vers vous</p>
              </div>
              {driverInfo.telephone && (
                <a
                  href={`tel:${driverInfo.telephone}`}
                  className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-500 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Stats (Compactes) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Temps */}
          <div className="bg-white/50 p-2 rounded-xl flex items-center gap-2 border border-white/50 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">Arrivée</span>
              <span className="font-mono text-sm font-bold text-gray-800 leading-none">{eta}</span>
            </div>
          </div>

          {/* Distance */}
          <div className="bg-white/50 p-2 rounded-xl flex items-center gap-2 border border-white/50 shadow-sm">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">Distance</span>
              <span className="font-mono text-sm font-bold text-gray-800 leading-none">{distance}</span>
            </div>
          </div>
        </div>

        {/* Footer (Minuscule) */}
        {lastUpdate && (
          <div className="mt-2 text-center">
            <p className="text-[9px] text-gray-400/80 flex items-center justify-center gap-1">
              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
              Maj {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}