# 지도 컴포넌트

`src/components/KakaoStationMap.jsx`는 카카오 지도 렌더링과 정류소/노선/버스 마커 표시를 담당합니다.

## 입력 props

- `station`: 선택된 정류소
- `stations`: 검색 결과 정류소 목록
- `routeStations`: 활성 노선의 경유 정류소 목록
- `routeInsight`: 선택 정류소 기준 접근 버스 안내 메시지
- `busLocations`: 선택 노선의 실시간 버스 위치 목록
- `activeRouteNo`: 현재 지도에 표시 중인 노선 번호
- `onSelectStation`: 지도 마커 클릭 시 호출할 정류소 선택 callback

## 정류소 마커

정류소 마커 색상은 `getStationMarkerTone` 결과에 따라 나뉩니다.

- 기본 정류소: 초록 계열
- 선택 정류소: 주황 계열

지도에 표시할 정류소 목록은 `src/api/kakaoMap.js`의 `getMapStations`로 중복을 줄입니다.

## 노선 레이어

활성 노선의 경유 정류소는 `getRoutePath`로 정렬된 좌표 배열을 만든 뒤 Kakao Maps `Polyline`으로 표시합니다.

경유 정류소 마커를 클릭하면 `onSelectStation`이 호출되어 활성 노선 컨텍스트 안에서 선택 정류소가 바뀝니다.

## 버스 마커

버스 마커는 파란 원형 아이콘으로 표시합니다. `getBusLocationKey`는 차량 번호를 우선 사용해 마커 identity를 안정적으로 유지합니다.

새 위치가 들어오면 기존 마커를 새로 만들지 않고 `animateBusMarker`가 `requestAnimationFrame`으로 좌표를 보간합니다.

## 정류소 타임라인 말풍선

`routeInsight`와 `station`이 모두 있으면 선택 정류소 위치에 말풍선을 표시합니다. 이 말풍선은 화면의 인사이트 상태 메시지와 같은 내용을 사용합니다.

## 관련 문서

- [노선 검색 및 실시간 노선 지도](../05-features/route-search-and-live-map.md)
- [실시간 버스 위치](../05-features/live-bus-location.md)
- [외부 연동](../04-integrations/external-integrations.md)
