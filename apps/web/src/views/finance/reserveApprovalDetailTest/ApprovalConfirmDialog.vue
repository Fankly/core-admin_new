<template>
  <dialogContainer
    submitLabel="确认"
    :buttonLoading="buttonLoading"
    class="ApprovalConfirmDialog"
    ref="dialogContainer"
    :onCancel="() => onCancel(false)"
    :onSubmit="() => onSubmit()"
  >
    <FormConfigBox :config="{ rules }" ref="form" :options="infoOptions" v-model="dataValue"> </FormConfigBox>
    <div class="info">注：以上为不含税金额，单位统一为万元</div>
  </dialogContainer>
</template>

<script setup>
import { AmountPattern, Subtract } from './ApprovalConfirmDialog.module'
import { CwProjectApply, FinanceReserveNotice, Category, CwCategoryInvest } from '@/api/mainController'
import { nextTick, reactive, toRef, toRefs, computed, onMounted, getCurrentInstance, useTemplateRef } from 'vue'
defineOptions({
  name: '/finance/reserveApprovalDetailTest/ApprovalConfirmDialog'
})
const componentProps = defineProps({
  applyTaxExclusive: [String, Number]
})
const componentInstance = getCurrentInstance().proxy
const formRef = useTemplateRef('form')
const componentData = reactive({
  buttonLoading: false,
  dataValue: {},
  rules: {
    applyTaxExclusive: [
      {
        required: true,
        message: '请输入申请总额',
        trigger: 'blur'
      },
      AmountPattern
    ],
    verifiedAmount: [
      {
        required: true,
        message: '请输入核定金额',
        trigger: 'blur'
      },
      {
        validator: (rule, value, callback) => {
          if (value > componentData.dataValue.applyTaxExclusive) {
            callback(new Error('核定金额 不能大于 申请总额'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      },
      AmountPattern
    ],
    reductionAmount: [
      {
        required: true,
        message: '请输入核减金额',
        trigger: 'blur'
      },
      AmountPattern
    ]
  },
  batchId: []
})
const buttonLoading = toRef(componentData, 'buttonLoading')
const dataValue = toRef(componentData, 'dataValue')
const rules = toRef(componentData, 'rules')
const batchId = toRef(componentData, 'batchId')
async function initFormData() {}
function addApi() {}
function onCancel(isSuccess = false, data) {
  if (componentInstance.observer != null) {
    componentInstance.observer.cancel(isSuccess, data)
  }
}
function onSubmit() {
  formRef.value.handleSubmit(() => {
    // this.buttonLoading = true;
    // this.addApi(() => {
    onCancel(true, componentData.dataValue)
    // })
    // .finally(() => {
    //   this.buttonLoading = false;
    // })
  })
}
function changeAmount() {
  nextTick(() => {
    const { applyTaxExclusive, verifiedAmount } = componentData.dataValue
    if (applyTaxExclusive != null && verifiedAmount != null) {
      const result = Subtract(applyTaxExclusive, verifiedAmount)
      componentData.dataValue = {
        ...componentData.dataValue,
        reductionAmount: result < 0 ? null : result
      }
    }
  })
}
const infoOptions = computed(() => {
  return [
    {
      tag: 'number',
      prop: 'applyTaxExclusive',
      label: '申请总额',
      attrs: {
        disabled: true
      },
      listeners: {
        change: () => {
          changeAmount()
        }
      }
    },
    {
      tag: 'number',
      prop: 'verifiedAmount',
      label: '核定金额',
      listeners: {
        change: () => {
          changeAmount()
        }
      }
    },
    {
      tag: 'number',
      prop: 'reductionAmount',
      label: '核减金额',
      listeners: {
        change: () => {}
      }
    }
  ]
})
onMounted(() => {
  initFormData()
})
;(() => {
  componentData.dataValue = {
    applyTaxExclusive: componentProps.applyTaxExclusive,
    verifiedAmount: componentProps.applyTaxExclusive,
    reductionAmount: 0
  }
})()
defineExpose({
  initFormData,
  addApi,
  onCancel,
  onSubmit,
  changeAmount,
  ...toRefs(componentData),
  infoOptions
})
</script>
<style lang="less" scoped>
.info {
  color: @--color-primary-light-4;
  margin-left: 35px;
  font-size: 12px;
}
</style>
