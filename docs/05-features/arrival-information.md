# 도착 정보 조회

## 조회 조건

도착 정보는 선택 정류소의 `nodeid`가 있을 때 조회합니다.

## 조회 흐름

1. 정류소가 선택됩니다.
2. `loadArrivalData`가 `getLiveBusArrival`을 호출합니다.
3. 응답은 `normalizeItems`를 거쳐 배열로 정리됩니다.
4. `arrivalData`에 저장되어 도착 카드 목록으로 표시됩니다.
5. 도착 목록 중 유효한 첫 노선이 `selectedRouteId`로 선택됩니다.

## 자동 갱신

사용자가 자동 갱신을 켜면 30초마다 선택 정류소의 도착 정보를 다시 불러옵니다.

## UI 표시

도착 시간은 `formatArrivalTime`이 분/초 문자열로 표시합니다. `getArrivalTone`은 도착 시간에 따라 배지 색상을 구분합니다.

근거 코드:

- `src/screens/BusArrivalScreen.jsx`
- `src/api/busApi.js`
- `src/api/busData.js`

## 관련 문서

- [실시간 버스 위치](live-bus-location.md)
- [화면 구성](../03-frontend/main-screen.md)
