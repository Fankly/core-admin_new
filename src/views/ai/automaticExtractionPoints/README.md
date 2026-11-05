# 要点自动提取（automaticExtractionPoints）

依据设计稿 `10-11/要点自动提取V0.2.html` 用 Vue3 + TS 还原的页面。

- 路由地址：`/ai/automaticExtractionPoints`（或带 `/index` 后缀，两种地址都可访问）
- 组件名（keep-alive 约定）：`/ai/automaticExtractionPoints/index`
- 页面结构：4 张指标卡（文件智能解析 / 审核要点提取 / 审核要点转化 / 审核要点实现）+ 列表大卡（文件列表 / 知识管理双页签）+ 4 个弹窗

## 文件结构

```
automaticExtractionPoints/
├── index.vue                 # 页面组装：取数（统计/两个分页列表）、卡片下钻、页签联动、全屏切换、弹窗调度
├── styles.css                # 色板与全部页面样式（换肤只改这里的 CSS 变量）
├── types.ts                  # 页面展示/交互类型（业务类型复用 api 模块）
├── hooks/
│   └── useEmptyRows.ts       # 表格空白填充行计算
├── directives/
│   └── resizableTable.ts     # 表格列宽拖拽（v-resizable-table）
└── components/
    ├── MetricCards.vue       # 4 张指标卡（消费统计接口数据 + 图例下钻）
    ├── GaugeRing.vue         # SVG 环形图与 270° 仪表盘
    ├── ListPanel.vue         # 工具栏 + 筛选带 + 双表 + 分页（分页受控）
    ├── ClampText.vue         # 单元格两行截断 / 单行省略 + 悬浮浮出完整内容
    ├── ExtractModal.vue      # 文件智能解析与提取（picker/fileList 取数 + 开始提取）
    ├── ConfirmModal.vue      # 审核要点确认（pointDetail 回填 + confirm 提交）
    ├── KnowledgeListModal.vue# 知识列表（pointPage 按来源文件 + 点击列条件过滤，含审核要点来源列）
    ├── ModalShell.vue        # 弹窗外壳（遮罩 / 标题 / 关闭）
```

## 接口对接（真实接口；离线联调时可用本地 mock 层，见文末「其它」）

接口封装：`src/api/ai/automaticExtractionPoints/index.ts`

| 场景 | 接口 |
| --- | --- |
| 审核要点来源字典 | `GET /commonCode/getData?code=AI_AUDIT_POINT_SOURCE_COM`（1 制度文件 / 2 经验知识） |
| 4 张指标卡 | `GET /attachPointKnowledge/statistics` |
| 文件列表分页 | `POST /attachPointKnowledge/filePage` |
| 知识管理分页 | `POST /attachPointKnowledge/pointPage` |
| 提取弹窗的文件选择列表 | `POST /attachPointKnowledge/picker/fileList` |
| 开始提取（入队） | `POST /attachPointKnowledge/startExtract` |
| 确认弹窗详情回填 | `GET /attachPointKnowledge/pointDetail` |
| 确认审核要点 | `POST /attachPointKnowledge/confirm` |
| 新增经验知识审核要点（经验知识维护） | `POST /attachPointKnowledge/saveExperiencePoint`（来源后端固定为「经验知识」） |
| 删除审核要点 | `POST /attachPointKnowledge/deletePoint` |
| 导出（按当前页签） | `POST /attachPointKnowledge/exportFile` / `exportPoint` |

行为约定：

