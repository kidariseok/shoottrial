# T-101 Capacitor 안드로이드 스파이크: 세로·Safe Area·뒤로가기 모달·저장·백그라운드 음소거

상태: 완료
담당: Antigravity · gemini-4-argon-high (역할 카드: `docs/agents/antigravity-build.md`)

## 목표

사용자 안드로이드 폰에 디버그 빌드가 설치된다. `/?scene=device` 화면에서 G0의 다섯 가지를 직접 확인할 수 있다.
- 세로 고정
- Safe Area 표시
- 뒤로가기 → 종료 확인 모달
- 저장 숫자가 재실행 후 유지
- 백그라운드에 다녀오면 소리 정지·재개

## 선행

- H-101(완료)
- R-101(완료. Capacitor 버전·플러그인 이벤트 이름의 근거)

## 소유 경로

- `package.json`
- `package-lock.json`
- `capacitor.config.ts`
- `android/`
- `index.html`
- `src/main.ts`
- `src/platform.ts`
- `src/save.ts`
- `src/audio.ts`
- `src/device.ts`
- `src/ui/screens.ts`
- `src/ui/style.css`
- `src/debug.ts`
- `tests/save.test.ts`
- `public/assets/sfx_click.m4a`

## 허용 의존성

R-101에서 확인한 버전으로 고정한다.
- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`
- `@capacitor/app`
- `@capacitor/preferences`

## 참고 문서

- `docs/research/play-launch.md` §6(Capacitor·플러그인), §2(타깃 API)
- `docs/TECH.md` §1, §3, §4, §5, §6, §11
- `AGENTS.md` 절대 규칙 5·6, 화면 원칙

## 할 일

0. **빌드 환경 확인**: `java -version`, `ANDROID_HOME`, Android Studio 설치 여부. 없으면 `## 질문`에 "설치 필요: <항목과 버전>"을 적고 멈춘다(공용 컴퓨터라 사용자가 설치한다).
1. **Capacitor 추가**
   - `appId`: U-101에서 사용자가 정한 패키지 이름. 아직 없으면 `io.github.kidariseok.defcon2`로 두고 `## 질문`에 남긴다
   - `appName`: "데프콘 2"
   - `webDir`: `dist`
   - `npx cap add android`
2. **세로 고정**: `AndroidManifest.xml`의 `screenOrientation="portrait"`
3. **`src/platform.ts`**(Capacitor import는 이 파일만)
   - `init()`
   - `safeRect()`
   - `onBack(cb)`, `onPause(cb)`, `onResume(cb)`
   - `exitApp()`
   - `prefsGet(key)`, `prefsSet(key, value)`
   - 브라우저에서는 `localStorage`·`visibilitychange`로 같은 동작을 한다
4. **`src/save.ts`**: `docs/TECH.md` §5 모양으로 `load()`/`save()`. 파싱에 실패하면 기본값
5. **`src/audio.ts`**: `docs/TECH.md` §6의 음소거 OR 규칙. 이번에는 `sfx_click` 하나와 반복음(테스트용 톤) 하나만
6. **뒤로가기**
   - `onBack` → `screens.ts`에 **레인 B 전용 함수** `confirmExit(onYes, onNo)`를 추가한다(§8 시그니처는 그대로 둔다)
   - 모달에서 "나가기"를 누르면 `exitApp()`, "계속"을 누르면 닫는다
7. **`src/device.ts` = `?scene=device`**(DOM 화면)
   - Safe Area 값 4개
   - 저장 카운터 "+1" 버튼(누를 때 저장)과 현재 값
   - 소리 켜기 버튼(반복음)
   - 뒤로가기 안내
8. **실기기**: `npm run build && npx cap sync android` → 디버그 APK
   - USB로 `npx cap run android`, 또는 APK 파일을 사용자에게 전달한다
   - 설치 방법을 결과 보고에 적는다

## 검증 명령

- `npm run verify`
- `npx cap sync android`(성공 로그 마지막 줄을 결과 보고에)

## 완료 조건

- [x] `npm run verify` 통과
- [x] 브라우저 스크린샷 `docs/shots/T-101.png`(`/?scene=device&safe=1`)
- [x] 디버그 APK 생성 경로 또는 `cap run` 성공 로그
- [x] `tests/save.test.ts`: 깨진 JSON이면 기본값, 저장 후 다시 불러오면 같은 값
- [x] P-101에서 사용자가 확인할 순서를 결과 보고에 적었다

디버그 URL: `http://localhost:5173/?scene=device&safe=1`

## 작업 계획

