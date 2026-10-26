# T-114 전투 배경음·효과음 연결

상태: 완료
담당: Codex(전투 연결·통합 검증), Orca 작업자(오디오 수명주기).

## 목표

기존 음원으로 전투의 사격·회복·소생·합성·구매·폭발과 데프콘별 배경음이 재생되고, 설정·광고·백그라운드 음소거 및 전투 종료를 올바르게 따른다.

## 선행

- T-106 음원/API 완료, T-113 완료·PR #41 실제 MERGED(2026-10-25T18:56:00Z).
- public/assets에 효과음11종과 배경음3종이 있다. 새 음원 제작/다운로드는 하지 않는다.
- A-103 생활관 배경은 art/inbox/public에 아직 없어 사용자 그림 대기. 작업 큐의 바로 진행 가능한 전투 소리 연결을 먼저 수행한다.

## 소유 경로

- `src/audio.ts`
- `src/data.ts`
- `src/battle/BattleScene.ts`
- `src/battle/units.ts`
- `src/battle/enemies.ts`
- `src/battle/board.ts`
- `src/battle/fx.ts`
- `src/ui/lobby.ts`
- `tests/audio.test.ts`
- `docs/HANDOFF.md`
- `docs/tickets/T-114-battle-audio.md`
- `docs/shots/T-114*.png`

## 허용 의존성

- 없음

## 참고 문서

- AGENTS.md 코드·콘텐츠·오디오/플랫폼 규칙
- docs/HANDOFF.md §4·§6·§8
- docs/TECH.md §6(설정/hidden/ad OR, 동시 효과음8개)·§8(전투가 사용하는 audio API)
- docs/GDD.md §4·§5.2~5.4·§5.8·§10(광고 중 음소거)
- docs/tickets/T-106-sound.md 결과 보고/API·음원 키
- docs/tickets/T-113-new-cards.md 결과 보고/신규 소생·포격 예약

## 할 일

1. 준비/전투 진입 때 데프콘에 맞는 bgm_defcon2 또는 bgm_defcon1을 요청한다. 데프콘1 전환 때 바꾸되 매 프레임 다시 시작하지 않는다. 결과/포기/직접 씬 종료 때 전투 배경음을 정리하고 생활관의 기존 bgm_lobby 흐름을 보존한다.
2. 실제 행동이 성립한 지점에서 아래 효과음을 호출한다. 예비 동작·반복 update·빈 대상·실패한 구매에는 행동 효과음을 내지 않는다. 음원 매핑은 data.ts 한 표에 두며 공격력/시간/비용 등 게임 수치는 바꾸지 않는다.

| 행동 | 기존 키/호출 기준 |
|---|---|
| 소총수·지뢰설치병·화학병 사격 | sfx_rifle, 한 발동당1회(점사 각 탄/관통 대상 수로 중복하지 않음) |
| 저격 | sfx_sniper, 관통 전체에1회 |
| 제설병 송풍 | sfx_wind, 범위 안 적 수와 무관하게1회 |
| 취사병 회복·의무병 소생 완료 | sfx_heal, 한 행동당1회(의무 처치 시작/취소에는 없음) |
| 박격포 착탄 | sfx_boom, 실제 포탄1발당1회(연속탄은 실제 두 착탄) |
| 대전차 발사·RPG 발사·지뢰 폭발 | sfx_boom, 행동당1회 |
| 화력 지원 착탄 | sfx_boom, 열 전체 폭발에1회(칸별 시각 이펙트가 중복 재생하지 않음) |
| 피격 | sfx_hit, 직접 유효 피격에만(가스·독·화상 매틱 피해 제외) |
| 합성 진급 | sfx_merge, 진급 한 단계당1회 |
| 구매 | sfx_buy, 성공한 구매당1회(연쇄 합성 비용/구매는 한 번) |

3. 클릭음/경보·무전은 기존 UI의 호출을 유지하고 같은 사건을 전투에서 다시 재생하지 않는다. 통신병은 직접 사격음을 내지 않는다. 새4종에 새 음원을 만들지 않고 기존 키를 재사용한다.
4. audio.ts의 설정·음소거 동작을 실제 재생 중인 효과음까지 검증한다. 현재 코드는 효과음 Audio 요소를 지역 변수로만 생성해 mute 시 직접 멈출 수 없는 점을 보완한다. hidden/ad 또는 SFX 끄기 때 재생 중 효과음을 즉시 멈추고, 복귀 때 오래된 사격음을 재생하지 않는다. 끝남/오류/실패/강제 정지의 중복 release로 동시재생 집계가 틀어지지 않게 한다.
5. 전환 중 이전 BGM과 현재 BGM도 광고/백그라운드 음소거를 따라야 한다. 기존 페이드·같은 키 무시·첫 터치 후 자동재생 재시도를 보존하며, 광고 종료와 앱 복귀 두 조건이 풀려야 음악이 다시 켜지는지 확인한다. 플랫폼 이벤트는 기존 audio/platform 연결을 그대로 쓰고 새 SDK/import/API를 추가하지 않는다.
6. tests/audio.test.ts의 FakeAudio를 실제 수명주기 검사가 가능하게 보완해 위 음소거/중복release/동시8개·복귀 동작을 검사한다. 전투 호출 횟수와 타이밍은 디버그 브라우저 계측으로 검증한다. 전투 화면/물리 테스트 프레임워크는 추가하지 않는다.

