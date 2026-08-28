<template>
  <div class="table-container">
    <div class="operation">
      <div class="left">
        <el-button :loading="btnLoading" type="primary" size="mini" plain @click="notifyHandle">知道了</el-button>
        <el-button :loading="btnLoading" type="primary" size="mini" plain @click="closeDialogHandle">关 闭</el-button>
        <el-button :loading="btnLoading" type="primary" size="mini" plain @click="downloadHandle">下载操作手册</el-button>
      </div>
    </div>
    <div class="introduction">系统监测到本月贵单位存在“使用权资产原值”变动，请前往“租赁需求管理 》租赁合同台账管理”维护租赁需求编码与合同关系。</div>
    <div class="headerButton">
      <div class="custom-tabs">
        <div
          class="tab-item"
          :class="{ active: searchCode === 'ZLXMJH' }"
          @click="() => searchTableHandle('ZLXMJH')"
        >本月使用权资产变动清单</div>
        <div
          class="tab-item"
          :class="{ active: searchCode === 'ZLXMWUHT' }"
          @click="() => searchTableHandle('ZLXMWUHT')"
        >未挂接租赁需求的合同</div>
      </div>
    </div>
    <div class="table">
      <vxe-table
        :checkbox-config="{
          trigger: 'row',
          highlight: true
        }"
        @cell-click="cellClickHandle"
        @checkbox-change="checkChangeHandle"
        @checkbox-all="checkChangeAllHandle"
        :row-config="{ height: 32 }"
        show-overflow
        :loading="loading"
        align="center"
        height="100%"
        ref="tableRef"
        :border="true"
        :column-config="{ resizable: true }"
        :data="tableInfo.tableData"
      >
        <vxe-column type="checkbox" width="80"></vxe-column>
        <vxe-column
          v-for="item in tableInfo.columns"
          :key="item.code"
          :formatter="formatterData"
          header-align="center"
          align="center"
          width="200"
          :field="item.columnKey"
          :title="item.columnValue"
        >
        </vxe-column>
      </vxe-table>
    </div>
    <div class="pager">
      <el-pagination
        :current-page="page.page"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
  </div>
  <CentralizedModification
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="checkedData[0]"
    :customParam="customParam"
    flag="VIEW"
  ></CentralizedModification>
</template>

<script setup lang="ts">
import { getDynamicTableByUser } from '@/api/service/requirement'
import {
  getZlpzForJh,
  getXmWithOutHt,
  notify,
  downloadJhCzsc
} from '@/api/workflow'
import { formatValue } from '@/utils/utils'
import CentralizedModification from '@/views/service/xq/components/CentralizedModificationNew.vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { handleError } from '@/utils/error'
import { useStore } from 'vuex'
import VXETable from 'vxe-table'

interface Columns {
  columnKey: string
  columnValue: string
  eidt: boolean
  hidden: boolean
  fixed: boolean
  needSum: string
  visible: boolean
}

interface Params {
  [key: string]: any
}

const searchCode = ref('ZLXMJH')

const tableInfo = reactive<any>({
  tableData: [],
  columns: []
})

const loading = ref(false)
const btnLoading = ref(false)
const tableRef = ref()
const editPageRef = ref<any>({})

// const store = useStore()
// const specialOrgId = ref<string>('')
// const spRoleId = ref<string>('')

const wfCodeString = ref<string>('')
const customParam = ref<any>({})

const page = {
  total: 0,
  limit: 20,
  page: 1
}

// 工作流用户信息
const userInfo = ref({
  id: '',
  spOrgId: '',
  spRoleId: '',
  cropId: ''
})
// 工作流全局变量
const wfDataString = ref({
  XMIDS: '',
  KMLX: '',
  ND: '',
  DWID: '',
  DWNAME: '',
  BUSITYPE: '',
  PAGETYPE: '',
  SM: '',
  ISZS: '',
  SPECIALORGID: ''
})

const searchTableHandle = (flag: string) => {
  searchCode.value = flag
  searchHandle()
}

// 查询
const searchHandle = async () => {
  await getTableHeader(wfCodeString.value)
  await getDataList(wfCodeString.value)
}

