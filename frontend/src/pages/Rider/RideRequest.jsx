import { useState } from "react";
import LocationSearch from "../../components/Map/LocationSearch";
import ClickableMap from "../../components/Map/ClickableMap";
import { fetchRoute } from "../../services/geoapify";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import quickrideImg from "../../assets/quickride-share.png";
import leftpanelbg from "../../assets/left_panel_bg.jpg"

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

  const handleRequestRide = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please login again.");
        return;
      }

      const userId = JSON.parse(atob(token.split(".")[1])).userId;

      // Update rider's rating (+0.05 for requesting a ride)
      await API.post("/user/update-rating", {
        targetUserId: userId,
        points: 0.05
      });

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
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={quickrideImg}
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-3rem)]">
          {/* Left Panel */}
          <div className="col-span-1 space-y-4 bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 h-full relative overflow-hidden flex flex-col">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 opacity-50">
              <img 
                src={leftpanelbg} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 overflow-y-auto space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Request a Ride</h2>

              <div onFocus={() => setActiveField("pickup")} className="space-y-2">
                <LocationSearch
                  label="Pickup location"
                  onSelect={(loc) => setPickup(loc)}
                />
                {pickup && (
                  <p className="text-xs text-gray-600 px-2 bg-gray-50 py-1.5 rounded-lg">📍 {pickup.label}</p>
                )}
              </div>

              <div onFocus={() => setActiveField("drop")} className="space-y-2">
                <LocationSearch
                  label="Drop location"
                  onSelect={(loc) => setDrop(loc)}
                />
                {drop && (
                  <p className="text-xs text-gray-600 px-2 bg-gray-50 py-1.5 rounded-lg">📍 {drop.label}</p>
                )}
              </div>

              <button
                disabled={!pickup || !drop}
                onClick={async () => {
                  const r = await fetchRoute(pickup, drop);
                  setRoute(r);
                }}
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:bg-green-400 disabled:cursor-not-allowed"
              >
                Preview Route
              </button>

              {route && (
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-1">
                  <p className="font-medium">Distance: {(route.distance / 1000).toFixed(1)} km</p>
                  <p className="font-medium">ETA: {Math.ceil(route.duration / 60)} mins</p>
                </div>
              )}

              <input
                type="number"
                min="1"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                placeholder="Seats required"
              />

              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 cursor-pointer"
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="auto">Auto</option>
              </select>

              <button
                disabled={!route}
                onClick={handleRequestRide}
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-all duration-200 disabled:bg-black-300 disabled:cursor-not-allowed"
              >
                Request Ride
              </button>
            </div>
          </div>

          {/* Map */}
          <div className="col-span-1 lg:col-span-2 h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <ClickableMap pickup={pickup} drop={drop} route={route} onMapClick={handleMapClick} />
          </div>
        </div>
      </div>
    </div>
  );
}
