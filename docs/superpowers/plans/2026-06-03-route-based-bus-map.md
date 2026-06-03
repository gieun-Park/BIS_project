# Route-Based Bus Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-backed route search flow that draws bus route lines, shows all live route buses, and explains the nearest approaching bus for a selected station.

**Architecture:** Add a small Node HTTP API server that owns TAGO public-data calls and service-key handling. Migrate the React app to call local `/api` endpoints, then layer route stations, route polyline, live bus markers, and station insight overlays on the Kakao map.

**Tech Stack:** Node.js ESM, built-in `node:http`, axios, Vite React, Kakao Maps JavaScript SDK, Node test runner.

---

## File Structure

- Create `server/normalizers.js`: normalize TAGO response items, routes, route stations, bus locations, and arrivals.
- Create `server/routeInsight.js`: pure nearest-bus and route-station insight calculations.
- Create `server/config.js`: load `.env.local` and `.env` values without adding a dotenv dependency.
- Create `server/tagoClient.js`: shared public-data request helper with consistent upstream error handling.
- Create `server/index.js`: local JSON API server with station, arrival, route, route-station, route-location, and insight endpoints.
- Create `server/normalizers.test.js`: server normalization and route filtering tests.
- Create `server/routeInsight.test.js`: nearest-bus insight tests.
- Modify `package.json`: add server and test scripts.
- Modify `vite.config.js`: proxy `/api` requests to the local API server.
- Modify `.env.example`: move the public-data key to `DATA_GO_KR_SERVICE_KEY` and keep the Kakao browser key.
- Modify `src/api/busApi.js`: replace public-data browser calls with local `/api` calls.
- Modify `src/api/busData.js`: add route-station position and route-path helpers for map rendering.
- Modify `src/api/busData.test.js`: cover route-path helper behavior.
- Modify `src/components/KakaoStationMap.jsx`: draw route polyline, route station markers, and the insight overlay.
- Modify `src/screens/BusArrivalScreen.jsx`: add integrated station and route search, route selection, route data polling, and insight loading.
- Modify `src/index.css`: style segmented controls, route results, route status, and mobile states.
- Modify `README.md` and `docs/04-integrations/environment-variables.md`: document the backend run path and server-side public-data key.

## Task 1: Server Pure Data Helpers

**Files:**
- Create: `server/normalizers.js`
- Create: `server/routeInsight.js`
- Test: `server/normalizers.test.js`
- Test: `server/routeInsight.test.js`

- [ ] **Step 1: Write normalization tests**

Create `server/normalizers.test.js`:

```js
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildRoutePath,
  filterRoutes,
  normalizeArrival,
  normalizeBusLocation,
  normalizeItems,
  normalizeRoute,
  normalizeRouteStation,
  normalizeStation,
  sortRouteStations
} from './normalizers.js';

describe('normalizeItems', () => {
  it('returns an empty array for missing API items', () => {
    assert.deepEqual(normalizeItems(undefined), []);
  });

  it('wraps a single API item in an array', () => {
    assert.deepEqual(normalizeItems({ routeid: 'R1' }), [{ routeid: 'R1' }]);
  });
});

describe('route normalization', () => {
  it('normalizes route fields used by the frontend', () => {
    assert.deepEqual(
      normalizeRoute({
        routeid: 'CWB1',
        routeno: 100,
        routetp: '간선',
        startnodenm: '기점',
        endnodenm: '종점'
      }),
      {
        routeid: 'CWB1',
        routeno: '100',
        routetp: '간선',
        startnodenm: '기점',
        endnodenm: '종점',
        startvehicletime: '',
        endvehicletime: '',
        intervaltime: ''
      }
    );
  });

  it('filters routes by route number text', () => {
    const routes = [
      normalizeRoute({ routeid: 'R10', routeno: '10' }),
      normalizeRoute({ routeid: 'R100', routeno: '100' })
    ];

    assert.deepEqual(filterRoutes(routes, '10').map((route) => route.routeid), ['R10', 'R100']);
  });
});

describe('station and path normalization', () => {
  it('normalizes a searched station', () => {
    assert.deepEqual(
      normalizeStation({
        nodeid: 'N1',
        nodenm: '창원역',
        nodeno: 123,
        gpslati: '35.257',
        gpslong: '128.607'
      }),
      {
        nodeid: 'N1',
        nodenm: '창원역',
        nodeno: '123',
        gpslati: '35.257',
        gpslong: '128.607'
      }
    );
  });

  it('sorts route stations by node order and builds route path points', () => {
    const stations = [
      normalizeRouteStation({ nodeid: 'N2', nodenm: '둘', nodeord: '2', gpslati: '35.2', gpslong: '128.2' }),
      normalizeRouteStation({ nodeid: 'N1', nodenm: '하나', nodeord: '1', gpslati: '35.1', gpslong: '128.1' })
    ];

    assert.deepEqual(sortRouteStations(stations).map((station) => station.nodeid), ['N1', 'N2']);
    assert.deepEqual(buildRoutePath(stations), [
      { lat: 35.1, lng: 128.1 },
      { lat: 35.2, lng: 128.2 }
    ]);
  });
});

describe('arrival and location normalization', () => {
  it('normalizes arrival values as strings for transport across the API', () => {
    assert.deepEqual(
      normalizeArrival({ routeid: 'R1', routeno: 100, arrtime: 420, arrprevstationcnt: 3 }),
      { routeid: 'R1', routeno: '100', arrtime: '420', arrprevstationcnt: '3' }
    );
  });

  it('drops bus locations without usable coordinates', () => {
    assert.equal(normalizeBusLocation({ gpslati: '0', gpslong: '128.1' }), null);
    assert.deepEqual(
      normalizeBusLocation({ routeid: 'R1', vehicleno: '70A', gpslati: '35.1', gpslong: '128.1', nodeid: 'N1' }),
      {
        routeid: 'R1',
        routeno: '',
        vehicleno: '70A',
        gpslati: '35.1',
        gpslong: '128.1',
        nodeid: 'N1',
        nodeord: '',
        nodenm: ''
      }
    );
  });
});
```

