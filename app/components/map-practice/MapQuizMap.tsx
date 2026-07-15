'use client';

import dynamic from 'next/dynamic';
import type { MapScope } from '@/lib/mapPractice';

type Point = { lat: number; lng: number };

const MapLeafletCanvas = dynamic(() => import('./MapLeafletCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 md:h-[500px]">
      Loading map...
    </div>
  ),
});

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

export default function MapQuizMap({
  scope,
  selectedPoint,
  correctPoint,
  toleranceKm,
  hintLevel,
  submitted,
  canSelect,
  onSelectPoint,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interactive Map</h2>
        <span className="text-xs text-slate-500">{submitted ? 'Answer locked' : 'Click map to select point'}</span>
      </div>
      <MapLeafletCanvas
        key={`${scope}-${submitted ? 'submitted' : 'active'}`}
        scope={scope}
        selectedPoint={selectedPoint}
        correctPoint={correctPoint}
        toleranceKm={toleranceKm}
        hintLevel={hintLevel}
        submitted={submitted}
        canSelect={canSelect}
        onSelectPoint={onSelectPoint}
      />
    </section>
  );
}
