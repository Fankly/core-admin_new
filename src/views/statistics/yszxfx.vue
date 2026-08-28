<template>
  <div class="container" v-if="pageInfo.isShowPage">
    <div class="operation">
      <div class="left">
        <el-button :loading="gridOptions.loading" v-permission="'EXPORT'" size="mini" plain type="primary" @click="exportDataHandle"
          >导 出
        </el-button>
        <el-button :loading="gridOptions.loading" v-permission="'TIMER'" size="mini" plain type="primary" @click="timerHandle"
          >执行定时任务
        </el-button>
        <el-button v-if="canViewDetail" :loading="gridOptions.loading" size="mini" plain type="primary" @click="viewDetailHandle()"
          >查看明细
        </el-button>
        <el-button v-if="canBackOverview" :loading="gridOptions.loading" size="mini" plain type="primary" @click="backOverviewHandle"
          >返 回
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
              <el-form-item label="预算期间：">
                <el-date-picker
                  :disabled-date="disabledTime"
                  style="width: 100%"
                  @change="changeMonthHandle"
                  value-format="YYYY-MM"
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
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <div class="search">
                <el-button :loading="gridOptions.loading" size="mini" plain type="primary" @click="getDataHandle">查 询 </el-button>
                <el-button :loading="gridOptions.loading" size="mini" plain type="primary" @click="resetDataHandle">重 置 </el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="table">
        <vxe-grid ref="gridRef" class="mytable-style" :rowClassName="rowClassName" v-bind="gridOptions" @cell-click="cellClickHandle"></vxe-grid>
      </div>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/statistics/yszxfx'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import { getDeptList, getDynamicColumn, getInitData, updateTimer, ztqk } from '@/api/statistics/yszxfx'
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
const isDetailMode = ref(false)
const isCityOrCounty = computed(() => ['CITY', 'COUNTY'].includes(orgInfo.value.orgFlag))
const canViewDetail = computed(() => isCityOrCounty.value && !isDetailMode.value)
const canBackOverview = computed(() => isCityOrCounty.value && isDetailMode.value)
const isCityOrCountyOverview = computed(() => isCityOrCounty.value && !isDetailMode.value)

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

const exportTextFields = new Set(['dwCode', 'dwId', 'dwName', 'dwType', 'orgId', 'id', 'parentId', 'cropId', 'deptId'])

const getExportLeafColumns = (columns: any[] = []): any[] => {
  return columns.reduce((acc: any[], column: any) => {
    if (!column) return acc
    if (Array.isArray(column.children) && column.children.length !== 0) {
      acc.push(...getExportLeafColumns(column.children))
    } else {
      acc.push(column)
    }
    return acc
  }, [])
}

const getExportDataStartRowNumber = (options: any, colgroups: any[]) => {
  if (options?.isHeader === false) return 1
  if (options?.isColgroup && Array.isArray(colgroups) && colgroups.length !== 0) return colgroups.length + 1
  return 4
}

const isExportTextField = (field: any) => {
  const fieldName = String(field || '')
  if (!fieldName) return true
  if (exportTextFields.has(fieldName)) return true
  return /(code|id|name|type)$/i.test(fieldName)
}

const parseExportNumber = (value: any) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const text = value.replace(/,/g, '').trim()
  if (!text || text === '-') return null
  if (!/^-?(?:\d+|\d*\.\d+)$/.test(text)) return null
  const numberValue = Number(text)
  return Number.isFinite(numberValue) ? numberValue : null
}

const getExportNumberFormat = (value: any) => {
  const text = String(value ?? '')
    .replace(/,/g, '')
    .trim()
  const decimalPart = text.includes('.') ? text.split('.')[1] : ''
  return decimalPart ? `0.${'0'.repeat(decimalPart.length)}` : '0'
}

