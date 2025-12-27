import React, { useState } from "react";
import GeoapifyMap from "../../components/Map/GeoapifyMap";
import API from "../../services/api";
import LocationSearch from "../../components/Map/LocationSearch";
import ClickableMap from "../../components/Map/ClickableMap";

export default function RouteSetup() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeField, setActiveField] = useState("from");
  const [routes, setRoutes] = useState([]);

  const fetchRoutes = async () => {
    const res = await fetch(
      `https://api.geoapify.com/v1/routing?waypoints=${from}|${to}&mode=drive&alternatives=true&apiKey=${
        import.meta.env.VITE_GEOAPIFY_KEY
      }`
    );
    const data = await res.json();

    const parsed = data.features.map((f) =>
      f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng])
    );

    setRoutes(parsed);
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
      routes,
    });
    alert("Routes saved");
  };

  return (
    <div className="p-6 grid grid-cols-3 gap-4 h-screen">
      {/* Controls */}
      <div className="col-span-1 space-y-4">
        <h2 className="text-xl font-semibold">Set Your Route</h2>

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

        <button
          onClick={saveRoutes}
          className="w-full bg-green-600 text-white py-2 rounded-lg"
        >
          Save Selected Routes
        </button>
      </div>

      {/* Map */}

      <div className="col-span-2 h-full">
        <ClickableMap pickup={from} drop={to} onMapClick={handleMapClick} />
      </div>
    </div>
  );
}
