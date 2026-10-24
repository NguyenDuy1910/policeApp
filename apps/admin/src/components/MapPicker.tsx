import L from 'leaflet';
import { useEffect, useRef } from 'react';

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onSelect?: (latitude: number, longitude: number) => void;
  label?: string;
}

const initialCenter: L.LatLngExpression = [9.1768, 105.1524];
const markerIcon = L.divIcon({
  className: 'map-pin-wrapper',
  html: '<span class="map-pin"></span>',
  iconSize: [30, 38],
  iconAnchor: [15, 35],
});

export function MapPicker({ latitude, longitude, onSelect, label = 'Vị trí' }: MapPickerProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;
    const center: L.LatLngExpression = latitude !== null && longitude !== null ? [latitude, longitude] : initialCenter;
    const map = L.map(elementRef.current, { center, zoom: latitude !== null ? 15 : 12, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    map.on('click', (event: L.LeafletMouseEvent) => selectRef.current?.(event.latlng.lat, event.latlng.lng));
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (latitude === null || longitude === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const coordinate: L.LatLngExpression = [latitude, longitude];
    if (markerRef.current) markerRef.current.setLatLng(coordinate).bindTooltip(label);
    else markerRef.current = L.marker(coordinate, { icon: markerIcon }).addTo(map).bindTooltip(label);
    map.panTo(coordinate);
  }, [label, latitude, longitude]);

  return <div ref={elementRef} className={`map-picker${onSelect ? ' map-picker--editable' : ''}`} aria-label={onSelect ? 'Bản đồ chọn tọa độ' : 'Bản đồ vị trí'} />;
}
