#!/usr/bin/env node
// 승인용 미리보기만 만든다. 게임 에셋 연결은 Figma 시안 승인 후 별도 단계다.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import { findBoundingBox, scalePngBox, alignFrameToCanvas, mergeFramesToSheet, coverResizeBackground } from './assets.mjs'

const dir = 'art/inbox/a118'
for (const person of ['lee', 'park']) {
  const file = person === 'lee' ? 'lee-crossleg-v3' : 'park-crossleg-v2'
  const source = PNG.sync.read(readFileSync(`${dir}/${file}.png`))
  const contract = { key: `walk_${person}_sit`, w: 128, h: 128, frames: 8, minFrames: 8, maxFrames: 8, pivot: 'feet' }
  // 순서: 앞·앞왼쪽·왼쪽·뒤왼쪽 / 뒤·뒤오른쪽·오른쪽·앞오른쪽.
  const frames = Array.from({ length: 8 }, (_, i) => {
    const col = i % 4, row = Math.floor(i / 4)
    const x = Math.floor(col * source.width / 4), y = Math.floor(row * source.height / 2)
    const w = Math.floor((col + 1) * source.width / 4) - x
    const h = Math.floor((row + 1) * source.height / 2) - y
    const cell = new PNG({ width: w, height: h })
    PNG.bitblt(source, cell, x, y, w, h, 0, 0)
    // 픽셀 에셋으로 축소할 때 투명 가장자리의 희미한 생성 번짐을 제거한다.
    for (let p = 3; p < cell.data.length; p += 4) cell.data[p] = cell.data[p] < 128 ? 0 : 255
    return cell
  })
  const boxes = frames.map(findBoundingBox)
  const scale = Math.min(74 / Math.max(...boxes.map(b => b.height)), 112 / Math.max(...boxes.map(b => b.width)))
  const aligned = frames.map((frame, i) => {
    const box = boxes[i]
    const cropped = new PNG({ width: box.width, height: box.height })
    PNG.bitblt(frame, cropped, box.minX, box.minY, box.width, box.height, 0, 0)
    const small = scalePngBox(cropped, Math.round(box.width * scale), Math.round(box.height * scale), { binaryAlpha: true })
    return alignFrameToCanvas(small, contract)
  })
  writeFileSync(`${dir}/${person}-crossleg-preview-sheet.png`, PNG.sync.write(mergeFramesToSheet(aligned, contract)))
  const grid = new PNG({ width: 512, height: 256 })
  aligned.forEach((frame, i) => PNG.bitblt(frame, grid, 0, 0, 128, 128, (i % 4) * 128, Math.floor(i / 4) * 128))
  writeFileSync(`${dir}/${person}-crossleg-preview-grid.png`, PNG.sync.write(grid))
  writeFileSync(`${dir}/${person}-crossleg-preview-rest.png`, PNG.sync.write(aligned[person === 'lee' ? 6 : 2]))
  console.log(`${person}: 아빠다리 8방향, 128px 캔버스, 발끝116, 최대높이74`)
}

// 생성 도구가 다른 침상을 조금 바꿨더라도, 필요한 두 매트리스 영역만 원래 배경에 반영한다.
if (existsSync(`${dir}/barracks-bedding-v1.png`) && existsSync(`${dir}/right-third-bedding-v2.png`)) {
  const original = PNG.sync.read(readFileSync('public/assets/bg_barracks.png'))
  const map = PNG.sync.read(readFileSync('public/assets/bg_barracks.png'))
  const left = coverResizeBackground(PNG.sync.read(readFileSync(`${dir}/barracks-bedding-v1.png`)), { w: 720, h: 1280 }).sheetPng
  const right = scalePngBox(PNG.sync.read(readFileSync(`${dir}/right-third-bedding-v2.png`)), 188, 160)
  const areas = [{ x: 93, y: 519, w: 143, h: 105 }, { x: 485, y: 690, w: 143, h: 117 }]
  PNG.bitblt(left, map, 93, 519, 143, 105, 93, 519)
  PNG.bitblt(right, map, 485 - 472, 690 - 674, 143, 117, 485, 690)
  let outsideChanges = 0
  for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
    if (areas.some(a => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h)) continue
    const i = (y * map.width + x) * 4
    if (!map.data.subarray(i, i + 4).equals(original.data.subarray(i, i + 4))) outsideChanges++
  }
  if (outsideChanges) throw new Error('지정한 침상 밖 배경이 바뀌었습니다.')
  writeFileSync(`${dir}/barracks-bedding-preview.png`, PNG.sync.write(map))
  console.log('매트리스2곳 미리보기 완료, 그 밖 변경0픽셀')
}
