# T-101 Capacitor 안드로이드 스파이크: 세로·Safe Area·뒤로가기 모달·저장·백그라운드 음소거

상태: 대기
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

- [ ] `npm run verify` 통과
- [ ] 브라우저 스크린샷 `docs/shots/T-101.png`(`/?scene=device&safe=1`)
- [ ] 디버그 APK 생성 경로 또는 `cap run` 성공 로그
- [ ] `tests/save.test.ts`: 깨진 JSON이면 기본값, 저장 후 다시 불러오면 같은 값
- [ ] P-101에서 사용자가 확인할 순서를 결과 보고에 적었다

디버그 URL: `http://localhost:5173/?scene=device&safe=1`

## 작업 계획

## 질문

## 진행 기록

- 기준 커밋: (/start-ticket이 적는다)
- 브랜치: (/start-ticket이 적는다)
- 세션 시작: (모델, 시각)

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
