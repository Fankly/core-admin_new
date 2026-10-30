# 业务迁移记录

迁移日期：2026-10-30。源目录为 `/Users/fan/developer/core-admin/src/views`，目标为本项目 `apps/web/src/views`。

## 范围

旧项目的有效业务视图已迁入，目录结构与菜单 URL 保持对应。目标 `views` 共 1,514 个文件，其中 1,108 个 Vue 文件，包含当前项目已有的登录、首页、错误页等入口。同步补齐业务依赖的接口、组件、hooks、工具函数、字典及静态资源。

覆盖需求库、联合会审、储备库、预算编制和调整、预算事项、目标值、预算执行分析、工作流、AI 审核、财务、连云港全过程、苏州物料与规则管理等模块。

本项目现有登录、布局、菜单、标签页、HTTP 服务和 Pinia 状态管理继续作为统一基础。旧 `home.vue` 等基础入口没有覆盖当前实现，旧首页的业务子组件已迁入 `views/home`。

未迁入 `.DS_Store`、`home.vue.bak` 及以下两个仅含注释的空组件；二者没有有效组件代码，也没有有效调用方：

- `ai/reviewWorkBench/reviewDeatil/components/aiResult.vue`
- `lyg/projectProcessWarning/components/warningDetailModal.vue`

源项目文件未修改。

## 适配入口

- `src/store/business.ts`：将旧页面的 `useStore/getters/commit` 调用转到现有 Pinia store。用户、权限、业务上下文和标签页共用当前状态。新代码应直接调用 `src/store` 中的领域 store。
- `src/components/UserRoleSelector/interface/index.ts`：页面与角色组件共用 `CurrentUserRoleInjectionKey`。苏州 CRUD 层重导出同一个 Symbol，避免页面提供了角色却无法注入。
- `src/components/ProTable/interface/index.ts`：迁入表格共用 `EnumMapInjectionKey`。
- `src/app/workspace-plugins.ts`：注册旧业务自动组件、HTTP 辅助方法、字典和必要的 mixin，保留当前外壳控制页面布局。
- `src/router/view-registry.ts`：通过 Vite glob 注册业务 Vue 文件，菜单 URL 按现有规则映射到视图。`router/modules/workflow.ts` 与 `whiteList.ts` 恢复 86 条显式流程及穿透路由。
- `src/utils/export.ts`：补齐旧业务依赖的公式、小计、合计与排名导出能力。

同步适配 Element Plus 组件路径及尺寸、Lucide 包名、VXE 模态组件类型、Vue 组件名称声明、异步导入路径大小写。新增 wangEditor、Univer 依赖，业务样式统一使用 Less，主题兼容变量及 mixin 由 Vite 注入。Univer 固定在 0.20.1，其图标依赖固定为 1.1.1，避免新版本图标导出不兼容。

## 运行及验证

使用项目要求的 Node.js 24+、pnpm 11+，在仓库根目录执行：

```sh
pnpm install
pnpm dev
# 使用已有业务模拟数据（菜单仍依赖开发后端）
pnpm mock

pnpm --filter budget-process check:business
pnpm --filter budget-process test
pnpm --filter budget-process build
pnpm --filter budget-process typecheck
```

大量业务组件增加了构建与类型检查内存需求。构建脚本配置 8 GB 堆上限，完整类型检查配置 12 GB 堆上限。首次运行需要较多内存与时间。

本次验证结果：

- 生产构建通过，包含所有 glob 注册的业务组件。第三方依赖仍有构建警告。
- 完整单元测试通过：25 个文件、137 项。包含迁移状态适配、业务上下文键映射、路由解析和角色组件加载后渲染业务内容的回归验证。
- `check:business` 通过：本轮检查 1,263 个 Vue 文件、7,690 个本地导入/导出引用，覆盖 SFC 解析、本地路径及大小写、残留 Vuex 导入、旧字符串角色注入。
- 浏览器已验证模拟数据下的总览图表/表格切换及金额穿透、预算执行分析筛选界面、待办列表与名称查询（45 条过滤至 8 条）、智能审核列表和详情、业务工作台项目清单。
- 严格 TypeScript 检查尚未通过，详见下一节。构建通过不代表严格类型检查通过，也不代表所有业务分支已完成端到端验收。

## 已知限制

1. 本轮完整类型检查仍有 **763 条诊断**，主要涉及旧 Element Plus/VXE 泛型、空数组推断、可空表格引用、未标注的回调参数，以及部分旧页面声明不完整。没有通过关闭严格检查、排除业务目录或添加 `@ts-nocheck` 隐藏这些诊断。后续可按 `pnpm --filter budget-process typecheck` 的文件路径逐模块处理。该数量是本轮检查快照，后续并行修改可能改变结果。
2. 真实开发后端的 `/sys/menu/getMenuByUrl?url=/service/overview/index` 返回 `TooManyResultsException`，说明该 URL 匹配了两条菜单记录。真实总览页面的权限初始化因此失败，需要后端清理重复菜单记录；前端已显示可重试错误。模拟总览页面可正常验证。
3. 模拟数据只覆盖已有 fixture 的业务场景。补齐了智能审核角色权限和业务工作台缓存菜单编码的模拟支持，以及待办按业务名称过滤。真实角色、组织数据和接口权限仍需在对应业务环境验收。
4. 本次未执行真实业务新增、审批、提交、删除等数据写入操作，也未宣称所有 1,108 个视图组件的业务分支均已验证。

## 后续维护建议

新增或迁改页面后先运行 `check:business`，再执行受影响模块的测试与生产构建。改写旧页面时逐步直接使用 Pinia store，并继续使用共享的角色和表格注入键。按模块完成严格类型修正及真实角色验收后，再移除对应兼容调用。
