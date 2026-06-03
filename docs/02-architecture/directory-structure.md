# 폴더 구조

현재 프로젝트 구조는 다음 역할로 나뉩니다.

```txt
BIS_project/
├── .env.example
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── screens/
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── README.md
├── package.json
├── package-lock.json
├── vite.config.js
└── eslint.config.js
```

## 주요 폴더

- `src/api/`: API 호출, 데이터 정규화, localStorage helper, 관련 테스트
- `src/components/`: 재사용 가능한 UI 컴포넌트. 현재는 지도 컴포넌트가 있습니다.
- `src/screens/`: 화면 단위 컴포넌트. 현재 메인 화면은 `BusArrivalScreen.jsx`입니다.
- `public/`: Vite가 정적 파일로 제공하는 파일
- `docs/`: 프로젝트 위키 문서

## 잔여 파일

- `src/App.css`는 현재 `src/main.jsx`나 `src/App.jsx`에서 import되지 않습니다.
- `src/assets/`의 React/Vite 템플릿 자산과 `hero.png`는 현재 앱에서 참조되지 않습니다.
- `public/icons.svg`도 현재 앱 코드에서 참조되지 않습니다.

위 항목은 정리 필요 여부가 사용자 확인을 필요로 합니다.

## 관련 문서

- [프로젝트 개요](../00-overview/project-overview.md)
- [스타일링](../03-frontend/styling.md)
