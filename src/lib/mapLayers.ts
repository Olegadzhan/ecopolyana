import { TileLayer } from 'leaflet';

export interface MapLayer {
  name: string;
  url: string;
  attribution: string;
  description: string;
}

export const mapLayers: Record<string, MapLayer> = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    description: 'Стандартная карта OSM',
  },
  satellite: {
    name: 'Спутник (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    description: 'Спутниковые снимки',
  },
  terrain: {
    name: 'Рельеф (Stamen)',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>',
    description: 'Топографическая карта',
  },
  dark: {
    name: 'Тёмная тема (CartoDB)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    description: 'Тёмная тема для ночного режима',
  },
};

export const defaultLayer = 'osm';
export const initialCenter: [number, number] = [55.7558, 37.6173]; // Москва по умолчанию
export const initialZoom = 10;
