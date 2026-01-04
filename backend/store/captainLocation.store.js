// Single source of truth for captain live locations
const captainLocations = new Map();

// socket.on("captain:location", ({ captainId, lat, lng }) => {
//   captainLocations.set(captainId, {
//     lat,
//     lng,
//     updatedAt: Date.now(),
//   });
// });


module.exports = {
  captainLocations,
};
