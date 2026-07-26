# BARUDA (PostureBlur)

웹캠으로 자세를 감지해 자세가 무너지면 화면 전체를 점진적으로 흐리게 만드는 Electron 데스크톱 앱입니다.

## 프로세스 구조

Electron 3-프로세스 모델로 동작하며, main 프로세스가 여러 렌더러 창을 IPC로 조율하는 허브-스포크 구조입니다.

- **Main Process** (`src/main`)
  - `index.ts` — 메인 창 생성(항상 위 고정), IPC 라우터
  - `overlayWindow.ts` — 모니터별 투명·클릭통과 오버레이 창 관리
  - `miniBarWindow.ts` — 하단 미니바 창 생성/이동/복귀
  - `postureStore.ts` — SQLite(better-sqlite3, WAL) 기반 자세 기록 저장
- **Renderer 창 3개** (각각 독립 React 인스턴스, 상태 공유 없음 — main을 경유한 IPC로만 동기화)
  - Main Window — 카메라 프리뷰, 자세 점수, 대시보드, 인증/결제 UI
  - Overlay Window — 전체화면 투명 창, `backdropFilter: blur(Npx)`로 실제 블러 렌더링
  - MiniBar Window — 56px 슬림 바, goodness 값에 따라 red↔yellow↔green 색상 표시

## 데이터 흐름

1. **인식** — `src/renderer/src/posture/`에서 MediaPipe Face Landmarker + Pose Landmarker(`pose_landmarker_lite`, GPU delegate)를 350ms 주기로 구동해 코/귀/어깨/엉덩이 좌표를 추적.
2. **점수 계산** — 얼굴 점수(코 낙하 비율, 카메라 전진 비율)와 자세 점수(목/몸통 각도)를 각각 기준점(baseline) 대비 delta로 0~100 산출 후 `max(faceScore, poseScore)` 채택, EMA 스무딩(α=0.5).
3. **IPC 전송** — 점수가 갱신될 때마다 `overlay:set-blur`, `posture:report`를 main 프로세스로 전송.
4. **Main 처리** — `overlay:set-blur`는 모든 오버레이 창에 브로드캐스트, `posture:report`는 SQLite에 기록(5분 버킷, `score < 40`을 bad로 판정, 샘플 간 5초 초과 gap은 클램프)하고 미니바 goodness를 갱신.
5. **블러 렌더링** — 오버레이 창이 `overlay:blur` 이벤트를 받아 `backdropFilter`로 실제 블러 적용, 자세가 회복되면 1초 이내 복구.

## 로컬 우선 설계

- 카메라 영상/좌표 추론은 전부 renderer 프로세스 내부(로컬)에서만 수행, 디스크 저장이나 외부 전송 없음.
- 인증/구독 상태 조회는 renderer가 Supabase JS SDK로 직접 호출(RLS로 접근 제어), 별도 API 게이트웨이 없음.
- Stripe 시크릿 키가 필요한 결제 세션 생성만 별도 NestJS 백엔드(`backend/`)로 분리.

## 기술 스택

- Electron 39 + electron-vite + TypeScript, React 19
- MediaPipe Tasks Vision (Face/Pose Landmarker)
- better-sqlite3 (로컬 자세 타임라인)
- Supabase JS SDK (Auth/DB), Stripe + NestJS 백엔드 (결제)

## 개발

```bash
npm install
cp .env.example .env   # VITE_MOCK_AUTH=true 기본값이면 Supabase/Stripe 계정 없이 실행 가능
npm run dev
```

## 빌드

```bash
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

## 문서

- [PRD.md](./PRD.md) — 제품 요구사항 문서
- [TRD.md](./TRD.md) — 기술 요구사항 문서
- [TODO.yaml](./TODO.yaml) — 작업 항목 및 우선순위

## License

MIT
