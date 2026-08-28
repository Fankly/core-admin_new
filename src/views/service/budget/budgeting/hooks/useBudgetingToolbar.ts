import { ref, inject, Ref } from 'vue'
import { ServiceBtn } from '@/views/service/budget/budgeting/types/budgeting'
import { BaseMethod } from '@/api/base/BaseMethod'
import { RowVO } from '@/views/service/budget/budgeting/types/budgeting'

export const useBudgetingToolbar = () => {
  const checkedData = inject<Ref<RowVO[]>>('checkedData', ref([]))
  const baseMethod = new BaseMethod()

  const handleSaveData = () => {
    console.log(checkedData.value)
  }
  const handleCopyData = () => {
    console.log(checkedData.value)
  }
  const handleImportData = () => {}
  const handleExportData = async () => {}
  const handleSubmitData = () => {}
  const handleSendSapData = () => {}
  const handleProcessData = () => {}
  const handleCallbackData = () => {}
  const handleCallbackStockOutData = () => {}

  const serviceBtn = ref<ServiceBtn[]>([
    {
      name: '保 存',
      pression: 'SAVE',
      method: handleSaveData
    },
    {
      name: '复 制',
      pression: 'COPY',
      method: handleCopyData
    },
    {
      name: '导 入',
      pression: 'IMPORT',
      method: handleImportData
    },
    {
      name: '导 出',
      pression: 'EXPORT',
      method: handleExportData
    },
    {
      name: '提 交',
      pression: 'SUBMIT',
      method: handleSubmitData
    },
    {
      name: '发送SAP',
      pression: 'SENDSAP',
      method: handleSendSapData
    },
    {
      name: '流程履历',
      pression: 'PROCESS',
      method: handleProcessData
    },
    {
      name: '退回录入',
      pression: 'ENTRY',
      method: handleCallbackData
    },
    {
      name: '退回出库',
      pression: 'OUTBOUND',
      method: handleCallbackStockOutData
    }
  ])

  return {
    serviceBtn
  }
}
