import { readFileSync } from 'node:fs'
// 기존 pngjs에는 타입 선언이 없다.
// @ts-expect-error pngjs 타입 선언 미포함
import { PNG } from 'pngjs'
import { describe, expect, it } from 'vitest'
import { ASSET_CONTRACTS } from '../src/assets'

const sprites = ['walk_rook_walk_n', 'walk_rook_walk_e', 'walk_rook_walk_s', 'walk_rook_walk_w', 'walk_rook_idle', 'walk_lee_idle', 'walk_park_idle']
const keys = [...sprites, 'brief_1', 'brief_2', 'brief_3', 'brief_4', 'bg_barracks']
const png = (key: string) => PNG.sync.read(readFileSync(`public/assets/${key}.png`))

describe('승인 생활관 그림', () => {
  it('출력·계약·색인·장부가 일치한다', () => {
    const index = JSON.parse(readFileSync('public/assets/index.json', 'utf8')) as string[]
    const ledger = JSON.parse(readFileSync('art/LEDGER.json', 'utf8')).entries as Array<{ id: string; file: string; mapping: string }>
    for (const key of keys) {
      const contract = ASSET_CONTRACTS.find((item) => item.key === key)!
      const image = png(key)
      expect(index.filter((id) => id === key)).toHaveLength(1)
      const entry = ledger.filter((item) => item.id === key)
      expect(entry).toHaveLength(1)
      expect(entry[0]!.file).toBe(`public/assets/${key}.png`)
      expect(entry[0]!.mapping).toBeTruthy()
      expect(image.width).toBe(contract.w * contract.frames)
      expect(image.height).toBe(contract.h)
    }
  })

  it('각 방향 프레임은 투명 배경과 y=116 발 기준선을 가진다', () => {
    for (const key of sprites) {
      const image = png(key)
      for (let frame = 0; frame < image.width / 128; frame++) {
        let minY = 128, maxY = -1, transparent = 0, magenta = 0
        for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
          const alpha = image.data[(y * image.width + frame * 128 + x) * 4 + 3]
          const offset = (y * image.width + frame * 128 + x) * 4
          const [r, g, b] = image.data.subarray(offset, offset + 3)
          if (alpha && r > 120 && b > 120 && r - g > 35 && b - g > 35) magenta++
          if (alpha) { minY = Math.min(minY, y); maxY = Math.max(maxY, y) } else transparent++
        }
        expect(magenta, `${key} 자홍 번짐`).toBe(0)
        expect(maxY, `${key} ${frame}`).toBe(116)
        expect(117 - minY, `${key} ${frame}`).toBeGreaterThan(75)
        expect(117 - minY, `${key} ${frame}`).toBeLessThanOrEqual(100)
        expect(transparent).toBeGreaterThan(10000)
      }
    }
  })
})