- [ ] **Step 2: Run tests and verify they fail because files are missing**

Run:

```bash
node --test server/normalizers.test.js
```

Expected: FAIL with module-not-found for `server/normalizers.js`.

- [ ] **Step 3: Implement normalization helpers**

Create `server/normalizers.js`:

```js
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

  return routes.filter((route) =>
    route.routeno.toLowerCase().includes(normalizedQuery)
  );
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
```

- [ ] **Step 4: Run normalization tests and verify they pass**

Run:

```bash
node --test server/normalizers.test.js
```

Expected: PASS for all normalization tests.

- [ ] **Step 5: Write route insight tests**

Create `server/routeInsight.test.js`:

```js
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateRouteInsight } from './routeInsight.js';

const routeStations = [
  { nodeid: 'N1', nodenm: '첫정류장', nodeord: '1', gpslati: '35.1', gpslong: '128.1' },
  { nodeid: 'N2', nodenm: '둘째정류장', nodeord: '2', gpslati: '35.2', gpslong: '128.2' },
  { nodeid: 'N3', nodenm: '셋째정류장', nodeord: '3', gpslati: '35.3', gpslong: '128.3' }
];

describe('calculateRouteInsight', () => {
  it('uses official arrival values when the selected route arrival is available', () => {
    const insight = calculateRouteInsight({
      routeId: 'R1',
      nodeId: 'N3',
      routeStations,
      busLocations: [{ routeid: 'R1', vehicleno: '70A', nodeid: 'N2', gpslati: '35.2', gpslong: '128.2' }],
      arrivals: [{ routeid: 'R1', arrprevstationcnt: '1', arrtime: '420' }]
    });

    assert.equal(insight.message, '가장 가까운 버스는 1정류장 전 · 7분 뒤 도착 예정');
    assert.equal(insight.vehicleNo, '70A');
    assert.equal(insight.source, 'arrival');
  });

  it('calculates station-count distance from route order when arrival time is missing', () => {
    const insight = calculateRouteInsight({
      routeId: 'R1',
      nodeId: 'N3',
      routeStations,
      busLocations: [{ routeid: 'R1', vehicleno: '70A', nodeid: 'N1', gpslati: '35.1', gpslong: '128.1' }],
      arrivals: []
    });

    assert.equal(insight.message, '가장 가까운 버스는 2정류장 전');
    assert.equal(insight.stationCount, 2);
    assert.equal(insight.source, 'route-order');
  });

  it('falls back to nearest operating vehicle when order matching is unavailable', () => {
    const insight = calculateRouteInsight({
      routeId: 'R1',
      nodeId: 'N3',
      routeStations,
      busLocations: [{ routeid: 'R1', vehicleno: '70B', gpslati: '35.31', gpslong: '128.31' }],
      arrivals: []
    });

    assert.equal(insight.message, '가장 가까운 운행 차량 표시 중');
    assert.equal(insight.vehicleNo, '70B');
    assert.equal(insight.source, 'gps');
  });
});
```

- [ ] **Step 6: Run insight tests and verify they fail because the module is missing**

Run:

```bash
node --test server/routeInsight.test.js
```

Expected: FAIL with module-not-found for `server/routeInsight.js`.

- [ ] **Step 7: Implement route insight calculation**

Create `server/routeInsight.js`:

```js
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
```

- [ ] **Step 8: Run server helper tests**

Run:

```bash
node --test server/normalizers.test.js server/routeInsight.test.js
```

Expected: PASS for both server helper test files.

- [ ] **Step 9: Commit server helper work**

Run:

```bash
git add server/normalizers.js server/routeInsight.js server/normalizers.test.js server/routeInsight.test.js
git commit -m "feat(server): add TAGO data helpers"
```

Expected: commit succeeds with only the four server helper files.

## Task 2: Backend API Server

**Files:**
- Create: `server/config.js`
- Create: `server/tagoClient.js`
- Create: `server/index.js`
- Modify: `package.json`
- Modify: `vite.config.js`
- Modify: `.env.example`

