const { getDistance } = require("./distance");

const THRESHOLD = 200; // meters

exports.calculateOverlap = (riderRoute, captainRoute) => {
  let matched = 0;

  riderRoute.forEach((rPoint) => {
    for (let cPoint of captainRoute) {
      const dist = getDistance(
        { lat: rPoint[0], lng: rPoint[1] },
        { lat: cPoint[0], lng: cPoint[1] }
      );

      if (dist <= THRESHOLD) {
        matched++;
        break;
      }
    }
  });

  return (matched / riderRoute.length) * 100;
};
