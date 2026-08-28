<!--预安排目标值查询（按单位）  -->
<template>
  <div class="container" v-if="pageInfo.isShowPage">
    <div class="operation">
      <div class="left">
        <el-button :loading="gridOptions.loading" v-permission="'EXPORT'" size="mini" plain type="primary" @click="exportDataHandle"
          >导 出
        </el-button>
      </div>
      <div class="right">
        <div class="year">
          <el-form :inline="true">
            <el-form-item label="小数位数：">
              <el-select @change="handleChangeXswsData" v-model="formData.xsws" style="width: 60px">
                <el-option v-for="item in formList.XSWS" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div class="help">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="table-main">
      <div class="form">
        <el-form>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="预算年度：">
                <el-date-picker
                  style="width: 100%"
                  value-format="YYYY"
                  :clearable="false"
                  format="YYYY"
                  v-model="formData.ysnd"
                  type="year"
                  placeholder="请选择年度"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归档时间：">
                <el-date-picker
                  style="width: 100%"
                  value-format="YYYY-MM"
                  format="YYYY-MM"
                  :clearable="false"
                  v-model="formData.ysqj"
                  type="month"
                  placeholder="请选择日期"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="一级单位：">
                <el-select
                  :disabled="yjdwDisabled"
                  style="width: 100%"
                  v-model="formData.yjdw"
                  clearable
                  placeholder="请选择"
                  @change="changeYjdwDataHandle"
                >
                  <el-option v-for="item in formList.yjdwList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="二级单位：">
                <el-select
                  :disabled="ejdwDisabled"
                  style="width: 100%"
                  v-model="formData.ejdw"
                  clearable
                  placeholder="请选择"
                  @change="changeEjdwDataHandle"
                >
                  <el-option v-for="item in formList.ejdwList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <el-select
                  :disabled="gkbmDisabled"
                  style="width: 100%"
                  v-model="formData.gkbm"
                  clearable
                  placeholder="请选择"
                  @change="changeGkbmDataHandle"
                >
                  <el-option v-for="item in formList.gkbmList" :key="item.deptCode" :label="item.deptName" :value="item.deptCode"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <div class="search">
                <el-button :loading="gridOptions.loading" size="mini" plain type="primary" @click="getDataHandle">查 询 </el-button>
                <el-button :loading="gridOptions.loading" size="mini" plain type="primary" @click="resetDataHandle">重 置 </el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="table">
        <vxe-grid ref="gridRef" class="mytable-style" :rowClassName="rowClassName" v-bind="gridOptions"></vxe-grid>
      </div>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/statistics/yapMbzDw'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import { getDeptList, getDynamicColumn, getInitData, updateTimer, ztqk } from '@/api/statistics/yapYszxfx'
