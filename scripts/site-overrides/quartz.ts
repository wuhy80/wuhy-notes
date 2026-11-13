// scripts/site-overrides/quartz.ts
// ─────────────────────────────────────────────────────────────────────────────
// Quartz 构建加速补丁（发布时间 2026-11-13）
//
// 背景（本地 1000 篇 / 2346 文件实测，i7-13700）：
//   全量构建 237s，其中：
//     解析 markdown            28s
//     PageTypeDispatcher       18s   （2541 个 HTML 页 + 1843 个 tag/目录页）
//     CustomOgImages          189s   ← 占 80%，瓶颈
//   上游 @quartz-community/og-image 的 emit 是「严格串行 for 循环」，而且是给
//   1841 个页面（含 841 个 tag/目录虚拟页）每页都渲一张 1200x630 webp。
//
// 本文件做三件事（都不改 node_modules，只包一层）：
//   1. 跳过虚拟页：只有真实文件（有 filePath）才生成 OG 图，tag/目录页不生成
//   2. 多 lane 并发：satori 排版是单线程 JS，并发收益有限（实测 189s→125s），
//      但配合缓存后 miss 很少，这点开销可以忽略
//   3. 磁盘缓存：按「样式签名 + slug + frontmatter + 正文长度」做 key，
//      命中直接 copy 上次生成的 webp（1-2ms/张），未命中才真渲染。
//      → 稳态构建 OG 阶段从 189s 降到 1-3s
//
// 缓存目录：环境变量 OG_CACHE_DIR（publish-site.ps1 会设成 <SiteRoot>\.og-cache），
//           默认 ./.og-cache。清空它等价于强制重建全部 OG 图。
// 开关：OG_IMAGES=off 直接关掉 OG 图（退化成一个站点级默认图）；OG_CONCURRENCY 调并发。
//
// 失效兜底：key 里带 CACHE_VERSION，改模板/改这里就 bump 一版。
// ─────────────────────────────────────────────────────────────────────────────

import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"

const CACHE_VERSION = "v1"
const OG_NAME = "CustomOgImages"

const config = await loadQuartzConfig()

const ogEnabled = (process.env.OG_IMAGES ?? "on").toLowerCase() !== "off"
const ogIndex = config.plugins.emitters.findIndex((e) => e.name === OG_NAME)

