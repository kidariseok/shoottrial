# A-103 생활관 내부 배경 1장

상태: 대기
담당: 사용자 (Gemini Argon 이미지). 정리·장부 기록은 Claude Code가 돕는다

## 목표

T-109(걸어 다니는 생활관)의 바닥 그림 `bg_barracks.png` 한 장. 이 그림이 없어도 T-109는 단색 판으로 먼저 만들어진다. 그림이 들어오면 그대로 바뀐다.

## 한 장 규칙

- 파일 이름: `bg_barracks.png`, 저장 위치: `art/inbox/`(절대 경로 `/Users/jinseokoh/orca/workspaces/shoottrial/moonfish/art/inbox/`)
- 비율 9:16 세로(게임 안 크기 720×1280). 마젠타 배경이 아니라 **그대로 바닥 그림**으로 쓴다.
- 첨부할 참조: `art/ref/09-barracks.png`(생활관 참조), `art/ref/06-bg-gate.png`(그림체 맞추기용)
- 새 채팅을 열고, 참조 두 장을 먼저 첨부한 뒤 아래 프롬프트를 통째로 붙여 넣는다.
- 글자, 사람, 차량이 **없어야** 한다. 있으면 `remove all text and people`로 한 번 더 말한다. 3번까지만 다시 시도한다.

## 프롬프트

```
A top-down pixel art interior of a Korean military barracks (saenghwalgwan), portrait 9:16, same art style, palette and level of detail as the attached gate map: dark night mood, warm lamp light spots on the floor, slightly desaturated olive and steel tones. Layout: a wide empty wooden-floor corridor in the center for walking; two rows of double bunk beds with olive blankets running vertically on the left and right sides of the corridor, leaving a clear walkable aisle between them; on the top wall left side a cork bulletin board with blank paper sheets (no writing); on the top wall right side an administration office desk with a door and a lamp; along the left wall a row of grey metal personal lockers; along the right wall a small PX snack counter with shelves of snack boxes and drink cans (no logos, no text); at the bottom center a wide double door exit with a faint red light above it. Everything seen from directly above, flat lighting, crisp pixels. No text, no letters, no logos, no characters, no people, no vehicles, no weapons on the floor.
```

## 끝나면

- Claude에게 "A-103 넣었어"라고 말한다. 자동 처리(`scripts/assets.mjs`) 후 `?scene=gallery` 스크린샷으로 보여 준다.
- T-109가 끝나기 전이라면 Claude가 그림을 `public/assets/bg_barracks.png`로 병합해 두고, T-109가 `?zones=1`로 구역 좌표를 그림에 맞춘다.

## 진행 기록

- (아직 없음)
