# 前端架构说明

> 本轮重构（2026-10）在上一版“骨架重构”的基础上，完成三件事：
>
> 1. 把**路由入口、业务实现、外壳、设计系统**拆成明确层级；
> 2. 用一套可执行的设计 token 与 **Governance Line** 外壳替换旧后台视觉；
> 3. 保留服务端菜单、登录、签名、表格与请求契约，所有现有回归测试通过。
> 4. 统一可用导航入口，拆分工作台与外壳样式，延迟加载工作区依赖，并补齐失败恢复。
>
> 业务页迁移时先读这里，再读 [`frontend-guide.md`](./frontend-guide.md) 与 [`../apps/web/DESIGN.md`](../apps/web/DESIGN.md)。目录/分层冲突时以本文为准。

## 1. 本轮目标

原骨架已经拆过 store、router、请求层，但页面和外壳仍混在 `layout/`、`views/` 与 `assets/css/` 中，导致三个问题：

1. **路由入口承担业务实现**：`views/*.vue` 既负责路径约定，又写页面逻辑，业务增长后无法区分“路由适配”与“业务模块”。
2. **外壳不可复用**：header、sidebar、tabs、settings、keep-alive 全部堆在 `layout/`，样式散落在 700 行 `app.less` 与旧主题文件里，主题状态和视觉实现互相污染。
3. **没有设计系统**：颜色、字号、间距、阴影散落在 Less 变量、Element Plus 覆盖与内联样式里；新页面只能复制旧页面。

本轮把结构收敛为：**app 组装 → layouts 外壳 → views 路由适配 → features 业务实现 → design-system/styles 视觉基础 → hooks/store/service 能力层 → utils/types 纯函数与类型**。

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
- `features/` 按业务域组织（auth / workbench / errors / embed），后续新增业务域在 `features/<domain>/` 下放页面、局部组件与 composable。
- `layouts/` 只处理外壳，不写业务判断；外壳状态通过 store 暴露。
- `styles/` 是全局样式的唯一入口。业务组件局部样式仍用 `<style scoped>`。
- `design-system/` 存放跨业务的基础组件（BrandMark、PageHeader、EmptyState、NavigationLink），不依赖业务。
- `utils/` 不反向依赖 store 或组件。
- `api/` 只负责路径与返回类型，不写 UI 状态。

## 3. 新目录结构

以下相对 `apps/web/`：

```
src/
├── app/
│   ├── bootstrap.ts             启动顺序：pinia → 指令 → 插件 → router → mount
│   ├── plugins.ts               初始 UI 注册 + 工作区插件单次加载入口
│   └── workspace-plugins.ts     工作区 VXE / Excel 导出栈与 vendor CSS
├── layouts/
│   ├── RouteHost.vue            `/` 下的 router-view 宿主
│   ├── admin/
│   │   ├── index.vue            管理后台外壳、移动抽屉
│   │   ├── composables/         useSidebarResize：拖动 / 键盘 / 持久化
│   │   └── components/
│   │       ├── header/          HeaderBar / HeaderActions / UserMenuPanel（头像下拉）
│   │       ├── navigation/      SideNav / NavMenuTree / HorizontalNav
│   │       ├── tabs/            WorkspaceTabs（自定义 tablist）
│   │       ├── view/            ViewOutlet / KeepAliveFrame
│   │       └── settings/        主题、布局、交互偏好
│   └── fullscreen/index.vue     登录、pop、显式 fullscreen 路由
├── views/                       路由适配层（路径约定仍在此）
│   ├── login.vue → features/auth/LoginPage.vue
│   ├── home.vue  → features/home/HomeResolver.vue
│   ├── baseHome.vue → features/workbench/WorkbenchPage.vue
│   ├── iframe.vue → features/embed/IframePage.vue
│   └── error/                   403 / 404 → features/errors/ErrorPage.vue
├── features/
│   ├── auth/                   自动登录三态 + 阶段进度
│   ├── home/                   HomeResolver + 云卡工作台（快捷入口 / 手册 / 公告 / 待办）
│   ├── workbench/              本地工作台 WorkbenchPage + components/
│   ├── errors/                 统一错误页
│   └── embed/                  iframe 页面 + frame-url 纯函数
├── design-system/
│   ├── components/             BrandMark / PageHeader / EmptyState / NavigationLink
│   └── index.ts
├── styles/
│   ├── tokens.css              色板、字号、间距、圆角、阴影、Element Plus 映射
│   ├── base.less               reset、排版、滚动条、focus、选择色
│   ├── element.less            Element Plus / VXE 覆盖
│   ├── workspace.less          页面原语 + 表格业务容器
│   ├── theme.less              面包屑、全屏外壳、路由 loading
│   ├── shell.less              shell/ 的汇总入口
│   ├── shell/                  外壳样式按十个职责拆分
│   ├── motion.less             loading / reduced-motion
│   ├── tailwind.css            Tailwind v4 CSS-first 配置
│   ├── variables.less          Vite 注入的 Less 兼容变量
│   └── index.less              全局样式入口
├── components/                 旧公共组件（ProTable / SearchForm / base…）
├── hooks/                      通用组合式函数
├── store/modules/              七个领域 store（含菜单收藏）
├── service/                    baseService + http
├── api/                        按业务域拆分
├── router/                     静态路由 + guards + view registry + navigation
├── utils/                      纯函数
├── constants/                  枚举、缓存 key、默认配置
└── types/                      全局类型
```

