import { useState } from "react";
import GeoapifyMap from "../../components/Map/GeoapifyMap";
import API from "../../services/api";

export default function RouteSetup() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [routes, setRoutes] = useState([]);

  const fetchRoutes = async () => {
    const res = await fetch(
      `https://api.geoapify.com/v1/routing?waypoints=${from}|${to}&mode=drive&alternatives=true&apiKey=${import.meta.env.VITE_GEOAPIFY_KEY}`
    );
    const data = await res.json();

    const parsed = data.features.map((f) =>
      f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng])
    );

    setRoutes(parsed);
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

        <input
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="From (lat,lng)"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />

        <input
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="To (lat,lng)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

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
        <GeoapifyMap routes={routes} />
      </div>
    </div>
  );
}
