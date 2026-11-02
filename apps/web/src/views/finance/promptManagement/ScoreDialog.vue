<template>
  <dialogContainer :buttonLoading="buttonLoading" :onCancel="() => handleCancel()" :onSubmit="() => handleSubmit()" ref="dialogContainer">
    <FormConfigBox :config="{ rules }" ref="form" :options="infoOptions" v-model="formData">
      <template #effectScore>
        <el-rate v-model="formData.effectScore" :max="5" allow-half show-score text-color="#ff9900" />
      </template>
    </FormConfigBox>
  </dialogContainer>
</template>

<script setup>
import { reactive, toRef, toRefs, computed, watch, getCurrentInstance, useTemplateRef } from 'vue'
defineOptions({
  name: 'ScoreDialog'
})
const componentProps = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  score: {
    type: [Number, String],
    default: 0
  },
  remark: {
    type: String,
    default: ''
  }
})
const componentInstance = getCurrentInstance().proxy
const formRef = useTemplateRef('form')
const componentData = reactive({
  buttonLoading: false,
  formData: {
    effectScore: 0,
    effectScoreRemark: ''
  }
})
const buttonLoading = toRef(componentData, 'buttonLoading')
const formData = toRef(componentData, 'formData')
function handleCancel() {
  if (componentInstance.observer != null) {
    componentInstance.observer.cancel(false)
  }
}
function handleSubmit() {
  formRef.value.validate((valid) => {
    if (valid) {
      if (componentInstance.observer != null) {
        componentInstance.observer.cancel(true, componentData.formData)
      }
    }
  })
}
const rules = computed(() => {
  return {}
})
const infoOptions = computed(() => {
  return [
    {
      prop: 'effectScore',
      label: '效果评分',
      slot: true
    },
    {
      tag: 'textarea',
      prop: 'effectScoreRemark',
      label: '备注说明',
      attrs: {
        placeholder: '请输入',
        rows: 5
      }
    }
  ]
})
watch(
  () => componentProps.score,
  function (val) {
    componentData.formData.effectScore = val || 0
  },
  {
    immediate: true
  }
)
watch(
  () => componentProps.remark,
  function (val) {
    componentData.formData.effectScoreRemark = val || ''
  },
  {
    immediate: true
  }
)
defineExpose({
  handleCancel,
  handleSubmit,
  ...toRefs(componentData),
  rules,
  infoOptions
})
</script>

<style lang="less" scoped>
:deep(.el-form-item) {
  display: flex;
  align-items: center;

  .el-form-item__label {
    display: flex;
    align-items: center;
    width: auto !important;
  }

  .el-form-item__content {
    display: flex;
    align-items: center;
    margin-left: 0 !important;
    flex: 1;
  }
}
</style>
