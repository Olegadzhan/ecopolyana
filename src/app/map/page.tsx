'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Icon, LatLngExpression, LocationEvent } from 'leaflet';
import Image from 'next/image';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin } from 'lucide-react';

// ============================================
// ИКОНКИ LEAFLET
// ============================================
const createMarkerIcon = (color: string = 'green') => {
  return new Icon({
    iconUrl: color === 'cyan' 
      ? 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers/img/marker-icon-2x-cyan.png'
      : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });
};

const markerIcon = createMarkerIcon('green');
const userIcon = createMarkerIcon('cyan');

// ============================================
// КОМПОНЕНТЫ КАРТЫ
// ============================================

// Авто-геолокация
function AutoLocate({ onLocationFound }: { onLocationFound: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    locationfound(e: LocationEvent) {
      const { lat, lng } = e.latlng;
      onLocationFound([lat, lng]);
    },
    locationerror() {
      // Тихая ошибка
    },
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      map.locate({ 
        setView: false, 
        maxZoom: 14, 
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000
      });
    }
  }, [map]);

  return null;
}

// Поиск адреса (геокодинг)
function SearchBox({ onLocationSelect }: { onLocationSelect: (pos: [number, number], address: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const searchAddress = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=ru`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    
    if (value.length >= 3) {
      searchAddress(value);
    } else {
      setResults([]);
    }
  };

  const handleSelect = (result: any) => {
    const pos: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    onLocationSelect(pos, result.display_name);
    setQuery(result.display_name);
    setIsOpen(false);
  };

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-md border border-emerald-500/30 rounded-xl px-4 py-3 shadow-lg">
        <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Введите адрес для поиска..."
          className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
        />
        {isLoading && (
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-emerald-500/30 rounded-xl overflow-hidden shadow-xl z-[1000]">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <p className="text-sm text-white font-medium truncate">{result.display_name}</p>
              <p className="text-xs text-gray-400 capitalize">{result.type.replace('_', ' ')}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// СТРАНИЦА КАРТЫ
// ============================================

interface MapLayer {
  key: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
}

const MAP_LAYERS: MapLayer[] = [
  {
    key: 'osm',
    name: 'Стандартная',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '',
    maxZoom: 19,
  },
  {
    key: 'dark',
    name: 'Тёмная',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '',
    maxZoom: 19,
  },
];

const DEFAULT_LAYER_KEY = 'osm';
const DEFAULT_CENTER: LatLngExpression = [55.7558, 37.6173]; // Москва
const DEFAULT_ZOOM = 10;

export default function MapPage() {
  const [activeLayerKey, setActiveLayerKey] = useState(DEFAULT_LAYER_KEY);
  const [center, setCenter] = useState<LatLngExpression>(DEFAULT_CENTER);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [searchPos, setSearchPos] = useState<[number, number] | null>(null);
  const [searchAddress, setSearchAddress] = useState<string>('');
  const mapRef = useRef<any>(null);

  const activeLayer = MAP_LAYERS.find(l => l.key === activeLayerKey) || MAP_LAYERS[0];

  const handleLocationFound = (pos: [number, number]) => {
    setUserPos(pos);
    if (mapRef.current && !searchPos) {
      mapRef.current.flyTo(pos, 14, { duration: 1.5 });
    }
  };

  const handleSearchSelect = (pos: [number, number], address: string) => {
    setSearchPos(pos);
    setSearchAddress(address);
    setCenter(pos);
    if (mapRef.current) {
      mapRef.current.flyTo(pos, 16, { duration: 1.5 });
    }
  };

  // Демо-маркеры Экополяны
  const demoMarkers = [
    { pos: [55.7558, 37.6173] as LatLngExpression, title: '🌿 Экополяна', desc: 'Центр эко-технологий' },
    { pos: [55.7612, 37.6289] as LatLngExpression, title: '🎯 Зона Alpha', desc: 'AI-мониторинг' },
    { pos: [55.7489, 37.6045] as LatLngExpression, title: '🦌 Заповедник', desc: 'Наблюдение за фауной' },
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Фоновые эффекты */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-[1000] glass-panel border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.a 
              href="/"
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative w-12 h-12">
                <Image
                  src="/logo.png"
                  alt="Экополяна"
                  fill
                  className="object-contain drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]"
                  priority
                />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Экополяна
              </span>
            </motion.a>
            
            <nav className="flex items-center gap-4">
              <a href="/" className="text-gray-300 hover:text-white transition-colors text-sm">
                ← На главную
              </a>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Контент страницы */}
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Заголовок и поиск */}
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Интерактивная карта
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6">
              Исследуйте территорию проекта с переключением слоёв и геолокацией
            </p>
            
            {/* Поле поиска адреса */}
            <div className="flex justify-center">
              <SearchBox onLocationSelect={handleSearchSelect} />
            </div>
            
            {searchAddress && (
              <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                <MapPin size={12} />
                {searchAddress}
              </p>
            )}
          </motion.div>

          {/* Карта */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl shadow-emerald-500/10"
          >
            <div className="relative w-full h-[600px]">
              <Suspense fallback={
                <div className="w-full h-full bg-gray-900/50 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <LeafletMap
                  ref={mapRef}
                  center={center}
                  zoom={DEFAULT_ZOOM}
                  scrollWheelZoom={true}
                  zoomControl={true}
                  className="w-full h-full z-0"
                  worldCopyJump={true}
                  attributionControl={false}
                >
                  <TileLayer
                    attribution={activeLayer.attribution}
                    url={activeLayer.url}
                    maxZoom={activeLayer.maxZoom}
                    subdomains={['a', 'b', 'c']}
                    errorTileUrl="image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                  />

                  {/* Демо-маркеры */}
                  {demoMarkers.map((marker, i) => (
                    <Marker key={i} position={marker.pos} icon={markerIcon}>
                      <Popup>
                        <div className="text-sm">
                          <strong className="text-emerald-400">{marker.title}</strong>
                          <p className="text-gray-300">{marker.desc}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Маркер пользователя */}
                  {userPos && !searchPos && (
                    <Marker position={userPos} icon={userIcon}>
                      <Popup>
                        <div className="text-sm">
                          <strong>📍 Вы здесь</strong>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Маркер поиска */}
                  {searchPos && (
                    <Marker position={searchPos} icon={userIcon}>
                      <Popup>
                        <div className="text-sm">
                          <strong> Найдено</strong>
                          <p className="text-gray-400 text-xs mt-1 truncate max-w-[200px]">
                            {searchAddress}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  <AutoLocate onLocationFound={handleLocationFound} />
                </LeafletMap>
              </Suspense>

              {/* Переключатель слоёв — левый нижний угол */}
              <div className="absolute bottom-4 left-4 z-[1000] flex gap-2">
                {MAP_LAYERS.map((layer) => (
                  <button
                    key={layer.key}
                    onClick={() => setActiveLayerKey(layer.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      activeLayerKey === layer.key
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/30'
                        : 'bg-gray-900/90 backdrop-blur-sm text-gray-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {layer.name}
                  </button>
                ))}
              </div>

              {/* Индикатор */}
              <div className="absolute bottom-4 right-4 z-[1000] text-xs text-gray-500 bg-gray-900/80 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                Экополяна Map
              </div>
            </div>
          </motion.div>

          {/* Инфо-блок */}
          <motion.div 
            className="mt-6 glass-panel p-6 rounded-2xl border border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-bold text-lg mb-3 text-emerald-400">🗺️ Возможности карты</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">🔍</span>
                <div>
                  <p className="font-medium text-white">Поиск адреса</p>
                  <p>Введите любой адрес или место для быстрого перехода</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">📍</span>
                <div>
                  <p className="font-medium text-white">Геолокация</p>
                  <p>Автоматическое определение вашего местоположения</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400">🗂️</span>
                <div>
                  <p className="font-medium text-white">Слои карты</p>
                  <p>Переключение между стандартной и тёмной темой</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
