# T-126 FIGHTSHOOT UX 1차 — Edge-to-Edge 필러박스 제거 + 생활관 상하 마감 + 전투 하단 2단 카드바 확대

상태: 진행 중
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
- `xcodebuild` iOS 시뮬레이터 빌드

## 완료 조건

- [ ] 393×852(iPhone 15 Pro)에서 좌우 필러박스 0px 및 `#shop` 좌우 밀착 확인
- [ ] 생활관 상·하단 검은 공백 마감 및 Safe Area 준수(기존 구역 좌표·히트박스 유지)
- [ ] 전투 하단 `#shop` 2단 분리(393×852 기준 높이 120~136px, 카드 72~74×88~96px), 역할 배지·기능 요약·`i` 버튼 동작 및 `위병소 방어선`/`판매` 겹침 0px
- [ ] `npm run verify` 통과 (EXIT 0)
- [ ] `npx cap sync ios` 통과 및 `Package.swift` AdMob 0건 유지
- [ ] `xcodebuild` 시뮬레이터 빌드 통과
- [ ] `main` 대상 PR 생성(미병합)

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

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모

(없음)
