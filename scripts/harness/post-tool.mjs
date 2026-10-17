#!/usr/bin/env node
// Antigravity PostToolUse("*") 훅
//   ① 도구 이름과 인자 키를 .harness/tool-log.jsonl에 남긴다(H-001 보정용).
//   ② 마지막 저장 후 5분이 지났으면 자동 저장(autosave.mjs)을 한다. 한 턴이 길어도 작업이 날아가지 않게 하기 위해서다.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { autosave } from './autosave.mjs'

const EVERY_MS = 5 * 60 * 1000
let input = {}
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch {}
const root = input.workspacePaths?.[0]
if (root) {
  mkdirSync(join(root, '.harness'), { recursive: true })
  const { name, args = {} } = input.toolCall ?? {}
  appendFileSync(join(root, '.harness/tool-log.jsonl'), JSON.stringify({ t: new Date().toISOString(), name, argKeys: Object.keys(args) }) + '\n')
  const last = existsSync(join(root, '.harness/last-save')) ? Number(readFileSync(join(root, '.harness/last-save'), 'utf8')) : 0
  if (Date.now() - last > EVERY_MS) {
    try { autosave(root) } catch {}
  }
}
process.stdout.write('{}')
