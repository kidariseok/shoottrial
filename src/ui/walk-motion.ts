import type { Vec } from './helpers'

// 승인 시트의 시계방향 8자세: 앞, 앞왼쪽, 왼쪽, 뒤왼쪽, 뒤, 뒤오른쪽, 오른쪽, 앞오른쪽.
export const WALK_DIRECTIONS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'] as const

export function facingFor(dir: Vec, fallback: number): number {
  if (Math.hypot(dir.x, dir.y) < 0.01) return fallback
  return (Math.round(Math.atan2(-dir.x, dir.y) / (Math.PI / 4)) + 8) % 8
}

export function turnToward(from: number, to: number): number {
  const diff = (to - from + 8) % 8
  return diff === 0 ? from : (from + (diff <= 4 ? 1 : 7)) % 8
}

// 보행 시트는 4방향. 대각선은 마지막 이동축을 유지해 키를 흔들어도 자세가 떨리지 않는다.
export function walkDirection(dir: Vec, previous: string): string {
  if (Math.abs(dir.x) > Math.abs(dir.y) + 0.1) return dir.x < 0 ? 'w' : 'e'
  if (Math.abs(dir.y) > Math.abs(dir.x) + 0.1) return dir.y < 0 ? 'n' : 's'
  if ((dir.x < 0 && previous === 'w') || (dir.x > 0 && previous === 'e') ||
      (dir.y < 0 && previous === 'n') || (dir.y > 0 && previous === 's')) return previous
  return dir.y < 0 ? 'n' : 's'
}
