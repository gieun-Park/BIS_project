# 시스템 아키텍처

## 구성

BIS Project는 Node 로컬 API 서버와 Vite React 프론트엔드로 구성됩니다. 프론트엔드는 공공데이터포털을 직접 호출하지 않고 `/api` 경로로 로컬 서버를 호출합니다. 지도 렌더링은 브라우저에서 Kakao Maps JavaScript SDK를 사용합니다.

```txt
사용자
  -> React 화면
  -> src/api/busApi.js
  -> /api 로컬 백엔드
  -> 공공데이터포털 TAGO 서비스

사용자
  -> React 화면
  -> KakaoStationMap
  -> Kakao Maps JavaScript SDK
```

## 레이어

- 앱 부트스트랩: `src/main.jsx`, `src/App.jsx`
- 화면 상태와 사용자 흐름: `src/screens/BusArrivalScreen.jsx`
- 지도 렌더링: `src/components/KakaoStationMap.jsx`
- 프론트 API 호출: `src/api/busApi.js`
- 백엔드 API 서버: `server/index.js`
- 공공데이터포털 요청 helper: `server/tagoClient.js`
- 데이터 정규화: `src/api/busData.js`, `server/normalizers.js`, `src/api/kakaoMap.js`
- 노선 인사이트 계산: `server/routeInsight.js`
- 브라우저 저장소: `src/api/stationStorage.js`
- 스타일: `src/index.css`

## 상태 관리

전역 상태 라이브러리는 사용하지 않습니다. `BusArrivalScreen`이 `useState`, `useMemo`, `useCallback`, `useEffect`로 검색어, 검색 모드, 선택 정류소, 도착 정보, 활성 노선, 노선 정류소, 버스 위치, 즐겨찾기/최근 정류소 상태를 관리합니다.

## 관련 문서

- [데이터 흐름](data-flow.md)
- [화면 구성](../03-frontend/main-screen.md)
- [외부 연동](../04-integrations/external-integrations.md)
