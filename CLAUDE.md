# core-admin (budget-process)

项目过程管控平台前端。pnpm workspace monorepo，业务应用是 Vue 3 + Vite + Element Plus + Pinia 的管理后台，`apps/web/src` 下 218 文件 / 约 2.6 万行。

这是**骨架仓库**：登录、布局、路由、权限、表格封装、接口层范式都已就位，但业务页面只有 `login` / `home` / `baseHome` / `iframe` / `error` 五处，`views` 下没有业务域子目录。
同名的 `/Users/fan/developer/core-admin` 是体量大得多的完整仓库（约 1700 文件、`views` 下按业务域分 1300+ 文件）；两者不要混淆，codegraph 索引默认指向那一个，查本仓库要显式传 `projectPath`。

## 仓库结构

```
apps/web/            业务应用（原仓库根，包名 budget-process）
packages/tsconfig/         @repo/tsconfig        base.json / vue-app.json
packages/eslint-config/    @repo/eslint-config   index.js（纯 TS）/ vue.js（Vue 应用）
packages/prettier-config/  @repo/prettier-config
```

包管理器是 pnpm，锁文件 `pnpm-lock.yaml`，**不要用 npm / yarn 装依赖**。共享工具链版本在 `pnpm-workspace.yaml` 的 `catalog:` 里，各包用 `"eslint": "catalog:"` 引用。

## 命令

根目录执行（会转发到 `apps/web`）：

```bash
pnpm dev           # Vite dev server，端口 8001，自动开浏览器
pnpm build         # = build:prod，production 模式
pnpm build:sit     # / pnpm build:uat
pnpm lint          # 递归跑所有包的 lint（eslint --fix）
pnpm typecheck     # 递归跑 vue-tsc --noEmit
```

只作用于单个包时用 `pnpm --filter budget-process <script>`，或直接进 `apps/web` 执行。

`package.json` 里有 `test`（vitest）与 `e2e`（playwright）脚本且依赖已装，但仓库中没有任何测试文件与 playwright 配置。改动后的实际验证手段是 `pnpm lint` + `pnpm typecheck` + dev 下手工走查。

## 构建约定

- 别名：`@` → `apps/web/src`，`@mock` → `apps/web/mock`（仅开发环境按需 import）。
- 所有 SCSS 自动注入 `@/assets/element-variables-green.scss` 和 `@/assets/style/mixin.scss`，写样式时不要重复 import。
- `vue` 指向 `vue/dist/vue.esm-bundler.js`（保留运行时模板编译）。
- dev 代理 `/api` → `http://localhost:10027/budget-process`，`apps/web/vite.config.ts` 里有一串注释掉的后端 IP，切环境改这里。
- 环境文件在 `apps/web/`：`.env.development` / `.env.production` / `.env.production.sit` / `.env.production.uat`。
- SVG 图标目录 `apps/web/src/assets/icons/svg`，symbolId 规则 `icon-[dir]-[name]`。
- `@file-viewer/*` 与 `@univerjs/*` 有手工 alias 与 `optimizeDeps.include`，动这两块前先读 `apps/web/vite.config.ts` 的注释。alias 用 `require.resolve(pkg + '/package.json')` 反推包根，不要改回写死 `node_modules/...` 路径——pnpm 下布局不固定。
- `@file-viewer/docx`、`@file-viewer/doc` 是 `renderer-word` 的间接依赖，`src` 从未 import，但 `optimizeDeps.include` 要预构建，所以在 `apps/web/package.json` 里显式声明为直接依赖。升级 `renderer-word` 时同步这两个版本。
- pnpm 配置全部写在 `pnpm-workspace.yaml`（camelCase）。**`.npmrc` 在 pnpm 11 下完全不被读取**，`shamefully-hoist` 之类 kebab-case 键写进去毫无作用，改完用 `pnpm config list` 验证。

## Tailwind

Tailwind v4，CSS-first 配置，**没有 tailwind.config.js**。全部配置在 `apps/web/src/assets/styles/tailwind.css`：

