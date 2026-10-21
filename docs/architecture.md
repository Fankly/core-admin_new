# 前端架构说明（重构后）

> 本文记录 2026-10 这一轮骨架仓库重构的目标、边界与落地方式。业务页迁移时先读这里，再读
> [`frontend-guide.md`](./frontend-guide.md)。两者冲突时以本文的目录/分层约定为准，编码风格仍以工具链为准。

## 1. 重构目标

原仓库能跑，但架构上有四个结构性问题：

1. **单例大 store**：`useAppStore` 同时保存用户、权限、路由、标签页、主题、业务穿透参数，任何页面都能改全局状态。
2. **全局事件总线**：tab、主题、loading、导航选中项通过 `mitt` 字符串事件在组件间广播，数据流不可追踪，且事件没有可靠的解绑路径。
3. **路由守卫单函数**：菜单同步、登录判断、动态注册、workflow 特例、pop 窗口、标签页推送全部堆在一个 200 行的 `beforeEach` 里。
4. **请求层缺少边界**：所有方法的并发请求都会被合并（包括两次独立 POST），错误形态在 axios 错误 / 字符串 / 业务 code 之间摇摆，响应头直接挂到业务 data 上。

重构目标是**先建立可长期扩展的骨架，再保留既有行为**：不改变服务端菜单协议、登录接口、签名头和表格 API，只替换内部组织方式。

## 2. 分层与依赖方向

```
views / layout / components
        │  只消费
        ▼
hooks / store(modules)          ← 领域状态与交互逻辑
        │
        ▼
service/http + service/baseService + api/*
        │
        ▼
utils（纯函数）/ constants / types
```

约束：

- `utils/` 不反向依赖 store 或组件。
- `api/` 只负责路径与返回类型，不写 UI 状态。
- 组件不直接 import axios；跨层通知走 store action，不再引入事件总线。
- 路由相关的纯函数（视图映射、外壳选择）放在 `router/` 下，可单测。

## 3. 目录变化

| 新增 | 作用 |
| --- | --- |
| `src/app/bootstrap.ts` | 应用组装顺序：pinia → 指令 → UI 插件 → router → mount |
| `src/app/plugins.ts` | Element Plus / VXE / ECharts 注册集中处 |
| `src/directives/` | 原 `utils/plugin.ts` 按指令拆分，事件监听与 observer 在 `unmounted` 成对释放 |
| `src/service/http/` | axios 客户端、`ApiError`、请求身份计算、请求类型 |
| `src/router/guards/` | 路由守卫管线 |
| `src/router/view-registry.ts` | `import.meta.glob` 与 `path → view` 的唯一实现 |
| `src/router/dynamic.ts` | 穿透页/详情页的实时注册 |
| `src/router/layout.ts` | page / fullscreen / standalone 外壳解析（有单测） |
| `src/store/modules/` | 六个领域 store |
| `src/types/domain.ts` | `UserProfile` / `MenuMeta` / `TabItem` |
| `src/types/router.d.ts` | 路由 `RouteMeta` 增强 |
| `src/types/vue.d.ts` | 全局属性 `$message` / `$baseService` / `$utils` 声明 |

删除/降级的旧入口：

- `src/utils/plugin.ts`：拆到 `src/directives/`，`main.ts` 不再调用。
- `src/utils/emits.ts` 与 `EMitt`：全局事件总线移除。
- `src/utils/http.ts`：变为 `@/service/http/client` 的兼容 re-export（既有 import 不需要立刻改）。
- `useAppStore`：删除，按领域改用 `useSessionStore` / `useMenuStore` / `useTabsStore` / `useShellStore` / `usePreferencesStore` / `useContextStore`。

## 4. 状态设计

| Store | 负责 | 不负责 |
| --- | --- | --- |
| `session` | 用户、按钮权限、登录态、退出清理 | 路由、标签页 |
| `menu` | 服务端菜单、动态路由、`path → meta`、当前菜单信息、`init()` | 用户资料写入（委托 session） |
| `tabs` | 标签页列表、激活项、关闭记录、keep-alive 缓存集合 | 路由跳转（返回目标路径，由组件执行） |
| `shell` | 首屏生命周期、全局 loading、刷新信号、移动端抽屉、混合导航选中项 | 业务数据 |
| `preferences` | 主题、导航布局、标签页开关、主题色应用 | 菜单结构 |
| `context` | 遗留业务穿透参数（`xxGlobalInfo` 等） | 框架状态 |

