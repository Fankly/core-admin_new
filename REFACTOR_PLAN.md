# core-admin 技术栈重构计划

> 基于对仓库的实际扫描（1700 文件 / 49 万行），非推测。所有版本号取自 npm registry 实时查询（2026-08-28）。

## 前置门槛

本机 Node **18.20.8**，而目标栈硬性要求 `^20.19 || >=22.12`（Vite 7/8、ESLint 10、Vitest 4 的 `engines` 都是这个）。**Node 22 LTS 不到位，后面所有阶段都无法开始。** 已确认本机与 CI 都可以升。

同时 `.npmrc` 里有 `legacy-peer-deps=true`，它一直在掩盖 peer 冲突。这一项要留到最后再摘（见 Phase 7），过早摘掉会让中间态装不上依赖。

---

## 一、现状盘点

### 1.1 已确认「零引用」，可直接删

| 包 | 证据 |
| --- | --- |
| `quill` + `@types/quill` | 源码 0 处 import |
| `vue-i18n` | 0 处 import，但 `vite.config.ts` 的 `manualChunks.vlib` 还在引用它 |
| `core-js` | 0 处 import，且无任何包依赖它 |
| `react` / `react-dom` 18.3.1 | 0 处真实 import；是 `@radix-ui/*`（univer UI 依赖链）的传递依赖，不该出现在直接依赖里 |
| `rxjs` 7.8.2 | 0 处直接 import；`@univerjs/core` 的传递依赖 |
| `opentype.js` | 0 处直接 import；`@univerjs/engine-render` 的传递依赖 |
| `vue-demi` | 0 处直接 import；`@vueuse/core` 与 `vue-echarts` 的传递依赖 |
| `less-loader` 10 | webpack 专用 loader，在 Vite 项目里完全是死代码 |
| `vite-plugin-pwa` 0.8.1 | `vite.config.ts` 里没有引用 |
| `vite-plugin-eslint` 1.1.3 | `vite.config.ts` 里没有引用 |
| `classnames` | 仅 `src/layout/sidebar/sidebar-menus-items.vue` 一处，无包依赖它 |

注意：`react` / `rxjs` / `opentype.js` / `vue-demi` 是从 `dependencies` 里移除**直接声明**，包本身仍会作为传递依赖被安装。这不是删功能，是修依赖声明。

### 1.2 已停止维护，需要找替代

| 包 | 最后发布 | 用量 | 处置 |
| --- | --- | --- | --- |
| `vite-plugin-svg-icons` 2.0.1 | 2022-05 | 36 处 `SvgIcon`，38 个 svg | 换 `unplugin-icons` 23.0.1（活跃，2026-01） |
| `vite-plugin-vue-setup-extend-plus` | 2022-06 | **284 个文件**用 `<script setup name="X">` | 换 Vue 3.3+ 原生 `defineOptions`（当前 0 处使用） |
| `@wangeditor/editor` | 2022-11 | 1 处（`components/base/BasicEditor.vue`） | 换 Tiptap 3.30.5（活跃，2026-08） |
| `echarts-liquidfill` 3.1.0 | 2022-06 | 2 处水位图 | **阻塞 echarts 6**，peer 锁 `^5.0.1`，见 §3.6 |
| `vite-plugin-html` 2.0.7 | — | `index.html` 的 `<%= apiURL %>` | 直接删，Vite 原生支持 `%VITE_APP_API%` 占位 |
| `vite-tsconfig-paths` 3.3.13 | — | 只为 file-viewer 类型桩服务 | 可删，`resolve.alias` 已手写了 `@` |

`nprogress`（2023-08）和 `mockjs`（2023-08）虽然久未更新，但功能封闭、无替代必要、且确实在用（mockjs 用于 `mock/` 目录，共 11 处），保留。

### 1.3 版本落后清单

