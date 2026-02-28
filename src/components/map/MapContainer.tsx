'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  MapContainer as LeafletMap, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap,
  useMapEvents
} from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix для иконок Leaflet в Next.js
const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ✅ Компонент для обработки событий карты (вместо imperative API)
function MapEvents({ onLocationFound }: { onLocationFound: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    locationfound(e) {
      const { lat, lng } = e.latlng;
      onLocationFound([lat, lng]);
    },
  });

  useEffect(() => {
    // Пытаемся получить геолокацию при монтировании
    map.locate({ setView: false, maxZoom: 14, enableHighAccuracy: true });
  }, [map]);

  return null;
}

// ✅ Кнопка для ручного запроса геолокации
function LocateButton({ onLocate }: { onLocate: () => void }) {
  return (
    <button
      onClick={onLocate}
      className="absolute top-4 right-4 z-[1000] bg-emerald-600 hover:bg-emerald-700 
                 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2
                 transition-all duration-200"
      aria-label="Определить моё местоположение"
    >
      <span>📍 Моя позиция</span>
    </button>
  );
}

interface MapContainerProps {
  userLocation?: [number, number] | null;
}

export default function MapContainer({ userLocation }: MapContainerProps) {
  const [activeLayer, setActiveLayer] = useState('osm');
  const [center, setCenter] = useState<LatLngExpression>(userLocation || [55.7558, 37.6173]);
  const [showUserMarker, setShowUserMarker] = useState(!!userLocation);

  // Обработчик для кнопки геолокации
  const handleLocate = useCallback(() => {
    setShowUserMarker(true);
    // Геолокация обрабатывается через MapEvents
  }, []);

  // Обновление центра при изменении userLocation
  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
      setShowUserMarker(true);
    }
  }, [userLocation]);

  // Конфигурация слоёв
  const layers = {
    osm: { 
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
      name: 'OSM',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    satellite: { 
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
      name: 'Спутник',
      attribution: 'Tiles &copy; Esri'
    },
    terrain: { 
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', 
      name: 'Рельеф',
      attribution: 'Map tiles by Stamen Design'
    },
    dark: { 
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', 
      name: 'Тёмная',
      attribution: '&copy; CARTO'
    },
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden 
                    border border-emerald-500/30 shadow-2xl">
      
      <LeafletMap 
        center={center} 
        zoom={10} 
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution={layers[activeLayer as keyof typeof layers].attribution}
          url={layers[activeLayer as keyof typeof layers].url}
          maxZoom={19}
        />
        
        {/* Маркер центра Экополяны */}
        <Marker position={[55.7558, 37.6173]} icon={markerIcon}>
          <Popup>
            <div className="text-sm">
              <strong>🌿 Экополяна</strong><br/>
              Центр эко-технологий будущего
            </div>
          </Popup>
        </Marker>

        {/* ✅ Маркер пользователя (React-компонент, не new Marker) */}
        {showUserMarker && userLocation && (
          <Marker position={userLocation} icon={markerIcon}>
            <Popup>📍 Вы здесь</Popup>
          </Marker>
        )}

        {/* ✅ Обработчик событий карты */}
        <MapEvents onLocationFound={(pos) => {
          setCenter(pos);
          setShowUserMarker(true);
        }} />
      </LeafletMap>

      {/* Кнопка геолокации */}
      <LocateButton onLocate={handleLocate} />
      
      {/* Переключатель слоёв */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-black/60 backdrop-blur-sm 
                      rounded-xl p-3 border border-emerald-500/30">
        <p className="text-xs text-emerald-300 mb-2">Слой карты:</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(layers).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => setActiveLayer(key)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                activeLayer === key 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {layer.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
