import React, { useState, useEffect } from "react";
import GeoapifyMap from "../../components/Map/GeoapifyMap";
import API from "../../services/api";
import LocationSearch from "../../components/Map/LocationSearch";
import ClickableMap from "../../components/Map/ClickableMap";
import socket from "../../services/socket";
import { fetchRoute } from "../../services/geoapify";
import { useNavigate } from "react-router-dom";



export default function RouteSetup() {
  const navigate = useNavigate();

  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [activeField, setActiveField] = useState("from");
  const [route, setRoute] = useState([]);
  const [matchedRoute, setMatchedRoute] = useState(null);

  useEffect(() => {
    socket.connect();

    const token = localStorage.getItem("token");
    const captainId = JSON.parse(atob(token.split(".")[1])).userId;

    socket.emit("captain:join", { captainId });

    const watchId = navigator.geolocation.watchPosition((pos) => {
      console.log("Captain location:", pos.coords.latitude, pos.coords.longitude);
      socket.emit("captain:location", {
        captainId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      // socket.disconnect();
    };
  }, []);

  const fetchRoutes = async () => {
    if (!from || !to) return alert("Select both locations");

    const r = await fetchRoute(from, to);
    setRoute(r);
  };

  const handleMapClick = (location) => {
    if (activeField === "from") {
      setFrom(location);
    } else {
      setTo(location);
    }
  };

  const saveRoutes = async () => {
    await API.post("/captain/routes", {
      route: {
        polyline: route.encoded,
        distance: route.distance,
        duration: route.duration,
      },
    });
    alert("Route saved");
  };

  return (
    <div className="p-6 grid grid-cols-3 gap-4 h-screen">
      {/* Controls */}
      <div className="col-span-1 space-y-4">
        <h2 className="text-xl font-semibold">Set Your Route</h2>

        <button
          onClick={() => navigate("/captain/requests")}
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
        >
          View Incoming Requests
        </button>

        <div onClick={() => setActiveField("from")}>
          <LocationSearch
            label="From location"
            onSelect={(loc) => setFrom(loc)}
          />
          {from && <p className="text-xs text-gray-500">📍 {from.label}</p>}
        </div>

        <div onClick={() => setActiveField("to")}>
          <LocationSearch label="To location" onSelect={(loc) => setTo(loc)} />
          {to && <p className="text-xs text-gray-500">📍 {to.label}</p>}
        </div>

        <button
          onClick={fetchRoutes}
          className="w-full bg-blue-600 text-white py-2 rounded-lg"
        >
          Fetch Routes
        </button>

        {route && (
          <div className="text-sm text-gray-600">
            <p>Distance: {(route.distance / 1000).toFixed(1)} km</p>
            <p>ETA: {Math.ceil(route.duration / 60)} mins</p>
          </div>
        )}

        <button
          onClick={saveRoutes}
          className="w-full bg-green-600 text-white py-2 rounded-lg"
        >
          Save Selected Routes
        </button>
      </div>

      {/* Map */}

      <div className="col-span-2 h-full">
        <ClickableMap
          pickup={from}
          drop={to}
          route={route}
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  );
}
