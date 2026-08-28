<!--指标详情 -->
<template>
  <vxe-modal
    fullscreen
    show-zoom
    v-model="isShowModel"
    :destroy-on-close="true"
    :title="`${modalParmas?.title}-预算执行明细`"
    :width="800"
    :height="750"
    @close="closeHandle"
    :loading="loading"
  >
    <div class="modal_cont">
      <!-- <el-button v-permission="'NRZZ'" size="mini" type="primary" v-debounce="[handleChangeTable, `click`, 300]" plain>内容转置</el-button> -->
      <el-button size="mini" type="primary" plain @click="exportTable">导 出</el-button>
      <div class="modal_title">
        <div class="highlight" style="margin-left: auto">{{ `截至年月：${modalParmas?.endDate}` }}</div>
      </div>
      <!-- <el-form :inline="true">
        <el-form-item label="小数位数：">
          <el-select @change="handleChangeXswsData" v-model="xsws" style="width: 60px">
            <el-option v-for="item in xswsList" :key="item.code" :value="item.code" :label="item.name"></el-option>
          </el-select>
        </el-form-item>
      </el-form> -->
    </div>
    <vxe-grid v-if="isShowTable" ref="gridRef" v-bind="gridOptions" />
  </vxe-modal>
</template>
<script lang="tsx">
export default {
  name: 'detaildeptData'
}
</script>
<script setup lang="tsx">
import { ref, reactive, nextTick } from 'vue'
import {
  getDynamicColumnByDept,
  getStatDataByDept,
  exportStatData,
  getDynamicColumnByDeptWithXmlx,
  getStatDataNewWithXmlx,
  exportStatDataWithXmlx
} from '@/api/service/deptData/index'
import { apiExportHandle, vxeExportGkHandle } from '@/utils/export'
import { ElMessage } from 'element-plus'
import { getParamConfig, getPublicData } from '@/api/common'
import { formatNumValue } from '@/utils/utils'

const isShowModel = ref(false)
const loading = ref(false)
const modalParmas = ref<any>({})
const gridRef = ref()
const MERGE_PROPS = ['xmlx']
const tableKey = ref(0)
const isTable = ref<boolean>(false)
const isShowTable = ref<boolean>(false)
const xswsList = ref<any[]>([])
const xsws = ref<any>('2')

const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  if (!MERGE_PROPS.includes(column.property)) return

  const tableData = gridOptions.data
  if (!tableData?.length)
    return {
      rowspan: 1,
      colspan: 1
    }

  const isSameGroup = (a: any, b: any): boolean => {
    return MERGE_PROPS.every((prop) => a[prop] === b[prop])
  }

  if (rowIndex > 0 && isSameGroup(row, tableData[rowIndex - 1])) {
    return {
      rowspan: 0,
      colspan: 0
    }
  }

  let rowspan = 1
  for (let i = rowIndex + 1; i < tableData.length; i++) {
    if (isSameGroup(tableData[i], row)) {
      rowspan++
    } else {
      break
    }
  }

  return {
    rowspan,
    colspan: 1
  }
}

const handleChangeTable = () => {
  isTable.value = !isTable.value
  getColumnsData({ ...modalParmas.value })
}

const handleChangeXswsData = () => {
  getColumnsData({ ...modalParmas.value })
}

const exportTable = () => {
  vxeExportGkHandle(gridRef.value, `专业归口管理项目预算执行情况`, gridOptions.data)
}

const closeHandle = () => {
  isShowModel.value = false
}

const getDeptData = async (param: any) => {
  const dataApi = isTable.value ? getStatDataByDept : getStatDataNewWithXmlx
  const res = await dataApi({ ...param })
  loading.value = false
  isShowTable.value = true
  if (!res.success) return ElMessage.error(res.msg)
  res.data.forEach((data: any) => {
    for (const key in data) {
      const proTypeId = key.split('_')[0]
      if (key.includes('MBZ') && data[key] == 0) {
        data[`${proTypeId}_MBZ`] = '-'
        data[`${proTypeId}_DFJ`] = '-'
        data[`${proTypeId}_LXZ`] = '-'
        data[`${proTypeId}_WCZ`] = '-'
        data[`${proTypeId}_LXL`] = '-'
        data[`${proTypeId}_FJL`] = '-'
        data[`${proTypeId}_JSL`] = '-'
      } else {
        if (['MBZ', 'DFJ', 'LXZ', 'WCZ'].includes(key.split('_')[1])) {
          if (data[key] != '-') {
            data[key] = Number(data[key]).toFixed(2)
          }
        }
      }
    }
  })
  gridOptions.data = res.data
  return
}

const getColumnsData = async (param: any) => {
  isShowTable.value = false
  loading.value = true
  gridOptions.columns.length = 0
  gridOptions.data.length = 0
  const sysCode = await getParamConfig('IS_SFZZ')
  isTable.value = sysCode.data ? true : false
  const codeList = await getPublicData('XSWS')
  xswsList.value = codeList.data
  const columnsApi = isTable.value ? getDynamicColumnByDept : getDynamicColumnByDeptWithXmlx
  const record = await columnsApi({ ...param })
  if (record.success) {
    gridOptions.columns = record.data.filter((column: any) => column.visible)
    editColumns(gridOptions.columns)
    tableKey.value++
    getDeptData(param)
    return
  }
}
const editColumns = (data: any) => {
  data.forEach((item: any) => {
    if (item.field == 'dwName') {
      item.fixed = 'left'
    }
    const lastCode = item.field.split('_')[1]
    if (['MBZ', 'DFJ', 'LXZ', 'WCZ'].includes(lastCode)) {
      item.formatter = ({ cellValue }: any) => {
        if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
        return formatNumValue(cellValue.toString(), 2)
      }
      item.headerAlign = 'center'
      item.align = 'right'
    }
    if (item.children && item.children.length !== 0) {
      editColumns(item.children)
    }
  })
}

const acceptParams = (param: any) => {
  isShowModel.value = true
  modalParmas.value = { ...param }
  getColumnsData({ ...param })
}

const gridOptions = reactive<any>({
  border: true,
  stripe: true,
  loading: false,
  toolbarConfig: { custom: true },
  loadingConfig: {
    icon: 'el-icon-loading',
    text: '正在加载中...'
  },
  headerAlign: 'center',
  align: 'center',
  spanMethod: objectSpanMethod,
  height: '90%',
  rowConfig: {
    height: 32
  },
  columnConfig: {
    resizable: true
  },
  columns: [],
  data: [],
  size: 'mini'
})

defineExpose({
  acceptParams
})
</script>

<style lang="less" scoped>
.modal_cont {
  display: flex;
  margin-bottom: 10px;
  .modal_title {
    display: flex;
    margin-left: auto;
    gap: 10px;
    .highlight {
      display: inline-flex;
      align-items: center;
      font-size: 14px;
      padding: 4px 12px;
      background-color: var(--el-fill-color-light, #f5f7fa);
      border: 1px solid var(--el-border-color-light, #dcdfe6);
      border-radius: 4px;
      white-space: nowrap;
      transition: background-color 0.2s;
      max-width: 300px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-wrap: break-word;
      word-break: break-all;
      -webkit-line-clamp: 1;
      text-overflow: ellipsis;
    }
  }
}
</style>
