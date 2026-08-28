<!-- 一上省专业上报审核审批页面  -->
<template>
  <div class="content">
    <div class="toolButtoon">
      <div class="left">
        <el-button :disabled="tableInfo.tableData.length == 0" size="mini" type="primary" plain @click="hanldeNck('view', '拟出库项目明细查看')">
          拟出库项目明细查看
        </el-button>
        <el-button :disabled="tableInfo.tableData.length == 0" size="mini" type="primary" plain @click="exportHandle"> 导 出 </el-button>
      </div>
      <div class="right">
        <div class="info">
          <span class="highlight">
            版本编号: <span>{{ wfDataString?.VERSION_NO }}</span>
          </span>
          <span class="highlight">
            版本名称: <span>{{ wfDataString?.VERSION_NAME }}</span>
          </span>
          <span class="highlight">
            年度:<span>{{ wfDataString?.ND }}</span>
          </span>
        </div>
      </div>
    </div>
    <div class="formClass">
      <span>拟出库金额核定(万元)：</span>
      <input v-limit-input class="my-input" disabled v-model.trim="allAmount" placeholder="请输入拟出库金额核定(万元)" style="width: 200px" />
    </div>
    <div class="table">
      <vxe-table
        @cell-click="handleCellClick"
        :cell-style="tableInfo.cellStyle"
        :loading="tableInfo.loading"
        :row-config="{ keyField: 'id', height: 32 }"
        :column-config="{ resizable: true }"
        :border="true"
        align="center"
        show-overflow
        keep-source
        headerAlign="center"
        :treeConfig="tableInfo.treeConfig"
        :data="tableInfo.tableData"
        height="100%"
        ref="tableRef"
      >
        <template v-for="item in tableInfo.columns" :key="item.id">
          <vxe-column v-if="['四级分类', '预算控制类别'].includes(item.title)" border :title="item.title" :field="item.field" :width="item.width" />
          <vxe-column v-else :formatter="formatterData" border :title="item.title" :field="item.field" align="right" :width="item.width" />
        </template>
      </vxe-table>
    </div>
  </div>
  <ReViewModal ref="reviewRef" :title="modalTitle" :isView="isView" :form-data="paramsData" />
</template>
<script lang="ts">
export default {
  name: '/workflow/lslx/workflowDealZgkbmYs'
}
</script>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getTableDataForZgkbmYs, getDynamicColumnForZgkbmYs } from '@/api/lslxJsc/szyBmApi'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatValue } from '@/utils/utils'
import { vxeExportHandle } from '@/utils/export'
import ReViewModal from '@/views/service/lslxJsc/ysysszytb/components/ReViewModal/index.vue'
import { useStore } from 'vuex'
import { loadUserWfInfo } from '@/api/workflow'

interface wfDataVo {
  ZGKBM_ID: string
  ND: string
  VERSION_ID: string
  VERSION_NAME: string
  VERSION_NO: string
}

interface paramsDataVo {
  versionId: string
  zgkbmId: string
  nd: string
}

//工作流用户信息
const userInfo = ref({
  id: '',
  spOrgId: '',
  spRoleId: '',
  cropId: ''
})
//工作流全局变量
const wfDataString = ref<wfDataVo>({
  ZGKBM_ID: '',
  ND: '',
  VERSION_ID: '',
  VERSION_NAME: '',
  VERSION_NO: ''
})
const reviewRef = ref()
const workItemIdString = ref<string>('')
const wfInstIdString = ref<string>('')
const wfCodeString = ref<string>('')
const store = useStore()
const tableRef = ref()
const isView = ref<boolean>(false)
const modalTitle = ref<string>('拟出库项目维护')
const paramsData = reactive<paramsDataVo>({
  versionId: '000',
  zgkbmId: '000',
  nd: '2025'
})

const pageInfo = reactive<{
  loading: boolean
}>({
  loading: true
})
const allAmount = ref<any>('')
const count = ref(0)

const tableInfo = reactive<any>({
  border: true,
  tableData: [],
  loading: false,
  columns: [],
  treeConfig: {
    rowField: 'id',
    parentField: 'parentId',
    childrenField: 'children',
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      count.value++
      tableInfo.loading = true
      let params = {
        nd: wfDataString.value.ND,
        versionId: wfDataString.value.VERSION_ID,
        zgkbmId: wfDataString.value.ZGKBM_ID
      }
      return new Promise((resolve: any) => {
        let Api = getTableDataForZgkbmYs
        Api(params).then((res: any) => {
          if (res.success) {
            count.value--
            resolve(res.data)
          } else {
            count.value = 0
            ElMessage.error(res.msg)
            resolve([])
          }
          if (!count.value) tableInfo.loading = false
        })
      })
    }
  },
  cellStyle: ({ row, column }: any) => {
    if (column.title == '拟出库金额合计(万元)') {
      return {
        cursor: 'pointer',
        color: 'var(--color-primary, #00857c)',
        textDecoration: 'underline'
      }
    }
  }
})

