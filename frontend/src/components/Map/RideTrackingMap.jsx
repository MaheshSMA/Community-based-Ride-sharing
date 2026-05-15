// frontend/src/components/Map/RideTrackingMap.jsx
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useEffect } from "react";
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

const normalizeCoordinates = (point) => {
  if (!point) return null;
  if (Array.isArray(point) && point.length >= 2) {
    return [point[0], point[1]];
  }
  if (typeof point === "object") {
    if (typeof point.lat === "number" && typeof point.lng === "number") {
      return [point.lat, point.lng];
    }
    if (typeof point.latitude === "number" && typeof point.longitude === "number") {
      return [point.latitude, point.longitude];
    }
  }
  return null;
};

const decodeGooglePolyline = (encoded) => {
  if (!encoded) return [];

  const inv = 1.0 / 1e5;
  const decoded = [];
  let previous = [0, 0];
  let index = 0;

  while (index < encoded.length) {
    const point = [0, 0];

    for (let component = 0; component < 2; component += 1) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      point[component] = previous[component] + (result & 1 ? ~(result >> 1) : result >> 1);
      previous[component] = point[component];
    }

    decoded.push([point[0] * inv, point[1] * inv]);
  }

  return decoded;
};

const decodePolyline = (polyline) => {
  if (!polyline) return [];

  if (Array.isArray(polyline)) {
    return polyline.map(normalizeCoordinates).filter(Boolean);
  }

  if (typeof polyline === "string") {
    try {
      const parsed = JSON.parse(polyline);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeCoordinates).filter(Boolean);
      }
    } catch (error) {
      // not JSON, continue to decode as Google polyline
    }

    return decodeGooglePolyline(polyline);
  }

  return [];
};

function FitRouteBounds({ routes }) {
  const map = useMap();

  useEffect(() => {
    const points = routes.flat();
    if (points.length > 0) {
      map.fitBounds(points, {
        padding: [40, 40],
      });
    }
  }, [map, routes]);

  return null;
};

export default function RideTrackingMap({ riderLocation, captainLocation, matchedRoute, riderRoute, captainRoute }) {
  const decodedMatchedRoute = matchedRoute ? decodePolyline(matchedRoute) : [];
  const decodedRiderRoute = riderRoute ? decodePolyline(riderRoute) : [];
  const decodedCaptainRoute = captainRoute ? decodePolyline(captainRoute) : [];

  const center = riderLocation && captainLocation
    ? [
        (riderLocation.lat + captainLocation.lat) / 2,
        (riderLocation.lng + captainLocation.lng) / 2,
      ]
    : riderLocation
    ? [riderLocation.lat, riderLocation.lng]
    : captainLocation
    ? [captainLocation.lat, captainLocation.lng]
    : [12.9716, 77.5946]; // Default to Bangalore

  const routeBounds = [
    ...decodedMatchedRoute,
    ...decodedRiderRoute,
    ...decodedCaptainRoute,
    riderLocation ? [riderLocation.lat, riderLocation.lng] : null,
    captainLocation ? [captainLocation.lat, captainLocation.lng] : null,
  ].filter(Boolean);

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

        {routeBounds.length > 0 && <FitRouteBounds routes={[routeBounds]} />}

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