- [ ] **Step 1: Add package scripts**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "node server/index.js",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "node --test src/**/*.test.js server/**/*.test.js"
  }
}
```

- [ ] **Step 2: Add Vite API proxy**

Modify `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 3: Update environment example**

Modify `.env.example`:

```dotenv
DATA_GO_KR_SERVICE_KEY=
VITE_KAKAO_MAP_JS_KEY=
CITY_CODE=38010
PORT=5174
```

- [ ] **Step 4: Create server config loader**

Create `server/config.js`:

```js
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ENV_FILES = ['.env.local', '.env'];

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');

    if (!process.env[key]) process.env[key] = value;
  });
};

ENV_FILES.forEach((fileName) => loadEnvFile(path.resolve(process.cwd(), fileName)));

export const config = {
  port: Number(process.env.PORT ?? 5174),
  cityCode: process.env.CITY_CODE ?? '38010',
  serviceKey: process.env.DATA_GO_KR_SERVICE_KEY ?? process.env.VITE_DATA_GO_KR_SERVICE_KEY ?? '',
  services: {
    arrivals: 'https://apis.data.go.kr/1613000/ArvlInfoInqireService',
    stations: 'https://apis.data.go.kr/1613000/BusSttnInfoInqireService',
    locations: 'https://apis.data.go.kr/1613000/BusLcInfoInqireService',
    routes: 'https://apis.data.go.kr/1613000/BusRouteInfoInqireService'
  }
};
```

- [ ] **Step 5: Create TAGO request helper**

Create `server/tagoClient.js`:

```js
import axios from 'axios';
import { config } from './config.js';
import { normalizeItems } from './normalizers.js';

export class ApiError extends Error {
  constructor(message, code, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const getErrorCode = (status) => {
  if (status === 401) return 'api_key_error';
  if (status === 403) return 'api_permission_error';
  return 'upstream_api_error';
};

export const requestTagoItems = async (serviceBaseUrl, operation, params = {}) => {
  if (!config.serviceKey) {
    throw new ApiError('공공데이터 서비스 키가 설정되지 않았습니다.', 'missing_service_key', 500);
  }

  try {
    const response = await axios.get(`${serviceBaseUrl}/${operation}`, {
      params: {
        serviceKey: config.serviceKey,
        _type: 'json',
        cityCode: config.cityCode,
        numOfRows: 100,
        pageNo: 1,
        ...params
      }
    });

    const header = response.data?.response?.header;
    if (header?.resultCode && header.resultCode !== '00') {
      throw new ApiError(header.resultMsg ?? '공공데이터 응답 오류입니다.', 'upstream_result_error', 502);
    }

    return normalizeItems(response.data?.response?.body?.items?.item);
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const status = error?.response?.status ?? 500;
    throw new ApiError('공공데이터 API 호출에 실패했습니다.', getErrorCode(status), status === 500 ? 502 : status);
  }
};
```

- [ ] **Step 6: Create backend API server**

Create `server/index.js`:

```js
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

const routeCache = new Map();
const routeStationCache = new Map();

const sendJson = (response, status, body) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  response.end(JSON.stringify(body));
};

const getQuery = (url, key) => url.searchParams.get(key)?.trim() ?? '';

const loadRoutes = async () => {
  const cacheKey = config.cityCode;
  if (routeCache.has(cacheKey)) return routeCache.get(cacheKey);

  const items = await requestTagoItems(config.services.routes, 'getRouteNoList', { numOfRows: 1000 });
  const routes = items.map(normalizeRoute).filter((route) => route.routeid && route.routeno);
  routeCache.set(cacheKey, routes);
  return routes;
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

    const routes = await loadRoutes();
    return filterRoutes(routes, query).slice(0, 30);
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
```

- [ ] **Step 7: Run backend helper tests through npm**

Run:

```bash
npm test
```

Expected: PASS for existing `src/api` tests and new `server` tests.

- [ ] **Step 8: Start backend server**

Run:

```bash
npm run dev:server
```

Expected: output includes `BIS API server listening on http://localhost:5174`.

- [ ] **Step 9: Verify health endpoint in a second terminal**

Run:

```bash
curl http://localhost:5174/api/health
```

Expected: JSON includes `"ok":true` and `"cityCode":"38010"`.

- [ ] **Step 10: Commit backend API server work**

Run:

```bash
git add server/config.js server/tagoClient.js server/index.js package.json vite.config.js .env.example
git commit -m "feat(server): add local TAGO API"
```

Expected: commit succeeds with backend server and dev config files.

## Task 3: Frontend API Migration

**Files:**
- Modify: `src/api/busApi.js`

- [ ] **Step 1: Replace browser public-data calls with local API calls**

Modify `src/api/busApi.js`:

