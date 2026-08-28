<template>
  <el-form
    :class="{ filterConfigBox: true, 'filterConfigBox-style': type == 'card' }"
    ref="form"
    :model="formModel"
    :rules="_config.rules"
    :label-width="_config.labelWidth"
    :size="defaultFormItemSize"
    label-position="right"
    @submit.prevent
  >
    <filter-box @search="handleSearch(true)" @reset="onReset">
      <template v-for="(option, index) in options" :key="index">
        <el-col :span="option.span || config.span">
          <el-form-item :label="option.label" :prop="option.prop" :label-width="option.labelWidth || config.labelWidth" :clearable="option.clearable">
            <template v-if="option.labelPrompt" v-slot:label>
              <div class="label-with-tooltip">
                {{ option.label }}
                <el-tooltip v-if="option.labelPrompt" :content="option.labelPrompt" placement="top">
                  <i class="el-icon-info tooltip-icon"></i>
                </el-tooltip>
              </div>
            </template>
            <ConfigItem
              customStyle="width: 100%;"
              :option="option"
              v-model="formModel[option.prop]"
              :disabled="disabled"
              :readonly="readonly || option.readonly"
            />
          </el-form-item>
        </el-col>
      </template>
    </filter-box>
    <template v-slot:operation>
      <slot name="operation"></slot>
    </template>
  </el-form>
</template>
<script>
import ConfigItem from '../ConfigItem/index.vue'
import FilterBox from '../FilterBox/index.vue'
import _ from 'lodash'

export default {
  components: {
    ConfigItem,
    FilterBox
  },
  props: {
    type: {
      type: String,
      default: ''
    },
    config: {
      // 绑定值
      type: Object,
      default: () => ({
        labelWidth: '100px',
        span: 4
      })
    },
    options: {
      // 表单项
      type: Array,
      default: () => []
    },
    value: {
      // 绑定值
      type: Object,
      default: () => ({})
    },
    modelValue: {
      // Vue 3 v-model
      type: Object,
      default: undefined
    },
    readonly: Boolean,
    disabled: Boolean
  },
  name: 'FilterConfigBox',
  data() {
    return {
      defaultConfig: {
        labelWidth: '75px'
      },
      defaultValues: {}
    }
  },
  created() {
    this.defaultValues = _.cloneDeep(this.formModel)
  },
  mounted() {},
  methods: {
    handleSearch() {
      this.emitModelChange(this.formModel)
      this.$emit('search', this.formModel)
    },
    onReset() {
      this.$refs.form.resetFields()
      const newObj = _.cloneDeep(this.defaultValues)
      this.emitModelChange(newObj)
      this.$emit('onReset', newObj)
    },
    emitModelChange(value) {
      this.$emit('update:modelValue', value)
      this.$emit('on-model-change', value)
    }
  },
  computed: {
    formModel() {
      return this.modelValue ?? this.value
    },
    _config() {
      return {
        ...this.defaultConfig,
        ...this.config
      }
    }
  },
  watch: {}
}
</script>
<style lang="less" scoped>
.filterConfigBox {
  // border-radius: 5px;
  // overflow: hidden;
  margin-bottom: 16px;
  .flex-box {
    margin-bottom: 0;
  }
}
.label-with-tooltip {
  display: flex;
  align-items: center;
  display: inline-block;
}
.tooltip-icon {
  // margin-left: 5px;
  color: #909399;
  cursor: pointer;
}
.tooltip-icon:hover {
  color: @color-primary;
}
</style>
