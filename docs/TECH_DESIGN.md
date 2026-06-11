# 今日热搜 · 技术设计

最后更新：2026-06-10

## 阅读导航

- 定位章节时优先使用 `rg -n "^#{1,6} " docs/TECH_DESIGN.md`，再用 `sed -n` 读取目标范围。
- 前端页面任务：先读“接口契约”，需要状态细节时再读“缓存与失败策略”。
- 后端数据源任务：先读“数据源口径”和“Adapter 设计”。
- 缓存或异常任务：先读“接口契约”和“缓存与失败策略”。
- QA 或测试任务：先读“接口契约”“缓存与失败策略”和 PRD 验收标准。
- 架构调整、跨模块变更或冲突判断：阅读全文，并对照 PRD 和 ADR。

## 技术栈
- 前端：React + TypeScript + Vite + CSS（可用 CSS Modules，不强制 UI 库）
- 后端：Node.js + Express
- 数据：各平台公开 JSON 或可稳定请求的数据入口（fetch 解析，非 HTML 爬虫）
- 缓存：内存 Map（TTL 300～600 秒）
- 部署：前端 Vercel / 后端 Railway（示例）

## 数据源口径

| source | sourceName | listName | 候选数据入口 | 数据语义 | heat |
|---|---|---|---|---|---|
| weibo | 微博 | 热搜 | `https://weibo.com/ajax/side/hotSearch` | 微博实时热搜 | `num` |
| zhihu | 知乎 | 热搜词 | `https://www.zhihu.com/api/v4/search/top_search` | 知乎搜索热词，不是问答内容热榜 | 无 |
| bilibili | B 站 | 热门 | `https://api.bilibili.com/x/web-interface/popular?ps=10&pn=1` | B 站热门视频 | `stat.view` 可选 |

说明：

- 微博请求需要合理 `User-Agent`，并可能需要 `Referer: https://weibo.com/`。
- 知乎 MVP 使用热搜词数据；如果后续改为问答内容热榜，需要先更新 PRD、研究记录和 ADR。
- B 站 MVP 展示“热门”，不命名为“热搜”。

## 项目结构
hotpage/
├── client/                 # Vite + React
│   ├── src/
│   │   ├── components/     # HotCard、Layout
│   │   ├── api/            # fetchHot
│   │   ├── types/          # HotPlatform、HotItem
│   │   └── mock/           # Mock 阶段数据
├── server/
│   ├── routes/hot.js
│   ├── services/           # weibo.ts、zhihu.ts、bilibili.ts
│   └── utils/cache.js
└── README.md

## 前端实现约定

- React 组件使用 PascalCase，例如 `HotCard`、`Layout`。
- 普通函数、变量和 Hook 使用 camelCase，例如 `fetchHot`、`useHotData`。
- 优先使用函数式组件和 Hooks。
- 样式使用普通 CSS 或 CSS Modules；MVP 阶段不强制引入 UI 组件库。
- 更细的格式化规则在初始化项目后交给 ESLint / Prettier 等工具约束，不在本文档中提前展开。

## 接口契约

### GET /api/hot

用途：前端首页请求三个平台的统一热点数据。

返回规则：

- 后端始终按平台独立处理数据源，单个平台失败不得导致其他平台失败。
- 只要后端服务本身可用，接口优先返回 HTTP 200，并在各平台对象中表达 `status`。
- 只有后端服务不可用、路由异常或响应无法生成时，才返回 HTTP 5xx。
- 前端不直接请求微博、知乎、B 站等上游平台 API。

```ts
type HotSource = 'weibo' | 'zhihu' | 'bilibili';

type HotStatus =
  | 'success' // 返回可用的新鲜数据；可能来自本次上游请求，也可能来自未过期缓存
  | 'stale'  // 本次刷新失败，但存在旧缓存，继续返回旧数据
  | 'error'  // 本次请求失败，且没有可用缓存
  | 'empty'; // 本次请求成功，但没有可展示条目

interface HotResponse {
  generatedAt: string; // ISO8601；后端生成本次响应的时间，不等同于各平台数据更新时间
  platforms: HotPlatform[]; // 三个平台的卡片数据；固定包含 weibo、zhihu、bilibili
}

interface HotPlatform {
  source: HotSource; // 平台标识；前端用于稳定排序、重试和样式映射
  sourceName: string; // 平台中文名；例如 微博、知乎、B 站
  listName: string; // 榜单名；例如 热搜、热搜词、热门
  status: HotStatus; // 该平台当前状态；前端据此渲染 success/stale/error/empty
  updatedAt: string | null; // ISO8601；最近一次成功获取该平台数据的时间；无成功记录时为 null
  items: HotItem[]; // 最多 10 条热点；error 状态下通常为空，stale 状态下返回旧缓存
  message?: string; // 可选的人类可读提示；用于 error/stale/empty 状态的低干扰说明
  errorCode?: string; // 可选的机器可读错误码；用于调试、日志和未来单平台重试
}

interface HotItem {
  rank: number; // 从 1 开始的展示排名；优先使用上游排名，否则按列表顺序生成
  title: string; // 展示标题；微博为热搜词，知乎为热搜词，B 站为视频标题
  url: string; // 跳转到原平台或原平台搜索结果的链接
  heat?: string; // 可选热度；微博为热度值，B 站可用播放量，知乎默认不提供
}
```

