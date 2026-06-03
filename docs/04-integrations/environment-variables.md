# 환경 변수

## 변수 목록

`.env.example` 기준으로 필요한 변수는 다음 네 개입니다.

```env
DATA_GO_KR_SERVICE_KEY=
VITE_KAKAO_MAP_JS_KEY=
CITY_CODE=38010
PORT=5174
```

## 사용 위치

- `DATA_GO_KR_SERVICE_KEY`: `server/config.js`에서 읽고 공공데이터포털 TAGO API 요청에 사용합니다.
- `VITE_KAKAO_MAP_JS_KEY`: `src/api/kakaoMap.js`에서 Kakao Maps JavaScript SDK 로드에 사용합니다.
- `CITY_CODE`: `server/config.js`에서 읽고 기본값은 창원시 코드 `38010`입니다.
- `PORT`: `server/index.js` 실행 포트이며 기본값은 `5174`입니다.

## 로컬 파일

로컬 값은 `.env.local`에 둡니다. `.gitignore`는 `.env`, `.env.*`를 제외하고 `.env.example`만 허용합니다.

## 보안 주의

`DATA_GO_KR_SERVICE_KEY`는 백엔드 서버에서만 읽습니다. 프론트엔드 번들에 공공데이터 일반인증키를 넣지 않기 위해 `src/api/busApi.js`는 공공데이터포털을 직접 호출하지 않고 로컬 `/api` 엔드포인트를 호출합니다.

`VITE_KAKAO_MAP_JS_KEY`는 Kakao Maps JavaScript SDK 로드를 위해 브라우저에서 접근 가능한 값입니다. 운영 배포 전 확인이 필요합니다.

- 기존 Git 기록에 노출된 키 재발급
- Kakao 개발자 콘솔 도메인 제한
- 공공데이터포털 서비스 활용 신청 상태
- API 사용량 제한과 모니터링 정책

## 관련 문서

- [개발 환경](../01-getting-started/development-environment.md)
- [배포 체크리스트](../07-deployment/deployment-checklist.md)
