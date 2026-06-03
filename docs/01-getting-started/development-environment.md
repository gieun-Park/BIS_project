# 개발 환경

## 요구 사항

이 프로젝트는 Node 로컬 API 서버와 Vite 기반 React 앱으로 구성됩니다. `package.json` 기준으로 Node.js와 npm 환경에서 실행합니다.

주요 패키지:

- `react`
- `react-dom`
- `axios`
- `vite`
- `eslint`

근거 파일:

- `package.json`
- `package-lock.json`
- `vite.config.js`
- `eslint.config.js`
- `server/index.js`

## 환경 변수

로컬 개발에는 `.env.local`이 필요합니다. 이 파일은 `.gitignore`에서 제외되어 Git에 올라가지 않습니다.

공유 가능한 변수 목록은 `.env.example`에 있습니다.

```env
DATA_GO_KR_SERVICE_KEY=
VITE_KAKAO_MAP_JS_KEY=
CITY_CODE=38010
PORT=5174
```

`DATA_GO_KR_SERVICE_KEY`는 서버에서만 사용하고, `VITE_KAKAO_MAP_JS_KEY`는 브라우저에서 Kakao Maps SDK를 불러올 때 사용합니다.

## 설치

```bash
npm install
```

## 관련 문서

- [환경 변수](../04-integrations/environment-variables.md)
- [실행과 운영 명령](run-and-operations.md)
