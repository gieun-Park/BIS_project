# BIS Project

창원시 버스 정류소 검색, 버스번호 기반 노선 검색, 실시간 도착 정보, 노선도, 운행 중인 버스 위치를 한 화면에서 확인하는 React 기반 BIS(Bus Information System) 웹 앱입니다.

## 1. Overview

이 프로젝트는 Node 로컬 API 서버가 공공데이터포털 TAGO 버스 API를 호출하고, Vite React 프론트엔드가 `/api` 경로로 백엔드를 호출하는 구조입니다. 카카오 지도 JavaScript SDK를 사용해 정류소, 노선 경로, 실시간 버스 마커를 지도 위에 표시합니다.

현재 기본 대상 지역은 창원시이며, `CITY_CODE` 기본값은 `38010`입니다.

## 2. 주요 기능

- 정류소명 직접 입력 검색
- 버스번호 기반 노선 검색
- 검색 결과 정류소의 지도 마커 표시
- 선택된 정류소 마커 색상 구분
- 지도 마커 클릭으로 정류소 변경
- 선택 정류소의 실시간 도착 정보 조회
- 도착 정보 자동 갱신
- 즐겨찾기 및 최근 선택 정류소 저장
- 노선 선택 시 전체 경유 정류소 기반 노선도 표시
- 노선 기준 실시간 버스 위치 전체 표시
- 버스 위치 10초 주기 polling
- 새로고침 없이 버스 마커 위치 이동 애니메이션
- 선택 정류소 기준 가장 가까운 접근 버스 안내
- API 오류 및 빈 데이터 상태 안내
- 모바일 화면 대응 UI

## 3. 현재 상태

구현 완료:

- Vite + React 앱 기본 구성
- Node 로컬 API 서버 구성
- 공공데이터포털 TAGO 버스 도착 정보 연동
- 공공데이터포털 TAGO 버스 정류소 정보 연동
- 공공데이터포털 TAGO 버스 위치 정보 연동
- 공공데이터포털 TAGO 버스 노선 정보 연동
- 카카오 지도 SDK 동적 로딩
- 정류소/노선 통합 검색 UI
- 정류소 검색/선택/즐겨찾기/최근 기록 UI
- 정류소 마커, 노선 경로, 버스 위치 마커 표시
- 선택 정류소와 선택 노선의 시각적 강조
- 데이터 정규화 및 노선 인사이트 helper 테스트

확인된 API 서비스:

- TAGO 버스 도착 정보
- TAGO 버스 정류소 정보
- TAGO 버스 위치 정보
- TAGO 버스 노선 정보

배포 전 정리 필요:

- 공공데이터 일반인증키는 서버 환경변수로 관리합니다.
- Kakao Maps JavaScript 키는 프론트엔드 환경변수로 관리합니다.
- `LICENSE`, `src/App.css`, `src/assets/`, `public/icons.svg`는 현재 앱 기능에 직접 사용되지 않는 잔여 파일입니다.
- 배포 URL과 실제 운영 정책은 추후 추가가 필요합니다.

## 4. 기술 스택

- React 19
- Vite 8
- Node.js 로컬 HTTP API 서버
- Axios
- Kakao Maps JavaScript SDK
- 공공데이터포털 TAGO 버스 API
- ESLint
- Node.js 내장 test runner

## 5. API 연동

### 백엔드 API

프론트엔드는 공공데이터포털을 직접 호출하지 않고 로컬 백엔드의 `/api` 경로를 호출합니다.

주요 로컬 API:

- `/api/stations`
- `/api/arrivals`
- `/api/routes`
- `/api/routes/:routeId/stations`
- `/api/routes/:routeId/locations`
- `/api/routes/:routeId/insight`

### 공공데이터포털

백엔드에서 사용하는 서비스:

- TAGO 버스 도착 정보
- TAGO 버스 정류소 정보
- TAGO 버스 위치 정보
- TAGO 버스 노선 정보

### 카카오 지도

카카오 지도는 `src/api/kakaoMap.js`에서 JavaScript SDK를 동적으로 로드합니다.

