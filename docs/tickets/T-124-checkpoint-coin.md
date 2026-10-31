# T-124 선택한 B안 위병소 코인을 구매 자원에 적용

상태: 완료
담당: Codex

## 목표

사용자가 선택한 B안 강철 위병소 코인을 보유량·카드 가격·리롤 비용·체험 지급 버튼에 동일하게 표시한다.

## 선행

- 사용자 B안 선택/게임 적용 승인(2026-10-31).
- 최신 main71462f2. 원본 폴더의 T-122 음악/T-123 앱인토스 작업은 이 워크트리에 가져오지 않는다.

## 소유 경로

- `src/assets.ts`
- `src/data.ts`
- `src/ads.ts`
- `src/ui/screens.ts`
- `src/ui/walk.ts`
- `src/ui/style.css`
- `tests/assets.test.ts`
- `public/assets/icon_coin.png`
- `public/assets/index.json`
- `art/LEDGER.json`
- `art/source/icon_coin/meta.json`
- `docs/HANDOFF.md`

## 허용 의존성

- 없음

## 참고 문서

- docs/ART.md §2,4 (픽셀풍·투명 처리·계약)
- docs/TECH.md §3,8 (세로/안전영역·공유 함수 유지)
- scripts/assets.mjs 기존 아이콘 가공 흐름

## 할 일

1. 승인된 원본을 기존 에셋 처리기로64×64 투명 PNG로 가공·계약/색인/장부 등록.
2. 보유량/가격/리롤/추가 지급에 아이콘과 숫자 표시. 접근성 이름에는 코인 의미와 금액 제공.
3. 부족 안내·체험 지급·취사병 특기 설명/대사의 구매 자원 표현 정리. 내부 supply 변수·수치/경제 규칙은 유지.
4. 모바일 화면과 실제 구매/리롤/부족/체험 지급 확인, verify·사진·PR.

## 검증 명령

- node scripts/assets.mjs icon_coin
- npm run verify
- git diff --check

## 완료 조건

- [x] 승인 B안 가공본/계약/장부 일치, 원본 PNG 미커밋
- [x] HUD/상점/리롤/추가 지급 아이콘·금액과 접근성 의미
- [x] 실제 금액 증감/부족 안내·모바일 배치 확인, 사진
- [x] verify 결과/한계/PR 기록

디버그 URL: ?scene=battle&seed=7&safe=1

## 작업 계획

1. origin/main에서 /private/tmp/moonfish-t124 별도 워크트리(kidariseok/t124-checkpoint-coin).
2. src/assets.ts와 기존 처리기로 icon_coin 생성, 관련 색인/장부/기존 계약 수 검사 갱신.
3. screens.ts에 단일 코인 이미지 생성 함수와 금액 표시, CSS 최소 크기/대비/이미지 누락 대체. data/ads/walk는 사용자에게 보이는 문구만 정리.
4. 390×844/320×568에서 실제 버튼/금액 검사·사진, 검증 저장/PR. 선택 시안을 다시 승인받지 않는다.

## 질문

- [x] 사용자 “B안으로 게임에 적용해줘”로 선택 및 구현 승인.

## 진행 기록

- 기준 커밋: 71462f2
- 브랜치: kidariseok/t124-checkpoint-coin
- 세션 시작: Codex, 2026-10-31 KST
- [x] AGENTS/HANDOFF/선택 원본/기존 에셋·UI 확인. 다른 세션의 변경이 많아 원본 폴더는 읽기만 하고 별도 워크트리에서 시작.

## 승인 그림과 프롬프트

- 원본: art/inbox/coin-concepts-2026-10-31/coin-b-checkpoint.png (원본 폴더에 보존, 미커밋)
- 생성: 내장 image_gen, 1254×1254 투명 PNG. B안 사용자 승인.
- 프롬프트: 픽셀풍 구매 자원용 원형 강철 코인, 위병소 건물과 양쪽 문기둥을 큰 부조로 배치. 짙은 남색 윤곽·차분한 은회색·작은 황동 하이라이트, 좌상단 광원, 작은 화면 가독성. 글자/실존 국가·부대 표식/붉은 십자/붉은색·주황/외부 발광 없음.

## 결과 보고

- PR: https://github.com/kidariseok/shoottrial/pull/55 (사용자 병합 대기). 원본 PNG 미커밋 확인: 추적하는 source 파일은 meta.json만이다.
- 변경: 승인 B 원본을 기존 처리기로 icon_coin64×64/6987바이트/투명1669픽셀로 가공. 계약115개·실제에셋98개, 색인·장부·출처 메타 일치. 원본 PNG는 ignored art/source/icon_coin/01.png에 보존, 미커밋.
- UI: HUD24px·카드18px 코인과 금액, 리롤/체험 지급도 같은 아이콘. 보유량/가격/비용/지급은 접근성 이름으로 의미 제공. 이미지 누락 시 은회색 원형 대체. 부족 안내/체험 지급/취사병 설명과 대사에서 구매 자원을 코인으로 안내. 내부 supply 변수·보상/가격·경제 규칙·공유 함수 변경 없음.
- 검증: npm run verify 통과(25파일387테스트·98에셋·타입/빌드). 기존 번들500KB 경고·Node localStorage 실험 경고 유지. git diff --check 통과.
- 실제 production preview390×844: 아이콘8개 모두64px원본 로드, 보유6→구매5→리롤4→체험지급9와 접근성 이름 동기화 확인. 보유0에서 구매 시 차감 없이 ‘코인이 부족합니다’.320×568 컨트롤/카드금액이 화면 안에 있고 가로 넘침 없음. 별도 모바일/터치 문맥에서 코인 요청 차단 시 대체8개·금액/접근성 유지·pageerror0.
- 사진: docs/shots/T-124-coins.png, T-124-small-phone.png, T-124-insufficient.png, T-124-fallback.png.
- 사용자 확인: ?scene=battle&seed=7&safe=1 에서 위 보유량/아래 카드가격·리롤·추가 지급. 일반 플레이는 주소 파라미터 없이 시작.
- 미확인: 실물 휴대폰/VoiceOver·TalkBack 읽기 체감, 공개 운영 배포. 별도 진행 중 음악/앱인토스/모바일 렌더링 PR은 이번 작업에 포함하지 않음.
- 다음: 사용자 PR 병합 후 운영 주소에서 적용 확인.

## 인계 메모

- 새 그림을 생성하지 않고 승인된 B 원본만 크기/투명도 가공한다. 이름보다 아이콘+숫자로 보이게 하되 스크린리더에는 의미 제공.
