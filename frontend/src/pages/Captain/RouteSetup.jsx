import React, { useState, useEffect } from "react";
import GeoapifyMap from "../../components/Map/GeoapifyMap";
import API from "../../services/api";
import LocationSearch from "../../components/Map/LocationSearch";
import ClickableMap from "../../components/Map/ClickableMap";
import socket from "../../services/socket";
import { fetchRoute } from "../../services/geoapify";
import { useNavigate } from "react-router-dom";
import quickrideImg from "../../assets/quickride-share.png";
import leftpanelbg from "../../assets/left_panel_bg.jpg";

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
      console.log(
        "Captain location:",
        pos.coords.latitude,
        pos.coords.longitude,
      );
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

  const handleViewRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please login again.");
        return;
      }

      const captainId = JSON.parse(atob(token.split(".")[1])).userId;

      // Update captain's rating (+0.05 for viewing requests)
      await API.post("/user/update-rating", {
        targetUserId: captainId,
        points: 0.05
      });

      navigate("/captain/requests");
    } catch (error) {
      console.error("Error updating rating:", error);
      navigate("/captain/requests");
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img src={quickrideImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-3rem)]">
          {/* Controls */}
          <div className="col-span-1 space-y-4 bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 h-full relative overflow-hidden flex flex-col">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 opacity-40">
              <img
                src={leftpanelbg}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 overflow-y-auto space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Set Your Route
              </h2>

              <button
                onClick={handleViewRequests}
                className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition-all duration-200"
              >
                View Incoming Requests
              </button>

              <div onClick={() => setActiveField("from")} className="space-y-2">
                <LocationSearch
                  label="From location"
                  onSelect={(loc) => setFrom(loc)}
                />
                {from && (
                  <p className="text-xs text-gray-600 px-2 bg-gray-50 py-1.5 rounded-lg">
                    📍 {from.label}
                  </p>
                )}
              </div>

              <div onClick={() => setActiveField("to")} className="space-y-2">
                <LocationSearch
                  label="To location"
                  onSelect={(loc) => setTo(loc)}
                />
                {to && (
                  <p className="text-xs text-gray-600 px-2 bg-gray-50 py-1.5 rounded-lg">
                    📍 {to.label}
                  </p>
                )}
              </div>

              <button
                onClick={fetchRoutes}
                className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200"
              >
                Fetch Routes
              </button>

              {route && (
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-1">
                  <p className="font-medium">
                    Distance: {(route.distance / 1000).toFixed(1)} km
                  </p>
                  <p className="font-medium">
                    ETA: {Math.ceil(route.duration / 60)} mins
                  </p>
                </div>
              )}

              <button
                onClick={saveRoutes}
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-all duration-200"
              >
                Save Selected Routes
              </button>
            </div>
          </div>

          {/* Map */}
          <div className="col-span-1 lg:col-span-2 h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <ClickableMap
              pickup={from}
              drop={to}
              route={route}
              onMapClick={handleMapClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
