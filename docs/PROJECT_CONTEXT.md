# 项目共享上下文

最后更新：2026-06-11

## 当前阶段

- `docs/PRD.md` v1.1 已冻结。
- 需求研究、技术设计和 AI 开发指令已完成当前阶段所需内容。
- 已初始化前端 Vite + React + TypeScript 基础项目和后端 Express 服务。
- 首页卡片网格、`HotCard` 组件和前端 loading、empty、error、stale 状态已跑通。
- 已搭建后端聚合 API `GET /api/hot` 和 `GET /api/hot/:source`，前端已切换为请求自建后端 `/api/hot`。
- Day 15 已完成：微博真实热搜、知乎真实热搜词和 B 站真实热门视频均已接入 adapter；三平台统一经过后端聚合接口和独立缓存层。
- Day 16 手动测试已完成：三平台展示、标题跳转、排名热度、更新时间、单平台失败、缓存期更新时间、移动端布局、页脚合规、软/硬刷新和后端挂掉不白屏均已验证通过。测试记录见 `docs/qa/day16-manual-test.md`。
- Day 17 已完成：单平台失败模拟方案、单平台重试、全页重新加载、刷新 loading 反馈和合规页脚已完成。测试与方案记录见 `docs/qa/day17-resilience-compliance.md`。
- Day 18 已完成：站点 favicon/metadata、卡片 hover/focus 体验、部署前检查表和主路径收尾记录已完成。记录见 `docs/qa/day18-polish-freeze.md`，部署前检查表见 `docs/deployment-checklist.md`。

## 已确认共识

- 项目用于公开展示，并作为 AI Agent 软件工程实践项目。
- 产品范围、MVP 和验收标准以 `docs/PRD.md` v1.1 为准。
- MVP 数据源语义已确认：微博热搜、知乎热搜词、B 站热门。
- 当前项目采用新闻热榜风格，同时保持专业、清晰、可扫描的信息看板体验。
- 开发按功能阶段推进；每日打卡内容不必严格对应原 21 天计划。
- 任务文档以推动项目进展为优先，避免为简单任务引入过重流程。
- `docs/pre-dev/` 是私人预开发资料，不作为正式项目执行依据。

## 文档权威性原则

- `docs/PRD.md` 是产品目标、MVP 范围、用户体验和验收标准的权威来源。
- `docs/TECH_DESIGN.md` 是技术栈、接口、数据模型、缓存实现和部署方案的权威来源。
- `docs/AI_WORKFLOW.md` 是 Agent 分工、任务流程和审查机制的权威来源。
- `docs/PROJECT_CONTEXT.md` 只记录当前阶段摘要、已确认高层共识和文档导航。
- 如果文档内容冲突，按领域读取对应权威文档；如果仍无法判断，Agent 应暂停并询问 Owner。

## 当前下一步

1. 进入 Day 19-21：部署缓冲阶段，先按 `docs/deployment-checklist.md` 完成部署前检查。
2. 继续保持前端不直连微博、知乎、B 站等上游平台 API。
3. 涉及接口、缓存、数据源或页面状态的修改，需要回归 `docs/qa/day16-manual-test.md`、`docs/qa/day17-resilience-compliance.md` 和 `docs/qa/day18-polish-freeze.md` 中的关键场景。

## 正式文档导航

- 产品范围和验收标准：`docs/PRD.md`
- 架构、接口和共享数据模型：`docs/TECH_DESIGN.md`
- 多 Agent 协作流程：`docs/AI_WORKFLOW.md`
- 部署前检查：`docs/deployment-checklist.md`
- 长期决策索引：`docs/decisions/INDEX.md`
- 任务专属上下文：`tasks/<id>/task.md`
