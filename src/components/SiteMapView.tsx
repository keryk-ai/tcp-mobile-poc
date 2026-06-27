'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export interface SitePin {
  lat: number;
  lng: number;
  label: string;
}

const DEFAULT_CENTER: [number, number] = [35.2271, -80.8431]; // Charlotte, NC

export default function SiteMapView({ pins }: { pins: SitePin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<import('leaflet').Marker[]>([]);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  const [mapReady, setMapReady] = useState(false);

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

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

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
        html: `<div style="width:24px;height:24px;border-radius:50%;background:#FF6B00;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;font-family:sans-serif">${pin.label}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      return L.marker([pin.lat, pin.lng], { icon }).addTo(map);
    });

    markersRef.current = newMarkers;

    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 14);
    } else {
      const group = L.featureGroup(newMarkers);
      map.fitBounds(group.getBounds().pad(0.25));
    }
  }, [mapReady, pins]);

  return <div ref={containerRef} className="w-full h-full" />;
}
