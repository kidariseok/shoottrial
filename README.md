# 데프콘 2: 화스트 페이스 (가제)

구글 플레이용 **세로형 카드 디펜스**. 자대 배치 첫날 데프콘 2가 발령되고 위병소가 뚫린다. 보직 카드(소총수·저격수·제설병·취사병·지뢰설치병)를 5열 차선에 배치하고, 같은 카드를 겹쳐 짬을 올리며 10개 웨이브를 막는다.

> **새 컴퓨터이거나 앱을 다시 설치했다면 먼저 `docs/SETUP.md`를 따라 한다.** 작업은 브랜치별로 GitHub에 자동 저장된다.
> 이 저장소는 **PUBLIC**이다. 키·토큰·키스토어를 올리지 않는다.

## 먼저 읽을 것

| 문서 | 내용 |
|---|---|
| `docs/ROADMAP.md` | 단계(M0~M5)·게이트·티켓 순서·**레인(누가 무엇을)**·**Orca 하루 루틴(§6)** |
| `docs/GDD.md` | 게임 기획(화면, 카드, 짬 합성, 시너지, 웨이브, 경제, 광고) |
| `docs/TECH.md` | 기술 구조(Phaser 4 + Capacitor), 레인 경계, 디버그 URL, 금지 목록 |
| `docs/ART.md` | 아트 규격, **에셋 계약**, 사용자에게 드리는 에셋 요청 체크리스트 |
| `AGENTS.md` | 에이전트 규칙(Antigravity가 자동으로 읽는다) |
| `docs/agents/` | Antigravity 역할 카드(조사·플랫폼 UI) |
| `docs/references/` | 기획 근거: 사용자 PDF(요구사항, 레퍼런스 5종 역설계, OSINT)를 markitdown으로 변환한 것 |
| `docs/SETUP.md` | 설치·재설치 복구·이어하기·작업 끝낼 때 |

## 누가 무엇을 하나

| 레인 | 담당 | 하는 일 |
|---|---|---|
| A 코어 전투 | Claude Code (GSD + ponytail) | 판·차선·카드·합성·시너지·웨이브, 게이트 리뷰 |
| B 플랫폼·UI | Antigravity Argon High | 스캐폴드, Capacitor 안드로이드, 메뉴·HUD·상점 UI, 에셋 검사 |
| C 조사 | Antigravity Flash | 구글 플레이 요건, 한국군 고증 → `docs/research/` |
| D 아트 | 사용자 + Gemini Argon 이미지 + Figma | `docs/ART.md` §5 체크리스트 |

## 작업 방식 요약

- **티켓 1개 = Orca 워크트리 1개 = 대화 1개.**
  - Antigravity 시작: `/start-ticket H-101`
  - 끝: `/finish-ticket`(검증·스크린샷·결과 보고·**PR 생성**)
  - 막히면: `/stuck`
  - "역할 카드 읽고 수행해" 방식도 된다: "`docs/agents/antigravity-research.md` 읽고 역할대로 수행해"
- `.agents/hooks.json`의 Stop 훅(`scripts/harness/stop-gate.mjs`)이 작업을 끝내기 전에 검사한다. 어기면 에이전트를 다시 일하게 돌려보낸다.
  - 티켓 소유 경로 밖의 변경(기획 문서·레인 A 파일 포함)
  - 허용 안 된 의존성
  - 진행 기록 누락
  - `npm run verify` 실패
- 저장: 매 턴 끝 + 작업 중 5분마다 자동 커밋 → **지금 브랜치로 push**(`scripts/harness/autosave.mjs`). main은 PR 병합으로만 바뀐다.
- 게이트(G0~G3)마다 Claude Code에서 "G○ 리뷰해줘" → `docs/reviews/`에 리뷰가 생기고 다음 티켓이 발행된다.

## 하네스 단독 점검

```sh
# Stop 훅: 변경이 없으면 {"decision":"stop"} (주의: 먼저 자동 저장, 즉 커밋 + 지금 브랜치로 push를 한다)
echo '{"terminationReason":"NO_TOOL_CALL"}' | node scripts/harness/stop-gate.mjs
# 명령 가드: git push는 deny
echo '{"toolCall":{"name":"run_command","args":{"CommandLine":"git push"}}}' | node scripts/harness/cmd-guard.mjs
```
