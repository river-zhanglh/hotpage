# 项目共享上下文

最后更新：2026-06-10

## 当前阶段

- `docs/PRD.md` v1.1 已冻结。
- 需求研究、技术设计和 AI 开发指令已完成当前阶段所需内容。
- 已初始化前端 Vite + React + TypeScript 基础项目和后端 Express 空壳。
- 首页卡片网格、`HotCard` 组件和前端 loading、empty、error、stale 状态已用 Mock 数据跑通。

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

1. 搭建后端 Mock API `GET /api/hot`。
2. 将前端数据来源从本地 Mock 切换为自建后端 `/api/hot`。
3. 保持前端不直连微博、知乎、B 站等上游平台 API。

## 正式文档导航

- 产品范围和验收标准：`docs/PRD.md`
- 架构、接口和共享数据模型：`docs/TECH_DESIGN.md`
- 多 Agent 协作流程：`docs/AI_WORKFLOW.md`
- 长期决策索引：`docs/decisions/INDEX.md`
- 任务专属上下文：`tasks/<id>/task.md`
