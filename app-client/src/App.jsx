import { useState, useEffect, useCallback } from 'react';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { database, firestore } from './services/firebase';
import Map from './components/Map';
import { Package, Navigation, Phone, Clock, MapPin, Loader2, WifiOff } from 'lucide-react';

// ── Utilitaire : lire l'ID depuis l'URL ──────────────────────────
const getLivraisonId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || window.location.pathname.split('/').pop() || null;
};

const DEFAULT_POS = { lat: 3.8667, lng: 11.5167 }; // Yaoundé centre

// ── Composant principal ───────────────────────────────────────────
export default function App() {
  const [livraisonId] = useState(getLivraisonId);

  const [hasPermission, setHasPermission] = useState(false);
  const [clientPos, setClientPos]         = useState(DEFAULT_POS);
  const [driverPos, setDriverPos]         = useState(null);
  const [driverData, setDriverData]       = useState(null); // données GPS brutes
  const [driverInfo, setDriverInfo]       = useState(null); // infos Firestore livreur
  const [eta, setEta]                     = useState('--');
  const [distance, setDistance]           = useState('--');
  const [lastUpdate, setLastUpdate]       = useState(null);

  // États de chargement distincts
  const [gpsLoading, setGpsLoading]       = useState(true);  // en attente 1ère position GPS
  const [infoLoading, setInfoLoading]     = useState(true);  // en attente infos Firestore
  const [gpsInactif, setGpsInactif]       = useState(false); // livreur GPS éteint

  // ── 1. Demande de géolocalisation client ─────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setHasPermission(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setClientPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setHasPermission(true);
      },
      () => {
        console.warn('Géolocalisation refusée — position par défaut utilisée');
        setHasPermission(true);
      },
      { timeout: 8000 }
    );
  }, []);

  // ── 2. Chargement Firebase (Firestore + Realtime DB) ─────────────
  useEffect(() => {
    if (!hasPermission || !livraisonId) return;

    // 2a. Infos statiques de la livraison + du livreur (Firestore)
    const fetchLivraisonInfo = async () => {
      try {
        let snap = await getDoc(doc(firestore, 'livraisons', livraisonId));
        if (!snap.exists()) {
          snap = await getDoc(doc(firestore, 'livraison_partenaire', livraisonId));
        }

        if (snap.exists()) {
          const data = snap.data();
          if (data.livreurId) {
            const livreurSnap = await getDoc(doc(firestore, 'livreurs', data.livreurId));
            if (livreurSnap.exists()) {
              setDriverInfo(livreurSnap.data());
            }
          }
        }
      } catch (err) {
        console.error('Erreur Firestore:', err);
      } finally {
        setInfoLoading(false);
      }
    };

    fetchLivraisonInfo();

    // 2b. Position GPS temps réel (Realtime Database)
    const trackingRef = ref(database, `livraisons_tracking/${livraisonId}/livreur_position`);

    const unsubscribe = onValue(
      trackingRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          // Nœud Firebase vide → livreur pas encore démarré
          console.log('ℹ️ Aucune position GPS disponible pour cette livraison');
          setGpsLoading(false);
          setGpsInactif(true);
          return;
        }

        console.log('📍 Position GPS reçue:', {
          lat: data.latitude?.toFixed(6),
          lng: data.longitude?.toFixed(6),
          actif: data.isActive,
          précision: `±${Math.round(data.accuracy ?? 0)}m`,
        });

        // Mettre à jour la position du livreur sur la carte
        setDriverPos({ lat: data.latitude, lng: data.longitude });

        // Stocker toutes les données GPS brutes pour l'affichage
        setDriverData({
          latitude:  data.latitude,
          longitude: data.longitude,
          accuracy:  data.accuracy ?? null,
          speed:     data.speed ?? 0,
          heading:   data.heading ?? 0,
          isActive:  data.isActive === true,
          livreurId: data.livreurId ?? null,
        });

        setLastUpdate(new Date());
        setGpsLoading(false);
        setGpsInactif(data.isActive === false);
      },
      (error) => {
        console.error('❌ Erreur Realtime DB:', error);
        setGpsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hasPermission, livraisonId]);

  // ── Écran : pas d'ID de livraison ────────────────────────────────
  if (!livraisonId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucun identifiant de livraison trouvé.</p>
          <p className="text-xs text-gray-400 mt-1">Vérifiez le lien qui vous a été envoyé.</p>
        </div>
      </div>
    );
  }

  // ── Écran : demande de permission ────────────────────────────────
  if (!hasPermission) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg">
            <Navigation className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Autoriser la localisation</h2>
          <p className="text-gray-500 mb-8">
            Nécessaire pour calculer le temps d'arrivée précis de votre livreur.
          </p>
          <button
            onClick={requestLocation}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" /> Autoriser
          </button>
          <button
            onClick={() => setHasPermission(true)}
            className="mt-4 text-gray-400 hover:text-gray-600 font-medium text-sm"
          >
            Passer cette étape
          </button>
        </div>
      </div>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────
  return (
    <div className="h-screen w-full relative bg-gray-100 overflow-hidden font-sans">

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-20 p-4">
        <div className="absolute inset-0 bg-blue-900/90 backdrop-blur-md rounded-b-3xl shadow-lg" />
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
            <span className="font-mono font-bold text-sm truncate max-w-[100px]">{livraisonId}</span>
            {!gpsLoading && !gpsInactif && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500 rounded-full animate-pulse">
                <span className="text-[10px] font-bold">LIVE</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Carte Google Maps */}
      <Map
        clientPosition={clientPos}
        driverPosition={driverPos}
        setEta={setEta}
        setDistance={setDistance}
      />

      {/* Overlay : chargement initial GPS */}
      {gpsLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/85 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 font-semibold">Localisation du livreur...</p>
          <p className="text-gray-400 text-sm mt-1">Connexion au système GPS en cours</p>
        </div>
      )}

      {/* Overlay : livreur GPS inactif */}
      {!gpsLoading && gpsInactif && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/85 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-6 text-center shadow-lg">
            <WifiOff className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <p className="font-bold text-gray-800 text-lg">Livreur en préparation</p>
            <p className="text-gray-500 text-sm mt-2">
              Votre livreur n'a pas encore activé son GPS. Le suivi démarrera automatiquement dès son départ.
            </p>
          </div>
        </div>
      )}

      {/* Panneau d'info bas de page */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-white/85 backdrop-blur-md border border-white/50 rounded-2xl shadow-xl z-30 p-3">

        {/* Info Livreur */}
        {!infoLoading && driverInfo && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200/60">
            {/* Photo ou initiale */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold shadow-sm shrink-0 overflow-hidden">
              {driverInfo.photoUrl ? (
                // CORRECTION : photoUrl (minuscule) selon le modèle Flutter
                <img
                  src={driverInfo.photoUrl}
                  alt={driverInfo.nom}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span>{driverInfo.nom?.charAt(0)?.toUpperCase() || 'L'}</span>
              )}
            </div>

            <div className="flex-1 min-w-0 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-gray-900 truncate">
                  {driverInfo.nom || 'Livreur'}
                </h3>
                <p className="text-[10px] text-gray-500 font-medium">
                  {gpsInactif ? 'En préparation' : 'En route vers vous'}
                </p>
              </div>

              {/* Bouton appel */}
              {driverInfo.telephone && (
                <a
                  href={`tel:${driverInfo.telephone}`}
                  className="w-9 h-9 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-500 hover:text-white transition-colors"
                  title={`Appeler ${driverInfo.nom}`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Stats ETA + Distance */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/60 p-2.5 rounded-xl flex items-center gap-2 border border-white/60 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase block">Arrivée</span>
              <span className="font-mono text-sm font-bold text-gray-800 leading-none">{eta}</span>
            </div>
          </div>

          <div className="bg-white/60 p-2.5 rounded-xl flex items-center gap-2 border border-white/60 shadow-sm">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase block">Distance</span>
              <span className="font-mono text-sm font-bold text-gray-800 leading-none">{distance}</span>
            </div>
          </div>
        </div>

        {/* Précision GPS + Heure MAJ */}
        {driverData && lastUpdate && (
          <div className="mt-2 flex items-center justify-between px-1">
            <p className="text-[9px] text-gray-400">
              Précision ±{Math.round(driverData.accuracy ?? 0)}m
              {driverData.speed > 0 && ` · ${Math.round(driverData.speed * 3.6)} km/h`}
            </p>
            <p className="text-[9px] text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              Maj {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}