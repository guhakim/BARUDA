# BARUDA (PostureBlur)

나쁜 자세를 취하면 화면이 점진적으로 흐려지는 시스템 전역 오버레이로, 자연스럽게 바른 자세를 유도하는 Electron 앱입니다.

모든 카메라 처리와 자세 분석은 사용자 PC에서 로컬로만 수행되며, 영상 데이터는 디스크에 저장되거나 외부로 전송되지 않습니다.

## 현재 구현된 기능

- **실시간 자세 인식** — MediaPipe Face Landmarker(코/귀) + Pose Landmarker(어깨/엉덩이)를 함께 사용해 목/몸통 각도를 계산합니다. 점수는 절대각도가 아니라 **기준점 등록 시점 대비 변화량**으로 매겨서, 웹캠이 눈높이에 정확히 있지 않아도(카메라 위치 편향) 정확한 점수가 나옵니다.
- **가이드 아웃라인** — 웹캠 프레임 위에 얼굴+어깨 형태의 연한 실루엣을 표시해, 기준점을 등록하기 전에도 어디에 앉아야 할지 직관적으로 알 수 있게 합니다.
- **자세 점수 시각화** — "자세" 바가 빨강→노랑→초록 연속 그라데이션으로 점수를 표시하고, 95% 이상(완벽 정렬) 시 프레임 테두리와 가이드라인이 초록색으로 반짝이는 효과가 뜹니다.
- **포인트 시스템** — 자세 점수가 85% 이상으로 유지되는 동안 매초 포인트가 쌓입니다(스트릭 링은 1분에 한 바퀴). 총 포인트는 로컬에 저장되어 앱을 재시작해도 유지됩니다.
- **시스템 전역 블러 오버레이** — 자세가 무너지면 모든 화면 위에 투명 클릭스루 오버레이 창이 블러 처리됩니다. 멀티 디스플레이를 자동 감지합니다.
- **주간 통계** — 헤더의 햄버거(☰) 버튼을 누르면 최근 7일간의 바른 자세 비율을 로컬 SQLite 데이터를 기반으로 한 막대 그래프로 보여줍니다.
- **항상 위에 표시** — 메인 창은 다른 앱을 클릭해도 뒤로 밀리지 않고 항상 최상단에 떠 있습니다.
- **라이트 테마 UI** — 화이트 배경 + 인디고 계열 액센트의 미니멀한 디자인.

## 아직 화면에 노출되지 않은 것 (구현은 되어 있음)

로그인(Supabase Auth)과 구독 결제(Stripe)는 코드는 완성되어 있지만(`src/renderer/src/auth`, `src/renderer/src/billing`, `backend/`), 회원가입 없이도 앱을 바로 쓸 수 있도록 현재 `App.tsx`에서 렌더링하지 않고 있습니다. 나중에 필요할 때 다시 연결하면 됩니다. 개발 중에는 `VITE_MOCK_AUTH=true`(`.env.example` 기본값)로 로그인 없이 전체 기능을 테스트할 수 있습니다.

## 기술 스택

- Electron + React + TypeScript (electron-vite)
- MediaPipe Face Landmarker + Pose Landmarker (로컬 웹캠 랜드마크/포즈 추출)
- SQLite (로컬 자세 타임라인 저장, `better-sqlite3`)
- Supabase Auth + Stripe 구독 (클라우드 백엔드, `backend/` — 현재 UI에는 미연결)

## 개발

```bash
npm install
cp .env.example .env   # 기본값(VITE_MOCK_AUTH=true)이면 Supabase/Stripe 계정 없이 바로 실행 가능
npm run dev
```

## 빌드 및 배포

```bash
npm run build
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

빌드 결과물은 `dist/`에 생성됩니다. 코드 서명이 안 되어 있어(Apple Developer 계정 필요) macOS에서 처음 실행 시 "확인되지 않은 개발자" 경고가 뜰 수 있습니다 — 앱을 우클릭 → 열기로 실행하면 됩니다.

GitHub Releases로 배포하려면:

```bash
gh release create v0.1.0 dist/BARUDA-0.1.0.dmg --title "BARUDA v0.1.0" --notes "..."
```

## 클라우드 백엔드 (Supabase + Stripe, 현재 미연결)

구독 결제는 `backend/`의 별도 NestJS 서버가 담당합니다. Electron 앱은 Supabase anon key로 로그인/구독 상태 조회(RLS로 본인 행만 접근)까지만 하고, Stripe 시크릿 키와 Supabase 서비스 롤 키가 필요한 작업(체크아웃 세션 생성, 웹훅 처리)은 전부 백엔드가 담당합니다.

1. Supabase 프로젝트 생성 후 `backend/supabase/migrations/0001_init.sql`을 SQL Editor에서 실행 (profiles/subscriptions 테이블 + RLS)
2. `backend/.env.example`을 `backend/.env`로 복사하고 Supabase 서비스 롤 키, Stripe 시크릿 키·가격 ID를 채운 뒤 `npm install && npm run start:dev`
3. Stripe 대시보드에서 웹훅 엔드포인트를 `<백엔드 주소>/webhooks/stripe`로 등록하고, 서명 시크릿을 `STRIPE_WEBHOOK_SECRET`에 채우기
4. 루트 `.env`의 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_BACKEND_URL`을 채우기
5. `src/renderer/src/App.tsx`에서 `AuthGate`/`BillingPanel`을 다시 렌더링하도록 연결

> 실제 Supabase/Stripe 키가 없는 상태라 위 흐름은 스캐폴딩 상태입니다.

## 프로젝트 구조

- `src/main` — Electron 메인 프로세스
  - `overlayWindow.ts` — 멀티 디스플레이 투명 클릭스루 블러 오버레이
  - `postureStore.ts` — 로컬 SQLite 자세 타임라인 저장 (5분 단위 집계)
  - `index.ts` — 메인 창(항상 위 고정) 생성, IPC 핸들러
- `src/preload` — 렌더러에 노출되는 IPC 브릿지
- `src/renderer/src`
  - `posture/` — MediaPipe Face/Pose Landmarker, 자세 점수 계산, 웹캠 UI, 포인트/스트릭
  - `dashboard/` — 주간 자세 통계 차트
  - `auth/` — Supabase 로그인/세션 관리 (현재 미연결)
  - `billing/` — 구독 상태 조회 및 Stripe Checkout 시작 (현재 미연결)
  - `lib/` — Supabase 클라이언트, 개발용 mock 인증 플래그
- `backend/` — Supabase 서비스 롤 / Stripe 시크릿 키가 필요한 작업 전용 NestJS API

## 문서

- [PRD.md](./PRD.md) — 제품 요구사항 문서
- [TRD.md](./TRD.md) — 기술 요구사항 문서
- [TODO.yaml](./TODO.yaml) — 작업 항목 및 우선순위
