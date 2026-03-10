import { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = "AIzaSyB8sG0q2FW7lIWjv09Wi33oihPcGh-Ncn0";
const MAP_ID = "DEMO_MAP_ID";

/**
 * Map.jsx
 * Affiche la carte Google Maps avec :
 * - Un marqueur orange pour la position du client
 * - Un marqueur bleu animé pour le livreur (apparaît uniquement quand
 *   driverPosition est disponible depuis Firebase)
 * - L'itinéraire calculé entre les deux points
 */
const Map = ({ clientPosition, driverPosition, setEta, setDistance }) => {
  const mapRef              = useRef(null);
  const mapInstanceRef      = useRef(null);
  const driverMarkerRef     = useRef(null);
  const directionsServiceRef  = useRef(null);
  const directionsRendererRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Initialisation de la carte (une seule fois) ─────────────────
  useEffect(() => {
    // Charger le script Google Maps si pas encore fait
    if (!window.google?.maps?.importLibrary) {
      (g => {
        var h, a, k,
          p = "The Google Maps JavaScript API",
          c = "google", l = "importLibrary", q = "__ib__",
          m = document, b = window;
        b = b[c] || (b[c] = {});
        var d = b.maps || (b.maps = {}),
          r = new Set,
          e = new URLSearchParams,
          u = () => h || (h = new Promise(async (f, n) => {
            await (a = m.createElement("script"));
            e.set("libraries", [...r] + "");
            for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
            e.set("callback", c + ".maps." + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => h = n(Error(p + " could not load."));
            a.nonce = m.querySelector("script[nonce]")?.nonce || "";
            m.head.append(a);
          }));
        d[l] ? null : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
      })({ key: GOOGLE_MAPS_API_KEY, v: "weekly" });
    }

    const initMap = async () => {
      try {
        const { Map }                              = await window.google.maps.importLibrary("maps");
        const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");
        const { DirectionsService, DirectionsRenderer } = await window.google.maps.importLibrary("routes");

        if (!mapRef.current) return;

        // Créer la carte centrée sur le client
        const map = new Map(mapRef.current, {
          center: clientPosition,
          zoom: 14,
          mapId: MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });

        mapInstanceRef.current = map;

        // Services de calcul d'itinéraire
        directionsServiceRef.current  = new DirectionsService();
        directionsRendererRef.current = new DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor:   '#2563EB',
            strokeWeight:  5,
            strokeOpacity: 0.85,
          },
        });

        // ── Marqueur Client (orange) ──────────────────────────────
        const clientPin = new PinElement({
          background:   '#FF6B35',
          borderColor:  '#E85A2A',
          glyphColor:   '#FFFFFF',
          scale:        1.1,
        });

        new AdvancedMarkerElement({
          position: clientPosition,
          map,
          content: clientPin,
          title:   'Votre adresse de livraison',
        });

        // ── Marqueur Livreur (camion bleu) ────────────────────────
        // Créé mais PAS ajouté à la carte (map: null) tant que
        // driverPosition n'est pas disponible depuis Firebase.
        const driverIconEl = document.createElement('div');
        driverIconEl.style.cssText = `
          width: 48px;
          height: 48px;
          background: #2563EB;
          border: 3px solid #1D4ED8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(37,99,235,0.5);
          cursor: pointer;
          transition: transform 0.3s ease;
        `;
        driverIconEl.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M1 3h15v13H1z" fill="white" opacity="0.9" rx="1"/>
            <path d="M16 8h4l3 4v4h-7V8z" fill="white" opacity="0.9"/>
            <circle cx="5.5" cy="18.5" r="2.5" fill="white"/>
            <circle cx="18.5" cy="18.5" r="2.5" fill="white"/>
          </svg>
        `;

        // Pulse animation sur le marqueur livreur
        driverIconEl.addEventListener('mouseover', () => {
          driverIconEl.style.transform = 'scale(1.15)';
        });
        driverIconEl.addEventListener('mouseout', () => {
          driverIconEl.style.transform = 'scale(1)';
        });

        // map: null → le marqueur n'est pas visible au départ
        driverMarkerRef.current = new AdvancedMarkerElement({
          position: clientPosition, // position temporaire, sera mise à jour
          map:      null,           // CORRECTION : invisible jusqu'à réception GPS
          content:  driverIconEl,
          title:    'Livreur',
        });

        setIsLoaded(true);
        console.log('✅ Carte Google Maps initialisée');

      } catch (error) {
        console.error('❌ Erreur initialisation Google Maps:', error);
      }
    };

    initMap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: clientPosition intentionnellement absent des deps
  // pour éviter de réinitialiser la carte à chaque rendu

  // ── Mise à jour position livreur ────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    if (!driverPosition) {
      // Pas encore de position → cacher le marqueur livreur
      if (driverMarkerRef.current) {
        driverMarkerRef.current.map = null;
      }
      return;
    }

    // Afficher et déplacer le marqueur livreur
    if (driverMarkerRef.current) {
      driverMarkerRef.current.map      = mapInstanceRef.current;
      driverMarkerRef.current.position = driverPosition;
    }

    // Calculer l'itinéraire livreur → client
    if (directionsServiceRef.current && directionsRendererRef.current) {
      directionsServiceRef.current.route(
        {
          origin:      driverPosition,
          destination: clientPosition,
          travelMode:  window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRendererRef.current.setDirections(result);
            const leg = result.routes[0].legs[0];
            setEta(leg.duration.text);
            setDistance(leg.distance.text);
          } else {
            console.warn('Directions API:', status);
          }
        }
      );
    }

    // Ajuster la vue pour inclure les deux marqueurs
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(clientPosition);
    bounds.extend(driverPosition);
    mapInstanceRef.current.fitBounds(bounds, { top: 80, bottom: 160, left: 40, right: 40 });

  }, [driverPosition, isLoaded, clientPosition, setEta, setDistance]);

  return <div ref={mapRef} className="w-full h-full absolute inset-0 z-0" />;
};

export default Map;