## 검증 명령

- `npm run verify`
- `git diff --check`

## 완료 조건

- [x] 데프콘2/1 배경음 전환·재시작·결과/포기·생활관 복귀가 중복/잔류 없이 동작
- [x] 기존6종/새4종·적·지뢰·지원·구매·합성이 실제 사건마다 정한 횟수로 요청됨
- [x] 설정·hidden/ad OR·재생 중 음소거·자동재생 재시도·동시재생 상한 유지
- [x] 일시정지/특기 선택/배속에서 새 전투 행동 없이 소리가 반복되지 않음
- [x] verify/호출 계측 결과와 사진 경로를 결과 보고에 기록
- [x] 임시 검증 서버·브라우저 종료, 인계 갱신·저장·PR 제공

디버그 URL: `http://localhost:5199/?scene=battle&wave=3&unlock=all&supply=99&seed=7&safe=1&deck=rifle:1,sniper:1,blower:1,cook:1,miner:1,chem:1,medic:1,mortar:1,antitank:1,signal:1&rank=3&spec=A`

## 작업 계획

1. **기준선/API 확인**: 현재 verify341테스트·83에셋·빌드 통과 확인 완료. audio.ts 재생/페이드/음소거 경로와 기존 전투 사건 지점을 대조한다.
2. **오디오 수명주기**: audio.ts/tests/audio.test.ts. 재생 중 SFX와 전환 중 BGM의 즉시 음소거·슬롯 반환·복귀를 작은 함수/집합으로 보완한다. 새 관리자 클래스나 이벤트 버스는 만들지 않는다.
3. **전투 연결**: data.ts/units.ts/enemies.ts/board.ts/BattleScene.ts와 필요시fx.ts. 기존 playSfx/playBgm만 import하고 실제 사건 기준으로 호출한다. 일반 일시정지/특기 모달에서는 BGM을 계속 두되 게임 행동이 멈춰 새 전투 효과음은 발생하지 않게 한다. 앱 백그라운드/광고는 기존 OR 음소거로 즉시 정지한다.
4. **통합 검증/인계**: 위 URL과 wave7/10, gallery가 아닌 실제 전투에서 호출 키/횟수와 Audio 재생 상태를 계측한다. 결과→생활관→재투입, 설정/백그라운드/광고 모의 이벤트, 소생/연속 포격/열 전체 지원의 중복 여부 확인. verify·사진·결과 보고·자동 저장·PR.

소리는 스크린샷만으로 증명할 수 없어 재생 호출/상태 계측을 함께 기록한다. 사람이 직접 들은 음색·볼륨 평가는 따로 적으며 듣지 않고 들었다고 쓰지 않는다. 읽기 전용 GDD/TECH/ART나 광고/Capacitor API는 변경하지 않는다.

## 질문

- [x] 사용자 ‘진행’ 수신: 위 계획 구현 승인.

## 진행 기록

- 기준 커밋: a897bb073f1f
- 브랜치: kidariseok/t114-battle-audio
- 세션 시작: Codex, 2026-10-26 KST.
- [x] 중단 후 git status 깨끗함·최근10커밋·HANDOFF 확인. T-113은 완료/비활성, 미완료 제품 수정 없음.
- [x] #41 실제 병합 확인, git fetch 완료. origin/main에서 새 T-114 브랜치 생성.
- [x] 현재 npm run verify341테스트/21파일·83에셋·타입/빌드 통과(기존 번들 경고).
- [x] T-106 완료/API/음원14파일 확인. 생활관 bg_barracks 후보는 art/inbox/public에 없어 A-103 대기 유지. 전투 모듈에는 playSfx/playBgm 호출이 아직 없다.
- [x] 템플릿 티켓/소유 경로/계획 작성. 제품 코드 변경 없음, 구현 승인 대기.

## 결과 보고

