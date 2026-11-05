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
            <el-select collapse-tags clearable style="width: 100%" v-model="formData.gkbms" placeholder="请选择" multiple>
              <template v-for="item in selectData.gkbmList" :key="item.code">
                <el-option :label="item.name" :value="item.code"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="重点投向：">
            <el-select multiple collapse-tags clearable style="width: 100%" v-model="formData.zdtxs" placeholder="请选择">
              <template v-for="item in selectData.zdtxList" :key="item.code">
                <el-option :label="item.name" :value="item.code"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="事项名称：">
            <el-input maxlength="127" v-model="formData.sxmc"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
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
            <el-select multiple style="width: 100%" v-model="formData.tjwd" placeholder="请选择">
              <template v-for="item in selectData.tjwdList" :key="item.code">
                <el-option :label="item.name" :value="item.code"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="6">
          <el-form-item label="展示方式：">
            <el-select @change="zsfsChangeHandle" style="width: 100%" v-model="formData.zsfs" placeholder="请选择">
              <template v-for="item in selectData.zsfsList" :key="item.code">
                <el-option :label="item.name" :value="item.code"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="18">
          <div class="btn" style="text-align: right; line-height: 43px">
            <el-button type="primary" size="mini" plain @click="clickSearchHandle">查 询</el-button>
            <el-button type="primary" size="mini" plain @click="resetHandle">重 置</el-button>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </div>
  <div class="table">
    <vxe-grid ref="tableRef" v-bind="gridOptions" v-on="gridEvents">
      <template #pager v-if="formData.zsfs === '4'">
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
  <SearchDetailView :params="modalParams" ref="searchDetailViewRef" />
</template>

<script lang="ts">
export default {
  name: 'MatterSearchMain'
}
</script>

<script setup lang="ts">
import TreeSelect from '@/components/select/TreeSelect.vue'
import SearchDetailView from '@/views/matter/components/search/SearchDetailView.vue'

import { onMounted, defineExpose, reactive, ref, defineProps, watch, defineEmits } from 'vue'
import { exportDataAll, exportData, getDataAll, Params, Result } from '@/api/matter/search/index'
import { getProTypeTreeNode } from '@/api/process'
import { ElMessage } from 'element-plus'
import { getYearData, getYjdwNew, getEjdwByYjdw, getGkbmInProvince, getPublicCodeList, getZdtxByXmlx } from '@/api/common'
import { UserInfo } from '../../interface'
import { VxeGridListeners, VxeGridProps } from 'vxe-table'
import { formatNumValue } from '@/utils/utils'

interface Column {
  columnKey: string
  columnValue: string
  dataType: string
  dwDetailId: string | null
  eidt: boolean
  fixed: boolean
  hidden: boolean
  needSum: boolean
  visible: boolean
  align: string
}

interface InitInfo {
  userInfo: UserInfo
  isShowPage: boolean
}

interface Props {
  initInfo: InitInfo
  searchApi: (params: Params) => Promise<Result>
  getDynamicColumnApi: (zsfs: string) => Promise<Result>
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

const modalParams = ref({})

const props = defineProps<Props>()

const emits = defineEmits(['isDisable', 'isExport', 'isLoad'])

const tableRef = ref()
const proTypeRef = ref()
const searchDetailViewRef = ref()

const page = reactive({
  total: 0,
  limit: 10,
  page: 1,
  current: '1'
})

const formData = reactive<Partial<Params>>({})

const treeProps = reactive({
  projectTypeProps: {
    children: 'children',
    label: 'name'
  }
})

const selectData = reactive<{
  yjdwListData: SearchData[]
  ejdwListData: SearchData[]
  gkbmList: SearchData[]
  projectType: any
  ndList: NdList[]
  tjwdList: SearchData[]
  zsfsList: SearchData[]
  zdtxList: SearchData[]
}>({
  yjdwListData: [],
  ejdwListData: [],
  projectType: [],
  ndList: [],
  gkbmList: [],
  tjwdList: [],
  zsfsList: [],
  zdtxList: []
})

const loading = ref(false)

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
    height: 32,
    isCurrent: true
  },
  columns: [],
  data: [],
  exportConfig: {
    type: 'xlsx',
    filename: props.fileName,
    sheetName: props.fileName,
    useStyle: true
  }
})

const getExportData = (newArr: any[], data: any[]) => {
  data.forEach((item) => {
    newArr.push({
      cj: item.cj,
      name: item.dwName
    })
    if (item.leaf && item.children) {
      getExportData(newArr, item.children)
    }
  })
  return newArr
}

const clearDataHandle = () => {
  if (formData.zdtxs && formData.zdtxs.length !== 0) formData.zdtxs.length = 0
  if (formData.xmlxs && formData.xmlxs.length !== 0) formData.xmlxs.length = 0
  selectData.zdtxList.length = 0
}