const applyExportNumberCell = (cell: any, rowData: RowVo, column: any) => {
  const field = column?.field
  if (isExportTextField(field)) return
  const exportValue = cell.value
  const sourceValue = field && Object.prototype.hasOwnProperty.call(rowData, field) ? rowData[field] : cell.value
  const sourceNumberValue = parseExportNumber(sourceValue)
  const numberValue = parseExportNumber(exportValue) ?? sourceNumberValue
  if (numberValue === null) return
  cell.value = numberValue
  cell.numFmt = getExportNumberFormat(sourceNumberValue === null ? exportValue : sourceValue)
}

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
    sheetMethod: function ({ options, worksheet, columns, colgroups, datas }: any) {
      const data = options.data || datas || []
      const exportColumns = getExportLeafColumns(Array.isArray(columns) && columns.length !== 0 ? columns : ((gridOptions.columns || []) as any[]))
      const dataStartRowNumber = getExportDataStartRowNumber(options, colgroups)
      worksheet.eachRow((row: any, rowNumber: any) => {
        if (rowNumber >= dataStartRowNumber) {
          const rowData = data[rowNumber - dataStartRowNumber]
          row.eachCell((cell: any, colNumber: number) => {
            if (rowData) {
              applyExportNumberCell(cell, rowData, exportColumns[colNumber - 1])
            }
          })
          if (rowData.dwType === '-1') {
            row.eachCell((cell: any) => {
              cell.font = {
                ...cell.font,
                bold: true
              }
            })
          }
        }
        row.eachCell((cell: any, colNumber: number) => {
          if (typeof cell.value === 'number') {
            const xsws = Number(formData.xsws.split('_')[1])
            cell.numFmt = xsws > 0 ? `#,##0.${'0'.repeat(xsws)}` : '#,##0'
          }
          cell.border = {
            top: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            left: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            bottom: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            right: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            }
          }
        })
      })
    }
  }
})

const rowClassName: VxeTablePropTypes.RowClassName<RowVo> = ({ row }: { row: RowVo }) => {
  const classNames: string[] = []
  if (row.dwType === '-1') {
    classNames.push('col-font')
  }

  if (canViewDetail.value && isValidDetailRow(row)) {
    classNames.push('row-clickable')
  }

  return classNames.length ? classNames.join(' ') : null
}

