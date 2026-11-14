#!/usr/bin/env node
// Windows 双击入口；部署范围固定为公开内容与本阅读器，不暂存编辑器或插件状态。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';

const vault = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const action = args[0];
const gitArgs = ['-c', 'safe.directory=' + vault.split(path.sep).join('/')];
const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
function run(command, params, { quiet = false } = {}) {
  const result = spawnSync(command, params, { cwd: vault, env, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (!quiet && result.stdout) process.stdout.write(result.stdout);
  if (!quiet && result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) throw new Error(command + ' 执行失败：' + (result.error?.message || result.stderr || result.stdout).trim());
  return result.stdout.trim();
}
const git = (...params) => run('git', [...gitArgs, ...params], { quiet: true });
function npmCi() {
  if (process.platform === 'win32') run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm.cmd ci --no-audit --no-fund']);
  else run('npm', ['ci', '--no-audit', '--no-fund']);
}
function ensureDependencies() {
  if (['markdown-it', 'esbuild', 'sass'].some(name => !fs.existsSync(path.join(vault, 'node_modules', name, 'package.json')))) {
    console.log('首次运行，正在安装阅读器依赖…');
    npmCi();
  }
}
function openBrowser(url) {
  if (process.platform !== 'win32') return;
  spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'start "" "' + url + '"'], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
}
function allowed(file, publishedImages = new Set(), imageCounts = new Map()) {
  if (/(?:^|\/)(?:AGENTS|CLAUDE)\.md$/i.test(file)) return false;
  if (/^技术笔记\/(?:虚拟机|安全)\//.test(file) || file === '技术笔记/版本管理/知识库双仓库拆分与多机同步.md') return false;
  if (/^(?:技术笔记|大模型|Ontology|Golang编程|Rust编程|读书笔记|英语学习|数学学习|网址收藏)\/.*\.md$/i.test(file)) return true;
  if (/^(?:附件|技术笔记|大模型|Ontology|Golang编程|Rust编程|读书笔记|英语学习|数学学习|网址收藏)\/.*\.(?:svg|png|jpe?g|gif|webp)$/i.test(file)) {
    const name = path.posix.basename(file).toLowerCase();
    return publishedImages.has(name) && imageCounts.get(name) === 1;
  }
  return /^(?:start-reader\.cmd|deploy-reader\.cmd|package(?:-lock)?\.json|scripts\/(?:windows-reader\.mjs|preview-md-reader\.mjs|build-md-reader\.mjs|build-vocab\.mjs|skin-switcher\.cjs|site-custom\.scss|export-public\.ps1|reader\/.*|site-assets\/.*)|cloudflare\/_worker\.js|docs\/markdown-reader-preview\.md|\.github\/workflows\/publish-md-reader\.yml)$/.test(file);
}
async function deploy() {
  run('git', ['--version']);
  run('gh', ['--version'], { quiet: true });
  if (git('diff', '--cached', '--name-only')) throw new Error('暂存区已有改动。请先完成或处理该批提交，脚本不会混入其他暂存内容。');
  const branch = git('branch', '--show-current');
  if (!branch) throw new Error('当前处于 detached HEAD，不能自动推送。');
  const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}');
  const remote = upstream.split('/')[0];
  if (upstream.slice(remote.length + 1) !== branch) throw new Error('upstream 分支与本地分支不同，请先明确推送目标。');
  const remoteUrl = git('remote', 'get-url', remote);
  const repo = remoteUrl.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1];
  if (!repo) throw new Error('此脚本需要指向 GitHub 的 upstream。');
  if (!args.includes('--check')) {
    console.log('正在快进同步 ' + upstream + '…');
    git('fetch', remote);
    git('pull', '--ff-only');
  }
  ensureDependencies();
  run(process.execPath, ['--test', 'scripts/reader/reader.test.mjs']);
  const siteRoot = process.env.SITE_ROOT || path.join(vault, '_site/md-reader-export');
  run(process.execPath, ['scripts/preview-md-reader.mjs', '--build-only', '--out', path.join(siteRoot, 'release')]);
  const released = JSON.parse(fs.readFileSync(path.join(siteRoot, 'release/index.json'), 'utf8'));
  const publishedImages = new Set(released.files.map(file => path.posix.basename(file).toLowerCase()));
  const imageCounts = new Map();
  const sourcePaths = new Set([...git('ls-files', '-z').split('\0'), ...git('ls-files', '--others', '--exclude-standard', '-z').split('\0')]);
  for (const file of sourcePaths) {
    if (/^(?:附件|技术笔记|大模型|Ontology|Golang编程|Rust编程|读书笔记|英语学习|数学学习|网址收藏)\/.*\.(?:svg|png|jpe?g|gif|webp)$/i.test(file)) {
      const name = path.posix.basename(file).toLowerCase();
      imageCounts.set(name, (imageCounts.get(name) || 0) + 1);
    }
  }
  const changes = new Set([
    ...git('diff', '--no-renames', '--name-only', '-z', 'HEAD').split('\0'),
    ...git('ls-files', '--others', '--exclude-standard', '-z').split('\0'),
  ].filter(Boolean));
  const selected = [...changes].filter(file => allowed(file, publishedImages, imageCounts));
  const skipped = [...changes].filter(file => !allowed(file, publishedImages, imageCounts));
  if (skipped.length) console.log('保留未提交的其他改动：\n' + skipped.map(file => '  ' + file).join('\n'));
  if (skipped.some(file => /\.(svg|png|jpe?g|gif|webp)$/i.test(file) && publishedImages.has(path.posix.basename(file).toLowerCase()))) throw new Error('本次修改的已引用图片存在同名歧义，请使用明确的附件路径后重跑。');
  if (selected.length) {
    console.log('本次提交：\n' + selected.map(file => '  ' + file).join('\n'));
    if (args.includes('--check')) { console.log('校验完成；--check 模式不提交、不推送、不部署。'); return; }
    const message = args.includes('--message') ? args[args.indexOf('--message') + 1] : '更新 ' + selected.filter(file => /\.md$/i.test(file)).length + ' 篇笔记及 Markdown 阅读器发布配置';
    if (!message) throw new Error('--message 缺少提交说明');
    for (let i = 0; i < selected.length; i += 60) git('-c', 'core.safecrlf=false', 'add', '--', ...selected.slice(i, i + 60));
    git('diff', '--cached', '--check');
    const messagePath = path.join(os.tmpdir(), 'md-reader-commit-' + process.pid + '.txt');
    fs.writeFileSync(messagePath, message + '\n', 'utf8');
    try { git('commit', '-F', messagePath); }
    finally { fs.unlinkSync(messagePath); }
  } else console.log('没有需要新增提交的公开内容，继续推送并发布当前版本。');
  if (args.includes('--check')) return;
  git('push', remote, 'HEAD:' + branch);
  const sha = git('rev-parse', 'HEAD');
  const endpoint = 'repos/' + repo + '/actions/workflows/publish-md-reader.yml';
  const oldRuns = JSON.parse(run('gh', ['api', endpoint + '/runs?per_page=5'], { quiet: true })).workflow_runs;
  const oldIds = new Set(oldRuns.map(run => run.id));
  run('gh', ['api', endpoint + '/dispatches', '-X', 'POST', '-f', 'ref=' + branch]);
  console.log('已提交并推送，正在部署独立预览。正式站点继续使用原入口。');
  let lastStatus = '';
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const runs = JSON.parse(run('gh', ['api', endpoint + '/runs?per_page=5'], { quiet: true })).workflow_runs;
    const active = runs.find(run => !oldIds.has(run.id) && run.head_sha === sha && run.event === 'workflow_dispatch');
    if (!active) continue;
    if (active.status !== lastStatus) {
      console.log(active.status + '：' + active.html_url);
      lastStatus = active.status;
    }
    if (active.status === 'completed') {
      if (active.conclusion !== 'success') throw new Error('发布未成功（' + active.conclusion + '），本地提交和推送已保留。查看：' + active.html_url);
      const url = 'https://markdown-preview.wuhy-notes.pages.dev/';
      console.log('部署完成：' + url);
      if (args.includes('--open')) openBrowser(url);
      return;
    }
  }
  throw new Error('等待部署超时，任务可能仍在 GitHub Actions 运行。');
}
async function serve() {
  ensureDependencies();
  const params = args.slice(1).filter(value => value !== '--open');
  const child = spawn(process.execPath, ['scripts/preview-md-reader.mjs', '--watch', ...params], { cwd: vault, env, stdio: ['inherit', 'pipe', 'inherit'], windowsHide: true });
  let opened = false;
  child.stdout.on('data', data => {
    process.stdout.write(data);
    const url = data.toString().match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    if (url && args.includes('--open') && !opened) { opened = true; openBrowser(url); }
  });
  child.once('error', error => { console.error(error.message); process.exitCode = 1; });
  await new Promise(resolve => child.once('exit', code => { process.exitCode = code || 0; resolve(); }));
}
try {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('请安装 Node.js 24 或更新版本。');
  if (action === 'serve') await serve();
  else if (action === 'deploy') await deploy();
  else throw new Error('用法：node scripts/windows-reader.mjs serve|deploy [--open] [--port 8790]');
} catch (error) {
  console.error('\n操作未完成：' + error.message);
  process.exitCode = 1;
}
