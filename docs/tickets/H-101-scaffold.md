# H-101 스캐폴드: Vite + Phaser 4 + verify + 디버그 파라미터 + 에셋 플레이스홀더·갤러리 + UI 경계 빈 함수

상태: 진행 중
담당: Antigravity · gemini-4-argon-high (역할 카드: `docs/agents/antigravity-build.md`)

## 목표

`npm run verify`가 통과하는 빈 게임 프로젝트가 생긴다.
- 세로 **720×1280** 논리 해상도
- `/?scene=gallery&fps=1&safe=1`에서 `docs/ART.md` §4의 모든 에셋 키가 **같은 크기·같은 프레임 수의 단색 플레이스홀더**로 이름표와 함께 보인다.
- `/?scene=battle&safe=1`에서 레인 A의 스텁 `BattleScene`("전투 화면" 문구)이 보인다.
- 아울러 Antigravity 훅(Stop·PreToolUse·PostToolUse)과 **브랜치 자동 저장**이 실제로 동작하는지 확인하고 기록한다.

## 선행

- 없음(R-101과 동시에 진행해도 된다. Capacitor는 T-101에서 넣는다)

## 소유 경로

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `src/main.ts`
- `src/debug.ts`
- `src/assets.ts`
- `src/gallery.ts`
- `src/ui/screens.ts`
- `src/ui/style.css`
- `public/assets/index.json`
- `tests/debug.test.ts`
- `tests/assets.test.ts`

## 허용 의존성

- `phaser`
- `typescript`
- `vite`
- `vitest`

## 참고 문서

- `docs/TECH.md` §1, §2, §3, §8, §9, §10, §11
- `docs/ART.md` §2, §4(에셋 계약 표 전체)
- `src/battle/BattleScene.ts`(레인 A 스텁. **읽기만 한다. 고치면 Stop 훅이 막는다**)

## 할 일

1. **패키지**
   - `phaser@4.2.1`(정확한 버전 고정), 개발용 `typescript`·`vite`·`vitest`
   - scripts

     | 이름 | 명령 |
     |---|---|
     | `dev` | `vite --host` |
     | `build` | `vite build` |
     | `typecheck` | `tsc --noEmit` |
     | `test` | `vitest run --passWithNoTests` |
     | `verify` | `npm run typecheck && npm run test && npm run build` |

2. **tsconfig**
   - `strict: true`, `noUncheckedIndexedAccess: true`, `moduleResolution: "bundler"`, `esModuleInterop: true`
   - Phaser 4.2.1은 `import { Scene, Game } from 'phaser'`처럼 이름으로 가져온다(스텁이 이 방식이다).
3. **`index.html`**
   - viewport: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`
   - 구조: `#game`(캔버스 부모) + `#ui`(DOM 오버레이, 위에 겹침)
   - CSS: `touch-action:none; user-select:none; -webkit-touch-callout:none; overflow:hidden`, 배경 `#0b0d12`
   - CSS 변수 `--sa-top/right/bottom/left`의 기본값은 `env(safe-area-inset-*)`
4. **`src/main.ts`**: Phaser 게임 설정
   - **너비 720 고정. 높이는 화면 비율로 계산해 1280~1560 사이로 제한한다**
   - Scale `FIT` + 가운데 정렬, `pixelArt: true`(픽셀풍 에셋이라 최근접 확대, `docs/ART.md` §2)
   - 씬: `BattleScene`(`./battle/BattleScene`), `GalleryScene`(`./gallery`)
   - `debug.scene` 값으로 시작 씬을 고른다. 기본값은 `battle`이다(로비는 M2에서 레인 B가 만든다). `scene=log`도 `battle` 씬으로 시작한다(레인 A가 그 안에서 기록 화면을 그린다)
5. **`src/debug.ts`**
   - `docs/TECH.md` §9의 파라미터를 타입이 있는 객체 하나(`debug`)로 해석한다. 숫자·목록 파싱 포함(`deck=rifle:4,sniper:2` → `[{card:'rifle', n:4}, …]`)
   - `?seed=`가 있으면 그 값으로, 없으면 `Date.now()`로 초기화하는 결정적 난수 `rand()`(mulberry32 정도의 짧은 함수)
   - `?fps=1`: 우하단에 FPS·활성 오브젝트 수(DOM)
   - `?safe=1`: Safe Area 경계를 초록 테두리(DOM)
6. **`src/assets.ts` + `src/gallery.ts`**
   - `docs/ART.md` §4의 모든 키를 표 하나로 옮긴다: `{ key, w, h, frames(최소), color, label }`. 카드 키는 `rifle·sniper·blower·cook·miner·chem`으로 펼친다
   - 부팅 때 `public/assets/index.json`(있는 파일의 키 목록, 지금은 `[]`)을 읽는다
     - 있는 키는 PNG를 로드한다
     - 없는 키는 **같은 크기 × 프레임 수의 단색 사각형 + 이름표**를 런타임 텍스처로 만든다. 프레임 경계에 1px 선
   - 로드한 PNG가 계약과 다르면(높이 ≠ h, 너비가 w의 배수가 아님) 콘솔에 경고하고 갤러리에서 빨간 테두리로 표시한다
   - 갤러리: 모든 키를 격자로 보여 주고 키 이름·크기·프레임 수를 적는다. 세로로 드래그해 스크롤한다
