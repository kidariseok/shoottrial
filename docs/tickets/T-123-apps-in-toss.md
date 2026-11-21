# T-123 앱인토스(토스 미니앱) 발행 준비

상태: 코드 완료(사용자 QR 검증 대기)
담당: Claude Code
브랜치: `kidariseok/t123-apps-in-toss` (기준 `origin/main` 71462f2)

## 목표

같은 코드베이스에서 `npm run build:toss`로 앱인토스 콘솔에 올릴 `.ait` 번들이 만들어지고, 토스 앱 안에서 뒤로가기·세이브·보상형 광고·Safe Area가 동작한다. 웹(Vercel)과 안드로이드(Capacitor) 빌드는 바뀌지 않는다.

## 선행

- T-120(웹 체험판) 병합 확인됨.

## 소유 경로

- `src/platform.ts`
- `src/ads.ts`
- `src/web.ts`
- `src/ui/screens.ts`
- `src/ui/lobby.ts`
- `tests/ads.test.ts`
- `tests/toss.test.ts`
- `apps-in-toss.config.ts`
- `package.json`
- `package-lock.json`
- `.gitignore`
- `docs/TOSS-DEPLOY.md`
- `docs/HANDOFF.md`

## 허용 의존성

- `@apps-in-toss/web-framework` (사용자가 앱인토스 발행을 요청해 승인. 설치 버전 3.9.0)

## 참고 문서

- 앱인토스 개발자센터 https://developers-apps-in-toss.toss.im/llms.txt (게임 출시 가이드, 서비스 오픈 정책, 인앱 광고, Safe Area, 스토리지)
- 설치한 패키지의 `dist/index.d.ts`가 API 이름의 근거다(문서가 옛 이름을 쓰는 곳이 있다).

## 설계 결정

- SDK는 `src/platform.ts`에서만 **동적 import**한다. `vite --mode toss`일 때만 불러서 웹·안드로이드 번들에는 영향이 없다. AGENTS.md 절대 규칙 6(Capacitor 플러그인은 platform.ts에서만)과 같은 원칙을 `@apps-in-toss/*`에 적용한다.
- 토스 여부는 import 성공 + `Environment.environment` 확인으로 런타임에 정한다. 실패하면 웹으로 계속한다.
- 광고 UI 문구 분기는 `isNative()` 대신 `hasAds()`(네이티브 또는 토스)를 쓴다.
- 세이브는 SDK `Storage`(앱 단위 저장소)를 쓰고 localStorage에도 같이 쓴다. 출시판과 QR 테스트판은 origin이 달라 localStorage가 공유되지 않기 때문이다.
- 우측 상단 닫기(X) 버튼과 겹치지 않도록 `--sa-top`에 `TOSS_CLOSE_BAND`를 더한다.

## 할 일

1. SDK 설치, `apps-in-toss.config.ts`, `dev:toss`·`build:toss` 스크립트.
2. platform.ts: 토스 초기화(뒤로가기·Safe Area·Storage·식별키·화면 닫기)와 보상형 광고.
3. ads/web/screens/lobby: `hasAds()` 분기.
4. 테스트와 `npm run verify`, `npm run build:toss`로 `.ait` 생성 확인.
5. `docs/TOSS-DEPLOY.md`: 콘솔 절차·막힌 항목·QR 테스트 체크리스트.

## 검증 명령

- `npm run verify`
- `npm run build:toss`

## 완료 조건

verify 통과, `.ait` 생성, 웹 빌드 결과(`dist`)에 토스 SDK가 들어가지 않음. 실기기 토스 앱 검증은 사용자가 콘솔 QR로 한다(이 환경에서는 못 한다).

## 진행 기록

- [x] 문서 조사(게임 출시 가이드·정책·광고·스토리지·Safe Area), SDK 3.9.0 타입 확인
- [x] 구현 (platform.ts 토스 분기, hasAds, config, 스크립트)
- [x] 검증: verify 389테스트·97에셋·빌드 통과, build:toss로 defcon2.ait(9.9MB) 생성, 토스 앱 밖 폴백 확인. 토스 앱 안 실기기 검증은 미실시(사용자 QR)

## 질문

- appName(콘솔 등록값과 같아야 함), 등급분류 경로(게임물관리위원회 직접 / 구글 플레이 선출시)는 사용자 결정이 필요하다. `docs/TOSS-DEPLOY.md` 참고.
