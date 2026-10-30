# 物料库菜单配置

本页面由后端菜单接口动态注册，前端无需添加静态路由。

- 父菜单：AI 智能
- 菜单名称：物料库
- 菜单路由：`/ai/materialLibrary/index`
- 组件路径：`src/views/ai/materialLibrary/index.vue`
- 页面模式：菜单页面（需配置 `outsideMenu`，页面通过 `UserRoleSelector` 获取单位、部门、角色和按钮权限上下文）
- 按钮编码：`EXPORT`（导出）；未配置按钮的角色保持只读
- 页面样式参考 `src/views/suzhou/aiAuditRuleManage` 主页

## 功能说明

- 查询条件：项目编码、项目名称、物料编码、物料描述
- 多个标签页通过公共代码获取（标签页列表），每个页签右侧展示当前页签统计总数
- 统计总数取自分页查询接口返回的 `total`
- 列表表头通过后端接口按页签获取
- 导出按当前查询条件（含页签标识 `tabCode`）导出全部数据

## 后端待对接接口（约定占位）

接口均挂在 `budget` 服务下，路径前缀 `material-library/`：

| 用途 | 方法 | 路径 | 入参 | 返回 |
| --- | --- | --- | --- | --- |
| 获取表头 | POST | `material-library/getColumns` | `{ tabCode }` | `{ code, data: MaterialLibraryColumn[], ... }` |
| 分页查询 | POST | `material-library/getPage` | `MaterialLibrarySearchParams` | `{ code, data: { records, total, current?, size? }, ... }` |
| 导出 | POST(导出) | `material-library/export` | `MaterialLibrarySearchParams` | 文件流 |

### 标签页公共代码

- 公共代码 code：`AI_MATERIAL_LIBRARY_TAB_COM`
- 返回结构：`[{ code, name }]`，`code` 即 `tabCode`，用于区分各页签数据来源与表头

### 表头列结构 `MaterialLibraryColumn`

| 字段 | 说明 |
| --- | --- |
| `title` | 列标题 |
| `field` | 字段名（对应行数据字段） |
| `width` | 列宽，数值或数字字符串，可选 |
| `visible` | 是否显示，可选，默认显示 |
| `edit` | 是否可编辑，可选，仅叶子列生效 |
| `children` | 子列列表，可选，用于多级表头 |

后端接口路径与公共代码 code 均为约定占位，对接时若需调整，同步修改 `src/api/ai/materialLibrary/index.ts` 与本页 `MATERIAL_LIBRARY_TAB_CODE` 常量即可。
