---
name: 项目过程管控平台
description: 以智能审核规则主列表为唯一标杆的青绿高密度管理端设计系统
colors:
  primary: '#00706b'
  primary-hover: '#2a9a92'
  primary-active: '#005f5a'
  primary-soft: '#f2f9f8'
  primary-hover-soft: '#e6f4f3'
  primary-border: '#b8ddd9'
  text-main: '#1e293b'
  text-body: '#475569'
  text-muted: '#64748b'
  text-disabled: '#94a3b8'
  surface: '#ffffff'
  page-mint: '#f5fbfb'
  search-mint: '#f8fcfb'
  toolbar-wash: '#fcffff'
  border: '#e2e8f0'
  divider: '#eef2f6'
  table-header: '#dff3f0'
  table-stripe: '#f7fcfb'
  table-current: '#d8efec'
  danger: '#f56c6c'
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif"
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif"
    fontSize: '13px'
    fontWeight: 500
    lineHeight: 1.4
  table:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif"
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.4
  command:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif"
    fontSize: '12px'
    fontWeight: 500
    lineHeight: 1
rounded:
  control: '6px'
  card: '12px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '10px'
  lg: '12px'
  group: '24px'
components:
  button-primary:
    backgroundColor: '{colors.primary-soft}'
    textColor: '{colors.primary}'
    typography: '{typography.command}'
    rounded: '{rounded.control}'
    padding: '6px 12px'
    height: '28px'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary}'
    typography: '{typography.command}'
    rounded: '{rounded.control}'
    padding: '6px 12px'
    height: '28px'
  button-danger:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.danger}'
    typography: '{typography.command}'
    rounded: '{rounded.control}'
    padding: '6px 12px'
    height: '28px'
  input-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-body}'
    typography: '{typography.body}'
    rounded: '{rounded.control}'
    height: '32px'
  workbench-card:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-body}'
    rounded: '{rounded.card}'
  table-header:
    backgroundColor: '{colors.table-header}'
    textColor: '{colors.primary}'
    typography: '{typography.label}'
    height: '44px'
  table-cell:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-body}'
    typography: '{typography.table}'
    height: '32px'
---

# Design System: 项目过程管控平台

## Overview

**Creative North Star: "电网规则控制台"**

本系统以 `src/views/suzhou/aiAuditRuleManage/index.vue` 的主列表为唯一视觉标杆。它不是展示型首页，而是一张面向重复配置工作的高密度控制台：用户在同一工作台内完成规则检索、选择、维护、关联和状态切换，界面必须先保证扫描效率、操作秩序和状态清晰。

整体气质是克制、严谨、结构化。青绿只承担品牌强调、焦点、选中和启用状态；白色与薄荷色负责组织层级，墨色文字负责信息承载。禁止默认蓝色管理端、渐变装饰、厚重阴影、大圆角堆叠和营销式大标题。

弹窗、树选择和明细表格只补充主列表未覆盖的控件行为，不构成第二视觉标杆。任何冲突均以主列表及 `css/index.less` 的当前实现为准。

**Key Characteristics:**

- 单一 12px 白色工作台卡片承载工具栏、查询带、表格和分页四段。
- 主色固定为电网青绿；按钮采用浅底、青绿字和软青绿边框。
- 表头 44px、表行 32px、按钮 28px、输入框 32px，保持桌面端高密度。
- 卡片静态无阴影；层级依靠底色、边框和分割线建立。
- 图标工具、输入控件、按钮和开关使用统一可见焦点环。
- 仅服务桌面管理端，不为移动视口牺牲信息密度。

## Colors

色彩结构是单一青绿强调加冷静的石板中性色。主列表中出现的色阶均有明确职责，不扩展新的近似色。

### Primary

- **电网控制青绿** (`primary`): 主操作、表头文字、选中控件、启用开关和焦点环。
- **青绿动作阶** (`primary-hover`, `primary-active`): 仅用于同一操作从悬停到按下的状态变化。
- **青绿雾面阶** (`primary-soft`, `primary-hover-soft`, `primary-border`): 按钮底色、行悬停、软边框和低强度强调。

