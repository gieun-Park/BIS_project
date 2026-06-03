export const normalizeItems = (items) => {
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
};

export const filterBusStops = (stops, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return stops.filter((stop) =>
    String(stop.nodenm ?? '').toLowerCase().includes(normalizedQuery)
  );
};

export const getBusLocationPosition = (location) => {
  const lat = Number(location?.gpslati);
  const lng = Number(location?.gpslong);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    return null;
  }

  return { lat, lng };
};

export const normalizeBusLocations = (items) =>
  normalizeItems(items).filter((location) => getBusLocationPosition(location));

export const getBusLocationKey = (location, index = 0) => {
  if (location?.vehicleno) return String(location.vehicleno);

  const routeKey = location?.routeid ?? location?.routeno ?? 'route';
  const positionKey = location?.nodeid ?? location?.nodeord ?? index;
  return `${routeKey}-${positionKey}`;
};

const getNumericCoordinate = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const getRouteStationPosition = (station) => {
  const lat = getNumericCoordinate(station?.gpslati);
  const lng = getNumericCoordinate(station?.gpslong);

  if (!lat || !lng) return null;
  return { lat, lng };
};

export const sortRouteStations = (stations = []) =>
  [...stations].sort((a, b) => {
    const leftOrder = Number(a.nodeord);
    const rightOrder = Number(b.nodeord);

    if (Number.isFinite(leftOrder) && Number.isFinite(rightOrder)) {
      return leftOrder - rightOrder;
    }

    return String(a.nodenm ?? '').localeCompare(String(b.nodenm ?? ''), 'ko-KR');
  });

export const getRoutePath = (stations = []) =>
  sortRouteStations(stations)
    .map((station) => getRouteStationPosition(station))
    .filter(Boolean);
