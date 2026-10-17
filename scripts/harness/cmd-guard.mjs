#!/usr/bin/env node
// Antigravity PreToolUse(run_command) 훅. 위험한 명령은 막고, 새 패키지 설치는 매번 사용자에게 묻는다.
// 나머지는 "ask"로 평소 권한 흐름('항상 허용' 목록 포함)을 그대로 따른다.
// 단독 테스트: echo '{"toolCall":{"name":"run_command","args":{"CommandLine":"git push"}}}' | node scripts/harness/cmd-guard.mjs
import { readFileSync } from 'node:fs'

let input = {}
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch {}
const args = input.toolCall?.args ?? {}
const cmd = String(args.CommandLine ?? args.commandLine ?? args.command ?? Object.values(args).find((v) => typeof v === 'string') ?? '')

const DENY = [
  [/\bgit\s+push\b/, 'push는 사용자만 한다.'],
  [/\bgit\s+reset\s+--hard\b|\bgit\s+clean\s+-\w*f/, '작업 내용을 지우는 git 명령은 금지다.'],
  [/\brm\s+(-\w*r\w*f|-\w*f\w*r)/i, 'rm -rf는 금지다. 지울 파일을 하나씩 지정해라.'],
  [/\b(curl|wget)\b[^|]*\|\s*(sh|bash|zsh)\b/, '내려받은 스크립트를 바로 실행하지 않는다.'],
]
const hit = DENY.find(([re]) => re.test(cmd))
const install = /\b(npm|pnpm|yarn|bun)\s+(i|install|add)\b(\s+-\S+)*\s+[^-\s]/.test(cmd)

process.stdout.write(JSON.stringify(
  hit ? { decision: 'deny', reason: `[cmd-guard] ${hit[1]}` }
  : install ? { decision: 'force_ask', reason: '[cmd-guard] 새 패키지 설치다. 티켓 ## 허용 의존성에 있는지 확인하고 승인하세요.' }
  : { decision: 'ask' },
))
