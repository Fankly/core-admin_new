# core-admin (budget-process)

项目过程管控平台前端。pnpm workspace monorepo，业务应用是 Vue 3 + Vite + Element Plus + Pinia 的管理后台，源码位于 `apps/web/src`。

这是**骨架仓库**：登录、外壳、路由、权限、表格封装、设计系统与接口层范式都已就位。`views/` 现在只做路由适配，实际页面放在 `features/`（auth / workbench / errors / embed）；业务域页面仍待补充。

视觉与设计规则见 `apps/web/DESIGN.md`，产品事实见 `apps/web/PRODUCT.md`。同名的 `/Users/fan/developer/core-admin` 是体量大得多的完整仓库（约 1700 文件、`views` 下按业务域分 1300+ 文件）；两者不要混淆，codegraph 索引默认指向那一个，查本仓库要显式传 `projectPath`。

## 仓库结构

```
apps/web/            业务应用（原仓库根，包名 budget-process）
packages/tsconfig/         @repo/tsconfig        base.json / vue-app.json
packages/eslint-config/    @repo/eslint-config   index.js（纯 TS）/ vue.js（Vue 应用）
packages/prettier-config/  @repo/prettier-config
```

包管理器是 pnpm，锁文件 `pnpm-lock.yaml`，**不要用 npm / yarn 装依赖**。共享工具链版本在 `pnpm-workspace.yaml` 的 `catalog:` 里，各包用 `"eslint": "catalog:"` 引用。Node 必须 ≥ 24（pnpm 11 的硬要求）。如果本机默认 Node 是 18，先切到 24 再执行命令。

## 命令

根目录执行（会转发到 `apps/web`）：

```bash
pnpm dev           # Vite dev server，端口 8001；浏览器手动访问
pnpm build         # = build:prod，production 模式
pnpm build:sit     # / pnpm build:uat
pnpm lint          # 递归跑所有包的 lint（eslint --fix）
pnpm typecheck     # 递归跑 vue-tsc --noEmit
pnpm test          # Vitest，真实 HTTP / 组件 / store 回归
pnpm e2e           # Playwright，桌面 / 移动端交互回归
```

只作用于单个包时用 `pnpm --filter budget-process <script>`，或直接进 `apps/web` 执行。

`pnpm test` 使用 `apps/web/vitest.config.ts`。HTTP 用例启动本地服务并发送真实请求，运行环境必须允许监听回环地址。`pnpm e2e` 使用 `apps/web/playwright.config.ts` 和本机 Chrome，可启动或复用 8001 端口的 dev server。用例在 `apps/web/e2e/`，只拦截 `/api/` HTTP 和测试 iframe，不拦截 Vite 源码模块。浏览器用例覆盖外壳交互与故障恢复，不能替代真实业务接口联调。改动后执行 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`；涉及外壳交互时补跑 `pnpm e2e` 并走查受影响页面。

## 质量门禁与 lint 债务

`apps/web/eslint-suppressions.json` 是**历史 lint 债务基线**（strictTypeChecked 迁移中尚未清零的 `any`/unsafe 规则）。ESLint 会自动读取它：

- 新增代码**不得**再产生被抑制的错误；余额用完后必须修代码，而不是改基线。
- 修完某文件的债务后，用 `pnpm --filter budget-process lint`（带 `--fix`）验证；需要清理失效条目时执行 `cd apps/web && npx eslint "src/**/*.{vue,ts}" --prune-suppressions`。
- 核心层（`src/app`、`src/store/modules`、`src/service/http`、`src/router`、`src/directives`）已清零，新增代码按同样标准要求。

## 构建约定

- 别名：`@` → `apps/web/src`，`@mock` → `apps/web/mock`（仅开发环境按需 import）。
- 当前仅对 Less 自动注入 `@/styles/variables.less`，不要重复 import。遗留 SCSS 文件未自动注入；新增 SCSS 使用前需明确配置预处理器。
- `vue` 指向 `vue/dist/vue.esm-bundler.js`（保留运行时模板编译）。
- dev 代理 `/api` → `http://localhost:10027/budget-process`，代理配置位于 `apps/web/vite.config.ts`。
- 环境文件在 `apps/web/`：`.env.development` / `.env.production` / `.env.production.sit` / `.env.production.uat`。
- 登录凭据可通过 `VITE_APP_LOGIN_USER` / `VITE_APP_LOGIN_PASSWORD` / `VITE_APP_LOGIN_CAPTCHA` 覆盖，源码里的默认值仅用于本地联调。
- SVG 图标目录 `apps/web/src/assets/icons/svg`，symbolId 规则 `icon-[dir]-[name]`。
- `@file-viewer/*` 有手工 alias 与 `optimizeDeps.include`，动它前先读 `apps/web/vite.config.ts` 的注释。alias 用 `require.resolve(pkg + '/package.json')` 反推包根，不要改回写死 `node_modules/...` 路径——pnpm 下布局不固定。
- `@file-viewer/docx`、`@file-viewer/doc` 是 `renderer-word` 的间接依赖，`src` 从未 import，但 `optimizeDeps.include` 要预构建，所以在 `apps/web/package.json` 里显式声明为直接依赖。升级 `renderer-word` 时同步这两个版本。
- pnpm 配置全部写在 `pnpm-workspace.yaml`（camelCase）。**`.npmrc` 在 pnpm 11 下完全不被读取**，`shamefully-hoist` 之类 kebab-case 键写进去毫无作用，改完用 `pnpm config list` 验证。