const getProjectTypeHandle = (value: string[]) => {
  formData.xmlxs = value
  if (formData.zdtxs && formData.zdtxs.length !== 0) formData.zdtxs.length = 0
  selectData.zdtxList.length = 0
  getZdtxListData(value)
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

// 展现方式
const zsfsChangeHandle = async () => {
  await searchHandle()
  if (tableRef.value && formData.zsfs === '1') tableRef.value.setAllTreeExpand(true)
}

// 获取二级单位数据
const getEjdwData = async (val: string) => {
  if (!val) return
  const ejdwData = await getEjdwByYjdw(val)
  selectData.ejdwListData = ejdwData.data
}

// 获取重点投向
const getZdtxListData = async (xmlx: string[]) => {
  const res = await getZdtxByXmlx(xmlx)
  if (res.success) {
    selectData.zdtxList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
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
  let codes = ['MATTER_ZSFS', 'XMLB_YSLY']
  let res = await getPublicCodeList({ codes })
  if (res.success && res.data) {
    selectData.zsfsList = res.data[codes[0]]
    selectData.tjwdList = res.data[codes[1]]
    formData.zsfs = selectData.zsfsList[0].code
    formData.tjwd?.push(selectData.zsfsList[0].code)
  }
}

const clickSearchHandle = async () => {
  await searchHandle()
  if (tableRef.value && formData.zsfs === '1') tableRef.value.setAllTreeExpand(true)
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
  let params: any = {
    dwId: props.initInfo.userInfo.org_id
  }
  let api
  if (formData.zsfs === '4') {
    api = getDataAll
    params.page = page.page
    params.limit = page.limit
  } else {
    api = props.searchApi
  }
  if (!api) return
  gridOptions.loading = true
  if (gridOptions.columns) gridOptions.columns.length = 0
  if (gridOptions.data) gridOptions.data.length = 0
  if (gridOptions.spanMethod) delete gridOptions.spanMethod
  if (gridOptions.treeConfig) delete gridOptions.treeConfig
  await getDynamicColumnData()
  for (const key in formData) {
    const value = formData[key]
    params[key] = value
  }
  let res = await api(params)
  if (res.success) {
    if (formData.zsfs === '1') {
      gridOptions.data = res.data.map((item: any) => {
        item.leaf = !item.leaf
        return item
      })
    } else if (formData.zsfs === '4') {
      gridOptions.data = res.data.records
      page.total = res.data.total
    } else {
      gridOptions.data = res.data
    }
    gridOptions.loading = false
  } else {
    ElMessage.error(res.msg)
    gridOptions.loading = false
  }
}

// 获取表头数据
const getDynamicColumnData = async () => {
  let api = props.getDynamicColumnApi
  if (!api) return
  if (formData.zsfs) {
    let res = await api(formData.zsfs)
    gridOptions.columns = res.data.map((item: Column) => {
      let column: any = {}
      setColumnType(item, column, formData.zsfs as string)
      return column
    })
  }
}

const setColumnType = (item: Column, column: any, zsfs: string) => {
  if (zsfs === '1') {
    if (item.columnKey === 'dwName') {
      column.treeNode = true
    }
    gridOptions.treeConfig = {
      lazy: true,
      hasChildField: 'leaf',
      loadMethod: ({ row }: { row: any }) => {
        return new Promise((resolve: any) => {
          gridOptions.loading = true
          let api = props.searchApi
          if (!api) return

          let params: any = {
            dwId: props.initInfo.userInfo.specialorgid,
            pid: row.id,
            punicode: row.unicode,
            cj: row.cj
          }
          for (const key in formData) {
            const value = formData[key]
            params[key] = value
          }
          api(params).then((res: any) => {
            if (res.success) {
              gridOptions.loading = false
              let data = res.data.map((item: any) => {
                item.leaf = !item.leaf
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
  }
  column.headerAlign = 'center'
  formatterColumns(item, column)
  column.field = item.columnKey
  column.title = item.columnValue
  column.visible = !item.hidden
  column.eidt = item.eidt
  column.needSum = item.needSum
  column.fixed = item.fixed
  column.align = item.align
}

// 重置表单
const resetHandle = async () => {
  for (const key in formData) {
    if (Array.isArray(formData[key])) {
      formData[key] = []
      proTypeRef.value.selectChange()
      if (key === 'tjwd') {
        formData[key]?.push('1')
      }
    } else {
      if (key !== 'zsfs') {
        formData[key] = ''
        if (key === 'nd') {
          formData[key] = selectData.ndList[0].yearCode || new Date().getFullYear().toString()
        }
      }
    }
  }
  selectData.ejdwListData.length = 0
  // 调整查询
  await searchHandle()
  if (tableRef.value && formData.zsfs === '1') tableRef.value.setAllTreeExpand(true)
}

// 页面导出
const pageExportHandle = async () => {
  const $table = tableRef.value
  if (gridOptions.exportConfig && gridOptions.exportConfig.sheetMethod) delete gridOptions.exportConfig.sheetMethod
  if (formData.zsfs === '1' && gridOptions.exportConfig) {
    gridOptions.exportConfig.sheetMethod = function ({ options, worksheet }: any) {
      let data = options.data
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, data)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1') {
          if (newArr[cellNumber - 2].cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 2].cj - 1) + newArr[cellNumber - 2].name
          }
        }
      })
      gridOptions.loading = false
    }
  }
  if ($table) {
    $table.exportData(gridOptions.exportConfig)
  }
}

// 格式化columns
const formatterColumns = (item: any, column: any) => {
  if (item.needSum) {
    column.formatter = ({ cellValue }: any) => {
      if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return ''
      if (cellValue === '-') return cellValue
      return formatNumValue(cellValue.toString(), 6)
    }
  }
}

const rowspanMethod = ({ row, _rowIndex, column, visibleData }: any) => {
  let field: string[] = []
  let value = ''
  if (formData.zsfs === '3') {
    value = 'xmlxId'
    field.push('xmlx')
  }
  if (formData.zsfs === '4') {
    field.push('dwName', 'gkbmName')
    value = 'dwName'
  }
  const cellValue = row[value]
  if (cellValue && field.includes(column.field)) {
    const prevRow = visibleData[_rowIndex - 1]
    let nextRow = visibleData[_rowIndex + 1]
    if (prevRow && prevRow[value] === cellValue) {
      return { rowspan: 0, colspan: 0 }
    } else {
      let countRowspan = 1
      while (nextRow && nextRow[value] === cellValue) {
        nextRow = visibleData[++countRowspan + _rowIndex]
      }
      if (countRowspan > 1) {
        return {
          rowspan: countRowspan,
          colspan: 1
        }
      }
    }
  }
}

// 展开
const expandHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    expandAllTree(gridOptions.data, $table)
  }
}

// 获取详情信息
const getDetailMsgHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    const records = $table.getCurrentRecord()
    if (!records) {
      ElMessage.warning('请选择数据,再进行操作!')
      return
    }
    modalParams.value = {
      dwId: props.initInfo.userInfo.org_id,
      ...records,
      ...formData
    }
  }
  const $modal = searchDetailViewRef.value
  if ($modal) {
    $modal.isShowModal = true
  }
}

const exportApiHandle = async (flag: string) => {
  let params: any = {
    dwId: props.initInfo.userInfo.org_id
  }
  if (formData.zsfs === '4' && flag !== 'EXPORT') {
    params.page = page.page
    params.limit = page.limit
  }
  gridOptions.loading = true
  for (const key in formData) {
    const value = formData[key]
    params[key] = value
  }
  exportDataAll(params).then((res) => {
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

const pageExportData = () => {
  let params: any = {
    dwId: props.initInfo.userInfo.org_id
  }
  gridOptions.loading = true
  for (const key in formData) {
    const value = formData[key]
    params[key] = value
  }
  exportData(params).then((res) => {
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

const gridEvents = reactive<VxeGridListeners<any>>({
  cellMenu({ row }) {
    const $grid = tableRef.value
    if ($grid) {
      $grid.setCurrentRow(row)
    }
  }
})

watch(
  () => gridOptions.data,
  () => {
    if (formData.zsfs === '3' || formData.zsfs === '4') {
      gridOptions.spanMethod = rowspanMethod
    }
  }
)

watch(
  () => formData.zsfs,
  (newVal) => {
    emits('isDisable', newVal !== '1')
    emits('isExport', newVal !== '4')
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
  await getNdData()
  await getProjectData()
  await getProGkbmData()
  await getOtherSearchData()
  await searchHandle()
  await getYjdwData()
  if (tableRef.value && formData.zsfs === '1') tableRef.value.setAllTreeExpand(true)
  loading.value = false
})

defineExpose({
  expandHandle,
  getDetailMsgHandle,
  exportApiHandle,
  pageExportHandle,
  pageExportData,
  formData
})
</script>

<style scoped lang="less">
.el-col {
  max-height: 43px;
}
.table {
  height: calc(100vh - 298px);
}

:deep(.vxe-grid--pager-wrapper) {
  height: 38px;
}

:deep(.el-icon-arrow-left),
:deep(.el-icon-arrow-right) {
  margin: 0 auto;
}
</style>
