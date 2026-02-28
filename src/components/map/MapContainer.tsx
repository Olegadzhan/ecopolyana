'use client';

import { useEffect, useState, useCallback } from 'react';
// ✅ ИСПРАВЛЕНИЕ: используем alias для импорта из react-leaflet
import { 
  MapContainer as LeafletMap, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap 
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

// Компонент кнопки геолокации
function LocateControl({ onLocationFound }: { onLocationFound: (pos: [number, number]) => void }) {
  const map = useMap();

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    map.locate({ setView: true, maxZoom: 14, enableHighAccuracy: true });
  }, [map]);

  useEffect(() => {
    const handleLocationFound = (e: any) => {
      const { lat, lng } = e.latlng;
      onLocationFound([lat, lng]);
      const userMarker = new Marker([lat, lng], { icon: markerIcon }).addTo(map);
      userMarker.bindPopup('📍 Вы здесь').openPopup();
    };

    map.on('locationfound', handleLocationFound);
    return () => { map.off('locationfound', handleLocationFound); };
  }, [map, onLocationFound]);

  return (
    <button
      onClick={locateUser}
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

// ✅ Наш компонент теперь не конфликтует с импортом
export default function MapContainer({ userLocation }: MapContainerProps) {
  const [activeLayer, setActiveLayer] = useState('osm');
  const [center, setCenter] = useState<LatLngExpression>(userLocation || [55.7558, 37.6173]);

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
      
      {/* ✅ Используем LeafletMap вместо MapContainer */}
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
      </LeafletMap>

      {/* Кнопка геолокации */}
      <LocateControl onLocationFound={setCenter} />
      
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
              title={(layer as any).attribution}
            >
              {layer.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