状态边界：

- `HotStatus` 只表达后端完成本次 `/api/hot` 处理后的平台结果。
- `loading` 不属于 `HotStatus`，因为当前接口是同步请求：前端发起请求时自行进入 loading，收到响应后再根据 `success`、`stale`、`error`、`empty` 渲染。
- 只有未来改成异步任务、轮询或后台刷新进度时，后端才需要增加 `pending` / `loading` 一类状态。

示例响应：

```json
{
  "generatedAt": "2026-06-09T10:00:00.000Z",
  "platforms": [
    {
      "source": "weibo",
      "sourceName": "微博",
      "listName": "热搜",
      "status": "success",
      "updatedAt": "2026-06-09T09:59:30.000Z",
      "items": [
        {
          "rank": 1,
          "title": "高考作文",
          "url": "https://s.weibo.com/weibo?q=%E9%AB%98%E8%80%83%E4%BD%9C%E6%96%87",
          "heat": "1451364"
        }
      ]
    },
    {
      "source": "zhihu",
      "sourceName": "知乎",
      "listName": "热搜词",
      "status": "empty",
      "updatedAt": "2026-06-09T09:55:00.000Z",
      "items": [],
      "message": "当前没有可展示的知乎热搜词"
    },
    {
      "source": "bilibili",
      "sourceName": "B 站",
      "listName": "热门",
      "status": "stale",
      "updatedAt": "2026-06-09T09:50:00.000Z",
      "items": [
        {
          "rank": 1,
          "title": "热门视频标题",
          "url": "https://www.bilibili.com/video/BVxxxx",
          "heat": "1379425"
        }
      ],
      "message": "B 站刷新失败，当前展示缓存数据",
      "errorCode": "UPSTREAM_FETCH_FAILED"
    }
  ]
}
```

## 数据模型

数据模型以 `/api/hot` 接口契约为准。后端 adapter 负责把各平台原始数据映射为统一的 `HotItem` 和 `HotPlatform`。

## Adapter 设计

每个平台实现一个独立 adapter。adapter 只负责请求上游、解析原始数据、返回统一 `HotItem[]`，不负责读取或写入缓存。

```ts
interface HotAdapter {
  source: HotSource; // 平台标识；必须与 HotPlatform.source 一致
  sourceName: string; // 平台中文名；用于接口响应和卡片标题
  listName: string; // 榜单名；用于接口响应和卡片副标题
  fetchItems(): Promise<HotItem[]>; // 拉取并解析该平台 Top 10，失败时抛出错误，由聚合层处理缓存和状态
}
```

### 微博 Adapter

数据入口：`https://weibo.com/ajax/side/hotSearch`

请求要求：

- 使用 `fetch`。
- 请求头包含合理 `User-Agent`。
- 请求头包含 `Referer: https://weibo.com/`，否则可能返回 Forbidden。

字段映射：

| HotItem 字段 | 原始字段 | 规则 |
|---|---|---|
| `rank` | `realpos` / 数组下标 | 优先使用 `realpos`；缺失时使用数组下标 + 1 |
| `title` | `word` / `note` | 优先使用 `word`；缺失时使用 `note` |
| `url` | 生成 | `https://s.weibo.com/weibo?q=<encoded title>` |
| `heat` | `num` | 转成字符串；缺失时不返回 |

解析规则：

- 读取 `data.realtime`。
- 过滤无标题条目。
- 最多返回前 10 条。

### 知乎 Adapter

数据入口：`https://www.zhihu.com/api/v4/search/top_search`

请求要求：

- 使用 `fetch`。
- 普通 `User-Agent` 初验可访问。

字段映射：

