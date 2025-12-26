import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function GeoapifyMap({ routes = [], markers = [] }) {
  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={13}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        url={`https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_KEY}`}
      />

      {routes.map((route, idx) => (
        <Polyline
          key={idx}
          positions={route}
          className="stroke-blue-600"
        />
      ))}

      {markers.map((m, idx) => (
        <Marker key={idx} position={[m.lat, m.lng]} />
      ))}
    </MapContainer>
  );
}
