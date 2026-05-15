// frontend/src/components/Map/RideTrackingMap.jsx
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
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

// Decode polyline (from Google's algorithm)
const decodePolyline = (encoded) => {
  if (!encoded) return [];
  
  const inv = 1.0 / 1e5;
  let decoded = [];
  let previous = [0, 0];
  let i = 0;

  while (i < encoded.length) {
    let ll = [0, 0];
    for (let j = 0; j < 2; j++) {
      let shift = 0;
      let result = 0;
      let byte = 0;
      do {
        byte = encoded.charCodeAt(i++) - 63;
        result += (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      ll[j] = previous[j] + (result & 1 ? ~(result >> 1) : result >> 1);
      previous[j] = ll[j];
    }
    decoded.push([ll[0] * inv, ll[1] * inv]);
  }
  return decoded;
};

export default function RideTrackingMap({ riderLocation, captainLocation, matchedRoute, riderRoute, captainRoute }) {
  // Calculate center point between rider and captain
  const center = riderLocation && captainLocation
    ? [
        (riderLocation.lat + captainLocation.lat) / 2,
        (riderLocation.lng + captainLocation.lng) / 2,
      ]
    : riderLocation
    ? [riderLocation.lat, riderLocation.lng]
    : [12.9716, 77.5946]; // Default to Bangalore

  // Decode matched route (overlapping path)
  const decodedMatchedRoute = matchedRoute ? decodePolyline(matchedRoute) : [];
  
  // Decode rider and captain routes
  const decodedRiderRoute = riderRoute ? decodePolyline(riderRoute) : [];
  const decodedCaptainRoute = captainRoute ? decodePolyline(captainRoute) : [];

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

        {/* Rider Route (if available) */}
        {decodedRiderRoute.length > 0 && (
          <Polyline
            positions={decodedRiderRoute}
            color="blue"
            weight={3}
            opacity={0.6}
            dashArray="5, 5"
          />
        )}

        {/* Captain Route (if available) */}
        {decodedCaptainRoute.length > 0 && (
          <Polyline
            positions={decodedCaptainRoute}
            color="red"
            weight={3}
            opacity={0.6}
            dashArray="5, 5"
          />
        )}

        {/* Overlapping Route (matched route) - highlighted in green */}
        {decodedMatchedRoute.length > 0 && (
          <Polyline
            positions={decodedMatchedRoute}
            color="#22c55e"
            weight={4}
            opacity={0.9}
          />
        )}

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