const getTableHeader = async (flag: string) => {
  loading.value = true
  let params: Params = {
    nd: wfDataString.value.ND,
    kmlx: wfDataString.value.KMLX,
    busiType: wfDataString.value.BUSITYPE,
    dwId: wfDataString.value.DWID
  }
  let res: any
  res = await getDynamicTableByUser({
    searchCode: searchCode.value,
    searchType: '2',
    ...params
  })
  if (res.success) {
    loading.value = false
    tableInfo.columns = res.data
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const getDataList = async (flag: string) => {
  const ejdwId = getQueryString('ejdw')
  loading.value = true
  let parmas: Params = {
    ejdw: ejdwId,
    limit: page.limit,
    page: page.page
  }
  let res: any
  if (searchCode.value === 'ZLXMJH') {
    res = await getZlpzForJh({ ...parmas })
  } else if (searchCode.value === 'ZLXMWUHT') {
    res = await getXmWithOutHt({ ...parmas })
  }
  if (res.success) {
    loading.value = false
    tableInfo.tableData = res.data.records
    page.total = res.data.total
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const isNeedNum = (columns: Columns[], field: string) => {
  let findIndex = columns.findIndex((item: Columns) => item.needSum && item.columnKey === field)
  return findIndex > -1
}

const formatterData = ({ column, cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (tableInfo.columns) {
    const isNum = isNeedNum(tableInfo.columns, column.field)
    if (isNum) {
      return formatValue(cellValue)
    }
  }
  return cellValue
}

// 知道了-按钮
const notifyHandle = async () => {
  const workItemId = getQueryString('workItemId')
  btnLoading.value = true
  let res = await notify(workItemId)
  if (res.success) {
    closeDialogHandle()
    btnLoading.value = false
  } else {
    ElMessage.error(res.msg)
    btnLoading.value = false
  }
}

// 关闭按钮
const closeDialogHandle = () => {
  try {
    window.parent.Appframe.closePopWindow(window)
  } catch (e) {
    window.parent.postMessage('close', '*')
  }
}

// 下载操作手册
const downloadHandle = async() => {
  try {
    btnLoading.value = true
    const blob: any = await downloadJhCzsc()
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = '租赁合同台账管理操作手册.doc'
    dom.download = decodeURIComponent(filename)
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  } catch (e: any) {
    console.error('文件下载失败:', e.toString())
    handleError(e as Error, '文件下载失败')
  } finally {
    btnLoading.value = false
  }
}

const getQueryString = (name: string) => {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
  let queryString = window.location.search
  if (queryString == '' && window.location.href.lastIndexOf('?') != -1) {
    queryString = window.location.href.substring(window.location.href.lastIndexOf('?'))
  }
  const r = queryString.substr(1).match(reg)
  if (r !== null) {
    return unescape(r[2])
  }
  return ''
}

onMounted(async () => {
  searchHandle()

  watch(
    () => editPageRef.value.isShowModal,
    (val) => {
      if (!val) {
        customParam.value = {}
      }
    },
    {deep: true, immediate: true}
  );
})

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}

const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}

const checkedData = ref<any[]>([])
const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

const checkChangeHandle = ({ records }: any) => {
  checkedData.value = records
}
const checkChangeAllHandle = ({ records }: any) => {
  checkedData.value = records
}

const cellClickHandle = async ({ row }: any) => {
  checkedData.value = []
  await tableRef.value.clearCheckboxRow()
  tableRef.value.setCheckboxRow(row, true)
  checkedData.value.push(row)
}

const refershData = () => {
  // 清空选择框
  checkedData.value = []
  searchHandle()
}
</script>

<style scoped lang="less">
.table-container {
  box-sizing: border-box;
  height: 100vh;
  display: flex;
  flex-direction: column;
  .pager {
    background-color: #fff;
  }
  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .operation {
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    background-color: #fff;
    .left,
    .right {
      width: 50%;
    }
    .right {
      text-align: right;
    }
  }
  .introduction {
    padding-left: 15px;
    font-size: 16px;
    color: red;
    line-height: 50px;
  }
  .custom-tabs {
    display: flex;
    margin-bottom: 10px;
    border-bottom: 1.5px solid #e4e7ed;
    background: none;
  }
  .tab-item {
    padding: 10px;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
    margin: 0 6px;
  }
  .tab-item.active {
    color: #00706b;
  }
  .tab-item.active::after {
    content: '';
    display: block;
    position: absolute;
    left: 50%;
    bottom: -2px;
    width: 150px;
    height: 3px;
    background: linear-gradient(90deg, #00706b, #00604a);
    border-radius: 2px;
    transform: translateX(-50%);
    transition: width 0.3s;
  }
}
</style>
