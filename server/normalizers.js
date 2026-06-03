const toText = (value) => (value === undefined || value === null ? '' : String(value));

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const normalizeItems = (items) => {
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
};

export const normalizeStation = (station = {}) => ({
  nodeid: toText(station.nodeid),
  nodenm: toText(station.nodenm),
  nodeno: toText(station.nodeno),
  gpslati: toText(station.gpslati),
  gpslong: toText(station.gpslong)
});

export const normalizeRoute = (route = {}) => ({
  routeid: toText(route.routeid),
  routeno: toText(route.routeno),
  routetp: toText(route.routetp),
  startnodenm: toText(route.startnodenm),
  endnodenm: toText(route.endnodenm),
  startvehicletime: toText(route.startvehicletime),
  endvehicletime: toText(route.endvehicletime),
  intervaltime: toText(route.intervaltime)
});

export const normalizeRouteStation = (station = {}) => ({
  routeid: toText(station.routeid),
  nodeid: toText(station.nodeid),
  nodenm: toText(station.nodenm),
  nodeno: toText(station.nodeno),
  nodeord: toText(station.nodeord),
  gpslati: toText(station.gpslati),
  gpslong: toText(station.gpslong)
});

export const normalizeArrival = (arrival = {}) => ({
  routeid: toText(arrival.routeid),
  routeno: toText(arrival.routeno),
  arrtime: toText(arrival.arrtime),
  arrprevstationcnt: toText(arrival.arrprevstationcnt)
});

export const normalizeBusLocation = (location = {}) => {
  const lat = toNumber(location.gpslati);
  const lng = toNumber(location.gpslong);

  if (!lat || !lng) return null;

  return {
    routeid: toText(location.routeid),
    routeno: toText(location.routeno),
    vehicleno: toText(location.vehicleno),
    gpslati: toText(location.gpslati),
    gpslong: toText(location.gpslong),
    nodeid: toText(location.nodeid),
    nodeord: toText(location.nodeord),
    nodenm: toText(location.nodenm)
  };
};

export const filterRoutes = (routes, query) => {
  const normalizedQuery = toText(query).trim().toLowerCase();
  if (!normalizedQuery) return [];

  return routes.filter((route) => route.routeno.toLowerCase().includes(normalizedQuery));
};

export const sortRouteStations = (stations) =>
  [...stations].sort((a, b) => {
    const leftOrder = Number(a.nodeord);
    const rightOrder = Number(b.nodeord);

    if (Number.isFinite(leftOrder) && Number.isFinite(rightOrder)) {
      return leftOrder - rightOrder;
    }

    return a.nodenm.localeCompare(b.nodenm, 'ko-KR');
  });

export const getPosition = (item) => {
  const lat = toNumber(item?.gpslati);
  const lng = toNumber(item?.gpslong);

  if (!lat || !lng) return null;
  return { lat, lng };
};

export const buildRoutePath = (stations) =>
  sortRouteStations(stations)
    .map((station) => getPosition(station))
    .filter(Boolean);
