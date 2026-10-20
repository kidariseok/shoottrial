# 구글 플레이 출시 요건·정책·행정·Capacitor 플러그인 조사 (R-101)

> 조사일: 2026-10-20, 모델: Antigravity (Gemini 3.8 Flash Medium). 사실·추측·게임용 허구를 구분했다.

## 요약 (5줄 이내)

1. **개인 계정 출시**: 2023-11-13 이후 생성된 신규 개인 계정은 프로덕션 전 최소 12명의 테스터가 14일간 연속 옵트인한 비공개 테스트를 반드시 통과해야 한다.
2. **기술 요건**: 타깃 API 레벨(2025년 Android 15/API 35, 2026년 Android 16/API 36), AAB 포맷, Play 앱 서명, 64비트 지원이 필수다.
3. **정책 및 등급**: IARC 설문으로 한국 게임물관리위원회 등급(12세 이용가 예상)이 무료 자동 부여되며, 가족 정책을 회피하려면 대상 연령을 13세 이상(권장 16세 또는 18세 이상)으로 설정해야 한다.
4. **한국 행정**: 구글 플레이 개인 계정은 초기 게임제작업/사업자등록증 제출 없이 출시 가능하며, AdMob 해외 광고 수익은 5월 종합소득세 자진 신고(사업자 전환 시 영세율 부가세 신고)를 따른다. AI기본법에 따라 AI 생성 고지를 게임 내에 표시한다.
5. **Capacitor 스택**: `@capacitor/app`(`backButton`, `appStateChange`, `pause`, `resume`), `@capacitor/preferences`(get/set), `@capacitor-community/admob`(테스트 ID `ca-app-pub-3940256099942544/5224354917`, `Rewarded`, `Dismissed` 이벤트)을 사용한다.

---

## 확인 표

