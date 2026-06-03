# 즐겨찾기와 최근 정류소

## 저장 위치

즐겨찾기와 최근 정류소는 브라우저 `localStorage`에 저장됩니다.

근거 코드:

- `src/api/stationStorage.js`
- `src/screens/BusArrivalScreen.jsx`

## 저장 키

- 즐겨찾기: `bis.favoriteStations`
- 최근 정류소: `bis.recentStations`

## 최근 정류소

`addRecentStation`은 새로 선택한 정류소를 맨 앞에 놓고 중복을 제거합니다. 최근 정류소는 최대 5개까지 유지합니다.

## 즐겨찾기

`toggleFavoriteStation`은 같은 `nodeid`가 있으면 제거하고, 없으면 앞에 추가합니다. `isFavoriteStation`은 현재 선택 정류소가 즐겨찾기인지 판단합니다.

## 관련 문서

- [화면 구성](../03-frontend/main-screen.md)
- [테스트와 검증](../06-testing/testing-and-verification.md)