## Tailwind

Tailwind v4，CSS-first 配置，**没有 tailwind.config.js**。全部配置在 `apps/web/src/styles/tailwind.css`：

- 类名前缀是 `tw:`（变体式语法），不是 v3 的 `tw-`。写 `tw:flex`、`tw:hover:bg-red-600`。
- 不引入 preflight（等价于原 `corePlugins.preflight: false`），所以没有 box-sizing 与 border-style 重置，`tw:border` 单独用不出边框。
- 间距由 `--spacing` 乘数动态生成，`tw:p-4.5` 直接可用，不需要自定义 token。
- 当前没有页面使用 Tailwind 类；新 UI 优先消费 `src/styles/tokens.css` 的语义 token 与 Less。确需 Tailwind 时按上述规则使用，不要新增第二套颜色常量。

## 目录职责

以下均相对 `apps/web/`：

| 目录 | 职责 |
| --- | --- |
| `src/app/` | 应用启动：`bootstrap.ts` 组装 pinia / 指令 / 初始 UI；`plugins.ts` 注册 Element Plus / 异步图表；`workspace-plugins.ts` 延迟注册 VXE / Excel 导出 |
| `src/layouts/` | 外壳：`admin/`（masthead / route rail / tabs / settings / keep-alive）、`fullscreen/`、`RouteHost` |
| `src/views/` | **路由适配层**：保持菜单路径约定，薄封装到 `features/`；静态页与 error 也在此 |
| `src/features/` | 业务实现：auth / workbench / errors / embed；新增业务域在此建目录 |
| `src/design-system/` | 跨业务基础组件（BrandMark、PageHeader、EmptyState、NavigationLink） |
| `src/styles/` | 全局样式唯一入口；`shell.less` 汇总 `shell/` 中按职责拆分的外壳样式 |
| `src/api/` | 按业务域划分的接口定义 |
| `src/components/` | 既有跨业务公共组件（ProTable / SearchForm / base…） |
| `src/directives/` | 全局指令，一个指令一个文件，副作用成对清理 |
| `src/hooks/` | 通用组合式函数（useTable、usePermission、useView…） |
| `src/service/` | `baseService.ts` CRUD 封装；`http/` 是 axios 客户端、错误归一与请求身份计算 |
| `src/utils/` | 纯函数工具；`utils/http.ts` 只是请求层的兼容 re-export |
| `src/store/` | 按领域拆分的 Pinia store，统一从 `store/index.ts` 导出 |
| `src/router/` | 静态路由 / 守卫 / 视图映射 / 实时注册；`navigation.ts` 统一可用入口与搜索规则 |
| `src/constants/` | 枚举、缓存 key、默认配置 |
| `src/types/` | 全局类型：`domain.ts` 领域模型、`router.d.ts` 路由 meta 增强、`vue.d.ts` 全局属性 |

## 关键机制

**路由是服务端菜单驱动的。** `useMenuStore().init()` 拉菜单 + 用户信息，与 `router/base.ts` 合并后注册。视图组件按路径约定匹配：`router/view-registry.ts` 的 `toSysViewComponentPath` 把 `path` 转成 `/src/views{path}.vue`，通过 `import.meta.glob('/src/views/**/*.vue')` 查表。glob 是 Vite root 相对路径，root 即 `apps/web`，monorepo 下无需改写。新增页面通常不用手写路由，但**文件路径必须和菜单 url 对应**（`_` 会替换成 `-`）。`views/` 文件只做路由适配，业务实现落在 `features/`；需要被服务端菜单命中的路径必须保留适配文件。hash 模式。

