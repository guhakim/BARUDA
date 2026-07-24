# BARUDA (PostureBlur)

나쁜 자세를 취하면 화면이 점진적으로 흐려지는 시스템 전역 오버레이로, 자연스럽게 바른 자세를 유도하는 Electron 앱입니다.

모든 카메라 처리와 자세 분석은 사용자 PC에서 로컬로만 수행되며, 영상 데이터는 디스크에 저장되거나 외부로 전송되지 않습니다.

## 기술 스택

- Electron + React + TypeScript (electron-vite)
- MediaPipe Face Landmarker (로컬 웹캠 랜드마크 추출)

## 개발

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

## 프로젝트 구조

- `src/main` — Electron 메인 프로세스 (투명 오버레이 윈도우, IPC)
- `src/preload` — 렌더러에 노출되는 IPC 브릿지
- `src/renderer` — 설정 창(메인 윈도우) 및 오버레이 창 렌더러
  - `src/renderer/src/posture` — MediaPipe 기반 자세 인식 로직

## 문서

- [PRD.md](./PRD.md) — 제품 요구사항 문서
- [TRD.md](./TRD.md) — 기술 요구사항 문서
- [TODO.yaml](./TODO.yaml) — 작업 항목 및 우선순위