> 保留 `components/`、`hooks/` 的现有位置，是为了避免一次性搬家造成 60+ 文件与 lint suppression 基线同时失效。新业务优先落在 `features/`，跨域复用再提升到 `components/` / `hooks/`。

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

这样服务端协议、动态路由和既有菜单 url 完全不变，同时业务实现有了独立归属。静态路由也通过 `views/` 适配器进入 feature（登录、iframe 均如此），保证“路由入口”只有一个层级。

动态路由只注册顶层路由，子路由由 Vue Router 随父级递归挂载；不能把扁平化后的子路由再 `addRoute` 到根上，否则同名覆盖会丢失 `route.matched` 的父级链。菜单接口失败时，守卫会释放首屏并进入 `/error?to=503`，提供可重试出口。

`router/navigation.ts` 定义 `NavigationEntry` 和统一搜索规则。缺少视图且不能通过 iframe / 新窗口打开的叶子标记为 `isUnavailable`，不展示在侧栏、顶部导航或工作台中。隐藏菜单和空分组同样过滤；深链仍保留明确的错误出口。工作台消费 `menu.navigationEntries`，避免出现同一模块在不同位置可用性不同的情况。

进入 `/login` 会移除旧菜单路由，并重置菜单、标签页和会话。菜单初始化使用 generation校验，重置前发出的请求不能写回新会话。已经初始化的后续导航仍检查 token 与访问权限。初始化失败的“重新加载”返回 `/home` 重新请求；刷新 `/error` 不会触发初始化，因此不能作为恢复动作。

## 5. 外壳与视觉系统

### 5.1 外壳结构

`layouts/admin/index.vue` 负责：

- 64px masthead + 可调整宽度（196–380px）的 route rail + 工作区 sheet；
- 折叠态 76px，菜单仅图标；
- left / top / mix 三种导航模式；
- 固定桌面布局，不按窄屏切换抽屉或隐藏导航；
- 垂直导航采用手风琴，同级目录互斥展开，保留当前分支的父级；
- 混合导航顶部切换业务模块，侧栏显示对应子菜单与模块名称；当前路由按菜单树确定所属模块，收起侧栏不隐藏顶部菜单；
- 界面设置先展示带说明的布局选项，再展示外观与标签页；恢复默认与复制配置固定在底部，顶部布局不展示侧栏风格，关闭标签页时禁用样式选择；
- 侧栏宽度按用户缓存，支持 pointer 拖动、键盘方向键、双击复位；
- keep-alive 的 `include` 使用 `fullPath` 生成的具名包装组件，避免“store 存路径、include 却匹配组件名”的失效；
- 主题 class 由 `preferences` store 提供，映射到新的 CSS 变量。

### 5.2 设计系统

`styles/tokens.css` 是唯一 token 源：品牌青绿、纸面中性色、状态色、字号、间距、圆角、阴影、动效曲线、Element Plus 变量映射。外壳组件只消费 CSS 变量与 token，不再维护第二套颜色常量。

`design-system/components/` 当前包含：

- `BrandMark`：SVG 航线品牌标记，支持 compact / hero；
- `PageHeader`：统一页头，在可滚动工作区中保持完整高度；
- `EmptyState`：标题、原因与下一步操作槽；
- `NavigationLink`：内部 RouterLink 与外部链接的统一入口，保留 href、点击与键盘语义。

完整设计规则、组件状态、无障碍与反模式见 [`DESIGN.md`](../apps/web/DESIGN.md)。

### 5.3 样式入口

全局样式只在 `app/bootstrap.ts` 加载一次：

```
vendor CSS → tokens.css → tailwind.css → styles/index.less → driver.less
```

`styles/index.less` 内部顺序为 `base → element → workspace → theme → shell → motion`。Vite 的 Less `additionalData` 指向 `src/styles/variables.less`，业务 Less 不再重复 import。VXE 的 vendor CSS 随工作区插件延迟加载，body 上的语义变量确保后到的默认样式不能覆盖既有主题。`shell.less` 仅汇总 `shell/` 中的 foundation、brand、header、navigation、workspace、tabs、tab-variants、settings 文件。

### 5.4 主页与常用交互

`/home` 由 `HomeResolver` 决定渲染哪个页面：服务端 `/sys/menu/getMenuByUrl?url=/home` 指向已注册的自定义主页时渲染对应视图；未配置、指回 `/home`、`/home/index`、`/baseHome` 或请求失败时渲染 `HomeDashboard`。角色切换写入 `shell.mainPageRole`，无主页权限时直接回到默认工作台。

`HomeDashboard` 由欢迎区和四张卡片组成：快捷入口来自菜单收藏，用户手册取 `/mainPage` 菜单附件，系统公告取版本通知，待办事项按服务端分页展示。每块卡片独立维护加载、失败重试与空状态；待办处理在 iframe 弹窗中完成，关闭后刷新列表。

