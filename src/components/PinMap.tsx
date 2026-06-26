'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { calculateBearing, getDirectionFromBearing, calculateDistanceFeet } from '@/lib/mapUtils';

export interface PinCoord {
  lat: number;
  lng: number;
}

interface PinMapProps {
  initialCenter?: PinCoord;
  initialPinA?: PinCoord | null;
  initialPinB?: PinCoord | null;
  onPinsChange: (pinA: PinCoord | null, pinB: PinCoord | null, distance: number | null, direction: string) => void;
}

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const MAPBOX_ATTR = '© <a href="https://www.mapbox.com/">Mapbox</a>';

function makeIcon(L: typeof import('leaflet'), label: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#FF6B00;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;font-family:sans-serif;line-height:1">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function PinMap({ initialCenter, initialPinA, initialPinB, onPinsChange }: PinMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const pinARef = useRef<import('leaflet').Marker | null>(null);
  const pinBRef = useRef<import('leaflet').Marker | null>(null);
  const tileRef = useRef<import('leaflet').TileLayer | null>(null);
  const pinsDataRef = useRef<{ pinA: PinCoord | null; pinB: PinCoord | null }>({
    pinA: initialPinA ?? null,
    pinB: initialPinB ?? null,
  });
  const phaseRef = useRef<'A' | 'B'>(initialPinA ? 'B' : 'A');

  const [isSatellite, setIsSatellite] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [direction, setDirection] = useState('');
  const [instruction, setInstruction] = useState(
    initialPinA ? (initialPinB ? '' : 'Tap to place end point') : 'Tap to place start point',
  );

  function recalc(a: PinCoord | null, b: PinCoord | null) {
    if (a && b) {
      const dist = calculateDistanceFeet(a.lat, a.lng, b.lat, b.lng);
      const bearing = calculateBearing(a.lat, a.lng, b.lat, b.lng);
      const dir = getDirectionFromBearing(bearing);
      setDistance(dist);
      setDirection(dir);
      setInstruction('');
      onPinsChange(a, b, dist, dir);
    } else {
      setDistance(null);
      setDirection('');
      onPinsChange(a, b, null, '');
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let L: typeof import('leaflet');

    const init = async () => {
      L = (await import('leaflet')).default;

      const center: [number, number] = initialCenter
        ? [initialCenter.lat, initialCenter.lng]
        : [35.2271, -80.8431];

      const map = L.map(containerRef.current!, { center, zoom: 15, zoomControl: true });
      mapRef.current = map;

      const osmLayer = L.tileLayer(OSM_URL, { attribution: OSM_ATTR, maxZoom: 19 });
      osmLayer.addTo(map);
      tileRef.current = osmLayer;

      const addDraggableMarker = (coord: PinCoord, label: string, markerRef: React.MutableRefObject<import('leaflet').Marker | null>) => {
        if (markerRef.current) markerRef.current.remove();
        const m = L.marker([coord.lat, coord.lng], { draggable: true, icon: makeIcon(L, label) }).addTo(map);
        m.on('dragend', () => {
          const pos = m.getLatLng();
          if (label === 'A') {
            pinsDataRef.current.pinA = { lat: pos.lat, lng: pos.lng };
          } else {
            pinsDataRef.current.pinB = { lat: pos.lat, lng: pos.lng };
          }
          recalc(pinsDataRef.current.pinA, pinsDataRef.current.pinB);
        });
        markerRef.current = m;
      };

      if (pinsDataRef.current.pinA) addDraggableMarker(pinsDataRef.current.pinA, 'A', pinARef);
      if (pinsDataRef.current.pinB) addDraggableMarker(pinsDataRef.current.pinB, 'B', pinBRef);
      if (pinsDataRef.current.pinA && pinsDataRef.current.pinB) {
        recalc(pinsDataRef.current.pinA, pinsDataRef.current.pinB);
      }

      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const phase = phaseRef.current;

        if (phase === 'A') {
          pinsDataRef.current.pinA = { lat, lng };
          addDraggableMarker({ lat, lng }, 'A', pinARef);
          phaseRef.current = 'B';
          setInstruction('Tap to place end point');
          recalc(pinsDataRef.current.pinA, pinsDataRef.current.pinB);
        } else {
          pinsDataRef.current.pinB = { lat, lng };
          addDraggableMarker({ lat, lng }, 'B', pinBRef);
          recalc(pinsDataRef.current.pinA, pinsDataRef.current.pinB);
        }
      });
    };

    init();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when initialCenter changes
  useEffect(() => {
    if (initialCenter && mapRef.current) {
      mapRef.current.setView([initialCenter.lat, initialCenter.lng], 15);
    }
  }, [initialCenter?.lat, initialCenter?.lng]);

  const toggleTile = async (satellite: boolean) => {
    if (!mapRef.current) return;
    const L = (await import('leaflet')).default;
    tileRef.current?.remove();
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const layer = satellite
      ? L.tileLayer(
          `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${token}`,
          { attribution: MAPBOX_ATTR, maxZoom: 22, tileSize: 512, zoomOffset: -1 },
        )
      : L.tileLayer(OSM_URL, { attribution: OSM_ATTR, maxZoom: 19 });
    layer.addTo(mapRef.current);
    tileRef.current = layer;
    setIsSatellite(satellite);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tile toggle */}
      <div className="flex gap-2 px-4 py-2">
        <button
          onClick={() => toggleTile(false)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
            !isSatellite
              ? 'bg-[hsl(25,100%,50%)] text-white border-transparent'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          Street
        </button>
        <button
          onClick={() => toggleTile(true)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
            isSatellite
              ? 'bg-[hsl(25,100%,50%)] text-white border-transparent'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        {instruction && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full pointer-events-none">
            {instruction}
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" style={{ minHeight: 280 }} />
      </div>

      {/* Distance + direction info */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Distance</div>
            <div className="font-semibold text-gray-900">
              {distance != null ? `${Math.round(distance).toLocaleString()} ft` : '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Direction</div>
            <div className="font-semibold text-gray-900">{direction || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
