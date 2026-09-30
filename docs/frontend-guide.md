# core-admin 前端开发规范

> 本规范基于 [ocxers/frontend-guide](https://github.com/ocxers/frontend-guide) 整理的前端编码规范参考体系,结合本仓库
> (pnpm workspace monorepo,Vue 3 + Vite + Element Plus + Pinia)的既有约定裁剪而成。
>
> 一句话原则:**与既有代码保持一致,优先服从仓库里已经跑通的范式,而不是个人偏好。**
> 规范与 ESLint / Prettier 冲突时,以工具链配置为准,并同步修改本文档。

## 参考基准

| 来源 | 链接 | 本项目取舍 |
| --- | --- | --- |
| Airbnb JS Style | https://github.com/airbnb/javascript | 命名、变量、函数部分参照 |
| Google JS Style | https://google.github.io/styleguide/jsguide.html | 注释与文档约定参照 |
| 百度 ecomfe/spec | https://github.com/ecomfe/spec | CSS 组织方式参照 |
| 腾讯 AlloyTeam CodeGuide | http://alloyteam.github.io/CodeGuide/ | HTML/模板书写参照 |
| 网易 NEC 规范 | http://nec.netease.com/standard | CSS 命名参照 |
| 凹凸实验室 | https://guide.aotu.io/index.html | 工程化、目录约定参照 |
| Vue 官方文档 · 简介 | https://cn.vuejs.org/guide/introduction.html | API 风格选择、SFC 定位 |
| Vue 官方风格指南 | https://cn.vuejs.org/style-guide/ | Vue 3 强约束(优先级 A/B) |
| eslint-plugin-vue | `@repo/eslint-config/vue` | **实际强制执行的唯一标准** |

> 说明:上表是"思想来源"。本仓库真正的硬约束由 ESLint / Prettier / vue-tsc 三者执行,其余条目是被评审约束的软约定。

---

## 1. 工程与工具链

### 1.1 包管理器

- 只用 **pnpm**,禁止 `npm install` / `yarn`。锁文件是 `pnpm-lock.yaml`。
- 共享工具链版本集中在 `pnpm-workspace.yaml` 的 `catalog:`,各包用 `"eslint": "catalog:"` 引用,**不要在子包里写死版本**。
- pnpm 配置项全部写在 `pnpm-workspace.yaml`(camelCase)。`.npmrc` 在 pnpm 11 下不被读取,写 kebab-case 键无效;改完用 `pnpm config list` 验证。
- 含构建脚本的依赖需在 `onlyBuiltDependencies` / `allowBuilds` 显式放行,不做"全量信任"。

### 1.2 提交前必过

```bash
pnpm lint        # 递归 eslint --fix
pnpm typecheck   # 递归 vue-tsc --noEmit
pnpm test        # Vitest 回归测试（HTTP 用例需要本地端口）
pnpm build       # 生产构建
pnpm dev         # 手工走查
```

Vitest 配置在 `apps/web/vitest.config.ts`,用例与源文件就近放置,使用 `*.test.ts`。HTTP 用例通过本地服务验证真实请求,组件用例使用真实 Vue 组件;不得通过 mock 掩盖实际失败。Playwright 尚无配置,`pnpm e2e` 暂不能作为验证手段。新增功能时**优先补 vitest 用例**;涉及交互的改动仍需提供 dev 环境下的验证路径。

### 1.3 目录职责(相对 `apps/web/`)

| 目录 | 放什么 | 不放什么 |
| --- | --- | --- |
| `src/views/` | 业务页面,路径必须与菜单 url 对应 | 公共逻辑、通用组件 |
| `src/api/` | 按业务域拆分的接口定义 | 业务判断、UI 状态 |
| `src/components/` | 跨业务域公共组件 | 只在单页面用的一次性组件 |
| `src/hooks/` | 通用组合式函数 | 组件 |
| `src/service/` | `baseService` / `apiService` 请求封装 | 业务接口 |
| `src/store/` | Pinia 全局状态 | 组件局部状态 |
| `src/router/` | 静态路由 + 守卫 | 页面组件 |
| `src/utils/` | 纯函数工具 | 有副作用的全局单例 |

新增业务域时,`views/<域>` 与 `api/<域>` 目录结构保持对应。

---

## 2. 命名规范

### 2.1 通用

| 类型 | 约定 | 示例 |
| --- | --- | --- |
| 目录 | kebab-case | `user-role-selector`(历史遗留的 PascalCase 组件目录保持不动) |
| 组件文件 | PascalCase 或 kebab-case,与目录约定一致 | `ProTable/index.vue`、`svg-icon/index.vue` |
| 普通 ts 文件 | camelCase | `useTable.ts`、`baseService.ts` |
| 类型/接口/类 | PascalCase,接口不加 `I` 前缀(全局公共接口除外) | `TableStateProps`、`AppState` |
| 变量/函数 | camelCase | `getTableList`、`searchParam` |
| 常量 | UPPER_SNAKE_CASE | `REQUEST_TIMEOUT`、`PermissionInjectionKey` |
| 布尔值 | `is` / `has` / `show` / `can` 前缀 | `isPageable`、`hasPermission`、`showSearch` |
| 事件处理 | `handleXxx` / `onXxx` | `handleSizeChange`、`initComponentMap` |
| 异步数据获取 | `getXxx` / `fetchXxx` | `getTableList`、`fetchPermissions` |

### 2.2 API 层

接口函数名即动词短语,路径用字符串字面量:

```ts
// src/api/<域>/index.ts
import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

interface Params {
  [key: string]: any
}

export const getListPageData = (params: Params): Promise<Result> => baseService.post('xmExpert/getListPageData', params)
```

- **既有风格**:`Result` / `Params` 在各 api 文件内重复声明。新增文件沿用此风格,不要为统一而做一次性大重构。
- 路径**不加**前导 `?`,保持后端给的相对路径;baseURL 由环境变量 `VITE_APP_API` 注入。
- 导出 `exportData` 用 `baseService.export` / `exportGet`,`download` 用 `baseService.download`。
- 复杂或需要 service 路由的场景派生 `BaseMethod`(`src/api/base/BaseMethod.ts`),通过构造参数指定 `ServiceKey`。

### 2.3 Store

- 只有 `useAppStore` 一个 store,state 是**扁平大对象**,类型 `AppState extends IObject`(索引签名保留 `store[flag]` 动态取值)。
- 批量覆盖用 `updateState()`(`Object.assign`),不要用 `$patch` 的递归合并。
- getter 命名以 `get` 开头(`getUserMsg`),mutation 命名以 `set` 开头(`setMenuMsg`)。
- 新增字段跟随现有注释风格,在 state 里写明用途。

### 2.4 CSS / class

- 业务样式走 **SCSS/Less**,页面局部样式一律 `<style scoped>`。
- 全局 Element Plus 变量覆盖集中在 `src/assets/css/element.less`;主题变量见 `src/assets/theme/`。
- **不要重复 import** Vite `additionalData` 已全局注入的 `style/variables.less`。当前 SCSS 没有自动注入;遗留 SCSS 文件不代表已经配置预处理器。
- Tailwind v4 **CSS-first**,类名前缀是 `tw:`(变体式),不是 `tw-`;没有 `tailwind.config.js`。用法规范见 `src/assets/styles/tailwind.css` 顶部注释。
- Tailwind 不引入 preflight,`tw:border` 单独用不出边框(无 border-style 重置),需要自己写 border-style。
- 当前 Tailwind 用于 `layout/header/CustomerService.vue`,新代码默认沿用已配置的 Less;要用 Tailwind 或新增 SCSS 预处理配置需在评审中说明理由。

---

## 3. TypeScript

- `strict: true`(继承自 `@repo/tsconfig/base.json`),新代码不得依赖 `any` 蒙混过关。历史 `any` 可以不对其做无谓改动。
- 接口/类型定义就近放置:页面级类型放组件内或同目录 `interface/`;跨域公共类型放 `src/types/`。
- 公共索引类型统一用 `IObject`(`src/types/interface.ts`),不要临时 `Record<string, any>` 造轮子。
- 类型导入优先 `import type`;`vue-tsc` 对仅类型使用的 import 会报错。
- 平台/库的类型兼容问题(pnpm 严格隔离)按 `main.ts` 注释的方式处理:augment `'vue'` 而非 `'@vue/runtime-core'`,不要引入间接依赖做类型来源。
- 别名:`@` → `apps/web/src`,`@mock` → `apps/web/mock`。禁止写相对路径 `../../../`。
- `import.meta.env.VITE_*` 的类型声明在 `src/types/env.d.ts`,新增环境变量先补类型。

---

## 4. Vue 组件

### 4.1 API 风格:新代码用组合式 API + SFC

Vue 官方把选项式与组合式描述为"同一个底层系统所提供的两套不同的接口",并明确建议:**构建完整单页应用时用组合式 API + 单文件组件**。本仓库正是这个场景,所以:

- **新组件一律 `<script setup lang="ts">`**,这是组合式 API 在 SFC 中的推荐写法。
- 现存组件同时使用 `<script setup>` 与 `defineComponent({ setup() })`,`TreeSelect` / `TableBox` / `baseHome` 等仍有选项式写法。**这些是历史代码,不要为了统一风格去批量改写**;只在实际动到某个文件、且改动范围本就覆盖整个 script 时顺手迁移。
- 改造老组件时按官方的等价关系迁移:`data()` → `ref` / `reactive`,`methods` → 普通函数,`computed` 选项 → `computed()`,`created` / `mounted` → `onMounted`(`created` 里的同步逻辑直接放 setup 顶层)。迁移完必须把 `this.$message` 之类实例属性换成显式 import,`baseHome.vue` 就依赖 `this.$message`。

响应式状态默认用 `ref`(仓库里 `ref` 56 处 : `reactive` 15 处);只在状态是一组固定字段的对象、且不需要整体替换时用 `reactive`。组件对象、`import.meta.glob` 的 loader 这类不该被深层代理的值必须用 `shallowRef`,原因见 `views/home.vue` 的注释。

### 4.2 SFC 结构与组件名

统一顺序:`<template>` → `<script setup lang="ts">` → `<style scoped lang="...">`。

**组件名不要写成 `<script setup name="...">`。** 仓库没装名称注入插件,这个 attribute 会被静默忽略;原有无效声明已清理。需要显式组件名时二选一:

- Vue 3.3+ 的 `defineOptions`,写在 `<script setup>` 内(推荐,单块搞定):

```vue
<script setup lang="ts">
defineOptions({ name: 'ProTable' })
</script>
```

- 或仓库里既有的双 script 块写法(`Pagination.vue`、`error/404.vue` 等 7 个文件):

```vue
<script lang="ts">
export default { name: 'Pagination' }
</script>
<script setup lang="ts">
// 逻辑
</script>
```

多数情况下**不需要手写组件名**:`<script setup>` 默认以文件名推导名称,足够 devtools 与递归引用使用。keep-alive 也不依赖它 —— `layout/view/base-view.vue` 的 `:include="store.caches"` 匹配的是服务端菜单生成的**路由名**(见 `utils/index.ts` 的 `getKeepAliveRouterName`),与组件 `name` 无关。

### 4.3 Props / Emits

类型化声明优先,`withDefaults` 给默认值;复杂对象默认值用工厂函数:

```ts
interface Props {
  data: IObject
  showSearch?: boolean
}
const props = withDefaults(defineProps<Props>(), { showSearch: false })
const emit = defineEmits<{
  (e: 'search', value: IObject): void
  (e: 'close'): void
}>()
```

- **默认按 `props.x` 访问**,不要解构。Vue 3.5 起 `<script setup>` 里解构出的 props 由编译器保持响应性(仓库是 3.5.42,`vue/no-setup-props-destructure` 也已关闭),但全仓无一处这么写 —— 沿用 `props.x` 与邻居保持一致。传给组合式函数时用 `toRefs(props)` / `toRef(props, 'x')`。
- 事件名声明用 camelCase、模板上用 kebab-case,Vue 会自动转换:`defineEmits<{ (e: 'settingClick'): void }>()` 对应 `@setting-click`。仓库既有代码两种拼法都有(`custom-event-name-casing` 已关),新代码按上面这条统一。
- 双向绑定用 `defineModel()`(3.4+),不要手写 `modelValue` prop + `update:modelValue` 事件。多个绑定给参数:`defineModel('searchVisible')` 对应 `v-model:search-visible`,用法见 `ProTable` 与 `ToolbarButtons` 之间的传参。
- 需要向父组件暴露方法时用 `defineExpose`(仓库 7 处),不要靠父组件直接摸子组件内部状态。

### 4.4 组件复用与拆分

- 一个文件一个组件(`vue/one-component-per-file` 当前关闭,但新代码遵守)。
- 只有单页面用的组件放页面同级目录;两个及以上业务域复用的组件才提到 `src/components/`。
- 公共组件导出 `index.ts` 或 `index.vue`,引用时用目录名,如 `import ProTable from '@/components/ProTable'`。

### 4.5 逻辑复用:组合式函数

组合式 API 的主要收益是**把有状态逻辑抽成函数复用**,而不只是换一种写法。判断标准:

- 逻辑只在一个组件里用 → 留在该组件的 `<script setup>`,不要为"看起来整齐"提前抽。
- 同一段带响应式状态的逻辑出现第二次 → 抽到 `src/hooks/`,文件名 `useXxx.ts`,返回 `ref` / `computed` 而不是裸值(否则调用方拿不到响应性)。
- 纯计算、无状态、不碰生命周期 → 放 `src/utils/`,不要包成 hook。

现有 `hooks/` 是范本:`useTable`、`usePermission`、`useSelection`、`useView`、`useDownload` 等 8 个。`usePermission` 同时演示了官方的**依赖注入**用法 —— 先 `inject<PermissionContext>(PermissionInjectionKey)` 消费上层上下文,没有才退回自己拉数据。跨层传参走 `provide` / `inject`,注入 key 用 `InjectionKey<T>` 显式标注类型(见 `components/UserRoleSelector/interface/index.ts`),不要用字符串 key,也不要靠逐层 props 透传。

组合式函数必须在 `setup` 同步上下文里调用(含生命周期注册),不能放进 `await` 之后或回调里。

### 4.6 图标

- 用 `vite-plugin-svg-icons-ng`:svg 放 `src/assets/icons/svg/`,symbolId 规则 `icon-[dir]-[name]`。
- 引用方式:

```vue
<script setup lang="ts">
import SvgIcon from '@/components/base/svg-icon'
</script>
<template>
  <svg-icon :name="'icon-<目录>-<文件名>'" />
</template>
```

组件**没有全局注册**,每个文件自己 import。不要手写内联 `<svg>`。
注意 `button.svg` 当前 SVGO 优化失败会被跳过,不要用它。

### 4.7 权限

两套入口,按组件所处位置选择:

- `UserRoleSelector` 的父级通过 `CurrentUserRoleInjectionKey` 提供 `Ref<UserRole>`,页面放在组件默认插槽内;后代用 `usePermission()` 消费 `PermissionInjectionKey`。这两个 key 从 `components/UserRoleSelector/interface` 导入,不要使用字符串 key。
- 角色、按钮权限请求统一放在 `api/permission`;无上层上下文时,`usePermission().fetchPermissions()` 自行加载。切换菜单/角色时立即清除旧权限,只接受最新请求结果;清除或销毁后在途响应不得恢复旧权限。
- 按钮级权限:优先用全局指令 `v-permission="'EDIT'"`(busicode,如 `EDIT`、`DELETE`),它会跟随 `store.permissions` 变化重算并阻止无权限点击;也可在逻辑中调 `checkPermission(store.permissions, key)`。
- 权限标识常量放 `src/constants/`,不要散落魔法字符串。

### 4.8 表格

- 一律 `useTable` + `ProTable`,不要手写裸 `el-table` + 自己管分页。
- `useTable(api, initParam, isPageable, dataCallBack, requestError, clearSelection, initialPageSize)`,默认分页 size 20,最后一个参数可省略。`useTableSize` 为默认 size 100 的兼容包装,不复制查询逻辑。
- `initParam`、`isPageable` 支持 ref/getter,从组件传入时用 `toRef(props, 'initParam')` 等保持整体替换的响应性。`totalParam` 仅保存已提交的搜索条件,查询时合并初始化参数与分页;只有最新请求可以更新结果与 loading。
- 列定义、搜索项类型见 `src/components/ProTable/interface`。
- 单元格样式/格式化统一走 `src/utils/tableCellStyle.ts`、`tableFormatter.ts`、`tableCellColorMapper.ts`、`tableSelectionHighlight.ts`,不要在模板里散写格式化逻辑。

---

## 5. 路由与页面

- 路由是**服务端菜单驱动**的,不要手写业务路由注册。
- 视图组件按路径约定匹配:路由 `path` 经 `toSysViewComponentPath` 转成 `/src/views{path}.vue`,由 `import.meta.glob('/src/views/**/*.vue')` 查表。
- 因此**新增页面的文件路径必须与菜单 url 对应**,注意 `_` 会被替换为 `-`。
- hash 模式(`createWebHashHistory`)。
- 守卫写成"返回值即导航结果"的新式写法(vue-router 5 已弃用 `next()`):`return true` 放行、`return false` 取消、`return '/path'` 重定向。
- 页面里取 store 必须在函数/守卫内部调用 `useAppStore()`,模块顶层取会因 pinia 未安装而报错。

---

## 6. 网络请求

- 所有请求经 `src/service/baseService`。它自动附加签名头(random / timeStamp / sign),超时 `3600000ms`。
- `FormData` 交给请求层处理 multipart boundary,不要设置 JSON 请求头。查询参数用 `baseService.get(path, params)`,避免直接插值拼接导致 `&`、`#` 等字符改变请求含义。
- 业务代码**不直接** import axios;需要用 `BaseMethod` 或 `apiService`。
- 请求参数、错误处理在 hook 或页面层完成,`api/` 层保持纯函数。
- 导出/下载统一用 `baseService.export` / `exportGet` / `download`,不要自己拼 blob。
- 统一的错误提示走 `src/utils/error.ts` 的 `handleError(error, message)`,接受 `unknown` 并处理 Error/字符串;新代码优先走封装。`src/utils/message.ts` 的 `showHelpMsg` 是帮助信息弹窗,与错误无关。

---

## 7. 代码风格(Prettier 硬约束)

由 `@repo/prettier-config` 统一,提交即校验,**不要手动对抗**:

| 项 | 值 |
| --- | --- |
| 行宽 | 150 |
| 缩进 | 2 空格,空格非 Tab |
| 分号 | 不要 |
| 引号 | 单引号 |
| 尾逗号 | 无 |
| 换行 | `endOfLine: auto`(仓库 `.editorconfig` 为 lf) |

其他:

- 文件结尾保留一个空行(`insert_final_newline = true`)。
- 不留行尾空白(`trim_trailing_whitespace = true`,Markdown 除外)。
- 注释写"为什么",不写"是什么"。仓库里既有的大量中文实现注释(如 `main.ts` 的 pnpm 隔离说明、`tailwind.css` 的 v4 差异说明)是标杆,新增复杂逻辑要给出背景与坑。
- `console.log` 不允许进入生产代码;共享 ESLint 配置通过 `no-console` 强制执行,保留 `console.warn` / `console.error` 诊断。

---

## 8. HTML / 模板书写

- 属性多于 3 个或长度超行宽时换行,顺序:指令 → `v-bind` → 事件 → 其他。
- 自闭合标签统一,`<img>` / `<input>` / 组件空内容用自闭合。
- 多用语义化标签(`<header>` / `<nav>` / `<main>`),少用无意义 `<div>`。
- class 命名参照网易 NEC:语义化、短横线连接,避免拼音与无意义缩写。
- `v-for` 必须带 `:key`,key 用稳定 id,不用数组下标(静态列表除外)。

---

## 9. Git 提交

- 一个提交只做一件事;避免把格式化全仓 diff 与功能改动混在一次提交里。
- commit message 建议 `type(scope): subject`,type 取 `feat` / `fix` / `refactor` / `docs` / `style` / `chore` / `perf` / `test`;scope 用业务域或包名。
- 例:`fix(process44): 修正关联率区间校验`,`chore(eslint): 迁移根配置到共享包`。
- 不要在提交里带 `node_modules`、`dist`、本地证书、`.DS_Store`(见 `.gitignore`)。
- 不提交注释掉的死代码与临时 `debugger`。

---

## 10. 评审清单(提交自检)

- [ ] `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 全绿。
- [ ] 新增页面路径与菜单 url 一致,能通过 glob 匹配到组件。
- [ ] 新接口放在 `api/<域>`,只经 `baseService` 调用。
- [ ] 新全局状态字段已加入 `AppState` 并有注释。
- [ ] 表格用 `useTable` + `ProTable`,`v-for` 有稳定 key。
- [ ] 样式 scoped,未重复 import 全局 scss,未散写魔法色值。
- [ ] 按钮级权限给了 `v-permission` 或逻辑校验。
- [ ] 无 `console.log`、无死代码、无 `debugger`。
- [ ] 复杂逻辑补了"为什么"注释;行为变更给出了验证路径。

---

## 附:规范冲突时怎么办

1. **工具链 > 本文档**:ESLint/Prettier/vue-tsc 报错就先改代码。
2. **既有范式 > 个人偏好**:同目录邻居怎么写,你就怎么写。
3. **本文档 > 外部参考**:Airbnb/Google 等只作思想来源,具体取值以本仓库为准。
4. 要改约定,**先改工具链配置与本文档,再改代码**,并在 PR 描述里说明影响面。
