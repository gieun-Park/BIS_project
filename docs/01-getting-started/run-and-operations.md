# 실행과 운영 명령

## 백엔드 API 서버

```bash
npm run dev:server
```

Node 로컬 API 서버를 실행합니다. 기본 주소는 `http://localhost:5174`입니다.

프론트엔드는 Vite 프록시를 통해 `/api` 요청을 이 서버로 전달합니다.

## 프론트엔드 개발 서버

```bash
npm run dev
```

Vite 개발 서버를 실행합니다. 설정은 `vite.config.js`에 있고, React 플러그인과 `/api` 프록시를 사용합니다.

## 프로덕션 빌드

```bash
npm run build
```

Vite 프로덕션 빌드를 생성합니다.

## 빌드 미리보기

```bash
npm run preview
```

빌드 결과물을 로컬에서 미리 확인합니다.

## 린트

```bash
npm run lint
```

ESLint 설정은 `eslint.config.js`에 있습니다.

## 단위 테스트

```bash
npm test
```

테스트는 Node.js 내장 test runner를 사용합니다.

## 관련 문서

- [테스트와 검증](../06-testing/testing-and-verification.md)
- [배포 체크리스트](../07-deployment/deployment-checklist.md)
