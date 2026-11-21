# T-125 iOS 1단계 타깃 구축 · 심사 전 필수 항목 · 햅틱 구현 · 시뮬레이터 빌드

상태: 완료(PR #57 main 병합)
담당: Antigravity · Gemini 4 Neon (High)

## 목표

최신 `main`(T-123 앱인토스 병합 `e3b33fd`) 위에 iOS Capacitor 8(SPM) 타깃을 추가하고, AdMob iOS SDK를 완전히 제외한 무광고 1단계 iOS 빌드, App Store 심사 전 필수 항목(PX 준비 중 버튼 숨김·개인정보 처리방침/고객 지원 링크 및 정적 페이지·배경음 복구·`PrivacyInfo.xcprivacy`), `@capacitor/haptics` 네이티브 진동, 단위 테스트, `xcodebuild` 시뮬레이터 빌드 검증까지 완료한 뒤 PR을 생성한다.

## 선행

- T-123 (PR #56, 커밋 `e3b33fd`) 병합 완료

## 소유 경로

- `package.json`
- `package-lock.json`
- `capacitor.config.ts`
- `src/platform.ts`
- `src/ads.ts`
- `src/web.ts`
- `src/audio.ts`
- `src/ui/lobby.ts`
- `src/ui/screens.ts`
- `src/ui/style.css`
- `public/privacy.html`
- `public/support.html`
- `ios/`
- `android/`
- `tests/`
- `docs/research/ios-launch.md`
- `docs/tickets/T-125-ios-launch.md`

## 허용 의존성

- `@capacitor/ios` (`8.5.3` — iOS Capacitor 8 네이티브 빌드 타깃 추가, 사장님 사전 승인 완료)
- `@capacitor/haptics` (`8.0.2` — iOS/Android 네이티브 햅틱 피드백 구현, 사장님 사전 승인 완료)

## 참고 문서

- `AGENTS.md` (절대 규칙 1~7, 화면·콘텐츠·코드 원칙)
- `docs/TECH.md` §2·§4·§8·§11
- `docs/WEB-DEPLOY.md`, `vercel.json`
- `docs/research/ios-launch.md`

## 할 일

1. `docs/tickets/T-125-ios-launch.md` 및 `docs/research/ios-launch.md` 작성
2. `@capacitor/ios@8.5.3`, `@capacitor/haptics@8.0.2` 설치 및 `npx cap add ios`(SPM)
3. 안드로이드 AdMob 유지 + iOS AdMob 완전 제외 설정 및 `cap sync android`/`cap sync ios` 양쪽 검증
4. Xcode 프로젝트 설정: iPhone 전용(`TARGETED_DEVICE_FAMILY = "1"`), 세로 고정(`UIInterfaceOrientationPortrait`), 번들 ID(`io.github.kidariseok.defcon2`), 표시 이름(`데프콘 2: 화스트 페이스`), `PrivacyInfo.xcprivacy`(UserDefaults `CA92.1`) 생성 및 Resources Build Phase 등록
5. 코드 구현: `src/platform.ts`, `src/web.ts`, `src/ads.ts`, `src/audio.ts`, `src/ui/lobby.ts`, `src/ui/screens.ts`, `src/ui/style.css`, `public/privacy.html`, `public/support.html`
6. 단위 테스트 추가/보강(`tests/`) 및 `npm run verify` 통과
7. `npx cap sync ios` 및 `xcodebuild` 시뮬레이터 빌드 검증 + `.app` 번들 `Info.plist`/`PrivacyInfo.xcprivacy` 확인
8. 커밋·푸시 및 `main` 대상 PR 생성(병합 전 대기)

## 검증 명령

- `npm run verify`
- `npx cap sync ios`
- `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination "id=8349CC07-74C9-4B6C-9491-11FE7811B469" -derivedDataPath /tmp/defcon2-ios-dd build`

## 완료 조건

- [x] `docs/research/ios-launch.md` 작성 및 플랫폼 API·AdMob 제외 방식 근거 기록
- [x] `ios/` 생성, iPhone 전용·세로 고정·`PrivacyInfo.xcprivacy` 번들 포함 확인
- [x] `ios/App/CapApp-SPM/Package.swift` 및 iOS `capacitor.config.json`에 `@capacitor-community/admob` 미포함 확인(Android 유지)
- [x] 심사 필수 항목·햅틱·무광고 분기·회귀 방지(`startWeb`) 구현 완료
- [x] `npm run verify` 통과 (종료 코드 0)
- [x] `xcodebuild` 시뮬레이터 빌드 성공 및 `.app` 번들 검증 통과
- [x] `main` 대상 PR 생성(병합 전 대기)

## 작업 계획

1. 티켓·근거 문서 및 정적 정책 페이지(`public/privacy.html`, `public/support.html`) 작성
2. 패키지 설치 후 `@capacitor/cli` 플러그인 필터링 동작 확인 → `capacitor.config.ts` 구성 및 `npx cap add ios` / `cap sync` 검증
3. Xcode 프로젝트·`Info.plist`·`PrivacyInfo.xcprivacy` 구성
4. `src/` 코드 변경 및 `tests/` 단위 테스트 추가
5. `npm run verify` → `npx cap sync ios` → `xcodebuild` 시뮬레이터 빌드 및 `.app` 검증
6. 문서 갱신, 커밋·푸시, PR 생성

## 질문

(없음)

## 진행 기록

- 기준 커밋: `e3b33fd5f7c870f8dc12bdce6e2829883328b16d` (`origin/main`, PR #56 T-123 병합)
- 브랜치: `kidariseok/ios-stage1-launch`
- 세션 시작: Antigravity · Gemini 4 Neon (High), 2026-11-21
- [x] 0단계: `origin/main` 동기화 확인 (`e3b33fd` 포함 확인)
- [x] 1단계: 티켓(`T-125-ios-launch.md`), 근거 문서(`docs/research/ios-launch.md`) 및 정적 정책 페이지(`public/privacy.html`, `public/support.html`) 작성
- [x] 2단계: `@capacitor/ios@8.5.3`, `@capacitor/haptics@8.0.2` 설치, `capacitor.config.ts`의 `ios.includePlugins`로 iOS AdMob 완전 제외 + Android AdMob 유지 검증, `npx cap add ios`(SPM), iPhone 전용(`TARGETED_DEVICE_FAMILY = "1"`), 세로 고정, `PrivacyInfo.xcprivacy` 등록
- [x] 3단계: `src/platform.ts`, `src/web.ts`, `src/ads.ts`, `src/audio.ts`, `src/ui/lobby.ts`, `src/ui/screens.ts`, `src/ui/style.css`, `tests/ads.test.ts`, `tests/ios.test.ts` 구현
- [x] 4단계: `npm run verify`(27파일 400테스트·97에셋·빌드 EXIT 0), `npx cap sync ios`(3플러그인·AdMob 미포함), `xcodebuild` 시뮬레이터 빌드 성공 및 `.app` 번들 `Info.plist`/`PrivacyInfo.xcprivacy` 검증 완료
- [x] 5단계: 최종 커밋·푸시 및 `main` 대상 PR #57 생성
- [x] 6단계: 사장님 확정 지원 이메일(`kidariworking@gmail.com`) 반영, `npm run verify`·`npx cap sync ios` 재검증, PR #57 `main` 병합 및 프로덕션 URL 검증

## 결과 보고

- 바뀐 파일: `package.json`, `package-lock.json`, `capacitor.config.ts`, `src/platform.ts`, `src/ads.ts`, `src/web.ts`, `src/audio.ts`, `src/ui/lobby.ts`, `src/ui/screens.ts`, `src/ui/style.css`, `public/privacy.html`, `public/support.html`, `ios/`, `android/app/capacitor.build.gradle`, `android/capacitor.settings.gradle`, `tests/ads.test.ts`, `tests/ios.test.ts`, `docs/research/ios-launch.md`, `docs/tickets/T-125-ios-launch.md`
- 검증 결과:
  - `npm run verify`: EXIT 0 (`tsc --noEmit` 통과, Vitest 27파일 400테스트 통과, `assets:check` 97키 통과, `vite build` 통과)
  - `npx cap sync ios`: EXIT 0 (`@capacitor/app@8.1.2`, `@capacitor/haptics@8.0.2`, `@capacitor/preferences@8.0.1` 3종만 동기화, AdMob 미포함, `privacy.html`·`support.html` `kidariworking@gmail.com` 반영 확인)
  - `xcodebuild` 시뮬레이터 빌드(iPhone 18 Pro `8349CC07-74C9-4B6C-9491-11FE7811B469`): `** BUILD SUCCEEDED **` (EXIT 0), `.app` 번들 내 `PrivacyInfo.xcprivacy` `plutil -lint` OK 및 `Info.plist` (`io.github.kidariseok.defcon2`, `데프콘 2: 화스트 페이스`, `UIInterfaceOrientationPortrait`, `UIDeviceFamily=[1]`, iPad 오리엔테이션 미존재) 검증 통과
- 확인하지 못한 점: 실기기 테스트(검은 전장 재현 여부·실물 햅틱·무음 스위치), App Store Connect 등록, 1024×1024 알파 없는 앱 아이콘 제작(사장님 직접 작업)
- 다음 제안: 2단계(아이폰 실기기 확인·1024px 아이콘·App Store Connect 제출) 진행
