import { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = "AIzaSyB8sG0q2FW7lIWjv09Wi33oihPcGh-Ncn0";
const MAP_ID = "DEMO_MAP_ID";

const Map = ({ clientPosition, driverPosition, setEta, setDistance }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Initialisation sécurisée du Loader (ne s'exécute qu'une fois)
    if (!window.google?.maps?.importLibrary) {
      (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?null:d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
        key: GOOGLE_MAPS_API_KEY,
        v: "weekly",
      });
    }

    const initMap = async () => {
      try {
        const { Map } = await window.google.maps.importLibrary("maps");
        const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");
        const { DirectionsService, DirectionsRenderer } = await window.google.maps.importLibrary("routes");

        if (!mapRef.current) return;

        const map = new Map(mapRef.current, {
          center: clientPosition,
          zoom: 14,
          mapId: MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;

        directionsServiceRef.current = new DirectionsService();
        directionsRendererRef.current = new DirectionsRenderer({
          map: map,
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#2563EB', strokeWeight: 5, strokeOpacity: 0.8 }
        });

        // ✅ CORRECTION: Utiliser clientPin directement (SANS .element)
        const clientPin = new PinElement({
          background: "#FF6B35",
          borderColor: "#E85A2A",
          glyphColor: "#FFFFFF",
          scale: 1.1
        });

        new AdvancedMarkerElement({
          position: clientPosition,
          map: map,
          content: clientPin, // Plus besoin de .element
          title: "Votre position"
        });

        // Marqueur Livreur
        const driverPin = new PinElement({
          background: "#00D9C0",
          borderColor: "#00B8A3",
          glyphColor: "#FFFFFF",
          scale: 1.1
        });

        driverMarkerRef.current = new AdvancedMarkerElement({
          position: clientPosition,
          map: null,
          content: driverPin, // Plus besoin de .element
          title: "Livreur"
        });

        setIsLoaded(true);
      } catch (error) {
        console.error("Maps Error:", error);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!isLoaded || !driverPosition || !mapInstanceRef.current) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.map = mapInstanceRef.current;
      driverMarkerRef.current.position = driverPosition;
    }

    if (directionsServiceRef.current && directionsRendererRef.current) {
      directionsServiceRef.current.route({
        origin: driverPosition,
        destination: clientPosition,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          const route = result.routes[0].legs[0];
          setEta(route.duration.text);
          setDistance(route.distance.text);
        }
      });
    }
  }, [driverPosition, isLoaded, clientPosition, setEta, setDistance]);

  return <div ref={mapRef} className="w-full h-full absolute inset-0 z-0" />;
};

export default Map;