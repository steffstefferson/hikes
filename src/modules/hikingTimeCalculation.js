//https://www.wanderndeluxe.de/en/calculate-hiking-time-distance-altitude/
export function calculateHikingTime(listOfWayPoints) {
  var lastPoint = null;
  var totalHikingTimeDistance = 0;
  var totalHikingTimeElevation = 0;
  listOfWayPoints.forEach((x) => {
    if (lastPoint == null) {
      lastPoint = x;
      return;
    }

    var distanceInKm = getDistanceFromLatLonInKm(
      x.lat,
      x.lng,
      lastPoint.lat,
      lastPoint.lng
    );

    if (isNaN(lastPoint.meta.ele) || isNaN(x.meta.ele)) {
      totalHikingTimeElevation = totalHikingTimeDistance = NaN;
      return;
    }

    var elevation = x.meta.ele - lastPoint.meta.ele;
    totalHikingTimeElevation += getHikingTimeElevation(elevation);
    totalHikingTimeDistance += distanceInKm / 4; // 4KM / h
    lastPoint = x;
  });

  var time =
    Math.max(totalHikingTimeElevation, totalHikingTimeDistance) +
    Math.min(totalHikingTimeElevation, totalHikingTimeDistance) / 2;
  return time;
}

function getHikingTimeElevation(elevationInMeter) {
  //ascent
  var elevationFactor = elevationInMeter / 300; //300hm / h
  if (elevationInMeter < 0) {
    //descent
    elevationFactor = (elevationInMeter * -1) / 500; //500hm / h
  }
  return elevationFactor;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
