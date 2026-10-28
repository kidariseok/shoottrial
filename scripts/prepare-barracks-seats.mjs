#!/usr/bin/env node
// 승인용 미리보기만 만든다. 게임 에셋 연결은 Figma 시안 승인 후 별도 단계다.
import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import { splitSheetByChunks, findBoundingBox, scalePngBox, alignFrameToCanvas, mergeFramesToSheet } from './assets.mjs'

const dir = 'art/inbox/a118'
for (const person of ['lee', 'park']) {
  const source = PNG.sync.read(readFileSync(`${dir}/${person}-sit.png`))
  const contract = { key: `walk_${person}_sit`, w: 128, h: 128, frames: 3, minFrames: 3, maxFrames: 3, pivot: 'feet' }
  const frames = splitSheetByChunks(source, contract)
  const boxes = frames.map(findBoundingBox)
  const scale = Math.min(74 / Math.max(...boxes.map(b => b.height)), 112 / Math.max(...boxes.map(b => b.width)))
  const aligned = frames.map((frame, i) => {
    const box = boxes[i]
    const cropped = new PNG({ width: box.width, height: box.height })
    PNG.bitblt(frame, cropped, box.minX, box.minY, box.width, box.height, 0, 0)
    const small = scalePngBox(cropped, Math.round(box.width * scale), Math.round(box.height * scale), { binaryAlpha: true })
    return alignFrameToCanvas(small, contract)
  })
  writeFileSync(`${dir}/${person}-preview-sheet.png`, PNG.sync.write(mergeFramesToSheet(aligned, contract)))
  writeFileSync(`${dir}/${person}-preview-front.png`, PNG.sync.write(aligned[1]))
  console.log(`${person}: 3자세, 128px 캔버스, 발끝116, 최대높이74`)
}
