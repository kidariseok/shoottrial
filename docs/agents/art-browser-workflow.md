# 그림 제작 브라우저 작업 방식 (ChatGPT / Gemini → 파이프라인)

> A-102·A-104에서 Claude Code가 브라우저(Claude in Chrome 확장)를 직접 조작해 그림을 만든 방식이다. Codex 등 다른 에이전트가 이어받아도 같은 방식으로 한다. 사용자가 로그인해 둔 Chrome 세션을 쓴다(비밀번호·결제 정보는 건드리지 않는다).

## 0. 기본 방침 (사용자 결정)

- **ChatGPT(유료, Thinking 노력 수준 High)를 우선**한다. Gemini 사용량을 아끼기 위해서다. 품질이 Argon 대비 확연히 낮으면 Gemini로 되돌린다.
- Gemini를 쓸 때는 **모델 `4 Argon`, 사고 수준 `보통`**. Flash-Lite는 쓰지 않는다(상자·분홍 색조·글자·워터마크 문제가 있었다). 사고 수준 `높음`은 과하다.
- **대화(세션)는 하나만 열고 계속 쓴다.** 그림마다 새 채팅을 열지 않는다. 참조 이미지는 첫 메시지에 올려 두고, 이후는 "Create another image …"로 이어 간다. 화풍이 흐트러지면 참조를 다시 첨부한다.
- 레퍼런스(같은 계열의 기존 완성 그림 1~3장 + 해당 캐릭터 시트)를 **항상 첨부**한다. 그래야 화풍이 맞는다.
- 한 묶음(예: 캐릭터 1명의 대기·공격·카드) 단위로 만들고, 묶음이 끝나면 사용자에게 알린다.

## 1. 준비

- 도구: Claude in Chrome(`tabs_context_mcp`, `navigate`, `computer`, `javascript_tool`, `find`, `file_upload`). 도구가 지연 로드면 ToolSearch로 한 번에 불러온다. Codex는 같은 일을 하는 브라우저 제어 도구를 쓴다.
- 만든 원본은 저장소 밖 임시 폴더에 모았다가 묶음 끝에 `art/inbox/`로 옮긴다(다른 세션의 테스트가 inbox를 비울 수 있다).
- 업로드는 허용 폴더의 파일만 된다. 하드링크 파일은 거부되므로 `cp`로 복사해서 올린다.

## 2. ChatGPT 절차

1. `https://chatgpt.com` 에서 상단 모드가 "Codex"면 **ChatGPT**로 바꾼다.
2. `Select ChatGPT model` → **Thinking**, 노력 수준 슬라이더 **High**.
3. `Attach files`(input[type=file])로 레퍼런스를 첨부하고, 영어 프롬프트를 입력해 Return.
4. 완료 판단: `button[aria-label^="Share generated image"]` 개수가 늘어나면 끝난 것이다(JS로 폴링, 도구 시간제한 45초라 짧게 끊어서).
5. 저장: 마지막 Share 버튼 클릭 → 대화상자의 **Download** 버튼 클릭 → `~/Downloads`의 최신 PNG를 임시 폴더로 옮긴다. **공유 링크 옵션은 절대 누르지 않는다.**
6. 출력은 1672×941 정도다. 세로 카드는 3:4로 요청한다.

## 3. Gemini 절차 (보조)

- 새 채팅마다 `모드 선택` → `4 Argon` → `보통`을 다시 고른다(한도가 차면 Flash 계열로 돌아간다).
- `업로드 및 도구` → `이미지 만들기`, `가로세로 비율`은 1:1/9:16/3:4/4:3/16:9 중 선택. Argon 출력은 2752×1536(16:9).
- 파일 입력이 숨겨져 있으면 `HTMLInputElement.prototype.click`을 덮어써 input을 노출시킨다.
- "원본 크기 다운로드"는 다시 그려서 내용이 바뀔 수 있다(포탑이 차체와 합쳐진 사례). 바뀌면 그 부품을 단독 프롬프트로 다시 뽑는다.

## 4. 프롬프트 공통 규칙

- 배경은 **순수 마젠타 `#FF00FF` 단색**. 그라데이션·그림자·바닥선 없음.
- 상자·테두리·구분선·글자·로고·워터마크·피 표현 없음. 분홍/보라 색조 금지.
- 스프라이트 시트는 프레임 사이가 투명 열로 분리되게 가로 한 줄로 배치한다(안 되면 `art/source/<키>/meta.json`에 `{"split":"even"}`).
- **카드 구도**: 가슴 위 상반신, 어깨가 좌우 끝에 닿고, 머리+투구가 카드 높이의 약 40%·너비의 약 55%, 아래는 허리에서 잘림. 기준은 `art/source/card_rifle`, `card_chem`. 너무 확대/축소되면 이 수치를 프롬프트에 그대로 쓴다.
- 이미지 하단에 검은 줄이 생기면 "no black bar or line at the bottom edge"를 넣는다.

## 5. 파이프라인

```bash
cp <받은파일>.png art/inbox/<에셋키>.png
node scripts/assets.mjs <에셋키>      # 마젠타 제거·프레임 분리·크기 정규화 → public/assets/
npm run assets:check
npx vitest run tests/assets.test.ts tests/assets-pipeline.test.ts
```

- 시트·참조 전용 이미지는 `art/inbox`가 아니라 `art/ref/`(gitignore)에 둔다.
- 확인은 `npm run dev` 후 `?scene=gallery`(마우스 휠 스크롤은 캔버스에 WheelEvent를 보내고 1초 기다린 뒤 캡처). 카드 크기 비교는 같은 배율의 나란히 썸네일을 만들어 눈으로 본다.
- 무거운 도구(개발 서버·에뮬레이터)는 확인할 때만 켜고 바로 끈다.

## 6. 기록

- 끝나면 해당 티켓(`docs/tickets/A-1xx-*.md`)의 `## 진행 기록`에 날짜·브랜치·만든 키·남은 이슈를 적는다. 대화 기록은 사라질 수 있다.
- 커밋·push는 자동 저장 훅이 한다.
