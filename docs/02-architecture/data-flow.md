# 데이터 흐름

## 통합 검색 흐름

1. 사용자가 `BusArrivalScreen`의 검색 입력에 정류소명 또는 버스번호를 입력합니다.
2. 입력값이 검색 모드별 최소 길이를 만족하면 `SEARCH_DEBOUNCE_MS` 후 `performSearch`가 실행됩니다.
3. 정류소 검색은 `searchBusStops`가 `/api/stations`를 호출합니다.
4. 노선 검색은 `searchBusRoutes`가 `/api/routes`를 호출합니다.
5. `server/index.js`는 TAGO 서비스를 호출하고 결과를 정규화해 반환합니다.
6. 결과는 정류소 카드와 노선 카드로 렌더링됩니다.

## 도착 정보 흐름

1. 사용자가 정류소를 선택합니다.
2. `handleSelectStation`이 선택 정류소 상태, 최근 정류소, 도착 정보 상태를 갱신합니다.
3. `getLiveBusArrival`이 `/api/arrivals`를 호출합니다.
4. 백엔드가 정류소 ID로 TAGO 버스 도착 정보를 요청합니다.
5. 응답은 `arrivalData`에 저장됩니다.

## 노선 지도 흐름

1. 사용자가 노선 검색 결과 또는 도착 카드에서 노선을 선택합니다.
2. `selectedRouteId`와 `activeRoute`가 갱신됩니다.
3. `getRouteStations`가 `/api/routes/:routeId/stations`를 호출합니다.
4. `getRouteBusLocations`가 `/api/routes/:routeId/locations`를 호출합니다.
5. `KakaoStationMap`은 경유 정류소 좌표를 선으로 연결하고, 운행 중인 버스를 마커로 표시합니다.
6. 버스 위치는 10초마다 polling되고, 기존 마커는 `requestAnimationFrame`으로 위치를 보간합니다.

## 정류소 타임라인 흐름

1. 활성 노선과 선택 정류소가 모두 있으면 `getRouteInsight`가 `/api/routes/:routeId/insight`를 호출합니다.
2. 백엔드의 `calculateRouteInsight`가 노선 경유 정류소, 실시간 버스 위치, 도착 정보를 조합합니다.
3. 계산 가능한 경우 `가장 가까운 버스는 3정류장 전 · 7분 뒤 도착 예정` 같은 메시지를 반환합니다.
4. 화면 상태 메시지와 지도 말풍선에 같은 인사이트가 표시됩니다.

## 저장소 흐름

즐겨찾기와 최근 정류소는 `src/api/stationStorage.js`를 통해 `localStorage`에 저장됩니다.

## 관련 문서

- [정류소 검색과 선택](../05-features/station-search-and-selection.md)
- [노선 검색 및 실시간 노선 지도](../05-features/route-search-and-live-map.md)
- [도착 정보 조회](../05-features/arrival-information.md)
- [실시간 버스 위치](../05-features/live-bus-location.md)
