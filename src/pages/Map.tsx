import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "../vite-env.d.ts";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Props = {
  latitude: number;
  longitude: number;
  editable?: boolean;
  onLocationChange?: (lat: number, long: number) => void;
  resetToken?: number;
};

function LocationMarker({
  position,
  editable,
  onLocationChange,
}: {
  position: [number, number];
  editable: boolean;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      if (!editable) return;
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={position}
      draggable={editable}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const latlng = marker.getLatLng();
            onLocationChange(latlng.lat, latlng.lng);
          }
        },
      }}
    >
      <Popup>{editable ? "Drag me, or click the map" : "Location"}</Popup>
    </Marker>
  );
}

// Keeps the map view synced when the parent resets/changes coordinates externally
function RecenterOnChange({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [position, map]);
  return null;
}

export default function Map({
  latitude,
  longitude,
  editable = false,
  onLocationChange,
  resetToken,
}: Props) {
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);

  // Re-sync internal position when parent-provided coords change (e.g. cancel, or fresh data load)
  useEffect(() => {
    setPosition([latitude, longitude]);
  }, [latitude, longitude, resetToken]);

  const handleChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange?.(lat, lng);
  };

  return (
    <MapContainer center={position} zoom={15} style={{ width: "100%", height: "400px" }}>
      <TileLayer
       
         attribution="Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ"
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
      maxZoom={19}
      />
      <LocationMarker position={position} editable={editable} onLocationChange={handleChange} />
      <RecenterOnChange position={position} />
      <InvalidateSizeOnMount />
    </MapContainer>
  );
}

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(id);
  }, [map]);
  return null;}