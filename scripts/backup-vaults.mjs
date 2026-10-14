#!/usr/bin/env node
/**
 * backup-vaults.mjs — 双仓库自动同步（Node 版，行为等价于 backup-vaults.ps1）
 *
 * 流程：提交本地改动 → fetch → pull --ff-only（只允许快进）→ push 到所有远程
 * 日志：E:\Obsidian\_backup\backup.log（超过 1 MB 自动轮转为 backup.log.1）
 *
 * 运行：
 *   node scripts/backup-vaults.mjs
 *
 * 为什么要这个版本：不依赖 PowerShell（pwsh / powershell.exe 都不需要），
 * 因此不受 .ps1 的 UTF-8 BOM、执行策略、pwsh 7 与 5.1 语法差异影响，
 * 同一份脚本也能直接在 Linux / CI 上跑。
 */
import { spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 禁止 git 弹出凭据提示；并给 HTTP 传输加强保护，避免无人值守时长时间挂起
const GIT_ENV = {
  ...process.env,
  GIT_TERMINAL_PROMPT: '0',
  GCM_INTERACTIVE: 'never',
  GIT_ASKPASS: 'echo',
  GIT_HTTP_LOW_SPEED_LIMIT: '1000',
  GIT_HTTP_LOW_SPEED_TIME: '25',
}

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const DEFAULT_MAIN = resolve(SCRIPT_DIR, '..')
const MAIN_PATH = process.env.VAULT_DIR || (existsSync(DEFAULT_MAIN) ? DEFAULT_MAIN : 'E:\\Obsidian\\wuhy80_new')
const PRIVATE_PATH = process.env.PRIVATE_VAULT_DIR || 'E:\\Obsidian\\wuhy80_private'

const DEFAULT_LOG_DIR = existsSync('E:\\Obsidian') ? 'E:\\Obsidian\\_backup' : resolve(MAIN_PATH, '_backup')
const LOG = process.env.BACKUP_LOG_PATH || resolve(DEFAULT_LOG_DIR, 'backup.log')
const LOG_MAX_BYTES = 1024 * 1024
const RETRY_WAIT_MS = 3000

/** 用于识别的“网络问题”错误特征（与 PowerShell 版一致，大小写不敏感）。 */
const NETWORK_ERROR = 'unable to access|Failed to connect|Could not resolve|timed out|too slow|Connection'

/** 本地时间戳，格式 yyyy-MM-dd HH:mm:ss（与 PowerShell 版一致，不用 UTC）。 */
function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 同步睡眠（Node 没有内置的 sleep）。 */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function prepareLog() {
  mkdirSync(dirname(LOG), { recursive: true })
  if (existsSync(LOG) && statSync(LOG).size > LOG_MAX_BYTES) {
    renameSync(LOG, `${LOG}.1`)
  }
}

function log(message) {
  appendFileSync(LOG, `${stamp()}  ${message}\n`, 'utf8')
}

/** 从命令输出里取第一条“像错误”的行，并去掉 `git:` / `git.exe:` 前缀。 */
function firstKeyLine(text, pattern) {
  const lines = String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const re = new RegExp(pattern, 'i')
  const key = lines.find((line) => re.test(line)) ?? lines[0] ?? ''
  return key.replace(/^(git|git\.exe)\s*:\s*/, '').trim()
}

/** 运行一条 git 命令，返回 { code, out }（out = stdout + stderr）。 */
function git(args, cwd) {
  // maxBuffer 调到 64 MB：仓库有大量待提交文件时，git status --porcelain 的输出
  // 可能超过 Node 默认的 1 MB，一旦溢出会被截断（日志里会看到 ENOBUFS）。
  const r = spawnSync('git', args, {
    cwd,
    env: GIT_ENV,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  })
  const spawnError = r.error ? String(r.error.message ?? r.error) : ''
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}${spawnError}` }
}

/** 两个仓库。prefix 决定提交信息：主库「自动备份: <时间>」，私密库「私密备份: <时间>」。 */
const REPOS = [
  { path: MAIN_PATH, name: '主库', prefix: '自动备份', sync: 'origin', branch: 'main' },
  { path: PRIVATE_PATH, name: '私密库', prefix: '私密备份', sync: 'github', branch: 'main' },
]

function syncRepo(repo, message) {
  if (!existsSync(repo.path)) {
    log(`${repo.name}: 路径不存在，跳过 (${repo.path})`)
    return
  }
  // 未完成的合并/变基会让后续 git 操作处于半途状态，直接跳过
  if (existsSync(`${repo.path}\\.git\\MERGE_HEAD`) || existsSync(`${repo.path}\\.git\\rebase-merge`)) {
    log(`${repo.name}: 检测到未完成的合并/变基，跳过`)
    return
  }

  // 1) 提交本地改动，保证拉取时工作区干净
  git(['add', '-A'], repo.path)
  const pending = git(['status', '--porcelain'], repo.path).out.split(/\r?\n/).filter((line) => line.trim())
  if (pending.length > 0) {
    const committed = git(['commit', '-m', message], repo.path)
    log(committed.code === 0 ? `${repo.name}: 已提交 ${pending.length} 项改动` : `${repo.name}: 提交失败`)
  } else {
    log(`${repo.name}: 无改动`)
  }

  // 探测可用远程：优先用配置的 sync，若不存在则探测 origin、github 或首个可用远程
  const remotes = git(['remote'], repo.path).out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const syncRemote = remotes.includes(repo.sync)
    ? repo.sync
    : (remotes.includes('origin') ? 'origin' : (remotes.includes('github') ? 'github' : remotes[0]))

  if (!syncRemote) {
    log(`${repo.name}: 未配置任何远程仓库，跳过拉取和推送`)
    return
  }

  // 2) fetch + pull --ff-only：只接受快进，分叉就跳过推送留待人工处理
  const fetched = git(['fetch', syncRemote], repo.path)
  if (fetched.code !== 0) {
    log(`${repo.name}: fetch 失败 -> ${firstKeyLine(fetched.out, 'fatal|error|denied')}`)
  } else {
    const pulled = git(['pull', '--ff-only', syncRemote, repo.branch], repo.path)
    if (pulled.code !== 0) {
      const detail = firstKeyLine(pulled.out, 'fatal|error|diverg|reject|unable to access')
      if (new RegExp(NETWORK_ERROR, 'i').test(detail)) {
        // 网络抖动时仍然尝试推送（推送有自己的重试）
        log(`${repo.name}: 拉取失败（网络问题），仍尝试推送 -> ${detail}`)
      } else {
        log(`${repo.name}: 无法快进（与其他机器分叉），本次跳过推送，需人工处理 -> ${detail}`)
        return
      }
    } else {
      log(`${repo.name}: 已从 ${syncRemote}/${repo.branch} 同步`)
    }
  }

  // 3) 推送到所有远程（重试 1 次，绝不 force）
  for (const remote of remotes) {
    let ok = false
    let detail = ''
    for (let attempt = 1; attempt <= 2; attempt++) {
      const pushed = git(['push', remote], repo.path)
      if (pushed.code === 0) {
        ok = true
        break
      }
      detail = firstKeyLine(pushed.out, 'Permission denied|Authentication failed|fatal:|error:|rejected|non-fast-forward|would be overwritten')
      sleepSync(RETRY_WAIT_MS)
    }
    log(`${repo.name}: push ${remote} -> ${ok ? '成功' : `失败: ${detail}`}`)
  }
}

function main() {
  prepareLog()
  const messageStamp = stamp()
  for (const repo of REPOS) {
    try {
      syncRepo(repo, `${repo.prefix}: ${messageStamp}`)
    } catch (error) {
      // 与 PowerShell 版的 $ErrorActionPreference='Continue' 一致：单个仓库出错不影响另一个
      log(`${repo.name}: 未预期错误 -> ${error?.message ?? error}`)
    }
  }
  // 与 PowerShell 版一致：失败只写日志，不返回非零退出码
  process.exit(0)
}

main()
