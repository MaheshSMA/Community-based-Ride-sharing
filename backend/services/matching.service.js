const User = require("../models/User.model");
const { calculateOverlap } = require("../utils/routeOverlap");
const { captainLocations } = require("../store/captainLocation.store");

exports.findEligibleCaptains = async (ride) => {
  if (!captainLocations) {
    throw new Error("captainLocations store not initialized");
  }

  const captains = await User.find({
    activeRole: "CAPTAIN",
    "captainProfile.isAvailable": true,
  });

  const riderRoute = JSON.parse(ride.route.polyline);

  const results = [];

  for (let captain of captains) {
    const liveLocation = captainLocations.get(captain._id.toString());

    console.log(
      "Checking captain:",
      captain._id.toString(),
      "liveLocation:",
      liveLocation
    );

    if (!liveLocation) continue; // not online

    // if (captain.captainProfile.seatsAvailable < ride.seatsRequired) continue;

    // if (ride.preferences.vehicleType && captain.captainProfile.vehicleType !== ride.preferences.vehicleType)continue;

    // Try each captain route
    for (let route of captain.captainProfile.routes) {
      const captainRoute = JSON.parse(route.polyline);

      // prepend current location
      const fullRoute = [[liveLocation.lat, liveLocation.lng], ...captainRoute];

      const overlap = calculateOverlap(riderRoute, fullRoute);

      if (overlap >= 5) {
        results.push({
          captainId: captain._id,
          overlap,
          routePriority: route.priority,
          matchedRoute: fullRoute,
        });
      }
    }
  }

  // Sort by overlap desc
  return results.sort((a, b) => b.overlap - a.overlap);
};
