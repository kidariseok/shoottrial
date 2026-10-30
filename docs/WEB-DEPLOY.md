# 모바일 웹 체험판 배포

앱 스토어 출시와 USB 설치는 보류하고 웹 체험판을 우선한다. Vite 정적 사이트여서 별도 서버·데이터베이스·비밀 키가 필요 없다.

## Vercel 프로젝트

- 저장소: `kidariseok/shoottrial`
- 확인한 프로젝트: `jspersonal1/newbie-defense`
- 운영 주소: https://newbie-defense.vercel.app
- 운영 원본: `main`. 기능 브랜치의 변경은 사용자 PR 병합 후 운영에 반영한다.
- T-120 미리보기: https://newbie-defense-git-kidariseok-t120-mobile-web-jspersonal1.vercel.app/ (Ready 및 시작→성명 입력 확인). 이 주소는 기능 브랜치 검토용이다.
- 브라우저에서 기존 main의 첫 운영 배포 성공 화면을 확인했다. T-120 최신 변경의 배포 여부는 티켓 결과 보고의 PR/미리보기 확인을 기준으로 한다.

Vercel 설정은 루트 `vercel.json`에 있다. Framework는 Vite, Build Command는 `npm run verify`, Output Directory는 `dist`, Root Directory는 저장소 루트다. 패키지는 lockfile로 설치하고 환경변수는 추가하지 않는다. `verify`에서 테스트·에셋·타입 검사까지 실패하면 배포 빌드도 실패하게 한다.

주소 파라미터로 화면을 고르므로 모든 경로를 index.html로 덮는 rewrite는 필요 없다. 존재하지 않는 에셋은 정상적인404로 남긴다. 에셋 이름이 같은 채 갱신되는 그림이 있어 캐시는 매번 재검증하도록 설정했다. 오프라인 캐시/서비스워커는 사용하지 않는다.

설정 근거: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [vercel.json](https://vercel.com/docs/project-configuration/vercel-json).

## 휴대폰에서 실행

1. 최신 Android Chrome 또는 iPhone Safari에서 위 운영 주소를 연다. 카카오톡/Instagram 내부 브라우저에서는 메뉴의 ‘외부 브라우저로 열기’를 권장한다.
2. 세로로 들고 ‘게임 시작’을 누른다. 소리는 첫 터치 후 허용되며, 처음에는 이름→브리핑→생활관으로 이어진다.
3. 빈 바닥을 드래그해 걷고, 오른쪽 아래 ‘전투 투입’을 누른다. 전투에서 카드 구매·끌어서 배치·합성을 체험한다.
4. 지원하는 브라우저에서는 ‘전체 화면으로 시작’을 사용할 수 있다. 지원하지 않으면 해당 버튼은 숨겨지고 일반 화면으로 진행한다.
5. 앱처럼 열려면 Android Chrome 메뉴(⋮) → ‘홈 화면에 추가/앱 설치’, iPhone Safari 공유 → ‘홈 화면에 추가’. 이후 홈 화면 아이콘으로 실행한다.

홈 화면의 독립 창/세로 방향은 브라우저 지원 범위에 따른다. [독립 실행 안내](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Create_a_standalone_app). 모바일 가로 화면에서는 안내를 띄우고 활성 씬을 정지했다가 세로 복귀 시 그 씬만 재개한다. 기존 일시정지/특기 선택 상태를 임의로 해제하지 않는다.

## 체험판의 범위

- 인터넷 연결이 필요하다. 오프라인 실행을 지원한다고 안내하지 않는다.
- 이름·해금·최고 기록·설정은 같은 주소의 같은 브라우저 저장소에 남는다. 방문 기록/사이트 데이터 삭제, 시크릿 모드 종료, 브라우저나 도메인 변경 시 이어지지 않을 수 있다. 기기 간 동기화·로그인·서버 저장은 없다.
- 전투 도중 진행 상황은 저장하지 않는다. 이름 입력·설정·해금·판 종료 시점의 기록만 저장한다.
- AdMob은 네이티브 앱용이다. 웹에서 가짜 광고를 재생하지 않는다. ‘체험 보급 +5/체험 무료/체험 부활’을 누르면 광고 없이 제공함을 안내하고 ‘보상 받기/취소’를 선택한다. 기존 판당 횟수 제한·전투 수치는 유지한다.
- PX 광고 해금은 이번에도 추가하지 않는다. 일반 플레이의 웨이브5 도달 해금을 사용한다.
- Android 앱의 Preferences와 웹 저장은 별개다. 웹→앱 자동 이전은 지원하지 않는다.

## 배포 확인

PR을 병합한 뒤 Vercel 프로젝트의 최신 Production Deployment가 Ready인지 확인하고, 운영 주소에서 웹 체험판 시작 화면이 나오는지 확인한다. 예전 버전이면 새로고침하고 연결 브랜치와 커밋을 확인한다. 별도 Preview URL은 버전마다 바뀌므로 일반 사용자에게는 운영 주소를 공유한다. Preview에 Vercel 로그인이 필요하면 보호 설정을 임의로 낮추지 않고 운영 배포로 확인한다.

브라우저 검사는 `npm run verify` 후 `npx vite preview --host 127.0.0.1 --port 5204`로 production 결과물을 실행해 한다. 테스트 URL은 `/?scene=walk&safe=1`, `/?scene=battle&seed=7&safe=1`. 실제 사용자에게는 디버그 파라미터 없이 `/` 주소를 공유한다.

출시 판단 전에 실제 폰으로 터치·노치/하단바·주소창 높이 변화·소리·홈 화면 실행과 일반 한 판을 확인한다. PC의 모바일 크기 검사는 실물 검사를 대신하지 않는다. [플레이 기록표](PLAYTEST.md)를 사용한다.
