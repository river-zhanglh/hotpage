# Day 20 线上部署验收记录

日期：2026-06-12

## 线上地址

- 前端：https://hotpage-ochre.vercel.app/
- 后端健康检查：https://hotpage-production.up.railway.app/api/health

## 自动冒烟检查

- 后端 `/api/health` 返回 `{ "ok": true }`。
- 前端 Vercel 页面可访问，HTML、title、favicon 和构建产物正常返回。
- 使用 `Origin: https://hotpage-ochre.vercel.app` 请求后端 `/api/hot`，后端返回 `Access-Control-Allow-Origin: https://hotpage-ochre.vercel.app`。
- 后端 `/api/hot` 返回微博、知乎、B 站三平台真实数据，三个平台状态均为 `success`。

## 人工验收

- 首页三张卡片均正常显示。
- 点击标题可以跳转到原平台页面。
- 点击“重新加载”按钮表现正常。

## 当前结论

Day 20 线上部署主链路已完成：Vercel 前端、Railway 后端、CORS、聚合接口和核心页面交互均已通过验收。

## 未测试范围

- 长时间线上运行后的上游稳定性。
- 多浏览器兼容性。
- 大流量或并发压力。
