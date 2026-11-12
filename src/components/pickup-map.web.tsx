import { useEffect, useRef, useState } from 'react';

type Coordinate = { lat: number; lng: number };
type MapClickEvent = { latLng: { lat: () => number; lng: () => number } | null };
type MapMarker = {
  addListener: (event: 'dragend', callback: () => void) => { remove: () => void };
  getPosition: () => { lat: () => number; lng: () => number } | null;
  setMap: (map: GoogleMap | null) => void;
  setPosition: (position: Coordinate) => void;
};
type GoogleMap = {
  addListener: (event: 'click', callback: (event: MapClickEvent) => void) => { remove: () => void };
  setCenter: (position: Coordinate) => void;
};
type GoogleMapsApi = {
  Map: new (element: HTMLElement, options: { center: Coordinate; zoom: number; mapTypeControl: boolean; streetViewControl: boolean; fullscreenControl: boolean }) => GoogleMap;
  Marker: new (options: { map: GoogleMap; position: Coordinate; draggable: boolean; title: string }) => MapMarker;
};

declare global {
  interface Window {
    google?: { maps?: GoogleMapsApi };
    __wildwashExpoMapsReady?: () => void;
  }
}

type PickupMapProps = {
  position: [number, number];
  hasPin: boolean;
  onChange: (position: [number, number]) => void;
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY;
let mapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window.google?.maps?.Map === 'function') return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    window.__wildwashExpoMapsReady = () => {
      delete window.__wildwashExpoMapsReady;
      if (typeof window.google?.maps?.Map === 'function') resolve();
      else reject(new Error('Google Maps loaded without the Maps JavaScript API.'));
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY || '')}&loading=async&callback=__wildwashExpoMapsReady`;
    script.async = true;
    script.onerror = () => {
      delete window.__wildwashExpoMapsReady;
      reject(new Error('Unable to load Google Maps.'));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    mapsLoadPromise = null;
    throw error;
  });

  return mapsLoadPromise;
}

export default function PickupMap({ position, hasPin, onChange }: PickupMapProps) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<GoogleMap | null>(null);
  const marker = useRef<MapMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const positionRef = useRef(position);
  const hasPinRef = useRef(hasPin);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState(
    GOOGLE_MAPS_API_KEY ? '' : 'Set EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY to enable the map in web builds.',
  );

  useEffect(() => {
    onChangeRef.current = onChange;
    positionRef.current = position;
    hasPinRef.current = hasPin;
  }, [onChange, position, hasPin]);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;

    let active = true;
    let clickListener: { remove: () => void } | undefined;
    loadGoogleMaps().then(() => {
      if (!active || !element.current || !window.google?.maps) return;
      map.current = new window.google.maps.Map(element.current, {
        center: { lat: positionRef.current[0], lng: positionRef.current[1] },
        zoom: hasPinRef.current ? 16 : 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      clickListener = map.current.addListener('click', (event) => {
        if (event.latLng) onChangeRef.current([event.latLng.lat(), event.latLng.lng()]);
      });
      setMapReady(true);
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load Google Maps.');
    });

    return () => {
      active = false;
      clickListener?.remove();
      marker.current?.setMap(null);
      marker.current = null;
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !window.google?.maps?.Marker) return;
    const location = { lat: position[0], lng: position[1] };
    map.current.setCenter(location);
    if (!hasPin) {
      marker.current?.setMap(null);
      marker.current = null;
      return;
    }
    if (!marker.current) {
      marker.current = new window.google.maps.Marker({
        map: map.current,
        position: location,
        draggable: true,
        title: 'Pickup location',
      });
      marker.current.addListener('dragend', () => {
        const markerPosition = marker.current?.getPosition();
        if (markerPosition) onChangeRef.current([markerPosition.lat(), markerPosition.lng()]);
      });
    } else {
      marker.current.setPosition(location);
    }
  }, [position, hasPin, mapReady]);

  if (loadError) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#f1f5f9', color: '#b91c1c', textAlign: 'center', fontSize: 13 }}>
        {loadError}
      </div>
    );
  }

  return <div ref={element} style={{ height: 260, width: '100%', background: '#f1f5f9' }} />;
}
