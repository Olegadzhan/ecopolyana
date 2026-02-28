'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  MapContainer as LeafletMap, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap,
  useMapEvents
} from 'react-leaflet';
import { Icon, LatLngExpression, LocationEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ============================================
// FIX: Иконки Leaflet для Next.js
// ============================================
const createMarkerIcon = () => {
  return new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });
};

const markerIcon = createMarkerIcon();

// ============================================
// Компонент: Авто-геолокация (без UI)
// ============================================
function AutoLocate({ onLocationFound }: { onLocationFound: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    locationfound(e: LocationEvent) {
      const { lat, lng } = e.latlng;
      onLocationFound([lat, lng]);
    },
    locationerror() {
      // Тихая ошибка — не показываем пользователю
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

// ============================================
// Типы и конфигурация слоёв (только 2 слоя)
// ============================================
interface MapLayer {
  key: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
}

// ✅ Только 2 слоя: OSM и Тёмная
const MAP_LAYERS: MapLayer[] = [
  {
    key: 'osm',
    name: 'Стандартная',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '', // ✅ Пустая атрибуция — убираем "Leaflet | © OSM"
    maxZoom: 19,
  },
  {
    key: 'dark',
    name: 'Тёмная',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '', // ✅ Пустая атрибуция
    maxZoom: 19,
  },
];

const DEFAULT_LAYER_KEY = 'osm';
const DEFAULT_CENTER: LatLngExpression = [55.7558, 37.6173];
const DEFAULT_ZOOM = 10;

interface MapContainerProps {
  userLocation?: [number, number] | null;
}

// ============================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================
export default function MapContainer({ userLocation }: MapContainerProps) {
  const [activeLayerKey, setActiveLayerKey] = useState(DEFAULT_LAYER_KEY);
  const [center, setCenter] = useState<LatLngExpression>(userLocation || DEFAULT_CENTER);
  const [userPos, setUserPos] = useState<[number, number] | null>(userLocation || null);
  const mapRef = useRef<any>(null);

  const activeLayer = MAP_LAYERS.find(l => l.key === activeLayerKey) || MAP_LAYERS[0];

  const handleLocationFound = useCallback((pos: [number, number]) => {
    setUserPos(pos);
    if (mapRef.current) {
      mapRef.current.flyTo(pos, 14, { duration: 1.5 });
    }
  }, []);

  useEffect(() => {
    if (userLocation && !userPos) {
      setUserPos(userLocation);
      setCenter(userLocation);
    }
  }, [userLocation, userPos]);

  // Демо-маркеры Экополяны
  const demoMarkers = [
    { pos: [55.7558, 37.6173] as LatLngExpression, title: '🌿 Экополяна', desc: 'Центр эко-технологий' },
    { pos: [55.7612, 37.6289] as LatLngExpression, title: '🎯 Зона Alpha', desc: 'AI-мониторинг' },
    { pos: [55.7489, 37.6045] as LatLngExpression, title: '🦌 Заповедник', desc: 'Наблюдение за фауной' },
  ];

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden 
                    border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
      
      <LeafletMap
        ref={mapRef}
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        zoomControl={true}
        className="w-full h-full z-0"
        worldCopyJump={true}
        attributionControl={false} // ✅ Отключаем стандартную атрибуцию Leaflet
      >
        {/* Активный слой карты */}
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

        {/* Маркер пользователя (если есть координаты) */}
        {userPos && (
          <Marker position={userPos} icon={markerIcon}>
            <Popup>
              <div className="text-sm">
                <strong>📍 Вы здесь</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Авто-геолокация (без UI) */}
        <AutoLocate onLocationFound={handleLocationFound} />
      </LeafletMap>

      {/* ✅ Переключатель слоёв — в левом нижнем углу */}
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

      {/* ✅ Минималистичный индикатор (опционально) */}
      <div className="absolute bottom-4 right-4 z-[1000] text-xs text-gray-500 bg-gray-900/80 px-3 py-1.5 rounded-lg">
        Экополяна Map
      </div>
    </div>
  );
}
