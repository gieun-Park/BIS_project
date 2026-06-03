# 외부 연동

## 공공데이터포털 TAGO 서비스

공공데이터포털 TAGO 서비스 호출은 `server/`의 로컬 API 서버가 담당합니다. 프론트엔드의 `src/api/busApi.js`는 공공데이터포털을 직접 호출하지 않고 `/api` 경로만 호출합니다.

사용 중인 서비스:

- 버스 정류소 정보: 정류소명으로 정류소 후보를 검색합니다.
- 버스 도착 정보: 정류소 ID로 도착 예정 버스를 조회합니다.
- 버스 위치 정보: 노선 ID로 운행 중인 버스 위치를 조회합니다.
- 버스 노선 정보: 버스번호 검색과 노선별 경유 정류소 조회에 사용합니다.

공통 설정:

- `DATA_GO_KR_SERVICE_KEY`
- `CITY_CODE=38010`
- JSON 응답

## 로컬 API 서버

주요 파일:

- `server/index.js`
- `server/tagoClient.js`
- `server/normalizers.js`
- `server/routeInsight.js`

프론트엔드에서 사용하는 주요 경로:

- `/api/stations`
- `/api/arrivals`
- `/api/routes`
- `/api/routes/:routeId/stations`
- `/api/routes/:routeId/locations`
- `/api/routes/:routeId/insight`

## 카카오 지도

`src/api/kakaoMap.js`는 Kakao Maps JavaScript SDK URL을 만들고, 스크립트를 동적으로 삽입합니다. SDK는 `autoload=false`로 로드한 뒤 `window.kakao.maps.load` callback에서 준비됩니다.

## 관련 문서

- [환경 변수](environment-variables.md)
- [지도 컴포넌트](../03-frontend/map-component.md)
