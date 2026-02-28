'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// ✅ Dynamic import с отключением SSR для карты
const SafeMapContainer = dynamic(
  () => import('@/components/map/SafeMapContainer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-gray-900/50 rounded-2xl border border-emerald-500/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Загрузка карты...</p>
        </div>
      </div>
    )
  }
);

const SearchBox = dynamic(
  () => import('@/components/map/SearchBox'),
  { ssr: false }
);

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchPos, setSearchPos] = useState<[number, number] | null>(null);
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    }
  }, []);

  const handleSearchSelect = (pos: [number, number], address: string) => {
    setSearchPos(pos);
    setSearchAddress(address);
  };

  // SSR-заглушка
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Загрузка карты...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Фоновые эффекты */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity }} />
        <motion.div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} />
      </div>

      {/* Контент */}
      <div className="pt-8 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Интерактивная карта
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6">
              Исследуйте территорию проекта с переключением слоёв и геолокацией
            </p>
            
            {/* Поиск адреса */}
            <div className="flex justify-center">
              <Suspense fallback={<div className="w-full max-w-2xl h-12 bg-gray-900/50 rounded-xl animate-pulse" />}>
                <SearchBox onLocationSelect={handleSearchSelect} />
              </Suspense>
            </div>
            
            {searchAddress && (
              <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                <MapPin size={12} /> {searchAddress}
              </p>
            )}
          </motion.div>

          {/* Карта */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-panel rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl shadow-emerald-500/10"
          >
            <Suspense fallback={<div className="w-full h-[600px] bg-gray-900/50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>}>
              <SafeMapContainer userLocation={userLocation} searchLocation={searchPos} searchAddress={searchAddress} />
            </Suspense>
          </motion.div>

          {/* Инфо-блок */}
          <motion.div className="mt-6 glass-panel p-6 rounded-2xl border border-white/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <h3 className="font-bold text-lg mb-3 text-emerald-400">🗺️ Возможности карты</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
              <div className="flex items-start gap-2"><span className="text-emerald-400">🔍</span><div><p className="font-medium text-white">Поиск адреса</p><p>Введите любой адрес для быстрого перехода</p></div></div>
              <div className="flex items-start gap-2"><span className="text-cyan-400">📍</span><div><p className="font-medium text-white">Геолокация</p><p>Автоматическое определение местоположения</p></div></div>
              <div className="flex items-start gap-2"><span className="text-blue-400">🗂️</span><div><p className="font-medium text-white">Слои карты</p><p>Переключение между стандартной и тёмной темой</p></div></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
