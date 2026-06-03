# 프로젝트 개요

BIS Project는 창원시 버스 정류소를 검색하고, 정류소별 실시간 도착 정보와 노선별 실시간 버스 위치를 지도 위에서 확인하는 React 웹 앱입니다.

## 핵심 목적

- 정류소명을 직접 입력해 정류소 후보를 찾습니다.
- 카카오 지도에서 정류소 마커를 선택해 현재 정류소를 바꿉니다.
- 선택된 정류소의 도착 예정 버스를 확인합니다.
- 도착 목록에서 노선을 선택하면 해당 노선의 실시간 버스 위치를 지도에 표시합니다.

## 현재 대상 지역

기본 `cityCode`는 창원시 코드인 `38010`입니다. 이 값은 `server/config.js`에서 `CITY_CODE` 환경변수로 읽고, 값이 없으면 기본값으로 사용합니다.

## 주요 코드 경로

- 앱 진입점: `src/main.jsx`, `src/App.jsx`
- 메인 화면: `src/screens/BusArrivalScreen.jsx`
- 지도 컴포넌트: `src/components/KakaoStationMap.jsx`
- 프론트 API 호출: `src/api/busApi.js`
- 로컬 API 서버: `server/index.js`
- 카카오 지도 SDK: `src/api/kakaoMap.js`
- 전역 스타일: `src/index.css`

## 관련 문서

- [시스템 아키텍처](../02-architecture/system-architecture.md)
- [정류소 검색과 선택](../05-features/station-search-and-selection.md)
- [실시간 버스 위치](../05-features/live-bus-location.md)