| 항목 | 내용 | TECH §4 | 등급 | 출처(URL) | 확인일 |
|---|---|:---:|:---:|---|---|
| 개인 계정 등록비 | 1회 $25 USD (등록 시 신용/체크카드 결제, 추가 유지비 없음) | — | A | https://support.google.com/googleplay/android-developer/answer/6112435 | 2026-10-20 |
| 개인 계정 신원 확인 | 정부 발급 사진 신분증(주민등록증, 운전면허증, 여권), 주소 증명 서류, 실물 안드로이드 기기 인증. 심사는 보통 2영업일 이내 완료 | — | A | https://support.google.com/googleplay/android-developer/answer/13628312 | 2026-10-20 |
| 비공개 테스트 요건 | 2023-11-13 이후 생성된 신규 개인 계정 필수. 최소 12명의 테스터가 14일간 연속으로 옵트인 및 설치 유지(내부 테스트 불인정). 중도 이탈로 12명 미만 시 기간 리셋 가능 | 비공개 테스트 요건 | A | https://support.google.com/googleplay/android-developer/answer/14151465 | 2026-10-20 |
| 프로덕션 액세스 신청 설문 | 14일 충족 후 콘솔에서 신청. 질문 항목: ① 앱의 핵심 가치 및 타깃층 ② 테스터 모집 경로 ③ 테스트 중 수집한 피드백 ④ 피드백을 반영한 개선 및 버그 수정 내역 | — | A | https://support.google.com/googleplay/android-developer/answer/14151465 | 2026-10-20 |
| 타깃 API 레벨 요건 | 매년 8월 31일 마감. 신규 앱 및 업데이트 기준 2024년 Android 14(API 34), 2025년 Android 15(API 35), 2026년 Android 16(API 36) | 타깃 API 레벨 요구 | A | https://support.google.com/googleplay/android-developer/answer/11926878 | 2026-10-20 |
| 앱 패키징 및 서명 | AAB(Android App Bundle) 필수(APK 배포 불가). 구글 Play 앱 서명(Play App Signing) 필수 | AAB + Play 앱 서명 | A | https://developer.android.com/guide/app-bundle | 2026-10-20 |
| 아키텍처 및 크기 | 64비트 아키텍처(arm64-v8a, x86_64) 필수 포함. 기본 AAB 다운로드 크기 제한 200MB(본 웹 패키징 게임은 30MB 미만으로 충분) | — | A | https://developer.android.com/google/play/publishing/multiple-apks#64-bit | 2026-10-20 |
| 콘텐츠 정책 (전쟁·북한군) | 민감한 사건(Sensitive events) 정책상 현재 진행 중인 참사·전쟁의 상업적 이용 및 편승 금지. 본 게임은 피·사체 없는 가상 시나리오 전략극이며 스토어 메타데이터에 현실 정치/분쟁 키워드를 배제하므로 정책 위반 없음 | 전쟁·실제 국가 콘텐츠 정책 | A | https://support.google.com/googleplay/android-developer/answer/9876937 | 2026-10-20 |
| 보상형 광고 정책 | 시청 전 보상 내용 명확 고지 필수, 자동 재생 금지(명시적 클릭만), 시청 중 취소/이탈 권한 보장(이탈 시 보상 미지급은 허용), 현금 환전성 보상 금지 | — | A | https://support.google.com/googleplay/android-developer/answer/9857753 | 2026-10-20 |
| 대상 연령 및 가족 정책 | 13세 미만을 대상에 포함하면 '가족 정책(Families Policy)'이 강제되어 Google 인증 광고 SDK만 써야 하고 개인 맞춤 광고/AAID 수집이 금지됨. 가족 정책 회피를 위해 타깃 연령을 13세 이상(권장 16세 이상 또는 18세 이상)으로 설정하고 "어린이 대상 앱인가?"에 '아니오' 선택 필수 | — | A | https://support.google.com/googleplay/android-developer/answer/9893335 | 2026-10-20 |
| 데이터 보안 양식 (Data Safety) | AdMob 탑재 시 콘솔에 수집 데이터 신고 필수: 대략적 위치, 기기/기타 ID(광고 ID), 앱 활동(노출/상호작용), 성능 및 진단(충돌 로그) | 데이터 보안 양식 | A | https://developers.google.com/admob/android/data-safety | 2026-10-20 |
| 개인정보처리방침 URL | AdMob 사용 시 필수. 공개 웹으로 접근 가능한 정적 페이지 URL(GitHub Pages `https://<user>.github.io/...`)로 완벽히 충족됨 | 개인정보처리방침 URL | A | https://support.google.com/googleplay/android-developer/answer/10144990 | 2026-10-20 |
| 광고 포함 표시 | 구글 Play Console '앱 콘텐츠' 섹션에서 "앱에 광고가 포함되어 있습니까?"에 '예'로 필수 선언 (스토어에 '광고 포함' 배지 표시) | 광고 포함 표시 | A | https://support.google.com/googleplay/android-developer/answer/9859455 | 2026-10-20 |
| 등급 분류 (IARC 연동) | 구글 플레이는 게임산업법 제21조의2 자체등급분류사업자. IARC 설문 완료 시 한국 GRAC 법정 등급이 자동 부여되어 별도 수수료/심의 신청 불필요. 피 없는 가상 군사 전투이므로 12세 이용가 예상 (질문에 따라 전체이용가 가능) | 등급(IARC 설문) 한국 등급 대체 | A | https://support.google.com/googleplay/android-developer/answer/9866151 | 2026-10-20 |
| 게임제작업·배급업 등록 여부 | 게임산업법 제25조에 규정되어 있으나, 구글 플레이는 개인 개발자에게 제작업 등록증을 요구하지 않음. 1인 개발자의 소액 광고 수익 단계에서는 현실적으로 미등록 출시 및 운영 가능. 추후 사업자등록 및 스튜디오 오피스(근린생활시설 주소지) 확보 시 정식 등록 권장 | 게임제작업·배급업 등록 필요 여부 | B | 법제처 게임산업법 제25조 / 지자체 실무 사례 | 2026-10-20 |
| 사업자등록 시점 | 지속적이고 반복적인 수익 발생 전(출시 초기 검증 단계)에는 사업자등록 없이 개인으로 AdMob 외화 통장 수령 가능. 연 2,400만~4,800만 원 이상 지속 수익 발생 시 또는 인앱결제 도입 시 간이과세자로 등록 권장 | — | B | 국세청 부가가치세법 기본통칙 / 세무 실무 | 2026-10-20 |
| AdMob 수익 세금 처리 | 해외 Google Asia Pacific에서 지급되므로 국내 원천징수 없음. 매년 5월 종합소득세 자진 신고 필수(연 1만 달러 초과 외화 송금 시 국세청 자동 통보). 사업자 등록 후에는 영세율(0%) 부가가치세 신고(외화입금증명서 첨부) | — | A | 국세청 종합소득세 안내 / 부가가치세법 제24조 | 2026-10-20 |
| AI기본법 생성형 AI 표시 의무 | 2026-01-22 시행. 생성형 AI 결과물(이미지, 텍스트 등)에 AI 생성 사실 표시 의무(법 제31조). 1년간 계도기간(과태료 유예)이나, 선제적으로 게임 로비/설정 및 스토어 설명란에 "일부 그래픽·텍스트에 생성형 AI가 활용되었습니다" 문구 표기 준수 | — | A | 과학기술정보통신부 인공지능기본법 제31조 및 시행령 | 2026-10-20 |
| Capacitor 버전 및 환경 | Capacitor 최신 안정판 v7/v8: Android SDK 최소 23/24, 타깃 35/36, Java JDK 21, Android Studio Ladybug/Otter 이상 필요 | — | A | https://capacitorjs.com/docs/updating/7-0 | 2026-10-20 |
| `@capacitor/app` 이벤트 | 뒤로가기: `App.addListener('backButton', ({ canGoBack }) => ...)`<br>포그라운드/백그라운드 전환: `App.addListener('appStateChange', ({ isActive }) => ...)`<br>정지/재개: `App.addListener('pause', ...)` / `App.addListener('resume', ...)`<br>종료: `App.exitApp()` | 백버튼 이벤트, 앱 백그라운드·복귀 이벤트 | A | https://capacitorjs.com/docs/apis/app | 2026-10-20 |
| `@capacitor/preferences` API | 영구 저장 키-값 스토어(Android SharedPreferences 매핑).<br>`Preferences.get({ key })`<br>`Preferences.set({ key, value })`<br>`Preferences.remove({ key })`<br>(값은 문자열이므로 JSON 직렬화/역직렬화 사용) | — | A | https://capacitorjs.com/docs/apis/preferences | 2026-10-20 |
| 화면 세로 고정 설정 | `android/app/src/main/AndroidManifest.xml`의 MainActivity 태그에 `android:screenOrientation="portrait"` 설정으로 네이티브 수준 완벽 고정 | — | A | https://developer.android.com/guide/topics/manifest/activity-element#screen | 2026-10-20 |
| Android 15+ Safe Area WebView | Android 15(SDK 35+)는 강제 edge-to-edge 적용. 구형 Chromium WebView(< M140)에서 `env(safe-area-inset-*)`가 `0px`로 나오는 이슈 존재. `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">` 설정 필수. 실측 시 `0px` 발생 시 `@capacitor-community/safe-area` 플러그인 또는 MainActivity WindowInsets 주입으로 해결 (추가 확인 필요: 실기기 테스트) | — | B | Android 15 Edge-to-Edge 공식 문서 & Chromium Tracker 40602058 | 2026-10-20 |
| AdMob 플러그인 사양 | 패키지: `@capacitor-community/admob` (Capacitor 7/8 호환 최신 버전)<br>초기화: `AdMob.initialize({ initializeForTesting: true })`<br>준비: `AdMob.prepareRewardVideoAd({ adId, isTesting })`<br>표시: `AdMob.showRewardVideoAd()` | AdMob 보상형 광고 이벤트 이름, 테스트 광고 ID | A | https://github.com/capacitor-community/admob | 2026-10-20 |
| AdMob 보상형 이벤트 이름 | `RewardAdPluginEvents.Loaded` ('onRewardedVideoAdLoaded')<br>`RewardAdPluginEvents.Rewarded` ('onRewarded') ★ 보상 획득 플래그 트리거<br>`RewardAdPluginEvents.Dismissed` ('onRewardedVideoAdDismissed') ★ 창 닫힘 시 보상 지급 및 재로드<br>`RewardAdPluginEvents.FailedToLoad` ('onRewardedVideoAdFailedToLoad')<br>`RewardAdPluginEvents.FailedToShow` ('onRewardedVideoAdFailedToShow') | AdMob 보상형 광고 이벤트 이름 | A | https://github.com/capacitor-community/admob | 2026-10-20 |
| 공식 테스트 광고 단위 ID | Android 보상형 광고 (Rewarded): `ca-app-pub-3940256099942544/5224354917` (개발/검증 환경에서 반드시 이 ID 사용) | 테스트 광고 ID | A | https://developers.google.com/admob/android/test-ads | 2026-10-20 |
| UMP(동의) 요건 | 유럽경제지역(EEA) 및 영국 대상 시 필수. **출시 국가를 대한민국(한국)으로 한정하는 경우 UMP 동의 폼 표시 의무 없음** (M5+ 글로벌 확장 시 도입) | — | A | https://support.google.com/admob/answer/13554116 | 2026-10-20 |

