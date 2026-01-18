// frontend/src/components/Map/RideTrackingMap.jsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom icons for rider and captain
const riderIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const captainIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function RideTrackingMap({ riderLocation, captainLocation }) {
  // Calculate center point between rider and captain
  const center = riderLocation && captainLocation
    ? [
        (riderLocation.lat + captainLocation.lat) / 2,
        (riderLocation.lng + captainLocation.lng) / 2,
      ]
    : riderLocation
    ? [riderLocation.lat, riderLocation.lng]
    : [12.9716, 77.5946]; // Default to Bangalore

  return (
    <div className="w-full h-96 rounded-lg shadow-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={15}
        className="h-full w-full"
      >
        <TileLayer
          url={`https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_KEY}`}
          attribution='&copy; Geoapify'
        />

        {riderLocation && (
          <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
            <Popup>📍 Rider Location</Popup>
          </Marker>
        )}

        {captainLocation && (
          <Marker position={[captainLocation.lat, captainLocation.lng]} icon={captainIcon}>
            <Popup>🚗 Captain Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}