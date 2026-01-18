import { useState } from "react";
import LocationSearch from "../../components/Map/LocationSearch";
import ClickableMap from "../../components/Map/ClickableMap";
import { fetchRoute } from "../../services/geoapify";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function RideRequest() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [activeField, setActiveField] = useState("pickup");
  const [route, setRoute] = useState(null);
  const [seats, setSeats] = useState(1);
  const [vehicleType, setVehicleType] = useState("car");

  const handleMapClick = (location) => {
    if (activeField === "pickup") {
      setPickup(location);
    } else {
      setDrop(location);
    }
  };

  return (
    <div className="p-6 grid grid-cols-3 gap-4 h-screen">
      {/* Left Panel */}
      <div className="col-span-1 space-y-4">
        <h2 className="text-xl font-semibold">Request a Ride</h2>

        <div onFocus={() => setActiveField("pickup")}>
          <LocationSearch
            label="Pickup location"
            onSelect={(loc) => setPickup(loc)}
          />
          {pickup && (
            <p className="text-xs text-gray-500 mt-1">📍 {pickup.label}</p>
          )}
        </div>

        <div onFocus={() => setActiveField("drop")}>
          <LocationSearch
            label="Drop location"
            onSelect={(loc) => setDrop(loc)}
          />
          {drop && (
            <p className="text-xs text-gray-500 mt-1">📍 {drop.label}</p>
          )}
        </div>

        <button
          disabled={!pickup || !drop}
          onClick={async () => {
            const r = await fetchRoute(pickup, drop);
            setRoute(r);
          }}
          className="w-full bg-blue-600 text-white py-2 rounded-lg"
        >
          Preview Route
        </button>

        {route && (
          <div className="text-sm text-gray-600">
            <p>Distance: {(route.distance / 1000).toFixed(1)} km</p>
            <p>ETA: {Math.ceil(route.duration / 60)} mins</p>
          </div>
        )}

        <input
          type="number"
          min="1"
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Seats required"
        />

        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="car">Car</option>
          <option value="bike">Bike</option>
          <option value="auto">Auto</option>
        </select>
        <button
          disabled={!route}
          onClick={async () => {
            try {
              const response = await API.post("/rides/request", {
                pickup,
                drop,
                seatsRequired: seats,
                preferences: { vehicleType },
                route: {
                  polyline: route.encoded,
                  distance: route.distance,
                  duration: route.duration,
                },
              });
              
              // ✅ Navigate to waiting page with rideId
              const rideId = response.data.rideId;
              if (rideId) {
                navigate(`/rider/waiting/${rideId}`);
              } else {
                alert("Ride requested, but no ride ID received");
              }
            } catch (error) {
              console.error("Error requesting ride:", error);
              alert("Failed to request ride. Please try again.");
            }
          }}
          className="w-full bg-green-600 text-white py-2 rounded-lg"
        >
          Request Ride
        </button>
      </div>

      {/* Map */}
      <div className="col-span-2 h-full">
        <ClickableMap pickup={pickup} drop={drop} route={route} onMapClick={handleMapClick} />
      </div>
    </div>
  );
}
