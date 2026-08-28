# FormModal 通用表单弹窗组件

基于 vxe-modal 和 element-plus 封装的通用表单弹窗组件，支持新增、编辑、查看三种模式，并提供丰富的表单控件和联动功能。

## 🚀 功能特性

- ✅ **三种模式**: 新增(add)、编辑(edit)、查看(view)
- ✅ **表单布局**: 每行显示两个表单项，宽度都为100%
- ✅ **丰富控件**: 输入框、文本域、数字输入框、选择器、日期选择器、开关、单选框、多选框等
- ✅ **表单验证**: 支持必填验证和自定义验证规则
- ✅ **选择框联动**: 支持静态和动态联动，多级联动
- ✅ **自定义插槽**: 支持自定义表单项
- ✅ **TypeScript**: 完整的类型定义支持

## 📦 安装使用

```typescript
import FormModal, { type FormField } from '@/modules/FormModal'

// 在模板中使用
<FormModal
  ref="formModalRef"
  title="用户信息"
  :mode="mode"
  :fields="formFields"
  :data="formData"
  @save="handleSave"
  @close="handleClose"
/>
```

## 🔧 API 文档

### Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | `'表单'` | 弹窗标题 |
| `mode` | `'add' \| 'edit' \| 'view'` | `'add'` | 弹窗模式 |
| `showModeTitle` | `boolean` | `true` | 是否在标题前显示模式文案 |
| `fields` | `FormField[]` | `[]` | 表单字段配置 |
| `data` | `Record<string, any>` | `{}` | 表单数据 |
| `width` | `string` | `'60%'` | 弹窗宽度 |
| `height` | `string` | `'600px'` | 弹窗高度 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `save` | `(data: Record<string, any>)` | 保存表单数据 |
| `close` | `()` | 关闭弹窗 |

### Methods

| 方法名 | 参数 | 说明 |
|--------|------|------|
| `open` | `()` | 打开弹窗 |
| `close` | `()` | 关闭弹窗 |
| `resetForm` | `()` | 重置表单 |

### FormField 配置

#### 基础配置

| 参数 | 类型 | 说明 |
|------|------|------|
| `prop` | `string` | 字段属性名 |
| `label` | `string` | 字段标签 |
| `type` | `FieldType` | 字段类型 |
| `placeholder` | `string` | 占位符 |
| `disabled` | `boolean` | 是否禁用 |
| `required` | `boolean` | 是否必填 |
| `rules` | `any[]` | 自定义验证规则 |

#### 字段类型 (FieldType)

- `'input'` - 输入框
- `'textarea'` - 文本域
- `'number'` - 数字输入框
- `'select'` - 选择器
- `'date'` - 日期选择器
- `'datetime'` - 日期时间选择器
- `'switch'` - 开关
- `'radio'` - 单选框组
- `'checkbox'` - 多选框组
- `'slot'` - 自定义插槽

#### 特定类型配置

**输入框/文本域**
- `maxlength` - 最大长度
- `rows` - 文本域行数

**数字输入框**
- `min` - 最小值
- `max` - 最大值
- `precision` - 精度
- `step` - 步长

**选择器**
- `options` - 选项数组
- `multiple` - 是否多选
- `clearable` - 是否可清空

**开关**
- `activeValue` - 选中值
- `inactiveValue` - 未选中值

## 🔗 选择框联动功能

### 静态联动配置

使用 `cascadeConfig` 配置静态选项映射：

```typescript
{
  prop: 'city',
  label: '城市',
  type: 'select',
  dependsOn: 'province',
  cascadeConfig: {
    parentField: 'province',
    optionsMap: {
      'beijing': [
        { label: '朝阳区', value: 'chaoyang' },
        { label: '海淀区', value: 'haidian' }
      ],
      'shanghai': [
        { label: '浦东新区', value: 'pudong' },
        { label: '黄浦区', value: 'huangpu' }
      ]
    }
  }
}
```

### 动态联动配置

使用 `optionsLoader` 配置异步加载：

```typescript
{
  prop: 'school',
  label: '学校',
  type: 'select',
  dependsOn: 'city',
  optionsLoader: async (cityValue: string, formData: Record<string, any>) => {
    const response = await api.getSchools(cityValue)
    return response.data.map(school => ({
      label: school.name,
      value: school.id
    }))
  }
}
```

