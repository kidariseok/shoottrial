// 연출 예산(렉 방지)의 순수 계산. 화면·Phaser 없이 tests/fx-budget.test.ts에서 검사한다. 숫자는 data.ts FX

// 프레임 속도가 floor 아래인 시간(초)을 이어서 센다. floor 이상이면 0으로 되돌린다. fps가 0 이하(아직 측정 전)면 세지 않는다
export const lowFpsStreak = (streak: number, fps: number, realSec: number, floor: number): number =>
  fps > 0 && fps < floor ? streak + realSec : 0

// 숫자·글자를 새로 띄워도 되는가(켜져 있고 상한 아래일 때)
export const textAllowed = (live: number, max: number, enabled: boolean): boolean => enabled && live < max

// 파티클 개수: 기본 n에 연출 배율과 저사양 배율을 곱한다. 0이 되지 않게 최소 1
export const scaledCount = (n: number, scale: number, low: boolean, lowScale: number): number =>
  Math.max(1, Math.round(n * scale * (low ? lowScale : 1)))
