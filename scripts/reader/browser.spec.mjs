import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const manifest = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../_site/md-reader/index.json', import.meta.url)), 'utf8'));
const selectNote = pattern => {
  const note = manifest.notes.find(note => pattern.test(note.path));
  if (!note) throw new Error('缺少兼容性样本：' + pattern);
  return note;
};

test('首页按需读取 MD，源码切换、目录筛选、搜索与移动端可用', async ({ page }) => {
  const markdownRequests = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/notes/') && /\.md$/i.test(new URL(request.url()).pathname)) markdownRequests.push(request.url()); });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/search?**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"offline"}' }));
  await page.goto('/');
  await expect(page.locator('article h1')).toContainText('格物志');
  await expect(page.locator('#status')).toBeHidden();
  expect(markdownRequests.length).toBe(1);
  await page.locator('#source-mode').click();
  await expect(page.locator('#source')).toContainText('title: 格物志');
  await page.locator('#read-mode').click();
  await expect(page.locator('article h1')).toBeVisible();
  expect(markdownRequests.length).toBe(1);
  await page.locator('#sections a').filter({ hasText: '技术笔记' }).click();
  await expect(page.locator('body')).not.toHaveClass(/landing/);
  await page.locator('#filter').fill('奈奎斯特');
  await expect(page.locator('#tree a').first()).toBeVisible();
  await page.locator('#tree a').first().click();
  await expect(page.locator('article')).toContainText('采样');
  await page.reload();
  await expect(page.locator('article')).toContainText('采样');
  await page.locator('#search-toggle').click();
  await page.locator('#query').fill('奈奎斯特');
  await expect(page.locator('#results a').first()).toBeVisible();
  await expect(page.locator('#search-status')).toContainText('本地匹配');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#menu').click();
  await expect(page.locator('#sidebar')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  expect(errors).toEqual([]);
  await page.screenshot({ path: '.cache/reader-mobile.png', fullPage: false });
});

test('Mermaid、公式与附件可以在浏览器解析', async ({ page }) => {
  const note = selectNote(/图解 Transformer 中的 QKV 机制\.md$/);
  await page.goto(note.url);
  await expect(page.locator('article .mermaid svg').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('article .katex').first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-gz-skin', 'cibai');
  await expect(page.locator('article [data-callout="abstract"] > .callout-title').first()).toBeHidden();
  const style = await page.locator('article').evaluate(el => ({ color: getComputedStyle(document.body).backgroundColor, width: el.getBoundingClientRect().width }));
  expect(style.color).toBe('rgb(255, 255, 255)');
  expect(style.width).toBeGreaterThan(700);
  expect(style.width).toBeLessThan(730);
  await page.locator('.gz-skin-dd summary').click();
  await page.locator('button[data-gz-skin="paper"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-gz-skin', 'paper');
  await page.locator('.gz-skin-dd summary').click();
  await page.locator('button[data-gz-skin="cibai"]').click();
  await page.screenshot({ path: '.cache/reader-desktop.png', fullPage: false });
  const imageNote = selectNote(/07-教程与课程\/.*\/01-.*\.md$/);
  await page.goto(imageNote.url);
  await expect(page.locator('article h1')).toBeVisible();
  const image = page.locator('article img[src^="/notes/"]').first();
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0), { timeout: 15000 }).toBeTruthy();
});

