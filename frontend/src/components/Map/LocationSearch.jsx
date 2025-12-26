import { useEffect, useRef, useState } from "react";

export default function LocationSearch({ label, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const fetchPlaces = async () => {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&limit=5&apiKey=${
          import.meta.env.VITE_GEOAPIFY_KEY
        }`
      );
      const data = await res.json();
      setResults(data.features || []);
    };

    fetchPlaces();
  }, [query]);

  // ✅ Only close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setResults([]);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative z-20">
      <input
        className="w-full px-3 py-2 border rounded-lg"
        placeholder={label}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results.length > 0 && (
        <div className="absolute z-50 bg-white border rounded-lg w-full mt-1 shadow-lg max-h-48 overflow-auto">
          {results.map((place) => (
            <div
              key={place.properties.place_id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => {
                onSelect({
                  lat: place.geometry.coordinates[1],
                  lng: place.geometry.coordinates[0],
                  label: place.properties.formatted,
                });
                setQuery(place.properties.formatted);
                setResults([]); // ✅ close on select
              }}
            >
              {place.properties.formatted}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
