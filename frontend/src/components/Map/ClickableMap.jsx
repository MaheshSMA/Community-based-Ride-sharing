import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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

export default function ClickableMap({
  pickup,
  drop,
  onMapClick,
}) {
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

      {pickup && <Marker position={[pickup.lat, pickup.lng]} />}
      {drop && <Marker position={[drop.lat, drop.lng]} />}
    </MapContainer>
  );
}