- 바뀐 파일: src/audio.ts, src/data.ts(BATTLE_AUDIO 음원표만), battle의 BattleScene/units/enemies/board, tests/audio.test.ts, 본 티켓/HANDOFF. 기존 음원14개를 재사용했고 게임 수치/규칙·새 의존성·플랫폼/광고 API·읽기 전용 문서는 바꾸지 않았다.
- `npm run verify`(2026-10-26): **21파일358테스트 통과**, 타입 검사·**83에셋 검사**·빌드 통과. 기존 번들500kB 경고 유지. `git diff --check` 통과. 오디오 검사는 기존7개에서24개로 확장했다.
- audio.ts: 재생 중 SFX/클릭 대체음 추적·즉시 음소거, 중복 ended/error/rejection/정지 시1회만 슬롯 반환, 폐기된 사격음 복귀 방지. 이전/현재 BGM 페이드 취소·음소거·현재 곡만 복귀, 동일 곡/자동재생 첫 터치 재시도 유지. 효과음8개 상한 유지.
- 실제 브라우저 Audio 생성/play/pause 계측: 소총수 점사 사격1/피격2, 지뢰설치병·화학병 사격1/피격1, 저격 관통 사격1/피격2, 송풍1/피격2, 대전차 폭발1/피격1. 두 명 회복에 heal1, 통신병 사격0. 소생 시작/1.9초까지 heal0→완료 heal1. 박격포 발사 시 boom0→첫 착탄 boom1→후속 착탄 누적boom2. RPG·지뢰·열 전체 화력 지원은 각 boom1. 가스/독/화상 틱 피격음0. 성공 구매 buy1/비용1, 보급 부족 구매0, 합성 진급 merge1.
- BGM 계측: 웨이브3 준비 defcon2 곡1회, 같은 전투 진입 추가0회, 웨이브7/10 전환 defcon1 곡 각1회. 일반 일시정지·특기 선택 중 새 전투 SFX0. 포기 후 기존 페이드가 끝나면 전투 음악 정지, 실제 생활관 경로에서 lobby 곡 재개, 다시 투입에서 defcon2 곡1회·이전 곡은 정지 확인. 350ms 한 시점 관측은 브라우저 타이머 지연 가능성이 있어 전환/종료는500ms 후 최종 정지 상태로 대조했다.
- 음소거 계측: 실제 visibilitychange 브라우저 경로와 hidden/ad 모의 플래그, 설정 off 모두 재생 중 음악/SFX paused=true·activeSfx0. hidden+ad에서 ad만 해제하면 계속 정지, 둘 다 해제하면 현재 음악만 재개(currentTime 증가), 옛 음악/효과음은 정지 유지. 즉시 연속9요청은8개 허용/9번째false·active8, 종료 후0. Android/AdMob의 실제 OS/SDK 동작을 검사한 것은 아니다.
- 사진4장(390×844,safe=1): docs/shots/T-114-merge.png, T-114-result.png, T-114-restart.png, T-114-defcon1.png. 사진은 검증 화면의 맥락이며 소리 재생의 증거는 위 호출/상태 계측이다. 실패한 임시 화면 캡처는 성공 캡처로 교체하고 원시 브라우저 로그는 최종 변경에서 제거했다.
- 직접 확인: 위 debug URL에서 배치·공격/구매·합성을 수행한다. wave7/10은 defcon1 배경음. 전체 결과→생활관→재투입 동선은 `?scene=walk`에서 전투 투입해 확인한다(직접 battle 디버그는 걷는 씬을 등록하지 않는 기존 제한이 있음). 소리 자동재생이 막히면 화면을 한 번 누른다.
- 확인하지 못한 점: 사람이 귀로 들은 음색/음량/동시재생 피로감, Android 실기기·광고 SDK 실연동·저사양 성능·전체10웨이브 밸런스. 검사에서는 실제 게임 함수/Phaser 입력·Audio 계측과 가짜 Audio 단위검사를 사용했다. 사람이 전체 과정을 실제 손가락으로 검사한 것은 아니다.
- 검증용 서버/탭 종료 완료. 다음은 사용자 PR 병합 및 실제 듣기/플레이테스트. 생활관 배경은 입고 대기, 일일 보너스/출시는 별도 티켓.

## 인계 메모

- T-114 구현·검증 완료, 사용자 PR 병합 대기. 브랜치 kidariseok/t114-battle-audio, 기준 a897bb073f1f. 새 작업은 병합 확인 후 origin/main 새 브랜치에서 시작한다.
- 다음 플레이테스트 전 전투 소리를 연결한다. 일일 보너스 수치 추가/밸런스 변경/생활관 그림 생성/출시 작업은 범위 밖이다.

- [x] 사용자 승인 후 구현 시작. 오디오 수명주기(audio.ts/tests/audio.test.ts)는 Orca에 분담하고 조정자는 data/전투 연결/문서·QA를 담당한다.

- 구현 Run `run_ad01213fc7e2`, 오디오 Task `task_5e59bdf587c2`/Dispatch `ctx_6770f49de499`, 창 `term_aa7073c4-7663-4a15-b17a-3db752324caa`. 작업자는 audio.ts/tests/audio.test.ts만 소유. 조정자 전투 연결은 타입 검사·diff --check 통과, 다음은 실제 브라우저 호출 계측.

- [x] 오디오 작업자24테스트·타입검사 통과 보고 수신, succeeded 검증 후 release·ack 완료, reclaimable0. 통합 verify358테스트/21파일·83에셋·빌드 통과. 실제 Audio 생성/play/pause를 계측해 전투 사건별 중복 없음·hidden/ad OR·설정·동시8개·생활관 복귀 음악 확인. 원시 로그는 임시이므로 제거, 결과는 보고에 요약 예정.

- [x] 최종 검증/정리: 위358테스트·Audio 계측 통과. Orca 오디오 Task task_5e59bdf587c2/Dispatch ctx_6770f49de499 succeeded·release·delivery ack 완료, reclaimable0. 검증 서버/탭 종료, 임시 로그 미포함.
