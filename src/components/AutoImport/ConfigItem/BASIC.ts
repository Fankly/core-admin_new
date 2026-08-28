export interface BasicComponentMeta {
  component: string
  attrs?: Record<string, unknown>
  listeners?: Record<string, (...args: unknown[]) => unknown>
}

const BASIC: Record<string, BasicComponentMeta> = {
  upload: {
    component: 'el-upload',
    attrs: { placeholder: '请输入' }
  },
  button: {
    component: 'el-button',
    attrs: {
      placeholder: '请输入',
      clearable: true,
      spellcheck: false,
      label: '按钮'
    }
  },
  input: {
    component: 'el-input',
    attrs: { placeholder: '请输入', clearable: true }
  },
  inputrange: {
    component: 'base-inputrange',
    attrs: { placeholder: '请输入', clearable: true }
  },
  select: {
    // 旧项目用自定义 base-select(支持 options 自动渲染);Vue3 工程可改用 el-select 配合 v-for
    component: 'base-select',
    attrs: { placeholder: '请选择', clearable: true }
  },
  date: {
    component: 'el-date-picker',
    attrs: {
      placeholder: '选择',
      clearable: true,
      type: 'date',
      // Vue3 element-plus 用小写格式
      format: 'YYYY-MM-DD',
      'value-format': 'YYYY-MM-DD'
    }
  },
  daterange: {
    component: 'base-daterange',
    attrs: {
      placeholder: '选择',
      clearable: true,
      type: 'daterange',
      'start-placeholder': '开始日期',
      'end-placeholder': '结束日期',
      format: 'YYYY-MM-DD',
      'value-format': 'YYYY-MM-DD HH:mm:ss'
    }
  },
  selectcascader: {
    component: 'base-cascader',
    attrs: { clearable: true, placeholder: '请选择' }
  },
  cascader: {
    component: 'el-cascader',
    attrs: { clearable: true, placeholder: '请选择' }
  },
  textarea: {
    component: 'el-input',
    attrs: { type: 'textarea', placeholder: '请输入', rows: 3 }
  },
  number: {
    component: 'el-input-number',
    attrs: { placeholder: '请输入', clearable: true, 'controls-position': 'right' },
    listeners: {}
  },
  datetime: {
    component: 'el-date-picker',
    attrs: {
      placeholder: '选择',
      clearable: true,
      type: 'datetime',
      format: 'YYYY-MM-DD HH:mm:ss',
      'value-format': 'YYYY-MM-DD HH:mm:ss'
    }
  },
  'checkbox-group': {
    component: 'base-checkbox-group',
    attrs: { placeholder: '请勾选' }
  },
  'radio-group': {
    component: 'base-radio-group',
    attrs: { placeholder: '请勾选' }
  },
  switch: {
    component: 'el-switch',
    attrs: { 'active-value': 1, 'inactive-value': 0 }
  }
}

export default BASIC
