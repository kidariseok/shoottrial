# H-001 프로젝트 스캐폴드 + verify + 디버그 파라미터 + 플레이스홀더 + 하네스 보정

상태: 대기
담당: Antigravity · gemini-4-argon-high

## 목표

`npm run verify`가 통과하는 빈 게임 프로젝트가 생긴다.
- `/?scene=gallery&fps=1&safe=1`에서 P2용 에셋 키 15개가 단색 플레이스홀더로 보인다.
- `/?scene=battle`에서 빈 전장(바닥선)과 플레이어 플레이스홀더가 보인다.
- 아울러 Antigravity 훅(Stop·PreToolUse·PostToolUse)이 실제로 동작하는지 확인하고 기록한다.

## 선행

- R-001(설정 파일 형식 확인용. 아직이면 `docs/TECH.md` §4의 ✅ 항목만으로 진행하고 `## 질문`에 남긴다)

## 소유 경로

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `apps-in-toss.config.ts`
- `src/main.ts`
- `src/debug.ts`
- `src/assets.ts`
- `src/battle/BattleScene.ts`
- `src/battle/GalleryScene.ts`
- `src/ui/style.css`
- `public/assets/index.json`
- `tests/debug.test.ts`
- `.gitignore`

## 허용 의존성

- `phaser`
- `@apps-in-toss/web-framework`
- `typescript`
- `vite`
- `vitest`

## 참고 문서

- `docs/TECH.md` §1, §2, §3, §8
- `docs/ART.md` §4(에셋 계약 표: 단계가 P2인 줄)
- `AGENTS.md` '디버그 URL'
- `docs/research/platform-api.md` §11(있으면)

## 할 일

1. **패키지**
   - `phaser@4.2.1`, `@apps-in-toss/web-framework@3.8.0`(정확한 버전 고정), 개발용 `typescript`·`vite`·`vitest`
   - scripts

     | 이름 | 명령 |
     |---|---|
     | `dev` | `vite --host` |
     | `build` | `vite build` |
     | `typecheck` | `tsc --noEmit` |
     | `test` | `vitest run --passWithNoTests` |
     | `verify` | `npm run typecheck && npm run test && npm run build` |

   - `.ait` 빌드 명령은 R-001 결과대로 `build:ait`로 추가한다. 없으면 `## 질문`에 남긴다.
2. **tsconfig**: `strict: true`, `noUncheckedIndexedAccess: true`, `moduleResolution: bundler`
3. **`apps-in-toss.config.ts`**
   - SDK 3.x 형식: `defineConfig({ appName, brand, webView, permissions: [], webBundleDir: 'dist' })`
   - `appName`은 U-01 값, 아직 없으면 `qrf-dev`
   - 가로 모드·내비게이션 바·WebView 옵션은 R-001에서 확인된 것만 넣는다.
4. **`index.html`**
   - viewport: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`
   - 구조: `#game`(캔버스 부모) + `#ui`(DOM 오버레이, 위에 겹침)
   - CSS: `touch-action:none; user-select:none; -webkit-touch-callout:none; overflow:hidden`
   - CSS 변수 `--sa-top/right/bottom/left`의 기본값은 `env(safe-area-inset-*)`. T-001에서 SDK 값으로 덮어쓴다.
5. **`src/main.ts`**: Phaser 게임 설정
   - 높이 360 고정, 너비는 화면 비율로 계산(640~800 사이로 제한)
   - `pixelArt: true`, `roundPixels: true`, Scale `FIT` + 가운데 정렬
   - 세계 좌표는 0~640을 유지하고, 남는 가로폭은 카메라를 가운데로 옮겨 처리한다(`docs/TECH.md` §3)
   - `debug.scene` 값에 따라 시작 씬을 고른다. 기본값은 `battle`.
6. **`src/debug.ts`**: `parseDebug(search: string)` 순수 함수(scene, stage, wave, god, seed, fps, safe)와 `export const debug = parseDebug(location.search)`. `tests/debug.test.ts`로 검사한다.
7. **`src/assets.ts`**: `docs/ART.md` §4의 P2 줄을 그대로 옮긴 표(key, w, h, frames, color)
   - `preload(scene)`: `public/assets/index.json`(처음엔 `[]`)에 있는 키만 파일로 불러온다.
   - `ensurePlaceholders(scene)`: 파일이 없는 키는 같은 크기·프레임 수의 단색 스프라이트시트를 런타임에 만든다.
     - 프레임마다 작은 점 개수로 프레임 번호를 표시한다.
     - 적 키에는 크림슨 점(눈)을 찍는다.
   - **진짜 그림을 넣을 때는 `public/assets/<key>.png`를 추가하고 `index.json`에 키를 적기만 하면 된다.**
8. **`GalleryScene`**: 모든 키를 격자로 그리고 키 이름을 표시한다. 애니메이션 키는 재생한다.
9. **`BattleScene`(빈 껍데기)**: 하늘색 배경, y=200 바닥선, 플레이어 플레이스홀더를 (320, 280)에 둔다.
10. **오버레이**
    - `?fps=1`: 좌하단에 FPS와 활성 오브젝트 수
    - `?safe=1`: DOM으로 Safe Area 테두리(초록)와 우측 상단 금지 구역(붉은 반투명, 임시 110×52 CSS px) 표시
11. **하네스 보정**(이 티켓에서만 하는 일, 결과를 `## 진행 기록`에 적는다)
    1. `.harness/tool-log.jsonl`이 생기는지 확인한다. 생기면 PostToolUse 훅이 동작하는 것이다. 지금까지 쓴 **도구 이름 목록**을 적는다.
    2. 소유 경로 밖에 `scratch.txt`를 만들고 턴을 끝내 본다. Stop 훅이 `[stop-gate 1/3] 소유 경로 밖 변경` 메시지로 되돌려 보내면 성공이다. 확인 후 `scratch.txt`를 지운다.
    3. `git push --dry-run`을 실행해 본다. `[cmd-guard]` 메시지로 거부되면 성공이다.
    4. `apps-in-toss-docs` MCP 도구가 보이는지 확인한다. 보이면 "리더보드"를 검색해 응답이 오는지 본다.
    5. 하나라도 동작하지 않으면 증상을 `## 질문`에 `- [ ]`로 적는다. **하네스 파일(`.agents/`, `scripts/harness/`)은 직접 고치지 않는다.**

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과(typecheck, test, build)
- [ ] `tests/debug.test.ts` 통과: 빈 문자열, `?scene=gallery&god=1&seed=42`, 잘못된 값
- [ ] `/?scene=gallery&fps=1&safe=1`에 P2 키 15개가 이름과 함께 보이고, 애니메이션 키가 움직인다
- [ ] `/?scene=battle`에 바닥선과 플레이어 플레이스홀더
- [ ] 하네스 보정 1~4 결과 기록
- [ ] 스크린샷 `docs/shots/H-001.png`(gallery)

디버그 URL: `http://localhost:5173/?scene=gallery&fps=1&safe=1`

## 작업 계획

## 질문

## 진행 기록

- 세션 시작:

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
