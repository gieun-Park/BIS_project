# 화면 구성

`src/screens/BusArrivalScreen.jsx`는 앱의 메인 화면이자 대부분의 상태를 관리하는 컴포넌트입니다.

## 주요 상태

- `stationQuery`: 검색 입력값
- `searchMode`: 전체/정류장/버스 검색 모드
- `stationResults`: 정류소 검색 결과
- `routeResults`: 노선 검색 결과
- `selectedStation`: 현재 선택된 정류소
- `arrivalData`: 선택 정류소의 도착 정보
- `selectedRouteId`: 지도에 표시할 선택 노선
- `activeRoute`, `routeStations`, `routeInsight`: 활성 노선과 정류소 타임라인 상태
- `busLocations`: 선택 노선의 실시간 버스 위치
- `favoriteStations`, `recentStations`: localStorage 기반 정류소 목록
- `autoRefresh`: 도착 정보 자동 갱신 여부

## 주요 UI 영역

- 헤더와 자동 갱신 토글
- 통합 검색 모드와 검색 폼
- 즐겨찾기/최근 정류소 chip
- 카카오 지도
- 버스 위치 상태 바
- 검색 결과 정류소 리스트
- 선택 정류소 도착 정보 패널

## 자동 갱신

- 도착 정보는 사용자가 자동 갱신을 켜면 30초마다 갱신됩니다.
- 버스 위치는 선택 노선이 있을 때 10초마다 갱신됩니다.

## 관련 문서

- [데이터 흐름](../02-architecture/data-flow.md)
- [즐겨찾기와 최근 정류소](../05-features/favorites-and-recents.md)