`/baseHome` 保留本地工作台 `WorkbenchPage`：只组装页头、业务目录、继续工作和账号信息。`ModuleDirectory` 负责搜索、分组筛选、分批展示与无结果恢复；`SystemStatus` 只在状态抽屉打开时读取 `/sys/info`。工作台消费 `menu.navigationEntries`；布局按内容容器宽度调整，收起导航、改变导航模式时同样能使用可用空间。

侧栏叶子菜单的收藏星标写入 `useFavoritesStore`（按账号隔离），成功后重新拉取 `/sys/menu/favorite/list`；主页快捷入口订阅同一份数据，因此收藏与取消收藏会立即反映到首页。

`HeaderActions` 的头像下拉只承载「系统管理」：菜单名称与 `SYSTEM_MENU_TITLE` 完全一致时由 `utils/menu.ts` 抽取该分组（保留服务端层级），`UserMenuPanel` / `UserMenuNode` 渲染树形入口并复用 `NavigationLink` 兼容外链；图标按层级取自共用的 `navigation/nav-level-icon.ts` 与 `--nav-icon-*` token（L1 层叠 · L2 文件夹 · L3 文件 · L4 圆点），与侧栏逐层一致；当前页所在分组自动展开、叶子高亮，点击面板外区域、Esc 或路由变化时收起，没有该分组时退化为静态用户信息。标签页的方向键导航仅滚动自身横向容器，跳转工作区链接聚焦 main 而不改变 hash 路由。ProTable 消费 `useTable` 的加载状态并提供空结果与帮助入口；SearchForm 使用原生表单提交语义。

### 5.5 启动与加载边界

初始注册 Element Plus，`v-chart` 通过异步组件加载。`loadWorkspacePlugins()` 在首次进入工作区时单次加载 VXE、XLSX 插件和 ExcelJS，守卫与异步 AdminLayout 共用该 promise；外壳渲染前完成注册，避免首登时出现未解析的 `vxe-modal`。加载失败后允许重试。移除人为的启动和路由等待，登录流程按请求完成情况推进。

本地生产构建的主 JS chunk 从约 2.5 MB 降至约 642 KiB（未压缩）。这是主 chunk 的拆分效果；初始仍有独立 Element Plus vendor chunk，工作区依赖随后加载，不能将该数值当作整个首屏传输量或全部依赖体积的降幅。构建与交互验收详见 [`refactor-verification.md`](./refactor-verification.md)。

## 6. 状态设计

| Store         | 负责                                                    | 不负责       |
| ------------- | ------------------------------------------------------- | ------------ |
| `session`     | 用户、按钮权限、登录态、退出清理                        | 路由、标签页 |
| `menu`        | 服务端菜单、动态路由、`path → meta`、当前菜单、`init()` | 用户资料写入 |
| `tabs`        | 标签页、激活项、关闭记录、keep-alive 缓存               | 路由跳转     |
| `shell`       | 首屏生命周期、全局 loading、刷新信号、混合导航选中项    | 业务数据     |
| `preferences` | 主题、导航布局、标签页开关、主题色应用                  | 菜单结构     |
| `context`     | 遗留业务穿透参数                                        | 框架状态     |
| `favorites`   | 当前账号的菜单收藏、星标翻转与回滚、快捷入口数据        | 菜单结构     |

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
pnpm e2e
```

结果：

- lint：通过，本次收尾未修改历史 suppression 基线。
- typecheck：0 error。
- tests：12 个文件、75 个用例通过，包含导航可用性、菜单树归属、搜索与 iframe URL 参数回归。
- build：通过。
- Playwright：11 个桌面用例通过，覆盖模块跳转、空结果、头像下拉「系统管理」、按需平台状态、导航布局、侧栏键盘调整、七层菜单缩进、手风琴展开、混合导航联动与刷新恢复、设置持久化与恢复默认、权限拒绝与初始化失败后的恢复。配置在 `apps/web/playwright.config.ts`，使用本机 Chrome 与受控 API 响应。
- 浏览器走查：1440×900、1280×720、390×844 下标题可见，无横向文档滚动；本地菜单的分组筛选与移动品牌标记可用。浏览器覆盖不代表外部 iframe 的业务功能已验收。

## 9. 后续路线

1. **把 `components/`、`hooks/` 迁到 `shared/`**：按引用簇小步移动，逐文件 prune suppression，不做一次性大搬家。
2. **业务迁移时补充验证**：按照实际页面增加表格交互、角色切换和业务失败态回归；既有外壳回归通过 `pnpm e2e` 持续执行。
3. **表格强类型**：给 `useTable` 增加 `Row` 泛型，ProTable 列定义复用同一类型。
4. **可观测性**：在 `ApiError` 基础上接错误上报；为菜单初始化、首屏、工作台系统信息增加耗时埋点。
5. **真实业务走查**：本地外壳已使用可读取的服务端菜单走查；完整业务页面尚不在本仓库，外部 iframe、角色差异与真实业务写操作仍需在联调环境验收。
