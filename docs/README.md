# BIS Project Docs

이 문서는 BIS Project의 위키 허브입니다. 각 페이지는 실제 코드와 설정 파일을 기준으로 작성되었고, 관련 코드 경로를 함께 적어 재검증할 수 있게 했습니다.

## 00. Overview

- [프로젝트 개요](00-overview/project-overview.md)

## 01. Getting Started

- [개발 환경](01-getting-started/development-environment.md)
- [실행과 운영 명령](01-getting-started/run-and-operations.md)

## 02. Architecture

- [시스템 아키텍처](02-architecture/system-architecture.md)
- [폴더 구조](02-architecture/directory-structure.md)
- [데이터 흐름](02-architecture/data-flow.md)

## 03. Frontend

- [프론트엔드 인덱스](03-frontend/README.md)
- [화면 구성](03-frontend/main-screen.md)
- [지도 컴포넌트](03-frontend/map-component.md)
- [스타일링](03-frontend/styling.md)

## 04. Integrations

- [외부 연동](04-integrations/external-integrations.md)
- [환경 변수](04-integrations/environment-variables.md)

## 05. Features

- [기능 인덱스](05-features/README.md)
- [정류소 검색과 선택](05-features/station-search-and-selection.md)
- [노선 검색 및 실시간 노선 지도](05-features/route-search-and-live-map.md)
- [도착 정보 조회](05-features/arrival-information.md)
- [실시간 버스 위치](05-features/live-bus-location.md)
- [즐겨찾기와 최근 정류소](05-features/favorites-and-recents.md)

## 06. Testing

- [테스트와 검증](06-testing/testing-and-verification.md)

## 07. Deployment

- [배포 체크리스트](07-deployment/deployment-checklist.md)

## 현재 작업트리 주의사항

현재 코드 기준으로 문서를 작성했지만, 작업트리에는 아직 미커밋 잔여 항목이 있습니다.

- `LICENSE`는 Git 추적 파일이지만 현재 삭제된 상태입니다.
- `src/App.css`, `src/assets/`, `public/icons.svg`는 존재하지만 현재 앱 진입점에서 직접 사용되지 않습니다.
- `.env.local`은 실제 로컬 키가 들어갈 수 있는 파일이라 읽지 않았고, `.env.example`과 코드의 환경변수 사용을 기준으로 문서화했습니다.
