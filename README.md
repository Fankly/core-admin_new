# 项目过程管控平台

Vue 3 + Vite + Element Plus + Pinia 的企业管理后台骨架，pnpm workspace monorepo。

- 快速开始：`pnpm install` → `pnpm dev`（Node ≥ 24）
- 启动方式：`pnpm dev` 连接开发后端；`pnpm mock` 启用本地 mock 数据（未匹配的接口仍请求后端）。打包和预览不加载 mock。
- 联调账号仅在开发模式使用；生产构建不包含联调登录模块，登录页提示从企业统一入口访问。外部认证协议需另行对接。
- 架构说明：[docs/architecture.md](./docs/architecture.md)
- 开发规范：[docs/frontend-guide.md](./docs/frontend-guide.md)
- 产品事实：[apps/web/PRODUCT.md](./apps/web/PRODUCT.md)
- 设计系统：[apps/web/DESIGN.md](./apps/web/DESIGN.md)
- 项目约定：[CLAUDE.md](./CLAUDE.md)
- 重构验收：[docs/refactor-verification.md](./docs/refactor-verification.md)
- 质量修复：[docs/code-quality-fixes.md](./docs/code-quality-fixes.md)

质量门禁：

```bash
pnpm lint:check
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

开发预览：[http://localhost:8001](http://localhost:8001)。浏览器回归使用本机 Chrome，可自动启动或复用开发服务；测试 API 响应只用于交互验收。

`pnpm lint:check` 只检查，`pnpm lint` 会自动修复。类型检查包含 `mock/**/*.ts`，单元测试包含 mock XHR 的成功和失败响应。需要使用独立浏览器测试端口时，可运行 `E2E_PORT=8013 pnpm e2e`。