**路由守卫是管线，不是巨型 if。** `router/guards/index.ts` 按「菜单信息同步 → 新窗口拦截 → 登录/初始化 → 放行」组织；`router/layout.ts` 的 `resolveLayoutMode` 把外壳选择（page / fullscreen / standalone）抽成纯函数并有单测。全屏页优先用路由 `meta.layout = 'fullscreen'`，不要再往 `App.vue` 里加路径判断。

**导航只展示可用入口。** 服务器菜单中没有对应视图、也不是 iframe / 新窗口的叶子标记为 `isUnavailable`；侧栏、顶部导航、工作台、全局菜单搜索统一过滤，空分组也不展示。工作台和菜单搜索消费 `menu.navigationEntries`，不要各自遍历菜单实现另一套规则。普通链接用 RouterLink，需兼容外链的通用入口用 `NavigationLink`。

**工作区依赖按进入时机加载。** 登录阶段不加载 VXE / Excel 导出栈；守卫与异步 AdminLayout 共用 `loadWorkspacePlugins()`，确保注册完成后再渲染外壳。平台状态只在抽屉打开时请求。进入 `/login` 清动态菜单路由、标签页和会话；初始化失败页的重试回到 `/home`，重新请求菜单，而不是刷新 `/error`。

**Pinia 按领域拆分。** 不再存在扁平大对象：

- `useSessionStore`：用户、按钮权限、登录态、logout。
- `useMenuStore`：服务端菜单、动态路由、`path → meta`、当前菜单信息、`init()`。
- `useTabsStore`：标签页、激活项、关闭记录、keep-alive 缓存集合；打开/关闭逻辑是纯状态机。
- `useShellStore`：首屏生命周期、全局 loading、刷新信号、移动端抽屉、混合导航选中项。
- `usePreferencesStore`：主题、导航布局、标签页开关；写入即持久化并应用主题色。
- `useContextStore`：遗留业务穿透参数（`xxGlobalInfo` 等），与框架状态隔离。

**全局事件总线已移除。** 原 `mitt` 的 tab / 主题 / loading 通知全部改为 store action。页面组件不要再引入事件总线；跨层通信用 props / provide-inject / store。

**接口层。** `src/api/**` 从 `@/service/baseService` 导入。`baseService` 自动加 Base64 签名头（random / timeStamp / sign），默认超时 3600000ms。返回包默认 `any` 以兼容历史 api；新接口应写 `baseService.get<MyData>(...)` 并用 `ServiceResult<T>`。极少数直接返回数组的接口用 `baseService.raw<T>(...)`。 `service/http/client.ts` 只对 GET/HEAD/OPTIONS 合并并发请求（写请求永不合并），所有失败归一为 `ApiError`（`status` / `code` / `url`），401 统一清 token 并跳登录。

**权限有两套入口。** `UserRoleSelector` 的父级通过 `CurrentUserRoleInjectionKey` 提供 `Ref<UserRole>`；组件通过默认插槽承载页面，并向后代提供 `PermissionInjectionKey`。`usePermission` 优先消费该上下文，没有则自己拉。角色和按钮接口统一放在 `api/permission`。缓存页失活后，迟到响应仅更新本页缓存，不覆盖当前页全局权限。按钮级权限用 `v-permission`（实现见 `src/directives/permission.ts`）或 `utils/utils.ts` 的 `checkPermission`。

**表格走 `useTable` + ProTable。** `useTable(api, initParam, isPageable, dataCallBack, requestError, clearSelection, initialPageSize)` 默认分页 size 20，最后一个参数可省略。`initParam` 与 `isPageable` 支持 ref/getter；`totalParam` 保存已提交的搜索条件，请求时再合并初始化参数和分页。仅最新请求可以提交数据与 loading，销毁作用域后忽略在途结果。`useTableSize` 为默认 size 100 的兼容包装。

## 局部约定

图标走 `vite-plugin-svg-icons-ng`：把 svg 放进 `src/assets/icons/svg/`，用 `<svg-icon :name="'icon-<目录>-<文件名>'">` 引用（symbolId 规则见 `vite.config.ts`），不要手写内联 svg。组件没有全局注册，每个文件自己 `import SvgIcon from '@/components/base/svg-icon'`。注意 `button.svg` 当前 SVGO 优化失败（构建期 warning，该图标被跳过）。

更多重构决策、目录演进与后续路线见 `docs/architecture.md`。
