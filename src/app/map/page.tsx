// src/app/map/page.tsx или src/components/Map.tsx
'use client';

import { useState } from 'react';

export default function MapPage() {
  // Состояния для трех полей
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');

  // Функция для объединения адреса при поиске
  const handleSearch = () => {
    const fullAddress = [city, street, building]
      .filter(part => part.trim() !== '')
      .join(', ');
    
    if (fullAddress) {
      // Здесь ваша логика поиска на карте
      console.log('Поиск адреса:', fullAddress);
      // geocodeAddress(fullAddress);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 to-green-900 text-white">
      {/* Заголовок как на сайте */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">🗺️ Интерактивная карта</h1>
        <p className="text-emerald-200/80 mb-8">
          Исследуйте территорию проекта с переключением слоёв и геолокацией
        </p>

        {/* Панель поиска с тремя полями */}
        <div className="bg-emerald-800/30 backdrop-blur-sm rounded-2xl p-6 border border-emerald-700/50 mb-8">
          <h2 className="text-xl font-semibold mb-4">📍 Поиск адреса</h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            {/* Город */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-emerald-300 mb-1">
                Город
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Например: Москва"
                className="w-full px-4 py-3 bg-emerald-900/50 border border-emerald-700 rounded-lg text-white placeholder-emerald-700/70 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Улица */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-emerald-300 mb-1">
                Улица
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Например: Тверская"
                className="w-full px-4 py-3 bg-emerald-900/50 border border-emerald-700 rounded-lg text-white placeholder-emerald-700/70 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Дом */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-emerald-300 mb-1">
                Дом
              </label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="Например: 1"
                className="w-full px-4 py-3 bg-emerald-900/50 border border-emerald-700 rounded-lg text-white placeholder-emerald-700/70 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <span>🔍</span> Найти на карте
            </button>

            <button
              onClick={() => {
                setCity('');
                setStreet('');
                setBuilding('');
              }}
              className="px-6 py-3 bg-emerald-800/50 hover:bg-emerald-700/50 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <span>🗑️</span> Очистить
            </button>

            <button
              className="px-6 py-3 bg-emerald-800/50 hover:bg-emerald-700/50 rounded-lg font-semibold transition-colors flex items-center gap-2 ml-auto"
            >
              <span>📍</span> Геолокация
            </button>
          </div>
        </div>

        {/* Здесь будет ваша карта */}
        <div className="bg-emerald-900/50 rounded-2xl border border-emerald-800/50 h-[600px] flex items-center justify-center">
          <p className="text-emerald-300/50">Карта загружается...</p>
        </div>

        {/* Панель слоев */}
        <div className="mt-4 flex gap-4">
          <button className="px-4 py-2 bg-emerald-800/30 hover:bg-emerald-700/30 rounded-lg text-sm transition-colors">
            🗺️ Стандартная
          </button>
          <button className="px-4 py-2 bg-emerald-800/30 hover:bg-emerald-700/30 rounded-lg text-sm transition-colors">
            🌙 Тёмная
          </button>
          <button className="px-4 py-2 bg-emerald-800/30 hover:bg-emerald-700/30 rounded-lg text-sm transition-colors">
            🛰️ Спутник
          </button>
        </div>
      </div>
    </div>
  );
}