设计原则：

- **状态机优先**：`tabs` 的 open/close/closeOthers/closeAll 都是纯 action，组件只渲染与导航；可直接单测（`tabs.test.ts`）。
- **单次订阅**：`v-permission` 只订阅一次 `session.permissions`，元素用 `Set` 登记，卸载时移除。
- **惰性取 store**：工具函数在函数体内 `useXxxStore()`，不在模块顶层调用，避免 pinia 安装前求值。
- **持久化只发生在 preferences**：其余 store 是内存状态，退出登录由调用方按需 reset。

## 5. 路由与外壳

启动链路：

1. `bootstrapApp()` 安装 pinia。
2. `router.beforeEach`：同步菜单信息 → 拦截新窗口链接 → 登录/初始化 → 放行。
3. 首次初始化：`useMenuStore().init()` 并行拉 `/sys/menu/nav` 与 `/sys/getUserInfo`，合并 `base.ts` 后 `registerToRouter`。
4. `afterEach`：关闭 NProgress、清 route loading、把 `fullPath → TabItem` 写入 tabs store。
5. `App.vue` 只根据 `resolveLayoutMode(route)` 选择 layout / fullscreen / 启动遮罩。

兼容点：

- workflow 表单页仍按 `path.includes('workflow') && path !== '/workflow/todoTasks'` 识别为 standalone（`router/layout.ts`），避免首次进入时被初始化遮罩挡住。
- pop 窗口、`meta.layout = 'fullscreen'`、`app.fullscreenPages` 三种全屏来源都保留。
- 动态视图匹配规则不变：`_` → `-`，glob 仍用 `/src/views/**/*.vue`。

## 6. 请求层

`service/http/client.ts` 的职责：

- 请求前：注入 `X-Requested-With`、`Request-Start`、`Accept-Language`、GET `_t`，并在调用瞬间固定 token。
- 并发合并：**仅 GET/HEAD/OPTIONS**，按 method + url + baseURL + service + params + data + headers + responseType 计算完整身份；写请求永不合并。
- 响应：业务 `code === 401` 或 HTTP 401 时清 token/permissions 并跳登录；响应头以不可枚举属性挂到 data，避免污染 JSON。
- 错误：统一 `ApiError`（`status` / `code` / `url` / `cause`），不再向业务抛裸字符串。

`service/baseService.ts` 保留签名头与 3600000ms 超时；新增 `raw<T>()` 给“直接返回数组/标量”的历史接口（如 `/getRoleByBusicode`）。历史 api 未写泛型时仍得到 `any`，新接口应显式声明。

## 7. 样式与外壳微调

- 登录页从“自动登录 + 错误文字”改为三态（loading / forbidden / error），凭据可由环境变量覆盖。
- 首屏遮罩改成品牌化骨架，不再用内联 `position: absolute` 覆盖层。
- tabs 组件改为 store 驱动，补齐关闭左侧/右侧，删除“当前激活 tab 才 closable”的重复 `el-tab-pane` 分支。
- 移动端侧边栏补齐 `el-drawer`（原 `OnMobileOpenSidebar` 只有发送方、没有接收方）。
- 设置面板全部改为读写 `preferences` store，不再广播主题事件。

## 8. 质量门禁

重构后基线：

- `pnpm typecheck`：0 error（修复了 ProTable 的 `RenderScope<unknown>` 泛型回归）。
- `pnpm test`：65 个用例通过，新增 tabs store、layout 解析、写请求不合并回归。
- `pnpm build`：通过。
- `pnpm lint`：通过。`eslint-suppressions.json` 固化历史 1302 条 strictTypeChecked 债务；核心层 0 条，新增代码超基线会直接失败。

## 9. 后续路线

1. **继续清 lint 债务**：优先 `utils/export.ts`、`utils/utils.ts`、`api/metrics`、`utils/index.ts`。按文件 `--prune-suppressions` 递减，不一次性放宽规则。
2. **拆分 `utils/utils.ts`**：按 `object` / `tree` / `format` / `permission` / `download` 拆分，保持 re-export 兼容。
3. **表格强类型**：给 `useTable` 增加 `Row` 泛型，`ProTable` 列定义复用同一 Row 类型。
4. **组件测试**：为 tabs 组件、登录三态、权限指令补 `@vue/test-utils` 用例；再引入 Playwright 做真实浏览器走查。
5. **可观测性**：在 `ApiError` 基础上接错误上报；为路由初始化、菜单加载补耗时埋点。
