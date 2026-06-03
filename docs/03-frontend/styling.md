# 스타일링

스타일은 `src/index.css`에 집중되어 있습니다. 별도 CSS-in-JS나 UI 라이브러리는 사용하지 않습니다.

## 주요 스타일 영역

- 앱 레이아웃: `.bus-app`
- 검색 패널: `.search-panel`
- 지도: `.map-panel`, `.map-panel__canvas`
- 정류소 결과: `.station-results`, `.station-result`
- 도착 정보 패널: `.arrival-panel`, `.arrival-card`
- 버스 위치 상태: `.bus-location-status`
- 상태 메시지: `.status-message`

## 반응형 처리

`@media (max-width: 640px)`에서 모바일 레이아웃을 조정합니다.

- 헤더와 도착 패널 상단이 세로 배치로 전환됩니다.
- 지도 높이는 300px로 줄어듭니다.
- 도착 카드가 세로 배치로 전환됩니다.

## 잔여 스타일 파일

`src/App.css`는 현재 import되지 않는 템플릿성 스타일 파일입니다. 삭제 여부는 사용자 확인이 필요합니다.

## 관련 문서

- [폴더 구조](../02-architecture/directory-structure.md)
- [화면 구성](main-screen.md)