---

## 게임에 쓰는 제안

| 제안 | 근거 행 | 단계 |
|---|---|:---:|
| **개발자 계정 비공개 테스트 대비**: 출시 2~3주 전 테스터 12명 사전 확보(친구/커뮤니티) 및 14일 연속 옵트인 일정 계획 수립 | 비공개 테스트 요건 | M4 |
| **타깃 연령 16세 이상 설정**: 스토어 등록 시 타깃 연령을 16세 이상(또는 18세 이상)으로 설정하여 까다로운 Google Play Families Policy(아동용 광고 SDK 제한 등) 회피 | 대상 연령 및 가족 정책 | M4 |
| **스토어 메타데이터 중립성 유지**: 앱 제목·설명에 현재 시사 갈등이나 자극적 키워드를 배제하고 "가상 시나리오 기반 세로형 타워 디펜스"로 명시하여 민감한 사건 정책 리스크 원천 차단 | 콘텐츠 정책 (전쟁·북한군) | M4 |
| **개인정보처리방침 GitHub Pages 구축**: `shoottrial/docs` 또는 별도 저장소 GitHub Pages로 개인정보처리방침 URL 호스팅 | 개인정보처리방침 URL | M4 |
| **AI 생성 고지 UI 반영**: 설정 화면 하단 또는 타이틀 화면 크레딧에 "AI 기본법 준수: 일부 에셋 제작에 생성형 AI가 활용되었습니다" 텍스트 1줄 배치 | AI기본법 생성형 AI 표시 의무 | M2/M4 |
| **`platform.ts` 단일 인터페이스 구축**: `@capacitor/app`, `@capacitor/preferences`, `@capacitor-community/admob`을 오직 `src/platform.ts`에서만 래핑 호출 | Capacitor 플러그인 사양 전반 | M1 (T-101) |
| **안드로이드 15 Safe Area 폴백 대비**: T-101 실측 시 Android 15 기기에서 `env(safe-area-inset-*)`가 `0px`로 반환되면 `MainActivity`에서 `WindowInsetsCompat` 값을 읽어 CSS 변수로 직접 주입하는 백업 루틴 준비 | Android 15+ Safe Area WebView | M1 (T-101) |
| **한국 한정 배포로 UMP 생략**: 출시 대상 국가를 '대한민국'으로 설정하여 복잡한 UMP(동의 모달) SDK 연동 생략 및 사용자 진입 장벽 제거 | UMP(동의) 요건 | M4 |