if (ogIndex >= 0 && ogEnabled) {
  const base = config.plugins.emitters[ogIndex] as any
  const laneCount = Math.min(Math.max(Number(process.env.OG_CONCURRENCY ?? 6) || 6, 1), 16)
  const cacheDir = path.resolve(process.env.OG_CACHE_DIR ?? ".og-cache")

  // 样式签名：主题配色 / 字体 / 站点后缀 / 尺寸 变了就整体失效
  const styleSig = crypto
    .createHash("sha1")
    .update(
      JSON.stringify({
        v: CACHE_VERSION,
        suffix: config.configuration.pageTitleSuffix ?? "",
        theme: config.configuration.theme,
      }),
    )
    .digest("hex")
    .slice(0, 12)

  const keyOf = (data: any): string => {
    const fm = data?.frontmatter ?? {}
    const payload = JSON.stringify({
      s: styleSig,
      slug: data?.slug,
      title: fm.title ?? "",
      desc: fm.socialDescription ?? fm.description ?? data?.description ?? "",
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      // 注意：不能用 data.dates —— 它回落到文件 mtime，而导出脚本每次重写文件后
      // mtime 都会变，key 会永远命中不了（实测踩到：缓存条目翻倍且零命中）。
      // 只用 frontmatter 里显式写的日期；没写的页面图上那个日期本来就是「检出时间」，无意义。
      dates: { created: fm.created ?? fm.date ?? null, modified: fm.modified ?? fm.updated ?? null },
      len: String(data?.text ?? "").length,
    })
    return crypto.createHash("sha1").update(payload).digest("hex")
  }

  // 与上游 write() 完全一致的落盘路径：joinSegments(argv.output, slug + ".webp")
  const outPathOf = (ctx: any, slug: string) =>
    path.join(ctx.argv.output, `${slug}-og-image.webp`)

  const parallel: any = { ...base }

  parallel.emit = async function* (ctx: any, content: any[], resources: any) {
    const real = content.filter(([, vfile]: [any, any]) => {
      const data = vfile?.data ?? {}
      return data.filePath !== undefined && data.frontmatter?.socialImage === undefined
    })

    const hits: { out: string; from: string }[] = []
    const misses: { item: any; key: string; cachePath: string }[] = []

    for (const item of real) {
      const data = item[1]?.data ?? {}
      if (!data.slug) continue
      const key = keyOf(data)
      const cachePath = path.join(cacheDir, `${key}.webp`)
      if (fs.existsSync(cachePath)) {
        hits.push({ out: outPathOf(ctx, data.slug), from: cachePath })
      } else {
        misses.push({ item, key, cachePath })
      }
    }

    // 命中：直接 copy（异步，调用方逐个 await，但都在毫秒级）
    for (const h of hits) {
      yield (async () => {
        await fsp.mkdir(path.dirname(h.out), { recursive: true })
        await fsp.copyFile(h.from, h.out)
        return h.out
      })()
    }

    if (misses.length === 0) return

    // 未命中：走上游渲染，lanes 并发；渲染完成后顺手写回缓存
    const lanes = Math.min(laneCount, misses.length)
    const shards: any[][] = Array.from({ length: lanes }, () => [])
    misses.forEach((m, i) => shards[i % lanes].push(m))

    const gens = shards.map((shard) => ({
      gen: base.emit(
        ctx,
        shard.map((m) => m.item),
        resources,
      ),
      shard,
      cursor: 0,
      item: null as any,
      done: false,
    }))

    // pull 一次 = 让某个 lane 走到下一个 yield，拿到一个「已经开始渲染」的 promise
    const pull = async (st: (typeof gens)[number]) => {
      const r = await st.gen.next()
      if (r.done) {
        st.done = true
        st.item = null
      } else {
        st.item = r.value
      }
    }

    await Promise.all(gens.map(pull))

    while (true) {
      const st = gens.find((s) => s.item)
      if (!st) break
      const pending = st.item
      const target = st.shard[st.cursor] as { cachePath: string } | undefined
      st.item = null
      st.cursor += 1

      yield (async () => {
        const outPath: string = await pending
        if (target) {
          try {
            await fsp.mkdir(path.dirname(target.cachePath), { recursive: true })
            await fsp.copyFile(outPath, target.cachePath)
          } catch {
            // 写缓存失败不该影响发布
          }
        }
        return outPath
      })()

      await pull(st)
    }
  }

  // watch / 增量路径：上游本来只处理变更文件，原样转发（不走缓存，本地预览够用）
  if (base.partialEmit) {
    parallel.partialEmit = async function* (
      ctx: any,
      content: any[],
      resources: any,
      changeEvents: any,
    ) {
      yield* base.partialEmit(ctx, content, resources, changeEvents)
    }
  }

  config.plugins.emitters[ogIndex] = parallel

  // 缓存回收：条目过多时按 mtime 删最旧的 1/4，避免无限增长
  try {
    const entries = await fsp.readdir(cacheDir)
    if (entries.length > 6000) {
      const stats = await Promise.all(
        entries.map(async (name) => {
          const p = path.join(cacheDir, name)
          try {
            return { p, mtime: (await fsp.stat(p)).mtimeMs }
          } catch {
            return { p, mtime: 0 }
          }
        }),
      )
      stats.sort((a, b) => a.mtime - b.mtime)
      await Promise.all(stats.slice(0, Math.floor(stats.length / 4)).map((s) => fsp.rm(s.p, { force: true })))
    }
  } catch {
    // 缓存目录还不存在，忽略
  }
} else if (ogIndex >= 0 && !ogEnabled) {
  // 显式关闭：从 emitter 列表里摘掉
  const kept = config.plugins.emitters.filter((e) => e.name !== OG_NAME)
  config.plugins.emitters = kept as any
}

export default config
export const layout = await loadQuartzLayout()
