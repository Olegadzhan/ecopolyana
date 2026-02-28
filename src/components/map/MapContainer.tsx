'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mapLayers, defaultLayer, initialCenter, initialZoom } from '@/lib/mapLayers';

// Fix для иконок Leaflet в Next.js
const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Компонент для отслеживания геолокации
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
      
      // Добавляем маркер пользователя
      const userMarker = new Marker([lat, lng], { icon: markerIcon }).addTo(map);
      userMarker.bindPopup('📍 Вы здесь').openPopup();
    };

    const handleLocationError = (e: any) => {
      console.warn('Геолокация не доступна:', e.message);
    };

    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    return () => {
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
    };
  }, [map, onLocationFound]);

  return (
    <button
      onClick={locateUser}
      className="absolute top-4 right-4 z-[1000] bg-emerald-600 hover:bg-emerald-700 
                 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2
                 transition-all duration-200 backdrop-blur-sm"
      aria-label="Определить моё местоположение"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <span className="hidden sm:inline">Моя позиция</span>
    </button>
  );
}

interface MapContainerProps {
  userLocation?: [number, number] | null;
}

export default function MapContainer({ userLocation }: MapContainerProps) {
  const [activeLayer, setActiveLayer] = useState(defaultLayer);
  const [center, setCenter] = useState<LatLngExpression>(userLocation || initialCenter);

  const handleLocationFound = useCallback((pos: [number, number]) => {
    setCenter(pos);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden 
                    border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
      
      <MapContainer 
        center={center} 
        zoom={initialZoom} 
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <LayersControl position="topright">
          {Object.entries(mapLayers).map(([key, layer]) => (
            <LayersControl.BaseLayer 
              key={key} 
              name={layer.name} 
              checked={key === activeLayer}
            >
              <TileLayer
                attribution={layer.attribution}
                url={layer.url}
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          ))}
        </LayersControl>

        {/* Маркеры интересных мест Экополяны */}
        <Marker position={[55.7558, 37.6173]} icon={markerIcon}>
          <Popup>
            <div className="text-sm">
              <strong>🌿 Экополяна</strong><br/>
              Центр эко-технологий будущего
            </div>
          </Popup>
        </Marker>

        {userLocation && (
          <Marker position={userLocation} icon={markerIcon}>
            <Popup>📍 Ваше местоположение</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Контролы поверх карты */}
      <LocateControl onLocationFound={handleLocationFound} />
      
      {/* Переключатель слоёв (дополнительный UI) */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-black/60 backdrop-blur-sm 
                      rounded-xl p-3 border border-emerald-500/30">
        <p className="text-xs text-emerald-300 mb-2">Слой карты:</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(mapLayers).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => setActiveLayer(key)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                activeLayer === key 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
              title={layer.description}
            >
              {layer.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