| 包 | 当前（实装） | 最新稳定 | 备注 |
| --- | --- | --- | --- |
| `vue` | 3.2.1 | 3.5.42 | |
| `element-plus` | **1.0.2-beta.71** | 2.14.5 | 还停在 v2 之前的 beta，是本次最大工作量 |
| `vite` | 2.9.15 | 8.2.2 | 跨 6 个大版本 |
| `typescript` | 4.3.5 | 7.0.2 | **但只能升到 5.9.3**，见下 |
| `eslint` | 7.32.0 | 10.9.1 | 需迁 flat config |
| `prettier` | 2.6.2 | 3.9.6 | |
| `vue-router` | 4.0.10 | 5.3.0 | |
| `axios` | 0.21.4 | 1.20.0 | 0.21.x 有已知 CVE，属安全项 |
| `@vueuse/core` | 5.3.0 | 14.4.0 | 跨 9 个大版本 |
| `echarts` | 5.3.2 | 6.1.0 | 受 liquidfill 阻塞 |
| `vue-echarts` | 6.0.2 | 8.1.0 | peer 要求 `echarts ^6.0.0` |
| `vxe-table` | 4.6.21 | 4.21.2 | 458 处调用，1998 个 `vxe-column` |
| `xe-utils` | 3.3.0 | 4.0.12 | 大版本 |
| `tailwindcss` | 3.4.19 | 4.3.3 | v4 是 CSS-first 配置，2111 处 `tw-` 前缀 |
| `sass` | 1.50.0 | 1.103.1 | `@import` 已废弃 |
| `driver.js` | 1.3.1 | 1.8.0 | |
| `markdown-it` | 13 | 15.0.1 | |
| `mitt` | 2.1.0 | 3.0.1 | |
| `@univerjs/*` | 0.20.1 | 0.25.1 | |

**TypeScript 只能到 5.9.3，不能到 7.0.2。** `typescript-eslint@8.68.0`（最新）的 peer 是 `typescript >=4.8.4 <6.1.0`，TS 7 会直接破坏 lint 链路。这是硬约束，不是保守选择。

---

## 二、目标栈

```
Node 22 LTS  ·  Vue 3.5.42  ·  Vite 8.2.2  ·  TypeScript 5.9.3
Element Plus 2.14.5  ·  Pinia 4.0.3  ·  vue-router 5.3.0
ESLint 10 (flat) + Prettier 3.9.6
Vitest 4.1.11 + @vue/test-utils 2.5.0 + happy-dom  ·  Playwright 1.62.1
```

新增：`@element-plus/icons-vue` 2.3.2、`unplugin-vue-components` 32.1.0、`unplugin-auto-import` 21.1.0、`vite-plugin-vue-devtools` 8.2.1、`sass-embedded` 1.103.1、`lodash-es`（替 `lodash`，17 处）。

Vite 选 8 而非 7 的理由：`@vitejs/plugin-vue@6` peer 明确含 `^8.0.0`，`vitest@4`、`vue-router@5` 同样支持；而两个卡在 Vite 2 时代的插件（svg-icons / html）本来就要删掉。若 Phase 1 出现插件不兼容，退回 `vite@7.3.0` 即可，不影响其他阶段。

---

## 三、分阶段执行

每个 Phase 结束后必须 `npm run build` 通过 + Playwright 冒烟通过，才进入下一个。

### Phase 0 — Node 22 + 回归网（先做，这是安全绳）

1. 升 Node 22 LTS，加 `.nvmrc` + `package.json` 的 `engines` 字段。
2. **在当前这套旧代码上**先写 Playwright 冒烟用例。Playwright 是浏览器级的、与框架版本无关，只需要 dev server 起得来，所以它能在 Vite 2 + EP beta 上跑。
3. 覆盖范围建议：登录、菜单动态注册与路由跳转、一个 ProTable 列表页的查询/分页、一个 vxe-table 页面、一个走 `baseService` 的提交表单、Excel 导出。
4. 这批用例是后面每一个破坏性阶段的验收标准。没有它，EP v2 迁移就是盲改。

> 顺序上有个约束值得说明：Vitest 4 要求 Vite ≥6，所以单测基建装不到 Vite 2 上，只能等 Phase 1 之后（Phase 2）。但 Playwright 没这个限制，可以现在就建。所以「先补测试」这个决定拆成了 Phase 0（E2E）和 Phase 2（单测）两半。

### Phase 1 — 构建工具链

Vite 2.9 → 8，TS 4.3 → 5.9.3，ESLint 7 → 10 flat config，Prettier 2 → 3，sass → sass-embedded。

