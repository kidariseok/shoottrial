#!/usr/bin/env node
// Antigravity Stop 훅. 에이전트가 턴을 끝낼 때마다 실행된다.
//   0. 무조건 먼저 자동 저장(커밋 + push)한다. 검사에 걸려도 작업은 GitHub에 남는다.
//   1. 활성 티켓이 있는가
//   2. 소유 경로 밖·보호 파일을 바꾸지 않았는가
//   3. 허용 안 된 새 의존성이 없는가
//   4. 티켓 진행 기록을 갱신했는가
//   5. 코드가 바뀌었으면 npm run verify를 통과하는가
// 하나라도 어기면 {"decision":"continue"}로 에이전트를 되돌려 보낸다.
// 예외(멈춤 허용): 사용자 취소·오류·한도 초과, 변경 없음, 티켓 ## 질문에 열린 항목("- [ ]")이 있을 때.
// 같은 티켓에서 3번 막힌 뒤 4번째에는 무한 반복을 막으려고 멈춤을 허용한다.
// 기준 커밋: .harness/base → 없으면(재설치 후) 티켓의 "기준 커밋: <sha>" → 없으면 이번 자동 저장 직전 커밋
// 단독 테스트: echo '{"terminationReason":"NO_TOOL_CALL"}' | node scripts/harness/stop-gate.mjs
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { autosave } from './autosave.mjs'

let input = {}
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch {}
const root = input.workspacePaths?.[0] ?? execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
const sh = (cmd) => execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const read = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8').trim() : '')
const out = (o) => { process.stdout.write(JSON.stringify(o)); process.exit(0) }
const allow = () => out({ decision: 'stop' })

mkdirSync(join(root, '.harness'), { recursive: true })
let preSave = 'HEAD'
try { preSave = sh('git rev-parse HEAD').trim() } catch {}
try { autosave(root) } catch {}
if (input.terminationReason && input.terminationReason !== 'NO_TOOL_CALL') allow()

const id = read('.harness/active')
const tname = id ? readdirSync(join(root, 'docs/tickets')).find((f) => f.startsWith(`${id}-`) || f === `${id}.md`) : undefined
const tpath = tname ? `docs/tickets/${tname}` : ''
const ticket = tpath ? read(tpath) : ''
const base = read('.harness/base') || ticket.match(/기준 커밋:\s*`?([0-9a-f]{7,40})/)?.[1] || preSave
const lines = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean)
const changed = [...new Set([
  ...lines(sh(`git -c core.quotepath=off diff --name-only ${base}`)),
  ...lines(sh('git -c core.quotepath=off ls-files --others --exclude-standard')),
])].filter((f) => !f.startsWith('.harness/'))
if (!changed.length) allow()

const tryFile = join(root, '.harness', `attempts-${id || 'none'}`)
function block(reason) {
  const n = Number(existsSync(tryFile) ? readFileSync(tryFile, 'utf8') : 0) + 1
  writeFileSync(tryFile, String(n))
  if (n > 3) allow()
  const last = n === 3 ? '\n마지막 경고: 고칠 수 없으면 /stuck 절차대로 티켓 ## 질문에 "- [ ] ..."와 인계 메모를 남겨라.' : ''
  out({ decision: 'continue', reason: `[stop-gate ${n}/3] ${reason}${last}` })
}

if (!id) block(`활성 티켓 없이 파일을 바꿨다: ${changed.join(', ')}. /start-ticket <ID>로 시작하거나 변경을 되돌려라.`)
if (!tname) block(`활성 티켓 ${id}의 파일이 docs/tickets/에 없다.`)
const section = (title) => (ticket.split(/^## /m).find((s) => s.startsWith(title)) ?? '').split('\n').slice(1).join('\n')
const bullets = (title) => lines(section(title)).map((l) => l.match(/^-\s+`?([^`\s]+)`?/)?.[1]).filter(Boolean)

if (/^\s*-\s*\[ \]/m.test(section('질문'))) allow()

const glob = (g) => new RegExp('^' + (g.endsWith('/') ? `${g}**` : g)
  .replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\/?/g, '\0').replace(/\*/g, '[^/]*').replace(/\0/g, '.*') + '$')
const owned = [...bullets('소유 경로'), tpath, `docs/shots/${id}*`].map(glob)
const PROTECTED = /^(AGENTS\.md|docs\/(GDD|TECH|ART|ROADMAP|SETUP)\.md|docs\/tickets\/_TEMPLATE\.md|\.agents\/|scripts\/harness\/)/
const bad = changed.filter((f) => PROTECTED.test(f) || !owned.some((r) => r.test(f)))
if (bad.length) block(`소유 경로 밖 변경: ${bad.join(', ')}. 되돌려라(수정: git checkout ${base} -- <파일>, 새 파일: 삭제). 꼭 필요하면 티켓 ## 질문에 "- [ ] <이유>"를 적고 멈춰라.`)

if (changed.includes('package.json')) {
  const deps = (j) => Object.keys({ ...j.dependencies, ...j.devDependencies })
  let before = []
  try { before = deps(JSON.parse(sh(`git show ${base}:package.json`))) } catch {}
  const allowed = bullets('허용 의존성')
  const extra = deps(JSON.parse(read('package.json'))).filter((d) => !before.includes(d) && !allowed.includes(d))
  if (extra.length) block(`허용되지 않은 새 의존성: ${extra.join(', ')}. 제거하거나 ## 질문에 이유를 적어라.`)
}

if (!changed.includes(tpath)) block(`${tpath}의 ## 진행 기록을 갱신하지 않았다. 한 일을 체크하고 짧게 적어라.`)

const code = changed.some((f) => /\.(ts|js|mjs|json|html|css)$/.test(f) && !f.startsWith('docs/'))
if (code && existsSync(join(root, 'package.json'))) {
  try { sh('npm run verify --silent 2>&1') } catch (e) {
    block(`npm run verify 실패:\n${String(e.stdout || e.message).split('\n').slice(-25).join('\n')}`)
  }
}

writeFileSync(tryFile, '0')
allow()
