# R-101 구글 플레이 출시 요건·정책·등급·행정·Capacitor 플러그인 확인표

상태: 진행 중
담당: Antigravity · gemini-3.8-flash-medium (역할 카드: `docs/agents/antigravity-research.md`)

## 목표

`docs/research/play-launch.md` 한 파일만 보면 다음 세 가지를 알 수 있다.
- **개인** 개발자가 이 게임(무료, 보상형 광고)을 구글 플레이에 출시하기까지의 절차와 기간
- 지켜야 할 정책과 등급
- `docs/TECH.md` §1·§4의 ❓ 항목에 대한 답

모든 행에 출처 URL과 확인일이 붙어 있다.

## 선행

- 없음

## 소유 경로

- `docs/research/play-launch.md`

## 허용 의존성

- 없음

## 참고 문서

- `docs/agents/antigravity-research.md` 전체(도구 순서, 결과 형식, 금지 사항)
- `docs/TECH.md` §1, §4, §7
- `docs/GDD.md` §2.3(실명 정책), §10(광고)
- `docs/_archive/tickets/R-002-launch-legal.md`(이전 방향의 행정 조사 항목. 앱인토스 부분은 무시)
- 공식: Play Console 고객센터, Android Developers, Capacitor 문서(capacitorjs.com), AdMob 고객센터, 법제처(law.go.kr), 게임물관리위원회(grac.or.kr)

## 할 일

1. **Play Console 개인 계정**
   - 등록비, 신원 확인 절차, 걸리는 기간
   - **비공개 테스트 요건**: 테스터 수·기간이 지금도 12명·14일인지, 적용 대상(계정 생성일)
   - 프로덕션 액세스 신청 질문 항목
2. **앱 기술 요건**: 지금 기준 타깃 API 레벨과 마감일, AAB, Play 앱 서명, 64비트, 앱 크기 제한
3. **정책**
   - 실제 국가(북한군)·전쟁이 나오는 게임 콘텐츠가 허용되는 범위(부적절한 콘텐츠, 민감한 사건 정책)
   - 보상형 광고 정책
   - 대상 연령 설정(가족 정책을 피하려면 몇 세 이상으로 둬야 하는지)
   - 데이터 보안 양식(AdMob이 수집하는 항목)
   - 개인정보처리방침 URL 요건(GitHub Pages로 충분한지)
4. **등급**: IARC 설문으로 한국 등급을 받을 수 있는지(구글의 자체등급분류). 피 없는 전투, 북한군 묘사일 때 예상 등급
5. **한국 행정**(개인, 무료 + 광고 수익, 구글 플레이만)
   - 게임제작업·배급업 등록이 필요한지
   - 사업자등록이 필요한 시점
   - AdMob 수익의 세금 처리 개요
   - AI기본법 생성형 AI 표시 의무의 현재 시행 상태
6. **Capacitor·플러그인**(이름과 버전은 npm과 공식 문서로 확인)
   - Capacitor 최신 안정 버전, 그 버전의 Android 최소·타깃 SDK, 필요한 JDK·Android Studio 버전
   - `@capacitor/app`: 뒤로가기 이벤트, 앱 백그라운드·복귀 이벤트의 정확한 이름과 예제
   - `@capacitor/preferences`: get/set API
   - 세로 고정 방법(AndroidManifest `screenOrientation`)
   - Android 15+ edge-to-edge에서 WebView의 `env(safe-area-inset-*)`가 동작하는지, 아니면 다른 플러그인·설정이 필요한지
   - AdMob 플러그인 후보(`@capacitor-community/admob` 등)
     - Capacitor 버전 호환
     - 보상형 광고 load/show API와 **보상·닫힘·실패 이벤트 이름**
     - 테스트 광고 단위 ID
     - 동의(UMP) 필요 여부(출시 국가를 한국으로 한정할 때)
7. **G3용 출시 체크리스트 표**: 위 결과를 "출시 전 확인 항목 | 확인 방법" 표로 정리한다.

## 검증 명령

- 없음(조사 티켓). 결과 파일의 모든 행에 URL과 확인일이 있는지 스스로 점검한다.

## 완료 조건

- [ ] `docs/research/play-launch.md`가 역할 카드의 형식(요약·확인 표·게임에 쓰는 제안·빈칸)을 따른다
- [ ] 할 일 1~7의 모든 항목에 답 또는 "빈칸" 표시가 있다
- [ ] `docs/TECH.md` §4의 ❓ 항목마다 대응하는 행이 있다(표에 "TECH §4" 열)
- [ ] 등급 C만 있는 사실에는 "추가 확인 필요" 표시

## 작업 계획

1. **1단계: Play Console 개인 계정 요건 조사**
   - 개발자 계정 등록비, 신원 확인 절차, 소요 기간, 비공개 테스트 규정(12명/14일 기준 및 적용 대상), 프로덕션 신청 질문 항목
   - 바꿀 파일: 없음 (조사)
2. **2단계: 기술 요건 및 스토어 정책 조사**
   - 타깃 API 레벨 및 마감일, 64비트, AAB, Play 서명, 앱 크기 제한
   - 북한군/전쟁 소재 허용 한도(부적절한 콘텐츠/민감한 사건), 보상형 광고 정책, 대상 연령(가족 정책 회피 기준), 데이터 보안(AdMob 수집 항목), 개인정보처리방침 요건
   - 바꿀 파일: 없음 (조사)
3. **3단계: 등급분류 및 국내 행정 요건 조사**
   - IARC 설문 및 한국 자체등급분류 효력, 예상 등급
   - 게임제작업/배급업 등록 의무 여부, 사업자등록 시점, AdMob 수익 세무 처리, AI기본법 생성형 AI 표시 의무 현황
   - 바꿀 파일: 없음 (조사)
4. **4단계: Capacitor 및 플러그인 사양 조사**
   - Capacitor 최신 안정 버전 및 Android SDK/Studio 요구사항
   - `@capacitor/app` 생명주기/뒤로가기 이벤트 API
   - `@capacitor/preferences` get/set API
   - 세로 고정 설정 및 Android 15+ Safe Area WebView 호환성
   - `@capacitor-community/admob` API, 이벤트명, 테스트 광고 단위 ID, UMP 동의 요건
   - 바꿀 파일: 없음 (조사)
5. **5단계: 결과 문서 작성 및 검증**
   - `docs/research/play-launch.md`에 역할 카드 형식(요약, TECH §4 대응 포함 확인표, 게임 제안, 빈칸, G3 체크리스트) 작성
   - 바꿀 파일: `docs/research/play-launch.md`
   - 검증 명령: 결과 문서 내 모든 행의 URL, 확인일, TECH §4 대응 누락 여부 자체 점검

## 질문

- [ ] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요

## 진행 기록

- 기준 커밋: 294b3331124f
- 브랜치: kidariseok/fix-r101-play-launch
- 세션 시작: gemini-3.8-flash-medium, 2026-10-20T17:06:40+09:00

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷: 해당 없음
- 사용자 확인 방법: `docs/research/play-launch.md`의 요약 5줄
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
