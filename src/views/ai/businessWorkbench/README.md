# 业务工作台 (Business Workbench)

项目评审工作台 - 用于管理需求资源库、联合会审和项目储备库的综合工作台。

## 目录结构

```
src/views/ai/businessWorkbench/
├── index.vue                    # 主入口页面
├── api.ts                       # 后端请求入口与模拟数据
├── types.ts                     # TypeScript 类型定义
├── styles.css                   # 样式文件（独立管理）
├── components/                  # 子组件目录
│   ├── ModuleCards.vue         # 模块入口卡片组件
│   ├── MeetingList.vue         # 会议列表组件（包含筛选和搜索）
│   ├── MeetingCard.vue         # 按模块类型调度卡片组件
│   ├── StatisticsPanel.vue     # 按模块类型调度统计面板
│   ├── cards/                  # 三大模块各自的卡片展示
│   └── statistics/             # 三大模块各自的统计展示
├── modules/                     # 三大模块独立定义
│   ├── requirementLibrary.ts    # 需求资源库配置
│   ├── jointReview.ts          # 联合会审配置
│   ├── projectReserve.ts       # 项目储备库配置
│   └── index.ts                # 模块注册表
└── hooks/                       # 业务逻辑钩子
    └── useBusinessWorkbench.ts  # 主业务逻辑Hook
```

## 功能特性

### 1. 模块切换
- **需求资源库**：需求录入、集中修改与提交、需求明细查询
- **联合会审**：会议创建、评审意见查询
- **项目储备库**：项目评审意见上传、可研批复文件上传、申请出库、项目预算编制

### 2. 会议管理
- 多维度筛选：全部层级、市级会审、省级会审
- 状态筛选：全部、待开始、评审中、已结束
- 实时搜索：会议名称模糊搜索
- 会议卡片展示：包含专家数量、项目统计、评审进度

### 3. 统计面板
根据当前模块显示不同统计指标：
- **需求资源库**：项目统计（需求入库率、我的项目总数、未纳入需求库、需求库、省级联合会审、储备库、计划预算编制中、已立项、已关闭）
- **联合会审**：项目统计（会审通过率、我的项目总数、评审中、评审通过、评审退回、评审意见待上传、可研批复待上传、发展合规审核中）
- **项目储备库**：项目统计（立项率、我的项目总数、待出库、待出库确认、待发展编制计划、待预算编制、预算编制审核中、待立项、已立项）

## 用户角色

- **creator（创建人）**：查看和管理自己创建的会议（20个会议）
- **expert（专家）**：查看和评审参与的会议（15个会议）
- **admin（管理员）**：查看和管理所有会议（30个会议）

## 技术栈

- **Vue 3** (Composition API)
- **TypeScript**
- **Tailwind CSS**（通过类名实现）
- **lucide-vue-next**（图标库）

## 使用说明

### 安装依赖
项目已包含 `lucide-vue-next` 依赖，无需额外安装。

### 访问路由
在路由配置中添加：
```typescript
{
  path: '/ai/businessWorkbench',
  name: 'BusinessWorkbench',
  component: () => import('@/views/ai/businessWorkbench/index.vue')
}
```

### 数据对接
目前所有需要后端请求替换的数据统一在 `api.ts` 中维护，三大模块只消费 `getWorkbenchMeetings(moduleId)`。实际开发时建议：
1. 在 `api.ts` 中替换模拟数据或接入真实 API 请求函数
2. 保持 `modules/` 只维护模块配置
3. 保持 `hooks/useBusinessWorkbench.ts` 只处理当前模块选择、筛选和统计聚合
4. 实现菜单点击的具体功能（目前仅输出日志）

## 样式说明

样式采用 Tailwind CSS 实用类，同时在 `styles.css` 中定义了：
- 自定义滚动条样式
- 动画效果（淡入上移、慢速旋转、脉冲动画）
- 文本截断工具类
- 全局页面布局

## 主要组件说明

### ModuleCards
模块卡片组件，展示三个业务模块，支持选中状态和菜单点击。

### MeetingList
会议列表容器，包含：
- 标题和会议数量统计
- 搜索框
- 层级筛选按钮
- 状态筛选标签（带数量统计）
- 会议卡片网格布局

### MeetingCard
卡片调度组件，根据当前模块类型渲染：
- `RequirementLibraryCard`：需求资源库项目卡片
- `JointReviewCard`：联合会审会议卡片
- `ProjectReserveCard`：项目储备库项目卡片

### StatisticsPanel
统计面板调度组件，根据当前模块类型渲染：
- `RequirementLibraryStatistics`：需求入库率及需求库指标
- `JointReviewStatistics`：会审通过率及评审指标
- `ProjectReserveStatistics`：立项率及储备库指标

## 开发注意事项

1. **类型安全**：所有组件都使用 TypeScript，确保类型正确
2. **响应式设计**：支持移动端、平板和桌面端
3. **动画性能**：使用 CSS 动画，避免 JavaScript 动画
4. **可维护性**：三大模块的配置、数据、卡片和统计展示相互独立，公共 hook 不维护模块分支

## 后续开发建议

1. 将模拟数据替换为真实 API 调用
2. 实现菜单功能的具体业务逻辑
3. 添加会议卡片点击跳转到详情页
4. 实现统计数据的实时更新
5. 添加错误处理和加载状态
6. 添加权限控制（根据用户角色显示不同模块）
