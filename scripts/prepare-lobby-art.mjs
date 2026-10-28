#!/usr/bin/env node
// A-106 원본은 이동하거나 수정하지 않는다. 격자 좌표는 직접 확인한 원본 배치다.
import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import { removeMagenta, coverResizeBackground, fitFramesToContract, alignFrameToCanvas, mergeFramesToSheet } from './assets.mjs'

const source = 'art/inbox/a106'
const output = 'public/assets'
const directions = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se']
const index = JSON.parse(readFileSync(`${output}/index.json`, 'utf8'))
const ledger = JSON.parse(readFileSync('art/LEDGER.json', 'utf8'))
const read = (name) => PNG.sync.read(readFileSync(`${source}/${name}.png`))
function save(key, png, file, mapping, scale) {
  let bytes = PNG.sync.write(png, { colorType: 6 })
  let colorLevels = null
  if (bytes.length > 512 * 1024) {
    const original = Buffer.from(png.data)
    // 불투명 배경만 색 단계를 줄여 ART의 장당 512KB 예산을 지킨다. 형상/크기와 원본은 보존한다.
    for (const levels of [64, 32, 24, 16]) {
      const step = 255 / (levels - 1)
      for (let i = 0; i < png.data.length; i += 4) for (let channel = 0; channel < 3; channel++) {
        png.data[i + channel] = Math.round(Math.round(original[i + channel] / step) * step)
      }
      bytes = PNG.sync.write(png, { colorType: 6 })
      colorLevels = levels
      if (bytes.length <= 512 * 1024) break
    }
    if (bytes.length > 512 * 1024) throw new Error(`${key}: 512KB 예산 초과`)
  }
  writeFileSync(`${output}/${key}.png`, bytes)
  if (!index.includes(key)) index.push(key)
  const entry = { id: key, file: `${output}/${key}.png`, source: `${source}/${file}.png`, tool: 'user-approved A-106', prompt: 'docs/tickets/T-117-approved-visuals.md', license: 'proprietary', edited: true, checked: '2026-10-28', scale: Number(scale.toFixed(6)), mapping, ...(colorLevels ? { colorLevels } : {}) }
  const i = ledger.entries.findIndex((e) => e.id === key)
  if (i < 0) ledger.entries.push(entry); else ledger.entries[i] = entry
}
function cell(png, cols, rows, col, row, flip = false) {
  const x0 = Math.floor(col * png.width / cols), x1 = Math.floor((col + 1) * png.width / cols)
  const y0 = Math.floor(row * png.height / rows), y1 = Math.floor((row + 1) * png.height / rows)
  const out = new PNG({ width: x1 - x0, height: y1 - y0 })
  for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
    const from = ((y0 + y) * png.width + x0 + (flip ? out.width - 1 - x : x)) * 4
    png.data.copy(out.data, (y * out.width + x) * 4, from, from + 4)
  }
  return removeMagenta(out)
}
function sprite(key, file, cells, mapping) {
  const raw = read(file)
  const frames = cells.map(([cols, rows, col, row, flip]) => cell(raw, cols, rows, col, row, flip))
  // 기존 유닛 축소 규칙을 재사용하고 발 기준 정렬을 명시한다.
  const contract = { key: 'ally_lobby_idle', w: 128, h: 128, frames: frames.length, minFrames: frames.length, maxFrames: frames.length, pivot: 'feet' }
  const fitted = fitFramesToContract(frames, contract)
  // 축소 과정에 남는 자홍 번짐을 지운다. 승인된 인물에는 자홍 소품이 없다.
  for (const frame of fitted.frames) for (let i = 0; i < frame.data.length; i += 4) {
    const [r, g, b] = frame.data.subarray(i, i + 3)
    if (r > 120 && b > 120 && r - g > 35 && b - g > 35) frame.data[i + 3] = 0
  }
  const aligned = fitted.frames.map((frame) => alignFrameToCanvas(frame, contract))
  save(key, mergeFramesToSheet(aligned, contract), file, mapping, fitted.scale)
}
for (let i = 1; i <= 4; i++) {
  const file = `brief-${i}`
  const result = coverResizeBackground(read(file), { w: 720, h: 1280 })
  save(`brief_${i}`, result.sheetPng, file, '중앙 cover', result.scale)
}
const bg = coverResizeBackground(read('barracks'), { w: 720, h: 1280 })
save('bg_barracks', bg.sheetPng, 'barracks', '중앙 cover', bg.scale)
for (const [direction, row] of [['s', 0], ['w', 1], ['e', 2], ['n', 3]]) {
  sprite(`walk_rook_walk_${direction}`, 'rook-walk', Array.from({ length: 6 }, (_, col) => [6, 4, col, row, false]), `원본 ${row + 1}행, 왼쪽부터 1~6열 (${direction})`)
}
for (const person of ['rook', 'lee', 'park']) {
  const cells = directions.map((_, i) => [4, 2, i % 4, Math.floor(i / 4), false])
  if (person === 'park') cells[6] = [4, 2, 2, 0, true]
  sprite(`walk_${person}_idle`, `${person}-turn`, cells, `출력 ${directions.join(',')}; 원본 왼쪽→오른쪽 위 행 1~4, 아래 행 1~4${person === 'park' ? '; e는 원본 w 좌우 반전' : ''}`)
}
writeFileSync(`${output}/index.json`, `${JSON.stringify(index, null, 2)}\n`)
writeFileSync('art/LEDGER.json', `${JSON.stringify(ledger, null, 2)}\n`)
console.log('A-106 12개 에셋 처리 완료')
