'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import MapSection from '@/components/sections/MapSection';
import About from '@/components/sections/About';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/layout/Footer';

// Тип для пользовательской геолокации
export type UserLocation = [number, number] | null;

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<UserLocation>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Запрос геолокации с задержкой для лучшего UX
    const requestLocation = () => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation([
              position.coords.latitude,
              position.coords.longitude
            ]);
          },
          (error) => {
            // Тихий фолбэк: пользователь может включить геолокацию вручную на карте
            console.debug('Геолокация не получена:', error.message);
          },
          { 
            enableHighAccuracy: false, 
            timeout: 8000, 
            maximumAge: 600000 // 10 минут кэш
          }
        );
      }
    };

    // Небольшая задержка чтобы не блокировать первую отрисовку
    const timer = setTimeout(requestLocation, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    // SSR-заглушка для предотвращения гидратационных ошибок
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100">
        <Header />
        <Hero />
        <Features />
        {/* Заглушка для карты во время SSR */}
        <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-emerald-950/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                🗺️ Интерактивная карта Экополяны
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Загрузка карты...
              </p>
            </div>
            <div className="w-full h-[500px] bg-emerald-900/20 rounded-2xl animate-pulse border border-emerald-500/30" />
          </div>
        </section>
        <About />
        <Contact />
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Глобальные декоративные элементы фона */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Header />
      
      <Hero />
      
      <Features />
      
      {/* 🔁 Карта заменяет три старых секции: Smart Hunting, Bio-Tech, AI Vision */}
      <MapSection userLocation={userLocation} />
      
      <About />
      
      <Contact />
      
      <Footer />

      {/* Глобальные скрипты или аналитика */}
      {/* <Analytics /> */}
    </main>
  );
}
