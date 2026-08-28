<!-- 事项展示列表 -->
<template>
  <div>
    <vxe-modal ref="modalRef" resize show-zoom v-model="isShowTable" :destroy-on-close="true" :title="tableTitle" :width="1200" :height="700" :close-on-press-escape="false" @close="closeSxModal" :loading="loading">
      <proTable ref="proTableRef" :data-callback="pageList" :toolButton="['other']" :request-api="pageMeeting" :request-auto="false" :search-col="4" :columns="tableColumns" @row-click="handerClickTable">
        <template #tableHeader="scope">
          <el-button size="mini" type="primary" :disabled="!scope.isSelected" plain @click="showProView(scope.selectedList)">查 看</el-button>
          <el-button size="mini" type="primary" plain @click="handleExport(scope.selectedList)">导 出</el-button>
          <el-button size="mini" type="primary" plain @click="showAllPro">查看全部项目</el-button>
        </template>
      </proTable>
    </vxe-modal>
  </div>
  <vxe-modal ref="modalRef" resize show-zoom v-model="showXmModal" :destroy-on-close="true" :title="modalTitle" :width="1200" :height="700" :close-on-press-escape="false" @close="closeHandle" :loading="loading">
    <xmTable :columns="xmColumns" ref="viewsTableRef" :getTableApi="xmGetTableApi" :exportApi="xmExportApi" :api-type="apiParamsType" />
  </vxe-modal>
</template>
<script lang="ts">
export default {
  name: 'sxTable'
}
</script>
<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import xmTable from '@/components/yssxTable/xmTable.vue'
import { formatNumValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import { apiExportHandle } from '@/utils/export'

interface propsVo {
  getTableApi: (params: any) => Promise<any>
  exportApi: (params: any) => Promise<any>
  xmGetTableApi: (params: any) => Promise<any>
  xmExportApi: (params: any) => Promise<any>
  xmLsxt: boolean
  apiParamsType: string
}

const props = defineProps<propsVo>()
// 子组件
const emit = defineEmits(['pageType'])
const formData = ref<any>({})
const proTableRef = ref() // 初始化页面
const showXmModal = ref<boolean>(false)
const modalTitle = ref<string>('')
const modalRef = ref()
const viewsTableRef = ref()
const tableParams = ref<any>({})
const tableTitle = ref<any>('')
const isShowTable = ref<boolean>(false)
const loading = ref<boolean>(false)

// 列表查询
const pageMeeting = (params: any) => {
  loading.value = true
  params = { ...params, ...formData.value }
  tableParams.value = { ...formData.value }
  return props.getTableApi(params)
}
// 数据回调
const pageList = (val: any) => {
  loading.value = false
  return val
}
const closeSxModal = () => {
  isShowTable.value = false
}
const closeHandle = () => {
  showXmModal.value = false
}
// 查看
const showProView = (selecList: any) => {
  loading.value = true
  if (selecList && selecList.length != 0) {
    tableParams.value.yssxIdList = selecList.map((item: any) => item.yssxId)
    showXmModal.value = true
    modalTitle.value = '项目明细'
    nextTick(() => {
      viewsTableRef.value.formData = {
        ...tableParams.value
      }
      viewsTableRef.value?.proTableRef.getTableList()
      loading.value = false
    })
  } else {
    ElMessage.warning('请选择要查看的数据')
  }
}
// 查看全部
const showAllPro = (selecList: any) => {
  tableParams.value.yssxIdList = undefined
  loading.value = true
  if (selecList && selecList.length != 0) {
    showXmModal.value = true
    modalTitle.value = '项目明细'
    nextTick(() => {
      viewsTableRef.value.formData = {
        ...tableParams.value
      }
      viewsTableRef.value?.proTableRef.getTableList()
      loading.value = false
    })
  } else {
    ElMessage.warning('请选择要查看的数据')
  }
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
    const fileName = '事项明细表'
    apiExportHandle(params, fileName, props.exportApi)
    loading.value = false
  } catch (e) {
    loading.value = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', label: '序号', width: 50 },
  { prop: 'xmlxName', label: '项目类型' }, // width: "140"
  { prop: 'zgkbmName', label: '归口部门' }, // width: "150"
  { prop: 'zdtxName', label: '重点投向' },
  { prop: 'yssxName', label: '事项名称' }, //, width: "180"
  { prop: 'nd', label: '年度', width: '80' },
  { prop: 'xmsl', label: '项目数量', width: '100' },
  {
    prop: 'amount',
    label: '项目金额（万元）',
    width: '150',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.amount
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6)
    }
  }
])

const xmColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', label: '序号', width: '50' },
  { prop: 'flowStatus', label: '流程状态', width: '180', isShow: props.xmLsxt },
  { prop: 'jhssnd', label: '计划实施年度', width: '120' },
  { prop: 'xmbm', label: '项目编码', width: '180' },
  { prop: 'xmmc', label: '项目名称', width: '280' },
  { prop: 'sfgmb', label: '是否规模包', width: '100' },
  { prop: 'proTypeName', label: '项目类型', width: '200' },
  { prop: 'yjdw', label: '一级单位', width: '280' },
  { prop: 'ejdw', label: '二级单位', width: '280' },
  {
    prop: 'amount',
    label: '申报金额（万元）',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.amount
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6)
    }
  },
  { prop: 'zdtx', label: '重点投向', width: '180' },
  { prop: 'zgkbm', label: '省归口部门', width: '180' },
  { prop: 'yssxmc', label: '预算事项名称', width: '200' },
  { prop: 'sjfl', label: '三级分类', width: '140' }
])

defineExpose({
  proTableRef,
  formData,
  tableTitle,
  isShowTable,
  loading,
  viewsTableRef
})
</script>
<style scoped lang="less"></style>
