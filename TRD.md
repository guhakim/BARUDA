# [TRD] 기술요구사항문서 (Technical Requirements Document)

## 1. 시스템 아키텍처

PostureBlur는 클라이언트 독립형 구조를 중심으로 비즈니스 핵심을 로컬에서 처리하고, 구독 및 통계 동기화만 백엔드 API와 통신하는 **하이브리드 아키텍처**를 채택합니다.

```
+---------------------------------------------------------------------------------+
|                                 Electron Client                                 |
|                                                                                 |
|  +------------------------+  IPC  +------------------------------------------+  |
|  |      Render Process    | <===> |                Main Process              |  |
|  | ---------------------- |       | ---------------------------------------- |  |
|  |  - UI (React+Tailwind) |       |  - Frameless Transparent Window Manager  |  |
|  |  - MediaPipe Facemesh  |       |  - Native OS Level Control (Tray, Menu)  |  |
|  |  - Local Stats View    |       |  - SQLite3 Database (Log Storage)        |  |
|  +------------------------+       +------------------------------------------+  |
+---------------------------------------------------------------------------------+
                                         || (HTTPS / TLS 1.3)
                                         \/
                        +-----------------------------------+
                        |         Cloud Backend API         |
                        | --------------------------------- |
                        |  - NestJS / Supabase Auth & DB    |
                        |  - Stripe Subscription Webhook    |
                        +-----------------------------------+
```

## 2. 데이터 모델 (Data Model)

로컬 데이터 보호 및 오프라인 상태 지원을 위해 사용자 상세 통계는 로컬 SQLite에 적재하며, 클라우드에는 동기화용 최소 데이터 및 결제 정보만 기록합니다.

### 2.1 Local SQLite Schema (Client-side)

* **`user_settings` 테이블**
  * `id`: INTEGER (PK)
  * `baseline_nose_y`: REAL (바른 자세 코 Y 좌표)
  * `baseline_shoulder_distance`: REAL (어깨 간 거리 기준값)
  * `blur_sensitivity`: REAL (기본값 1.0)
  * `updated_at`: DATETIME

* **`posture_logs` 테이블**
  * `id`: INTEGER (PK)
  * `timestamp`: DATETIME (5분 단위 윈도우 집계)
  * `good_posture_duration_sec`: INTEGER (바른 자세 유지 시간)
  * `bad_posture_duration_sec`: INTEGER (거북목 자세 유지 시간)
  * `trigger_count`: INTEGER (블러가 활성화된 횟수)

### 2.2 Cloud Schema (Supabase / Central DB)

* **`profiles` 테이블:** `id` (UUID, PK), `email`, `created_at`
* **`subscriptions` 테이블:** `id` (PK), `user_id` (FK), `stripe_customer_id`, `status` (active, canceled), `current_period_end`

## 3. 기술 스택 및 채택 이유

* **프레임워크:** `Electron`
  * *이유:* Windows의 `WS_EX_TRANSPARENT` 아키텍처 및 macOS의 `NSWindow` 오버레이 설정을 하나의 JavaScript 단일 코드베이스로 제어할 수 있는 유일무이한 크로스 플랫폼 대안입니다.

* **자세 인식 엔진:** `MediaPipe Face Mesh` / `Pose` (로컬 웹 워커 구동)
  * *이유:* 웹캠 스트림으로부터 얼굴 및 상반신 주요 랜드마크를 CPU 부하를 최소화하면서도 30fps 수준으로 실시간 추출해냅니다. 웹 브라우저 샌드박스 위에서 돌기 때문에 백엔드 서버 비용이 0원입니다.

* **프론트엔드 UI:** `React` + `Tailwind CSS` + `Shadcn UI`
  * *이유:* 가볍고 컴포넌트 재사용성이 좋아 설정창 및 통계 대시보드 화면을 빠르게 프로토타이핑할 수 있습니다.

* **백엔드 & 인증:** `Supabase` (PostgreSQL + GoTrue Auth)
  * *이유:* 별도의 인프라 관리 없이 사용자 회원가입, JWT 인증, 구독 유효성 체크 API를 즉각 구축하여 타임 투 마켓(Time-to-Market)을 최소화합니다.

## 4. 보안 및 권한 전략

* **카메라 데이터 격리:** Electron의 `webPreferences` 설정을 조율하여 Render Process 내에서 구동되는 MediaPipe 엔진이 로컬 웹캠 스트림을 취득하되, 외부 네트워크(Outbound)로 이미지 바이너리를 전송하는 행위를 Content Security Policy (CSP) 지침을 통해 원천적으로 차단합니다.
* **통신 보안:** 백엔드 API와의 모든 데이터 송수신은 TLS 1.3 암호화를 필수 적용하며, Supabase RLS(Row Level Security) 정책을 통해 본인의 자세 통계 데이터 외에는 접근이 불가능하도록 차단합니다.
