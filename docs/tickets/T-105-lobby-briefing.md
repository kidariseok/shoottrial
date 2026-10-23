# T-105 생활관(로비)·첫 실행·브리핑 4컷

상태: 완료
담당: Antigravity · gemini-4-argon-high (역할 카드: `docs/agents/antigravity-build.md`)

## 목표

앱을 켜면 바로 전투가 아니라 **첫 실행 → 브리핑 → 생활관 → 출동** 흐름이 된다. 지금은 `?scene` 없이 켜면 전투가 바로 시작된다.

## 선행

- T-104(같은 파일을 쓴다)

## 소유 경로

- `src/ui/lobby.ts`(새 파일)
- `src/ui/screens.ts`
- `src/ui/style.css`
- `src/ui/helpers.ts`
- `src/main.ts`
- `src/save.ts`
- `index.html`
- `tests/ui.test.ts`

## 허용 의존성

- 없음

## 참고 문서

- `docs/GDD.md` §2.1(도입 문구, 이름 기본값 "김신병", 허구 고지), §7(해금), §8(화면 명세: 첫 실행·로비·브리핑), §2.3(실명 정책)
- `docs/ART.md` §6(AI 표시 문구)
- `docs/TECH.md` §8: `lobby(): void`. A가 결과 화면의 "생활관"에서 battle 씬을 멈춘 뒤 부른다. 출동하면 B가 battle 씬을 다시 시작한다.

## 할 일

1. **흐름**: `?scene`이 없으면 다음 순서로 간다. `?scene=battle` 등 디버그 URL은 지금처럼 바로 연다.
   - `firstRun`이면: 첫 실행 → 브리핑 → 생활관
   - 아니면: 생활관
2. **첫 실행**(DOM)
   - 신병 이름 입력: 기본값 "김신병", 1~6자, 앞뒤 공백 제거, 비면 기본값.
   - 고지 두 줄: "이 게임은 허구이며 실제 인물·부대·사건과 관계없습니다." / "일부 그래픽은 생성형 AI로 제작되었습니다."
   - [확인]을 누르면 `save.name`을 저장하고 `firstRun = false`로 바꾼다.
3. **브리핑 4컷**: GDD §2.1의 네 문장을 한 컷씩 보여 준다.
   - 탭하면 다음 컷으로 간다. 오른쪽 위에 "건너뛰기"가 있다. `{이름}`은 저장된 이름으로 바꾼다.
   - 컷마다 배경은 어두운 화면 + 붉은 경보 점멸 정도로 둔다. 그림은 나중에 들어온다. 키는 `brief_1`~`brief_4`, 없으면 색 화면.
   - 소리 `sfx_siren`·`sfx_radio`는 파일이 있을 때만 난다.
   - 첫 실행 뒤에는 자동으로 띄우지 않는다. 생활관의 "브리핑 다시 보기"로 볼 수 있다.
4. **생활관**(DOM)
   - "출동" 큰 버튼
   - 병과 도감 6칸: 해금이면 이름·머리글자, 잠김이면 자물쇠 + "웨이브 5 도달로 해금"
     - 해금 목록 = `save.unlocked` ∪ localStorage `d2_unlocked`(레인 A가 Phase 6 전까지 여기에 쓴다)
   - 최고 기록: `save.bestWave`
   - 설정: BGM·효과음·진동·데미지 숫자. `save.settings`와 `audio.setSettings`를 쓴다.
   - 크레딧: 허구 고지, AI 고지, 오픈소스 목록(Phaser·Capacitor, MIT)
   - 안드로이드 뒤로가기는 기존 종료 확인 모달을 그대로 쓴다.
5. **출동**
   - battle 씬을 시작(또는 재시작)하고 생활관 DOM을 숨긴다.
   - 처음 출동하기 전까지는 Phaser `Game`이 battle 씬을 돌리지 않게 한다. 빈 씬으로 시작하거나 `start` 지연 중 하나로 고르고, 고른 이유를 티켓에 적는다.
6. **`lobby()`**: A가 부르면 생활관을 다시 띄운다(HUD·상점 패널·모달은 닫는다).
7. 테스트(`tests/ui.test.ts`): 이름 정리 헬퍼(공백·길이·빈 값), 해금 합집합 헬퍼, `{이름}` 치환 헬퍼.

## 검증 명령

- `npm run verify`

## 완료 조건

- [x] `npm run verify` 통과
- [x] `git diff origin/main -- src/ui/screens.ts | grep -E '^[+-]export'`에서 `lobby` 구현 외의 시그니처 변화 없음
- [x] 스크린샷(390×844): `docs/shots/T-105-first.png`(첫 실행), `T-105-brief.png`(브리핑 1컷), `T-105-lobby.png`(생활관)
- [x] 헤드리스 확인: localStorage를 비우고 `/`를 열면 첫 실행 → 확인 → 브리핑 → 건너뛰기 → 생활관 → 출동 → 전투 HUD가 뜬다. 같은 페이지에서 다시 `/`를 열면 바로 생활관이 뜬다. 결과 보고에 적는다.

