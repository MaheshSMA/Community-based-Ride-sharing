import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        label: "Selected from map",
      });
    },
  });
  return null;
}

function FitRouteBounds({ route }) {
  const map = useMap();

  useEffect(() => {
    if (route?.polyline?.length) {
      map.fitBounds(route.polyline, {
        padding: [40, 40],
      });
    }
  }, [route]);

  return null;
}

export default function ClickableMap({ pickup, drop, onMapClick, route }) {
  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={13}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        url={`https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=${
          import.meta.env.VITE_GEOAPIFY_KEY
        }`}
      />

      <MapClickHandler onClick={onMapClick} />

      {pickup?.lat !== undefined && pickup?.lng !== undefined && (
        <Marker position={[pickup.lat, pickup.lng]} />
      )}

      {drop?.lat !== undefined && drop?.lng !== undefined && (
        <Marker position={[drop.lat, drop.lng]} />
      )}

      {route?.polyline && (
        <Polyline
          positions={route.polyline}
          pathOptions={{
            color: "#2563eb",
            weight: 6,
            opacity: 0.9,
          }}
        />
      )}

      <FitRouteBounds route={route} />
    </MapContainer>
  );
}
