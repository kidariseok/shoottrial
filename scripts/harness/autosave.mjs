#!/usr/bin/env node
// 자동 저장. 바뀐 파일이 있으면 전부 커밋하고 GitHub의 "지금 브랜치"로 push한다.
// 공용 컴퓨터에서 앱을 지워도 작업이 남게 하려는 장치다.
// Orca 워크트리마다 브랜치가 다르므로 main으로 직접 push하지 않는다. main은 /finish-ticket의 PR로 들어간다.
// 호출하는 곳
//   ① stop-gate.mjs: 에이전트가 턴을 끝낼 때마다
//   ② post-tool.mjs: 작업 중 5분마다
//   ③ 사람·에이전트가 직접: node scripts/harness/autosave.mjs [-m "메시지"]
// push가 실패하면(인증 만료·오프라인·원격이 앞섬) .harness/push-failed에 이유를 남기고 넘어간다. 로컬 커밋은 그대로 남는다.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export function autosave(root, message) {
  const git = (...args) => execFileSync('git', args, {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  }).trim()
  const h = (f) => join(root, '.harness', f)
  mkdirSync(join(root, '.harness'), { recursive: true })
  const id = existsSync(h('active')) ? readFileSync(h('active'), 'utf8').trim() : ''
  const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })

  let committed = false
  if (git('status', '--porcelain')) {
    git('add', '-A')
    git('commit', '-q', '--no-verify', '-m', message ?? `wip(${id || 'no-ticket'}): 자동 저장 ${stamp}`)
    committed = true
  } else if (message) {
    git('commit', '-q', '--no-verify', '--allow-empty', '-m', message)
    committed = true
  }

  let pushed = 'up-to-date'
  let branch = ''
  let remote = ''
  try { branch = git('symbolic-ref', '--short', '-q', 'HEAD') } catch {}
  try { remote = git('rev-parse', '--verify', '-q', `refs/remotes/origin/${branch}`) } catch {}
  if (!branch) {
    pushed = 'failed'
    writeFileSync(h('push-failed'), `${stamp}\ndetached HEAD라 push할 브랜치가 없다. git switch <브랜치> 후 다시 저장한다.\n`)
  } else if (remote !== git('rev-parse', 'HEAD')) {
    try {
      git('push', '-q', '-u', 'origin', 'HEAD')
      pushed = 'ok'
      rmSync(h('push-failed'), { force: true })
    } catch (e) {
      pushed = 'failed'
      writeFileSync(h('push-failed'), `${stamp}\n${String(e.stderr || e.message).slice(0, 500)}\n`)
    }
  }
  writeFileSync(h('last-save'), String(Date.now()))
  return { committed, pushed }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('-m')
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
  const r = autosave(root, i > 0 ? process.argv[i + 1] : undefined)
  console.log(r.pushed === 'failed'
    ? `⚠ 커밋은 했지만 push 실패: .harness/push-failed 확인 (docs/SETUP.md §5)`
    : `저장 완료 (커밋: ${r.committed ? '새로 만듦' : '바뀐 것 없음'}, push: ${r.pushed})`)
}