디버그 URL: `http://localhost:5173/`(로컬 저장소를 비우면 첫 실행부터), `http://localhost:5173/?scene=battle`(기존대로)

## 작업 계획

1. **순수 헬퍼 추가 (`src/ui/helpers.ts`)**
   - 신병 이름 정리 헬퍼 `sanitizeRookieName(raw: string, fallback = '김신병'): string`(앞뒤 공백 제거, 최대 6자, 빈 값이면 기본값 반환)을 추가한다.
   - 해금 합집합 헬퍼 `mergeUnlockedCards(saveUnlocked: readonly string[], rawLocalUnlocked: string | null): string[]`(`save.unlocked` ∪ `localStorage['d2_unlocked']`)을 추가한다.
   - 브리핑 문구 치환 헬퍼 `formatBriefingText(template: string, name: string): string`(`{이름}`을 정리된 이름으로 치환)을 추가한다.
2. **첫 실행·브리핑 4컷·생활관(로비) DOM 모듈 작성 (`src/ui/lobby.ts`)**
   - **첫 실행**: 신병 이름 입력(기본값 `"김신병"`, 1~6자) + 허구 고지·생성형 AI 고지 2줄 + `[확인]` 버튼을 렌더링하고, 확인 시 `save.name` 저장 및 `firstRun = false`로 갱신한 뒤 브리핑 4컷으로 이동한다.
   - **브리핑 4컷**: GDD §2.1 문구를 4컷(`brief_1`~`brief_4`, 이미지 에셋이 있으면 표시하고 없으면 어두운 전술 배경 + 붉은 경보 점멸)으로 보여 주며, 화면 탭 시 다음 컷 진행, 우상단 `"건너뛰기"` 클릭 시 즉시 생활관으로 이동한다. `sfx_siren`·`sfx_radio`는 에셋 파일이 존재할 때만 재생한다.
   - **생활관**: `"출동"` 큰 버튼, 병과 도감 6칸(해금 시 이름·머리글자, 잠김 시 자물쇠 + `"웨이브 5 도달로 해금"`, `save.unlocked` ∪ `d2_unlocked`), 최고 기록(`save.bestWave`), 설정 토글(BGM·효과음·진동·데미지 숫자, `save.settings` 및 `audio.setSettings` 연동), `"브리핑 다시 보기"`, 크레딧(허구 고지·AI 고지·Phaser/Capacitor MIT)을 구성한다.
3. **`screens.ts`의 `lobby()` 구현 및 전투 UI 정리 (`src/ui/screens.ts`)**
   - `lobby()` 호출 시 전투 HUD·상점 패널·배너·모달을 모두 닫고 `openLobby()`를 호출해 생활관을 띄운다(기존 `export` 시그니처 유지).
4. **엔트리 흐름 및 첫 출동 전 `battle` 씬 대기 처리 (`src/main.ts`)**
   - **선택한 방식과 이유**: 빈 씬(`IdleScene`, 키 `'idle'`)을 두어 `?scene` 파라미터가 없을 때는 `[IdleScene, BattleScene, GalleryScene]` 순서로 Phaser `Game`을 생성한다. 이렇게 하면 캔버스와 스케일/리사이즈 동기화(`syncGameScale`)는 앱 시작부터 그대로 유지되면서도, 첫 `"출동"`을 누르기 전까지 `BattleScene`의 `preload`/`create`/`update`가 돌지 않는다. `"출동"` 클릭 시 `game.scene.start('battle')`로 전투를 시작(또는 재시작)한다.
   - `?scene`이 없으면 `save.firstRun`에 따라 `첫 실행 → 브리핑 → 생활관` 또는 바로 `생활관`을 열고, `?scene=battle` 등 디버그 URL은 기존대로 즉시 해당 씬을 연다.
5. **스타일 작성 (`src/ui/style.css`)**
   - 첫 실행 카드, 브리핑 4컷 화면(어두운 배경 + 붉은 경보 점멸 + 우상단 건너뛰기), 생활관 레이아웃(Safe Area 내부, 출동 버튼, 병과 도감 6칸 격자, 설정 스위치, 크레딧) 스타일을 추가한다.
6. **단위 테스트 및 헤드리스 흐름·스크린샷 검증 (`tests/ui.test.ts`)**
   - `tests/ui.test.ts`에 `sanitizeRookieName`, `mergeUnlockedCards`, `formatBriefingText` 단위 테스트를 추가하고 `npm run verify`를 통과시킨다.
   - 390×844 뷰포트에서 `docs/shots/T-105-first.png`, `docs/shots/T-105-brief.png`, `docs/shots/T-105-lobby.png`를 캡처하고, `localStorage` 초기화 후 `/` 진입 → 첫 실행 → 브리핑 → 생활관 → 출동 → 전투 HUD 및 재진입 시 바로 생활관 표시 흐름을 헤드리스로 검증한다.

- 확인할 디버그 URL: `http://localhost:5173/?safe=1`, `http://localhost:5173/?scene=battle&safe=1`
- 검증 명령: `npm run verify`
- 플랫폼 API: 기존 `src/save.ts`(`load`/`save`) 및 `src/platform.ts` 래퍼만 사용

