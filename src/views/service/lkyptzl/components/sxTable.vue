<!-- 事项展示列表 -->
<template>
  <div>
    <vxe-modal ref="modalRef" resize show-zoom v-model="isShowTable" :destroy-on-close="true" :title="tableTitle" :width="1200" :height="700" :close-on-press-escape="false" @close="closeSxModal" :loading="loading">
      <proTable ref="proTableRef" :data-callback="pageList" :toolButton="['other']" :request-api="pageMeeting" :request-auto="false" :search-col="4" :columns="tableColumns" @row-click="handleClickRow">
        <template #tableHeader="scope">
          <el-button size="mini" type="primary" :disabled="!scope.isSelected" plain @click="showProView(scope.selectedList)">查 看</el-button>
          <el-button size="mini" type="primary" plain @click="handleExport(scope.selectedList)">导 出</el-button>
          <el-button size="mini" type="primary" plain @click="showAllPro">查看全部项目</el-button>
        </template>
      </proTable>
    </vxe-modal>
  </div>
  <vxe-modal ref="modalRef" resize show-zoom v-model="showXmModal" :destroy-on-close="true" :title="modalTitle" :width="1200" :height="700" :close-on-press-escape="false" @close="closeHandle" :loading="loading">
    <viewTable ref="viewsTableRef" :isCity="true" />
  </vxe-modal>
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, reactive, defineEmits, nextTick, defineExpose } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { pageYssxInfo, exportYssxInfo, pageYssxInfoForCard, exportYssxInfoForCard } from '@/api/lkyptzl/index'
import viewTable from '@/views/service/lkyptzl/components/viewTable.vue'
import { formatNumValue } from '@/utils/utils'
import { ElNotification, ElMessage } from 'element-plus'

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
const apiType = ref<any>('1')
const loading = ref<boolean>(false)

// 列表查询
const pageMeeting = (params: any) => {
  loading.value = true
  const api: any = apiType.value == '2' ? pageYssxInfoForCard : pageYssxInfo
  params = { ...params, ...formData.value }
  tableParams.value = { ...formData.value }
  return api(params)
}
// 数据回调
const pageList = (val: any) => {
  loading.value = false
  return val
}
const closeSxModal = () => {
  isShowTable.value = false
  apiType.value = '1'
}
const closeHandle = () => {
  showXmModal.value = false
}
// 单击行选中当前行
const handleClickRow = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 查看全部
const showAllPro = () => {
  tableParams.value.yssxIdList = undefined
  showXmModal.value = true
  modalTitle.value = '项目明细'
  nextTick(() => {
    viewsTableRef.value.formData = {
      ...tableParams.value,
      isClick: apiType.value == '2' ? '3' : '1'
    }
    viewsTableRef.value?.proTableRef.getTableList()
    loading.value = false
  })
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
        ...tableParams.value,
        isClick: apiType.value == '2' ? '3' : '1'
      }
      viewsTableRef.value?.proTableRef.getTableList()
      loading.value = false
    })
  } else {
    ElMessage.warning('请选择要查看的数据')
  }
}
// 导出
const handleExport = (val: any) => {
  loading.value = true
  ElNotification({
    title: '温馨提示',
    message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  const api: any = apiType.value == '2' ? exportYssxInfoForCard : exportYssxInfo
  api(formData.value).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    let filename = '事项明细表.xlsx' // 获取文件名
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  })
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', label: '序号', width: 50 },
  { prop: 'xmlxName', label: '项目类型' }, // width: "140"
  { prop: 'zgkbmName', label: '归口部门' }, // width: "150"
  { prop: 'zdtxName', label: '重点投向' },
  { prop: 'yssxName', label: '事项名称' }, //, width: "180"
  // { prop: "proTypeName", label: "预算主体", width: "200" },
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

//

defineExpose({
  proTableRef,
  formData,
  tableTitle,
  isShowTable,
  apiType,
  loading
})
</script>
<style scoped lang="less"></style>