import { computed, onMounted, reactive, ref } from 'vue'
import { VxeGridProps, VxeTableDefines, VxeGridPropTypes, VxeTablePropTypes } from 'vxe-table'
import Decimal from 'decimal.js'
import { formatNumValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import { getEjdwList, getYjdwList } from '@/api/matter'
import { getPublicCodeList } from '@/api/common'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

type otherColumn = {
  id: string
  isleaf: number
  needFormat: boolean
  parentId: string
  isNeedTotal: number
}

type OrgInfo = {
  attrCode: string
  cropId: string
  deptId: string
  dwName: string
  isZsdw: string
  orgFlag: string
  dwInfos: string[]
}

type Column = VxeTableDefines.ColumnOptions & otherColumn
type Columns = VxeGridPropTypes.Columns & otherColumn[]

interface RowVo {
  cbxGdgspm: number
  cbxSpm: number
  cbxZsdwpm: number
  dwCode: string
  dwName: string
  dwType: string
  jxywcbHjMbz: number
  jxywcbHjWcl: number
  jxywcbHjWcz: number
  jxywcbJczzMbz: number
  jxywcbJczzWcl: number
  jxywcbJczzWcz: number
  jxywcbSjtcMbz: number
  jxywcbSjtcWcl: number
  jxywcbSjtcWcz: number
  qtyyfyHjMbz: number
  qtyyfyHjWcl: number
  qtyyfyHjWcz: number
  qtyyfyJczzMbz: number
  qtyyfyJczzWcl: number
  qtyyfyJczzWcz: number
  qtyyfySjtcMbz: number
  qtyyfySjtcWcl: number
  qtyyfySjtcWcz: number
  rownumber: string
  subtotalMbz: number
  subtotalWcl: number
  subtotalWcz: number
  totalGdgspm: number
  totalMbz: number
  totalSpm: number
  totalWcl: number
  totalWcz: number
  totalZsdwpm: number
  yjkfcbSjtcMbz: number
  yjkfcbSjtcWcl: number
  yjkfcbSjtcWcz: number
  zbxGdgspm: number
  zbxMbz: number | string
  zbxSpm: number
  zbxWcl: number
  zbxWcz: number
  zbxZsdwpm: number

  [key: string]: any
}

interface ListValue {
  code: string
  name: string
}

interface GkbmValue {
  deptCode: string
  deptName: string
}

interface List {
  yjdwList: ListValue[]
  ejdwList: ListValue[]
  XSWS: ListValue[]
  gkbmList: GkbmValue[]
}

const orgInfo = ref<OrgInfo>({
  attrCode: '',
  cropId: '',
  deptId: '',
  dwName: '',
  isZsdw: '',
  orgFlag: '',
  dwInfos: []
})
const userDialogRef = ref()
const helpModalRef = ref()
const gridRef = ref()
const userInfo = ref<any>()
const pageInfo = reactive({
  isShowPage: false
})

const yjdwDisabled = computed(() => orgInfo.value.attrCode !== 'BM_CWZC' || orgInfo.value.orgFlag !== 'PROVINCE')
const ejdwDisabled = computed(() => orgInfo.value.attrCode !== 'BM_CWZC' || orgInfo.value.orgFlag === 'COUNTY')
const gkbmDisabled = computed(() => orgInfo.value.attrCode !== 'BM_CWZC')

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const handleChangeXswsData = () => {
  getDataHandle()
}

const formList = reactive<List>({
  yjdwList: [],
  ejdwList: [],
  XSWS: [],
  gkbmList: []
})

const formData = reactive<any>({
  month: '',
  year: '',
  ysnd: '',
  ysqj: '',
  cxjb: '',
  yjdw: '',
  ejdw: '',
  xsws: '',
  gkbm: ''
})

const diabledDate = ref('')
const dwType = ref<ListValue[]>([])

const footerValue = ref<RowVo[]>([])

const flatColumns = reactive<Columns>([])

const gridOptions = reactive<VxeGridProps<RowVo>>({
  border: true,
  columnConfig: {
    resizable: true
  },
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  size: 'mini',
  exportConfig: {
    type: 'xlsx',
    filename: '预算执行情况-导出',
    sheetName: '预算执行情况-导出',
    useStyle: true,
    sheetMethod: function ({ options, workbook, worksheet }: any) {
      const data = options.data || []
      worksheet.eachRow((row: any, rowNumber: any) => {
        if (rowNumber > 3) {
          const rowData = data[rowNumber - 4]
          if (rowData.dwType === '-1') {
            row.eachCell((cell: any) => {
              cell.font = {
                ...cell.font,
                bold: true
              }
            })
          }
        }
      })
    }
  }
})

const rowClassName: VxeTablePropTypes.RowClassName<RowVo> = ({ row }) => {
  if (row.dwType === '-1') {
    return 'col-font'
  }

  return null
}

const getDynamicHeader = async () => {
  gridOptions.loading = true
  if (gridOptions.columns) gridOptions.columns.length = 0
  let params: any = {
    dwId: userInfo.value.org_id,
    ...formData
  }
  let res = await getDynamicColumn(params)
  if (res.success) {
    try {
      await editDynamicColumnData(res.data)
    } catch (error) {
      console.error('发生错误', error)
    } finally {
      gridOptions.columns = res.data
      gridOptions.loading = false
    }
  } else {
    ElMessage.error(res.msg)
  }
}

const getDynamicData = async () => {
  gridOptions.loading = true
  footerValue.value.length = 0
  if (gridOptions.data && gridOptions.data.length !== 0) gridOptions.data.length = 0
  const { ysqj, month, ...rest } = formData
  let newMonth = Number(month).toString()
  let params: any = {
    dwId: userInfo.value.org_id,
    ...rest,
    month: newMonth
  }
  let res = await ztqk(params)
  if (res.success) {
    operationData(res.data)
    gridOptions.loading = false
  } else {
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

const operationData = (data: RowVo[]) => {
  let columnsItems: Column[] = []
  let columnsItemsFields: string[] = []
  let wclColumnsItems: Column[] = []
  let wclColumnsItemsFields: string[] = []
  flatColumns.forEach((column: Column) => {
    if (column.needFormat) {
      columnsItems.push(column)
      columnsItemsFields.push(column.field as string)
    }
    if (column.needFormat && Number(column.isNeedTotal) === 0) {
      wclColumnsItems.push(column)
      wclColumnsItemsFields.push(column.field as string)
    }
  })
  if (data && data.length !== 0) {
    footerValue.value = data.slice(data.length - 1).filter((item) => item.dwName === '待分解')
    let allData = Object.values(addDataMergeData(data, columnsItemsFields)).flat()
    if (!formData.yjdw) gridOptions.data = allData
    else
      gridOptions.data = Object.values(addDataMergeData(data, columnsItemsFields))
        .flat()
        .filter((item) => item.dwType !== '-1')
    let calcValueArr = allData.filter((item: RowVo) => item.dwType === '-1')
    let sumValueArr = allData.filter((item: RowVo) => item.dwType === '-1')
    let dfjValue = footerValue.value.find((item) => item.dwName === '待分解')
    if (dfjValue) sumValueArr.push(dfjValue as RowVo)
    caclWclSum(calcValueArr, wclColumnsItems)
    let sum = clearObjectOptimized(sumValueArr[0], 'dwName', '合计')
    sumValueArr.reduce((acc: Record<string, RowVo[]>, item) => {
      // 小计
      for (const key in item) {
        if (columnsItemsFields.includes(key)) {
          sum[key] = calcTotalSum(sum, item, key)
        }
      }
      return acc
    }, {})
    caclWclSum(sum, wclColumnsItems)
    footerValue.value.push(sum)
    footerValue.value.forEach((item) => {
      let needFormatArr = flatColumns.filter((item: Column) => item.needFormat)
      let fields = needFormatArr.map((item: Column) => item.field)
      for (const key in item) {
        if (key === 'dwName') continue
        if (key === 'dwType') {
          item[key] = '-1'
        } else {
          item[key] = fields.includes(key) ? formatNumValue(item[key] + '', Number(formData.xsws.split('_')[1])) : ''
        }
      }
    })
    footerValue.value.forEach((item) => {
      gridOptions.data?.push(item)
    })
  }
}

// 动态列修改
const editDynamicColumnData = async <T extends VxeGridPropTypes.Columns & otherColumn[]>(data: T) => {
  for (const item of data) {
    flatColumns.push(item)
    if (item.children && item.children.length !== 0) {
      await editDynamicColumnData(item.children as Columns)
    }
    if (item.field === 'rownumber' || item.field === 'dwName') {
      item.fixed = 'left'
    }
    if (item.field !== 'rownumber' && item.field !== 'dwName' && !item.needFormat) {
      item.formatter = ({ cellValue }: any) => {
        if (cellValue === 0) return '-'
        return cellValue
      }
    } else if (item.field && item.field.toUpperCase().includes('WCL') && item.needFormat) {
      item.align = 'right'
      item.headerAlign = 'center'
      item.formatter = ({ cellValue }: any) => {
        if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '0.00'
        return formatNumValue(cellValue.toString())
      }
    } else if (item.needFormat) {
      item.align = 'right'
      item.headerAlign = 'center'
      item.formatter = ({ cellValue }: any) => {
        if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '')
          return formatNumValue('0', Number(formData.xsws.split('_')[1]))
        return formatNumValue(cellValue.toString(), Number(formData.xsws.split('_')[1]))
      }
    }
  }
}

// 数据操作
const addDataMergeData = (data: RowVo[] = [], columnsItemsFields: string[]) => {
  const getInitalData = (item: RowVo): RowVo => {
    if (dwType.value.length > 0) {
      const matchedItem = dwType.value.find((data) => data.code === item.dwType)
      if (matchedItem) {
        return {
          dwName: matchedItem.name,
          dwType: '-1'
        } as RowVo
      }
    }
    return {
      dwName: '其他',
      dwType: '-1'
    } as RowVo
  }
  return data.reduce((acc: Record<string, RowVo[]>, item) => {
    if (item.dwType) {
      acc[item.dwType] = acc[item.dwType] || []
      if (acc[item.dwType].length === 0) {
        acc[item.dwType].push(getInitalData(item))
      }
      // 小计
      const totalItem = acc[item.dwType][0]
      for (const key in item) {
        if (columnsItemsFields.includes(key)) totalItem[key] = calcTotalSum(totalItem, item, key)
      }
      acc[item.dwType].push(item)
    }
    return acc
  }, {})
}

// 自动计算合计
const calcTotalSum = <T extends keyof RowVo>(totalItem: RowVo, item: RowVo, columnKey: T) => {
  let itemDec = new Decimal(item[columnKey]).toFixed(Number(formData.xsws.split('_')[1]))
  let totalItemDec = new Decimal(totalItem[columnKey] ? totalItem[columnKey] : '0')
  totalItemDec = totalItemDec.add(itemDec)
  return totalItemDec.toString()
}

//自动计算完成率
const caclWclSum = (calcValueArr: RowVo[] | RowVo, wclColumnItems: Column[]) => {
  const setWclValue = (row: RowVo) => {
    wclColumnItems.forEach((wclCol) => {
      const baseField = (wclCol.field as any).replace('Wcl', '')
      const mbzField = baseField + 'Mbz'
      const wczField = baseField + 'Wcz'
      if (Number(row[wczField]) && Number(row[mbzField])) {
        row[wclCol.field as string] = Decimal.div(row[wczField], row[mbzField]).mul(100).toFixed(2)
      } else {
        row[wclCol.field as string] = '0.00'
      }
    })
  }
  if (Array.isArray(calcValueArr)) {
    calcValueArr.forEach((row) => {
      setWclValue(row)
    })
  } else {
    setWclValue(calcValueArr)
  }
}

/**
 * 清空对象,为某个值设置默认值
 * @param obj 操作对象
 * @param keyStr 设置值的key
 * @param value 需要设置的默认值
 */
const clearObjectOptimized = (obj: RowVo, keyStr: string, value: string) => {
  const newObj = { ...obj }
  Object.keys(newObj).forEach((key) => {
    if (key === keyStr) newObj[key] = value
    else newObj[key] = ''
  })
  return newObj
}

// 获取一级单位数据
const getYjdwDataList = async (specialorgid: string) => {
  let res = await getYjdwList(specialorgid)
  if (res.success) {
    formList.yjdwList = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

// 获取二级单位数据
const getEjdwDataList = async (ejdw: string) => {
  let res = await getEjdwList({
    parentId: ejdw,
    specialorgid: userInfo.value.specialorgid
  })
  if (res.success) {
    formList.ejdwList = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

// 获取归口部门数据
const getGkbmDataList = async (ejdw: string) => {
  let res = await getDeptList(ejdw)
  if (res.success) {
    formList.gkbmList = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

const changeYjdwDataHandle = async (yjdw: string) => {
  formData.cxjb = !yjdw ? '0' : '1'
  formData.ejdw = ''
  formData.gkbm = ''
  formList.gkbmList.length = 0
  if (!yjdwDisabled.value) {
    formList.ejdwList.length = 0
  }
  if (!yjdw) return
  await getEjdwDataList(yjdw)
}

const changeEjdwDataHandle = async (ejdw: string) => {
  formData.cxjb = !ejdw ? '1' : '2'
  formData.gkbm = ''
  if (!ejdwDisabled.value) {
    formList.gkbmList.length = 0
  }
  if (!ejdw) return
  await getGkbmDataList(ejdw)
}

const changeGkbmDataHandle = async (ejdw: string) => {
  if (!ejdw) {
    formData.cxjb = '2'
    return
  }
  formData.cxjb = '3'
}

// 导出数据
const exportDataHandle = () => {
  const $table = gridRef.value
  if ($table) {
    $table.exportData(gridOptions.exportConfig)
  }
}

// 查询
const getDataHandle = async () => {
  try {
    gridOptions.loading = true
    await getDynamicHeader()
    await getDynamicData()
  } finally {
    gridOptions.loading = false
  }
}

// 重置
const resetDataHandle = () => {
  let date = new Date()
  if (date.getFullYear() <= 2024) {
    formData.year = (date.getFullYear() + 1).toString()
  } else {
    formData.year = date.getFullYear().toString()
  }
  formData.cxjb = '3'
  if (!gkbmDisabled.value) {
    formData.gkbm = ''
    formData.cxjb = '2'
  }
  if (!ejdwDisabled.value) {
    formData.ejdw = ''
    formData.cxjb = '1'
    formList.gkbmList.length = 0
  }
  if (!yjdwDisabled.value) {
    formData.yjdw = ''
    formData.cxjb = '0'
    formList.ejdwList.length = 0
  }
  formData.month = (date.getMonth() + 1).toString()
  formData.ysqj = formData.year + '-' + formData.month.padStart(2, '0')
  formData.ysnd = formData.year
  getDataHandle()
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  userInfo.value = { ...userDialogRef.value.userMsg }
  if (isQuery) {
    initParams(userInfo.value.specialorgid, userInfo.value.org_id)
    pageInfo.isShowPage = true
  }
}

const getInitDataInfo = async (specialorgid: string, spOrgId: string) => {
  formData.cxjb = '0'
  let res = await getInitData(specialorgid, spOrgId)
  orgInfo.value = { ...res.data } as OrgInfo
  if (yjdwDisabled.value && orgInfo.value.orgFlag !== 'COUNTY') formData.yjdw = orgInfo.value.cropId
  if (yjdwDisabled.value && orgInfo.value.orgFlag === 'COUNTY') {
    let yjdwValue = orgInfo.value.dwInfos.slice(-1)
    if (yjdwValue.length === 1) {
      formData.yjdw = orgInfo.value.dwInfos.slice(-1).join(',')
    } else {
      formData.yjdw = formList.yjdwList.slice(-1).join(',')
    }
  }
  if (formData.yjdw) {
    await changeYjdwDataHandle(formData.yjdw)
  }
  if (ejdwDisabled.value && (orgInfo.value.orgFlag === 'COUNTY' || orgInfo.value.orgFlag === 'PROVINCE')) formData.ejdw = orgInfo.value.cropId
  if (ejdwDisabled.value && orgInfo.value.orgFlag === 'CITY') formData.ejdw = userInfo.value.org_id

  if (formData.ejdw) {
    await changeEjdwDataHandle(formData.ejdw)
    if (gkbmDisabled.value) getNameFindCode(userInfo.value.specialorgname)
  }
}

const getPublicCodeData = async () => {
  const codes = ['YSZTZXQK_YSQJ_COM', 'YSZXFXDWLX', 'XSWS']
  let res = await getPublicCodeList({
    codes: codes
  })
  if (res.success && res.data.length !== 0) {
    diabledDate.value = res.data[codes[0]]
    formList.XSWS = res.data['XSWS']
    if (res.data && res.data[codes[1]] && res.data[codes[1]].length !== 0) {
      dwType.value = res.data[codes[1]]
    } else {
      dwType.value = [
        {
          code: '1',
          name: '供电公司'
        },
        {
          code: '2',
          name: '直属单位'
        },
        {
          code: '3',
          name: '机关本部'
        },
        {
          code: '4',
          name: '子公司'
        }
      ]
    }
  }
  if (!diabledDate.value) {
    diabledDate.value = '2025'
  }
}

const initParams = async (specialorgid: string, spOrgId: string) => {
  let date = new Date()
  if (date.getFullYear() <= 2024) {
    formData.year = (date.getFullYear() + 1).toString()
  } else {
    formData.year = date.getFullYear().toString()
  }
  formData.month = (date.getMonth() + 1).toString()
  formData.ysqj = formData.year + '-' + formData.month.padStart(2, '0')
  formData.ysnd = formData.year
  formData.xsws = 'XSWS_4'
  await getPublicCodeData()
  await getYjdwDataList(specialorgid)
  await getInitDataInfo(specialorgid, spOrgId)
  getDataHandle()
}

const getNameFindCode = (name: string) => {
  if (formList.gkbmList.length !== 0) {
    let res = formList.gkbmList.find((item: any) => item.deptName.includes(name))
    if (res) {
      formData.gkbm = res.deptCode
    }
  }
}

onMounted(() => {
  userDialogRef.value.getUser()
})
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: calc(100vh - 110px);
  padding: 10px;

  .operation {
    font-size: 16px;
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    min-height: 0;
    min-width: 0;
    height: 37px;
    margin-bottom: 10px;
    overflow: hidden;

    .left {
      height: 100%;
      flex: 1;
    }

    .right {
      width: 180px;
      line-height: 40px;
      height: 100%;
      min-width: 0;
      min-height: 0;
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }

  .table-main {
    width: 100%;
    height: calc(100% - 28px);
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;

    .form {
      min-width: 0;
      min-height: 0;
      width: 100%;

      :deep(.el-row) {
        height: 40px;
        line-height: 30px;
      }

      .search {
        text-align: right;
      }
    }

    .table {
      padding-bottom: 10px;
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
  }
}

:deep(.mytable-style .col-font) {
  font-weight: bold;
}

:deep(.vxe-loading--text) {
  font-size: 14px;
}

:deep(.vxe-cell) {
  font-size: 14px;
}

:deep(.vxe-table--footer) {
  .vxe-cell {
    font-weight: bold;
  }
}

.el-form--inline {
  height: 100%;
  overflow: hidden;

  :deep(.el-form-item) {
    margin-right: 0;
    overflow: hidden;
  }
}

.el-form-item {
  margin-bottom: 10px;
}
</style>