| HotItem 字段 | 原始字段 | 规则 |
|---|---|---|
| `rank` | 数组下标 | 使用 `top_search.words` 数组下标 + 1 |
| `title` | `display_query` / `query` | 优先使用 `display_query`；缺失时使用 `query` |
| `url` | 生成 | `https://www.zhihu.com/search?type=content&q=<encoded query>` |
| `heat` | 无 | 不返回 |

解析规则：

- 读取 `top_search.words`。
- 过滤无标题条目。
- 最多返回前 10 条。
- 当前 MVP 语义为“知乎热搜词”，不是“知乎问答内容热榜”。

### B 站 Adapter

数据入口：`https://api.bilibili.com/x/web-interface/popular?ps=10&pn=1`

请求要求：

- 使用 `fetch`。
- 普通 `User-Agent` 初验可访问。

字段映射：

| HotItem 字段 | 原始字段 | 规则 |
|---|---|---|
| `rank` | 数组下标 | 使用 `data.list` 数组下标 + 1 |
| `title` | `title` | 使用视频标题 |
| `url` | `bvid` / `short_link_v2` | 优先生成 `https://www.bilibili.com/video/<bvid>`；无 `bvid` 时使用 `short_link_v2` |
| `heat` | `stat.view` | 播放量转成字符串；缺失时不返回 |

解析规则：

- 读取 `data.list`。
- 过滤无标题或无链接依据的条目。
- 最多返回前 10 条。
- 当前 MVP 页面文案为“B 站热门”。
- `rank` 表示 B 站热门接口返回顺序，不表示播放量排名；`heat` 表示播放量，仅作为辅助信息展示。

## 缓存与失败策略

缓存由聚合层统一处理，每个平台独立缓存。单个平台缓存失效、请求失败或解析失败，不影响其他平台。

```ts
interface CacheEntry {
  updatedAt: string; // ISO8601；最近一次成功写入该平台缓存的时间
  items: HotItem[]; // 最近一次成功解析得到的热点列表
  expiresAt: number; // Unix 毫秒时间戳；超过后需要尝试刷新上游
}
```

MVP 缓存规则：

- 默认 TTL：300 秒。
- TTL 可在 300-600 秒之间调整；MVP 阶段三个平台使用同一个 TTL。
- 缓存只保存成功解析后的 `HotItem[]`。
- `empty` 不写入缓存，避免上游异常空响应覆盖旧数据。
- 进程重启后内存缓存清空；MVP 不使用 Redis 或数据库缓存。

状态转换：

| 场景 | 是否有可用旧缓存 | 返回状态 | items | updatedAt |
|---|---|---|---|---|
| 上游请求成功且解析出条目 | 不关心 | `success` | 新数据 | 本次成功时间 |
| 上游请求成功但没有条目 | 不关心 | `empty` | `[]` | 最近一次成功时间或 `null` |
| 上游请求失败或解析失败 | 有 | `stale` | 旧缓存 | 旧缓存时间 |
| 上游请求失败或解析失败 | 无 | `error` | `[]` | `null` |

错误码：

| errorCode | 含义 |
|---|---|
| `UPSTREAM_FETCH_FAILED` | 上游请求失败、超时或返回非预期 HTTP 状态 |
| `UPSTREAM_PARSE_FAILED` | 上游返回内容存在，但无法解析成目标结构 |
| `UPSTREAM_EMPTY` | 上游请求成功，但无可展示条目 |

聚合层规则：

- `/api/hot` 固定返回三个平台对象，顺序为微博、知乎、B 站。
- 每个平台独立执行 adapter 和缓存逻辑。
- 某个平台失败时，仅该平台进入 `stale` 或 `error`。
- 只有聚合层自身无法构造响应时，才返回 HTTP 5xx。

## 核心流程
1. 用户打开首页 → 前端请求 /api/hot
2. 后端按平台检查缓存 → 缓存有效则直接返回 `success`
3. 缓存缺失或过期 → 调用对应 adapter fetch 上游 JSON → 解析 → 写入缓存
4. adapter 失败 → 有旧缓存返回 `stale`，无旧缓存返回 `error`
5. adapter 成功但无条目 → 返回 `empty`
6. 前端按平台渲染 HotCard

## 开发环境代理
- Vite 将 /api 代理到 http://localhost:3001
- 生产：VITE_API_BASE 指向后端域名，或 Nginx 反代

## 数据方案备注
- 主路线：自建 Express 拉取各平台 JSON（0 元）
- 救急：免费第三方热搜 API（不稳定，仅短期）
- 不推荐：微博 OAuth、HTML 爬虫