// 获取"workItemId"
const getQueryString = (name: string): string => {
  const allParams = window.location.href.split('?').reduce((acc, part) => {
    const params = new URLSearchParams(part.split('#')[0])
    params.forEach((value, k) => acc.set(k, value))
    return acc
  }, new Map())

  if (window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1]
    new URLSearchParams(hashQuery).forEach((value, k) => allParams.set(k, value))
  }
  return allParams.get(name)
}

onMounted(() => {
  const workItemId = getQueryString('workItemId')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      wfDataString.value = { ...data.wfData }
      workItemIdString.value = workItemId
      wfInstIdString.value = data.wfInstId
      wfCodeString.value = data.wfCode
      getHeaderData()
    } else {
      ElMessage.error(res.msg)
    }
  })
})

// 查看
const handleCellClick = ({ column }: any) => {
  if (column.title == '拟出库金额合计(万元)') {
    paramsData.nd = wfDataString.value.ND
    paramsData.versionId = wfDataString.value.VERSION_ID
    paramsData.zgkbmId = wfDataString.value.ZGKBM_ID
    isView.value = false
    modalTitle.value = '拟出库项目明细查看'
    reviewRef.value.acceptParams()
  }
}

const getExportData = (newArr: any[], data: any[], cj: number) => {
  const $table = tableRef.value
  data.forEach((item) => {
    let flag = $table.isTreeExpandByRow(item)
    newArr.push({
      name: item.name,
      cj: cj,
      leaf: item.leaf
    })
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children, cj + 1)
    }
  })
  return newArr
}
const formatterData = ({ cellValue, column }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (column.title.includes('%')) return formatValue(cellValue.toString(), 6)
  return formatValue(cellValue.toString(), 6)
}

// 自定义导出
const exportHandle = () => {
  const $table = tableRef.value
  vxeExportHandle($table, '省级统筹项目拟出库数据表', tableInfo.tableData)
}
// 维护/查看
const hanldeNck = (type: any, val: any) => {
  paramsData.nd = wfDataString.value.ND
  paramsData.versionId = wfDataString.value.VERSION_ID
  paramsData.zgkbmId = wfDataString.value.ZGKBM_ID
  isView.value = type == 'edit'
  modalTitle.value = val
  reviewRef.value.acceptParams()
}
// 初始化表格数据
const newData = async () => {
  await getDataList()
}

const getDataList = async () => {
  tableInfo.loading = true
  const api: any = getTableDataForZgkbmYs
  tableInfo.tableData.length = 0
  let params = {
    nd: wfDataString.value.ND,
    versionId: wfDataString.value.VERSION_ID,
    zgkbmId: wfDataString.value.ZGKBM_ID
  }
  let res = await api(params)
  if (res.success) {
    tableInfo.tableData = res.data
    tableInfo.loading = false
    allAmount.value = 0
    let gmSum = tableInfo.tableData.reduce((gmSum: number, item: any) => gmSum + Number(item['hj_nckje']), 0)
    allAmount.value = Number(gmSum).toFixed(6)
  } else {
    tableInfo.loading = false
    ElMessage.error(res.msg)
  }
}
//获取表头
const getHeaderData = async () => {
  const params = {
    zgkbmId: wfDataString.value.ZGKBM_ID,
    versionId: wfDataString.value.VERSION_ID
  }
  const api: any = getDynamicColumnForZgkbmYs
  let res = await api(params)
  if (res.success) {
    tableInfo.columns = res.data.filter((item: any) => item.visible)
    tableInfo.loading = false
    newData()
    return true
  } else {
    ElMessage.error(res.msg)
    return false
  }
}
</script>

<style scoped lang="less">
.content {
  width: 100%;
  height: 100%;
  padding: 10px;
}

.header-group-cell {
  background-color: #212529 !important;
  text-align: center !important;
  font-weight: bold !important;
}

.vxe-table--render-default .vxe-header--column {
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
}

.vxe-table--render-default .vxe-header--column .vex-cell {
  white-space: normal !important;
  line-height: 1.5 !important;
}

.toolButtoon {
  height: 30px;
  align-items: center;
  display: flex;
  margin-bottom: 10px;

  .left {
    display: flex;
    justify-content: space-between;
    max-width: 490px;
  }

  .right {
    flex: 1;
    text-align: right;
    font-weight: bold;
    color: #212529;

    span {
      display: inline-block;
      font-size: 14px;
      color: #555;
      padding: 5px;
      background-color: #e9ecef;
      border-radius: 5px;
      min-height: 0;
      min-width: 0;
      margin-right: 5px;
    }
  }
}

.formClass {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: bold;
}

.table {
  margin: 0 auto;
  height: calc(100% - 40px);
}
</style>
