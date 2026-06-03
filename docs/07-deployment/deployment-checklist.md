# 배포 체크리스트

## 환경 변수

배포 환경에 다음 변수를 등록해야 합니다.

```env
DATA_GO_KR_SERVICE_KEY=
VITE_KAKAO_MAP_JS_KEY=
CITY_CODE=38010
PORT=5174
```

변수 설명은 [환경 변수](../04-integrations/environment-variables.md)를 참고하세요.

## 키 관리

이전 Git 기록에 API 키가 포함된 적이 있으므로, 실제 운영 배포 전 키 재발급을 검토해야 합니다.

## 외부 서비스 설정

- 카카오 개발자 콘솔에서 운영 도메인을 등록합니다.
- 공공데이터포털에서 TAGO 버스 도착 정보, 정류소 정보, 위치 정보, 노선 정보 서비스의 활용 신청 상태를 확인합니다.
- 사용량 제한과 장애 대응 방식을 확인합니다.

## 앱 설정

- 백엔드 API 서버 배포 방식을 확정합니다.
- 프론트엔드 `/api` 요청이 운영 백엔드로 연결되는지 확인합니다.
- `index.html`의 앱 제목과 favicon이 운영 앱에 맞는지 확인합니다.
- `README.md`의 배포 URL과 운영 정책을 업데이트합니다.
- 현재 사용하지 않는 템플릿성 파일(`src/App.css`, `src/assets/`, `public/icons.svg`) 정리 여부를 결정합니다.
- 삭제 상태인 `LICENSE`를 유지할지 복원할지 결정합니다.

## 검증

배포 전 다음 명령을 실행합니다.

```bash
npm test
npm run lint
npm run build
```
