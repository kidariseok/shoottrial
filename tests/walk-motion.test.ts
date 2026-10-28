import { describe, expect, it } from 'vitest'
import { facingFor, turnToward, walkDirection } from '../src/ui/walk-motion'

describe('생활관 이동·대화 방향', () => {
  it('8방향 시트 순서로 향하고 제자리에 있으면 마지막 방향을 유지한다', () => {
    const vectors = [[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1]]
    vectors.forEach(([x,y], i) => expect(facingFor({x:x!, y:y!}, 3)).toBe(i))
    expect(facingFor({x:0,y:0}, 3)).toBe(3)
  })
  it('대화 상대 두 명은 서로 반대 방향을 바라본다', () => {
    for (const p of [{x:1,y:3},{x:-2,y:1},{x:4,y:-3}]) {
      expect((facingFor(p,0) + 4) % 8).toBe(facingFor({x:-p.x,y:-p.y},0))
    }
  })
  it('방향전환은 가장 짧은 경로로 한 자세씩 돌아간다', () => {
    expect(turnToward(7,1)).toBe(0)
    expect(turnToward(1,7)).toBe(0)
    expect(turnToward(4,4)).toBe(4)
    let current=0
    for(let i=0;i<4;i++) current=turnToward(current,4)
    expect(current).toBe(4)
  })
  it('대각 이동에서 유효한 마지막 축을 유지하되 반대 키로는 돌아선다', () => {
    expect(walkDirection({x:1,y:1},'e')).toBe('e')
    expect(walkDirection({x:-1,y:1},'e')).toBe('s')
    expect(walkDirection({x:0.1,y:-1},'e')).toBe('n')
  })
})
