# T-105 생활관(로비)·첫 실행·브리핑 4컷

상태: 대기 (T-104 머지 뒤 시작: `screens.ts`·`style.css`를 같이 쓴다)
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

- [ ] `npm run verify` 통과
- [ ] `git diff origin/main -- src/ui/screens.ts | grep -E '^[+-]export'`에서 `lobby` 구현 외의 시그니처 변화 없음
- [ ] 스크린샷(390×844): `docs/shots/T-105-first.png`(첫 실행), `T-105-brief.png`(브리핑 1컷), `T-105-lobby.png`(생활관)
- [ ] 헤드리스 확인: localStorage를 비우고 `/`를 열면 첫 실행 → 확인 → 브리핑 → 건너뛰기 → 생활관 → 출동 → 전투 HUD가 뜬다. 같은 페이지에서 다시 `/`를 열면 바로 생활관이 뜬다. 결과 보고에 적는다.

디버그 URL: `http://localhost:5173/`(로컬 저장소를 비우면 첫 실행부터), `http://localhost:5173/?scene=battle`(기존대로)

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
