import { useState } from "react";
import LocationSearch from "../../components/Map/LocationSearch";
import ClickableMap from "../../components/Map/ClickableMap";

export default function RideRequest() {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [activeField, setActiveField] = useState("pickup");

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
            <p className="text-xs text-gray-500 mt-1">
              📍 {pickup.label}
            </p>
          )}
        </div>

        <div onFocus={() => setActiveField("drop")}>
          <LocationSearch
            label="Drop location"
            onSelect={(loc) => setDrop(loc)}
          />
          {drop && (
            <p className="text-xs text-gray-500 mt-1">
              📍 {drop.label}
            </p>
          )}
        </div>

        <button
          disabled={!pickup || !drop}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
        >
          Preview Route
        </button>
      </div>

      {/* Map */}
      <div className="col-span-2 h-full">
        <ClickableMap
          pickup={pickup}
          drop={drop}
          onMapClick={handleMapClick}
        />

      </div>
    </div>
  );
}