1. **Capacitor 패키지 설치 및 안드로이드 프로젝트 생성** (`package.json`, `package-lock.json`, `capacitor.config.ts`, `android/`)
   - R-101 기준 허용 의존성 고정 버전 설치: `@capacitor/core@8.5.3`, `@capacitor/cli@8.5.3`, `@capacitor/android@8.5.3`, `@capacitor/app@8.1.2`, `@capacitor/preferences@8.0.1`
   - `capacitor.config.ts` 작성 (`appId: 'io.github.kidariseok.defcon2'`, `appName: '데프콘 2'`, `webDir: 'dist'`)
   - `npx cap add android` 실행 및 `android/app/src/main/AndroidManifest.xml`의 `MainActivity`에 `android:screenOrientation="portrait"` 설정
2. **플랫폼 단일 래퍼 구현** (`src/platform.ts`, `index.html`, `src/ui/style.css`)
   - `@capacitor/*`를 유일하게 import하는 `src/platform.ts` 작성: `init()`, `safeRect()`, `onBack(cb)`, `onPause(cb)`, `onResume(cb)`, `exitApp()`, `prefsGet(key)`, `prefsSet(key, value)`
   - 브라우저 환경에서는 `localStorage`, `visibilitychange` 이벤트, `window.history`/키 이벤트로 동일 동작 폴백
3. **세이브 모듈 및 단위 테스트 구현** (`src/save.ts`, `tests/save.test.ts`)
   - `docs/TECH.md` §5의 `Save` 스키마 및 `d2_save_v1` 키로 `load()`/`save()` 구현 (파싱 실패 시 기본값 반환 + `save_corrupt` 로그)
   - `tests/save.test.ts` 작성: 깨진 JSON일 때 기본값 복구, 저장 후 다시 불러오면 동일한 값 반환 검증
4. **오디오 모듈 및 효과음 에셋 추가** (`src/audio.ts`, `public/assets/sfx_click.m4a`)
   - `docs/TECH.md` §6의 음소거 OR 규칙(사용자 설정 `bgm`/`sfx`와 시스템 정지 플래그 `hidden`/`ad` 결합) 구현
   - `public/assets/sfx_click.m4a` 효과음 1개와 테스트용 반복음(톤 루프) 재생/정지 구현, 백그라운드 전환 시 자동 정지·복귀 시 재개 및 첫 `pointerdown`에서 `AudioContext.resume()` 호출
5. **뒤로가기 종료 모달 및 `?scene=device` 화면 구현** (`src/ui/screens.ts`, `src/ui/style.css`, `src/device.ts`, `src/debug.ts`, `src/main.ts`)
   - `src/ui/screens.ts`에 `docs/TECH.md` §8 시그니처를 유지한 채 레인 B 전용 `confirmExit(onYes, onNo)` 모달 추가 ("나가기" → `exitApp()`, "계속" → 닫기)
   - `src/device.ts`에 `?scene=device` DOM 검증 화면 구현 (Safe Area 4방향 값, 저장 카운터 `+1` 버튼 및 현재 값, 반복음 켜기/끄기 버튼, 뒤로가기 모달 안내 및 테스트)
   - `src/main.ts`에 `platform.init()`, 오디오 백그라운드 연동, 뒤로가기 핸들러, `?scene=device` 진입 분기 연결
6. **검증, 스크린샷 캡처 및 안드로이드 디버그 APK 빌드** (`android/`)
   - `npm run verify` 및 `npx cap sync android` 실행
   - `http://localhost:5173/?scene=device&safe=1` 브라우저 스크린샷(`docs/shots/T-101.png`) 촬영
   - 디버그 APK 빌드(`android/gradlew assembleDebug`) 또는 `npx cap run android` 실행 후 설치 경로와 P-101 확인 순서를 결과 보고에 기록

- **플랫폼 API 및 확인 출처**:
  - `@capacitor/core`: `Capacitor.isNativePlatform()` (`docs/research/play-launch.md` §6, `https://capacitorjs.com/docs/basics/utilities`)
  - `@capacitor/app`: `App.addListener('backButton', ...)`, `App.addListener('pause', ...)`, `App.addListener('resume', ...)`, `App.addListener('appStateChange', ...)`, `App.exitApp()` (`docs/research/play-launch.md` 확인 표 `@capacitor/app` 이벤트, `https://capacitorjs.com/docs/apis/app`)
  - `@capacitor/preferences`: `Preferences.get({ key })`, `Preferences.set({ key, value })`, `Preferences.remove({ key })` (`docs/research/play-launch.md` 확인 표 `@capacitor/preferences` API, `https://capacitorjs.com/docs/apis/preferences`)
- **디버그 URL**: `http://localhost:5173/?scene=device&safe=1`
- **검증 명령**:
  - `npm run verify`
  - `npx cap sync android`