7. **`src/ui/screens.ts`**: `docs/TECH.md` §8의 타입과 함수 시그니처를 **글자 그대로** 옮기고, 본문은 비워 둔다(`// T-102에서 구현`). 레인 A가 이 파일을 import해 타입 검사를 통과해야 한다.
8. **테스트**
   - `tests/debug.test.ts`: 파라미터 파싱, 같은 시드면 같은 난수열
   - `tests/assets.test.ts`: 계약 표에 ART §4의 키가 모두 있고 중복이 없다
9. **하네스 확인**(결과를 `## 진행 기록`에 적는다)
   - 턴이 끝날 때 Stop 훅이 돌았는가
   - `git log origin/<지금 브랜치> -1`로 자동 저장이 **지금 브랜치**에 push됐는가(main이 아니다)
   - 일부러 `docs/GDD.md`에 공백을 하나 넣어 보고, Stop 훅이 "소유 경로 밖"으로 막는지 확인한 뒤 되돌린다
   - `git push`를 실행하려 하면 cmd-guard가 막는가

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] 갤러리 스크린샷 `docs/shots/H-101.png`(`/?scene=gallery&fps=1&safe=1`, 390×844)
- [ ] 전투 스텁 스크린샷 `docs/shots/H-101-battle.png`(`/?scene=battle&safe=1`)
- [ ] 갤러리 키 개수 = ART §4 키 개수(결과 보고에 숫자)
- [ ] 하네스 확인 4가지를 진행 기록에 적었다

디버그 URL: `http://localhost:5173/?scene=gallery&fps=1&safe=1`

## 작업 계획

1. **프로젝트 설정 및 의존성 설치** (`package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`)
   - `phaser@4.2.1` 고정 및 개발 의존성(`typescript`, `vite`, `vitest`) 설치, `dev`·`build`·`typecheck`·`test`·`verify` 스크립트 설정
   - `tsconfig.json`(`strict: true`, `noUncheckedIndexedAccess: true`, `moduleResolution: "bundler"`, `esModuleInterop: true`) 및 `vite.config.ts` 작성
2. **HTML·CSS·UI 경계 스텁 및 디버그 모듈 구현** (`index.html`, `src/ui/style.css`, `src/ui/screens.ts`, `src/debug.ts`)
   - `#game` + `#ui` DOM 오버레이 구조와 Safe Area CSS 변수(`--sa-top/right/bottom/left`) 설정
   - `docs/TECH.md` §8 고정 시그니처 그대로 `src/ui/screens.ts` 빈 함수 작성(`// T-102에서 구현`)
   - `docs/TECH.md` §9 URL 파라미터 파싱(`debug`), 시드 기반 결정적 난수 `rand()`(mulberry32), `?fps=1`·`?safe=1` DOM 표시 구현
3. **에셋 계약 표·런타임 플레이스홀더 및 갤러리·부팅 씬 구현** (`public/assets/index.json`, `src/assets.ts`, `src/gallery.ts`, `src/main.ts`)
   - `docs/ART.md` §4의 모든 키(아군 6종×6키=36, 적 11키, 이펙트·판·UI 16키, 총 63개 키)를 계약 표로 정의하고 `public/assets/index.json`(`[]`) 기반 로드 및 단색 사각형+이름표+1px 프레임 경계선 플레이스홀더 텍스처 생성 구현
   - 격자 표시·세로 드래그 스크롤·크기/프레임 수/계약 불일치 빨간 테두리를 지원하는 `GalleryScene` 및 720×(1280~1560) `Scale.FIT` + `pixelArt: true` 설정의 `src/main.ts` 작성
4. **단위 테스트 작성 및 검증** (`tests/debug.test.ts`, `tests/assets.test.ts`)
   - URL 파라미터 파싱(`deck=rifle:4,sniper:2` 등)과 동일 시드 난수열 테스트, 에셋 계약 표 전수·중복 없음 테스트 작성 후 `npm run verify` 실행
5. **하네스 동작 확인 및 기록** (`docs/tickets/H-101-scaffold.md`)
   - Stop 훅 동작, 현재 브랜치(`kidariseok/h101-gallery-scaffold`) 자동 저장 push 여부, `docs/GDD.md` 임시 수정 후 소유 경로 밖 차단 확인 및 원복, `git push` cmd-guard 차단 확인을 수행하고 `## 진행 기록`에 기록

- **결과 확인 디버그 URL**:
  - `http://localhost:5173/?scene=gallery&fps=1&safe=1`
  - `http://localhost:5173/?scene=battle&safe=1`
- **검증 명령**: `npm run verify`
- **플랫폼 API**: 없음 (Capacitor는 T-101에서 도입)

## 질문

- [ ] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요

## 진행 기록

- 기준 커밋: 294b3331124f
- 브랜치: kidariseok/h101-gallery-scaffold
- 세션 시작: Gemini 4 Argon (High), 2026-10-20 17:05

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
