# T-122 긴 배경음악 시안 제작

상태: 진행 중
담당: Codex. 2026-10-30 사용자 ‘더 긴 음악과 긴박한 음악 파일을 만들어줘’ 요청.

## 목표

짧은 반복과 평면적인 전개를 줄인 오리지널 음악 시안3개를 실제 들을 수 있는 파일로 제작한다. 사용자 청취 전 게임 원본을 덮어쓰지 않는다.

## 소유 경로

- `docs/tickets/T-122-music-prototypes.md`
- `art/inbox/music/T-122/`
- `art/source/audio/T-122-effects.swift`
- `art/source/audio/T-122-compose.swift`
- `src/audio.ts`
- `src/data.ts`
- `src/battle/enemies.ts`
- `public/assets/sfx_rifle.m4a`
- `public/assets/sfx_sniper.m4a`
- `public/assets/sfx_cannon_shot.m4a`
- `public/assets/sfx_armored_arrival.m4a`
- `public/assets/audio-credits.json`
- `tests/audio.test.ts`
- `tests/audio-events.test.ts`
- `docs/HANDOFF.md`
- `docs/shots/T-122*.png`

## 허용 의존성

- 없음. 기존 Swift/Foundation와 ffmpeg만 사용. 외부 음원/샘플/유료 생성 API 사용 없음.

## 작업 계획

1. 기존 음원 길이와 재생/ART 계약을 읽는다.
2. 전투 대기/교전·긴급 교전·생활관용 원곡을 직접 작곡/합성한다. 구간별 편곡·음색·화성·타악기 강약을 바꾸고 짧은 패턴 단순 연장은 피한다.
3. WAV 원본과 M4A 청취 파일, 짧은 비교 미리듣기를 생성한다. 길이·무음·레벨·클리핑을 도구로 검사한다.
4. 실제 파일 링크를 제공하고, 청취 후 선택한 버전의 게임 적용은 후속으로 정한다.

## 경계

- 현재 워크트리에서 T-121 적 압박 코드 변경이 진행 중이다. 해당 변경/브랜치/기존 음원/credits는 건드리거나 커밋하지 않는다.
- ART의 게임 BGM500KB 상한은 유지한다. 이번 긴 고음질 파일은 art/inbox의 비배포 시안이다. 실제 적용은 길이·음질·용량을 비교해 처리할 별도 범위다.
- 원본/시안은 art/inbox ignore 경로에 둔다. 대화가 사라져도 이 티켓의 경로와 재생성 스크립트로 이어받는다.

## 진행 기록

- 브랜치: kidariseok/t121-enemy-pressure(동시 진행 작업 보존; 브랜치 전환 없음).
- [x] 기존 길이 확인: 긴급26.72초, 일반 교전152.14초, 생활관59.17초. 음악 생성 도구 미연결.
- [x] 사용자 요청 범위의 음악 파일 제작 착수. 합성 시안이며 녹음 오케스트라/AI 음악 생성 결과로 표시하지 않는다.
- [x] WAV3개/M4A3개/75초 미리듣기/ZIP 제작. 전체 디코딩·길이·피크 검증 통과. 파일 링크 전달.

## 결과 보고

- 경로: art/inbox/music/T-122/.
- 파일: 01_perimeter_alert.m4a(210.8초/3.50MB),02_last_defense.m4a(202.7초/3.41MB),03_barracks_before_dawn.m4a(179.6초/2.90MB),00_preview.m4a(75초). WAV원본3개·compose.swift·README.md·verification.json·T-122-music-pack.zip 동봉.
- 실제 검증: ffprobe 길이/AAC/44.1kHz/stereo, ffmpeg 전체 디코딩 exit0. 원곡3개 true peak −1.9/−3.2/−7.1dBFS, integrated loudness −16.8/−17.1/−19.3LUFS. 소스와 렌더링/압축 경로 보존.
- 사람이 청취 평가한 결과로 주장하지 않는다. 시안은 페이드형이며 무한루프 최적화·게임500KB맞춤은 미수행. 기존 bgm3개·credits·게임코드는 변경하지 않음.
- art/inbox는gitignore인 원본 보관 경로다. 동시 진행 중인T-121 변경을 함께 저장하지 않기 위해 autosave/커밋/브랜치 변경은 실행하지 않았다. 음원 팩은 실제 로컬 파일로 사용자에게 전달한다.
- npm run verify/스크린샷: 제품 코드 변경이 없는 음악 파일 제작이라 미실행/해당 없음. 음악의 검증 결과는 위 도구 검사로 한정한다.
- 다음: 청취 후 마음에 드는 편곡을 기준으로 루프/용량/게임 적용 범위를 정한다.