## 질문

- [x] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요

## 진행 기록

- 기준 커밋: 9d99f12c02ee
- 브랜치: kidariseok/t104-ticket-work
- 세션 시작: Gemini 4 Argon (High), 2026-10-23 11:06
- [x] 1단계: `src/ui/helpers.ts`에 `sanitizeRookieName`, `mergeUnlockedCards`, `formatBriefingText` 추가
- [x] 2단계: `src/ui/lobby.ts`에 첫 실행, 브리핑 4컷, 생활관(도감·기록·설정·크레딧·출동) 구현
- [x] 3단계: `src/ui/screens.ts`의 `lobby()` 구현 (HUD·상점·배너·모달 숨김 후 생활관 표시)
- [x] 4단계: `src/main.ts`에 `IdleScene` 대기 및 `?scene` 미지정 시 첫 실행/생활관 진입 흐름 연결
- [x] 5단계: `src/ui/style.css`에 첫 실행·브리핑 4컷·생활관 스타일 추가
- [x] 6단계: `tests/ui.test.ts` 단위 테스트 추가, `npm run verify` 통과 및 390×844 스크린샷 3장·헤드리스 흐름 확인 완료

## 결과 보고

- 바뀐 파일:
  - `src/ui/helpers.ts`: `sanitizeRookieName`, `mergeUnlockedCards`, `formatBriefingText`, `ALL_CARDS` 추가
  - `src/ui/lobby.ts` (신규): 첫 실행(이름 입력 1~6자·허구/AI 고지 2줄·`[확인]` 저장), 브리핑 4컷(GDD §2.1 4컷·탭 이동·`"건너뛰기"`·파일 존재 시에만 `sfx_siren`·`sfx_radio` 재생), 생활관(`"출동"` 큰 버튼·병과 도감 6칸 `save.unlocked` ∪ `d2_unlocked`·최고 기록·설정 4종 토글·`"브리핑 다시 보기"`·크레딧) 구현
  - `src/ui/screens.ts`: `lobby()` 호출 시 전투 HUD·상점 패널·배너·모달을 모두 닫고 생활관 화면을 열도록 구현
  - `src/main.ts`: `?scene` 미지정 시 빈 씬(`IdleScene`, 키 `'idle'`)으로 Phaser `Game`을 시작해 첫 출동 전까지 `BattleScene`이 돌지 않게 하고(캔버스/리사이즈 동기화 유지), `firstRun` 여부에 따라 `첫 실행 → 브리핑 → 생활관` 또는 `생활관`으로 진입하도록 연결 (`"출동"` 클릭 시 `game.scene.start('battle')`)
  - `src/ui/style.css`: 첫 실행, 브리핑 4컷, 생활관 Safe Area 내부 스타일 추가
  - `tests/ui.test.ts`: `sanitizeRookieName`, `mergeUnlockedCards`, `formatBriefingText` 단위 테스트 추가
  - `docs/shots/T-105-first.png`, `docs/shots/T-105-brief.png`, `docs/shots/T-105-lobby.png`: 390×844 스크린샷 3장
- 검증 결과:
  - `npm run verify` 통과 (`tsc --noEmit`, `vitest run` 15 files / 228 tests 통과, `assets:check` 통과, `vite build` 성공)
  - `git diff origin/main -- src/ui/screens.ts | grep -E '^[+-]export'` → `-export function lobby(): void {}` / `+export function lobby(): void {`
  - 헤드리스 확인: `localStorage.clear()` 후 `/?safe=1` 진입 시 첫 실행(`신병 성명 입력`, 기본값 `"김신병"`, 전투 HUD 숨김) → `[확인]` 클릭 시 브리핑 1컷(`컷 1 / 4 · 자대 배치 첫날 밤`) → `[건너뛰기]` 클릭 시 생활관(`이등병 김신병`, 도감 6칸 중 해금 3·잠김 3) → `[출동]` 클릭 시 생활관 숨김 및 전투 HUD(`웨이브 1/10`) 표시 확인. 이후 같은 페이지에서 다시 `/?safe=1` 진입 시 첫 실행·브리핑 없이 바로 생활관(`ui-lobby-overlay mode-lobby`)이 뜨는 것 확인
- 스크린샷: `docs/shots/T-105-first.png`, `docs/shots/T-105-brief.png`, `docs/shots/T-105-lobby.png`
- 사용자 확인 방법: `npm run dev` 실행 후 `http://localhost:5173/?safe=1` 접속 (첫 실행부터 다시 보려면 브라우저 콘솔에서 `localStorage.clear(); location.reload()` 실행)
- 확인하지 못한 점: 브리핑 배경 그림(`brief_1`~`brief_4`)과 `sfx_siren`·`sfx_radio` 음원 파일은 아직 에셋에 없으므로 어두운 경보 점멸 배경 및 조용한 폴백으로 동작함
- 다음 제안: 레인 A 결과 화면의 `"생활관"` 버튼 콜백에서 `battle` 씬 정지 후 `ui.lobby()` 호출 연결 및 브리핑 컷 일러스트(`brief_1`~`brief_4`) 에셋 추가

## 인계 메모
