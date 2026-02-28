'use client';

import { useState, useEffect } from 'react';
import DynamicMap from '../map/DynamicMap';

export default function MapSection() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Запрос геолокации при загрузке (с разрешением пользователя)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Геолокация отклонена пользователем');
          setLocationError('Разрешите доступ к местоположению для точной навигации');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-emerald-950/30">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок секции */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 
                         to-cyan-400 bg-clip-text text-transparent mb-3">
            🗺️ Интерактивная карта Экополяны
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Исследуйте территорию проекта, переключайте слои карты и находите 
            интересные локации с помощью AI-навигации
          </p>
          {locationError && (
            <p className="text-amber-400 text-sm mt-2">{locationError}</p>
          )}
        </div>

        {/* Карта */}
        <DynamicMap userLocation={userLocation} />

        {/* Подсказки */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-gray-400">
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-emerald-400 font-medium">🎯</span> Геолокация
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-emerald-400 font-medium">🗂️</span> 4 слоя карты
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-emerald-400 font-medium">📍</span> Маркеры локаций
          </div>
        </div>
      </div>
    </section>
  );
}