## 2차 요청: 템포·무기/차량 효과음

- 사용자: 템포를 조금 높이고 총/탱크 등장 등에 효과음을 추가해 달라고 요청.
- 템포: 일반112→124BPM, 긴급136→152BPM, 생활관88→96BPM. 원래 버전 보존, v2 폴더에 새 악보로 다시 렌더링해 음높이를 유지한다.
- 별도 파일: 소총 단발/점사·대구경 사격·장갑 차량 등장·포탄 발사·박격포 낙하 효과음. 외부 샘플 없이 합성하고 기존 ART의 효과음30KB 제한을 확인한다.
- 효과음의 실제 게임 동작 연결/음악 내부 삽입 여부는 비동기 질문으로 확인 중. 파일과 상황 미리듣기부터 제작한다.

## 2차 게임 연결 계획/승인

- [x] 사용자: ‘게임의 실제 사격·차량 등장 순간에 재생’ 선택. 음악 안에 효과음을 고정 삽입하지 않는다.
- [x] 다른 작업을 보호하기 위해 origin/main39d2f36에서 별도 워크트리 `/private/tmp/shoottrial-t122`, 브랜치 `kidariseok/t122-music-sfx` 생성. 기존 moonfish의 브랜치/변경은 유지한다.
- 게임 적용: 소총 단발·저격 사격음2개 교체, 대전차/보스 사격 전용 포음과 보스 등장 엔진·궤도음2개 신규 연결. 사용자 요청에 필요한 위 소유 경로를 명시한다. 기존 효과음 설정/백그라운드·광고 음소거와 동시재생8개 제한은 재사용한다.
- 검증: 전체 npm run verify, 새 효과음/기존 효과음 경로와30KB제한 검사, 실제 게임 사격/보스 출현 오디오 요청 및 음소거/종료 확인,390×844 화면 캡처.
- 템포 수정본은 원곡 고음질 파일로 제공한다. BGM500KB 계약을 넘는 음악은 이번에 자동으로 게임 파일에 덮어쓰지 않는다.

- [x] origin/main 기준 게임 연결 초안 검증: npm run verify386테스트/25파일·97에셋·타입·빌드 통과. 새2키 등록, 기존 사격키2개 파일 교체와 출처 기록. 게임 이벤트 호출 검사를 추가하는 중.

## 2차 검증 결과

