# Smart Admin 架构参考与重构记录

日期：2026-11-02。范围：架构与工程规范；保留 Vue、Element Plus、现有业务、服务端菜单 URL、接口返回包和签名协议。

## 参考依据

读取了用户指定的 [Smart Admin TypeScript 项目](https://github.com/1024-lab/smart-admin/tree/master/smart-admin-web-typescript)。目录页返回的提交为 `2dbf3c285afbb187efb19630c4dd70664067cbc2`，主要参考：

- [main.ts](https://github.com/1024-lab/smart-admin/blob/2dbf3c285afbb187efb19630c4dd70664067cbc2/smart-admin-web-typescript/src/main.ts)：明确区分获取登录信息、构建动态路由和应用安装。
- [router/index.ts](https://github.com/1024-lab/smart-admin/blob/2dbf3c285afbb187efb19630c4dd70664067cbc2/smart-admin-web-typescript/src/router/index.ts)：服务端菜单驱动路由，按路径查找懒加载视图。
- [lib/axios.ts](https://github.com/1024-lab/smart-admin/blob/2dbf3c285afbb187efb19630c4dd70664067cbc2/smart-admin-web-typescript/src/lib/axios.ts)：统一请求、认证、错误和下载入口。
- 源码目录中的 `api`、`config`、`constants`、`plugins`、`store/modules` 分工。

本项目已有领域 store、设计系统、路由适配和请求封装，因此保留这些成熟部分，重点补齐依赖方向和生命周期。上游使用 Ant Design Vue、Bearer token 和不同业务码；这些不适用于当前后端，本次未迁移。实现为当前项目独立编写，没有复制上游业务页面。

## 实际落地

### 1. 应用组装与工作区生命周期

`app/bootstrap.ts` 按顺序安装 Pinia、主题、指令、UI 插件、请求副作用和路由守卫，再挂载路由和应用。`router/index.ts` 只负责创建路由实例与保留既有动态导航导出。

`app/workspace.ts` 管理菜单、用户、插件与路由就绪，守卫通过 `router/workspace.ts` 的能力接口调用它。仍在首次进入受保护页面时启动加载，以保留登录后的初始化、加载反馈和错误页重试；初始化实现不再堆在导航守卫中。

- 合并同一轮初始化请求，插件与菜单都完成后才注册路由和标记 ready。
- `menu.isLoaded` 使用显式状态，服务端返回空数组也算成功，避免重复请求和重定向。
- 重置时恢复完整基础路由表，同时移除菜单、临时详情页和未命名兜底路由。
- 每轮初始化使用 generation；退出后的迟到菜单或插件结果不能恢复旧会话，也不能清除新一轮会话。
- 初始化失败恢复基础路由，重试重新加载菜单和插件。
- 独立流程页、pop 页面、hash 路由、菜单路径匹配与现有布局规则保持兼容。

### 2. 请求能力与 UI 副作用分离

```text
API → baseService → http/client → http/transport
                      ↑                ↑
                 配置、缓存        Axios、错误、请求身份

app/request-effects → 注入登录跳转与 loading → router / shell store
```

- `service/http/transport.ts` 提供 `createHttpClient`；每个实例拥有自己的 Axios 拦截器和并发请求缓存，可在无 Vue、Pinia、Router 的环境使用。
- `service/http/client.ts` 连接默认配置和 token 缓存，保留旧默认导出及公开 HTTP 入口。
- `app/request-effects.ts` 安装 401 登录跳转；并发失效响应只触发一次正在进行的跳转，旧 token 的迟到 401 不会清除新 token。
- `BaseMethod` 通过 `service/request-loading.ts` 获取单次请求的清理函数，不再读取 Pinia。应用按请求计数，全部并发请求结束后才关闭全屏 loading，失败也会释放。
- 保留签名头、multipart boundary、长整数解析、Blob 下载、错误归一化，以及只合并 GET/HEAD/OPTIONS 的行为。

### 3. 配置与接口类型归属

- 运行时配置统一在 `config/app.ts`；`constants/app.ts` 继续转发，已有导入路径有效。
- 普通 HTTP 默认 30 秒、历史业务请求默认 3600000ms，集中配置且保持原行为。
- 菜单和用户请求归入 `api/system/session.ts`，store 不再维护接口 URL。
- 联合会审会议类型归入 `api/service/IhhsMeeting/types.ts`；角色响应类型归入 `api/permission/types.ts`。
- 原页面和组件类型路径保留 type re-export；API 不再反向导入视图或组件目录。

### 4. 可执行工程规范

新增 `pnpm check:architecture`：

1. 用 Node 测试检查扫描器与规则本身。
2. 校验本地引用存在且大小写准确；原 `check:business` 入口继续保留。
3. 校验 API、service、config 不直接依赖 app、router、store、布局、页面、组件、hooks 或 UI 库。
4. 校验 router 不反向依赖 app，Axios 运行时只在 `service/http` 内使用。

扫描使用 TypeScript AST 与 Vue SFC 解析，覆盖静态导入、再导出、字面量动态导入、require 和类型导入；同时识别别名与相对路径。非字面量动态路径和第三方包内部依赖不在检查范围内。类型导入也遵守目录边界，但业务可使用 Axios 的类型。

`pnpm verify` 顺序执行架构检查、lint、类型检查、单元测试和构建；遇到错误即失败。浏览器回归单独执行 `pnpm e2e`。未扩大历史 ESLint suppression，也未降低编译或 lint 规则。

## 验证结果

| 检查                 | 结果                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------- |
| 修改前单测           | 25 个文件，137 个用例通过                                                                   |
| 重构后单测           | 27 个文件，146 个用例通过                                                                   |
| 架构规则自测         | 3 个用例通过                                                                                |
| 导入完整性与架构边界 | 通过，检查包含 1263 个 Vue 文件                                                             |
| 生产构建             | 通过；仍有依赖包指令及既有静态/动态混合导入警告                                             |
| 浏览器回归           | 17 个用例通过（包含新增的空菜单启动/导航场景）                                              |
| 修改范围 lint        | 新增与重构核心模块无错误；3 个仅迁移类型导入的历史 API 文件仍有 99 条既有错误，与修改前一致 |
| 全量 lint            | 已执行，长时间未结束后中止；不能宣称全仓 lint 通过                                          |
| 全量类型检查         | 仍有 763 条历史错误；与修改前源码比较，错误位置和错误码一致                                 |

类型对照使用当前 Git HEAD 的源码副本和同一套已安装依赖，没有用新增忽略项隐藏错误。历史错误主要位于业务组件与页面，包括表格列定义、事件参数和可空字段。它们需要按业务模块单独治理。

新增回归覆盖空菜单仅加载一次、并发初始化合并、初始化期间切换深链、保留服务端路由 meta、退出清理临时路由、菜单/插件迟到结果隔离、失败重试，以及并发请求 loading 和无 Pinia 的 API 调用。HTTP 原有真实请求测试继续覆盖签名、上传下载、请求合并、取消与新旧会话的 401。

浏览器用例采用受控 API 响应；结果证明前端启动和交互兼容，不等同于所有业务接口已完成真实联调。

## 后续开发约定

当前 `views/` 下已经有 1514 个视图及辅助文件，不能继续按“只有骨架、业务待补充”理解仓库。既有业务路径原位保留；新增页面采用 `views/<菜单路径>.vue` 薄入口和 `features/<domain>/` 实现，接口与类型放在对应 API 域。

新增接口不从页面反向导入类型，不在请求层引用路由或 Pinia。需要增加应用副作用时，在 app 层组装，并先运行 `pnpm check:architecture`。旧路径兼容导出可以逐步移除，但必须先确认所有调用方已迁移。
