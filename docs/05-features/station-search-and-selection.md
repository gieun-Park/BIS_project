# 정류소 검색과 선택

## 검색 조건

`BusArrivalScreen`은 통합 검색창에서 정류소명과 버스번호를 함께 검색합니다. `전체`와 `정류장` 모드에서는 입력값이 두 글자 미만이면 검색하지 않고 안내 메시지를 보여줍니다. `버스` 모드는 한 글자 이상이면 노선 검색을 실행합니다.

## 검색 흐름

1. 사용자가 정류소명 또는 버스번호를 입력합니다.
2. `SEARCH_DEBOUNCE_MS`인 450ms 후 `performSearch`가 실행됩니다.
3. 정류소 검색은 `searchBusStops`를 통해 `/api/stations`를 호출합니다.
4. 노선 검색은 `searchBusRoutes`를 통해 `/api/routes`를 호출합니다.
5. 정류소 결과와 노선 결과가 각각 화면에 표시됩니다.

근거 코드:

- `src/screens/BusArrivalScreen.jsx`
- `src/api/busApi.js`
- `server/index.js`

## 지도 선택

검색 결과와 선택 정류소는 `KakaoStationMap`에 전달됩니다. 지도 마커를 클릭하면 `onSelectStation`이 호출되어 선택 정류소가 바뀝니다.

활성 노선이 있을 때 경유 정류소 마커를 클릭하면 노선 컨텍스트를 유지한 채 해당 정류소의 도착 정보와 정류소 타임라인을 갱신합니다.

## 관련 문서

- [노선 검색 및 실시간 노선 지도](route-search-and-live-map.md)
- [지도 컴포넌트](../03-frontend/map-component.md)
- [데이터 흐름](../02-architecture/data-flow.md)
