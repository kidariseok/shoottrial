# T-106 효과음·배경음 (CC0 음원)

상태: 진행 중
담당: Antigravity · **Gemini 최상위 모델(Argon 제외), 사고 수준 높음**. 2번 막히면 같은 대화에서 Claude Sonnet 5.5 High로 바꾼다.
동시 진행: T-107(광고)과 함께 해도 된다. 소유 경로가 겹치지 않는다(`screens.ts`는 T-107 것이다).

## 목표

게임에 소리를 넣는다.
- 효과음 11종과 배경음 3종을 무료 CC0 음원으로 구해 `public/assets/`에 넣는다.
- `audio.ts`에 `playSfx(key)`와 `playBgm(key | null)`을 제공한다.
- 생활관 배경음과 버튼 클릭음은 이 티켓에서 연결한다.
- 전투 중 소리(사격·폭발 등)와 전투 배경음 전환은 레인 A(Claude)가 이 API를 불러 연결한다.

## 선행

- T-105(완료)

## 소유 경로

- `src/audio.ts`
- `src/ui/lobby.ts`
- `public/assets/*.m4a`
- `public/assets/audio-credits.json`(새 파일)
- `tests/audio.test.ts`(새 파일)

## 허용 의존성

- 없음(변환은 macOS 기본 `afconvert`를 쓴다)

## 참고 문서

- `docs/ART.md` §4.4: 키 목록, 크기 한도(효과음 30KB 이하, 배경음 500KB 이하 반복)
- `docs/GDD.md` §9(손맛), §4.1(데프콘 1: 배경음 빨라짐)
- `AGENTS.md` 화면 원칙: 백그라운드·광고 중 음소거. 기존 `mute/unmute`를 유지한다.

## 할 일

1. **음원 구하기**: 라이선스가 **CC0**로 명시된 것만 쓴다(예: Kenney.nl 오디오 팩, OpenGameArt의 CC0 표시 음원). 출처 URL·제작자·라이선스를 `public/assets/audio-credits.json`에 키마다 적는다.
   - 효과음: `sfx_rifle`, `sfx_sniper`, `sfx_wind`, `sfx_boom`, `sfx_heal`, `sfx_merge`, `sfx_siren`, `sfx_radio`, `sfx_hit`, `sfx_click`, `sfx_buy`
   - 배경음: `bgm_lobby`(차분한 긴장), `bgm_defcon2`(전투), `bgm_defcon1`(더 빠르고 급박)
   - 피·비명 같은 소리는 쓰지 않는다(콘텐츠 원칙).
2. **변환**: `afconvert -f m4af -d aac`로 m4a를 만들고 크기 한도를 지킨다(모노·낮은 비트레이트·짧게 자르기). 배경음은 끊김 없이 반복되게 자른다.
3. **API**(`audio.ts`)
   - `export type SfxKey = ...11종`, `export type BgmKey = 'bgm_lobby' | 'bgm_defcon2' | 'bgm_defcon1'`
   - `playSfx(key: SfxKey)`: 기존 동시 재생 제한·음소거·설정을 지킨다. 파일이 없으면 **조용히 넘어간다**. 지금은 실패하면 합성 클릭음이 나는데, 그 대체 소리는 `sfx_click`일 때만 낸다.
   - `playBgm(key: BgmKey | null)`
     - 같은 키면 아무것도 하지 않는다. 다른 키면 0.3초 정도 페이드로 바꾼다. `null`이면 멈춘다.
     - 음소거(백그라운드·광고)되면 일시정지하고, 풀리면 이어서 재생한다.
     - 설정의 배경음 끄기를 지킨다.
   - 버튼 클릭음: `initAudio` 안에서 `document`에 클릭 리스너 하나를 둔다. `.mil-btn`이 눌리면 `sfx_click`을 낸다(`screens.ts`를 고치지 않기 위한 방식).
   - T-104가 부르던 `playSfx('sfx_radio')`·`('sfx_siren')`이 타입에 맞게 동작해야 한다(지금 있는 캐스팅을 없앨 수 있으면 없앤다. 단 `screens.ts`는 고치지 않는다).
4. **생활관**(`lobby.ts`): 생활관이 보일 때 `playBgm('bgm_lobby')`, 출동할 때 `playBgm(null)`. 전투 배경음은 레인 A가 켠다.
5. **테스트**(`tests/audio.test.ts`): 키 목록, `playBgm` 같은 키 무시·`null` 정지, 음소거 중 재생 요청 무시를 순수하게 시험할 수 있는 부분만 시험한다(DOM Audio는 가짜 객체로).

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] `public/assets/`에 m4a 14개가 있고 크기 한도를 지킨다(`ls -la` 결과를 결과 보고에 붙인다)
- [ ] `audio-credits.json`에 14개 모두 출처·라이선스(CC0)가 있다
- [ ] 브라우저 `/`: 생활관에서 배경음이 나고 버튼을 누르면 클릭음이 난다. 출동하면 생활관 배경음이 멈춘다(헤드리스면 `Audio` 재생 호출 기록으로 증명).
- [ ] `src/ui/screens.ts`·`src/battle/`·`src/platform.ts`를 고치지 않았다

## 작업 계획

1. **음원 확보**: Kenney.nl CC0 팩(Impact/Sci-fi/Interface Sounds)과 OpenGameArt CC0 음원을 받아 라이선스(CC0) 페이지를 확인한다. 임시 작업은 `/tmp`에서 한다. 바뀔 파일: 없음(조사).
2. **변환**: `afconvert -f m4af -d aac`(모노, 낮은 비트레이트, 자르기)로 `public/assets/` 에 m4a 13개 추가(`sfx_click`은 기존 파일 유지 여부 확인), `public/assets/audio-credits.json` 작성(키마다 URL·제작자·CC0).
3. **API**: `src/audio.ts`에 `SfxKey`·`BgmKey`, `playSfx`(대체 합성음은 `sfx_click`만), `playBgm`(0.3초 페이드, 같은 키 무시, `null` 정지, 음소거 시 일시정지·복귀 시 재개, 설정 반영), `initAudio`에 `.mil-btn` 클릭 리스너.
4. **생활관**: `src/ui/lobby.ts`에서 `showLobby` 시 `playBgm('bgm_lobby')`, 출동 클릭 시 `playBgm(null)`. 기존 캐스팅 제거(`lobby.ts`만. `screens.ts`는 수정 안 함).
5. **테스트**: `tests/audio.test.ts` (가짜 Audio 객체로 키 목록·같은 키 무시·null 정지·음소거 무시).
6. **검증**: `npm run verify`, `ls -la public/assets/*.m4a`, 디버그 URL `/`(생활관)에서 헤드리스로 `Audio.play` 호출 기록 확인.

플랫폼 API: Capacitor 플러그인 사용 없음(브라우저 `Audio`/`AudioContext`만).

## 질문

- [x] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요

## 진행 기록

- 기준 커밋: 0fb6acd2d980
- 브랜치: kidariseok/tilefish
- 세션 시작: (Claude Sonnet 5.5, 2026-10-24 13:07)

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
