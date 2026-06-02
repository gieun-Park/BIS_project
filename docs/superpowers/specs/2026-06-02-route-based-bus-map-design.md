# Route-Based Bus Map Design

## Status

- Date: 2026-06-02
- Scope: design approved for implementation planning
- Project: BIS_PROJECT, Changwon BIS real-time bus arrival app

## Goal

The app should support both station search and bus route search. When a user searches for a bus route, the map should show the full route line first, then keep all currently operating buses visible as moving markers. When the user selects a specific station, the app should explain the nearest approaching bus in station-count and estimated-time terms when the upstream data supports it.

## Current Context

The current project is a Vite React frontend. It already has station search, arrival lookup, Kakao map rendering, selected-station highlighting, route-based bus location polling, and animated bus markers.

Relevant files:

- `src/screens/BusArrivalScreen.jsx`: search, selected station, arrivals, selected route, bus location polling
- `src/components/KakaoStationMap.jsx`: Kakao map, station markers, bus markers, marker animation
- `src/api/busApi.js`: public-data calls for stations, arrivals, and route bus locations
- `src/api/busData.js`: public-data normalization helpers
- `src/api/apiClient.js`: arrival API client with env-based service key
- `src/api/kakaoMap.js`: Kakao Maps SDK loader

There is no backend server yet. External public-data service calls are still made from the browser, so the next implementation should move public-data calls behind a small Node API server.

## Recommended Approach

Add a Node backend and let the frontend call only local `/api` endpoints. The backend owns public-data service URLs, service key handling, normalization, small in-memory caches, and upstream error translation.

This is the recommended path because the app is intended for deployment and should not keep the general public-data service key in browser-side code.

## Backend Design

Add a `server/` folder with a small Express API.

Suggested files:

- `server/index.js`: server bootstrap, route registration, health endpoint
- `server/config.js`: env parsing, city code defaults, upstream service names
- `server/tagoClient.js`: shared axios client and public-data request helper
- `server/normalizers.js`: item normalization, route/station/location normalization
- `server/routeInsight.js`: nearest-bus and station-count calculations

Backend environment variables:

- `DATA_GO_KR_SERVICE_KEY`: public-data general service key, server-only
- `CITY_CODE`: defaults to `38010`
- `PORT`: defaults to `5174`

The Kakao JavaScript key stays frontend-side because Kakao Maps SDK needs a browser key.

## Backend API

The frontend should call these local endpoints:

- `GET /api/health`
- `GET /api/stations?query={query}`
- `GET /api/arrivals?nodeId={nodeId}`
- `GET /api/routes?query={query}`
- `GET /api/routes/:routeId/stations`
- `GET /api/routes/:routeId/locations`
- `GET /api/routes/:routeId/insight?nodeId={nodeId}`

The route search endpoint should use the TAGO bus route information service to load the route list for the configured city and filter by route number on the backend. This avoids depending on uncertain route-number query support from the upstream service.

## External Services

The backend should integrate with these public-data service families:

- 국토교통부 TAGO 버스정류소정보
- 국토교통부 TAGO 버스도착정보
- 국토교통부 TAGO 버스위치정보
- 국토교통부 TAGO 버스노선정보

The frontend should integrate with:

- Kakao Maps JavaScript SDK

Public-data service URLs and keys should not appear in UI code after the backend migration.

## Frontend Search UX

Replace the station-only search with an integrated search surface:

- Input placeholder: `정류소명 또는 버스번호 입력`
- Search mode tabs or segmented control: `전체`, `정류장`, `버스`
- Station result: station name, node ID, optional station number
- Route result: route number, route type, start station, end station

Selecting a station should keep the current behavior:

- Save recent station
- Load arrivals
- Show station marker
- Allow favorites

Selecting a route should add route-first behavior:

- Set the active route
- Load route stations
- Draw the route line on the map
- Start route bus-location polling immediately
- Show bus markers even if no selected station has an imminent arrival

## Map Behavior

The map should always render in layers:

1. Route polyline
2. Route station markers
3. Selected station marker
4. Live bus markers
5. InfoWindow or custom overlay

When an active route exists, route stations with usable coordinates should be connected with a Kakao Maps polyline. The line is an approximation based on ordered route station coordinates, not a road-snapped shape.

Live bus markers should keep the existing animation behavior. Polling should remain interval-based, with marker positions interpolating between API refreshes.

## Timeline Overlay

When both an active route and selected station exist, calculate a route insight:

- Find the selected station in the active route station list by `nodeid`.
- Map each live bus location to a route-station index using `nodeid` first, then station order fields if available.
- Prefer buses whose index is before or at the selected station index.
- Pick the nearest approaching bus by smallest station-count gap.
- If arrival data for the same route has `arrprevstationcnt` and `arrtime`, use those as the display source because they are closer to official arrival semantics.
- If arrival data is unavailable but route order can be calculated, show station-count only.
- If route order is unavailable, fall back to nearest GPS bus and label it as the nearest operating vehicle.

Display copy examples:

- `가장 가까운 버스는 3정류장 전 · 7분 뒤 도착 예정`
- `가장 가까운 버스는 2정류장 전`
- `가장 가까운 운행 차량 표시 중`

The overlay should open near the selected station by default. If the matched bus marker is available, the bus marker click can also show the same insight.

## Data Flow

Route search:

1. User types a bus number.
2. Frontend calls `/api/routes?query={query}`.
3. Backend loads or reuses cached city route list.
4. Backend filters route numbers and returns normalized routes.
5. User selects a route.
6. Frontend loads route stations and route locations.
7. Map draws route line and moving bus markers.

Station selection with route insight:

1. User selects a station from search results or the map.
2. Frontend loads station arrivals.
3. If an active route exists, frontend asks for route insight or calculates from already-loaded route data.
4. Map shows a station overlay with nearest-bus status.
5. Bus location polling updates markers and refreshes the insight.

## Error Handling

Backend should return consistent JSON errors:

```json
{
  "message": "버스 노선 정보를 불러오지 못했습니다.",
  "code": "route_api_error"
}
```

Expected cases:

- Missing service key: server startup warning and API error response
- Public-data 401 or 403: explicit API-key or utilization-permission message
- Empty route result: show empty route state
- Route stations without coordinates: do not draw line, but keep route result visible
- Bus location unavailable: keep route line and station markers visible

## Testing Plan

Add or update tests for pure logic:

- Normalize route list items
- Normalize route station items
- Filter routes by route number
- Build route polyline points from ordered stations
- Calculate nearest approaching bus
- Fall back to GPS nearest bus when order fields are missing

Manual verification:

- Search a station and load arrivals
- Search a route and see route line before selecting a station
- Confirm multiple live bus markers appear for the route
- Confirm bus markers move across polling refreshes
- Select a station on the active route and see the insight overlay
- Confirm no public-data service key is exposed in built frontend assets

## Open Implementation Notes

- If Express dependencies cannot be installed in the current environment, the same endpoint shape can be implemented with Node's built-in HTTP server. Express remains the preferred implementation for readability.
- The route line is limited by public-data station coordinates. A road-accurate path would require an additional route-shape service that is not part of this scope.
- Some TAGO cities and routes may omit station order or live bus `nodeid` fields. The UI must degrade gracefully instead of hiding the route view.
