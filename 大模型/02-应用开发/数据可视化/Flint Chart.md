---
tags:
  - 大模型/应用开发
  - 数据可视化
  - MCP
  - Agent
created: 2026-07-11
updated: 2026-07-11
source: https://github.com/microsoft/flint-chart
status: reviewed
---

# Flint Chart

## 一句话介绍

[Flint Chart](https://github.com/microsoft/flint-chart) 是 Microsoft 开源的、面向 AI Agent 的语义级数据可视化中间语言。Agent 或开发者只需描述字段含义、图表类型和字段映射，Flint 编译器就会推导聚合、格式、坐标轴、比例尺、颜色与布局，并输出 Vega-Lite、ECharts 或 Chart.js 的原生配置。

>[!info] 调研基线
>本文基于官方仓库 `flint-chart`/`flint-chart-mcp` 版本 `0.2.0` 整理，仓库最新提交日期为 2026-07-08，采用 MIT License，需要 Node.js 18+。Python 版本目前仍是源码预览，尚未正式发布到 PyPI。

## 它解决什么问题

让 LLM 直接生成 Vega-Lite、ECharts 或 Chart.js 配置通常有三个问题：

1. 原生配置冗长，生成成本高，字段或图表变化后需要修改许多相互关联的参数。
2. 原始数据类型不等于业务含义，例如整数 `202001` 可能表示 `YearMonth`，温度不能求和，百分比变化可能需要发散色带。
3. Agent 容易生成语法正确但视觉表达错误、标签溢出或尺寸不合适的图表。

Flint 在 Agent 与底层图表库之间增加一层稳定的中间表示：

```text
数据 + semantic_types + chart_spec
                ↓
       Flint 语义编译与布局优化
                ↓
Vega-Lite spec / ECharts option / Chart.js config
                ↓
          SVG 或 PNG 图表
```

## 核心概念

### Data Spec：字段语义

通过 `semantic_types` 描述字段的业务含义，而不仅是 string/number/date 等存储类型。

```json
{
  "semantic_types": {
    "quarter": "Quarter",
    "revenue": "Price",
    "growth": "PercentageChange",
    "region": "Category"
  }
}
```

项目提供 70+ 语义类型，并采用三级体系：

- T0：可由规则推断的基础族，如 Measure、Temporal、Categorical。
- T1：更具体的类别，用于改善聚合、格式和比例尺。
- T2：业务语义类型，如 Revenue、Temperature、YearMonth。

类型不够具体时会逐级降级，而不是直接失败；Agent 可以只为图表关键字段提供更精细的类型。

### Chart Spec：图表意图

`chart_spec` 只描述图表类型、字段到视觉通道的映射和目标尺寸：

```json
{
  "chart_spec": {
    "chartType": "Bar Chart",
    "encodings": {
      "x": { "field": "quarter" },
      "y": { "field": "revenue" }
    },
    "baseSize": { "width": 480, "height": 320 }
  }
}
```

同一套 Data Spec 可以复用于多种 Chart Spec，也可以在不重写输入的情况下切换渲染后端。

## 编译架构

Flint 将处理过程分成三个阶段：

| 阶段 | 职责 | 主要结果 |
| --- | --- | --- |
| Compiler Frontend | 根据字段语义与通道上下文推导格式、聚合、比例尺、定义域和排序 | `ChannelSemantics` 中间表示 |
| Optimizer | 根据基准尺寸、画布上限、数据基数和图表类型调整布局并处理溢出 | `LayoutResult` 与过滤后的数据 |
| Code Generator | 将共享中间表示套入后端动态模板 | Vega-Lite/ECharts/Chart.js 原生配置 |

```text
resolveChannelSemantics()
        ↓
computeZeroDecision() / convertTemporalData()
        ↓
computeChannelBudgets() / filterOverflow() / computeLayout()
        ↓
template.instantiate()
        ↓
applyLayoutToSpec()
```

前两阶段为后端无关逻辑，增加新渲染后端时主要实现第三阶段。数据基数超出画布容量时，Flint 会过滤数据并返回 warning，而不是强行渲染不可读图表。

## 支持范围

- 30+ 图表类型，官方描述 MCP 统一 schema 覆盖约 40 种图表。
- Vega-Lite、ECharts、Chart.js 三种输出后端。
- 支持柱状图、折线图、散点图、热力图、饼图/环形图、雷达图、Sankey、Treemap、Boxplot 等。
- 不同后端的图表覆盖并不完全一致，使用前应调用模板查询或查看官方 Gallery。
- JavaScript/TypeScript 包已经发布；Python port 尚处于 preview。

## 作为 TypeScript 库使用

安装：

```bash
npm install flint-chart
```

示例：

```typescript
import { assembleVegaLite } from 'flint-chart';

const spec = assembleVegaLite({
  data: {
    values: [
      { quarter: 'Q1', revenue: 1200 },
      { quarter: 'Q2', revenue: 1800 },
    ],
  },
  semantic_types: {
    quarter: 'Quarter',
    revenue: 'Price',
  },
  chart_spec: {
    chartType: 'Bar Chart',
    encodings: {
      x: { field: 'quarter' },
      y: { field: 'revenue' },
    },
    baseSize: { width: 480, height: 320 },
  },
});
```

其他输出入口：

```typescript
import { assembleECharts, assembleChartjs } from 'flint-chart';
```

## 作为 MCP Server 使用

启动：

```bash
npx -y flint-chart-mcp
```

MCP 配置：

```json
{
  "mcpServers": {
    "flint": {
      "command": "npx",
      "args": ["-y", "flint-chart-mcp"]
    }
  }
}
```

### MCP 工具

| 工具 | 用途 |
| --- | --- |
| `render_chart` | 本地渲染 PNG 或 SVG |
| `compile_chart` | 输出后端原生配置与 warning |
| `validate_chart` | 验证规格并返回错误、警告和计算尺寸 |
| `list_chart_types` | 查询各后端支持的图表和通道 |
| `create_chart_view` | 在支持 MCP Apps 的客户端中打开交互式图表视图 |

MCP Server 还提供 `flint://agent-skill` 资源和 `author_flint_chart` prompt，帮助 Agent 生成符合约束的 `ChartAssemblyInput`。

### 本地渲染链路

- Vega-Lite：编译到 Vega，使用 headless `vega.View` 生成 SVG；PNG 通过 resvg 转换。
- ECharts：服务端 SVG 渲染；PNG 通过 resvg 转换。
- Chart.js：通过 `@napi-rs/canvas` 生成 PNG，不支持 SVG。
- 所有渲染都在本机进程内完成，不上传到远程渲染服务。

## 优点

1. **适合 Agent 生成**：统一、紧凑的规格比直接生成三套底层配置更稳定，也能减少上下文和输出 token。
2. **语义优先**：能区分业务语义与存储类型，避免温度求和、年份当连续数值等常见错误。
3. **多后端复用**：同一输入可编译为三种主流图表配置，降低对单一渲染库的绑定。
4. **自动布局**：根据基数、画布尺寸、分面和图表类型计算布局，并对溢出给出明确 warning。
5. **允许人工覆盖**：编译器提供合理默认值，同时显式 encoding 与 chart properties 可以覆盖推导结果。
6. **Agent 接入完整**：MCP、Skill、校验、编译、渲染和交互视图形成完整工作流。
7. **本地处理数据**：MCP 渲染不依赖远程服务，适合包含内部数据的图表任务。
8. **扩展边界清晰**：语义类型、图表模板和渲染后端都有独立扩展接口。

## 缺点与限制

1. **项目仍处于早期版本**：当前版本为 `0.2.0`，API、图表覆盖和行为可能继续变化。
2. **不是数据分析引擎**：Flint 不替代 SQL、Pandas 或 BI 语义层，数据清洗、查询和指标计算仍需在上游完成。
3. **后端能力不完全对齐**：同名图表不保证三种后端都支持，视觉效果也可能存在差异。
4. **语义标注需要正确**：Agent 或用户若把字段类型标错，编译器可能稳定地生成一张语义错误的图表。
5. **模板约束降低自由度**：高度定制、特殊交互或复杂组合图最终仍可能需要直接编辑底层配置。
6. **Python 暂未正式发布**：Python 数据工作流目前不能直接依赖稳定的 PyPI 包。
7. **自动过滤需要审查**：数据过多时可能截断并产生 warning；若调用方忽略 warning，图表可能只展示部分数据。
8. **Agent 选图仍可能失误**：Flint 改善“如何生成图”，但不能保证 LLM 一定选择了正确的图表类型或分析结论。

## 安全注意事项

>[!warning] MCP 文件访问
>MCP Server 默认允许 Agent 通过 `data.url` 读取本机任意 JSON、CSV 或 TSV 文件，路径可为绝对路径。虽然只读且不会访问远程 URL，但在不可信 Agent、共享服务器或多用户环境中仍可能造成本地数据泄露。

不可信环境应禁用文件引用：

```bash
npx -y flint-chart-mcp --disable-file-reference
```

此时只接受内联的 `data.values`。服务端还提供行数、文件大小和画布尺寸限制，并禁止远程 URL，以降低 DoS 与 SSRF 风险。

## 适用场景

- 让 Codex、Claude 等 Agent 从 CSV/JSON 数据生成可用图表。
- 在报表、数据故事或研究流程中生成 SVG/PNG 图表资产。
- 为 SaaS 产品增加自然语言到图表的能力。
- 需要在 Vega-Lite、ECharts、Chart.js 之间保持统一上层规格。
- 数据字段具有明确业务语义，需要自动选择聚合、格式和色彩规则。

## 不适用场景

- 需要完整 BI 平台、数据建模、权限、调度和仪表板管理。
- 高度定制的交互式可视化或三维可视化。
- 数据量很大且需要服务端聚合、OLAP 或流式计算。
- 只使用单一图表库，并且已有稳定的人工配置模板。

## 与直接生成图表配置对比

| 维度 | LLM 直接生成 ECharts/Vega-Lite | Flint Chart |
| --- | --- | --- |
| 输出长度 | 通常较长 | 规格较紧凑 |
| 业务语义 | 依赖 Prompt 临时推断 | `semantic_types` 显式保存 |
| 多后端 | 每个后端分别生成 | 同一输入编译多个后端 |
| 布局适配 | Agent 手工计算 | 编译器统一优化 |
| 错误检查 | 主要依赖底层库 | 可先 validate/compile |
| 自由度 | 高 | 受模板和中间语言约束 |
| 稳定性 | 易受模型输出波动影响 | 规则编译部分更确定 |

## 使用建议

>[!summary]
>把 Flint 用作 Agent 的图表编译层，而不是让它承担数据分析。上游先完成数据查询、清洗和指标计算；Agent 负责选择图表、标注字段语义并生成 Flint spec；Flint 负责确定性校验、布局和渲染；最终由人检查图表是否表达了正确结论。

推荐工作流：

```text
明确分析问题
  → SQL/Python 准备聚合后的数据
  → Agent 标注 semantic_types
  → list_chart_types 选择有效模板
  → validate_chart
  → render_chart
  → 人工检查数据截断、坐标轴、聚合与结论
```

## 参考资料

- [GitHub 仓库](https://github.com/microsoft/flint-chart)
- [Flint Project Site](https://microsoft.github.io/flint-chart/)
- [在线 Editor](https://microsoft.github.io/flint-chart/#/editor)
- [架构文档](https://github.com/microsoft/flint-chart/blob/main/docs/architecture.md)
- [API Reference](https://github.com/microsoft/flint-chart/blob/main/docs/api-reference.md)
- [MCP Server](https://github.com/microsoft/flint-chart/tree/main/packages/flint-mcp)
- [Agent Workflows](https://github.com/microsoft/flint-chart/blob/main/docs/tutorials/agent-workflows.md)

## 关联笔记

- [[MCP]]
- [[Agent]]
- [[数据可视化]]