- 类名前缀是 `tw:`（变体式语法），不是 v3 的 `tw-`。写 `tw:flex`、`tw:hover:bg-red-600`。
- 不引入 preflight（等价于原 `corePlugins.preflight: false`），所以没有 box-sizing 与 border-style 重置，`tw:border` 单独用不出边框。
- 间距由 `--spacing` 乘数动态生成，`tw:p-4.5` 直接可用，不需要自定义 token。
- 全仓实际只有 2 个文件用 Tailwind（`layout/header/CustomerService.vue`、`components/AutoImport/SingleContainer/index.vue`），绝大多数样式走 less/scss 与 Element Plus 变量覆盖。

## 目录职责

以下均相对 `apps/web/`：

| 目录 | 职责 |
| --- | --- |
| `src/views/` | 业务页面，当前仅 `login` / `home` / `baseHome` / `iframe` / `error`，新业务页落在这里 |
| `src/api/` | 接口定义，16 文件；新增业务域时目录结构与 `views` 对应 |
| `src/components/` | 跨业务域公共组件 |
| `src/hooks/` | 通用组合式函数（useTable、usePermission、useView…） |
| `src/service/` | `baseService.ts` CRUD 封装 + `apiService.ts` |
| `src/ssl/` | 本地 https 证书，`vite.config.ts` 按需引用 |
| `src/utils/` | 工具函数，含 http、cache、excel 导出、表格样式/格式化一组文件 |
| `src/store/` | Pinia store，`index.ts` 导出 `useAppStore` |
| `src/router/` | `base.ts` 静态路由 + `index.ts` 守卫与动态注册 |
| `src/layout/` | 外壳布局：sidebar / header / tabs / setting / keepAlive 多页框架 |
| `src/core/` | 遗留 JS：`config.js`、`http/`、`mixins/global.js` |
| `src/constants/` `src/staticDict/` | 枚举常量与静态字典 |
| `src/types/` | 全局类型，`IObject` 等公共接口在 `interface.ts` |

## 关键机制

**路由是服务端菜单驱动的。** `useAppStore().initApp()` 拉菜单后与 `base.ts` 合并注册。视图组件靠路径约定匹配：路由 `path` 经 `toSysViewComponentPath` 转成 `/src/views{path}.vue`，通过 `import.meta.glob('/src/views/**/*.vue')` 查表。这个 glob 是 Vite root 相对路径，root 即 `apps/web`，所以 monorepo 下无需改写。新增页面通常不用手写路由，但**文件路径必须和菜单 url 对应**（注意 `_` 会被替换成 `-`）。hash 模式。

**接口层范式统一。** `src/api/**` 下每个文件从 `@/service/baseService` 导入，导出形如 `export const getListPageData = (params: Params): Promise<Result> => baseService.post('xmExpert/getListPageData', params)`。`Result` / `Params` 接口在各文件内重复声明，属于既有风格。`baseService` 自动加 Base64 签名头（random / timeStamp / sign），超时 3600000ms。

**Pinia state 是扁平大对象。** `useAppStore` 一个 store 装下全部全局状态：用户信息、tabs、routes、各类 `xxGlobalInfo` 穿透参数，类型 `AppState extends IObject`（索引签名保留 `store[flag]` 动态取值）。新增字段跟随现有写法。批量覆盖用 `updateState()`（内部 `Object.assign`，而非 `$patch` 的递归合并）。

**权限有两套入口。** `usePermission` 优先取 `UserRoleSelector` 通过 `PermissionInjectionKey` provide 的上下文，没有则自己拉。按钮级权限用 busicode（如 EDIT、DELETE），走 `utils/utils.ts` 的 `checkPermission`。

**表格走 `useTable` + ProTable。** `useTable(api, initParam, isPageable, dataCallBack, requestError, clearSelection)` 管 `tableData` / `pageable` / `searchParam` / `totalParam`，默认分页 size 20。表格视觉相关的工具集中在 `utils/tableCellStyle.ts`、`tableFormatter.ts`、`tableCellColorMapper.ts`、`tableSelectionHighlight.ts`。

## 局部约定

图标走 `vite-plugin-svg-icons-ng`：把 svg 放进 `src/assets/icons/svg/`，用 `<svg-icon :name="'icon-<目录>-<文件名>'">` 引用（symbolId 规则见 `vite.config.ts`），不要手写内联 svg。组件没有全局注册，每个文件自己 `import SvgIcon from '@/components/base/svg-icon'`。注意 `button.svg` 当前 SVGO 优化失败（构建期 warning，该图标被跳过）。