```js
import axios from 'axios';

const localApi = axios.create({
  baseURL: '/api'
});

const readData = (response) => response.data ?? [];

export const searchBusStops = async (query) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const response = await localApi.get('/stations', {
    params: { query: normalizedQuery }
  });

  return readData(response);
};

export const getLiveBusArrival = async (nodeId) => {
  if (!nodeId) return [];

  const response = await localApi.get('/arrivals', {
    params: { nodeId }
  });

  return readData(response);
};

export const searchBusRoutes = async (query) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const response = await localApi.get('/routes', {
    params: { query: normalizedQuery }
  });

  return readData(response);
};

export const getRouteStations = async (routeId) => {
  if (!routeId) return [];

  const response = await localApi.get(`/routes/${encodeURIComponent(routeId)}/stations`);
  return readData(response);
};

export const getRouteBusLocations = async (routeId) => {
  if (!routeId) return [];

  const response = await localApi.get(`/routes/${encodeURIComponent(routeId)}/locations`);
  return readData(response);
};

export const getRouteInsight = async (routeId, nodeId) => {
  if (!routeId || !nodeId) return null;

  const response = await localApi.get(`/routes/${encodeURIComponent(routeId)}/insight`, {
    params: { nodeId }
  });

  return response.data ?? null;
};
```

- [ ] **Step 2: Verify no public-data service URLs remain in browser API code**

Run:

```bash
rg "apis\\.data\\.go\\.kr|VITE_DATA_GO_KR_SERVICE_KEY|serviceKey" src
```

Expected: no matches in `src`.

- [ ] **Step 3: Run frontend helper tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Commit frontend API migration**

Run:

```bash
git add src/api/busApi.js
git commit -m "refactor(api): route public data through backend"
```

Expected: commit succeeds with only `src/api/busApi.js`.

## Task 4: Frontend Route Data Helpers

**Files:**
- Modify: `src/api/busData.js`
- Modify: `src/api/busData.test.js`

- [ ] **Step 1: Add route path tests**

Append to `src/api/busData.test.js`:

```js
import { getRouteStationPosition, getRoutePath } from './busData.js';

describe('getRoutePath', () => {
  it('sorts route stations and returns usable map coordinates', () => {
    const stations = [
      { nodeid: 'N2', nodeord: '2', gpslati: '35.2', gpslong: '128.2' },
      { nodeid: 'N1', nodeord: '1', gpslati: '35.1', gpslong: '128.1' },
      { nodeid: 'N0', nodeord: '0', gpslati: '0', gpslong: '128.0' }
    ];

    assert.deepEqual(getRoutePath(stations), [
      { lat: 35.1, lng: 128.1 },
      { lat: 35.2, lng: 128.2 }
    ]);
  });
});

describe('getRouteStationPosition', () => {
  it('returns null when a route station has invalid coordinates', () => {
    assert.equal(getRouteStationPosition({ gpslati: '0', gpslong: '128.1' }), null);
  });
});
```

When appending, merge the new imports into the existing import list instead of creating a second import from `./busData.js`.

- [ ] **Step 2: Run test and verify the new helper names fail**

Run:

```bash
node --test src/api/busData.test.js
```

Expected: FAIL because `getRouteStationPosition` and `getRoutePath` are not exported.

- [ ] **Step 3: Implement frontend route helpers**

Append to `src/api/busData.js`:

```js
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
```

- [ ] **Step 4: Run frontend helper tests**

Run:

```bash
node --test src/api/busData.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit frontend route helper work**

Run:

```bash
git add src/api/busData.js src/api/busData.test.js
git commit -m "feat(map): add route path helpers"
```

Expected: commit succeeds with route helper changes.

## Task 5: Map Route Layers and Insight Overlay

**Files:**
- Modify: `src/components/KakaoStationMap.jsx`

- [ ] **Step 1: Add route props and refs**

Modify the component signature and refs in `src/components/KakaoStationMap.jsx`:

```jsx
function KakaoStationMap({
  station,
  stations = [],
  routeStations = [],
  routeInsight = null,
  busLocations = [],
  activeRouteNo,
  onSelectStation
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const routeMarkerRefs = useRef([]);
  const routePolylineRef = useRef(null);
  const busMarkerRefs = useRef(new Map());
  const busAnimationRefs = useRef(new Map());
  const infoWindowRef = useRef(null);
  const routeInsightWindowRef = useRef(null);
  const busInfoWindowRef = useRef(null);
```

Also update the import:

```js
import {
  getBusLocationKey,
  getBusLocationPosition,
  getRoutePath,
  getRouteStationPosition
} from '../api/busData';
```

- [ ] **Step 2: Add route line and route marker helpers**

Add these helper constants and functions near the existing marker helpers:

```js
const ROUTE_LINE_COLOR = '#d6336c';
const ROUTE_STATION_COLOR = '#495057';

const createRouteStationMarkerSvgUrl = () => {
  const svg = `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="7" fill="${ROUTE_STATION_COLOR}" stroke="white" stroke-width="3"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getRouteInsightContent = (routeInsight) => `
  <div style="padding:8px 11px;font-size:12px;line-height:1.5;white-space:nowrap;">
    <strong style="display:block;color:#18212f;">정류소 타임라인</strong>
    <span>${escapeHtml(routeInsight.message)}</span>
  </div>
`;
```

- [ ] **Step 3: Draw route polyline and route station markers**

Add a new `useEffect` after the map creation effect:

```jsx
useEffect(() => {
  if (!kakaoMaps || !mapRef.current) return undefined;

  if (routePolylineRef.current) {
    routePolylineRef.current.setMap(null);
    routePolylineRef.current = null;
  }

  routeMarkerRefs.current.forEach((marker) => marker.setMap(null));
  routeMarkerRefs.current = [];

  const routePath = getRoutePath(routeStations);
  if (routePath.length >= 2) {
    const polylinePath = routePath.map((position) => new kakaoMaps.maps.LatLng(position.lat, position.lng));
    routePolylineRef.current = new kakaoMaps.maps.Polyline({
      path: polylinePath,
      strokeWeight: 5,
      strokeColor: ROUTE_LINE_COLOR,
      strokeOpacity: 0.85,
      strokeStyle: 'solid'
    });
    routePolylineRef.current.setMap(mapRef.current);

    const bounds = new kakaoMaps.maps.LatLngBounds();
    polylinePath.forEach((latLng) => bounds.extend(latLng));
    if (!station) mapRef.current.setBounds(bounds);
  }

  const markerSize = new kakaoMaps.maps.Size(18, 18);
  const markerOption = { offset: new kakaoMaps.maps.Point(9, 9) };
  const markerImage = new kakaoMaps.maps.MarkerImage(createRouteStationMarkerSvgUrl(), markerSize, markerOption);

  routeStations.forEach((routeStation) => {
    const position = getRouteStationPosition(routeStation);
    if (!position) return;

    const marker = new kakaoMaps.maps.Marker({
      position: new kakaoMaps.maps.LatLng(position.lat, position.lng),
      title: routeStation.nodenm,
      image: markerImage
    });
    marker.setMap(mapRef.current);
    marker.setZIndex(2);
    routeMarkerRefs.current.push(marker);

    kakaoMaps.maps.event.addListener(marker, 'click', () => {
      if (onSelectStation) onSelectStation(routeStation);
    });
  });

  return undefined;
}, [kakaoMaps, onSelectStation, routeStations, station]);
```

- [ ] **Step 4: Show route insight near the selected station**

Add another `useEffect`:

```jsx
useEffect(() => {
  if (!kakaoMaps || !mapRef.current) return undefined;

  if (routeInsightWindowRef.current) {
    routeInsightWindowRef.current.close();
    routeInsightWindowRef.current = null;
  }

  if (!routeInsight || !station) return undefined;

  const position = getRouteStationPosition(station);
  if (!position) return undefined;

  const marker = new kakaoMaps.maps.Marker({
    position: new kakaoMaps.maps.LatLng(position.lat, position.lng),
    opacity: 0
  });
  marker.setMap(mapRef.current);

  const infoWindow = new kakaoMaps.maps.InfoWindow({
    content: getRouteInsightContent(routeInsight)
  });
  infoWindow.open(mapRef.current, marker);
  routeInsightWindowRef.current = infoWindow;

  return () => {
    marker.setMap(null);
    infoWindow.close();
  };
}, [kakaoMaps, routeInsight, station]);
```

- [ ] **Step 5: Clean up route layers on unmount**

Extend the existing cleanup effect:

```jsx
useEffect(() => () => {
  markerRefs.current.forEach((marker) => marker.setMap(null));
  routeMarkerRefs.current.forEach((marker) => marker.setMap(null));
  if (routePolylineRef.current) routePolylineRef.current.setMap(null);
  busMarkerRefs.current.forEach(({ marker }) => marker.setMap(null));
  busAnimationRefs.current.forEach((frameId) => {
    if (typeof window !== 'undefined') window.cancelAnimationFrame(frameId);
  });

  if (infoWindowRef.current) infoWindowRef.current.close();
  if (routeInsightWindowRef.current) routeInsightWindowRef.current.close();
  if (busInfoWindowRef.current) busInfoWindowRef.current.close();
}, []);
```

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 7: Commit map layer work**

Run:

```bash
git add src/components/KakaoStationMap.jsx
git commit -m "feat(map): render route layers and insight"
```

Expected: commit succeeds with the map component change.

## Task 6: Integrated Station and Route Search Screen

**Files:**
- Modify: `src/screens/BusArrivalScreen.jsx`

- [ ] **Step 1: Import new API functions**

Modify the import:

```js
import {
  getLiveBusArrival,
  getRouteBusLocations,
  getRouteInsight,
  getRouteStations,
  searchBusRoutes,
  searchBusStops
} from '../api/busApi';
```

- [ ] **Step 2: Add route search state**

Add state near the existing state declarations:

```js
const [searchMode, setSearchMode] = useState('all');
const [routeResults, setRouteResults] = useState([]);
const [activeRoute, setActiveRoute] = useState(null);
const [routeStations, setRouteStations] = useState([]);
const [routeInsight, setRouteInsight] = useState(null);
const [routeLoading, setRouteLoading] = useState(false);
const [routeError, setRouteError] = useState(null);
```

- [ ] **Step 3: Add route loading callbacks**

Add these callbacks after `loadBusLocationData`:

```js
const loadRouteStations = useCallback(async (routeId) => {
  if (!routeId) return;

  setRouteLoading(true);
  setRouteError(null);

  try {
    const stations = await getRouteStations(routeId);
    setRouteStations(stations);
  } catch (err) {
    console.error('노선 정류소 로드 실패:', err);
    setRouteStations([]);
    setRouteError('노선 경유 정류소를 불러오지 못했습니다.');
  } finally {
    setRouteLoading(false);
  }
}, []);

const loadRouteInsight = useCallback(async (routeId = selectedRouteId, nodeId = selectedStation?.nodeid) => {
  if (!routeId || !nodeId) {
    setRouteInsight(null);
    return;
  }

  try {
    const insight = await getRouteInsight(routeId, nodeId);
    setRouteInsight(insight);
  } catch (err) {
    console.error('정류소 타임라인 로드 실패:', err);
    setRouteInsight(null);
  }
}, [selectedRouteId, selectedStation]);
```

- [ ] **Step 4: Search both stations and routes**

Replace `performSearch` with:

```js
const performSearch = useCallback(async (queryValue) => {
  const query = queryValue.trim();
  setSearchMessage(null);
  setError(null);
  setRouteError(null);

  if (query.length < 2) {
    setStationResults([]);
    setRouteResults([]);
    setSearchMessage('정류소명 또는 버스번호를 두 글자 이상 입력해주세요.');
    return;
  }

  setSearching(true);
  try {
    const shouldSearchStations = searchMode === 'all' || searchMode === 'station';
    const shouldSearchRoutes = searchMode === 'all' || searchMode === 'route';
    const [stops, routes] = await Promise.all([
      shouldSearchStations ? searchBusStops(query) : Promise.resolve([]),
      shouldSearchRoutes ? searchBusRoutes(query) : Promise.resolve([])
    ]);

    setStationResults(stops);
    setRouteResults(routes);
    setSearchMessage(stops.length === 0 && routes.length === 0 ? '검색 결과가 없습니다.' : null);
  } catch (err) {
    console.error('통합 검색 실패:', err);
    setStationResults([]);
    setRouteResults([]);
    setSearchMessage('검색 정보를 불러오지 못했습니다. API 서버와 활용신청 상태를 확인해주세요.');
  } finally {
    setSearching(false);
  }
}, [searchMode]);
```

- [ ] **Step 5: Reset both result lists on short input**

Modify `handleQueryChange`:

```js
const handleQueryChange = (event) => {
  const nextQuery = event.target.value;
  setStationQuery(nextQuery);

  if (nextQuery.trim().length < 2) {
    setStationResults([]);
    setRouteResults([]);
    if (nextQuery.trim().length === 0) setSearchMessage(null);
  }
};
```

- [ ] **Step 6: Select a route from search results**

Add:

```js
const handleSelectRouteResult = useCallback((route) => {
  if (!route.routeid) return;

  setActiveRoute(route);
  setSelectedRouteId(route.routeid);
  setBusLocations([]);
  setBusLocationUpdatedAt(null);
  setBusLocationError(null);
  setRouteInsight(null);
  loadRouteStations(route.routeid);
  loadBusLocationData(route.routeid);
  if (selectedStation?.nodeid) loadRouteInsight(route.routeid, selectedStation.nodeid);
}, [loadBusLocationData, loadRouteInsight, loadRouteStations, selectedStation]);
```

- [ ] **Step 7: Keep arrival-card route selection aligned with active route**

Modify `handleSelectRoute`:

```js
const handleSelectRoute = useCallback((bus) => {
  if (!bus.routeid) return;

  const nextRoute = {
    routeid: bus.routeid,
    routeno: bus.routeno ?? '',
    routetp: bus.routetp ?? '',
    startnodenm: '',
    endnodenm: ''
  };
  setActiveRoute(nextRoute);

  if (bus.routeid === selectedRouteId) {
    loadBusLocationData(bus.routeid);
    loadRouteInsight(bus.routeid, selectedStation?.nodeid);
    return;
  }

  setSelectedRouteId(bus.routeid);
  setBusLocations([]);
  setBusLocationUpdatedAt(null);
  setBusLocationError(null);
  setRouteInsight(null);
  loadRouteStations(bus.routeid);
}, [loadBusLocationData, loadRouteInsight, loadRouteStations, selectedRouteId, selectedStation]);
```

- [ ] **Step 8: Update station selection to preserve route context**

Modify the end of `handleSelectStation`:

```js
loadArrivalData(station.nodeid);
if (selectedRouteId) loadRouteInsight(selectedRouteId, station.nodeid);
```

Do not clear `selectedRouteId`, `activeRoute`, `routeStations`, or `busLocations` when selecting a station. Clear only arrival-related state and selected-station state.

- [ ] **Step 9: Poll route locations even without a selected station**

Modify the bus-location polling effect condition:

```js
useEffect(() => {
  if (!selectedRouteId) return undefined;

  const timeoutId = window.setTimeout(() => {
    loadBusLocationData(selectedRouteId);
    loadRouteInsight(selectedRouteId, selectedStation?.nodeid);
  }, 0);

  const intervalId = window.setInterval(() => {
    loadBusLocationData(selectedRouteId);
    loadRouteInsight(selectedRouteId, selectedStation?.nodeid);
  }, BUS_LOCATION_REFRESH_INTERVAL_MS);

  return () => {
    window.clearTimeout(timeoutId);
    window.clearInterval(intervalId);
  };
}, [loadBusLocationData, loadRouteInsight, selectedRouteId, selectedStation]);
```

- [ ] **Step 10: Render search mode controls and route results**

Add this block inside `.search-panel`, above the form:

```jsx
<div className="search-tabs" role="tablist" aria-label="검색 유형">
  {[
    ['all', '전체'],
    ['station', '정류장'],
    ['route', '버스']
  ].map(([mode, label]) => (
    <button
      key={mode}
      type="button"
      className={searchMode === mode ? 'search-tabs__button search-tabs__button--active' : 'search-tabs__button'}
      onClick={() => setSearchMode(mode)}
    >
      {label}
    </button>
  ))}
</div>
```

Change the input placeholder:

```jsx
placeholder="정류소명 또는 버스번호 입력"
```

Add route results after station results:

```jsx
{routeResults.length > 0 && (
  <section className="route-results" aria-label="버스 검색 결과">
    {routeResults.map((route) => (
      <button
        key={route.routeid}
        type="button"
        onClick={() => handleSelectRouteResult(route)}
        className={activeRoute?.routeid === route.routeid ? 'route-result route-result--active' : 'route-result'}
      >
        <span>
          <strong>{route.routeno}번</strong>
          <small>
            {route.routetp || '노선'}
            {route.startnodenm || route.endnodenm ? ` · ${route.startnodenm} → ${route.endnodenm}` : ''}
          </small>
        </span>
        <span className="route-result__arrow">노선 보기</span>
      </button>
    ))}
  </section>
)}
```

- [ ] **Step 11: Pass route props to the map**

Modify the `KakaoStationMap` call:

```jsx
<KakaoStationMap
  station={selectedStation}
  stations={stationResults}
  routeStations={routeStations}
  routeInsight={routeInsight}
  busLocations={busLocations}
  activeRouteNo={activeRoute?.routeno ?? selectedRoute?.routeno}
  onSelectStation={handleSelectStation}
/>
```

- [ ] **Step 12: Render active route status**

Add below the map:

```jsx
{activeRoute && (
  <section className="route-status" aria-live="polite">
    <div>
      <strong>{activeRoute.routeno}번 노선</strong>
      <span>{routeStations.length}개 정류소 · {busLocations.length}대 운행 표시</span>
    </div>
    {routeLoading && <em>노선 불러오는 중</em>}
  </section>
)}

{routeInsight && (
  <p className="status-message status-message--info">{routeInsight.message}</p>
)}

{routeError && (
  <p className="status-message status-message--warn">{routeError}</p>
)}
```

- [ ] **Step 13: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 14: Commit screen work**

Run:

```bash
git add src/screens/BusArrivalScreen.jsx
git commit -m "feat(bus): add integrated route search"
```

Expected: commit succeeds with the screen change.

## Task 7: UI Styling

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add styles for search tabs, route results, route status, and info state**

Append to `src/index.css` before the media query:

```css
.search-tabs {
  display: inline-flex;
  gap: 4px;
  margin-bottom: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 3px;
  background: #f4f7fa;
}

.search-tabs__button {
  min-height: 34px;
  border-radius: 6px;
  padding: 0 12px;
  background: transparent;
  color: var(--muted);
  font-weight: 900;
  cursor: pointer;
}

.search-tabs__button--active {
  background: var(--surface);
  color: var(--primary-dark);
  box-shadow: 0 2px 8px rgba(24, 33, 47, 0.08);
}

.route-results {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 12px;
  padding-bottom: 4px;
}

.route-result {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 0 0 280px;
  min-height: 72px;
  border: 1px solid rgba(214, 51, 108, 0.22);
  border-radius: 8px;
  padding: 12px;
  background: #fff;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.route-result strong,
.route-result small {
  display: block;
}

.route-result strong {
  color: #c2255c;
  font-size: 20px;
}

.route-result small {
  color: var(--muted);
  font-size: 13px;
}

.route-result--active {
  border-color: #d6336c;
  background: #fff0f6;
}

.route-result__arrow {
  color: #c2255c;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.route-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  margin: 0 0 12px;
  border: 1px solid rgba(214, 51, 108, 0.2);
  border-radius: 8px;
  padding: 9px 12px;
  background: #fff0f6;
}

.route-status strong,
.route-status span {
  display: block;
}

.route-status strong {
  color: #c2255c;
}

.route-status span,
.route-status em {
  color: var(--muted);
  font-size: 13px;
  font-style: normal;
  font-weight: 800;
}

.status-message--info {
  background: #e7f5ff;
  color: #1864ab;
}
```

Inside the existing mobile media query, add:

```css
.search-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.route-result {
  flex-basis: 236px;
}

.route-status {
  align-items: flex-start;
  flex-direction: column;
}
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit UI styling**

Run:

```bash
git add src/index.css
git commit -m "style(bus): polish route search UI"
```

Expected: commit succeeds with only CSS changes.

## Task 8: Documentation Updates

**Files:**
- Modify: `README.md`
- Modify: `docs/04-integrations/environment-variables.md`
- Modify: `docs/01-getting-started/development-environment.md`
- Modify: `docs/01-getting-started/run-and-operations.md`
- Modify: `docs/05-features/station-search-and-selection.md`
- Create: `docs/05-features/route-search-and-live-map.md`

- [ ] **Step 1: Update docs with backend and route feature notes**

Add a focused route feature page at `docs/05-features/route-search-and-live-map.md`:

```md
# 노선 검색 및 실시간 노선 지도

노선 검색은 버스번호를 기준으로 국토교통부 TAGO 버스노선정보를 조회하고, 선택된 노선의 경유 정류소와 운행 차량 위치를 지도에 함께 표시한다.

## 동작 흐름

1. 사용자가 통합 검색창에 버스번호를 입력한다.
2. 프론트엔드는 `/api/routes?query={query}`를 호출한다.
3. 백엔드는 도시 노선 목록을 조회하거나 캐시에서 가져와 노선번호로 필터링한다.
4. 사용자가 노선을 선택하면 `/api/routes/{routeId}/stations`와 `/api/routes/{routeId}/locations`를 호출한다.
5. 지도는 경유 정류소 좌표를 선으로 연결하고, 실시간 버스 위치를 마커로 표시한다.
6. 정류소가 선택되면 `/api/routes/{routeId}/insight?nodeId={nodeId}`로 가장 가까운 접근 버스 문구를 표시한다.

## 제한

노선 선은 경유 정류소 좌표를 순서대로 연결한 근사 경로이다. 도로 형상에 완전히 맞는 경로가 필요한 경우 별도 노선 형상 API가 필요하다.
```

Update existing docs to mention:

- `DATA_GO_KR_SERVICE_KEY` is server-only.
- `VITE_KAKAO_MAP_JS_KEY` is browser-side.
- Start backend with `npm run dev:server`.
- Start frontend with `npm run dev`.
- The frontend calls local `/api` endpoints.

- [ ] **Step 2: Verify docs links**

Run:

```bash
node <<'NODE'
const fs = require('fs');
const path = require('path');
const docsRoot = path.resolve('docs');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
}
walk(docsRoot);
const broken = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1].split('#')[0];
    if (!href || /^(https?:|mailto:)/.test(href)) continue;
    const target = path.resolve(path.dirname(file), href);
    if (!fs.existsSync(target) && !fs.existsSync(`${target}.md`)) {
      broken.push(`${path.relative('.', file)} -> ${match[1]}`);
    }
  }
}
console.log(JSON.stringify({ checked: files.length, broken }, null, 2));
process.exit(broken.length ? 1 : 0);
NODE
```

Expected: JSON output has `"broken":[]`.

- [ ] **Step 3: Commit documentation updates**

Run:

```bash
git add README.md docs/04-integrations/environment-variables.md docs/01-getting-started/development-environment.md docs/01-getting-started/run-and-operations.md docs/05-features/station-search-and-selection.md docs/05-features/route-search-and-live-map.md
git commit -m "docs(bus): document route-backed map flow"
```

Expected: commit succeeds with only route feature documentation.

## Task 9: End-to-End Verification

**Files:**
- Inspect: `dist/`
- Inspect: working tree status

- [ ] **Step 1: Run automated verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands pass.

- [ ] **Step 2: Verify frontend build does not include the public-data key name**

Run:

```bash
rg "DATA_GO_KR_SERVICE_KEY|VITE_DATA_GO_KR_SERVICE_KEY|apis\\.data\\.go\\.kr|serviceKey" dist
```

Expected: no matches in `dist`.

- [ ] **Step 3: Run local servers for manual check**

Terminal 1:

```bash
npm run dev:server
```

Expected: backend listens on `http://localhost:5174`.