- 删 `vite-plugin-html`，`index.html` 改用 Vite 原生 `%VITE_APP_API%`。
- 删 `vite-plugin-eslint`、`vite-plugin-pwa`、`less-loader`、`vite-tsconfig-paths`。
- `vite-plugin-svg-icons` → `unplugin-icons`；`SvgIcon` 组件要重写（36 处调用点）。
- `vite-plugin-vue-setup-extend-plus` → `defineOptions`：284 个文件的 `<script setup name="X">` 机械替换。注意 `src/layout/view/base-view.vue` 的 `<keep-alive :include="store.state.caches">` 依赖组件 name，改完要专门验 keepAlive 还生效。
- SCSS `additionalData` 里注入的两条 `@import` 改 `@use`（源码内另有 5 处 `@import`）。
- 移除 `vue: 'vue/dist/vue.esm-bundler.js'` 别名——扫描确认 0 处运行时模板编译，这个别名纯属白背 ~40KB。
- 修 `manualChunks`：里面还列着已经不存在的 `vue-i18n`，并且 `vuex` 项在 Phase 5 后也要换成 `pinia`。
- Prettier 3 会改动大量文件的格式化结果，建议单独一个 commit，别和逻辑改动混在一起。

### Phase 2 — 单测基建

Vitest 4.1.11 + `@vue/test-utils` 2.5.0 + happy-dom + `@vitest/coverage-v8`。优先给纯逻辑单元补测试，投入产出比最高的几处：`src/utils/http.ts`（里面有并发合并、频率限制、pending 清理三套自研逻辑）、`baseService` 的签名生成、`hooks/useTable`、`utils/tableFormatter.ts`、`decimal.js` 相关的金额计算。

### Phase 3 — 清理死代码（低风险，先收割）

按 §1.1 全部删掉，`classnames` 那一处换成模板字符串。同时处理遗留 JS：`src/api/MainController/*.js`（27 个）、`src/api/Controller/*.js`（9 个）、`src/core/`（`config.js` / `http/index.js` / `mixins/global.js`，其中 `core/http` 有 5 处引用）。这批可以转 TS，也可以先只删确认无引用的部分——建议本阶段只做「删无引用」，转 TS 另开工单，避免把清理和重写混一起。

### Phase 4 — Element Plus 2.14.5（最大风险项，独立分支）

从 1.0.2-beta 跳到 2.14.5 是跨 v1→v2 的破坏性升级。实测破坏面：

| 破坏点 | 实测量 |
| --- | --- |
| `size="mini"` 被移除（v2 只有 large/default/small） | **2018 处** |
| 图标字体类 `el-icon-*` 整体移除 | 973 处命中 / 76 个不同图标 |
| `:visible` → `v-model` | 139 处（48 个文件含 `el-dialog`） |
| `icon="el-icon-xxx"` 字符串 prop → 组件 | 215 处 |
| `type="text"` 按钮废弃 → `link` | 121 处 |
| SASS `$--xxx` 变量体系 → CSS 变量 `--el-xxx` | `element-variables-green.scss` 1062 行 / 523 个 `$--` 变量，**0 个 CSS 变量** |
| `element-plus/lib/*` 深路径 import | 10 处（含 `theme-chalk/index.css` → `dist/index.css`） |
| `el-submenu` → `el-sub-menu` | 1 处 |
| 残留 `.sync` | 5 处 |

执行建议：

1. 前四项（size / icon / visible / type=text）写 codemod 脚本批量改，逐类改、逐类跑 Playwright，不要一把梭。
2. `size="mini"` → `size="small"`；`main.ts` 里全局 `size: 'small'` 保持不变。注意这会让所有原 mini 控件视觉变大一档，和 `DESIGN.md` 的高密度要求冲突，需要用 CSS 变量把 small 尺寸重新压回去——**这是本阶段最容易被低估的一环**。
3. 主题文件 1062 行是纯手工活，没有自动化路径。建议按 `DESIGN.md` 的色板重写成 `--el-*` CSS 变量，而不是逐行翻译旧 SASS 变量。
4. 引入 `unplugin-vue-components` + `unplugin-auto-import`，顺带把 10 处深路径 import 一并消除。
5. 图标换 `@element-plus/icons-vue`，76 个不同图标建一张映射表再批量替换。

### Phase 5 — Vuex 4 → Pinia 4.0.3

275 个文件引用 Vuex，`src/store/index.ts` 只有 204 行但 state 是扁平大对象（用户信息、tabs、routes、各类 `xxGlobalInfo` 穿透参数全挂根上）。

