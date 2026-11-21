# 《데프콘 2: 화스트 페이스》 iOS 1단계 기술 근거 및 환경 조사

> **문서 식별자**: `docs/research/ios-launch.md` (`AGENTS.md` 절대 규칙 5 근거 문서)  
> **작성 일시**: 2026-11-21  
> **대상 저장소**: `kidariseok/shoottrial` (FIGHTSHOOT)  
> **기준 커밋**: `e3b33fd` (`main`, T-123 앱인토스 PR #56 병합 이후)  
> **환경**: macOS, Xcode 27.2 (Build 27B52), iOS 27.2 SDK  

---

## 1. 사장님 확정 결정 (2026-11-21) 및 전략 방향

사장님의 출시 결정에 따라, 1단계 iOS 앱스토어 출시는 광고 SDK·ATT 추적 종속성을 완전히 배제한 **"가장 빠르고 안전한 무광고 iPhone 전용 출시"** 전략으로 진행한다.

| 항목 | 확정 내용 | 기술적 영향 및 의사결정 |
|---|---|---|
| **지원 기기** | iPhone 전용 (`TARGETED_DEVICE_FAMILY = "1"`) | iPad 13" 필수 스크린샷 제출 면제, 태블릿 화면비 검증 생략 |
| **화면 방향** | 세로 고정 (Portrait Only) | `Info.plist`의 `UISupportedInterfaceOrientations`를 `UIInterfaceOrientationPortrait` 단일 항목으로 고정 |
| **식별자 / 표시 이름** | 번들 ID `io.github.kidariseok.defcon2`<br>표시 이름 `데프콘 2: 화스트 페이스` | 기존 안드로이드 번들 ID와 일치 유지, `Info.plist` `CFBundleDisplayName` 반영 |
| **광고 정책** | **iOS 첫 출시 무광고 (`hasAds() === false`)** | iOS 바이너리에서 `@capacitor-community/admob` 완전 제외, ATT/SKAdNetwork/`GADApplicationIdentifier` 불필요 |
| **출시 국가** | **대한민국 단독 출시** | Google UMP 동의 폼 및 EU 다국가 개인정보 동의 체계 면제 |
| **심사 필수 보강** | ① PX "준비 중" 해금 버튼 미노출<br>② 개인정보 처리방침 & 고객 지원 정적 페이지·앱 내 링크<br>③ 배경음 복구(`bgmEnabled = true`)<br>④ `@capacitor/haptics` 네이티브 진동 구현<br>⑤ 자발적 포기 / 패배 결과 문구 분리 유지 | 앱스토어 심사 지침 2.1(완성도), 4.2(최소 기능), 5.1.1(개인정보 처리방침) 사전 차단 |

---

## 2. Capacitor 8 의존성 버전 및 API 확인 근거

### 2.1 설치 패키지 및 버전 고정

| 패키지 | 버전 | 선정 근거 |
|---|---|---|
| `@capacitor/ios` | `8.5.3` | `@capacitor/core@8.5.3`, `@capacitor/cli@8.5.3`, `@capacitor/android@8.5.3`과 패치 버전까지 완전 일치 |
| `@capacitor/haptics` | `8.0.2` | Capacitor 8 공식 최신 안정판. iOS `UIImpactFeedbackGenerator` / `UINotificationFeedbackGenerator` / `UISelectionFeedbackGenerator` 지원 |

- `AGENTS.md` 절대 규칙 6 준수: `@capacitor/haptics`를 포함한 모든 `@capacitor/*` 플러그인은 오직 `src/platform.ts`에서만 import한다.
- Capacitor 8은 iOS 의존성 관리로 **SPM(Swift Package Manager)**을 기본 사용한다. CocoaPods Specs 저장소는 2026-12-02부터 읽기 전용 전환 예정이므로 CocoaPods를 사용하지 않고 SPM을 유지한다.

### 2.2 `@capacitor-community/admob` iOS 제외 방식 (안드로이드 유지)

- 배경: `package.json`에 안드로이드용 `@capacitor-community/admob`이 남아 있으므로, 기본 `npx cap sync ios`를 그대로 실행하면 `ios/App/CapApp-SPM/Package.swift`와 `ios/App/App/capacitor.config.json`에 Google Mobile Ads SDK가 포함될 위험이 있다. `GADApplicationIdentifier`가 없는 무광고 iOS 앱에 AdMob SDK가 링크되면 실행 직후 크래시가 발생하며 App Store 바이너리 검사에도 광고 SDK가 검출된다.
- 공식 Capacitor 8 근거 (`node_modules/@capacitor/cli/dist/declarations.d.ts:375-382`, `node_modules/@capacitor/cli/dist/plugin.js:12-21`):
  - `CapacitorConfig.ios.includePlugins?: string[]`는 iOS `cap sync`에 포함할 플러그인 허용 목록이며, 전역 `includePlugins`보다 우선한다.
  - `CapacitorConfig.android.includePlugins`를 지정하지 않으면 안드로이드는 `package.json` 의존성 전체를 그대로 탐색한다.
- 적용 설정 (`capacitor.config.ts`):
  ```ts
  ios: {
    includePlugins: ['@capacitor/app', '@capacitor/haptics', '@capacitor/preferences'],
  }
  ```
- 양 플랫폼 검증 결과:
  - `npx cap sync ios` → Found 3 Capacitor plugins: `@capacitor/app@8.1.2`, `@capacitor/haptics@8.0.2`, `@capacitor/preferences@8.0.1`
    - `ios/App/CapApp-SPM/Package.swift`: `capacitor-swift-pm(8.5.3)`, `CapacitorApp`, `CapacitorHaptics`, `CapacitorPreferences`만 포함(AdMob 미포함)
    - `ios/App/App/capacitor.config.json`: `packageClassList = ["AppPlugin", "HapticsPlugin", "PreferencesPlugin"]` (AdMob 미포함)
  - `npx cap sync android` → Found 4 Capacitor plugins: `@capacitor-community/admob@8.2.1`, `@capacitor/app@8.1.2`, `@capacitor/haptics@8.0.2`, `@capacitor/preferences@8.0.1` (안드로이드 AdMob 유지 확인)
- 추가 런타임 방어 (`src/platform.ts`): `isIos()`일 때 `hasAds() === false`, `initAds()` 즉시 반환, `showRewarded()` 즉시 `'failed'` 반환으로 AdMob 호출 경로를 이중 차단하였다.

---

## 3. iOS 프로젝트 및 앱스토어 필수 설정 규격

### 3.1 iPhone 전용 및 세로 고정
- `ios/App/App.xcodeproj/project.pbxproj`: Debug / Release 모든 앱 타깃 구성에 `TARGETED_DEVICE_FAMILY = "1"` 적용.
- `ios/App/App/Info.plist`:
  - `UISupportedInterfaceOrientations` = `["UIInterfaceOrientationPortrait"]`
  - `UISupportedInterfaceOrientations~ipad` 키 제거
  - `CFBundleDisplayName` = `데프콘 2: 화스트 페이스`

### 3.2 `PrivacyInfo.xcprivacy` (Apple 프라이버시 매니페스트)
- 경로: `ios/App/App/PrivacyInfo.xcprivacy` (Xcode `project.pbxproj` Resources Build Phase 등록 필수)
- 내용:
  - `NSPrivacyTracking`: `false`
  - `NSPrivacyTrackingDomains`: `[]`
  - `NSPrivacyCollectedDataTypes`: `[]`
  - `NSPrivacyAccessedAPITypes`: `NSPrivacyAccessedAPICategoryUserDefaults` → 사유 코드 `CA92.1` (`@capacitor/preferences`의 `UserDefaults` 접근 사유)

### 3.3 정적 정책 페이지 및 Vercel 호스팅 확인
- `vercel.json`에는 SPA catch-all rewrite가 설정되어 있지 않다(`docs/WEB-DEPLOY.md` 참조).
- `public/privacy.html`, `public/support.html`은 Vite 빌드 시 `dist/privacy.html`, `dist/support.html`로 그대로 복사되어 아래 운영 주소에서 정적 서빙된다:
  - 개인정보 처리방침: `https://newbie-defense.vercel.app/privacy.html`
  - 고객 지원 · 문의: `https://newbie-defense.vercel.app/support.html`
- 앱 내 생활관 행정반(설정) 패널 하단에 두 주소로 연결되는 외부 링크 버튼을 배치한다.

---

## 4. 개발 환경 iOS 시뮬레이터 목록 (Xcode 27.2 / iOS 27.2)

| 분류 | 기기명 | UDID | 용도 |
|---|---|---|---|
| **SE / 보급형** | **iPhone 17e** | `C13B070A-0C35-43BE-9B5C-0B6EFA3BDCCC` | 엔트리 콤팩트 화면비, Safe Area 마진 검증 |
| **6.1" ~ 6.3" 표준** | **iPhone 18 Pro** | `8349CC07-74C9-4B6C-9491-11FE7811B469` | Dynamic Island 표준 프로 규격, 기본 빌드 검증 대상 |
| **6.9" 대화면** | **iPhone 18 Pro Max** | `FB50A08C-0327-423F-A8C1-254F3A966F04` | 초대형 화면비, 하단 홈 인디케이터 여백 검증 |

---

## 5. 빌드 및 검증 기록 (2026-11-21)

- **`npm run verify`**: 종료 코드 `0`
  - `tsc --noEmit`: 통과
  - `vitest run`: Test Files `27 passed (27)`, Tests `400 passed (400)` (`tests/ios.test.ts` 11개 추가)
  - `assets:check`: 97개 에셋 키 통과
  - `vite build`: 통과 (`dist/privacy.html`, `dist/support.html` 출력 확인)
- **`npx cap sync ios`**: 종료 코드 `0` — 3개 플러그인(`app`, `haptics`, `preferences`)만 동기화, `Package.swift` 및 `capacitor.config.json` 내 `admob` 0건
- **`xcodebuild` 시뮬레이터 빌드**:
  - 명령: `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination "id=8349CC07-74C9-4B6C-9491-11FE7811B469" -derivedDataPath /tmp/defcon2-ios-dd build`
  - 결과: `** BUILD SUCCEEDED **` (종료 코드 `0`, iOS 27.2 Simulator SDK)
  - 번들 경로: `/tmp/defcon2-ios-dd/Build/Products/Debug-iphonesimulator/App.app`
  - `PrivacyInfo.xcprivacy` 번들 포함 및 `plutil -lint` `OK` (`NSPrivacyTracking=false`, `NSPrivacyCollectedDataTypes=[]`, `NSPrivacyAccessedAPICategoryUserDefaults` 사유 `CA92.1`)
  - `Info.plist` 검증 (`PlistBuddy`):
    - `CFBundleIdentifier`: `io.github.kidariseok.defcon2`
    - `CFBundleDisplayName`: `데프콘 2: 화스트 페이스`
    - `UISupportedInterfaceOrientations`: `["UIInterfaceOrientationPortrait"]`
    - `UIDeviceFamily`: `[1]` (iPhone 전용)
    - `UISupportedInterfaceOrientations~ipad`: 미존재 확인
