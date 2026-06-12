# 今日热搜 / Public Hotlist Monitor

[中文](#中文) | [English](#english)

---

## 中文

一个公开、无需登录的多平台热点聚合页。当前已接入微博真实热搜、知乎真实热搜词和 B 站真实热门视频；前端通过自建后端 `/api/hot` 获取三张热榜卡片数据。

线上地址：

- 前端：https://hotpage-ochre.vercel.app/
- 后端健康检查：https://hotpage-production.up.railway.app/api/health

### 本地启动

部署前请先查看 [部署前检查表](docs/deployment-checklist.md)，确认构建、端口、环境变量和 API 地址。

#### 1. 安装依赖

分别安装前端和后端依赖：

```bash
cd client
npm install
```

```bash
cd server
npm install
```

#### 2. 启动后端

```bash
cd server
npm run dev
```

默认地址：

- `http://127.0.0.1:3001/api/health`
- `http://127.0.0.1:3001/api/hot`
- `http://127.0.0.1:3001/api/hot/weibo`
- `http://127.0.0.1:3001/api/hot/zhihu`
- `http://127.0.0.1:3001/api/hot/bilibili`

默认缓存 TTL 是 300 秒。可用 `CACHE_TTL` 临时调整，MVP 阶段会限制在 300 到 600 秒之间：

```bash
cd server
CACHE_TTL=600 npm run dev
```

#### 3. 启动前端

另开一个终端：

```bash
cd client
npm run dev
```

默认地址是 `http://localhost:5173/`。如果 5173 被占用，Vite 会自动尝试下一个端口，请以终端输出为准。

### API 说明

前端开发环境通过 Vite 代理访问后端：

```ts
// client/vite.config.ts
proxy: {
  '/api': 'http://127.0.0.1:3001',
}
```

生产环境可以用两种方式处理：

- 同域部署：由 Nginx、平台路由或网关把 `/api` 反代到后端。
- 分域部署：设置 `VITE_API_BASE` 指向后端域名，例如 `https://api.example.com`。

前端代码只请求自建后端，不直接请求微博、知乎、B 站等上游平台 API。

### Deploy

部署前先完成 [部署前检查表](docs/deployment-checklist.md)。

#### 前端部署

推荐把 `client` 作为前端项目根目录部署到 Vercel 或其他静态站点平台：

- Root Directory：`client`
- Build Command：`npm run build`
- Output Directory：`dist`
- Framework Preset：Vite

如果前端和后端同域部署，可以不设置 `VITE_API_BASE`，让前端继续请求相对路径 `/api/hot`。

如果前端和后端分域部署，需要在前端平台设置：

```bash
VITE_API_BASE=https://your-api.example.com
```

`VITE_API_BASE` 应填写自建后端地址，不应填写微博、知乎、B 站等上游平台地址。

#### 后端部署

推荐把 `server` 作为后端项目根目录部署到 Railway、Render 或其他 Node.js 平台：

- Start Command：`npm start`
- Health Check：`/api/health`

常用环境变量：

| 变量 | 说明 |
|---|---|
| `PORT` | 后端监听端口，通常由部署平台自动注入 |
| `HOST` | 后端监听地址，默认 `0.0.0.0`；多数平台可不设置 |
| `CACHE_TTL` | 缓存秒数，默认 `300`，MVP 阶段限制在 `300-600` |
| `CLIENT_ORIGIN` | 生产前端域名，用于 CORS 放行 |
| `WEIBO_HOT_URL` | 微博上游地址，通常不需要覆盖 |
| `ZHIHU_TOP_SEARCH_URL` | 知乎上游地址，通常不需要覆盖 |
| `BILIBILI_POPULAR_URL` | B 站上游地址，通常不需要覆盖 |

前后端分域部署时，后端需要设置：

```bash
CLIENT_ORIGIN=https://your-hotpage.vercel.app
```

这样浏览器从前端域名请求后端 API 时，后端会通过 CORS 放行该来源。

#### 部署后验证

- 打开后端 `/api/health`，确认返回 `{ "ok": true }`。
- 打开前端页面，确认三张平台卡片能加载。
- 点击“重新加载”，确认按钮出现 `更新中` 状态。
- 检查浏览器 Network，确认前端请求的是自建后端 `/api/hot` 或 `VITE_API_BASE`，不是上游平台 API。

### 数据来源说明

当前 MVP 由后端 adapter 请求各平台 JSON 接口，再统一映射为 `/api/hot` 响应结构：

| 平台 | 页面文案 | 数据入口 | 数据语义 |
|---|---|---|---|
| 微博 | 微博热搜 | `https://weibo.com/ajax/side/hotSearch` | 微博实时热搜 |
| 知乎 | 知乎热搜词 | `https://www.zhihu.com/api/v4/search/top_search` | 知乎搜索热词，不是问答内容热榜 |
| B 站 | B 站热门 | `https://api.bilibili.com/x/web-interface/popular?ps=10&pn=1` | B 站热门视频 |

默认更新频率由后端内存缓存控制，TTL 为 300 秒；可通过 `CACHE_TTL` 调整到 300 到 600 秒之间。缓存期内重复访问会复用同一份平台数据，开发调试可用 `refresh=1` 强制刷新单个平台或全部平台。

B 站卡片中的 `rank` 表示热门接口返回顺序，不表示播放量排名；播放量通过 `▶` 标识展示。因为页面使用后端缓存，短时间内也可能与 B 站官网当前页面存在几分钟差异。

本项目是个人全栈学习项目，数据来源依赖第三方公开接口的当前可访问性。第三方接口、字段或访问策略变化时，页面可能出现单平台 `stale`、`error` 或空数据状态。

#### 缓存行为

`/api/hot` 和 `/api/hot/:source` 都会按平台独立使用内存缓存。缓存期内重复请求会返回同一份平台数据，所以卡片里的“更新于”时间不变化是正常现象。

开发调试时可以加 `refresh=1` 强制跳过缓存：

```bash
curl "http://127.0.0.1:3001/api/hot/weibo?refresh=1"
```

注意：内存缓存会在后端进程重启后清空。

#### 测试环境替换上游

后端默认请求真实平台地址。测试环境可以通过环境变量把某个平台的上游入口替换为 mock server，不需要在产品接口里暴露故障模拟参数：

```bash
cd server
WEIBO_HOT_URL=http://127.0.0.1:4010/weibo npm run dev
```

可配置项：

| 变量 | 默认地址 |
|---|---|
| `WEIBO_HOT_URL` | `https://weibo.com/ajax/side/hotSearch` |
| `ZHIHU_TOP_SEARCH_URL` | `https://www.zhihu.com/api/v4/search/top_search` |
| `BILIBILI_POPULAR_URL` | `https://api.bilibili.com/x/web-interface/popular?ps=10&pn=1` |

这种方式适合配合 Playwright 或后端集成测试：测试代码启动 mock upstream 返回 500、超时、空数据或字段缺失，产品代码仍按正常流程执行 fetch、缓存降级和错误展示。

### 常见问题

#### 端口被占用

如果前端提示 `Port 5173 is in use`，使用 Vite 输出的新地址即可。

如果后端 `3001` 被占用，可以临时指定端口：

```bash
cd server
PORT=3002 npm run dev
```

同时需要把 `client/vite.config.ts` 里的代理目标改成同一个端口。

#### 代理不生效

先确认后端已经启动，再确认前端请求的是 `/api/hot`，而不是完整的上游平台地址。

可直接检查：

```bash
curl http://127.0.0.1:3001/api/hot
```

如果这个命令可用，但页面失败，通常是前端 dev server 没有重启，或代理端口和后端端口不一致。

#### CORS 问题

开发阶段推荐让前端请求相对路径 `/api/hot`，由 Vite 代理到后端，这样浏览器看到的是同源请求。

只有当前端通过 `VITE_API_BASE` 直接请求后端域名时，才需要后端 CORS 放行对应前端域名。

[Back to top](#今日热搜--public-hotlist-monitor)

---

## English

Public Hotlist Monitor is a public, no-login multi-platform hotlist aggregator. It currently connects to real Weibo hot searches, Zhihu top search terms, and Bilibili popular videos. The frontend reads all card data from the self-owned backend endpoint `/api/hot`.

Live URLs:

- Frontend: https://hotpage-ochre.vercel.app/
- Backend health check: https://hotpage-production.up.railway.app/api/health

### Local Setup

Before deployment, check [Deployment Checklist](docs/deployment-checklist.md) for build, port, environment variable, and API settings.

#### 1. Install Dependencies

Install frontend and backend dependencies separately:

```bash
cd client
npm install
```

```bash
cd server
npm install
```

#### 2. Start the Backend

```bash
cd server
npm run dev
```

Default endpoints:

- `http://127.0.0.1:3001/api/health`
- `http://127.0.0.1:3001/api/hot`
- `http://127.0.0.1:3001/api/hot/weibo`
- `http://127.0.0.1:3001/api/hot/zhihu`
- `http://127.0.0.1:3001/api/hot/bilibili`

The default cache TTL is 300 seconds. You can temporarily adjust it with `CACHE_TTL`; in the MVP stage it is clamped to 300-600 seconds:

```bash
cd server
CACHE_TTL=600 npm run dev
```

#### 3. Start the Frontend

Open another terminal:

```bash
cd client
npm run dev
```

The default URL is `http://localhost:5173/`. If port 5173 is occupied, Vite will try the next available port. Use the URL printed by the terminal.

### API Notes

In local development, the frontend accesses the backend through the Vite proxy:

```ts
// client/vite.config.ts
proxy: {
  '/api': 'http://127.0.0.1:3001',
}
```

Production can be handled in two ways:

- Same-domain deployment: use Nginx, platform routing, or a gateway to reverse proxy `/api` to the backend.
- Split-domain deployment: set `VITE_API_BASE` to the backend domain, for example `https://api.example.com`.

Frontend code only requests the self-owned backend. It must not directly request upstream APIs from Weibo, Zhihu, or Bilibili.

### Deploy

Complete the [Deployment Checklist](docs/deployment-checklist.md) before deploying.

#### Frontend Deployment

Deploy `client` as the frontend project root on Vercel or another static hosting platform:

- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework Preset: Vite

If frontend and backend are deployed under the same domain, `VITE_API_BASE` can be omitted and the frontend can continue requesting the relative path `/api/hot`.

If frontend and backend are deployed under separate domains, set this variable on the frontend platform:

```bash
VITE_API_BASE=https://your-api.example.com
```

`VITE_API_BASE` must point to the self-owned backend, not to upstream platform APIs.

#### Backend Deployment

Deploy `server` as the backend project root on Railway, Render, or another Node.js platform:

- Start Command: `npm start`
- Health Check: `/api/health`

Common environment variables:

| Variable | Description |
|---|---|
| `PORT` | Backend listening port, usually injected by the deployment platform |
| `HOST` | Backend host, defaults to `0.0.0.0`; usually does not need to be set |
| `CACHE_TTL` | Cache TTL in seconds, defaults to `300`, clamped to `300-600` in the MVP stage |
| `CLIENT_ORIGIN` | Production frontend origin allowed by CORS |
| `WEIBO_HOT_URL` | Weibo upstream URL, usually does not need to be overridden |
| `ZHIHU_TOP_SEARCH_URL` | Zhihu upstream URL, usually does not need to be overridden |
| `BILIBILI_POPULAR_URL` | Bilibili upstream URL, usually does not need to be overridden |

For split-domain deployment, set this variable on the backend:

```bash
CLIENT_ORIGIN=https://your-hotpage.vercel.app
```

This allows browser requests from the production frontend origin to pass backend CORS checks.

#### Post-deployment Verification

- Open backend `/api/health` and confirm it returns `{ "ok": true }`.
- Open the frontend page and confirm all three platform cards load.
- Click the refresh button and confirm it enters the `更新中` state.
- Check the browser Network tab and confirm the frontend requests the self-owned backend `/api/hot` or `VITE_API_BASE`, not upstream platform APIs.

### Data Sources

The MVP backend adapters request each platform's JSON entrypoint and normalize results into the `/api/hot` response shape:

| Platform | UI Label | Data Entry | Meaning |
|---|---|---|---|
| Weibo | Weibo Hot Search | `https://weibo.com/ajax/side/hotSearch` | Weibo real-time hot searches |
| Zhihu | Zhihu Search Trends | `https://www.zhihu.com/api/v4/search/top_search` | Zhihu top search terms, not a question hotlist |
| Bilibili | Bilibili Popular | `https://api.bilibili.com/x/web-interface/popular?ps=10&pn=1` | Bilibili popular videos |

The default update frequency is controlled by the backend in-memory cache with a TTL of 300 seconds. `CACHE_TTL` can be adjusted to 300-600 seconds. During the cache window, repeated requests reuse the same platform data. For development debugging, `refresh=1` can force-refresh all platforms or a single platform.

For the Bilibili card, `rank` means the order returned by the popular API. It does not mean ranking by view count. View count is displayed with the `▶` marker. Because the page uses backend caching, it may differ from the current Bilibili website by a few minutes.

This is a personal full-stack learning project. Data availability depends on the current accessibility of third-party public endpoints. If upstream APIs, fields, or access policies change, the page may show per-platform `stale`, `error`, or empty states.

#### Cache Behavior

`/api/hot` and `/api/hot/:source` use independent in-memory cache entries per platform. During the TTL window, repeated requests return the same platform data, so the card's "updated" time staying unchanged is expected.

For development debugging, add `refresh=1` to bypass cache:

```bash
curl "http://127.0.0.1:3001/api/hot/weibo?refresh=1"
```

Note: in-memory cache is cleared when the backend process restarts.

#### Replacing Upstream URLs in Test Environments

By default, the backend requests real platform URLs. In test environments, you can override one platform's upstream URL with a mock server through environment variables. This avoids exposing failure simulation in the product API:

```bash
cd server
WEIBO_HOT_URL=http://127.0.0.1:4010/weibo npm run dev
```

Configurable upstream URLs:

| Variable | Default URL |
|---|---|
| `WEIBO_HOT_URL` | `https://weibo.com/ajax/side/hotSearch` |
| `ZHIHU_TOP_SEARCH_URL` | `https://www.zhihu.com/api/v4/search/top_search` |
| `BILIBILI_POPULAR_URL` | `https://api.bilibili.com/x/web-interface/popular?ps=10&pn=1` |

This works well with Playwright or backend integration tests: test code can start a mock upstream that returns 500, timeout, empty data, or missing fields, while product code still runs the normal fetch, cache fallback, and error-display flow.

### FAQ

#### Port Already in Use

If the frontend reports `Port 5173 is in use`, use the new URL printed by Vite.

If backend port `3001` is occupied, temporarily set another port:

```bash
cd server
PORT=3002 npm run dev
```

Then update the proxy target in `client/vite.config.ts` to the same port.

#### Proxy Not Working

First confirm the backend is running, then confirm the frontend requests `/api/hot` instead of a full upstream platform URL.

You can check directly:

```bash
curl http://127.0.0.1:3001/api/hot
```

If this command works but the page fails, the frontend dev server may need to be restarted, or the proxy port may not match the backend port.

#### CORS Issues

In development, prefer requesting the relative path `/api/hot` from the frontend and let Vite proxy it to the backend. The browser then sees a same-origin request.

CORS is only needed when the frontend directly requests a backend domain through `VITE_API_BASE`.

[Back to top](#今日热搜--public-hotlist-monitor)
