# 项目过程管控平台

Vue 3 + Vite + Element Plus + Pinia 的企业管理后台骨架，pnpm workspace monorepo。

- 快速开始：`pnpm install` → `pnpm dev`（Node ≥ 24）
- 架构说明：[docs/architecture.md](./docs/architecture.md)
- 开发规范：[docs/frontend-guide.md](./docs/frontend-guide.md)
- 产品事实：[apps/web/PRODUCT.md](./apps/web/PRODUCT.md)
- 设计系统：[apps/web/DESIGN.md](./apps/web/DESIGN.md)
- 项目约定：[CLAUDE.md](./CLAUDE.md)
- 重构验收：[docs/refactor-verification.md](./docs/refactor-verification.md)

质量门禁：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

开发预览：[http://localhost:8001](http://localhost:8001)。浏览器回归使用本机 Chrome，可自动启动或复用开发服务；测试 API 响应只用于交互验收。
