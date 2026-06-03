import { getPosition, sortRouteStations } from './normalizers.js';

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const formatArrivalMinutes = (seconds) => {
  const totalSeconds = toNumber(seconds);
  if (totalSeconds === null || totalSeconds <= 0) return '잠시 후 도착 예정';
  return `${Math.ceil(totalSeconds / 60)}분 뒤 도착 예정`;
};

const distanceSquared = (left, right) => {
  const latDistance = left.lat - right.lat;
  const lngDistance = left.lng - right.lng;
  return latDistance * latDistance + lngDistance * lngDistance;
};

const buildStationIndex = (routeStations) => {
  const stationIndex = new Map();

  sortRouteStations(routeStations).forEach((station, index) => {
    if (station.nodeid) stationIndex.set(station.nodeid, index);
  });

  return stationIndex;
};

const findNearestByGps = (nodeId, routeStations, busLocations) => {
  const selectedStation = routeStations.find((station) => station.nodeid === nodeId);
  const selectedPosition = getPosition(selectedStation);
  if (!selectedPosition) return null;

  return busLocations
    .map((bus) => {
      const position = getPosition(bus);
      if (!position) return null;
      return { bus, distance: distanceSquared(selectedPosition, position) };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)[0]?.bus ?? null;
};

export const calculateRouteInsight = ({
  routeId,
  nodeId,
  routeStations = [],
  busLocations = [],
  arrivals = []
}) => {
  if (!routeId || !nodeId) return null;

  const routeArrival = arrivals.find((arrival) => arrival.routeid === routeId);
  const stationIndex = buildStationIndex(routeStations);
  const selectedStationIndex = stationIndex.get(nodeId);

  const orderedCandidates = busLocations
    .map((bus) => {
      const nodeIndex = stationIndex.get(bus.nodeid);
      if (nodeIndex === undefined || selectedStationIndex === undefined) return null;
      const stationCount = selectedStationIndex - nodeIndex;
      if (stationCount < 0) return null;
      return { bus, stationCount };
    })
    .filter(Boolean)
    .sort((a, b) => a.stationCount - b.stationCount);

  const bestOrderedBus = orderedCandidates[0] ?? null;

  if (routeArrival?.arrprevstationcnt) {
    const stationCount = toNumber(routeArrival.arrprevstationcnt);
    const timeText = formatArrivalMinutes(routeArrival.arrtime);

    return {
      routeId,
      nodeId,
      vehicleNo: bestOrderedBus?.bus.vehicleno ?? '',
      stationCount,
      message: `가장 가까운 버스는 ${stationCount}정류장 전 · ${timeText}`,
      source: 'arrival'
    };
  }

  if (bestOrderedBus) {
    return {
      routeId,
      nodeId,
      vehicleNo: bestOrderedBus.bus.vehicleno,
      stationCount: bestOrderedBus.stationCount,
      message: `가장 가까운 버스는 ${bestOrderedBus.stationCount}정류장 전`,
      source: 'route-order'
    };
  }

  const nearestGpsBus = findNearestByGps(nodeId, routeStations, busLocations);
  if (!nearestGpsBus) return null;

  return {
    routeId,
    nodeId,
    vehicleNo: nearestGpsBus.vehicleno,
    stationCount: null,
    message: '가장 가까운 운행 차량 표시 중',
    source: 'gps'
  };
};
