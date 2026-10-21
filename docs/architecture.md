# 前端架构说明

> 本轮重构（2026-10）在上一版“骨架重构”的基础上，完成三件事：
> 1. 把**路由入口、业务实现、外壳、设计系统**拆成明确层级；
> 2. 用一套可执行的设计 token 与 **Governance Line** 外壳替换旧后台视觉；
> 3. 保留服务端菜单、登录、签名、表格与请求契约，所有现有回归测试通过。
>
> 业务页迁移时先读这里，再读 [`frontend-guide.md`](./frontend-guide.md) 与
> [`../apps/web/DESIGN.md`](../apps/web/DESIGN.md)。目录/分层冲突时以本文为准。

## 1. 本轮目标

原骨架已经拆过 store、router、请求层，但页面和外壳仍混在 `layout/`、`views/` 与
`assets/css/` 中，导致三个问题：

1. **路由入口承担业务实现**：`views/*.vue` 既负责路径约定，又写页面逻辑，业务增长后
   无法区分“路由适配”与“业务模块”。
2. **外壳不可复用**：header、sidebar、tabs、settings、keep-alive 全部堆在 `layout/`，
   样式散落在 700 行 `app.less` 与旧主题文件里，主题状态和视觉实现互相污染。
3. **没有设计系统**：颜色、字号、间距、阴影散落在 Less 变量、Element Plus 覆盖与
   内联样式里；新页面只能复制旧页面。

本轮把结构收敛为：**app 组装 → layouts 外壳 → views 路由适配 → features 业务实现 →
design-system/styles 视觉基础 → hooks/store/service 能力层 → utils/types 纯函数与类型**。

## 2. 分层与依赖方向

```
app/                         组装、插件、启动顺序
  │
layouts/                     AdminShell / FullscreenShell / RouteHost
  │  只消费 store 与设计系统
views/                       路由适配层（薄）
  │  只把菜单路径映射到 feature 页面
features/<domain>/           登录、工作台、错误页、iframe 等业务实现
  │
design-system/ + styles/     视觉 token、基础组件、全局样式
  │
hooks/ store/ service/ api/  状态、请求、领域 API
  │
utils/ constants/ types/     纯函数与类型
```

约束：

- `views/` 是路由适配层，**不再承载业务状态**。文件保持薄，只 import 对应的 feature 页面。
- `features/` 按业务域组织（auth / workbench / errors / embed），后续新增业务域在
  `features/<domain>/` 下放页面、局部组件与 composable。
- `layouts/` 只处理外壳，不写业务判断；外壳状态通过 store 暴露。
- `styles/` 是全局样式的唯一入口。业务组件局部样式仍用 `<style scoped>`。
- `design-system/` 存放跨业务的基础组件（BrandMark、PageHeader），不依赖业务。
- `utils/` 不反向依赖 store 或组件。
- `api/` 只负责路径与返回类型，不写 UI 状态。

## 3. 新目录结构

以下相对 `apps/web/`：

```
src/
├── app/
│   ├── bootstrap.ts             启动顺序：pinia → 指令 → 插件 → router → mount
│   └── plugins.ts               第三方 UI 库注册（不含样式）
├── layouts/
│   ├── RouteHost.vue            `/` 下的 router-view 宿主
│   ├── admin/
│   │   ├── index.vue            管理后台外壳、侧栏尺寸、移动抽屉
│   │   └── components/
│   │       ├── header/          HeaderBar / BrandMark / Breadcrumb / actions / support
│   │       ├── navigation/      SideNav / NavMenuTree / HorizontalNav / collapse
│   │       ├── tabs/            WorkspaceTabs（自定义 tablist）
│   │       ├── view/            ViewOutlet / KeepAliveFrame
│   │       └── settings/        主题、布局、交互偏好
│   └── fullscreen/index.vue     登录、pop、显式 fullscreen 路由
├── views/                       路由适配层（路径约定仍在此）
│   ├── login.vue → features/auth/LoginPage.vue
│   ├── home.vue  → features/workbench/HomeResolver.vue
│   ├── baseHome.vue → features/workbench/WorkbenchPage.vue
│   ├── iframe.vue → features/embed/IframePage.vue
│   └── error/                   403 / 404 → features/errors/ErrorPage.vue
├── features/
│   ├── auth/                   自动登录三态 + 阶段进度
│   ├── workbench/              工作台解析器 + 工作台页面
│   ├── errors/                 统一错误页
│   └── embed/                  iframe 页面
├── design-system/
│   ├── components/             BrandMark / PageHeader
│   └── index.ts
├── styles/
│   ├── tokens.css              色板、字号、间距、圆角、阴影、Element Plus 映射
│   ├── base.less               reset、排版、滚动条、focus、选择色
│   ├── element.less            Element Plus / VXE 覆盖
│   ├── workspace.less          页面原语 + 表格业务容器
│   ├── theme.less              面包屑、全屏外壳、路由 loading
│   ├── shell.less              外壳、导航、tabs、settings、响应式
│   ├── motion.less             loading / reduced-motion
│   ├── tailwind.css            Tailwind v4 CSS-first 配置
│   ├── variables.less          Vite 注入的 Less 兼容变量
│   └── index.less              全局样式入口
├── components/                 旧公共组件（ProTable / SearchForm / base…）
├── hooks/                      通用组合式函数
├── store/modules/              六个领域 store
├── service/                    baseService + http
├── api/                        按业务域拆分
├── router/                     静态路由 + guards + view registry
├── utils/                      纯函数
├── constants/                  枚举、缓存 key、默认配置
└── types/                      全局类型
```

> 保留 `components/`、`hooks/` 的现有位置，是为了避免一次性搬家造成 60+ 文件与
> lint suppression 基线同时失效。新业务优先落在 `features/`，跨域复用再提升到
> `components/` / `hooks/`。

