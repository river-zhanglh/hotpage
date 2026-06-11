# 今日热搜

一个公开、无需登录的多平台热点聚合页。当前开发阶段已接入微博真实热搜、知乎真实热搜词和 B 站真实热门视频；前端通过自建后端 `/api/hot` 获取三张热榜卡片数据。

## 本地启动

部署前请先查看 [部署前检查表](docs/deployment-checklist.md)，确认构建、端口、环境变量和 API 地址。

### 1. 安装依赖

分别安装前端和后端依赖：

```bash
cd client
npm install
```

```bash
cd server
npm install
```

### 2. 启动后端

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

### 3. 启动前端

另开一个终端：

```bash
cd client
npm run dev
```

默认地址是 `http://localhost:5173/`。如果 5173 被占用，Vite 会自动尝试下一个端口，请以终端输出为准。

## API 说明

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

## 数据来源说明

当前 MVP 由后端 adapter 请求各平台 JSON 接口，再统一映射为 `/api/hot` 响应结构：

| 平台 | 页面文案 | 数据入口 | 数据语义 |
|---|---|---|---|
| 微博 | 微博热搜 | `https://weibo.com/ajax/side/hotSearch` | 微博实时热搜 |
| 知乎 | 知乎热搜词 | `https://www.zhihu.com/api/v4/search/top_search` | 知乎搜索热词，不是问答内容热榜 |
| B 站 | B 站热门 | `https://api.bilibili.com/x/web-interface/popular?ps=10&pn=1` | B 站热门视频 |

默认更新频率由后端内存缓存控制，TTL 为 300 秒；可通过 `CACHE_TTL` 调整到 300 到 600 秒之间。缓存期内重复访问会复用同一份平台数据，开发调试可用 `refresh=1` 强制刷新单个平台或全部平台。

B 站卡片中的 `rank` 表示热门接口返回顺序，不表示播放量排名；播放量通过 `▶` 标识展示。因为页面使用后端缓存，短时间内也可能与 B 站官网当前页面存在几分钟差异。

本项目是个人全栈学习项目，数据来源依赖第三方公开接口的当前可访问性。第三方接口、字段或访问策略变化时，页面可能出现单平台 `stale`、`error` 或空数据状态。

### 缓存行为

`/api/hot` 和 `/api/hot/:source` 都会按平台独立使用内存缓存。缓存期内重复请求会返回同一份平台数据，所以卡片里的“更新于”时间不变化是正常现象。

开发调试时可以加 `refresh=1` 强制跳过缓存：

```bash
curl "http://127.0.0.1:3001/api/hot/weibo?refresh=1"
```

注意：内存缓存会在后端进程重启后清空。

### 测试环境替换上游

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

## 常见问题

### 端口被占用

如果前端提示 `Port 5173 is in use`，使用 Vite 输出的新地址即可。

如果后端 `3001` 被占用，可以临时指定端口：

```bash
cd server
PORT=3002 npm run dev
```

同时需要把 `client/vite.config.ts` 里的代理目标改成同一个端口。

### 代理不生效

先确认后端已经启动，再确认前端请求的是 `/api/hot`，而不是完整的上游平台地址。

可直接检查：

```bash
curl http://127.0.0.1:3001/api/hot
```

如果这个命令可用，但页面失败，通常是前端 dev server 没有重启，或代理端口和后端端口不一致。

### CORS 问题

开发阶段推荐让前端请求相对路径 `/api/hot`，由 Vite 代理到后端，这样浏览器看到的是同源请求。

只有当前端通过 `VITE_API_BASE` 直接请求后端域名时，才需要后端 CORS 放行对应前端域名。