Terminal 2:

```bash
npm run dev
```

Expected: Vite serves the app on `http://localhost:5173`.

- [ ] **Step 4: Manually verify user flows**

Open `http://localhost:5173` and verify:

- Searching a station still returns station cards.
- Selecting a station loads arrival cards.
- Searching a bus number returns route cards.
- Selecting a route draws a route line before selecting a station.
- The selected route shows live bus markers even when the selected station has no imminent arrival.
- Selecting a station on the active route shows the nearest-bus insight message.
- Bus markers continue to update while the app stays open.

- [ ] **Step 5: Inspect remaining uncommitted changes**

Run:

```bash
git status --short
```

Expected: only intentionally unrelated pre-existing files remain, such as the existing `LICENSE` deletion and template asset leftovers if they were not part of this implementation.

## Self-Review

- Spec coverage: backend API, route search, route stations, route line, live route bus markers, station insight overlay, environment handling, tests, docs, and verification are covered by Tasks 1 through 9.
- Placeholder scan: the plan avoids open-ended implementation markers and uses concrete file paths, commands, and code snippets.
- Type consistency: route objects use `routeid` and `routeno`; stations use `nodeid`, `nodenm`, `nodeord`, `gpslati`, and `gpslong`; insights use `message`, `vehicleNo`, `stationCount`, and `source`.