---

## 빈칸 (못 찾은 것)

1. **Android 15+ 실물 기기/단말별 WebView safe-area-inset 반환 여부**: Chromium 140 이상 최신 웹뷰에서는 수정되었으나 삼성/LG 등 제조사별 OS 커스텀 및 구형 웹뷰가 설치된 실기기에서 `env(safe-area-inset-top)`가 실제로 몇 px로 들어오는지는 코드 레벨에서만 알 수 없음 (→ T-101 실측에서 확인).
2. **IARC 설문 질문지 버전별 최종 등급(전체이용가 vs 12세)**: IARC 설문의 폭력성 문항 답변(무기 사용 여부 예, 유혈 묘사 아니오)에 따라 한국 등급이 전체이용가로 나올지 12세 이용가로 나올지는 Play Console 콘솔 입력 시점에 최종 확정됨 (게임 정책상 12세 이용가 목표로도 서비스에 아무 문제 없음).

---

## G3용 출시 체크리스트

| 번호 | 출시 전 확인 항목 | 확인 방법 / 점검 기준 | TECH / 규정 근거 |
|:---:|---|---|---|
| 1 | Play Console 개인 계정 신원 확인 완료 | 콘솔 대시보드에서 '계정 확인됨' 배지 확인 (신분증/주소) | Play Console 정책 |
| 2 | 비공개 테스트 12명 × 14일 충족 | Closed Testing 트랙에서 12명 이상 14일 연속 옵트인 후 "프로덕션 액세스 신청" 버튼 활성화 확인 | Play Console 비공개 테스트 요건 |
| 3 | Target SDK Level 35 이상 설정 | `android/variables.gradle`의 `targetSdkVersion = 35`(또는 36) 확인 | Google Play Target API 정책 |
| 4 | AAB 릴리스 빌드 및 Play 앱 서명 | `./gradlew bundleRelease` 생성 및 Play 앱 서명 키 등록 | Google Play 배포 요건 |
| 5 | 64비트 아키텍처 포함 | AAB 번들 내 `lib/arm64-v8a`, `lib/x86_64` 확인 | Google Play 64비트 정책 |
| 6 | AndroidManifest 세로 고정 | `AndroidManifest.xml`에 `android:screenOrientation="portrait"` 확인 | TECH §3 |
| 7 | Safe Area 화면 침범 여부 (`?safe=1`) | 상단 노치/카메라 펀치홀 및 하단 제스처 바와 버튼 겹침 없는지 실기기 확인 | TECH §3 |
| 8 | 안드로이드 백버튼 확인 모달 동작 | 백버튼 클릭 시 즉시 앱 종료되지 않고 일시정지/확인 모달 뜨는지 확인 | TECH §3, AGENTS.md |
| 9 | 백그라운드 전환 시 오디오 음소거 | 앱을 홈으로 내렸을 때 소리가 즉시 멈추고 복귀 시 정상 재생되는지 확인 | TECH §6, AGENTS.md |
| 10 | AdMob 보상형 광고 테스트 ID 동작 | 테스트 광고 ID(`ca-app-pub-3940256099942544/5224354917`)로 광고 로드/시청/보상 흐름 검증 | TECH §7 |
| 11 | 광고 시청 중 오디오 완전 음소거 | 보상형 광고 재생 시작 시 사운드가 꺼지고 닫힌 후 복구되는지 검증 | TECH §6, TECH §7 |
| 12 | 운영 광고 단위 ID 환경변수 교체 | 릴리스 빌드 전 `.env.production` 또는 빌드 변수에 실제 운영 AdMob ID 주입 | TECH §7 |
| 13 | IARC 콘텐츠 등급 설문 제출 | Play Console 콘솔에서 설문 작성 후 한국 등급(12세 이용가) 부여 확인 | 게임산업법 자체등급분류 |
| 14 | 대상 연령 16세 이상 설정 | '앱 콘텐츠' > '타겟층 및 콘텐츠'에서 16세(또는 18세) 이상 선택 확인 | Google Play 가족 정책 회피 |
| 15 | 데이터 보안(Data Safety) 양식 작성 | AdMob 수집 항목(기기ID, 대략적 위치, 상호작용 등) 정확히 선언 | Google Play 데이터 보안 정책 |
| 16 | 개인정보처리방침 URL 등록 | 접속 가능한 GitHub Pages URL을 Play Console 스토어 설정에 등록 | Google Play 개인정보보호 정책 |
| 17 | 생성형 AI 활용 및 허구 고지 문구 | 로비/설정 화면 및 스토어 설명란에 AI 기본법 고지 및 허구 고지 표기 | AI기본법 제31조, AGENTS.md |
| 18 | 출시 국가 한국(대한민국) 한정 설정 | 콘솔 출시 국가에서 '대한민국'만 선택 (유럽 UMP 동의 모달 요구 면제) | AdMob UMP 정책 |
| 19 | 세무 및 수익 정산 대비 | AdMob 수익 수령용 외화 계좌(SC제일은행, 카카오뱅크 등) 등록 및 5월 종합소득세 신고 일정 캘린더 등록 | 국세청 세법 규정 |