## 4. 路由适配层：保持服务端菜单契约

服务端菜单仍是唯一导航来源。约定没有变：

- `toSysViewComponentPath(path)` 生成 `/src/views{path}.vue`；
- 通过 `import.meta.glob('/src/views/**/*.vue')` 查表；
- `_` 会替换成 `-`，hash 模式；
- 菜单 url 必须对应 `views/` 下的文件。

变化在于 **views 文件只做适配**：

```vue
<template><WorkbenchPage /></template>
<script setup lang="ts">
import WorkbenchPage from '@/features/workbench/WorkbenchPage.vue'
</script>
```

这样服务端协议、动态路由和既有菜单 url 完全不变，同时业务实现有了独立归属。
静态路由也通过 `views/` 适配器进入 feature（登录、iframe 均如此），保证“路由入口”
只有一个层级。

动态路由只注册顶层路由，子路由由 Vue Router 随父级递归挂载；不能把扁平化后的
子路由再 `addRoute` 到根上，否则同名覆盖会丢失 `route.matched` 的父级链。菜单接口
失败时，守卫会释放首屏并进入 `/error?to=503`，提供可重试出口。

## 5. 外壳与视觉系统

### 5.1 外壳结构

`layouts/admin/index.vue` 负责：

- 64px masthead + 可调整宽度（196–380px）的 route rail + 工作区 sheet；
- 折叠态 76px，菜单仅图标；
- left / top / mix 三种导航模式；
- 移动端（≤960px）切换为左侧 drawer；
- 侧栏宽度按用户缓存，支持 pointer 拖动、键盘方向键、双击复位；
- keep-alive 的 `include` 使用 `fullPath` 生成的具名包装组件，避免“store 存路径、include 却匹配组件名”的失效；
- 主题 class 由 `preferences` store 提供，映射到新的 CSS 变量。

### 5.2 设计系统

`styles/tokens.css` 是唯一 token 源：品牌青绿、纸面中性色、状态色、字号、间距、
圆角、阴影、动效曲线、Element Plus 变量映射。外壳组件只消费 CSS 变量与 token，
不再维护第二套颜色常量。

`design-system/components/` 当前包含：

- `BrandMark`：SVG 航线品牌标记，支持 compact / hero；
- `PageHeader`：统一页头，无 eyebrow 装饰。

完整设计规则、组件状态、无障碍与反模式见 [`DESIGN.md`](../apps/web/DESIGN.md)。

### 5.3 样式入口

全局样式只在 `app/bootstrap.ts` 加载一次：

```
vendor CSS → tokens.css → tailwind.css → styles/index.less → driver.less
```

`styles/index.less` 内部顺序为 `base → element → workspace → theme → shell → motion`。
Vite 的 Less `additionalData` 指向 `src/styles/variables.less`，业务 Less 不再重复 import。

## 6. 状态设计

| Store | 负责 | 不负责 |
| --- | --- | --- |
| `session` | 用户、按钮权限、登录态、退出清理 | 路由、标签页 |
| `menu` | 服务端菜单、动态路由、`path → meta`、当前菜单、`init()` | 用户资料写入 |
| `tabs` | 标签页、激活项、关闭记录、keep-alive 缓存 | 路由跳转 |
| `shell` | 首屏生命周期、全局 loading、刷新信号、移动抽屉、混合导航选中项 | 业务数据 |
| `preferences` | 主题、导航布局、标签页开关、主题色应用 | 菜单结构 |
| `context` | 遗留业务穿透参数 | 框架状态 |

- tabs 与导航的外壳选择仍是纯状态机，组件只渲染；
- `App.vue` 只选择 page / fullscreen / standalone，不再包含路径 if；
- 全局事件总线仍不存在，跨层用 props / provide-inject / store。

## 7. 请求层

保持上一轮设计：

- `service/http/client.ts` 只在 GET/HEAD/OPTIONS 合并并发；
- 调用瞬间固定 token；401 清缓存并跳登录；
- 失败统一为 `ApiError`；
- `baseService` 保留签名头与 3600000ms 超时；
- 响应头以不可枚举属性挂到 data，避免污染业务 JSON。

`api/` 新增接口应显式写泛型，历史接口保持 `any` 兼容。

## 8. 质量门禁

本轮验收命令（Node ≥ 24）：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

结果：

- lint：通过，`eslint-suppressions.json` 从 66 个文件降至 58 个；
  核心层（app / layouts / router / store / service / features / styles）无新增债务。
- typecheck：0 error。
- tests：68 个用例通过（新增路由树注册、tab 缓存清理断言）。
- build：通过。
- 浏览器走查：使用 Playwright 拦截本地 API，验证登录三态、工作台、left/top/mix、
  折叠导航、混合导航点击、移动抽屉、标签页、主题抽屉与菜单加载失败出口；1440/390 宽度无横向滚动。

## 9. 后续路线

1. **把 `components/`、`hooks/` 迁到 `shared/`**：按引用簇小步移动，逐文件 prune
   suppression，不做一次性大搬家。
2. **补组件测试**：WorkspaceTabs 键盘交互、HeaderBar 三种布局、工作台空状态/系统信息
   失败态、登录 forbidden 态。
3. **表格强类型**：给 `useTable` 增加 `Row` 泛型，ProTable 列定义复用同一类型。
4. **可观测性**：在 `ApiError` 基础上接错误上报；为菜单初始化、首屏、工作台系统信息
   增加耗时埋点。
5. **真实后端走查**：当前工作台与外壳通过本地 mock 验收，真实菜单的深层嵌套、
   超长标题、iframe/fullscreen 组合仍需在联调环境回归。
