'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export interface SitePin {
  lat: number;
  lng: number;
  label: string;
  jobId?: string;
  color?: string;
}

const DEFAULT_CENTER: [number, number] = [35.2271, -80.8431]; // Charlotte, NC
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const ESRI_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTR = 'Tiles © Esri';

function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M434.8 137.65l-149.36-68.1c-16.19-7.4-42.69-7.4-58.88 0L77.3 137.65c-17.6 8-17.6 21.09 0 29.09l148 67.5c16.89 7.7 44.69 7.7 61.58 0l148-67.5c17.52-8 17.52-21.1-.08-29.09zM160 308.52l-82.7 37.11c-17.6 8-17.6 21.1 0 29.1l148 67.5c16.89 7.69 44.69 7.69 61.58 0l148-67.5c17.6-8 17.6-21.1 0-29.1l-79.94-38.47" />
      <path d="M160 204.48l-82.8 37.16c-17.6 8-17.6 21.1 0 29.1l148 67.49c16.89 7.7 44.69 7.7 61.58 0l148-67.49c17.7-8 17.7-21.1.1-29.1L352 204.48" />
    </svg>
  );
}

function LocateIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path strokeWidth="48" d="M256 96V56M256 456v-40" />
      <path d="M256 112a144 144 0 10144 144 144 144 0 00-144-144z" strokeWidth="32" strokeMiterlimit="10" />
      <path strokeWidth="48" d="M416 256h40M56 256h40" />
    </svg>
  );
}

export default function SiteMapView({ pins, onPinClick }: { pins: SitePin[]; onPinClick?: (jobId: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<import('leaflet').Marker[]>([]);
  const tileLayerRef = useRef<import('leaflet').TileLayer | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);

  // Init map once — clear Leaflet's stale _leaflet_id to survive React StrictMode double-invoke
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: import('leaflet').Map | undefined;

    const init = async () => {
      const L = (await import('leaflet')).default;
      LRef.current = L;

      if (mapRef.current) return; // second StrictMode invoke after async gap — already running

      // Reset any stale Leaflet internal state left on the DOM element
      (container as any)._leaflet_id = undefined;

      map = L.map(container, {
        center: DEFAULT_CENTER,
        zoom: 10,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);
      mapRef.current = map;

      setMapReady(true);
    };

    init();

    return () => {
      if (map) {
        map.remove();
        mapRef.current = null;
        (container as any)._leaflet_id = undefined;
        setMapReady(false);
      }
    };
  }, []);

  // Tile layer — initial add once the map is ready, and swapped whenever the
  // satellite toggle changes.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !LRef.current) return;

    const L = LRef.current;
    const map = mapRef.current;

    tileLayerRef.current?.remove();
    tileLayerRef.current = L.tileLayer(isSatellite ? ESRI_URL : OSM_URL, {
      attribution: isSatellite ? ESRI_ATTR : OSM_ATTR,
      maxZoom: 19,
    }).addTo(map);
  }, [mapReady, isSatellite]);

  // Update markers — runs only after mapReady flips true, and again when pins change
  useEffect(() => {
    if (!mapReady || !mapRef.current || !LRef.current) return;

    const L = LRef.current;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!pins.length) return;

    const newMarkers = pins.map((pin) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:24px;height:24px;border-radius:50%;background:${pin.color ?? '#FF6B00'};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;font-family:sans-serif">${pin.label}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
      if (onPinClick && pin.jobId) {
        marker.on('click', () => onPinClick(pin.jobId!));
      }
      return marker;
    });

    markersRef.current = newMarkers;

    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 14);
    } else {
      const group = L.featureGroup(newMarkers);
      map.fitBounds(group.getBounds().pad(0.25));
    }
  }, [mapReady, pins, onPinClick]);

  const handleRecenter = () => {
    if (!mapRef.current || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15);
    });
  };

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      <button
        type="button"
        onClick={() => setIsSatellite((v) => !v)}
        aria-label="Toggle satellite view"
        className="absolute bottom-16 right-3 z-[1000] w-10 h-10 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-lg border border-gray-200 dark:border-neutral-700"
      >
        <LayersIcon className="w-5 h-5 text-[hsl(25,100%,50%)]" />
      </button>
      <button
        type="button"
        onClick={handleRecenter}
        aria-label="Center on my location"
        className="absolute bottom-3 right-3 z-[1000] w-10 h-10 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-lg border border-gray-200 dark:border-neutral-700"
      >
        <LocateIcon className="w-5 h-5 text-[hsl(25,100%,50%)]" />
      </button>
    </>
  );
}
