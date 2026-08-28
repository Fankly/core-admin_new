<template>
  <vxe-modal
    height="820"
    width="70%"
    :destroy-on-close="true"
    :loading="loading"
    :title="'日志'"
    v-model="isShowModal"
    show-zoom
    resize
    position="center"
  >
    <proTable
      @search="searchHandle"
      :init-param="initParam"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      ref="proTableRef"
    />
  </vxe-modal>
</template>

<script setup lang="ts">
import { useData } from '@/views/goalValue/targetBatchSplit/components/hooks/useData'
import proTable from '@/components/ProTable/index.vue'
import { getJhLog } from '@/api/mbz'

const { modalParams, isShowModal, loading, proTableRef, initParam, initParams, nd, tableColumns } = useData()

const accpect = (params: any) => {
  isShowModal.value = true
  modalParams.value = params
  nd.value = params.nd
  initParams()
  initParam.value = {
    dwId: params.dwId
  }
}

const searchHandle = () => {
  proTableRef.value?.clearSelection()
}

const getPageList = (params: any) => {
  loading.value = true
  return getJhLog(params)
}

const callBackHandle = (val: any) => {
  loading.value = false
  return val
}
defineExpose({
  accpect
})
</script>

<style scoped lang="less"></style>
