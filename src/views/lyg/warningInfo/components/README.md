# 连云港预算管理预警大屏 - Vue 3 + TypeScript + CSS 组件库

本文件夹（`/vue-components`）包含了将 React 项目完整转换后的 **Vue 3 + TypeScript + 纯 CSS (Scoped Style)** 组件代码，**无任何 Tailwind CSS 依赖**，可以直接复制到任何标准 Vue 3 + Vite / Nuxt 项目中使用。

---

## 📁 目录结构

```
/vue-components/
├── types.ts                    # TypeScript 类型定义文件
├── warningData.ts                 # 节点数据、连云港行政区划数据等 Mock 数据
├── StageWarningRuleCard.vue    # 项目立项/节点预警说明规则卡片
├── LianyungangMap.vue          # 连云港 3D 地图卡片 (ECharts)
├── BudgetOverview.vue          # 市归口部门预警统计 - 横向堆积柱状图卡片
├── WarningProjectList.vue      # 预警项目明细无缝平滑无缝滚动卡片 (300px 高度、8px 颜色圆点)
├── ProjectProgressFlow.vue     # 项目执行关键节点预警 3D 轮播卡片 (包含黑体数字、8px 颜色圆点与弹窗明细)
├── Dashboard.vue               # 完整大屏集成页面
├── index.ts                    # 统一导出入口
└── README.md                   # 使用说明
```

---

## 🎨 样式与优化说明

1. **纯原生态 CSS (`<style scoped>`)**:
   - 彻底移除了 Tailwind CSS 样式依赖，使用 Vue 3 的组件作用域 CSS，无样式冲突风险。
2. **样式细节精准匹配**:
   - **预警节点字段**: 增加对应颜色 8px 圆点（提醒：黄色 `#FAFD0C`；警告：橘色 `#FC9907`；预警：红色 `#DB2F2B`）。
   - **预警卡片数字**: 统一调整为黑色字体（`color: #000000; font-weight: 800;`）。
   - **预警项目明细**: 模块高度设定为 `300px`，字号 `16px`，支持无缝平滑上下上下上下自动循环滚动。
   - **市归口部门预警统计**: 横向堆积柱状图 Y 轴部门名称字体加大至 `16px`。
   - **毛玻璃效果**: 已全面移除 `backdrop-blur`，确保在各类显卡及大屏环境流畅高帧率渲染。

---

## 🚀 使用方法

### 1. 依赖依赖项
请确保您的 Vue 3 项目安装了以下依赖：
```bash
npm install vue echarts echarts-gl
```

### 2. 引入组件示例
在 Vue 3 项目的页面中可以直接按如下方式引用：

```vue
<template>
  <Dashboard />
</template>

<script setup lang="ts">
import { Dashboard } from './vue-components';
</script>
```

或单独使用单组件：

```vue
<template>
  <div style="height: 300px;">
    <WarningProjectList />
  </div>
</template>

<script setup lang="ts">
import { WarningProjectList } from './vue-components';
</script>
```