- **服务端分页/筛选**：两个列表都由接口分页（`page` / `limit`），筛选条件的变更在点「查询」「重置」或切页时取数；卡片图例下钻会立即取数。
- **查询条件**：发布年度用年份选择器、发布部门用输入框（接口没有字典来源）；「是否已确认 / 是否已转化 / 系统是否已实现」用接口的 1/0 编码（列表文案统一用「转化」，后端返回的「已转译/未转译」经前端替换显示为「已转化/未转化」）；「审核要点来源」紧跟「审核要点」，下拉选项（显示「制度文件 / 经验知识」、值用码值 1 / 2）来自公共代码字典 `AI_AUDIT_POINT_SOURCE_COM`，见 `hooks/usePointSourceDict.ts`。
- **指标卡**：卡片点击/图例下钻只联动列表（切页签 + 套筛选 + 滚动），不弹提示文案；「审核要点分布」卡片（原「审核要点提取」）右上角下拉切换「按来源 / 按状态」，默认维度取接口 `pointDistribute.defaultGroupBy`（缺省按来源），图形与「文件智能解析」一致用环形图 + 图例，图例点击按对应维度筛选列表（来源 → `pointSource` 编码，状态 → `isConfirm`）。数据取接口 `pointDistribute`：`bySource.distribution`（`name` 是**名称**「制度文件 / 经验知识」，直接展示；下钻时经 `pointSourceCodeOf` 映射成码值 1 / 2 传给列表筛选）、`byStatus.distribution`（`name` 是中文状态名，确认率取 `byStatus.confirmRate`）。**卡片口径有前置条件**：「审核要点转化」只统计**已确认**的要点、「审核要点实现」只统计**已转化**的要点，所以这两张卡的图例下钻会带上 `extra`（转化图例 → 叠加 `isConfirm=1`，实现图例 → 叠加 `isSolidify=1`），条数才与卡片数字一致（不带基数会混入下级状态的记录）。
- **确认流程**：在知识管理页签勾选一条后点「审核要点确认」，弹窗先调 `pointDetail` 回填，再 `confirm` 提交（`effectiveStatus` 原样回传）；「是否固化为AI审核要点」可自由切换是/否；弹窗底部为「取消 + 确认」，字段顺序：审核要点名称*、审核要点判断规则*、审核要点描述、原文出处、数据来源、审核要点来源、是否为有效审核要点、是否固化为AI审核要点（「数据来源 | 审核要点来源」「是否为有效审核要点 | 是否固化为AI审核要点」各占一行）；「是否为有效审核要点」提交为接口字段 `isConfirm`（1 确认 / 0 取消确认）；「审核要点来源」为**只读展示**（接口返回什么就显示什么，不可修改）。
- **经验知识维护**：知识管理工具栏「审核要点确认」后面的按钮，是**纯新增功能**——不需要勾选、点击直接打开空表单（不调 `pointDetail`、无回填）；「审核要点来源」**只读显示「经验知识」不可修改**，默认「是否为有效审核要点 = 否」「是否固化为AI审核要点 = 否」，其余字段为空；底部为「取消 + 保存」，保存调 `saveExperiencePoint`（来源后端固定为「经验知识」），成功后刷新统计并切到知识管理页签。
- **提取状态**：编码 1 待提取（灰）/ 2 提取中（黄）/ 3 已提取（青绿）/ 4 提取失败（红），徽标为同色边框 + 同色文字；文案优先取接口 `extractStatusName`，缺失时按编码兜底（待提取/提取中/已提取/提取失败）。
- **删除**：知识管理行内「删除」只有「未确认」且「未固化为AI审核要点」的记录可删（是否已确认 = 已确认、或是否固化为AI审核要点 = 是时拦截，按钮禁用并给出原因）→ 二次确认 → `deletePoint` → 刷新列表与统计；文件列表行内「删除」只有未提取的记录可删（提取状态 = 3 已提取时拦截）→ 二次确认 → `fileDelete`（入参 attachId）→ 刷新列表与统计。
- **页签切换**：工具栏切换「文件列表 / 知识管理」时会请求该页签对应的列表接口刷新主表（分页归位到第 1 页）。
- **ID 安全**：`attachId` / `pointId` 是后端 int64，前端一律按字符串透传，不做 `Number()` 转换。
- **表格列宽**：所有表格（文件列表 / 知识管理 / 两个弹窗内的表）表头右缘可拖拽调整列宽（`v-resizable-table` 指令，最小 60px）；发文字号、解析时间单行展示，发文部门按约 5 个字宽展示，超出省略、悬浮看全文。
- **固定列**：文件列表横向滚动时「文件名称」列固定在左侧（连同表头），右侧带分隔线。
- **筛选展开/收起**：工具栏按钮在「展开筛选 / 收起筛选」间切换，控制查询条件的展开与收起（全屏展示时自动展开）。
- **开始提取**：点击「开始审核要点提取」提交后不再弹消息提醒弹窗，改为提示语「系统将基于大模型自动提取审核要点，预计需要3-5分钟，您可以稍作等待」（停留 5 秒）。
- **知识列表入口**：文件列表四个计数药丸（提取 / 确认 / 转化 / 已实现审核要点）打开的是同一个知识列表弹窗，差别在带入的条件——都会带 **attachId + 来源文件名称**，并叠加该列对应的状态条件（确认 = 已确认、转化 = 已转化、已实现 = 已实现；提取审核要点 = 不带状态条件取全部）。带入条件会显示在弹窗副标题，并代入弹窗内对应的筛选项；弹窗表格列：勾选 / 序号 / 审核要点 / 审核要点判断规则 / 原文出处 / **审核要点来源**（来源字典转名称展示）/ 来源文件 / 审核要点生效状态 / 是否已确认 / 确认时间 / 是否已转化AI审核要点 / 系统是否已实现 / 操作；弹窗表格行尾「操作 - 详情」会收起知识列表并用审核要点确认弹窗**只读**展示该要点（字段置灰不可编辑，底部只有关闭），关闭详情后回到知识列表。
- **审核要点来源取值（重要）**：来源字典走公共代码接口 **`GET /commonCode/getData?code=AI_AUDIT_POINT_SOURCE_COM`**（`1` 制度文件 / `2` 经验知识），前端在 `hooks/usePointSourceDict.ts` 里取一次缓存全页共用（拉取失败用本地兜底映射，内容与字典一致），**默认码值 `2`（经验知识）**。
  接口各处给的形式不统一：**列表行 / 统计 `bySource` 给名称**（「制度文件 / 经验知识」），**`pointDetail` 原样返回码值**（如 `"2"`），而**查询/提交/落库要码值**（`pointPage` 的 `pointSource` 传名称会查不到数据）。
  页面因此统一约定：**展示用名称（`pointSourceName` 码值→名称）、筛选下拉选项与查询/下钻/提交用码值（`pointSourceCodeOf` 名称→码值）**，两个方法都来自 `usePointSourceDict`；「审核要点来源」筛选下拉的 value 直接用码值。
  确认/经验知识维护弹窗里的「审核要点来源」是**只读输入框**（显示名称：确认流程 = 接口返回值、经验知识维护 = 默认的「经验知识」），提交时经 `pointSourceCodeOf` 转码值。
