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
      <!-- <el-button v-permission="'NRZZ'" size="small" type="primary" v-debounce="[handleChangeTable, `click`, 300]" plain>内容转置</el-button> -->
      <el-button size="small" type="primary" plain @click="exportTable">导 出</el-button>
      <el-button size="small" v-permission="'TB'" type="primary" plain @click="handleTb">同 比</el-button>
      <el-button size="small" v-permission="'HB'" type="primary" plain @click="handleHb">环 比</el-button>
      <div class="modal_title">
        <span class="unit-wanyuan">{{ `截至年月：${modalParmas?.endDate}` }}</span>
        <span class="unit-wanyuan">单位：万元</span>
        <span class="unit-wanyuan">小数位数：2</span>
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
    <TbhbDeptModal ref="tbhbDeptModalRef" />
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
import { apiExportHandle, vxeExportFormulaHandle } from '@/utils/export'
import type { InlineSumConfig, InlineSumOptions } from '@/utils/export'
import { ElMessage } from 'element-plus'
import { getParamConfig, getPublicData } from '@/api/common'
import { formatNumValue } from '@/utils/utils'
import TbhbDeptModal from './TbhbDeptModal/index.vue'
import { getLeafColumns } from './TbhbDeptModal/columns'

const isShowModel = ref(false)
const loading = ref(false)
const modalParmas = ref<any>({})
const gridRef = ref()
const tbhbDeptModalRef = ref()
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

// 一级表头为「合计」的列分组（后端固定以 hj 为字段前缀，叶子字段为 hj_MBZ/hj_DFJ/hj_LXZ/hj_WCZ 等）：
// 其下 目标值/待分解/立项值/完成值 由各 proTypeId 分组对应列同行累加而得。
// 后端动态列字段形如 {groupPrefix}_{CODE}，CODE ∈ {MBZ,DFJ,LXZ,WCZ,LXL,FJL,JSL}；
// 合计组 groupPrefix='hj'，其余顶层组按 proTypeId 命名。
// 所有行（含纵向「省公司」合计行）均写横向求和公式：合计列 = 同行各 proTypeId 列之和；
// 由 vxeExportFormulaHandle 内部 writeInlineSumFormulas 写 =<源1><行>+<源2><行>+...
// 并置 fullCalcOnLoad，Excel 打开自动重算。
const HJ_PREFIX = 'hj'
const INLINE_SUM_VALUE_CODES = ['MBZ', 'DFJ', 'LXZ', 'WCZ']

const buildInlineSumConfig = (columns: any[]): InlineSumOptions | undefined => {
  const leaves = getLeafColumns(columns)
  if (leaves.length === 0) return undefined
  const specs: InlineSumConfig = []
  INLINE_SUM_VALUE_CODES.forEach((code) => {
    const targetField = `${HJ_PREFIX}_${code}`
    // 合计组对应该 CODE 的目标列必须在叶子列里
    if (!leaves.some((c) => String(c?.field ?? '') === targetField)) return
    // 源列：所有以 _{code} 结尾、前缀不为 hj 的叶子字段
    const sourceFields = leaves
      .map((c) => String(c?.field ?? ''))
      .filter((f) => {
        if (!f.endsWith(`_${code}`) || f === targetField) return false
        return f.split('_')[0] !== HJ_PREFIX
      })
      .filter(Boolean)
    if (sourceFields.length === 0) return
    specs.push({ targetField, sourceFields })
  })
  if (specs.length === 0) return undefined
  // 不设 rowFilter：所有行（含「省公司」纵向合计行）均写横向求和公式
  return { config: specs }
}

const exportTable = () => {
  const inlineSumOptions = buildInlineSumConfig(gridOptions.columns)
  vxeExportFormulaHandle(
    gridRef.value,
    `专业归口管理项目预算执行情况`,
    gridOptions.data,
    2,
    {
      LXL: { type: 'ratio', valueField: 'LXZ', targetField: 'MBZ', skipField: 'MBZ' }, // 立项率 = 立项值/目标值*100
      FJL: { type: 'ratio', valueField: 'DFJ', targetField: 'MBZ', skipField: 'MBZ', subtract: true }, // 分解率 = (目标值-待分解)/目标值*100
      JSL: { type: 'ratio', valueField: 'WCZ', targetField: 'MBZ', skipField: 'MBZ' } // 完成率 = 完成值/目标值*100
    },
    undefined, // options
    undefined, // sumConfig（垂直合计行不在本次需求内）
    inlineSumOptions // 横向求和：合计列下 目标值/待分解/立项值/完成值 = 各 proTypeId 列同行累加
  )
}

// 同比/环比弹窗
const openTbhbModal = (type: 'tb' | 'hb') => {
  const p = modalParmas.value
  tbhbDeptModalRef.value?.open({
    type,
    title: p.title,
    endDate: p.endDate,
    deptcode: p.deptcode,
    currentUserDwId: p.currentUserDwId,
    deptId: p.deptId
  })
}

const handleTb = () => openTbhbModal('tb')
const handleHb = () => openTbhbModal('hb')

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
  size: 'mini',
  rowStyle: ({ row }: any) => {
    if (row.dwName === '省公司') {
      console.log(row, 'row')
      return { fontWeight: 'bolder' }
    }
    return {}
  }
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
    gap: 6px;
    .unit-wanyuan {
      background: var(--color-primary, #00706b);
      color: #fff;
      padding: 0 8px;
      border-radius: 4px;
      font-size: 12px;
      height: 30px;
      line-height: 30px;
    }
  }
}
</style>