## 질문

- [x] 설치 필요: Android Studio 내장 JBR(`/Applications/Android Studio.app/Contents/jbr/Contents/Home`) 및 Android SDK(`~/Library/Android/sdk`, build-tools 36.0.0, platform-tools, licenses) 설치 확인 완료 — 중복 설치 없이 내장 JBR과 SDK를 그대로 사용합니다.
- [x] 패키지 이름(`appId`): `U-101`이 아직 대기 상태여서 티켓 지침대로 기본값 `io.github.kidariseok.defcon2`를 사용할 예정입니다. 다른 패키지 이름을 원하시면 알려주세요. (사용자 확인: `io.github.kidariseok.defcon2` 사용)
- [x] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요 (사용자 승인 완료)

## 진행 기록

- 기준 커밋: 4b7d27fec183
- 브랜치: kidariseok/start-ticket-t-101
- 세션 시작: Gemini 4 Argon (High), 2026-10-21 08:26 KST
- [x] 0단계 빌드 환경 점검 완료 (Android Studio 내장 JDK 및 `~/Library/Android/sdk` 설치 확인 완료)
- [x] 1단계 Capacitor 패키지 고정 설치(`@capacitor/core@8.5.3` 등), `capacitor.config.ts` 작성, `npx cap add android` 및 `AndroidManifest.xml` 세로 고정(`portrait`) 적용 완료
- [x] 2단계 `src/platform.ts` 단일 플랫폼 래퍼(`init`, `safeRect`, `onBack`, `onPause`, `onResume`, `exitApp`, `prefsGet`, `prefsSet`) 및 CSS Safe Area 변수 연동 완료
- [x] 3단계 `src/save.ts`(`d2_save_v1` `load`/`save`, 파싱 실패 시 `save_corrupt` 로그 및 기본값 반환) 및 `tests/save.test.ts` 단위 테스트 완료
- [x] 4단계 `src/audio.ts`(음소거 OR 규칙, 백그라운드 자동 정지·복귀 재개, `sfx_click` 및 반복음 제어) 및 `public/assets/sfx_click.m4a` 생성 완료
- [x] 5단계 `src/ui/screens.ts`(`confirmExit`, `handleBack`), `src/device.ts`(`?scene=device` G0 검증 화면), `src/ui/style.css`, `src/main.ts` 연동 완료
- [x] 6단계 `npm run verify`, `npx cap sync android`, 브라우저 스크린샷(`docs/shots/T-101.png`, `docs/shots/T-101-exit.png`), 디버그 APK(`android/app/build/outputs/apk/debug/app-debug.apk`) 생성 완료

## 결과 보고

- 바뀐 파일:
  - `package.json`, `package-lock.json`: `@capacitor/core@8.5.3`, `@capacitor/cli@8.5.3`, `@capacitor/android@8.5.3`, `@capacitor/app@8.1.2`, `@capacitor/preferences@8.0.1` 고정 추가
  - `capacitor.config.ts`: `appId: 'io.github.kidariseok.defcon2'`, `appName: '데프콘 2'`, `webDir: 'dist'` 설정
  - `android/`: `npx cap add android` 생성 및 `android/app/src/main/AndroidManifest.xml`의 `MainActivity`에 `android:screenOrientation="portrait"` 세로 고정 적용
  - `src/platform.ts`: Capacitor 플러그인을 import하는 유일한 파일로 `init()`, `safeRect()`, `onBack()`, `onPause()`, `onResume()`, `exitApp()`, `prefsGet()`, `prefsSet()` 및 브라우저 폴백(`localStorage`, `visibilitychange`, `popstate`/`Escape`) 구현
  - `src/save.ts`, `tests/save.test.ts`: `docs/TECH.md` §5 `Save` 스키마(`d2_save_v1`) `load()`/`save()`, 파싱 실패 시 `save_corrupt` 로그 및 기본값 반환, 단위 테스트 4종 추가
  - `src/audio.ts`, `public/assets/sfx_click.m4a`: `docs/TECH.md` §6 음소거 OR 규칙(`!bgm || !sfx || hidden || ad`), 클릭 효과음(`sfx_click.m4a`) 및 반복음(440Hz 테스트 톤), 백그라운드 진입 시 즉시 정지·복귀 시 자동 재개 및 첫 `pointerdown` 시 `AudioContext.resume()` 구현
  - `src/ui/screens.ts`, `src/ui/style.css`: `docs/TECH.md` §8 시그니처 유지, 레인 B 전용 `confirmExit(onYes, onNo)` 종료 확인 모달("계속" / "나가기") 및 `handleBack` 추가, `--sa-*` 변수에 Capacitor `SystemBars`(`--safe-area-inset-*`) 연동 및 `.device-screen` 스타일 추가
  - `src/device.ts`, `src/main.ts`: `?scene=device` G0 5대 항목 검증 DOM 화면(Safe Area 4개 값, 저장 카운터 `+1 저장`, 반복음·효과음 버튼, 뒤로가기 안내 및 모달 열기 버튼, 허구·생성형 AI 고지) 구현 및 안드로이드 네이티브 기본 진입 연결
  - `docs/shots/T-101.png`, `docs/shots/T-101-exit.png`: 390×844 세로 뷰포트 `/?scene=device&safe=1` 및 종료 확인 모달 스크린샷
