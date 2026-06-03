# 실시간 버스 위치

## 선택 기준

도착 카드나 노선 검색 결과에서 노선을 선택하면 해당 노선의 `routeid`가 `selectedRouteId`로 저장됩니다. 같은 노선을 다시 누르면 버스 위치를 즉시 다시 불러옵니다.

## 갱신 주기

선택 노선이 있으면 정류소 선택 여부와 관계없이 버스 위치는 10초마다 갱신됩니다. 정류소도 함께 선택된 경우에는 같은 주기로 정류소 타임라인 인사이트도 다시 계산합니다.

## 데이터 정규화

`normalizeBusLocations`는 위치 응답 중 유효한 `gpslati`, `gpslong`이 있는 항목만 남깁니다. `getBusLocationPosition`은 숫자 좌표로 변환하고, `getBusLocationKey`는 차량 번호를 우선해 지도 마커 key를 만듭니다.

근거 코드:

- `src/screens/BusArrivalScreen.jsx`
- `src/api/busApi.js`
- `src/api/busData.js`
- `src/components/KakaoStationMap.jsx`

## 지도 애니메이션

`KakaoStationMap`은 새 위치가 들어오면 기존 버스 마커를 제거하지 않고 위치를 보간합니다. 애니메이션 시간은 `BUS_MARKER_ANIMATION_MS`인 900ms입니다.

## 관련 문서

- [지도 컴포넌트](../03-frontend/map-component.md)
- [데이터 흐름](../02-architecture/data-flow.md)
