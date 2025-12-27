export const fetchRoute = async (from, to) => {
  const res = await fetch(
    `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lng}|${to.lat},${to.lng}&mode=drive&apiKey=${
      import.meta.env.VITE_GEOAPIFY_KEY
    }`
  );

  const data = await res.json();
  const feature = data.features[0];

  return {
    polyline: feature.geometry.coordinates[0].map(
      ([lng, lat]) => [lat, lng]
    ),
    distance: feature.properties.distance,
    duration: feature.properties.time,
    encoded: JSON.stringify(feature.geometry.coordinates[0]),
  };
};
