# T-120 모바일 웹 체험판·Vercel 배포 준비

상태: 진행 중
담당: Codex

## 목표

휴대폰에서 Vercel HTTPS 주소를 열어 게임을 체험하고, 홈 화면에서도 실행할 수 있는 웹 배포본을 준비한다. 앱 출시/실기기 USB 설치는 사용자 요청으로 보류한다.

## 선행

- T-118 완료·#47 병합. T-119는 앱 우선순위 변경으로 보류, 실기기 검사 미완료.

## 소유 경로

- `index.html`
- `vercel.json`
- `.gitignore`
- `.impeccable/config.json`
- `src/main.ts`
- `src/web.ts`
- `src/platform.ts`
- `src/ads.ts`
- `src/ui/screens.ts`
- `src/ui/lobby.ts`
- `src/ui/style.css`
- `public/web/`
- `public/manifest.webmanifest`
- `tests/ads.test.ts`
- `docs/WEB-DEPLOY.md`
- `docs/HANDOFF.md`
- `docs/tickets/T-119-android-playtest.md`

## 허용 의존성

- 없음

## 참고 문서

- docs/HANDOFF.md §4~6, docs/TECH.md §3,5~9
- Vercel 공식: https://vercel.com/docs/frameworks/frontend/vite
- Vercel 설정: https://vercel.com/docs/project-configuration/vercel-json
- MDN: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Create_a_standalone_app

## 할 일

1. Vite 정적 배포 설정, HTML 메타/웹 매니페스트/홈 화면 아이콘.
2. 모바일 브라우저 진입 안내·전체 화면 선택·홈 화면 추가 안내·가로 화면 안내/게임 정지.
3. 웹 보상은 광고 없는 체험 보상으로 명시하고 확인/취소를 제공한다. 네이티브 광고는 유지한다.
4. production 빌드로 첫 실행→브리핑→생활관→전투·저장/재실행·화면 크기/회전·체험 보상 확인.
5. Vercel 연결 상태에 따라 배포 또는 계정에서 실행할 정확한 절차 제공. 실제 URL 확인 전 배포 완료로 쓰지 않는다.

## 검증 명령

- npm run verify
- npx vite preview --host 127.0.0.1 --port 5204
- git diff --check

## 완료 조건

- [ ] 검증·production 모바일 브라우저 점검·사진
- [ ] Vercel 빌드/출력/캐시 설정과 배포 안내
- [ ] 모바일 진입·독립 실행용 메타/아이콘·가로 화면 처리
- [ ] 웹 보상 명시·확인/취소 및 기존 중복 방지 유지
- [ ] 저장 범위·온라인 필요·실물/실배포 미확인 구분

디버그 URL: ?scene=walk&safe=1, ?scene=battle&seed=7&safe=1

## 작업 계획

1. origin/main 별도 브랜치에서 웹 배포 전환 티켓 활성화, T-119 보류 기록 복원.
2. 위 소유 경로 안에서 웹 실행 화면/매니페스트/정적 설정·보상 문구 연결. 공유 함수 시그니처/전투 수치 변경 없음.
3. 의미 있는 보상 검증을 보완하고 production preview를 모바일 크기·터치·회전으로 확인.
4. 배포 연결 확인·결과 기록·자동 저장/PR 제출. 계정 인증이 필요하면 사용자의 계정 연결만 남긴다.

## 질문

- [x] 사용자 웹 우선 전환 및 필요한 작업 수행 지시로 승인. 새 의존성/외부 결제 없음.
- [ ] Vercel 기존 프로젝트 유무 질문 중. 계정/연결 없는 상태에서 새 공개 URL을 추정하지 않는다.

## 진행 기록

- 기준 커밋: 93c0c18ffb8d
- 브랜치: kidariseok/t120-mobile-web
- 세션 시작: Codex, 2026-10-30 KST
- [x] 앱 작업 보류 요청 확인, origin/main에서 새 브랜치. Vercel 도구/CLI/프로젝트 연결 없음. 공식 정적 Vite/manifest 설정 확인. 웹 기본 저장·터치·오디오 기반 있음. 기존 web rewarded stub은 공개 전에 체험판 안내로 교체 필요.
- [x] 웹 시작/전체 화면/홈 화면 안내·192/512 매니페스트 및180 iOS 아이콘, 가로 안내/활성 씬 정지, 웹 체험 보상 확인/취소·네이티브 광고 유지. verify365테스트·97에셋·타입/빌드 통과. production390×844 터치 첫실행4컷/이름 저장·재실행/생활관→전투, 취소 시6유지·승인 시11,390×700/320×568 넘침없음·가로안내/복귀·오류0 확인. 사진6장.
- [x] 브라우저에서 사용자가 만든 Vercel newbie-defense/jspersonal1 프로젝트와 newbie-defense.vercel.app 도메인 확인. 최신 변경은 아직 로컬 브랜치, main 배포와 구분. 전체 창 URL 조회는 자동 승인 검토의 개인정보 사유로 거절돼 이후 로컬 전용 페이지 QA로 제한.
- [x] 디자인 훅의 index.html dark-glow는 HTML 내 shadow 선언이 없고 이번 수정도 메타뿐인 오탐. 개발자 지시에 따라 index.html의 해당 규칙값만 .impeccable/config.json에 예외 기록. 새 CSS에 glow 추가 없음, 기존 경보 스타일 유지.

## 결과 보고

- 진행 중

## 인계 메모

- 서비스워커/오프라인 캐시는 이번 범위에 없다. 새 배포가 오래된 그림과 섞이는 캐시를 피하고 온라인 접속 기준으로 한다.
- 웹 저장은 같은 주소·같은 브라우저에 한정한다. Android Preferences 저장과 자동 동기화되지 않는다.