- **未对接项**：「审核要点应用」接口未提供，目前为提示文案；`pointPage` 的 `attachId` 字段接口文档未列，已按需求与 `sourceFile` 一并透传。
- **指标卡**：图例行展示个数（如「3 个」），占比只用于环形弧长与进度条宽度；卡片配色按设计稿四色（蓝 / 绿 / 紫 / 橙），是对 `DESIGN.md` 「唯一主色」的局部例外，仅限指标卡区域。
- **单元格截断**：文件列表 / 知识管理两张主表的文本列最多展示两行，超出省略；鼠标移到被截断的单元格上浮出完整内容（`ClampText` 组件，浮层挂到 body 不会被表格滚动区裁剪，列表滚动或视口变化时自动收起）。
- **全屏展示**：点击「全屏展示」后列表铺满页面并自动展开查询条件（退出全屏时恢复进入前的展开状态），两个页签共用。

## 提示语

页面所有反馈统一用系统组件 **ElMessage**（成功 success / 警告 warning / 信息 info），与其它页面保持一致；
空态用表格空态文案、加载用 v-loading、二次确认用 ElMessageBox，不再使用自绘 Toast。

**业务失败提示（重要）**：http 层只透传响应——后端的业务失败（`success: false`，如「审核要点判断规则不能为空」）仍是 HTTP 200，**不会自动弹错**。
因此写操作（保存经验知识 / 审核要点确认 / 删除 / 开始提取）都显式检查 `success` 与 `msg`：失败时提示后端原因，且不关闭弹窗、不刷新列表。
另外「审核要点名称」「审核要点判断规则」接口都要求非空，提交前本地先做必填校验（提示比后端更直接）。

## 配色说明（重要）

设计稿使用蓝色系（`#2563eb` / `#4f46e5`）配色，本页按 `DESIGN.md` 映射到项目设计系统（指标卡除外，见下）：

| 设计稿 | 本页 |
| --- | --- |
| 蓝色渐变主按钮 | 深青绿 `#00706b` 实心（仅主提交）/ 雾面 plain（工具栏） |
| 四卡配色（卡片底/描边 / 左边条 / 图标底 / 环形图 / 图例圆点 / 进度条 / 率文字） | 按最新设计稿「同色系四档」：青绿 `#35a98c→#74cdb4`、湖水绿 `#2a9d8f→#6ecfc4`、湖蓝 `#2a8fb0→#6cc2dd`、草木绿 `#3f9e6a→#7fd0a0`（需求确认的局部例外） |
| 卡片阴影 + hover 位移 | 无常规阴影；hover 上浮（保留卡片自身底色与描边）、竖条加宽 |
| 16px / 10px 圆角 | 12px 大卡 / 6px 控件 |
| slate 表头 | 浅青绿底 `#dff3f0` + 主色字 |

> 指标卡的同色系四档配色是对 `DESIGN.md`「唯一主色 `#00706b`、禁止第二个强调色」的**局部例外**（按需求确认，只作用于 4 张指标卡）；页面其余部分（工具栏、页签、弹窗、表格）仍统一深青绿主色。

换肤：改 `styles.css` 中 `:root` 的 `--aep-*` 变量即可；指标卡四色在 `styles.css` 的 `.aep-card--*` 修饰类与 `MetricCards.vue` / `GaugeRing.vue` 的配色常量里。

## 其它

- 菜单：需要在服务端菜单中配置 `/ai/automaticExtractionPoints/index`（或 `/ai/automaticExtractionPoints`）；未配置时前端可直接用地址访问。
- 本地 mock 层（`mock/`）覆盖了其中的查询与操作接口（statistics / filePage / pointPage / picker.fileList / startExtract / pointDetail / confirm / saveExperiencePoint / deletePoint，以及来源字典 `commonCode/getData?code=AI_AUDIT_POINT_SOURCE_COM`），导出接口仍走真实后端；`VITE_USE_MOCK=true` 时列表返回演示数据（含「经验知识」来源与按来源分布；`pointPage` 的 `pointSource` 按**码值**过滤、返回**名称**，与真实接口一致），联调真实后端请保持 `VITE_USE_MOCK=false`。
