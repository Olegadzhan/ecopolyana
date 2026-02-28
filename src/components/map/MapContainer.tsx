'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  MapContainer as LeafletMap, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap,
  useMapEvents,
  LayersControl 
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
const userIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers/img/marker-icon-2x-cyan.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

// ============================================
// Компонент: Обработчик геолокации
// ============================================
function LocationHandler({ 
  onLocationFound, 
  onLocationError 
}: { 
  onLocationFound: (pos: [number, number]) => void;
  onLocationError: (msg: string) => void;
}) {
  const map = useMapEvents({
    locationfound(e: LocationEvent) {
      const { lat, lng } = e.latlng;
      onLocationFound([lat, lng]);
    },
    locationerror(e: any) {
      const messages: Record<number, string> = {
        1: 'Доступ к геолокации запрещён',
        2: 'Позиция недоступна',
        3: 'Таймаут запроса',
      };
      onLocationError(messages[e.code] || 'Ошибка геолокации');
    },
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      map.locate({ 
        setView: false, 
        maxZoom: 16, 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    }
  }, [map]);

  return null;
}

// ============================================
// Компонент: Кнопка геолокации
// ============================================
function LocateButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="absolute top-4 right-4 z-[1000] bg-gray-900/90 backdrop-blur-sm 
                 border border-cyan-500/40 text-white px-4 py-2.5 rounded-xl 
                 shadow-lg shadow-cyan-500/20 flex items-center gap-2
                 hover:bg-gray-800 hover:border-cyan-400 transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Определить моё местоположение"
    >
      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <span className="text-sm font-medium hidden sm:inline">Моя позиция</span>
    </button>
  );
}

// ============================================
// Типы и конфигурация слоёв
// ============================================
interface MapLayer {
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  key: string;
}

const MAP_LAYERS: MapLayer[] = [
  {
    key: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://osm.org/copyright" target="_blank">OpenStreetMap</a>',
    maxZoom: 19,
  },
  {
    key: 'satellite',
    name: 'Спутник',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; <a href="https://esri.com" target="_blank">Esri</a>',
    maxZoom: 19,
  },
  {
    key: 'terrain',
    name: 'Рельеф',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data &copy; <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a>, <a href="https://viewfinderpanoramas.org" target="_blank">SRTM</a> | Style: &copy; <a href="https://opentopomap.org" target="_blank">OpenTopoMap</a>',
    maxZoom: 17,
  },
  {
    key: 'dark',
    name: 'Тёмная',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://osm.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com" target="_blank">CARTO</a>',
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
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLayerControl, setShowLayerControl] = useState(false);
  const mapRef = useRef<any>(null);

  const activeLayer = MAP_LAYERS.find(l => l.key === activeLayerKey) || MAP_LAYERS[0];

  const handleLocationFound = useCallback((pos: [number, number]) => {
    setUserPos(pos);
    setGeoError(null);
    if (mapRef.current) {
      mapRef.current.flyTo(pos, 14, { duration: 1.5 });
    }
  }, []);

  const handleLocationError = useCallback((msg: string) => {
    setGeoError(msg);
    setIsLocating(false);
  }, []);

  const handleLocateClick = useCallback(() => {
    if (!('geolocation' in navigator)) {
      handleLocationError('Геолокация не поддерживается');
      return;
    }
    setIsLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        handleLocationFound(pos);
        setIsLocating(false);
      },
      (error) => {
        const messages: Record<number, string> = {
          1: 'Разрешите доступ в настройках браузера',
          2: 'Не удалось определить позицию',
          3: 'Превышено время ожидания',
        };
        handleLocationError(messages[error.code] || 'Ошибка геолокации');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [handleLocationFound, handleLocationError]);

  useEffect(() => {
    if (userLocation && !userPos) {
      setUserPos(userLocation);
      setCenter(userLocation);
    }
  }, [userLocation, userPos]);

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
      >
        {/* ✅ LayersControl от react-leaflet */}
        <LayersControl position="topright">
          {MAP_LAYERS.map((layer) => (
            <LayersControl.BaseLayer 
              key={layer.key}
              name={layer.name}
              checked={layer.key === activeLayerKey}
            >
              <TileLayer
                key={layer.key}
                attribution={layer.attribution}
                url={layer.url}
                maxZoom={layer.maxZoom}
                subdomains={['a', 'b', 'c']}
                errorTileUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              />
            </LayersControl.BaseLayer>
          ))}
        </LayersControl>

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
        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>
              <div className="text-sm">
                <strong>📍 Вы здесь</strong>
                <p className="text-gray-400 text-xs mt-1">
                  {userPos[0].toFixed(4)}°, {userPos[1].toFixed(4)}°
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        <LocationHandler 
          onLocationFound={handleLocationFound} 
          onLocationError={handleLocationError} 
        />
      </LeafletMap>

      {/* ✅ Кастомный контрол слоёв (дублирующий, всегда видимый) */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        {/* Кнопка переключения видимости */}
        <button
          onClick={() => setShowLayerControl(!showLayerControl)}
          className="bg-gray-900/90 backdrop-blur-sm border border-emerald-500/40 
                     text-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2
                     hover:bg-gray-800 transition-all"
        >
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <span className="text-sm font-medium">Слои</span>
        </button>

        {/* Выпадающий список слоёв */}
        {showLayerControl && (
          <div className="bg-gray-900/95 backdrop-blur-sm border border-emerald-500/40 
                          rounded-xl p-2 shadow-lg min-w-[180px]">
            <p className="text-xs text-gray-400 px-2 py-1 mb-1">Выберите слой:</p>
            {MAP_LAYERS.map((layer) => (
              <button
                key={layer.key}
                onClick={() => {
                  setActiveLayerKey(layer.key);
                  setShowLayerControl(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  activeLayerKey === layer.key
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  activeLayerKey === layer.key ? 'bg-emerald-400' : 'bg-gray-600'
                }`} />
                {layer.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Кнопка геолокации */}
      <LocateButton onClick={handleLocateClick} disabled={isLocating} />

      {/* Статус геолокации */}
      {geoError && (
        <div className="absolute top-20 left-4 z-[1000] bg-red-900/90 backdrop-blur-sm 
                        border border-red-500/40 text-red-100 px-4 py-2.5 rounded-xl 
                        shadow-lg flex items-center gap-2 text-sm max-w-[280px]">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="truncate">{geoError}</span>
          <button onClick={() => setGeoError(null)} className="ml-2 hover:text-white">✕</button>
        </div>
      )}

      {isLocating && (
        <div className="absolute top-20 left-4 z-[1000] bg-cyan-900/90 backdrop-blur-sm 
                        border border-cyan-500/40 text-cyan-100 px-4 py-2.5 rounded-xl 
                        shadow-lg flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Определение...</span>
        </div>
      )}

      {/* Индикатор текущего слоя */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-gray-900/90 backdrop-blur-sm 
                      border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-400">
        <span className="text-emerald-400 font-medium">{activeLayer.name}</span>
      </div>
    </div>
  );
}
