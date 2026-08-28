<template>
  <el-form
    :label-position="config.labelPosition || 'right'"
    class="FormConfigBox"
    ref="form"
    :model="formModel"
    :rules="_config.rules"
    :label-width="_config.labelWidth"
    :size="defaultFormItemSize"
    @submit.prevent
  >
    <el-row
      style="height: 100%; display: flex; flex-wrap: wrap"
      :type="config.justify ? 'flex' : ''"
      :justify="config.justify"
      :gutter="config.gutter || 20"
      :class="{ 'flex-warp': flexWarp }"
    >
      <template v-for="(option, index) in options.filter((item) => item)" :key="index">
        <el-col :span="config.span || option.span || 24">
          <slot v-if="option.formSlot" :name="option.prop" />
          <el-form-item
            v-else
            :rules="option.rules"
            :label="`${option.label}：`"
            :prop="option.prop"
            :clearable="option.clearable || _config.clearable"
          >
            <ConfigItem
              v-model:objectRef="objectRefs[option.prop]"
              customClass="configForm-item"
              :option="{
                ...option,
                attrs: { ...option.attrs, options: option.dict && !option.attrs?.options ? dictOptions[option.dict] || [] : option.attrs?.options }
              }"
              v-model="formModel[option.prop]"
              :disabled="disabled"
              :readonly="readonly || option.readonly"
              :size="defaultFormItemSize"
            >
              <!-- {{(option.dict && !option.attrs?.options) }} -->
              <slot v-if="option.slot" :name="option.prop" />
            </ConfigItem>
            <template v-if="option.errorSlot" #error="{ error }">
              <slot :name="option.prop + 'ErrorSlot'" :error="error" />
            </template>
          </el-form-item>
        </el-col>
      </template>
    </el-row>
  </el-form>
</template>
<script>
import ConfigItem from '../ConfigItem/index.vue'
import { SysGlobalDictController } from '@/api'
import _ from 'lodash'

export default {
  components: {
    ConfigItem
  },
  props: {
    config: {
      // 绑定值
      type: Object,
      default: () => ({})
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
    onSubmit: {
      // 绑定值
      type: Function,
      default: () => {}
    },
    flexWarp: Boolean,
    readonly: Boolean,
    disabled: Boolean
  },
  model: {
    prop: 'value',
    event: 'on-model-change'
  },
  name: 'FormConfigBox',
  data() {
    return {
      objectRefs: {},
      defaultConfig: {
        labelWidth: '120px',
        clearable: true,
        rules: {}
      },
      dictOptions: {}
    }
  },
  created() {
    this.defaultValues = _.cloneDeep(this.formModel)
  },
  mounted() {
    const dictOptions = this.options || []
    dictOptions
      .filter((item) => item?.dict)
      .forEach((obj) => {
        this.loadDictDropdownList(obj.dict).then((res) => {
          this.dictOptions[obj.dict] = obj.optionFormatter ? obj.optionFormatter(res) : res
        })
      })
  },
  methods: {
    loadDictDropdownList(dictCode) {
      return new Promise((resolve, reject) => {
        let params = {
          dictCode
        }
        SysGlobalDictController.listAll(this, params)
          .then((res) => {
            resolve(res?.fullResultList)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    handleSubmit(callback = () => {}) {
      this.$refs.form.validate((valid, errors) => {
        if (valid) {
          callback(this.formModel)
          this.onSubmit(this.formModel)
        }
      })
    },
    validate(callback = () => {}) {
      this.$refs.form.validate((valid, errors) => {
        callback(valid, errors)
      })
    },
    handleReset() {
      this.$refs.form.resetFields()
      const newObj = _.cloneDeep(this.defaultValues)
      this.emitModelChange(newObj)
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
<style lang="scss" scoped>
.FormConfigBox {
  .config-item {
    width: 100%;
  }
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}
</style>
