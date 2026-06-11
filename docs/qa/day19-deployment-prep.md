# Day 19 部署准备记录

日期：2026-06-11

## 完成内容

- README 已新增 `Deploy` 章节。
- 部署前检查表已补充 `CLIENT_ORIGIN`。
- 后端已支持 `CLIENT_ORIGIN` 环境变量，用于生产前端域名 CORS 放行。
- 前端构建已通过。
- 后端生产启动命令 `npm start` 已验证。

## 验证结果

- 在 `client` 目录执行 `npm run build`，构建通过。
- 在 `server` 目录执行 `npm start`，后端启动成功。
- 访问 `http://127.0.0.1:3001/api/health`，返回 `{ "ok": true }`。
- 带本地前端 Origin 请求 `/api/health`，响应头包含 `Access-Control-Allow-Origin: http://localhost:5173`。

## 部署说明

- 前端部署时，`client` 作为项目根目录。
- 后端部署时，`server` 作为项目根目录，启动命令为 `npm start`。
- 分域部署时，前端设置 `VITE_API_BASE` 指向后端公开地址。
- 分域部署时，后端设置 `CLIENT_ORIGIN` 为前端公开地址。

## 未测试范围

- Vercel 实际部署。
- Railway 或 Render 实际部署。
- 真实 HTTPS 域名下的 CORS。
