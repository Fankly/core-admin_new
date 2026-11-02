<template>
  <dialogContainer ref="dialogContainer" :onCancel="() => onCancel(false)" :onSubmit="() => onSubmit()">
    <FormConfigBox :config="{ rules }" ref="formConfigBox" class="publicSet" :options="options" v-model="reason" />
  </dialogContainer>
</template>
<script setup>
import { reactive, toRef, toRefs, computed, getCurrentInstance, useTemplateRef } from 'vue'
defineOptions({
  name: 'rejectReason'
})
const componentProps = defineProps({})
const componentInstance = getCurrentInstance().proxy
const formConfigBoxRef = useTemplateRef('formConfigBox')
const componentData = reactive({
  reason: {},
  rules: {
    reason: {
      required: true,
      message: '请输入驳回理由',
      trigger: 'blur'
    }
  }
})
const reason = toRef(componentData, 'reason')
const rules = toRef(componentData, 'rules')
function onCancel(isSuccess = false, data) {
  if (componentInstance.observer != null) {
    componentInstance.observer.cancel(isSuccess, data)
  }
}
function onSubmit() {
  formConfigBoxRef.value.handleSubmit((val) => {
    onCancel(true, componentData.reason)
  })
}
const options = computed(() => {
  return [
    {
      tag: 'textarea',
      prop: 'reason',
      label: '驳回理由',
      attrs: {}
    }
  ]
})
defineExpose({
  onCancel,
  onSubmit,
  ...toRefs(componentData),
  options
})
</script>
<style lang="less" scoped></style>
