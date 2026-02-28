'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const MapContainer = dynamic(
  () => import('./MapContainer').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gradient-to-br from-emerald-900/50 to-cyan-900/50 
                      rounded-2xl flex items-center justify-center border border-emerald-500/30">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent 
                          rounded-full mx-auto mb-3"></div>
          <p className="text-emerald-300 text-sm">Загрузка карты...</p>
        </div>
      </div>
    )
  }
);

interface DynamicMapProps {
  userLocation?: [number, number] | null;
}

export default function DynamicMap({ userLocation }: DynamicMapProps) {
  return (
    <Suspense fallback={
      <div className="w-full h-[500px] bg-emerald-900/20 rounded-2xl animate-pulse border border-emerald-500/30" />
    }>
      <MapContainer userLocation={userLocation} />
    </Suspense>
  );
}