### Neutral

- **主墨与正文墨** (`text-main`, `text-body`): 分别承担关键内容与普通表格、标签文字。
- **辅助雾灰** (`text-muted`, `text-disabled`): 工具图标、次要信息与禁用状态。
- **白色工作面** (`surface`): 工作台卡片、表体、输入框和分页。
- **薄荷层级** (`page-mint`, `search-mint`, `toolbar-wash`): 依次用于页面根、查询带、工具栏；不得互换或新增第四种页面薄荷底色。
- **结构线** (`border`, `divider`): 外框与网格使用较实的边框色，卡内分段使用更轻的分割色。
- **表格状态面** (`table-header`, `table-stripe`, `table-current`): 分别用于表头、斑马行、勾选或当前行。

### Named Rules

**The Main List Rule.** 视觉争议只以 `src/views/suzhou/aiAuditRuleManage/index.vue` 与 `css/index.less` 为准；同目录弹窗仅补充控件类型。

**The No Default Blue Rule.** Element 默认蓝不得出现在主按钮、链接、焦点、开关或表格强调态；这些状态必须锁定为青绿。

**The One Accent Rule.** 青绿是唯一品牌强调色。危险红只表示删除等不可逆操作，不参与品牌装饰。

## Typography

**Body Font:** 系统 UI 字体栈，优先使用平台原生字体与中文无衬线字体。

**Character:** 字体服务于中文管理端的快速扫描，不引入展示字体、等宽伪技术字体或装饰性英文大写。

### Hierarchy

- **Body** (400, 14px/1.5): 页面与表单的一般正文。
- **Label** (500, 13px/1.4): 查询标签与紧凑控件标签。
- **Table** (400, 13px/1.4): 表格正文；表头保持 13px，通过 600 字重和青绿色区分。
- **Command** (500, 12px/1): 工具栏按钮与分页信息。

### Named Rules

**The Dense Type Rule.** 列表工作区不使用超过 16px 的标题，也不通过放大字体制造层级；层级由位置、字重、颜色和分段建立。

**The Two-Hanzi Rule.** 两字按钮中间留一个空格，如「新 增」「编 辑」「删 除」「保 存」「关 闭」；四字及以上直接连写。

## Layout

页面根铺 `page-mint`，自身 `padding: 0`、纵向 flex、`overflow: hidden`。外层应用壳负责页面边距，业务页面不重复叠加内边距。

主工作台是一层占满可用空间的白色卡片，使用 12px 圆角和 1px 边框。内部顺序固定为：命令工具栏、查询带、主表格、分页条。

- 工具栏最小高度 48px，内边距 10px 12px；维护命令与配置命令均以 10px 间距成组，两组之间使用 12px 左内边距和 1px 竖分割线。
- 工具栏命令区与右侧图标工具区间距 24px；图标工具保持紧凑，不挤压文字命令。
- 查询带内边距 12px 12px 4px，四列网格排列；表单项底部留 8px。
- 表格区使用 `flex: 1 1 0`、`height: 0` 和 `overflow: hidden` 吃满剩余高度，纵向滚动归表体所有。
- 分页条右对齐，内边距 8px 12px，通过顶部轻分割线与表体区隔。

**The Fixed Band Order Rule.** 工具栏、查询、表格、分页的顺序不可交换；详情、明细、提示词和适用范围进入弹窗，不在主列表并排展开。

**The One Scroll Owner Rule.** 列表区域只能有一个纵向滚动所有者，禁止页面、卡片和表格同时滚动。

**The Desktop Density Rule.** 该系统只面向桌面浏览器，不新增移动端断点、触控专用布局或卡片化表格替代方案。

## Elevation & Depth

主列表采用平面分层。工作台卡片、工具栏、查询带、表格与分页均无阴影，层级只通过白色/薄荷底色、1px 边框和分割线表达。弹窗可使用一层低透明青绿色相投影来脱离页面，但阴影不能扩散到静态业务卡片。