Kakao Maps JavaScript 키는 `VITE_KAKAO_MAP_JS_KEY` 환경 변수로 주입합니다.

## 6. 환경 변수

로컬 개발용 파일:

```txt
.env.local
```

필요한 변수:

```env
DATA_GO_KR_SERVICE_KEY=
VITE_KAKAO_MAP_JS_KEY=
CITY_CODE=38010
PORT=5174
```

`.env.local`은 Git에 올리지 않고, 공유용 변수 목록은 `.env.example`에만 기록합니다.

주의: `DATA_GO_KR_SERVICE_KEY`는 서버에서만 사용합니다. `VITE_KAKAO_MAP_JS_KEY`는 Kakao Maps SDK 로드를 위해 브라우저 번들에 포함됩니다.

## 7. 폴더 구조

```txt
BIS_project/
├── .env.example
├── docs/
├── public/
│   └── favicon.svg
├── server/
│   ├── config.js
│   ├── index.js
│   ├── normalizers.js
│   ├── normalizers.test.js
│   ├── routeInsight.js
│   ├── routeInsight.test.js
│   └── tagoClient.js
├── src/
│   ├── api/
│   │   ├── busApi.js
│   │   ├── busData.js
│   │   ├── busData.test.js
│   │   ├── kakaoMap.js
│   │   ├── kakaoMap.test.js
│   │   ├── searchData.js
│   │   ├── searchData.test.js
│   │   ├── stationStorage.js
│   │   └── stationStorage.test.js
│   ├── components/
│   │   └── KakaoStationMap.jsx
│   ├── screens/
│   │   └── BusArrivalScreen.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js
```

## 8. 실행 방법

의존성 설치:

```bash
npm install
```

백엔드 API 서버 실행:

```bash
npm run dev:server
```

프론트엔드 개발 서버 실행:

```bash
npm run dev
```

빌드:

```bash
npm run build
```

빌드 결과 미리보기:

```bash
npm run preview
```

## 9. 테스트 및 검증

단위 테스트:

```bash
npm test
```

린트:

```bash
npm run lint
```

프로덕션 빌드:

```bash
npm run build
```

## 10. 주요 파일 설명

- `server/index.js`: 프론트엔드가 호출하는 로컬 JSON API 서버
- `server/tagoClient.js`: 공공데이터포털 TAGO API 요청 helper
- `server/normalizers.js`: 백엔드 응답 정규화 helper
- `server/routeInsight.js`: 선택 정류소 기준 접근 버스 계산 helper
- `src/api/busApi.js`: 로컬 `/api` 호출 함수
- `src/api/busData.js`: 지도 표시용 좌표와 키 정규화 helper
- `src/api/kakaoMap.js`: 카카오 지도 SDK URL 생성, 지도용 정류소 데이터 정리
- `src/api/searchData.js`: 정류소/노선 통합 검색 결과 병합 helper
- `src/api/stationStorage.js`: 즐겨찾기 및 최근 정류소 localStorage 저장
- `src/components/KakaoStationMap.jsx`: 정류소/노선/버스 마커를 표시하는 지도 컴포넌트
- `src/screens/BusArrivalScreen.jsx`: 통합 검색, 지도, 도착 정보, 노선 선택 상태를 관리하는 메인 화면
- `src/index.css`: 앱 전체 UI 스타일

## 11. 배포 전 체크리스트

- 기존 커밋 기록에 포함된 API 키 재발급 검토
- 배포 환경에 `DATA_GO_KR_SERVICE_KEY` 등록
- 배포 환경에 `VITE_KAKAO_MAP_JS_KEY` 등록
- 백엔드 API 서버 배포 방식 확정
- 프론트엔드 `/api` 요청이 배포 백엔드로 연결되는지 확인
- 카카오 개발자 콘솔에서 배포 도메인 등록
- 공공데이터포털 서비스별 활용 신청 상태 확인
- 앱 이름, favicon, README 배포 URL 정리
- 사용하지 않는 템플릿 자산 정리
