# core-admin (budget-process)

项目过程管控平台前端。Vue 3 + Vite + Element Plus + Vuex 4 的管理后台，`src` 下约 1700 文件 / 49 万行。
产品定位见 `PRODUCT.md`，视觉规范见 `DESIGN.md`（青绿高密度设计系统，含完整色板与字号）。

## 命令

```bash
npm run dev        # Vite dev server，端口 8001，自动开浏览器
npm run build      # = build:prod，Node 堆内存开到 8G
npm run lint       # eslint --fix，范围 src/**/*.{vue,ts}
```

没有测试框架（无 vitest/jest/cypress/playwright 配置）。改动后的验证手段是 `npm run lint` 加 dev 下手工走查。

## 构建约定

- 别名：`@` → `src`，`@mock` → 同级 `mock` 目录（仅开发环境按需 import）。
- 所有 SCSS 自动注入 `@/assets/element-variables-green.scss` 和 `@/assets/style/mixin.scss`，写样式时不要重复 import。
- `vue` 指向 `vue/dist/vue.esm-bundler.js`（保留运行时模板编译）。
- dev 代理 `/api` → `http://localhost:10027/budget-process`，`vite.config.ts` 里有一串注释掉的后端 IP，切环境改这里。
- 环境文件：`.env.development` / `.env.production` / `.env.production.sit` / `.env.production.uat`。
- SVG 图标目录 `src/assets/icons/svg`，symbolId 规则 `icon-[dir]-[name]`。
- `@file-viewer/*` 和 `@univerjs/*` 有手工 alias 与 `optimizeDeps.include`，动这两块前先读 `vite.config.ts` 的注释。

## 目录职责

| 目录 | 职责 |
| --- | --- |
| `src/views/` | 业务页面，1307 文件，按业务域分子目录，是绝大多数改动的落点 |
| `src/api/` | 接口定义，目录结构与 `views` 的业务域基本对应 |
| `src/components/` | 跨业务域公共组件 |
| `src/hooks/` | 早期通用组合式函数（useTable、usePermission、useView、useProcess…） |
| `src/composables/` | 较新的、偏具体业务的组合式函数 |
| `src/service/` | `baseService.ts` CRUD 封装 + `apiService.ts` |
| `src/utils/` | 工具函数，含 http、cache、excel 导出、表格样式/格式化一组文件 |
| `src/store/` | Vuex store，`index.ts` 根 + `app.ts` 模块 |
| `src/router/` | `base.ts` 静态路由 + `index.ts` 守卫与动态注册 |
| `src/layout/` | 外壳布局：sidebar / header / tabs / setting / keepAlive 多页框架 |
| `src/core/` | 遗留 JS：`config.js`、`http/`、`mixins/global.js` |
| `src/constants/` `src/staticDict/` | 枚举常量与静态字典 |
| `src/types/` | 全局类型，`IObject` 等公共接口在 `interface.ts` |

`views` 体量排名（改动前先定位到域）：`service/` 414、`ai/` 155、`budget-process/` 90、`fy/` 70、`lyg/` 68、`deptDataVersion/` 57、`suzhou/` 55、`workflow/` 44、`matter/` 43、`finance/` 41。
`views/service/` 内部再分：`approval/` 69、`xq/` 64、`jointReview/` 63、`xmcs/` 49、`lslxJsc/` 35。

## 关键机制

**路由是服务端菜单驱动的。** `store.dispatch('initApp')` 拉菜单后与 `base.ts` 合并注册。视图组件靠路径约定匹配：路由 `path` 经 `toSysViewComponentPath` 转成 `/src/views{path}.vue`，通过 `import.meta.glob('/src/views/**/*.vue')` 查表。所以新增页面通常不用手写路由，但**文件路径必须和菜单 url 对应**（注意 `_` 会被替换成 `-`）。hash 模式。

**接口层范式统一。** `src/api/**` 下每个文件从 `@/service/baseService` 导入，导出形如 `export const getListPageData = (params: Params): Promise<Result> => baseService.post('xmExpert/getListPageData', params)`。`Result` / `Params` 接口在各文件内重复声明，属于既有风格。`baseService` 自动加 Base64 签名头（random / timeStamp / sign），超时 3600000ms。

**Vuex state 是扁平大对象。** 用户信息、tabs、routes、各类 `xxGlobalInfo` 穿透参数都挂在根 state 上，类型是 `IObject`，新增字段跟随现有写法。

**权限有两套入口。** `usePermission` 优先取 `UserRoleSelector` 通过 `PermissionInjectionKey` provide 的上下文，没有则自己拉。按钮级权限用 busicode（如 EDIT、DELETE），走 `utils/utils.ts` 的 `checkPermission`。

**表格走 `useTable` + ProTable。** `useTable(api, initParam, isPageable, dataCallBack, requestError, clearSelection)` 管 `tableData` / `pageable` / `searchParam` / `totalParam`，默认分页 size 20。表格视觉相关的工具集中在 `utils/tableCellStyle.ts`、`tableFormatter.ts`、`tableCellColorMapper.ts`、`tableSelectionHighlight.ts`。

## 局部约定

`src/views/ai/workbenchView/` 有自己的 `icons.ts` Lucide barrel，该模块内图标一律从这个 barrel 引入，不用 emoji、不用裸 SVG 资源；视觉标准按 `DESIGN.md` 从严执行。`src/views/ai/businessWorkbench/` 自带 `README.md`，改前先读。
