# TreeSelect 树形选择器

基于 Element UI 的树形选择器组件，结合了 el-tree 和 el-select 组件的功能。

## 功能特点

- 支持单选和多选模式
- 支持清空选择
- 支持自定义数据结构
- 支持默认展开指定节点
- 支持禁用状态
- 支持自定义样式

## 使用方法

```vue
<template>
  <div>
    <h3>单选模式</h3>
    <tree-select
      v-model="singleValue"
      :data="treeData"
      placeholder="请选择部门"
      @change="handleChange"
    />

    <h3>多选模式</h3>
    <tree-select
      v-model="multipleValue"
      :data="treeData"
      :multiple="true"
      placeholder="请选择多个部门"
      @change="handleMultipleChange"
    />
  </div>
</template>

<script>
import TreeSelect from "@/modules/TreeSelect";

export default {
  components: {
    TreeSelect
  },
  data() {
    return {
      singleValue: "",
      multipleValue: [],
      treeData: [
        {
          value: "1",
          label: "总公司",
          children: [
            {
              value: "1-1",
              label: "研发部",
              children: [
                { value: "1-1-1", label: "前端组" },
                { value: "1-1-2", label: "后端组" }
              ]
            },
            {
              value: "1-2",
              label: "市场部"
            }
          ]
        },
        {
          value: "2",
          label: "分公司",
          children: [
            { value: "2-1", label: "销售部" },
            { value: "2-2", label: "客服部" }
          ]
        }
      ]
    };
  },
  methods: {
    handleChange(data) {
      console.log("选中的节点:", data);
    },
    handleMultipleChange(nodes) {
      console.log("多选选中的节点:", nodes);
    }
  }
};
</script>
```

## 属性

| 属性名              | 说明                             | 类型                    | 默认值 |
| ------------------- | -------------------------------- | ----------------------- | ------ |
| value / v-model     | 绑定值                           | String / Number / Array | -      |
| data                | 展示数据                         | Array                   | []     |
| props               | 配置选项，具体看下表             | Object                  | -      |
| nodeKey             | 每个树节点用来作为唯一标识的属性 | String                  | value  |
| placeholder         | 占位符                           | String                  | 请选择 |
| disabled            | 是否禁用                         | Boolean                 | false  |
| clearable           | 是否可清空                       | Boolean                 | true   |
| multiple            | 是否多选                         | Boolean                 | false  |
| defaultExpandedKeys | 默认展开的节点的 key 的数组      | Array                   | []     |
| popperClass         | Select 下拉框的类名              | String                  | -      |

## props

| 属性名   | 说明                               | 类型   | 默认值   |
| -------- | ---------------------------------- | ------ | -------- |
| label    | 指定节点标签为节点对象的某个属性值 | String | label    |
| value    | 指定节点值为节点对象的某个属性值   | String | value    |
| children | 指定子树为节点对象的某个属性值     | String | children |

## 事件

| 事件名称 | 说明                                     | 回调参数     |
| -------- | ---------------------------------------- | ------------ |
| change   | 选中值发生变化时触发                     | 目前的选中值 |
| clear    | 可清空的单选模式下用户点击清空按钮时触发 | -            |

## 多选模式

设置 `multiple` 属性开启多选模式。

```vue
<template>
  <TreeSelect v-model="value" :data="treeData" multiple collapse-tags clearable />
</template>

<script setup>
import { ref } from 'vue'
import TreeSelect from '@/modules/TreeSelect'

const value = ref([])
const treeData = [...]
</script>
```

## 可筛选

设置 `filterable` 属性开启筛选功能。

```vue
<template>
  <TreeSelect v-model="value" :data="treeData" filterable clearable />
</template>
```

## 自定义属性

通过 `props` 和 `nodeKey` 属性自定义数据结构。

```vue
<template>
  <TreeSelect
    v-model="value"
    :data="customData"
    :props="{ children: 'childNodes', label: 'name' }"
    node-key="key"
    clearable
  />
</template>

<script setup>
import { ref } from "vue";
import TreeSelect from "@/modules/TreeSelect";

const value = ref("");
const customData = [
  {
    key: "a",
    name: "部门A",
    childNodes: [
      {
        key: "a1",
        name: "部门A-1"
      }
    ]
  }
];
</script>
```

## 属性

| 属性名               | 说明                                                     | 类型                          | 默认值    |
| -------------------- | -------------------------------------------------------- | ----------------------------- | --------- |
| modelValue / v-model | 绑定值                                                   | string / number / array       | -         |
| data                 | 展示数据                                                 | array                         | []        |
| props                | 配置选项，具体看下表                                     | object                        | -         |
| nodeKey              | 每个树节点用来作为唯一标识的属性                         | string                        | 'id'      |
| placeholder          | 占位符                                                   | string                        | '请选择'  |
| disabled             | 是否禁用                                                 | boolean                       | false     |
| clearable            | 是否可清空                                               | boolean                       | false     |
| multiple             | 是否多选                                                 | boolean                       | false     |
| checkStrictly        | 在显示复选框的情况下，是否严格的遵循父子不互相关联的做法 | boolean                       | false     |
| collapseTags         | 多选时是否将选中值按文字的形式展示                       | boolean                       | false     |
| collapseTagsTooltip  | 当鼠标悬停于折叠标签的文本时，是否显示所有选中的标签     | boolean                       | false     |
| filterable           | 是否可搜索                                               | boolean                       | false     |
| expandOnClickNode    | 是否在点击节点的时候展开或者收缩节点                     | boolean                       | true      |
| defaultExpandedKeys  | 默认展开的节点的 key 的数组                              | array                         | []        |
| defaultCheckedKeys   | 默认勾选的节点的 key 的数组                              | array                         | []        |
| size                 | 输入框尺寸                                               | 'large' / 'default' / 'small' | 'default' |
| width                | 选择器宽度                                               | number                        | 240       |
| popperClass          | Select 下拉框的类名                                      | string                        | ''        |

### props

| 属性名   | 说明                                         | 类型              | 默认值     |
| -------- | -------------------------------------------- | ----------------- | ---------- |
| children | 指定子树为节点对象的某个属性值               | string            | 'children' |
| label    | 指定节点标签为节点对象的某个属性值           | string            | 'label'    |
| disabled | 指定节点选择框是否禁用为节点对象的某个属性值 | string / function | -          |
| isLeaf   | 指定节点是否为叶子节点                       | string / function | -          |

## 事件

| 事件名     | 说明                                     | 回调参数      |
| ---------- | ---------------------------------------- | ------------- |
| change     | 选中值发生变化时触发                     | 目前的选中值  |
| clear      | 可清空的单选模式下用户点击清空按钮时触发 | -             |
| remove-tag | 多选模式下移除 tag 时触发                | 移除的 tag 值 |

## 插槽

暂无自定义插槽。
