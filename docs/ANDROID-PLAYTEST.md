# 안드로이드 설치와 첫 실기기 점검

## 준비한 설치판

- 기준: main `93c0c18ffb8d`(#47 병합 포함), 2026-10-29 빌드
- 파일: `android/app/build/outputs/apk/debug/app-debug.apk` (19,146,101바이트, 약19.1MB)
- SHA256: `f08d6fb1681847a0fe2b7ef6280d87dcfb22d3d9fc42c284b66660a25cf6da45`
- 앱: 데프콘 2 / `io.github.kidariseok.defcon2`, 버전1.0(1), Android7.0(API24) 이상
- 디버그 서명 검사 통과. 개발용 설치판이며 스토어 출시용 AAB는 별도다.
- 최신 생활관 배경과 앉은 동료 시트2장이 APK 안에 원본 가공본과 동일하게 포함됐음을 검사했다.
- APK는 이 컴퓨터의 빌드 폴더에 있으며 GitHub에 올리지 않았다. 컴퓨터가 바뀌면 아래 명령으로 다시 만든다.

## USB 설치

1. 폰에서 개발자 옵션을 켜고 USB 디버깅을 켠다. 일반적인 경로는 설정 → 휴대전화 정보 → 소프트웨어 정보 → 빌드번호7회 누르기다. 제조사에 따라 다를 수 있다.
2. 데이터를 전송할 수 있는 USB 케이블로 이 Mac에 연결한다. 폰 잠금을 풀고 ‘USB 디버깅 허용’을 승인한다.
3. 연결 후 Codex에게 알려주면 아래 명령으로 설치·실행한다. 기기 식별자는 공개 기록에 넣지 않는다.

```sh
~/Library/Android/sdk/platform-tools/adb devices -l
~/Library/Android/sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
~/Library/Android/sdk/platform-tools/adb shell am start -n io.github.kidariseok.defcon2/.MainActivity
```

`-r`은 기존 앱 데이터를 보존하는 업데이트 설치다. 서명이 달라 설치에 실패하면 기존 앱을 지우지 말고 먼저 오류를 공유한다. 연결 기기가 여러 개면 대상 기기를 지정해 설치한다.

USB 연결이 어렵다면 APK를 폰으로 직접 옮겨 파일 앱에서 열어 설치할 수도 있다. 파일을 연 앱에 ‘알 수 없는 앱 설치’를 허용해야 할 수 있다. 설치 후 앱 목록에서 ‘데프콘 2’를 연다.

## 확인 순서

추가 보급·전체 해금·무적 없이 일반 조건으로 한다. 기존 진행 중 전투의 이어하기는 지원하지 않으므로 저장 검사는 결과 화면을 본 뒤 한다.

| 순서 | 확인할 것 | 기록 |
|---|---|---|
| 1 | 기종·Android버전, 첫 화면이 뜨는 데 걸린 시간 | 미확인 |
| 2 | 가로로 돌려도 세로 유지, 노치/하단 제스처 바가 버튼을 가리지 않는가 | 미확인 |
| 3 | 생활관 침대 사이 이동, 관물대 열기, 두 동료에게 다가가 대화 | 미확인 |
| 4 | 전투 투입, 구매·배치·합성·특기 선택의 터치가 편한가 | 미확인 |
| 5 | 뒤로가기 시 확인/일시정지 UI, 취소 후 정상 복귀 | 미확인 |
| 6 | 게임 소리가 나는 상태에서 홈으로 이동하면 즉시 정지, 복귀 시 재개 | 미확인 |
| 7 | 일반 한 판의 도달 웨이브·플레이 시간·패배 이유·한 판 더 하고 싶은가 | 미확인 |
| 8 | 결과→생활관→재투입 흐름, 결과 뒤 앱 완전 종료/재실행 시 이름·기록·해금 유지 | 미확인 |
| 9 | 테스트 보상형 광고 재생/음소거/복귀/보상1회, 취소·실패 시 보상 미지급 | 미확인 |

광고 검사는 인터넷 연결이 필요하다. 광고가 준비되지 않아 버튼을 누를 수 없다면 ‘미확인’으로 기록한다. 광고 해금 등 아직 연결되지 않은 슬롯은 연결된 기능의 통과와 구분한다.

불편한 장면의 화면 사진과 ‘누른 것 → 기대한 결과 → 실제 결과’를 남긴다. 알림/개인정보가 사진에 보이면 저장소에 넣기 전에 가린다. 상세 게임 체감 기록표는 [PLAYTEST.md](PLAYTEST.md)를 사용한다.

## 재빌드

저장소 루트에서:

```sh
npm run verify
npx cap sync android
cd android
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home ANDROID_HOME=/Users/jinseokoh/Library/Android/sdk ./gradlew assembleDebug
```

재빌드하면 APK 해시가 달라질 수 있다. 새 빌드를 검사할 때 기준 커밋과 해시를 다시 기록한다.
