#!/usr/bin/env node
// Antigravity PostToolUse("*") 훅. 도구 이름과 인자 키를 .harness/tool-log.jsonl에 남긴다.
// H-001에서 실제 도구 이름을 확인하는 용도다. 보정이 끝나면 .agents/hooks.json에서 "enabled": false로 꺼도 된다.
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

let input = {}
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch {}
const root = input.workspacePaths?.[0]
if (root) {
  mkdirSync(join(root, '.harness'), { recursive: true })
  const { name, args = {} } = input.toolCall ?? {}
  appendFileSync(join(root, '.harness/tool-log.jsonl'), JSON.stringify({ t: new Date().toISOString(), name, argKeys: Object.keys(args) }) + '\n')
}
process.stdout.write('{}')
