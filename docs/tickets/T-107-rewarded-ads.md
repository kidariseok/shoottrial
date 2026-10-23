# T-107 보상형 광고(AdMob, 테스트 ID)

상태: 대기
담당: Antigravity · **Claude Sonnet 5.5 High**(Antigravity 안의 Claude 모델. Claude Code 사용량과 따로 계산된다). 2번 막히면 같은 대화에서 GPT 계열 최상위 모델로 바꾼다.
동시 진행: T-106(소리)과 함께 해도 된다. 소유 경로가 겹치지 않는다(`audio.ts`·`lobby.ts`는 T-106 것이다).

## 목표

보상형 광고 3곳을 **테스트 광고 ID**로 실제 AdMob에 연결한다: 부활, 무료 리롤, 긴급 보급.
- 광고를 끝까지 보면 보상을 주고, 실패하면 안내만 하고 보상은 주지 않는다.
- 광고가 재생되는 동안 소리를 끈다.
- 네 번째 자리인 해금 광고는 `lobby.ts`가 T-106 것이라 T-108에서 한다.

## 선행

- T-105(완료). R-101 조사 결과 `docs/research/play-launch.md`(플러그인 이름·이벤트·테스트 ID·UMP 생략 근거)

## 소유 경로

- `package.json`, `package-lock.json`
- `src/platform.ts`(Capacitor 플러그인은 여기서만 import한다. AGENTS 규칙 6)
- `src/ads.ts`(새 파일. 광고 흐름: 준비·표시·결과)
- `src/ui/screens.ts`(광고 버튼 3곳을 실제 광고로)
- `src/ui/style.css`(광고 실패 안내)
- `android/`(AndroidManifest의 AdMob 앱 ID 메타데이터)
- `capacitor.config.ts`
- `tests/ads.test.ts`(새 파일)

## 허용 의존성

- `@capacitor-community/admob`(Capacitor 8 호환 버전. 설치 전에 npm과 GitHub README에서 호환 버전을 확인하고, 그 근거를 티켓에 적는다)

## 참고 문서

- `docs/research/play-launch.md`
  - 표 42~45행: 플러그인 API, 이벤트 이름, 테스트 광고 단위 ID `ca-app-pub-3940256099942544/5224354917`
  - 한국 한정 출시라 UMP 동의 폼은 생략한다
- `docs/GDD.md` §10(보상형 광고만, 4곳과 횟수), `docs/TECH.md` §7·§8
- AdMob **테스트 앱 ID**: 공식 문서(developers.google.com/admob/android/quick-start 등)에서 확인한 값을 쓰고, 출처를 티켓에 적는다. 기억한 값을 그대로 쓰지 않는다(AGENTS 규칙 5).

## 할 일

1. **플러그인 설치·설정**: 버전 확인 → 설치 → `npx cap sync android` → AndroidManifest에 테스트 앱 ID.
   - 운영 ID는 넣지 않는다.
   - 나중에 운영 ID로 바꿀 자리는 **환경변수나 빌드 설정 한 곳**으로 정하고 티켓에 적는다(R-101 체크리스트 12번).
2. **`platform.ts`**: `initAds()`, `showRewarded(): Promise<'rewarded' | 'dismissed' | 'failed'>`.
   - 웹(브라우저)에서는 실제 광고 없이 **1초 뒤 `'rewarded'`를 돌려주는 가짜**로 동작한다(개발·헤드리스용). 콘솔에 `[ads:web-stub]`을 남긴다.
   - 네이티브에서는 다음 순서로 동작한다.
     1. `prepareRewardVideoAd` → `showRewardVideoAd`
     2. 이벤트 `Rewarded`가 왔는지를 기억해 둔다.
     3. `Dismissed`에서 결과를 정한다.
     4. 다음 광고를 미리 준비한다.
3. **`ads.ts`**: `watchAd(slot: 'revive' | 'reroll' | 'supply'): Promise<boolean>`
   - 광고 시작 전 `audio.mute('ad')`, 끝나면 `audio.unmute('ad')`. `audio.ts`는 고치지 않고 기존 export만 쓴다.
   - 실패하면 `false`를 돌려주고 모달로 "광고를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요"를 띄운다.
   - 같은 광고를 연타해도 한 번만 재생한다.
4. **`screens.ts` 연결**
   - 부활 제안의 "광고 보고 부활": `watchAd('revive')`가 `true`면 `onYes()`, 아니면 모달을 닫고 `onNo()`.
   - 무료 리롤: `true`일 때만 `currentCtl.adReroll()`.
   - 긴급 보급: `true`일 때만 `currentCtl.adSupply()`.
   - 광고를 보는 동안 버튼을 잠근다. 횟수 제한은 레인 A가 한다.
5. **테스트**(`tests/ads.test.ts`): `watchAd`가 `rewarded`일 때만 `true`, 실패하면 `false` + 음소거 해제, 연타해도 1회만. `platform.showRewarded`는 가짜로 바꿔 시험한다.
6. **에뮬레이터 확인**(작업 끝에 1번만 켜고, 끝나면 반드시 끈다. 사용자 노트북 CPU 부담)
   1. 디버그 APK를 설치하고 전투에서 "긴급 보급"을 누른다.
   2. 테스트 광고가 보이는지, 끝까지 보면 보급이 +5 되는지, 광고 중 소리가 꺼지는지 확인한다.
   3. 스크린샷 `docs/shots/T-107-ad.png`(테스트 광고 화면), `T-107-reward.png`(보상 뒤 HUD)를 남긴다.

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] 웹에서 세 버튼이 가짜 광고(1초)를 거쳐 보상을 준다(헤드리스 또는 브라우저 확인)
- [ ] 에뮬레이터에서 테스트 광고가 실제로 뜨고 보상이 들어온다(스크린샷 2장)
- [ ] 운영 광고 ID가 저장소 어디에도 없다. 테스트 ID만 있다
- [ ] `git diff origin/main -- src/ui/screens.ts | grep -E '^[+-]export'` 결과 시그니처 변화가 없다
- [ ] `src/audio.ts`·`src/ui/lobby.ts`·`src/battle/`을 고치지 않았다

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