策略：不要一次性切。先建 Pinia store 与 Vuex 并存，按域拆分（user / tabs / routes / 业务穿透参数），逐域迁移并让旧 `store.state.x` 通过 getter 代理到新 store，最后再删 Vuex。特别注意 `src/layout/view/base-view.vue` 的 `store.state.caches`（keepAlive 白名单）和路由守卫里的 `initApp` 派发。

同阶段升 `vue-router` 5.3.0（peer 要求 `vue ^3.5.34`，所以必须在 Vue 升级之后）。

### Phase 6 — 其余库

- `axios` 0.21 → 1.20（安全项）。`src/utils/http.ts` 的自定义 `transformResponse`（jsonBigint）和拦截器要重验。
- `@vueuse/core` 5 → 14：仅 6 处调用（`useMediaQuery` / `useWindowSize` / `useFullscreen` / `useMutationObserver` / `useResizeObserver`），风险低。
- `vxe-table` 4.6 → 4.21 + `xe-utils` 3 → 4：458 处调用，`main.ts` 里的 `setConfig` / `setIcon` / `VXETablePluginExportXLSX` 注册方式需按 4.21 文档核对。`setIcon` 里配的还是 `el-icon-*` 字体类，会随 Phase 4 一起失效。
- `tailwindcss` 3 → 4：2111 处 `tw-` 前缀，v4 的 prefix 语法和配置格式都变了（JS config → CSS-first），且当前 `tailwind.config.js` 用了 `oklch(from var(--x) ...)` 这类相对颜色语法，迁移时要逐项验证。
- `@univerjs/*` 0.20 → 0.25（13 处引用，集中在文件预览）。
- `lodash` → `lodash-es`（17 处）。
- `mitt` 2 → 3、`markdown-it` 13 → 15、`driver.js` 1.3 → 1.8。

### Phase 7 — 收尾

摘掉 `.npmrc` 的 `legacy-peer-deps=true`，重装依赖，把真实 peer 冲突暴露出来并修掉。更新 `CLAUDE.md` 的命令与机制描述。可选：引入 `oxlint` 1.80 做快速预检（ESLint 保留做类型感知规则）。

---

## 四、需要你决策的点

**echarts 6 与 liquidfill 冲突。** `echarts-liquidfill` 2022-06 停更、peer 锁 `echarts ^5.0.1`，而 `vue-echarts@8` 要求 `echarts ^6`。只有 2 处水位图在用（`views/budget-process/04-monitor/overview1.vue`、`views/lyg/overview/hooks/pmEcharts.ts`）。三个选项：

- **A（推荐）** 升 echarts 6 + `vue-echarts` 8，用 custom series 重写这 2 个水位图。
- **B** echarts 停在 5.x 最新，`vue-echarts` 停在 6.x。整条 echarts 链路不动，代价是长期落后。
- **C** 升 echarts 6 但强行保留 liquidfill（覆盖 peer）。它注册的是自定义 series，也许能跑——但无人维护 + 未验证，不建议。

**`@visactor/vue-vtable` 只有 1 处使用**（`views/report/CostAnalysis.vue`），而项目已有 vxe-table 这套重型表格。要不要把它合并掉、减少一个表格库？包本身是活跃的，保留也没问题。

---

## 五、工作量与风险

粗略量级（不含联调）：Phase 0–3 加起来约 1 周；**Phase 4（EP v2）是数周级别**，2018 处 size + 973 处图标 + 1062 行主题重写是主体；Phase 5（Pinia，275 文件）约 1 周；Phase 6–7 约 1 周。

最大的三个风险，按顺序：

1. **EP v2 的视觉回归。** codemod 能保证编译通过，但保证不了 2018 个控件尺寸变化后布局不错位。这也是 Phase 0 必须先建 Playwright 截图基线的原因。
2. **Vuex → Pinia 的穿透参数。** 扁平大对象上的 `xxGlobalInfo` 是跨页面传参用的，类型是 `IObject`，静态分析追不全，只能靠 E2E 覆盖。
3. **Tailwind 4 与 EP 2 的样式优先级。** 两者都在 Phase 4/6 变动，且 `corePlugins.preflight: false` 是为了不干扰 EP——v4 下这个开关的等价写法变了，需要单独验证。

建议 Phase 4 之后、Phase 5 之前发一个可用版本到 SIT，让业务先跑一轮，不要把 EP 和 Pinia 两个大改动堆在同一个待验证版本里。
