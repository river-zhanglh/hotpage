# AI Agent 协作流程

本文档定义项目共享的多 Agent 协作流程。只使用与当前任务相关的部分；轻量任务应保持轻量。

## 上下文快速路径

- 简单局部任务只需要根目录 `AGENTS.md`、当前指令和相关代码。
- 新会话开始设计、编码或审查等实质任务时，读取 `docs/PROJECT_CONTEXT.md`。
- 中高风险或模式 B 任务以 `tasks/<id>/task.md` 作为精确上下文入口，并只读取其中列出的必读上下文。
- 修改已有长期决策时，查阅 `docs/decisions/INDEX.md`，仅按需读取相关 ADR。

## 决策权

- 人类 Owner 对任务范围、合并和发布拥有最终决定权。
- Agent 负责提供实现、审查和验证证据；未经批准不得扩大任务范围。

## 角色

| 角色 | 职责 |
| --- | --- |
| Product | 明确目标、非目标和验收标准。 |
| Architect | 审查跨模块设计和接口变更。 |
| Developer | 实现任务范围内的功能并总结变更。 |
| Frontend / Backend | 在相关任务中使用的 Developer 专项角色。 |
| Reviewer | 基于任务和 diff 查找缺陷、回归风险和遗漏测试。 |
| QA | 验证验收标准和重要失败路径。 |
| Security / Deploy / Docs | 仅在任务影响对应领域时参与。 |
| Router / Summarizer | 按需选择参与角色并压缩审查上下文。 |

## 基于风险的分流

| 风险 | 典型变更 | 最小流程 |
| --- | --- | --- |
| 低 | 文案、样式、独立 UI | Developer + 轻量审查 |
| 中 | API、状态、缓存、多个模块 | Developer + Reviewer + QA |
| 高 | 数据源、依赖、安全、部署、架构 | Architect + Developer + Reviewer + QA；按需加入专项角色 |

仅在独立模型的不同视角足以抵消额外成本时使用多模型审查。Reviewer 通常应接收精简的 Review Packet，而不是完整仓库历史。

## 模式 A：单分支协作

前两个流程试点任务和其他小型变更使用模式 A。

```text
定义任务
  -> 按风险分流
  -> 实现
  -> 总结相关 diff 和验证结果
  -> 按需审查和 QA
  -> Owner 决策
```

各角色可以在不同 prompt 或会话中执行，但共享同一个分支。

## 模式 B：隔离式多 Agent 协作

模式 A 稳定后，当任务能够从隔离或并行工作中获益时使用模式 B。

- Developer 在功能分支和 worktree 中工作。
- Reviewer 独立评估任务、Review Packet 和 diff。
- 有需要时，QA 在独立 worktree 中验证功能分支。
- Product、Architect、Security、Deploy、Docs、Router 和 Summarizer 通常基于任务产物工作，不需要独立 worktree。
- 人类 Owner 负责解决冲突意见并决定是否合并。

## 任务产物

将任务专属上下文保存在 `tasks/<id>/` 中。只创建对当前任务有价值的产物。

创建以下任务产物时，只读取 `docs/templates/` 中同名模板：

- `task.md`：目标、非目标、验收标准、风险和影响范围。
- `implementation.md`：修改内容、修改原因和已知限制。
- `review_packet.md`：精简的任务摘要、相关 diff、验证结果和风险。
- `review.md`：阻塞问题、非阻塞建议和审查结论。
- `qa.md`：已执行的验证、结果和未测试范围。
- `decision.md`：Owner 的最终决策和后续工作。

创建 `docs/decisions/ADR-<id>-<slug>.md` 时，只读取 `docs/templates/adr.md`。

低风险任务无需创建完整任务目录，可以将必要信息合并为更短的记录。中高风险或模式 B 任务应保留足够证据供独立审查。

## 长期决策持久化

Agent 应主动识别可能需要持久化的候选长期决策，包括：

- 改变产品范围、验收标准或非目标；
- 改变公共接口、共享数据模型或跨模块约定；
- 改变安全、部署、兼容性或合规要求；
- 替代正式文档中的已有结论。

处理流程：

```text
Agent 识别候选长期决策
  -> 记录到 tasks/<id>/decision.md
  -> 阻塞决策立即请求 Owner 确认
  -> 非阻塞决策在任务结束时集中请求确认
  -> Owner 确认后更新当前有效规则文档
  -> 创建或更新 ADR，并更新 docs/decisions/INDEX.md
  -> 仅在影响当前阶段或跨模块共识时更新 docs/PROJECT_CONTEXT.md
```

`tasks/<id>/decision.md` 记录当前任务的决策和待确认结论。ADR 只记录已确认长期决策的背景、权衡和历史，不作为普通任务的默认执行规则。

当前任务内部实现细节、临时方案、排错过程和可直接从代码发现的事实不晋升为长期决策。

## 审查约定

审查输入应聚焦：

- 任务目标、非目标和验收标准；
- 相关 diff 和实现摘要；
- 已执行的验证和已知风险。

审查输出必须区分：

- 阻塞缺陷；
- 非阻塞建议；
- 遗漏验证；
- 结论：通过、需要修改或拒绝。
