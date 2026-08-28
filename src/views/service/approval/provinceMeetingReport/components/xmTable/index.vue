<!-- 明细展示列表 -->
<template>
  <div>
    <vxe-modal
      ref="modalRef"
      resize
      show-zoom
      v-model="isShowTable"
      :destroy-on-close="true"
      :title="`穿透明细`"
      :width="1200"
      :height="700"
      :close-on-press-escape="false"
      @close="closeDetailModal"
      :loading="loading"
    >
      <proTable
        ref="proTableRef"
        :data-callback="pageList"
        :toolButton="['other']"
        :request-api="pageMeeting"
        :request-auto="false"
        :search-col="4"
        :columns="tableColumns"
        @row-click="handerClickTable"
      >
        <template #tableHeader="scope">
          <el-button size="mini" type="primary" plain @click="handleExport(scope.selectedList)">导 出</el-button>
        </template>
      </proTable>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'xmTable'
}
</script>
<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { formatNumValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import { apiExportHandle } from '@/utils/export'
import { tjfxGetCtData, tjfxExportCtData } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
const formData = ref<any>({})
const proTableRef = ref() // 初始化页面
const showXmModal = ref<boolean>(false)
const modalTitle = ref<string>('')
const modalRef = ref()
const viewsTableRef = ref()
const isShowTable = ref<boolean>(false)
const loading = ref<boolean>(false)

// 列表查询
const pageMeeting = (params: any) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  params = { ...params, ...formData.value }
  return tjfxGetCtData(params)
}
// 数据回调
const pageList = (val: any) => {
  loading.value = false
  return val
}
const closeDetailModal = () => {
  isShowTable.value = false
}
// 单击行选中当前行
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 导出
const handleExport = (val: any) => {
  try {
    loading.value = true
    const params = { ...formData.value }
    const fileName = '项目明细表'
    apiExportHandle(params, fileName, tjfxExportCtData)
    loading.value = false
  } catch (e) {
    loading.value = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}
const open = async (params: any) => {
  isShowTable.value = true
  formData.value = { ...params }
  await nextTick()
  if (proTableRef.value) {
    proTableRef.value?.getTableList()
    proTableRef.value?.clearSelection()
  }
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', label: '序号', width: '50' },
  { prop: 'meetingName', label: '会议名称', width: '280' },
  { prop: 'xmmc', label: '项目名称', width: '280' },
  { prop: 'xmbm', label: '项目编码', width: '180' },
  { prop: 'yssx', label: '预算事项', width: '180' },
  { prop: 'proType', label: '项目类别', width: '150' },
  { prop: 'yjdw', label: '一级单位', width: '280' },
  { prop: 'ejdw', label: '二级单位', width: '280' },
  {
    prop: 'sbje',
    label: '初始申报金额\n(万元)',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.sbje
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6)
    }
  },
  {
    prop: 'nhje',
    label: '首次纳会金额\n(万元)',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.nhje
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6)
    }
  },
  {
    prop: 'sdje',
    label: '审定金额\n(万元)',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.sdje
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6)
    }
  }
])

defineExpose({
  open
})
</script>
<style scoped lang="less"></style>
