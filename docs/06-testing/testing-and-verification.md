# 테스트와 검증

## 테스트 범위

현재 테스트는 API 응답 정규화, 통합 검색 실패 처리, 지도 helper, localStorage helper, 서버 정규화, 노선 인사이트 계산의 순수 로직을 대상으로 합니다.

테스트 파일:

- `src/api/busData.test.js`
- `src/api/kakaoMap.test.js`
- `src/api/searchData.test.js`
- `src/api/stationStorage.test.js`
- `server/normalizers.test.js`
- `server/routeInsight.test.js`

## 실행 명령

```bash
npm test
```

`package.json`의 `test` 스크립트는 `src/**/*.test.js`와 `server/**/*.test.js`를 함께 실행합니다.

## 린트

```bash
npm run lint
```

ESLint 설정은 `eslint.config.js`에 있습니다.

## 빌드

```bash
npm run build
```

Vite 설정은 `vite.config.js`에 있습니다.

## 테스트가 아직 없는 영역

다음 영역은 현재 자동 테스트가 없습니다.

- React 컴포넌트 렌더링
- 실제 카카오 지도 SDK 로딩
- 브라우저에서 지도 마커 클릭
- 실제 공공데이터포털 API 네트워크 응답

이 영역은 필요하면 브라우저 테스트 또는 mocking 기반 컴포넌트 테스트가 필요합니다.

## 관련 문서

- [실행과 운영 명령](../01-getting-started/run-and-operations.md)
- [배포 체크리스트](../07-deployment/deployment-checklist.md)
