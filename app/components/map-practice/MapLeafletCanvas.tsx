'use client';

import { useEffect, useMemo } from 'react';
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapScope } from '@/lib/mapPractice';

type Point = { lat: number; lng: number };

type Props = {
  scope: MapScope;
  selectedPoint: Point | null;
  correctPoint: Point | null;
  toleranceKm: number;
  hintLevel: number;
  submitted: boolean;
  canSelect: boolean;
  onSelectPoint: (point: Point) => void;
};

const mapDefaults: Record<MapScope, { center: [number, number]; zoom: number }> = {
  india: { center: [22.5, 78.5], zoom: 5 },
  world: { center: [20, 0], zoom: 2 },
  current: { center: [20, 0], zoom: 2 },
};

function MapClickHandler({
  canSelect,
  onSelectPoint,
}: {
  canSelect: boolean;
  onSelectPoint: (point: Point) => void;
}) {
  useMapEvents({
    click(event) {
      if (!canSelect) return;
      onSelectPoint({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function FitAnswerBounds({
  submitted,
  selectedPoint,
  correctPoint,
}: {
  submitted: boolean;
  selectedPoint: Point | null;
  correctPoint: Point | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!submitted || !selectedPoint || !correctPoint) return;
    map.fitBounds(
      [
        [selectedPoint.lat, selectedPoint.lng],
        [correctPoint.lat, correctPoint.lng],
      ],
      { padding: [36, 36] }
    );
  }, [map, submitted, selectedPoint, correctPoint]);

  return null;
}

function FitHintBounds({
  hintLevel,
  submitted,
  scope,
  correctPoint,
}: {
  hintLevel: number;
  submitted: boolean;
  scope: MapScope;
  correctPoint: Point | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (submitted || hintLevel < 2 || !correctPoint) return;
    const latOffset = scope === 'india' ? 3.5 : 8;
    const lngOffset = scope === 'india' ? 4.5 : 10;
    map.fitBounds(
      [
        [correctPoint.lat - latOffset, correctPoint.lng - lngOffset],
        [correctPoint.lat + latOffset, correctPoint.lng + lngOffset],
      ],
      { padding: [28, 28] }
    );
  }, [map, hintLevel, submitted, scope, correctPoint]);

  return null;
}

export default function MapLeafletCanvas({
  scope,
  selectedPoint,
  correctPoint,
  toleranceKm,
  hintLevel,
  submitted,
  canSelect,
  onSelectPoint,
}: Props) {
  const defaults = mapDefaults[scope];
  const linePositions = useMemo(() => {
    if (!submitted || !selectedPoint || !correctPoint) return null;
    return [
      [selectedPoint.lat, selectedPoint.lng],
      [correctPoint.lat, correctPoint.lng],
    ] as LatLngExpression[];
  }, [submitted, selectedPoint, correctPoint]);

  return (
    <MapContainer
      center={defaults.center}
      zoom={defaults.zoom}
      scrollWheelZoom
      className="h-[420px] w-full rounded-lg border border-slate-200 bg-slate-50 md:h-[500px]"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      />

      <MapClickHandler canSelect={canSelect} onSelectPoint={onSelectPoint} />
      <FitAnswerBounds submitted={submitted} selectedPoint={selectedPoint} correctPoint={correctPoint} />
      <FitHintBounds hintLevel={hintLevel} submitted={submitted} scope={scope} correctPoint={correctPoint} />

      {selectedPoint && (
        <CircleMarker
          center={[selectedPoint.lat, selectedPoint.lng]}
          radius={7}
          pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.85 }}
        />
      )}

      {submitted && correctPoint && (
        <>
          <Circle
            center={[correctPoint.lat, correctPoint.lng]}
            radius={Math.max(1000, toleranceKm * 1000)}
            pathOptions={{ color: '#22C55E', weight: 1, fillColor: '#22C55E', fillOpacity: 0.08 }}
          />
          <CircleMarker
            center={[correctPoint.lat, correctPoint.lng]}
            radius={7}
            pathOptions={{ color: '#16A34A', fillColor: '#16A34A', fillOpacity: 0.9 }}
          />
        </>
      )}

      {linePositions && <Polyline positions={linePositions} pathOptions={{ color: '#64748B', weight: 2, opacity: 0.65, dashArray: '4 4' }} />}
    </MapContainer>
  );
}