test('绘图功能笔记保留 Mermaid 文字、甘特图字号与 LaTeX 示例', async ({ page }) => {
  const note = selectNote(/00 Obsidian有哪些绘图功能\.md$/);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(note.url);
  const flowchart = page.locator('article .mermaid svg').first();
  await expect(flowchart.locator('.nodeLabel')).toHaveText(['想法', '结构化', '可视化'], { timeout: 30000 });
  for (const label of await flowchart.locator('.nodeLabel').all()) await expect(label).toBeVisible();
  const gantt = page.locator('article svg[aria-roledescription="gantt"]');
  await expect(gantt).toBeVisible();
  expect(await gantt.evaluate(svg => svg.viewBox.baseVal.width <= svg.closest('.mermaid').clientWidth + 1)).toBeTruthy();
  expect(await gantt.locator('.taskText').first().evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(10);
  await expect(page.locator('article .katex-display')).toHaveCount(1);
  await expect(page.locator('article .katex-error, article .math-pending, article .diagram-error')).toHaveCount(0);
  await expect(page.locator('article pre[data-language="markdown"]')).toContainText('E = mc^2');
  await expect(page.locator('article h3').filter({ hasText: '2. PlantUML' })).toBeVisible();
  await page.screenshot({ path: '.cache/reader-drawing-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.gz-skin-dd summary').click();
  await page.locator('button[data-gz-skin="yaoye"]').click();
  await page.locator('.gz-skin-dd summary').click();
  await page.locator('button[data-gz-mode="dark"]').click();
  // 切换源码后重新排版，验证窄屏测量的甘特图不会挤出正文。
  await page.locator('#source-mode').click();
  await page.locator('#read-mode').click();
  await expect(page.locator('article .mermaid svg').first().locator('.nodeLabel')).toHaveText(['想法', '结构化', '可视化']);
  await expect(gantt).toBeVisible();
  expect(await gantt.evaluate(svg => svg.viewBox.baseVal.width >= 640 && svg.closest('.mermaid').scrollWidth > svg.closest('.mermaid').clientWidth)).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await expect(page.locator('article .katex-display')).toBeVisible();
  await page.screenshot({ path: '.cache/reader-drawing-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('Dataview 索引与生词本复用现有 JS，教学查询保留代码', async ({ page }) => {
  await page.goto(selectNote(/00-日报索引\.md$/).url);
  await expect(page.locator('article .dvl-block').first()).toBeVisible();
  await expect(page.locator('article .dvl-block a').first()).toHaveAttribute('href', /^\//);
  await page.goto(selectNote(/我的生词本\.md$/).url);
  await expect(page.locator('.dvl-vocab-w').first()).toBeVisible();
});

test('双语精读模式、词卡与源码往返正常，切到普通笔记清理状态', async ({ page }) => {
  const note = selectNote(/英语学习\/文章荟萃\/.*双语精读\.md$/);
  await page.goto(note.url);
  await expect(page.locator('.bil-toolbar')).toBeVisible();
  await expect(page.locator('.bil-pair').first()).toBeVisible();
  await page.locator('.bil-toolbar [data-mode="en"]').click();
  await expect(page.locator('html')).toHaveClass(/bil-mode-en/);
  const word = page.locator('.bil-w').first();
  if (await word.count()) {
    await word.click();
    await expect(page.locator('.bil-pop')).toBeVisible();
    await page.keyboard.press('Escape');
  }
  await page.locator('#source-mode').click();
  await expect(page.locator('#source')).toContainText('| 原文 | 译文 |');
  await expect(page.locator('html')).not.toHaveClass(/bil-page/);
  await page.locator('#read-mode').click();
  await expect(page.locator('.bil-toolbar')).toBeVisible();
  await page.locator('.brand').click();
  await expect(page.locator('article h1')).toContainText('格物志');
  await expect(page.locator('html')).not.toHaveClass(/bil-page/);
});

test('交互演示从同源静态文件加载', async ({ page }) => {
  await page.goto(selectNote(/奈奎斯特极限与采样定理\.md$/).url);
  const frame = page.locator('article iframe').first();
  await expect(frame).toHaveAttribute('src', '/static/nyquist-demo.html');
  await frame.scrollIntoViewIfNeeded();
  await expect(page.frameLocator('article iframe').first().locator('input[type=range]').first()).toBeVisible();
  const slider = page.frameLocator('article iframe').first().locator('input[type=range]').first();
  await slider.fill('30');
});

test('嵌套 Callout、章节和块嵌入、代码保护与 HTML 净化', async ({ page }) => {
  const fixture = { path: '兼容性测试.md', url: '/兼容性测试.html', title: '兼容性测试', tags: [], aliases: [], links: [], hash: 'fixture' };
  const embedded = { ...fixture, path: '嵌入测试.md', url: '/嵌入测试.html', title: '嵌入测试' };
  const raw = [
    '# 兼容性测试', '',
    '> [!note]+ 外层', '> 外层正文', '>', '> > [!tip] 内层', '> > 内层正文', '',
    '正文引用 ^sample', '', '![[嵌入测试#引用章节]]', '', '![[嵌入测试#^block]]', '',
    '| 笔记 | 别名 |', '|---|---|', '| [[嵌入测试\\|链接别名]] | 保留 |', '',
    String.fromCharCode(96,96,96) + 'js', 'const text = "[[不应解析]]";', String.fromCharCode(96,96,96), '',
    '%%不可见注释%%', '', '<script>window.readerInjection = true</script>', '<img src="x" onerror="window.readerInjection=true">', '',
    String.fromCharCode(96,96,96) + 'mermaid', 'flowchart LR', 'A["保留<br/>换行"] --> B["<img src=x onerror=window.readerInjection=true>"]', String.fromCharCode(96,96,96),
  ].join('\n');
  await page.route('**/index.json', route => route.fulfill({ json: { ...manifest, notes: [...manifest.notes, fixture, embedded] } }));
  await page.route('**/notes/**', route => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname);
    if (name === '/notes/兼容性测试.md') return route.fulfill({ contentType: 'text/markdown', body: raw });
    if (name === '/notes/嵌入测试.md') return route.fulfill({ contentType: 'text/markdown', body: '# 嵌入测试\n\n## 引用章节\n\n章节正文\n\n## 其他章节\n\n不应嵌入此章节\n\n块内容 ^block\n' });
    return route.continue();
  });
  // 测试样本路由由浏览器目录索引接管，服务端仍返回真实首页。
  await page.goto('/');
  await expect(page.locator('article h1')).toBeVisible();
  await page.evaluate(() => { history.pushState(null, '', '/兼容性测试.html'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.locator('#status')).toBeHidden();
  await expect(page.locator('article .callout.note > details > .callout-content .callout.tip')).toContainText('内层正文');
  await expect(page.locator('article .callout.note')).toHaveAttribute('data-callout', 'note');
  await expect(page.locator('article .callout.tip')).toHaveAttribute('data-callout', 'tip');
  await expect(page.locator('.note-embed').first()).toContainText('章节正文');
  await expect(page.locator('.note-embed').first()).not.toContainText('不应嵌入此章节');
  await expect(page.locator('.note-embed').nth(1)).toContainText('块内容');
  await expect(page.locator('article td a')).toContainText('链接别名');
  await expect(page.locator('article pre')).toContainText('[[不应解析]]');
  await expect(page.locator('article')).not.toContainText('不可见注释');
  await expect(page.locator('article .mermaid svg')).toBeVisible();
  await expect(page.locator('article .mermaid .nodeLabel').first()).toContainText('保留');
  await expect(page.locator('article .mermaid [onerror], article .mermaid [onclick], article .mermaid iframe')).toHaveCount(0);
  expect(await page.evaluate(() => window.readerInjection)).toBeUndefined();
  await expect(page.locator('article script')).toHaveCount(0);
});

test('课程测验、上下课导航和动手实验保留交互', async ({ page }) => {
  const fixture = { path: '课程测试.md', url: '/课程测试.html', title: '课程测试', tags: [], aliases: [], links: [], hash: 'fixture' };
  const raw = ['# 课程测试', '', '> [!example] 学习小测验', '> **Q1. 哪个是正确答案？**', '>', '> - A. 错误', '> - B. 正确 ✅', '>', '> > [!tip] 讲解', '> > 答案说明', '', '<div class="lab" data-lab="attention"></div>', '', '## 相关笔记', '', '- 上一课：[[index|首页]]', '- 下一课：[[index|下一课]]'].join('\n');
  await page.route('**/index.json', route => route.fulfill({ json: { ...manifest, notes: [...manifest.notes, fixture] } }));
  await page.route('**/notes/**', route => decodeURIComponent(new URL(route.request().url()).pathname) === '/notes/课程测试.md'
    ? route.fulfill({ contentType: 'text/markdown', body: raw }) : route.continue());
  await page.goto('/');
  await expect(page.locator('article h1')).toBeVisible();
  await page.evaluate(() => { history.pushState(null, '', '/课程测试.html'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.locator('.quiz-item')).toHaveAttribute('data-answer', 'B');
  await page.locator('.quiz-opt.is-answer input').check();
  await expect(page.locator('.quiz-opt.is-answer input')).toBeChecked();
  await expect(page.locator('.lesson-nav a')).toHaveCount(2);
  await expect(page.locator('[data-lab="attention"]')).toHaveAttribute('data-lab-ready', '1');
  await expect(page.locator('[data-lab="attention"] button').first()).toBeVisible();
});
