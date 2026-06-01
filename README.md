# BIS Project

창원시 버스 정류소 검색, 실시간 도착 정보, 카카오 지도 기반 정류소 선택, 노선별 실시간 버스 위치를 한 화면에서 확인하는 React 기반 BIS(Bus Information System) 웹 앱입니다.

## 1. Overview

이 프로젝트는 공공데이터포털 TAGO 버스 API와 카카오 지도 JavaScript SDK를 연동해 사용자가 정류소명을 직접 검색하고, 지도에서 정류소를 선택하며, 선택한 정류소의 도착 예정 버스와 노선별 운행 중인 버스 위치를 확인할 수 있도록 구성되어 있습니다.

현재 기본 대상 지역은 창원시이며, `cityCode`는 `38010`으로 설정되어 있습니다.

## 2. 주요 기능

- 정류소명 직접 입력 검색
- 검색 결과 정류소의 지도 마커 표시
- 선택된 정류소 마커 색상 구분
- 지도 마커 클릭으로 정류소 변경
- 선택 정류소의 실시간 도착 정보 조회
- 도착 정보 자동 갱신
- 즐겨찾기 및 최근 선택 정류소 저장
- 도착 목록에서 노선 선택
- 선택 노선의 실시간 버스 위치 지도 표시
- 버스 위치 10초 주기 polling
- 새로고침 없이 버스 마커 위치 이동 애니메이션
- API 오류 및 빈 데이터 상태 안내
- 모바일 화면 대응 UI

## 3. 현재 상태

구현 완료:

- Vite + React 앱 기본 구성
- 공공데이터포털 버스 도착 정보 API 연동
- 공공데이터포털 버스 정류소 정보 API 연동
- 공공데이터포털 버스 위치 정보 API 연동
- 카카오 지도 SDK 동적 로딩
- 정류소 검색/선택/즐겨찾기/최근 기록 UI
- 정류소 마커 및 버스 위치 마커 표시
- 선택 정류소와 선택 노선의 시각적 강조
- 데이터 정규화 helper 테스트

확인된 API:

- TAGO 버스 도착 정보
- TAGO 버스 정류소 정보
- TAGO 버스 위치 정보

배포 전 정리 필요:

- API 키는 `.env.local`에서 관리합니다. `.env.local`은 Git에 포함하지 않습니다.
- `LICENSE`, `src/App.css`, `src/assets/`, `public/icons.svg`는 현재 앱 기능에 직접 사용되지 않는 잔여 파일입니다.
- README는 현재 프로젝트 기준으로 업데이트되었지만, 배포 URL과 실제 운영 정책은 추후 추가가 필요합니다.

## 4. 기술 스택

- React 19
- Vite 8
- Axios
- Kakao Maps JavaScript SDK
- 공공데이터포털 TAGO 버스 API
- ESLint
- Node.js 내장 test runner

## 5. API 연동

### 공공데이터포털

사용 중인 서비스:

- TAGO 버스 도착 정보
- TAGO 버스 정류소 정보
- TAGO 버스 위치 정보

주요 요청 파라미터:

- `serviceKey`: 공공데이터포털 일반인증키
- `_type`: `json`
- `cityCode`: `38010`
- `nodeId`: 정류소 ID
- `routeId`: 노선 ID

### 카카오 지도

카카오 지도는 `src/api/kakaoMap.js`에서 JavaScript SDK를 동적으로 로드합니다.

Kakao Maps JavaScript 키는 `VITE_KAKAO_MAP_JS_KEY` 환경 변수로 주입합니다.

## 6. 환경 변수

Vite 클라이언트 코드에서 사용하는 환경 변수는 `VITE_` prefix가 필요합니다.

로컬 개발용 파일:

```txt
.env.local
```

필요한 변수:

```env
VITE_DATA_GO_KR_SERVICE_KEY=your_data_go_kr_service_key
VITE_KAKAO_MAP_JS_KEY=your_kakao_map_javascript_key
```

`.env.local`은 Git에 올리지 않고, 공유용 변수 목록은 `.env.example`에만 기록합니다.

주의: Vite 프론트엔드 환경 변수는 브라우저 번들에 포함됩니다. 따라서 키를 소스 코드에서 분리하더라도 최종 사용자에게 완전히 숨겨지는 것은 아닙니다. 배포 시에는 API 제공처의 도메인 제한, 사용량 제한, 키 재발급 정책을 함께 적용해야 합니다.

## 7. 폴더 구조

```txt
BIS_project/
├── .env.example
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   ├── apiClient.js
│   │   ├── busApi.js
│   │   ├── busData.js
│   │   ├── busData.test.js
│   │   ├── kakaoMap.js
│   │   ├── kakaoMap.test.js
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

개발 서버 실행:

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
node --test src/api/busData.test.js src/api/kakaoMap.test.js src/api/stationStorage.test.js
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

- `src/api/apiClient.js`: 공공데이터포털 도착 정보 API용 Axios client
- `src/api/busApi.js`: 정류소 검색, 도착 정보, 버스 위치 API 호출
- `src/api/busData.js`: API 응답 배열화, 정류소 필터링, 버스 위치 좌표 정규화
- `src/api/kakaoMap.js`: 카카오 지도 SDK URL 생성, 지도용 정류소 데이터 정리
- `src/api/stationStorage.js`: 즐겨찾기 및 최근 정류소 localStorage 저장
- `src/components/KakaoStationMap.jsx`: 정류소/버스 마커를 표시하는 지도 컴포넌트
- `src/screens/BusArrivalScreen.jsx`: 검색, 지도, 도착 정보, 노선 선택 상태를 관리하는 메인 화면
- `src/index.css`: 앱 전체 UI 스타일

## 11. 배포 전 체크리스트

- 기존 커밋 기록에 포함된 API 키 재발급 검토
- 배포 환경에 `VITE_DATA_GO_KR_SERVICE_KEY` 등록
- 배포 환경에 `VITE_KAKAO_MAP_JS_KEY` 등록
- 카카오 개발자 콘솔에서 배포 도메인 등록
- 공공데이터포털 서비스별 활용 신청 상태 확인
- 앱 이름, favicon, README 배포 URL 정리
- 사용하지 않는 템플릿 자산 정리
