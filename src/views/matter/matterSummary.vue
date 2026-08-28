<template>
  <div v-show="initInfo.isShowPage" class="container">
    <Header
      ref="headerRef"
      @onDetailView="DetailViewHandle"
      @exportApiData="pageDataHandle('EXPORT')"
      @expandData="expandDataHandle"
      @pageExportData="pageDataHandle('PAGEEXPORT')"
      v-if="initInfo.isShowPage"
    />
    <div class="main" v-if="initInfo.isShowPage">
      <MatterSearchMain
        @isDisable="isDisabledHandle"
        @isExport="isExportHandle"
        @isLoad="isLoadHandle"
        ref="matterSearchMainRef"
        name="matter"
        fileName="预算事项汇总查询报表-按页面导出"
        :searchApi="searchData"
        :getDynamicColumnApi="getDynamicColumnData"
        :initInfo="initInfo"
      ></MatterSearchMain>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: '/matter/matterSummary'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import Header from '@/views/matter/components/search/Header.vue'
import MatterSearchMain from '@/views/matter/components/search/MatterSearchMain.vue'
import { onMounted, reactive, ref } from 'vue'
import { InitInfo } from './interface'
import { getData, Params, getDynamicColumn } from '@/api/matter/search'

const userDialogRef = ref()
const matterSearchMainRef = ref()
const headerRef = ref()

const initInfo = reactive<InitInfo>({
  isShowPage: false,
  userInfo: {}
})

const searchData = (params: Params) => {
  params.dwId = initInfo.userInfo.specialorgid
  return getData(params)
}
const getDynamicColumnData = (params: string) => {
  return getDynamicColumn(params)
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  initInfo.userInfo = { ...userDialogRef.value.userMsg }
  if (isQuery) {
    initInfo.isShowPage = true
  }
}

const expandDataHandle = () => {
  const $matter = matterSearchMainRef.value
  if ($matter) {
    $matter.expandHandle()
  }
}

const DetailViewHandle = () => {
  const $matter = matterSearchMainRef.value
  if ($matter) {
    $matter.getDetailMsgHandle()
  }
}

const pageDataHandle = (flag: string) => {
  const $matter = matterSearchMainRef.value
  if ($matter) {
    if ($matter.formData.zsfs === '4') {
      $matter.exportApiHandle(flag)
    } else if ($matter.formData.zsfs === '3') {
      $matter.pageExportData()
    } else {
      $matter.pageExportHandle()
    }
  }
}

const isDisabledHandle = (val: boolean) => {
  const $header = headerRef.value
  if ($header) {
    $header.isDisabled = val
  }
}
const isExportHandle = (val: boolean) => {
  const $header = headerRef.value
  if ($header) {
    $header.isExported = val
  }
}
const isLoadHandle = (val: boolean) => {
  const $header = headerRef.value
  if ($header) {
    $header.isLoaded = val
  }
}

const initData = () => {
  userDialogRef.value.getUser()
}

onMounted(initData)
</script>

<style scoped lang="less">
.container {
  height: calc(100vh - 110px);
  padding: 10px;
  display: flex;
  flex-direction: column;
  .main {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
