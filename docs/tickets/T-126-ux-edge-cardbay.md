# T-126 FIGHTSHOOT UX 1차 — Edge-to-Edge 필러박스 제거 + 생활관 상하 마감 + 전투 하단 2단 카드바 확대

상태: 완료(PR 제출 · QA/실기기 검증 대기)
담당: Antigravity · Gemini 4 Neon (High) (역할 카드: docs/agents/antigravity.md)

## 목표

iPhone 15 Pro(393×852 pt)를 포함한 모바일 화면에서 `#game` 캔버스를 Edge-to-Edge로 확장해 좌우 검은 필러박스를 0px로 제거하고, 생활관(`WalkScene`) 상·하단 검은 공백을 마감하며, 전투 하단 상점(`#shop`)을 2단 분리형 카드 데크(높이 120~136px, 카드 5장 풀폭, 역할 배지·기능 요약·`i` 정보 버튼)로 확대하되 전장 하단의 `위병소 방어선`과 `판매` 드롭존을 가리지 않게 완성한다.

## 선행

- T-125 (PR #57, 커밋 `26ee9719e982f07af388b8d9aa30e356875a7365`) 병합 완료

## 소유 경로

- `docs/tickets/T-126-ux-edge-cardbay.md`
- `src/ui/style.css`
- `src/device.ts`
- `src/main.ts`
- `src/ui/walk.ts`
- `src/ui/screens.ts`
- `src/ui/helpers.ts`
- `tests/ui.test.ts`
- `tests/ux-edge-cardbay.test.ts`

## 허용 의존성

- 없음

## 참고 문서

- `AGENTS.md` (절대 규칙 1~11, 코드·화면·콘텐츠 원칙)
- `docs/TECH.md` §3·§8·§9
- `docs/ART.md` §2
- `/Users/jinseokoh/orca/workspaces/shoottrial/reports/ios-ux-polish-research.md`

## 할 일

1. 최신 `origin/main`(`26ee971`) 동기화 확인 및 티켓 작성
2. `#game` Edge-to-Edge 확장(`src/ui/style.css`, `src/device.ts`, `src/main.ts`) 및 Safe Area UI 오버레이 유지(`?safe=1` 포함)
3. 생활관(`src/ui/walk.ts`) 상단 천장/벽면 마감·하단 복도 바닥/도크 마감 + Safe Area 기준 상단바/하단 CTA 배치(기존 히트박스·좌표 100% 유지)
4. 전투 하단 `#shop` 2단 분리·비중 확대(`120~136px`, SE `max-height: 700px` 컴팩트) + 카드 전면 역할 색상 배지·1줄 핵심 기능 요약·우상단 `i` 상세 정보 버튼(`stopPropagation`) 연결 + 준비 단계 카메라 오프셋으로 `위병소 방어선`/`판매` 0px 겹침 보장
5. 단위 테스트 추가(`tests/ux-edge-cardbay.test.ts`), `npm run verify`, `npx cap sync ios`, `xcodebuild` 시뮬레이터 빌드 검증
6. 커밋·푸시 및 `main` 대상 PR 생성(미병합 대기)

## 검증 명령

- `npm run verify`
- `npx cap sync ios`
- `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination "id=8349CC07-74C9-4B6C-9491-11FE7811B469" -derivedDataPath /tmp/defcon2-ios-dd-t126 build`

## 완료 조건

- [x] 393×852(iPhone 15 Pro)에서 좌우 필러박스 0px 및 `#shop` 좌우 밀착 확인
- [x] 생활관 상·하단 검은 공백 마감 및 Safe Area 준수(기존 구역 좌표·히트박스 유지)
- [x] 전투 하단 `#shop` 2단 분리(393×852 기준 높이 133.2px, 카드 73×88.2px), 역할 배지·기능 요약·`i` 버튼 동작 및 `위병소 방어선`/`판매` 겹침 0px
- [x] `npm run verify` 통과 (28파일 405테스트 · 97에셋 · 빌드, EXIT 0)
- [x] `npx cap sync ios` 통과 및 `Package.swift` AdMob 0건 유지
- [x] `xcodebuild` 시뮬레이터 빌드 통과 (`** BUILD SUCCEEDED **`)
- [x] `main` 대상 PR 생성(미병합)

디버그 URL: `http://localhost:5173/?scene=battle&unlock=all&supply=12&safe=1`, `http://localhost:5173/?scene=walk&safe=1`

## 작업 계획

1. `src/device.ts`와 `src/main.ts`에 Edge-to-Edge 논리 해상도·Safe Area 캔버스 환산·전투 상점 열림 시 카메라 보정 순수 함수를 구현한다.
2. `src/ui/walk.ts`에 상·하단 배경 마감과 Safe Area 기반 상단 HUD·하단 버튼 배치를 적용한다.
3. `src/ui/helpers.ts`, `src/ui/screens.ts`, `src/ui/style.css`로 2단 카드 데크·10종 병과 역할 배지·핵심 기능 요약·`i` 상세 정보 모달을 구현한다.
4. `tests/ux-edge-cardbay.test.ts`를 작성하고 `npm run verify`, `npx cap sync ios`, `xcodebuild`로 전체 검증 후 PR을 연다.

## 질문

(없음)

## 진행 기록

- 기준 커밋: `26ee9719e982f07af388b8d9aa30e356875a7365` (`origin/main`)
- 브랜치: `kidariseok/ux-edge-cardbay`
- 세션 시작: Antigravity · Gemini 4 Neon (High), 2026-11-21
- [x] 0단계: `origin/main`(`26ee971`) 동기화 확인 및 `T-126` 티켓 생성
- [x] 1단계: `#game` Edge-to-Edge 전환(`style.css`, `device.ts`, `main.ts`) + 생활관(`walk.ts`) 상·하단 군용 천장/복도 마감 및 Safe Area HUD/CTA 보정
- [x] 2단계: 전투 하단 `#shop` 2단 분리(`helpers.ts`, `screens.ts`, `style.css`), 10종 병과 역할 배지·기능 요약·`i` 버튼(`stopPropagation` → 상세 정보 모달) 및 준비 단계 카메라 `scrollY` 보정으로 방어선/판매 겹침 0px 구현
- [x] 3단계: `tests/ux-edge-cardbay.test.ts` 추가, `npm run verify`(28파일 405테스트·97에셋·빌드 EXIT 0), `npx cap sync ios`(3플러그인·AdMob 0건), `xcodebuild` 시뮬레이터 빌드(`** BUILD SUCCEEDED **`) 및 Headless Chrome 393×852 / 375×667 실측·시각 검증 완료
- [x] 4단계: 최종 커밋·푸시 및 `main` 대상 PR 생성(미병합)

## 결과 보고

- 바뀐 파일: `docs/tickets/T-126-ux-edge-cardbay.md`, `src/device.ts`, `src/main.ts`, `src/ui/helpers.ts`, `src/ui/screens.ts`, `src/ui/style.css`, `src/ui/walk.ts`, `tests/ux-edge-cardbay.test.ts` (레인 A 및 읽기 전용 문서 무변경, 신규 npm 의존성 0건)
- 검증 결과:
  - `npm run verify`: EXIT 0 (`tsc --noEmit`, Vitest 28파일 405케이스 통과, `assets:check` 97개 통과, `vite build` 성공)
  - `npx cap sync ios`: EXIT 0 (iOS 플러그인 3종 유지, `ios/App/CapApp-SPM/Package.swift` 내 AdMob 0건)
  - `xcodebuild` (iPhone 18 Pro 시뮬레이터 `8349CC07-74C9-4B6C-9491-11FE7811B469`): `** BUILD SUCCEEDED **` (EXIT 0)
  - 실측(393×852, `--sa-top: 59px`, `--sa-bottom: 34px`): 좌우 필러박스 `0px` (캔버스 렌더 폭 `393px`), `#shop` 크기 `393 × 133.2px` (`bottom: 34px`), 카드 1장 `73 × 88.2px`, `위병소 방어선`/`대기석`/`판매` 드롭존 겹침 `0px`
  - 실측(375×667 SE, `--sa-top: 20px`, `--sa-bottom: 0px`): `#shop` 컴팩트 높이 `98px`, 카드 1장 `69.8 × 61px`, `위병소 방어선`/`대기석`/`판매` 겹침 `0px`
- 스크린샷: Headless Chrome 393×852(`battle`, `battle info modal`, `walk`) 및 375×667(`battle`) 4종 시각 검증 완료 (후속 QA 워커에서 iOS 시뮬레이터 3종 스크린샷 검증 예정)
- 사용자 확인 방법: `npm run dev` 실행 후 `/?scene=battle&unlock=all&supply=12&safe=1` 및 `/?scene=walk&safe=1`에서 393×852/375×667 뷰포트와 카드 `i` 버튼 동작 확인
- 확인하지 못한 점: iPhone 15 Pro 실기기 재설치 후 터치 감도·시뮬레이터 3종 최종 스크린샷은 후속 QA 단계에서 수행 예정
- 다음 제안: 2차 작업(랜딩/타이틀 화면 · 작전 교범 · 병과 도감 확장)을 별도 티켓으로 진행

## 인계 메모

(없음)
