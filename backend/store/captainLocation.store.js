// Single source of truth for captain live locations
const captainLocations = new Map();

// Function to update captain location
function updateCaptainLocation(captainId, lat, lng) {
  captainLocations.set(captainId, {
    lat,
    lng,
    updatedAt: Date.now(),
  });
}

// Function to get captain location
function getCaptainLocation(captainId) {
  return captainLocations.get(captainId);
}

// Function to remove captain location (when they go offline)
function removeCaptainLocation(captainId) {
  captainLocations.delete(captainId);
}

module.exports = {
  captainLocations,
  updateCaptainLocation,
  getCaptainLocation,
  removeCaptainLocation,
};