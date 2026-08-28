<template>
  <div class="form">
    <el-form label-position="right" label-width="120px" v-model="formData">
      <el-row :gutter="24">
        <el-col :span="6">
          <el-form-item label="项目类型：">
            <TreeSelect
              @clearData="clearDataHandle"
              ref="proTypeRef"
              :is-leaf="false"
              @selectChange="getProjectTypeHandle"
              :default-props="treeProps.projectTypeProps"
              :data="selectData.projectType"
              :is-child-node="false"
              node-key="id"
              data-type="id"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="省归口部门：">
            <el-select collapse-tags clearable style="width: 100%" v-model="formData.gkbmIds" placeholder="请选择">
              <template v-for="item in selectData.gkbmList" :key="item.code">
                <el-option :label="item.name" :value="item.code"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="一级单位：">
            <el-select clearable style="width: 100%" v-model="formData.yjdw" placeholder="请选择" @change="changeYjdwDataHandle">
              <template v-for="item in selectData.yjdwListData" :key="item.code">
                <el-option :label="item.name" :value="item.code"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="二级单位：">
            <el-select clearable style="width: 100%" v-model="formData.ejdw" placeholder="请选择">
              <template v-for="item in selectData.ejdwListData" :key="item.code">
                <el-option :label="item.name" :value="item.code"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="6">
          <el-form-item label="年度：">
            <el-select style="width: 100%" v-model="formData.nd" placeholder="请选择" @change="changeNdDataHandle">
              <template v-for="item in selectData.ndList" :key="item.yearCode">
                <el-option :label="item.yearName" :value="item.yearCode"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="展示维度：">
            <el-select multiple style="width: 100%" v-model="formData.yslys" placeholder="请选择">
              <template v-for="item in selectData.tjwdList" :key="item.code">
                <el-option :label="item.name" :value="item.code"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="展示方式：">
            <el-select @change="zsfsChangeHandle" style="width: 100%" v-model="zsfs" placeholder="请选择">
              <template v-for="item in selectData.zsfsList" :key="item.code">
                <el-option :label="item.name" :value="item.code"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <div class="btn" style="text-align: right; line-height: 43px">
            <el-button type="primary" size="mini" plain @click="clickSearchHandle">查 询</el-button>
            <el-button type="primary" size="mini" plain @click="resetHandle">重 置</el-button>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </div>
  <div class="table">
    <vxe-grid :show-footer="isShowFooter" ref="tableRef" v-bind="gridOptions" v-on="gridEvents">
      <template #pager v-if="zsfs === '3'">
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
      </template>
    </vxe-grid>
  </div>
</template>

<script lang="ts">
export default {
  name: 'MbzSearchMain'
}
</script>

<script setup lang="ts">
import TreeSelect from '@/components/select/TreeSelect.vue'

import { onMounted, defineExpose, reactive, ref, defineProps, watch, computed, defineEmits } from 'vue'
import { getProTypeTreeNode } from '@/api/process'
import { ElMessage } from 'element-plus'
import { getYearData, getYjdwNew, getEjdwByYjdw, getGkbmInProvince, getPublicCodeList } from '@/api/common'
import {
  exportMbzStatisticsByProtypeDw,
  InterfaceParams,
  mbzStatisticsByDw,
  mbzStatisticsByProtype,
  mbzStatisticsByProtypeDw,
  Result
} from '@/api/mbz'
import { UserInfo } from '../../interface'
import { VxeGridListeners, VxeGridProps, VxeTableDefines } from 'vxe-table'
import Decimal from 'decimal.js'

interface InterfaceData {
  [key: string]: (params: InterfaceParams) => Promise<Result>
}

interface Params {
  dwId: number
  ejdw: string
  gkbmIds: string
  nd: string
  parentDwId: string
  proTypeIds: string
  yjdw: string
  yslys: string[]
  [key: string]: string | number | string[]
}

interface InitInfo {
  userInfo: UserInfo
  isShowPage: boolean
}

interface Props {
  initInfo: InitInfo
  fileName: string
  name: string
}

interface NdList {
  yearName: string
  yearCode: string
}

interface SearchData {
  name: string
  code: string
}