### Shadow Vocabulary

- **Workbench Flat** (`box-shadow: none`): 主列表工作台及内部所有静态分段。
- **Modal Lift** (`0 8px 28px rgba(0, 112, 107, 0.12)`): 仅用于模态浮层外壳。

**The Flat Workbench Rule.** 静态管理页面禁止使用阴影强调卡片；需要区分区域时优先使用既有底色与分割线。

## Shapes

形状语言由两档圆角构成：所有交互控件使用 6px，唯一工作台外框及模态外壳使用 12px。卡片内部的工具栏、查询带、表格和分页不再各自加圆角，避免框中框与圆角套圆角。

**The Two Radius Rule.** 新界面只能复用 6px 控件圆角和 12px 容器圆角；不增加第三档常规圆角。

## Components

### Buttons

- **Primary:** 浅青绿底、主色字、软青绿边，28px 高、6px 圆角；悬停加深雾面，按下使用深青绿。
- **Secondary:** 白底、青绿字、软青绿边，用于关联配置等次级命令。
- **Danger:** 白底、危险红字和红边；仅用于删除等不可逆操作。
- **Disabled:** 统一使用禁用灰文字、冷灰浅底和结构边框，不保留强主色。
- **Focus:** `2px solid #00706b`，外偏移 2px。

### Cards / Containers

- 主列表只有一层 12px 工作台外框，白底、1px 结构边、无阴影。
- 卡内分段只用轻分割线，不把工具栏、查询或表格再次包装成卡片。

### Inputs / Fields

- 输入框与下拉框高 32px、6px 圆角、白底、结构色边框。
- 悬停使用软青绿边；聚焦使用主青绿边和统一焦点环。
- 查询区固定四列，标签为 13px/500，不因字段内容改变行高。

### Toolbar

- 左侧按语义分为维护命令和配置命令，组内 gap 10px；清除 Element 默认按钮相邻 margin。
- 右侧设置、查询展开和帮助使用独立图标工具，必须有 tooltip、`aria-label` 和键盘焦点。
- 一个表格区只允许一条工具栏。

### Data Table

- 表头高 44px，青绿雾面底和 13px/600 主色字；表体行高 32px、13px 正文字。
- 斑马行、悬停行、当前行按各自薄荷色铺底，文字颜色不随行态跳变。
- 网格线保持 1px 结构色；修改列底色时只写 `background-color`，不覆盖 VXE 的网格背景图。
- 选择框和启用开关使用主青绿；启停语义同时提供文字，不只依赖颜色。

### Pagination

- 白底、右对齐、12px 文字，页码按钮 28px 高、6px 圆角。
- 当前页允许使用实心青绿和白字，作为列表内少数高对比选中态。

### Modal Supplements

- 表单、提示词、明细和树选择弹窗沿用相同按钮、输入、表格和色彩规范。
- 弹窗仅补充主列表没有的控件类型，不能引入新的品牌色、圆角档位或卡片风格。

## Do's and Don'ts

### Do:

- **Do** 以 `aiAuditRuleManage` 主列表作为唯一视觉裁决依据。
- **Do** 固定使用浅青绿主按钮、白色工作台和薄荷分段。
- **Do** 保持 28px 按钮、32px 输入与表行、44px 表头的桌面密度。
- **Do** 用父容器 gap 管理按钮间距，并用分割线区分命令组。
- **Do** 为图标工具、按钮、输入和开关提供可见焦点与无障碍名称。
- **Do** 把复杂编辑、明细、提示词和范围选择放入弹窗。

### Don't:

- **Don't** 使用 Element 默认蓝、渐变、装饰性大标题或营销式布局。
- **Don't** 给静态卡片、工具栏、查询带、表格或分页添加阴影。
- **Don't** 在工作台内继续嵌套卡片或重复页面级内边距。
- **Don't** 使用大于 12px 的常规容器圆角，或新增第三档圆角。
- **Don't** 同时保留多条工具栏或多个纵向滚动容器。
- **Don't** 把弹窗的局部布局提升为第二套页面设计系统。
