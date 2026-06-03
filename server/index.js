import http from 'node:http';
import { URL } from 'node:url';
import { config } from './config.js';
import { requestTagoItems, ApiError } from './tagoClient.js';
import {
  filterRoutes,
  normalizeArrival,
  normalizeBusLocation,
  normalizeRoute,
  normalizeRouteStation,
  normalizeStation,
  sortRouteStations
} from './normalizers.js';
import { calculateRouteInsight } from './routeInsight.js';

const routeSearchCache = new Map();
const routeStationCache = new Map();

const sendJson = (response, status, body) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });

  if (status === 204) {
    response.end();
    return;
  }

  response.end(JSON.stringify(body));
};

const getQuery = (url, key) => url.searchParams.get(key)?.trim() ?? '';

const searchRoutes = async (query) => {
  const cacheKey = `${config.cityCode}:${query}`;
  if (routeSearchCache.has(cacheKey)) return routeSearchCache.get(cacheKey);

  const items = await requestTagoItems(config.services.routes, 'getRouteNoList', {
    routeNo: query,
    numOfRows: 100
  });
  const routes = items.map(normalizeRoute).filter((route) => route.routeid && route.routeno);
  const filteredRoutes = filterRoutes(routes, query).slice(0, 30);
  routeSearchCache.set(cacheKey, filteredRoutes);
  return filteredRoutes;
};

const loadRouteStations = async (routeId) => {
  if (routeStationCache.has(routeId)) return routeStationCache.get(routeId);

  const items = await requestTagoItems(config.services.routes, 'getRouteAcctoThrghSttnList', {
    routeId,
    numOfRows: 300
  });
  const stations = sortRouteStations(items.map(normalizeRouteStation).filter((station) => station.nodeid));
  routeStationCache.set(routeId, stations);
  return stations;
};

const loadRouteLocations = async (routeId) => {
  const items = await requestTagoItems(config.services.locations, 'getRouteAcctoBusLcList', {
    routeId,
    numOfRows: 100
  });

  return items.map(normalizeBusLocation).filter(Boolean);
};

const loadArrivals = async (nodeId) => {
  const items = await requestTagoItems(config.services.arrivals, 'getSttnAcctoArvlPrearngeInfoList', {
    nodeId,
    numOfRows: 50
  });

  return items.map(normalizeArrival).filter((arrival) => arrival.routeid || arrival.routeno);
};

const handlers = {
  'GET /api/health': async () => ({
    ok: true,
    cityCode: config.cityCode,
    hasServiceKey: Boolean(config.serviceKey)
  }),
  'GET /api/stations': async (url) => {
    const query = getQuery(url, 'query');
    if (query.length < 2) return [];

    const items = await requestTagoItems(config.services.stations, 'getSttnNoList', {
      nodeNm: query,
      numOfRows: 50
    });

    return items.map(normalizeStation).filter((station) => station.nodenm.includes(query)).slice(0, 20);
  },
  'GET /api/arrivals': async (url) => {
    const nodeId = getQuery(url, 'nodeId');
    if (!nodeId) throw new ApiError('정류소 ID가 필요합니다.', 'missing_node_id', 400);
    return loadArrivals(nodeId);
  },
  'GET /api/routes': async (url) => {
    const query = getQuery(url, 'query');
    if (query.length < 1) return [];

    return searchRoutes(query);
  }
};

const handleDynamicRoute = async (requestUrl) => {
  const stationMatch = requestUrl.pathname.match(/^\/api\/routes\/([^/]+)\/stations$/);
  if (stationMatch) return loadRouteStations(decodeURIComponent(stationMatch[1]));

  const locationMatch = requestUrl.pathname.match(/^\/api\/routes\/([^/]+)\/locations$/);
  if (locationMatch) return loadRouteLocations(decodeURIComponent(locationMatch[1]));

  const insightMatch = requestUrl.pathname.match(/^\/api\/routes\/([^/]+)\/insight$/);
  if (insightMatch) {
    const routeId = decodeURIComponent(insightMatch[1]);
    const nodeId = getQuery(requestUrl, 'nodeId');
    if (!nodeId) throw new ApiError('정류소 ID가 필요합니다.', 'missing_node_id', 400);

    const [routeStations, busLocations, arrivals] = await Promise.all([
      loadRouteStations(routeId),
      loadRouteLocations(routeId),
      loadArrivals(nodeId)
    ]);

    return calculateRouteInsight({ routeId, nodeId, routeStations, busLocations, arrivals });
  }

  return undefined;
};

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const handler = handlers[`${request.method} ${requestUrl.pathname}`];

  try {
    const body = handler ? await handler(requestUrl) : await handleDynamicRoute(requestUrl);
    if (body === undefined) {
      sendJson(response, 404, { message: '요청한 API를 찾을 수 없습니다.', code: 'not_found' });
      return;
    }

    sendJson(response, 200, body);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const code = error instanceof ApiError ? error.code : 'server_error';
    const message = error.message || '서버 오류가 발생했습니다.';
    sendJson(response, status, { message, code });
  }
});

server.listen(config.port, () => {
  console.log(`BIS API server listening on http://localhost:${config.port}`);
});
