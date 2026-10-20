# A-001 스타일 타깃 1장 + 팔레트 확정

상태: 대기
담당: 사용자 + Gemini 앱(이미지). 팔레트 추출은 Antigravity Flash에 맡겨도 된다.

## 목표

이후 모든 그림 생성의 **참조 이미지가 될 전투 화면 목업 1장**과 **32색 팔레트**가 확정되어 `art/`에 들어간다.

## 선행

- 없음(P1과 동시에 진행)

## 소유 경로

- `art/source/style-target/`
- `art/palette.json`
- `art/prompts/`

## 허용 의존성

- 없음

## 참고 문서

- `docs/ART.md` §1, §2.2(팔레트 묶음), §3.1(세로 9:16 구성), §3.2(프롬프트: '스타일 타깃' 줄 + 공통 접미사)
- `docs/GDD.md` §2.3(적 생김새), §2.4(위병소)

## 할 일

1. Gemini 앱에서 `docs/ART.md` §3.2의 '스타일 타깃' 프롬프트 + 공통 접미사로 **세로(9:16) 이미지를 최소 4장** 만든다.
   - 쓴 프롬프트는 `art/prompts/style-target.txt`에 저장한다.
2. 4장을 `art/source/style-target/`에 저장한다(`v1.png`~`v4.png`). 가장 마음에 드는 1장을 `chosen.png`로 복사한다.
   - 고르는 기준
     - ① 플레이어·적·예고선이 한눈에 구분되는가
     - ② 무섭지 않고 귀엽게 위험한가
     - ③ 한국 부대 정문 느낌이 나는가
     - ④ 픽셀이 너무 잘지 않은가(축소했을 때 뭉개지지 않는가)
3. `chosen.png`에서 32색 이내 팔레트를 뽑아 `art/palette.json`에 저장한다.
   - 형식: `{"colors":[{"hex":"#2ec5e8","role":"ally"}...]}`
   - `role`은 `docs/ART.md` §2.2의 묶음 이름(ally/danger/machine/city/light/outline)을 쓴다.
   - 적·위험 묶음 색이 배경 묶음에 섞여 있으면 고친다.
4. 결과를 이 티켓에 남긴다. Claude가 다음 게이트(G0)에서 같이 확인한다.

## 검증 명령

- 없음

## 완료 조건

- [ ] `art/source/style-target/chosen.png` 존재
- [ ] `art/palette.json`: 32색 이하, role 지정, 붉은 계열은 `danger`에만 있음
- [ ] `art/prompts/style-target.txt` 존재
- [ ] 사용자 한 줄 평: "이 느낌으로 간다"

## 작업 계획

## 질문

## 진행 기록

- 기준 커밋: (/start-ticket이 적는다)
- 세션 시작:

## 결과 보고

- 

## 인계 메모
