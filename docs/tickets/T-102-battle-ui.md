# T-102 전투 UI(DOM): HUD·상점 패널·카드 정보·배너·결과·부활·일시정지 모달 + UI 데모

상태: 대기
담당: Antigravity · gemini-4-argon-high (역할 카드: `docs/agents/antigravity-build.md`)

## 목표

`src/ui/screens.ts`의 빈 함수(`docs/TECH.md` §8)가 실제 DOM 화면으로 채워진다. 레인 A(Claude)의 전투 코드가 아직 없어도 `/?scene=ui&safe=1`에서 가짜 값으로 모든 화면을 차례로 볼 수 있다. 결은 Figma "계급 및 조종 패널/메뉴"(`6:33`)의 올리브·카키 군용 패널이다(그림 파일 없이 CSS로).

## 선행

- H-101(완료)

## 소유 경로

- `src/ui/`
- `src/main.ts`
- `src/debug.ts`
- `tests/ui.test.ts`

## 허용 의존성

- 없음

## 참고 문서

- `docs/TECH.md` §8(시그니처·`BattleCtl`·경계 규칙 전부), §9, §11
- `docs/GDD.md` §3(화면 배치 그림), §4.2(부활), §5.3(합성·계급), §5.4(시너지 표시), §8(화면 명세), §10(광고 지점)
- `docs/research/figma-inventory.md` `6:33` 행, `docs/ART.md` §1·§2(색 규칙: 붉은색은 적·경보에만)
- Figma 노드 `6:33`(접근 가능하면 스크린샷으로 색·모서리·두께를 따른다. 불가하면 inventory 설명만으로)

## 할 일

1. **`hud(h)`**
   - 좌상단 일시정지 버튼, 상단 중앙 "웨이브 n/10" + 데프콘 배지(2 = 주황, 1 = 붉은 점멸)
   - 보급·위병소 HP, 준비 단계 남은 초, 2배속 토글
   - 왼쪽 세로 줄에 활성 시너지(아이콘 자리 + 인원 수, 켜진 것은 밝게)
   - 값이 바뀔 때만 DOM을 갱신한다
2. **`shop(open, …)`**
   - 준비 단계에 화면 하단에서 올라오는 패널
   - 카드 5칸(이름·비용·보직 머리글자 자리), 리롤(비용 표시), 무료 리롤(광고 아이콘, 지금은 버튼만), "출동!" 버튼
   - 보급이 모자란 카드는 어둡게 표시한다
   - 패널 높이는 GDD §3의 하단 영역(y=1160~1280, 논리 좌표)을 넘지 않게 CSS 변수로 둔다
3. **`cardInfo(card, rank)`**: 카드 정보 시트(계급, 수치 자리, 고유 능력, 시너지). 수치는 아직 없으니 인자로 받은 이름·계급만 쓰고 나머지 칸은 "—"로 둔다
4. **`banner(text, kind)`**: 화면 가운데 1.5초 배너. flag = 붉은 경고, defcon = 붉은 테두리 점멸, info = 카키
5. **`result(r, …)`**: 승패, 도달 웨이브, 처치 수, 새 해금 카드, "다시 출동"·"생활관" 버튼
6. **`askRevive(onYes, onNo)`**: "광고 보고 부활" 모달(지금은 광고 없이 바로 `onYes` 호출 버튼 + 안내 문구 "광고는 M4에서 연결")
7. **`bindBattle(ctl)`**
   - 일시정지 버튼 → `ctl.pause()` + 일시정지 모달(계속 → `ctl.resume()`, 포기 → `ctl.quit()`)
   - 2배속 버튼 → `ctl.setSpeed()`
   - 무료 리롤·긴급 보급 버튼은 지금은 광고 없이 `ctl.adReroll()`·`ctl.adSupply()`를 바로 호출한다(M4에서 광고 연결)
   - `ctl`이 `null`이면 이 버튼들을 숨긴다
8. **UI 데모 `?scene=ui`**: `main.ts`에서 `scene=ui`이면 Phaser를 띄우지 않고(또는 빈 배경만) `src/ui/demo.ts`가 위 함수들을 가짜 값으로 3초 간격으로 차례 호출한다. 가짜 `BattleCtl`은 `console.log`만 한다
9. **테스트 `tests/ui.test.ts`**: DOM 없이 검사할 수 있는 순수 부분만(예: 숫자 포맷, 시너지 정렬). 없으면 `hud()`의 "같은 값이면 갱신 안 함" 판정 함수를 분리해 테스트한다

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] `docs/shots/T-102-hud.png`(`/?scene=ui&safe=1`, 390×844, HUD + 상점 열림)
- [ ] `docs/shots/T-102-result.png`(결과 화면), `docs/shots/T-102-pause.png`(일시정지 모달)
- [ ] Figma `6:33`과 나란히 놓은 비교 사진 `docs/shots/T-102-compare.png`(Figma 접근이 안 되면 결과 보고에 그 사실을 적는다)
- [ ] `screens.ts`의 export 시그니처가 TECH §8과 글자 그대로 같다(결과 보고에 `git diff origin/main -- src/ui/screens.ts`의 export 줄 변화 없음 확인)

디버그 URL: `http://localhost:5173/?scene=ui&safe=1`

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