const props = defineProps<Props>()

const emits = defineEmits(['isDisable', 'isLoad', 'isExport'])

const tableRef = ref()
const proTypeRef = ref()

const zsfs = ref('')

const formData = reactive<Partial<Params>>({})
const treeProps = reactive({
  projectTypeProps: {
    children: 'children',
    label: 'name'
  }
})

const page = reactive({
  total: 0,
  limit: 10,
  page: 1,
  current: '1'
})

const selectData = reactive<{
  yjdwListData: SearchData[]
  ejdwListData: SearchData[]
  gkbmList: SearchData[]
  projectType: any
  ndList: NdList[]
  tjwdList: SearchData[]
  zsfsList: SearchData[]
}>({
  yjdwListData: [],
  ejdwListData: [],
  projectType: [],
  ndList: [],
  gkbmList: [],
  tjwdList: [],
  zsfsList: []
})

const loading = ref(false)

const isShowFooter = computed<boolean>(() => zsfs.value === '1')

const rowIndexsArr = reactive<number[]>([])

const gridOptions = reactive<any>({
  border: true,
  columnConfig: {
    resizable: true
  },
  loading: false,
  headerAlign: 'center',
  align: 'right',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  columns: [],
  data: [],
  exportConfig: {
    type: 'xlsx',
    isMerge: true,
    filename: props.fileName,
    sheetName: props.fileName,
    useStyle: true,
    sheetMethod: ({ options, worksheet }: any) => {
      if (zsfs.value === '1') {
        rowIndexsArr.forEach((item) => {
          const row = worksheet.getRow(item + 2)
          row.eachCell((cell: any) => {
            cell.font = {
              color: { argb: 'FFFF0000' }
            }
          })
        })
      }
    }
  },
  rowStyle: ({ row, rowIndex }) => {
    let xmbys = row['xmbYs'] === '-' ? new Decimal('0') : new Decimal(row['xmbYs'])
    let mbz = row['mbz'] === '-' ? new Decimal('0') : new Decimal(row['mbz'])
    if (zsfs.value === '1' && xmbys.comparedTo(mbz) === 1) {
      if (!rowIndexsArr.includes(rowIndex)) rowIndexsArr.push(rowIndex)
      return {
        color: 'rgb(255,0,0)'
      }
    }
  }
})

const sumNum = (list: any[], field: string) => {
  let count = new Decimal('0')
  list.forEach((item) => {
    if (item[field] && item[field] !== '-') {
      let value = new Decimal(item[field])
      count = count.add(value)
    }
  })
  return count.toFixed(4).toString()
}

const gridEvents = reactive<VxeGridListeners<any>>({
  cellMenu({ row }) {
    const $grid = tableRef.value
    if ($grid) {
      $grid.setCurrentRow(row)
    }
  }
})

const getInterfaceMethod = () => {
  let obj: InterfaceData = {
    1: mbzStatisticsByProtype,
    2: mbzStatisticsByDw,
    3: mbzStatisticsByProtypeDw
  }
  return obj[zsfs.value]
}

const clearDataHandle = () => {
  if (formData.proTypeIds) formData.proTypeIds = ''
}

const getProjectTypeHandle = (value: string[]) => {
  formData.proTypeIds = value.join(',')
}

const changeNdDataHandle = async () => {
  // 清空
  proTypeRef.value.selectChange()
  await getProjectData()
}

const changeYjdwDataHandle = async (val: string) => {
  formData.ejdw = ''
  selectData.ejdwListData.length = 0
  // 清空二级单位数据
  getEjdwData(val)
}

const resetPage = async () => {
  page.total = 0
  page.limit = 10
  page.page = 1
  page.current = '1'
}

// 展现方式
const zsfsChangeHandle = async () => {
  rowIndexsArr.length = 0
  await resetPage()
  await searchHandle()
  if (tableRef.value && zsfs.value === '2' && formData.yjdw) tableRef.value.setAllTreeExpand(true)
}

// 获取二级单位数据
const getEjdwData = async (val: string) => {
  if (!val) return
  const ejdwData = await getEjdwByYjdw(val)
  selectData.ejdwListData = ejdwData.data
}