const getDynamicHeader = async () => {
  gridOptions.loading = true
  if (gridOptions.columns) gridOptions.columns.length = 0
  let params: any = {
    dwId: userInfo.value.org_id,
    ...getRequestFormData()
  }
  let res = await getDynamicColumn(params)
  if (res.success) {
    try {
      await editDynamicColumnData(res.data)
    } catch (error) {
      console.error('发生错误', error)
    } finally {
      gridOptions.columns = getDisplayColumns(res.data) as any
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
  const requestFormData = getRequestFormData()
  const { ysqj, month, ...rest } = requestFormData
  let newMonth = Number(month).toString()
  let params: any = {
    dwId: userInfo.value.org_id,
    ...rest,
    month: newMonth
  }
  let res = await ztqk(params)
  if (res.success) {
    operationData(getCurrentOrgOverviewData(res.data))
    gridOptions.loading = false
  } else {
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

const getRequestFormData = () => {
  if (!isCityOrCountyOverview.value) return { ...formData }
  return {
    ...formData,
    cxjb: '0',
    yjdw: '',
    ejdw: '',
    gkbm: ''
  }
}

const getDisplayColumns = (columns: Columns) => {
  if (!isCityOrCountyOverview.value) return columns
  return columns.filter((item: Column) => item.field !== 'rownumber') as Columns
}

const getCurrentOrgOverviewData = (data: RowVo[] = []) => {
  if (!isCityOrCountyOverview.value || data.length === 0) return data
  const footerRows = data.filter((item) => item.dwName === '待分解')
  const currentRows = data.filter((item) => item.dwName !== '待分解' && isCurrentOrgRow(item))
  if (currentRows.length !== 0) {
    return currentRows //.concat(footerRows)
  }
  return []
}

const getOrgDwInfos = () => {
  return Array.isArray(orgInfo.value.dwInfos) ? orgInfo.value.dwInfos : []
}

const isCurrentOrgRow = (row: RowVo) => {
  const currentIds = [userInfo.value?.org_id, userInfo.value?.specialorgid, orgInfo.value.cropId, ...getOrgDwInfos()]
    .filter(Boolean)
    .map((item) => item.toString())
  const currentNames = [userInfo.value?.org_name, userInfo.value?.specialorgname, userInfo.value?.name, orgInfo.value.dwName]
    .filter(Boolean)
    .map((item) => item.toString())
  const rowCode = (row.dwCode || row.dwId || row.orgId || row.id || '').toString()
  const rowName = row.dwName ? row.dwName.toString() : ''
  return currentIds.includes(rowCode) || currentNames.some((name) => rowName.includes(name) || name.includes(rowName))
}

const isValidDetailRow = (row?: RowVo) => {
  if (!row) return false
  if (row.dwType === '-1') return false
  return !['合计', '待分解'].includes(row.dwName)
}

const getFirstValidDetailRow = () => {
  return gridOptions.data?.find((row: RowVo) => isValidDetailRow(row))
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
    if (!formData.yjdw || isCityOrCountyOverview.value) gridOptions.data = allData
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
  for (const item of data as Column[]) {
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

// 获取预算期间
const changeMonthHandle = (val: string) => {
  if (val) {
    const dateArr = val.split('-')
    formData.year = dateArr[0]
    formData.month = dateArr[dateArr.length - 1]
  }
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

// 设置日期
const disabledTime = (time: Date) => {
  return time.getFullYear() <= 2024
  // return false;
}

const changeYjdwDataHandle = async (yjdw: string) => {
  if (!yjdw) {
    formData.cxjb = '0'
    formData.ejdw = ''
    formList.ejdwList.length = 0
    formData.gkbm = ''
    formList.gkbmList.length = 0
    return
  }
  formData.cxjb = '1'
  await getEjdwDataList(yjdw)
}

const changeEjdwDataHandle = async (ejdw: string) => {
  if (!ejdw) {
    formData.cxjb = '1'
    formData.gkbm = ''
    formList.gkbmList.length = 0
    return
  }
  formData.cxjb = '2'
  await getGkbmDataList(ejdw)
}

const changeGkbmDataHandle = async (ejdw: string) => {
  if (!ejdw) {
    formData.cxjb = '2'
    return
  }
  formData.cxjb = '3'
}

const clearOrgFilterData = () => {
  formData.yjdw = ''
  formData.ejdw = ''
  formData.gkbm = ''
  formData.cxjb = '0'
  formList.ejdwList.length = 0
  formList.gkbmList.length = 0
}

const setRoleDefaultFilterData = async () => {
  clearOrgFilterData()
  if (yjdwDisabled.value && orgInfo.value.orgFlag !== 'COUNTY') formData.yjdw = orgInfo.value.cropId
  if (yjdwDisabled.value && orgInfo.value.orgFlag === 'COUNTY') {
    let yjdwValue = getOrgDwInfos().slice(-1)
    if (yjdwValue.length === 1) {
      formData.yjdw = yjdwValue.join(',')
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

const applyRoleDetailFilterData = async () => {
  await setRoleDefaultFilterData()
}

const viewDetailHandle = async (row?: RowVo) => {
  if (!canViewDetail.value || gridOptions.loading) return
  const targetRow = row || getFirstValidDetailRow()
  if (!isValidDetailRow(targetRow)) {
    ElMessage.warning('暂无可查看明细的数据')
    return
  }
  isDetailMode.value = true
  await applyRoleDetailFilterData()
  await getDataHandle()
}

const cellClickHandle = async ({ row }: VxeTableDefines.CellClickParams) => {
  await viewDetailHandle(row as any)
}

const backOverviewHandle = async () => {
  if (!canBackOverview.value || gridOptions.loading) return
  isDetailMode.value = false
  await setRoleDefaultFilterData()
  await getDataHandle()
}

// 导出数据
const exportDataHandle = () => {
  const $table = gridRef.value
  if ($table) {
    $table.exportData(gridOptions.exportConfig)
  }
}

// 执行定时任务
const timerHandle = async () => {
  let res = await updateTimer()
  if (res.success) {
    ElMessage.success('执行成功!')
  } else {
    ElMessage.error(res.msg)
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
const resetDataHandle = async () => {
  let date = new Date()
  if (date.getFullYear() <= 2024) {
    formData.year = (date.getFullYear() + 1).toString()
  } else {
    formData.year = date.getFullYear().toString()
  }
  if (isCityOrCounty.value) {
    isDetailMode.value = false
    await setRoleDefaultFilterData()
  } else {
    formData.cxjb = '3'
    if (!gkbmDisabled.value) {
      formData.gkbm = ''
      formData.cxjb = '2'
    }
    if (!ejdwDisabled.value) {
      formData.ejdw = ''
      formData.cxjb = '1'
    }
    if (!yjdwDisabled.value) {
      formData.yjdw = ''
      formData.cxjb = '0'
    }
  }
  formData.month = (date.getMonth() + 1).toString()
  formData.ysqj = formData.year + '-' + formData.month.padStart(2, '0')
  await getDataHandle()
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
  isDetailMode.value = false
  if (isCityOrCounty.value) {
    await setRoleDefaultFilterData()
  } else {
    await applyRoleDetailFilterData()
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
  formData.xsws = 'XSWS_2'
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

:deep(.mytable-style .row-clickable) {
  cursor: pointer;
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
