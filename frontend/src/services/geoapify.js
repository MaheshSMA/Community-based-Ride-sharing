export const fetchRoute = async (from, to, alternatives = false) => {
  if (!from || !to) throw new Error("From and To required");

  const res = await fetch(
    `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lng}|${to.lat},${to.lng}&mode=drive${
      alternatives ? "&alternatives=true" : ""
    }&apiKey=${import.meta.env.VITE_GEOAPIFY_KEY}`
  );

  const data = await res.json();

  if (!data.features?.length) {
    throw new Error("No routes returned");
  }
  const feature = data.features[0];

  const polyline = feature.geometry.coordinates[0].map(
    ([lng, lat]) => [lat, lng]
  );

  return {
    polyline,
    distance: feature.properties.distance,
    duration: feature.properties.time,
    encoded: JSON.stringify(feature.geometry.coordinates[0]),
  };
};
