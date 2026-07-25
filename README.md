# BARUDA (PostureBlur)

나쁜 자세를 취하면 화면이 점진적으로 흐려지는 시스템 전역 오버레이로, 자연스럽게 바른 자세를 유도하는 Electron 앱입니다.

모든 카메라 처리와 자세 분석은 사용자 PC에서 로컬로만 수행되며, 영상 데이터는 디스크에 저장되거나 외부로 전송되지 않습니다.

## 기술 스택

- Electron + React + TypeScript (electron-vite)
- MediaPipe Face Landmarker (로컬 웹캠 랜드마크 추출)
- SQLite (로컬 자세 타임라인 저장)
- Supabase Auth + Stripe 구독 (클라우드 백엔드, `backend/`)

## 개발

```bash
npm install
cp .env.example .env   # Supabase URL/anon key, 백엔드 주소 채우기
npm run dev
```

## 클라우드 백엔드 (Supabase + Stripe)

구독 결제는 `backend/`의 별도 NestJS 서버가 담당합니다. Electron 앱은 Supabase anon key로 로그인/구독 상태 조회(RLS로 본인 행만 접근)까지만 하고, Stripe 시크릿 키와 Supabase 서비스 롤 키가 필요한 작업(체크아웃 세션 생성, 웹훅 처리)은 전부 백엔드가 담당합니다.

1. Supabase 프로젝트 생성 후 `backend/supabase/migrations/0001_init.sql`을 SQL Editor에서 실행 (profiles/subscriptions 테이블 + RLS)
2. `backend/.env.example`을 `backend/.env`로 복사하고 Supabase 서비스 롤 키, Stripe 시크릿 키·가격 ID를 채운 뒤 `npm install && npm run start:dev`
3. Stripe 대시보드에서 웹훅 엔드포인트를 `<백엔드 주소>/webhooks/stripe`로 등록하고, 서명 시크릿을 `STRIPE_WEBHOOK_SECRET`에 채우기
4. 루트 `.env`의 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_BACKEND_URL`을 채우면 앱에서 로그인·구독 시작 버튼이 동작

> 현재 이 저장소에는 실제 Supabase/Stripe 키가 없어 위 흐름은 스캐폴딩 상태입니다 — 키를 채우기 전에는 로그인/결제가 동작하지 않습니다.

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
  - `src/renderer/src/auth` — Supabase 로그인/세션 관리
  - `src/renderer/src/billing` — 구독 상태 조회 및 Stripe Checkout 시작
- `backend` — Supabase 서비스 롤 / Stripe 시크릿 키가 필요한 작업 전용 NestJS API

## 문서

- [PRD.md](./PRD.md) — 제품 요구사항 문서
- [TRD.md](./TRD.md) — 기술 요구사항 문서
- [TODO.yaml](./TODO.yaml) — 작업 항목 및 우선순위