- 검증 결과:
  - `npm run verify`:
    ```
    Test Files  9 passed (9)
         Tests  104 passed (104)
    ✓ built in 1.30s
    ```
  - `npx cap sync android`:
    ```
    [info] Found 2 Capacitor plugins for android:
           @capacitor/app@8.1.2
           @capacitor/preferences@8.0.1
    ✔ update android in 18.40ms
    [info] Sync finished in 0.028s
    ```
  - 디버그 APK 빌드 (`cd android && ./gradlew assembleDebug`):
    ```
    BUILD SUCCESSFUL in 48s
    153 actionable tasks: 153 executed
    생성 경로: android/app/build/outputs/apk/debug/app-debug.apk (4.4MB)
    ```
- 스크린샷:
  - `docs/shots/T-101.png` (`http://localhost:5173/?scene=device&safe=1`, 390×844)
  - `docs/shots/T-101-exit.png` (`confirmExit` 종료 확인 모달 활성 상태)
- 사용자 확인 방법:
  - **브라우저 확인**: `npm run dev` 실행 후 `http://localhost:5173/?scene=device&safe=1` 접속
  - **실기기 디버그 APK 설치 방법**:
    1. 안드로이드 폰에서 **설정 → 휴대전화 정보 → 소프트웨어 정보 → 빌드번호 7회 연타**로 개발자 옵션을 켜고 **USB 디버깅**을 활성화한 뒤 맥에 USB로 연결합니다.
    2. 터미널에서 아래 명령으로 바로 설치·실행합니다:
       ```sh
       ~/Library/Android/sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
       ```
       (또는 `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ANDROID_HOME="$HOME/Library/Android/sdk" npx cap run android`)
    3. 또는 생성된 `android/app/build/outputs/apk/debug/app-debug.apk` 파일을 폰으로 전송하여 직접 설치할 수 있습니다.
  - **P-101 (G0) 실기기 확인 순서 (5가지)**:
    1. **세로 고정**: 앱 실행 후 폰을 가로로 돌려도 화면이 회전하지 않고 세로(`Portrait`)로 고정되는지 확인합니다.
    2. **Safe Area 표시**: 초록색 점선 테두리(`?safe=1`)와 `1. Safe Area 및 세로 화면` 카드의 상단/우측/하단/좌측 px 값이 노치·상태 표시줄·하단 내비게이션 바 안쪽에 위치하는지 확인합니다.
    3. **저장 숫자 재실행 유지**: `2. 영구 저장 카운터`에서 `+1 저장` 버튼을 몇 번 눌러 숫자를 올린 뒤, 앱을 완전히 종료(최근 앱 목록에서 스와이프 제거)하고 다시 실행했을 때 같은 숫자가 유지되는지 확인합니다.
    4. **백그라운드 음소거·재개**: `3. 오디오 & 백그라운드 음소거`에서 `소리 켜기 (반복음)`을 눌러 톤 소리가 나는 상태에서 홈 버튼으로 앱을 백그라운드로 내리면 즉시 소리가 멈추고, 다시 앱으로 돌아오면 소리가 재개되는지 확인합니다.
    5. **뒤로가기 종료 확인 모달**: 기기의 뒤로가기(Back) 제스처·버튼을 누르면 즉시 종료되지 않고 `종료 확인` 모달이 뜨며, `계속`을 누르면 닫히고 `나가기`를 누르면 앱이 종료되는지 확인합니다.
- 확인하지 못한 점:
  - 현재 맥에 USB로 연결된 실물 안드로이드 기기(`adb devices` 목록 비어 있음)가 없어, 디버그 APK(`android/app/build/outputs/apk/debug/app-debug.apk`) 생성까지 완료하고 실기기 물리 장착 확인은 P-101 절차로 남겼습니다.
- 다음 제안:
  - P-101에서 실기기 Safe Area 픽셀값과 오디오·뒤로가기 동작을 확인한 뒤, M2 로비/전투 UI 연결 티켓으로 진행합니다.

## 인계 메모