- 음악 v2: 일반124BPM/190.9초, 긴급152BPM/181.9초, 생활관96BPM/165초. 각각 음높이를 유지하고 악보에서 템포를 바꿔 재합성했다. 파일은 moonfish/art/inbox/music/T-122/v2/에 보관, 작곡 소스는 art/source/audio/T-122-compose.swift에 보존한다.
- 효과음 후보7종: 단발0.42초, 점사0.65초, 대구경0.95초, 장갑차 등장2.8초, 포음1.65초, 박격포 낙하2.2초, 경보1.15초. 전체 디코딩 성공, 후보7개 모두30KB 이하. 게임 적용은 단발/대구경/포음/장갑차 등장4개.
- 실제 게임 연결: 기존 sfx_rifle/sfx_sniper 파일 교체. sfx_cannon_shot은 대전차 아군/장갑차 적의 실제 공격 순간, sfx_armored_arrival은 spawnEnemy의 boss 생성 때1회 재생한다. 일반 적 출현에 차량음을 넣거나 음악에 총성을 고정 삽입하지 않았다.
- npm run verify: 타입 검사 통과,26파일396테스트 통과,97에셋 검사 통과, Vite 빌드 통과. 기존 번들500KB 경고 유지. git diff --check 통과.
- 신규10검사: 실제 spawnEnemy/tickEnemies 함수의 오디오 호출, 조준 중 무음/발사 시1회, 등장음 이동 틱 재호출 없음, 새 파일/출처/소스/30KB제한. 렌더러는 스텁이며 오디오 이벤트만 검사한다.
- 실제 Chromium: 별도 컨텍스트,390×844, wave5/seed7/god1/rank3A/전투 직행. 실제 웹 시작 버튼 클릭 후 Audio생성/재생/오류를 계측했다. 사격 위치/적 배치는 개발 함수로 지정했다. 장갑차 등장·소총·저격·포음 각각plays1, readyState4, 파일오류0, 각 duration까지 currentTime 진행 확인.
- 장갑차 이동 후 등장음 요청 수1→1. mute(ad) 후 activeSfx0/모든 요소paused, 음소거 중 추가 장갑차 생성의 Audio요청0. 기존 동시 재생 상한8과 hidden/ad 설정을 재사용한다. 사람이 청취한 음질/현장감 평가라고 주장하지 않는다.
- 배경음 v2는 고음질 청취 시안으로만 전달한다. 기존 게임 BGM/500KB 제한은 유지한다. 게임에 배포된 배경음의 템포가 바뀌었다고 주장하지 않는다.
- 기존 Playwright 도구는 다른 세션이 사용 중이라 Chrome DevTools의 별도 컨텍스트로 검증했다. 전용 탭과 포트5222 서버는 종료했다.

## 질문

- [ ] 막힘: 검증 화면 캡처의 파일 저장을 브라우저 도구가2회 거부했다.
  - 시도1: /private/tmp/shoottrial-t122/docs/shots/T-122-audio-events.png → configured workspace roots 밖이라는 Access denied.
  - 시도2: 원래 workspace의 art/inbox/music/T-122/v2/game-audio-events.png → 동일 Access denied.
  - 추정 원인: Chrome DevTools 서버가 허용하는 저장 루트와 실제 작업 루트가 다르다. 실행/재생 계측은 정상이다.
  - 필요한 결정: 캡처 없이 오디오 재생 검증 기록으로 검토하거나, 캡처 저장 루트를 제공한 별도 브라우저 세션에서 사진만 보완. 같은 방식의3번째 저장은 시도하지 않는다.

## 인계 메모

- 현재 상태: 음악 v2와 효과음 후보 파일 생성 완료, 게임 효과음 연결·출처·재생성 소스·검사 완료. 화면 캡처 저장만 막힘. npm verify396검사/97에셋/빌드 통과. 외부 배포/병합은 하지 않았다.
- 재현: /private/tmp/shoottrial-t122에서 npx vite --host 127.0.0.1 --port5222 후 ?scene=battle&wave=5&seed=7&safe=1&unlock=all&god=1. 기본 사격은 실제 공격 시, 장갑차 등장음은 실제 boss 생성 시 재생한다.
- 바뀐 파일: src/audio.ts,data.ts,battle/enemies.ts,public/assets/sfx_rifle.m4a,sfx_sniper.m4a,sfx_cannon_shot.m4a,sfx_armored_arrival.m4a,audio-credits.json,tests/audio.test.ts,audio-events.test.ts,art/source/audio/T-122-effects.swift,T-122-compose.swift,본 티켓,HANDOFF.
- 다음 담당: 새 대화에서 T-122 이어하기. 다른 모델/서버의 캡처 가능 세션에서 사진만 보완하거나 캡처 미확인 상태로 검토한다. 음악 적용을 원하면 BGM 길이/음질/용량500KB 계약을 먼저 결정한다.
- 기존 moonfish 브랜치/다른 구현은 변경하지 않았다. 별도 브랜치 kidariseok/t122-music-sfx, 기준39d2f36.