// 获取项目类型
const getProjectData = async () => {
  loading.value = true
  const params = {
    parentId: '0',
    startDate: formData.nd
  }
  getProTypeTreeNode(params).then((res) => {
    if (res.success) {
      selectData.projectType = res.data
      loading.value = false
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
      loading.value = false
    }
  })
}

// 获取年份
const getNdData = async () => {
  const ndDataList = await getYearData()
  selectData.ndList = ndDataList.data
  formData.nd = new Date().getFullYear().toString()
}

// 获取一级单位
const getYjdwData = async () => {
  let res = await getYjdwNew(props.initInfo.userInfo.specialorgid)
  if (res.success) {
    selectData.yjdwListData = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

// 获取省归口部门
const getProGkbmData = async () => {
  let res = await getGkbmInProvince()
  if (res.success) {
    selectData.gkbmList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

// 获取展示维度和展示方式
const getOtherSearchData = async () => {
  let codes = ['MBZ_ZSFS', 'XMLB_YSLY']
  let res = await getPublicCodeList({ codes })
  if (res.success && res.data) {
    selectData.zsfsList = res.data[codes[0]]
    selectData.tjwdList = res.data[codes[1]]
    zsfs.value = selectData.zsfsList[0].code
    formData.yslys?.push(selectData.zsfsList[0].code)
  }
}

const clickSearchHandle = async () => {
  await searchHandle()
  if (tableRef.value && zsfs.value === '2' && formData.yjdw) tableRef.value.setAllTreeExpand(true)
}

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}

// 查询
const searchHandle = async () => {
  gridOptions.loading = true
  if (gridOptions.columns) gridOptions.columns.length = 0
  if (gridOptions.data) gridOptions.data.length = 0
  if (gridOptions.treeConfig) delete gridOptions.treeConfig
  if (gridOptions.footerMethod) delete gridOptions.footerMethod
  rowIndexsArr.length = 0
  await getDynamicColumnData()
  let params: any = {
    dwId: props.initInfo.userInfo.org_id
  }
  if (zsfs.value === '3') {
    params.page = page.page
    params.limit = page.limit
  }
  for (const key in formData) {
    const value = formData[key]
    if (value) params[key] = value
  }
  if (params.yslys && Array.isArray(params.yslys)) {
    params.yslys = params.yslys.join(',')
  }
  let res = await getInterfaceMethod()(params)
  if (res.success && res.data) {
    if (zsfs.value === '1') {
      gridOptions.data = res.data
      gridOptions.footerMethod = ({ columns, data }) => {
        if (zsfs.value === '1') {
          return [
            columns.map((column, columnIndex) => {
              if (columnIndex === 0) {
                return '合计'
              }
              if (['mbzYl', 'xmbYs', 'xmbFjys', 'mbz'].includes(column.field)) {
                return sumNum(data, column.field)
              }
              return '-'
            })
          ]
        }
        return []
      }
    } else if (zsfs.value === '2') {
      gridOptions.data = res.data.map((item: any) => {
        item.leaf = item.isleaf === '0'
        return item
      })
    } else {
      gridOptions.data = res.data.records
      page.total = res.data.total
    }
    gridOptions.loading = false
  } else {
    ElMessage.error(res.msg)
    gridOptions.loading = false
  }
}

// 获取表头数据
const getDynamicColumnData = async () => {
  let columns: VxeTableDefines.ColumnOptions[] = [
    {
      field: 'mbz',
      title: '目标值金额(万元)',
      width: 200
    },
    {
      field: 'mbzYl',
      title: '待分解金额(万元)',
      width: 200
    },
    {
      field: 'xmbYs',
      title: '项目包金额(万元)',
      width: 200
    },
    {
      field: 'xmbFjys',
      title: '项目包分解金额(万元)',
      width: 200
    }
  ]
  if (zsfs.value === '1') {
    columns.unshift(
      {
        field: 'proTypeName',
        title: '项目类型',
        align: 'left',
        headerAlign: 'center',
        width: 280
      },
      {
        field: 'gkbmName',
        title: '省归口部门',
        align: 'left',
        headerAlign: 'center',
        width: 280
      }
    )
  } else if (zsfs.value === '2') {
    columns.unshift({
      field: 'dwName',
      title: '项目单位',
      align: 'left',
      headerAlign: 'center',
      width: 280,
      treeNode: true
    })
    gridOptions.treeConfig = {
      lazy: true,
      hasChildField: 'leaf',
      loadMethod: ({ row }) => {
        return new Promise((resolve: any) => {
          gridOptions.loading = true
          let api = getInterfaceMethod()
          if (!api) return
          let params: any = {
            dwId: props.initInfo.userInfo.specialorgid,
            parentDwId: row.dwId,
            punicode: row.unicode
          }
          for (const key in formData) {
            const value = formData[key]
            params[key] = value
          }
          if (params.yslys && Array.isArray(params.yslys)) {
            params.yslys = params.yslys.join(',')
          }
          api(params).then((res: any) => {
            if (res.success) {
              gridOptions.loading = false
              let data = res.data.map((item: any) => {
                item.leaf = item.isleaf === '0'
                return item
              })
              resolve(data)
            } else {
              gridOptions.loading = false
              ElMessage.error(res.msg)
              resolve([])
            }
          })
        })
      }
    }
  } else {
    columns.unshift(
      {
        field: 'proTypeName',
        title: '项目类型',
        align: 'left',
        headerAlign: 'center',
        width: 280
      },
      {
        field: 'dwName',
        title: '项目单位',
        align: 'left',
        headerAlign: 'center',
        width: 280
      },
      {
        field: 'gkbmName',
        title: '省归口部门',
        align: 'left',
        headerAlign: 'center'
      }
    )
  }
  gridOptions.columns = columns
}

// 重置表单
const resetHandle = async () => {
  for (const key in formData) {
    if (Array.isArray(formData[key])) {
      formData[key] = []
      proTypeRef.value.selectChange()
      if (key === 'yslys') {
        formData[key]?.push('1')
      }
    } else {
      formData[key] = ''
      if (key === 'nd') {
        formData[key] = selectData.ndList[0].yearCode || new Date().getFullYear().toString()
      }
    }
  }
  await resetPage()
  selectData.ejdwListData.length = 0
  // 调整查询
  searchHandle()
}

const exportApiHandle = async () => {
  gridOptions.loading = true
  let params: any = {
    dwId: props.initInfo.userInfo.org_id
  }
  if (zsfs.value === '3') {
    params.page = page.page
    params.limit = page.limit
  }
  for (const key in formData) {
    const value = formData[key]
    if (value) params[key] = value
  }
  if (params.yslys && Array.isArray(params.yslys)) {
    params.yslys = params.yslys.join(',')
  }
  exportMbzStatisticsByProtypeDw(params).then((res: any) => {
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    gridOptions.loading = false
  })
}

// 页面导出
const pageExportHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    $table.exportData(gridOptions.exportConfig)
  }
}

// 展开
const expandHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    expandAllTree(gridOptions.data, $table)
  }
}

const expandAllTree = async (data: any, $table: any) => {
  data.forEach(async (row: any) => {
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      if (row.children) {
        expandAllTree(row.children, $table)
      }
    }
  })
}

watch(
  () => zsfs.value,
  (newVal) => {
    emits('isDisable', newVal !== '2')
    emits('isExport', newVal !== '3')
  }
)

watch(
  () => gridOptions.loading,
  (newVal) => {
    emits('isLoad', newVal)
  }
)

onMounted(async () => {
  loading.value = true
  getNdData()
  getProjectData()
  getProGkbmData()
  getYjdwData()
  await getOtherSearchData()
  zsfs.value = '1'
  await searchHandle()
  loading.value = false
})

defineExpose({
  pageExportHandle,
  exportApiHandle,
  expandHandle
})
</script>

<style scoped lang="less">
.el-col {
  max-height: 43px;
}
.table {
  height: calc(100vh - 250px);
}

:deep(.vxe-grid--pager-wrapper) {
  height: 38px;
}

:deep(.el-icon-arrow-left),
:deep(.el-icon-arrow-right) {
  margin: 0 auto;
}
</style>
