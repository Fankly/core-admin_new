<template>
  <el-select
    v-bind="$attrs"
    :model-value="currentValue"
    :disabled="$attrs.disabled || $attrs.readonly"
    @update:modelValue="handleModelChange"
    @change="handleChange"
  >
    <el-option
      v-for="item in _options"
      :key="defaultPropsName.keyFor ? item[defaultPropsName.keyFor] : item[defaultPropsName.value]"
      :label="item[defaultPropsName.label]"
      :value="item[defaultPropsName.value]"
      :disabled="item[defaultPropsName.disabled]"
    >
      <span>
        <span :title="item[defaultPropsName.label]">{{ item[defaultPropsName.label] }}</span>
      </span>
    </el-option>
  </el-select>
</template>

<script>
export default {
  name: 'base-select',
  inheritAttrs: false,
  props: {
    modelValue: {
      default: undefined
    },
    value: {
      default: ''
    }
  },
  emits: ['update:modelValue', 'input', 'change'],
  data() {
    return {
      width: 0,
      options: [],
      defaultProps: {
        label: 'label',
        value: 'value',
        disabled: 'disabled'
      }
    }
  },
  watch: {
    // '$attrs.api': {
    //   handler: function (value) {
    //     if (value) {
    //       this.getDataSource()
    //     } else {
    //       this.options = []
    //     }
    //   },
    //   immediate: true
    // }
  },
  mounted() {},
  computed: {
    currentValue() {
      return this.modelValue !== undefined ? this.modelValue : this.value
    },
    _options() {
      return this.$attrs.options || this.options
    },
    defaultPropsName() {
      return this.$attrs.defaultProps || this.defaultProps
    }
  },
  methods: {
    handleModelChange(value) {
      this.$emit('update:modelValue', value)
      this.$emit('input', value)
    },
    handleChange(value) {
      this.$emit('change', value)
    }
    // getDataSource () {
    //   this.API.get(this.$attrs.api).then(response => {
    //     if (response.list) {
    //       this.options = response.list
    //     } else {
    //       this.options = response
    //     }
    //   })
    // }
  }
}
</script>
<style lang="less">
.span-ellipsis {
  display: inline-block;
  // max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
</style>
