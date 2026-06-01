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

- `ArvlInfoInqireService`: 정류소별 실시간 도착 정보
- `BusSttnInfoInqireService`: 정류소명 기반 정류소 검색
- `BusLcInfoInqireService`: 노선별 실시간 버스 위치

배포 전 정리 필요:

- 현재 API 키가 소스 코드에 직접 들어가 있습니다. 배포 전 `.env` 기반 환경 변수로 분리해야 합니다.
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

사용 중인 엔드포인트:

```txt
https://apis.data.go.kr/1613000/ArvlInfoInqireService
https://apis.data.go.kr/1613000/BusSttnInfoInqireService
https://apis.data.go.kr/1613000/BusLcInfoInqireService
```

주요 요청 파라미터:

- `serviceKey`: 공공데이터포털 일반인증키
- `_type`: `json`
- `cityCode`: `38010`
- `nodeId`: 정류소 ID
- `routeId`: 노선 ID

### 카카오 지도

카카오 지도는 `src/api/kakaoMap.js`에서 JavaScript SDK를 동적으로 로드합니다.

현재 JS 키도 소스 코드에 직접 설정되어 있으므로, 운영 배포 전 환경 변수로 분리하는 것을 권장합니다.

## 6. 폴더 구조

```txt
BIS_project/
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

## 7. 실행 방법

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

## 8. 테스트 및 검증

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

## 9. 주요 파일 설명

- `src/api/apiClient.js`: 공공데이터포털 도착 정보 API용 Axios client
- `src/api/busApi.js`: 정류소 검색, 도착 정보, 버스 위치 API 호출
- `src/api/busData.js`: API 응답 배열화, 정류소 필터링, 버스 위치 좌표 정규화
- `src/api/kakaoMap.js`: 카카오 지도 SDK URL 생성, 지도용 정류소 데이터 정리
- `src/api/stationStorage.js`: 즐겨찾기 및 최근 정류소 localStorage 저장
- `src/components/KakaoStationMap.jsx`: 정류소/버스 마커를 표시하는 지도 컴포넌트
- `src/screens/BusArrivalScreen.jsx`: 검색, 지도, 도착 정보, 노선 선택 상태를 관리하는 메인 화면
- `src/index.css`: 앱 전체 UI 스타일

## 10. 배포 전 체크리스트

- 공공데이터포털 API 키를 `.env`로 이동
- 카카오 지도 JS 키를 `.env`로 이동
- API 키가 Git 기록에 남지 않도록 별도 키 재발급 검토
- 카카오 개발자 콘솔에서 배포 도메인 등록
- 공공데이터포털 서비스별 활용 신청 상태 확인
- 앱 이름, favicon, README 배포 URL 정리
- 사용하지 않는 템플릿 자산 정리