### 联动配置参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `dependsOn` | `string` | 依赖的父级字段名 |
| `cascadeConfig` | `object` | 静态联动配置 |
| `cascadeConfig.parentField` | `string` | 父级字段名 |
| `cascadeConfig.optionsMap` | `Record<string, Array<Option>>` | 选项映射表 |
| `optionsLoader` | `function` | 动态加载选项的函数 |

## 📝 使用示例

### 基础表单

```vue
<template>
  <div>
    <el-button @click="openModal">新增用户</el-button>
    
    <FormModal
      ref="formModalRef"
      title="用户信息"
      :mode="mode"
      :fields="formFields"
      :data="formData"
      @save="handleSave"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import FormModal, { type FormField } from '@/modules/FormModal'

const formModalRef = ref()
const mode = ref<'add' | 'edit' | 'view'>('add')
const formData = reactive({})

const formFields: FormField[] = [
  {
    prop: 'name',
    label: '姓名',
    type: 'input',
    required: true,
    maxlength: 50
  },
  {
    prop: 'age',
    label: '年龄',
    type: 'number',
    required: true,
    min: 1,
    max: 150
  },
  {
    prop: 'email',
    label: '邮箱',
    type: 'input',
    required: true,
    rules: [
      {
        type: 'email',
        message: '请输入正确的邮箱格式',
        trigger: 'blur'
      }
    ]
  },
  {
    prop: 'gender',
    label: '性别',
    type: 'select',
    required: true,
    options: [
      { label: '男', value: '1' },
      { label: '女', value: '2' }
    ]
  },
  {
    prop: 'birthDate',
    label: '出生日期',
    type: 'date'
  },
  {
    prop: 'isActive',
    label: '激活状态',
    type: 'switch',
    activeValue: 1,
    inactiveValue: 0
  },
  {
    prop: 'remark',
    label: '备注',
    type: 'textarea',
    rows: 3,
    maxlength: 200
  }
]

const openModal = () => {
  mode.value = 'add'
  Object.assign(formData, {})
  formModalRef.value?.open()
}

const handleSave = (data: any) => {
  console.log('保存数据:', data)
  // 处理保存逻辑
  formModalRef.value?.close()
}

const handleClose = () => {
  console.log('弹窗关闭')
}
</script>
```

### 省市区联动示例

```typescript
const formFields: FormField[] = [
  {
    prop: 'province',
    label: '省份',
    type: 'select',
    required: true,
    options: [
      { label: '北京市', value: 'beijing' },
      { label: '广东省', value: 'guangdong' }
    ]
  },
  {
    prop: 'city',
    label: '城市',
    type: 'select',
    required: true,
    dependsOn: 'province',
    cascadeConfig: {
      parentField: 'province',
      optionsMap: {
        beijing: [
          { label: '朝阳区', value: 'chaoyang' },
          { label: '海淀区', value: 'haidian' }
        ],
        guangdong: [
          { label: '广州市', value: 'guangzhou' },
          { label: '深圳市', value: 'shenzhen' }
        ]
      }
    }
  },
  {
    prop: 'district',
    label: '区县',
    type: 'select',
    dependsOn: 'city',
    cascadeConfig: {
      parentField: 'city',
      optionsMap: {
        guangzhou: [
          { label: '天河区', value: 'tianhe' },
          { label: '越秀区', value: 'yuexiu' }
        ]
      }
    }
  }
]
```

## ⚠️ 注意事项

1. **依赖关系**: 确保 `dependsOn` 字段在当前字段之前定义
2. **数据清空**: 父级字段变化时，所有子级字段的值会递归清空
3. **加载状态**: 异步加载时选择框会显示加载状态
4. **错误处理**: optionsLoader 出错时会在控制台输出错误信息，选项列表为空
5. **初始化**: 编辑模式下会根据现有数据自动加载对应的联动选项
6. **表单验证**: 查看模式下不会触发表单验证

## 📁 示例文件

- `example.vue` - 基础使用示例
- `cascade-example.vue` - 联动功能示例
- `cascade-test.vue` - 联动清除测试

## 🔧 自定义插槽

组件支持自定义插槽，可以插入自定义表单控件：

```vue
<FormModal :fields="formFields">
  <template #customField="{ field, formData, isViewMode }">
    <!-- 自定义表单控件 -->
    <el-upload
      v-model:file-list="formData[field.prop]"
      :disabled="isViewMode"
    >
      <el-button>上传文件</el-button>
    </el-upload>
  </template>
</FormModal>
```

对应的字段配置：

```typescript
{
  prop: 'customField',
  label: '自定义字段',
  type: 'slot'
}
```
