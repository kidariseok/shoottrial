# T-119 최신 안드로이드 설치판과 실기기 플레이테스트

상태: 보류(사용자 웹 배포 우선 전환)
담당: Codex + 사용자(실기기 체감)

## 목표

#47까지 병합된 최신 게임의 설치용 APK를 만들고, 실기기 점검과 한 판 플레이 결과를 기록한다.

## 선행

- T-118 완료, #47 MERGED 확인(2026-10-28T23:39:00Z)
- T-101, P-101 에뮬레이터 대체 완료. 실물 검증은 이번에 수행한다.

## 소유 경로

- `docs/HANDOFF.md`
- `docs/ANDROID-PLAYTEST.md`
- `android/`

## 허용 의존성

- 없음

## 참고 문서

- docs/HANDOFF.md §4~6
- docs/TECH.md §3~6, §9, §11
- docs/tickets/T-101-android-spike.md 결과 보고
- docs/PLAYTEST.md

## 할 일

1. 최신 main 검증 후 Capacitor 동기화와 디버그 APK 빌드.
2. 연결 기기가 있으면 업데이트 설치와 실행. 없으면 설치 파일과 연결 안내 준비.
3. 실기기의 세로 고정·안전 영역·뒤로가기·저장·오디오·광고와 일반 한 판을 점검.
4. 실제 결과/미확인 항목을 구분해 기록. 발견한 제품 결함은 별도 수정 티켓으로 분리.

## 검증 명령

- npm run verify
- npx cap sync android
- JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home ANDROID_HOME=/Users/jinseokoh/Library/Android/sdk ./gradlew assembleDebug (android 폴더)
- adb devices -l / 연결 후 adb install -r <APK>

## 완료 조건

- [x] npm run verify 통과, 동기화와 APK 빌드 성공
- [x] 빌드 기준·파일 경로·해시 및 설치/검사 안내 기록
- [ ] 실제 안드로이드 폰에 설치·실행
- [ ] 기본 플랫폼 동작과 일반 한 판 결과 기록
- [ ] 실기기 사진 및 확인하지 못한 점 기록

디버그 URL: 브라우저 참고용 ?scene=walk&safe=1. APK는 기본 게임 진입이며 웹 개발 전용 URL을 사용할 수 있다고 가정하지 않는다.

## 작업 계획

1. 읽기 전용으로 연결 기기/빌드 도구/병합 상태 확인, 별도 브랜치 활성화.
2. 기존 코드 변경 없이 verify → cap sync → assembleDebug. android 생성물 변경이 있으면 검토한다.
3. docs/ANDROID-PLAYTEST.md에 최신 APK 설치와 실물 점검표 작성.
4. 기기 연결 후 설치/실행/사진 수집, 사용자 체감 결과와 함께 티켓/HANDOFF 갱신.

## 질문

- [x] 사용자 “응 해보자”로 최신 버전 실기기 설치·한 판 점검 제안 승인.
- [ ] USB 디버깅을 허용한 안드로이드 폰 연결 필요. 연결 가능 여부와 기종을 질문했다.

## 진행 기록

- 2026-10-30 사용자 앱 출시/USB 설치 보류, T-120 모바일 웹/Vercel 배포로 전환. APK 준비까지만 수행했고 실기기 항목은 미완료다.

- 기준 커밋: 93c0c18ffb8d
- 브랜치: kidariseok/t119-android-playtest
- 세션 시작: Codex, 2026-10-29 KST
- [x] #47 병합/최신 main 확인, JDK21·SDK36·ADB 설치 확인. 샌드박스 밖 ADB 실행으로 기기 목록을 확인했으나 비어 있음. 사용자에게 USB 연결 질문, 기기와 독립적으로 빌드 준비 진행.

## 결과 보고

- 바뀐 파일: 이 티켓, docs/ANDROID-PLAYTEST.md, docs/HANDOFF.md. 제품 코드/의존성/추적 중 android 파일 변경 없음.
- 검증: npm run verify 통과(23파일364테스트·97에셋·타입/웹빌드). 기존 번들 크기 경고 유지.
- 동기화: cap sync android 성공, 기존 플러그인3개 확인.
- APK 빌드: BUILD SUCCESSFUL in 16s, 185 actionable tasks: 75 executed, 110 up-to-date. 기존 flatDir/AdMob deprecated 경고, 실패 없음.
- 패키지 검사: apksigner verify 성공, appId io.github.kidariseok.defcon2·min24/target36·debuggable·portrait 확인. dist/index와 배경/앉은시트2개가 APK 내 바이트 동일. 웹 번들에 공식 테스트 보상형ID 포함 확인(실제 광고 시청/보상은 미확인).
- APK: android/app/build/outputs/apk/debug/app-debug.apk, 19146101바이트, SHA256 f08d6fb1681847a0fe2b7ef6280d87dcfb22d3d9fc42c284b66660a25cf6da45. 파일은 ignored 빌드 폴더, 미커밋.
- [x] 빌드/정적 패키지 검사·설치/점검 안내 준비 완료. 다음은 USB 기기 연결 후 설치/실제 입력 검사. 실기기 결과를 받기 전 완료/출시 가능으로 표시하지 않는다.
- 실기기: 미연결, 미확인
- 스크린샷: 실기기 미연결이라 촬영하지 않음. 브라우저 재촬영으로 대체하지 않음.
- 다음: APK 준비 후 기기 연결·설치·일반 한 판

## 인계 메모

- APK는 디버그 서명/테스트 광고용이며 공개 출시 파일이 아니다. 키/원본/APK를 저장소에 커밋하지 않는다.
- 기존 앱 데이터는 adb install -r로 보존한다. 서명이 달라 실패하면 삭제하지 말고 기록한다.
