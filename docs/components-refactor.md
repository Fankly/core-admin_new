# 公共组件重构说明

本次覆盖 `apps/web/src/components` 下全部 16 个 Vue 组件，保留原导入路径、公开事件与实例方法。

| 组件组 | 主要变化 |
| --- | --- |
| Grid / GridItem | 提取断点、跨度与折叠算法；计算字段换行及操作区占位，随列数、间距和断点更新。 |
| ProTable / TableColumn / ColSetting / Pagination | 类型使用 Element Plus 公开列属性；列配置复制到局部状态；枚举请求保护过期响应；多级表头和插槽渲染；静态分页总数更新与页内排序；抽屉及分页适应窄屏。 |
| SearchForm / SearchFormItem | 查询参数、动态控件及实例引用补齐类型；折叠与 Grid 共用算法；默认值解包并隔离数组修改。 |
| OfficePreview | 拆分文件读取、签名探测与渲染生命周期；继续支持 PDF、Word、Excel、ET；取消文件头读取，清理控制器、订阅和 Blob URL。 |
| HelpModal | 拆分数据加载与内容处理；附件独立于帮助发布状态加载；批量下载保持忙碌状态并防重复提交；限定帮助 HTML 的基础格式标签。 |
| UserRoleSelector | 拆分角色映射和权限流程；确认防重复提交；取消或卸载后忽略响应；保留空按钮权限角色可渲染的行为。 |
| ToolbarButtons | 使用原生按钮支持键盘操作和工具提示，保留事件及搜索显隐 model。 |
| ReText | 类型化样式与 props；明确属性透传；卸载后取消测量；更新多行省略与空白保留。 |
| Loading / AppSpinner | 声明加载状态；取消延迟计时器；无 transitionend 时销毁动画；支持减少动态效果。 |
| SvgIcon | 类型化样式与安装入口；规范图标前缀处理，兼容 href / xlink:href。 |

## 兼容约定

- `ProTable.requestAuto` 保持默认 `false`，传入静态 `data` 时不发起表格数据请求。
- `search`、`reset`、历史拼写 `dargSort` 事件和实例的 `showGuidemanual` 名称保留。
- 查询返回 `{ data: { records, current, size, total } }`，非分页模式返回 `{ data: rows }`。类型通过 `TableRequest` / `TableResponseData` 显式声明。
- `ColumnProps<T>` 支持具体行类型；扩展控件参数使用 `Record<string, unknown>`。组件内不再使用 `any` 或 `@ts-ignore`。
- 继续使用现有 file-viewer 类型与运行时适配入口，未修改依赖或全局 TypeScript 严格检查设置。

## 验证

- 全项目 `vue-tsc` 类型检查、Lint 和生产构建。
- 91 个 Vitest 用例，包括配置替换、过期响应、默认值隔离、静态分页排序、文件类型纠正、Blob URL 清理、角色取消、批量下载与动画清理。
- 9 个现有 Playwright 浏览器回归用例。
- 通过隔离浏览器挂载验证多级表头、枚举、搜索、列显隐，以及桌面和 390px 窄屏布局。

浏览器用例和组件集成使用受控数据，不代表生产接口已全部联调。
