<template>
  <div v-show="pageInfo.isShowPage" class="container">
    <el-tabs type="border-card" @tab-click="tabClickHandle" v-model="acitveName">
      <el-tab-pane
        v-for="item in publicCode.BZCBCX"
        :name="item.code"
        :key="item.code"
        :label="item.name"
      ></el-tab-pane>
      <div class="main">
        <div class="btn">
          <div class="left">
            <span> 单位：{{ dwName }} </span>
            <div style="margin-left: 10px">
              <el-button type="primary" size="mini" plain @click="expandHandle">一键展开</el-button>
              <el-button
                v-if="pageInfo.isShowPage"
                v-permission="'EXPORT'"
                type="primary"
                size="mini"
                plain
                @click="exportHandle"
                >导 出</el-button
              >
            </div>
          </div>
          <div class="right">
            <el-tooltip
              content="隐藏/展示查询"
              placement="top"
              style="margin-right: 10px; margin-left: 10px"
            >
              <span @click="isShowSearch = !isShowSearch">
                <i
                  :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
                  style="cursor: pointer; font-size: 18px"
                ></i>
              </span>
            </el-tooltip>
            <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
          </div>
        </div>
        <div class="search" v-if="isShowSearch">
          <el-form label-position="right" label-width="110px">
            <Grid ref="gridRef" :gap="[10, 0]" :cols="4">
              <GridItem>
                <el-form-item>
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `单位` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form dwForm" v-if="pageInfo.isShowPage">
                    <DwSelect
                      @clear-data="clearData"
                      @search-table="searchTable"
                      :userInfo="userInfo"
                      :dwId="dwId"
                      ref="dwSelectRef"
                    ></DwSelect>
                  </div>
                </el-form-item>
              </GridItem>
              <GridItem>
                <el-form-item>
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `预算值类型` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form">
                    <el-select
                      collapse-tags
                      clearable
                      multiple
                      style="width: 100%"
                      v-model="searchForm.yszlx"
                    >
                      <el-option
                        :value="item.code"
                        :key="item.code"
                        v-for="item in publicCode.YSZLX"
                        :label="item.name"
                      ></el-option>
                    </el-select>
                  </div>
                </el-form-item>
              </GridItem>

              <GridItem v-if="isHideTemplateCode">
                <el-form-item>
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `模板编码` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form dwForm" v-if="pageInfo.isShowPage">
                    <el-select style="width: 100%" v-model="searchForm.templateCode">
                      <el-option
                        :value="item.code"
                        :key="item.code"
                        v-for="item in publicCode.BZCBCXPZ_TEMPLATE_CODE"
                        :label="item.name"
                      ></el-option>
                    </el-select>
                  </div>
                </el-form-item>
              </GridItem>
              <GridItem :span="2">
                <div class="search-form-item">
                  <div class="search-form-date">
                    <el-form-item>
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `查询期间` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <div class="date">
                          <el-date-picker
                            @change="startTiemHandle"
                            :clearable="false"
                            v-model="searchForm.startTime"
                            value-format="YYYY-MM"
                            format="YYYY-MM"
                            type="month"
                          ></el-date-picker>
                          <span>至</span>
                          <el-date-picker
                            :disabledDate="disabledEndMonth"
                            :clearable="false"
                            v-model="searchForm.endTime"
                            value-format="YYYY-MM"
                            format="YYYY-MM"
                            type="month"
                          ></el-date-picker>
                        </div>
                      </div>
                    </el-form-item>
                  </div>
                  <div class="search-form-xsws">
                    <el-form-item class="form-xsws">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `小数位数` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form" v-if="pageInfo.isShowPage">
                        <el-select @change="handleChangeXswsData" v-model="searchForm.xsws">
                          <el-option
                            :value="item.code"
                            :key="item.code"
                            v-for="item in publicCode.XSWS"
                            :label="item.name"
                          ></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </div>
                </div>
              </GridItem>
              <GridItem>
                <el-form-item>
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `预算科目` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form" v-if="pageInfo.isShowPage">
                    <YskmSelect :nd="year" ref="yskmSelectRef" />
                  </div>
                </el-form-item>
              </GridItem>
              <GridItem>
                <el-form-item>
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `预算类型` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form">
                    <el-select clearable multiple style="width: 100%" v-model="searchForm.yslx">
                      <el-option
                        :value="item.code"
                        :key="item.code"
                        v-for="item in publicCode.YSLX"
                        :label="item.name"
                      ></el-option>
                    </el-select>
                  </div>
                </el-form-item>
              </GridItem>
              <GridItem>
                <div class="operation">
                  <el-button type="primary" size="mini" plain @click="searchHandle"
                    >查 询</el-button
                  >
                  <el-button type="primary" size="mini" plain @click="resetHandle">重 置</el-button>
                </div>
              </GridItem>
            </Grid>
          </el-form>
        </div>
        <div class="table">
          <vxe-grid v-on="gridEvent" ref="gridRef" v-bind="gridOptions"> </vxe-grid>
        </div>
      </div>
    </el-tabs>
  </div>
  <DetailView :init-params="detailParams" ref="detailViewRef"></DetailView>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/fy/standardCost/search'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import YskmSelect from '@/views/fy/standardCost/components/YskmSelect.vue'
import DwSelect from '@/views/fy/standardCost/components/DwSelect.vue'
import DetailView, { Params } from '@/views/fy/standardCost/components/DetailView.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { getPublicCodeList, getPublicData } from '@/api/common'
import { DwLists, exportData, getData, getDynamicColumn, getFormData } from '@/api/fy/search'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VxeTablePropTypes } from 'vxe-table'
import { formatNumValue } from '@/utils/utils'
import { expandNode } from '@/utils/dataProcessing'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

type Codes = 'YSZLX' | 'YSLX' | 'BZCBCX' | 'BZCBCXPZ_TEMPLATE_CODE' | 'XSWS'

interface Code {
  code: string
  name: string
}

interface PublicCode {
  YSZLX: Code[]
  YSLX: Code[]
  BZCBCX: Code[]
  BZCBCXPZ_TEMPLATE_CODE: Code[]
  XSWS: Code[]
}

type ActiveName = '0' | '1' | '2'

const acitveName = ref<ActiveName>('1')

const userInfo = ref<any>()

const isShowSearch = ref(true)

const isHideTemplateCode = computed(
  () => publicCode.BZCBCXPZ_TEMPLATE_CODE && publicCode.BZCBCXPZ_TEMPLATE_CODE.length !== 0
)

const pageInfo = reactive({
  isShowPage: false
})

const flatColumns = reactive<any>([])

const userDialogRef = ref()
const helpModalRef = ref()
const detailViewRef = ref()
const gridRef = ref()
const dwSelectRef = ref()
const yskmSelectRef = ref()

const year = ref('')
const dwId = ref('')
const dwName = ref('')

const detailParams = reactive<Params>({
  dwId: '',
  startTime: '',
  endTime: '',
  yskmName: '',
  id: '',
  fieldId: ''
})

const publicCode = reactive<PublicCode>({
  YSZLX: [],
  YSLX: [],
  BZCBCX: [],
  BZCBCXPZ_TEMPLATE_CODE: [],
  XSWS: []
})

const cellStyle: any = ({ row, column }: any) => {
  let res = isClickData(flatColumns, column.field)
  if (res && row.name !== '合计') {
    return {
      cursor: 'pointer'
    }
  }
  if (column.field.includes('zxl') || column.field.includes('wcl')) {
    const value = row[column.field]
    if (value > 100) {
      return {
        color: 'red'
      }
    }
  }
}

const rowStyle: VxeTablePropTypes.RowStyle<any> = ({ row }) => {
  if (row.name === '合计') {
    return {
      fontWeight: '700'
    }
  }
}

const gridOptions = reactive<any>({
  border: true,
  stripe: true,
  cellStyle: cellStyle,
  rowStyle: rowStyle,
  treeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod: ({ row }: any) => {
      return new Promise((resolve: any) => {
        gridOptions.loading = true
        let xsws = searchForm.xsws
        if (xsws) xsws = xsws.split('_')[1]
        let params: any = {
          parentId: row.id,
          searchType: acitveName.value,
          dwId: dwId.value,
          ...searchForm,
          xsws: xsws
        }
        getData(params).then((res) => {
          if (res.success) {
            gridOptions.loading = false
            const children = res.data
            for (const child of children) {
              if (child.sfmrzk) {
                setTimeout(() => {
                  gridRef.value.setTreeExpand(child, true)
                }, 100)
              }
            }
            resolve(res.data)
          } else {
            gridOptions.loading = false
            ElMessage.error(res.msg)
            resolve([])
          }
        })
      })
    }
  },
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
    keyField: 'id'
  },
  columns: [],
  data: []
})

const gridEvent: {
  cellClick: ({ row, column, cell }: { row: any; column: any; cell: any }) => void
} = {
  cellClick: ({ row, column, cell }) => {
    let res = isClickData(flatColumns, column.field)
    if (res && row.name !== '合计') {
      const cells = document.querySelectorAll('.clicked-cell')
      cells.forEach((el) => el.classList.remove('clicked-cell'))
      if (cell) {
        cell.classList.add('clicked-cell')
        try {
          const item = flatColumns.find((item: any) => item.field === column.field)
          if (item) detailParams.fieldId = item.parentField
        } catch (error) {
          console.error(error)
        } finally {
          detailParams.dwId = dwId.value
          detailParams.startTime = searchForm.startTime
          detailParams.endTime = searchForm.endTime
          detailParams.yskmName = row.name
          detailParams.id = row.id
          detailViewRef.value.isShowModal = true
        }
      }
    }
  }
}

const searchForm = reactive<{
  dwLists: DwLists[]
  yskmLists: string[]
  yszlx: string[]
  yslx: string[]
  startTime: string
  endTime: string
  templateCode: string
  xsws: string
  [key: string]: any
}>({
  dwLists: [],
  yszlx: ['mbz', 'zxz', 'wcz'],
  yslx: [],
  yskmLists: [],
  startTime: '',
  endTime: '',
  xsws: '',
  templateCode: ''
})

const tabClickHandle = async () => {
  try {
    const paramStr = acitveName.value === '1' ? 'YSZLX' : 'YSZLX-DS'
    searchForm.yszlx = ['mbz', 'zxz', 'wcz']
    const res = await getPublicData(paramStr)
    if (res.success) {
      publicCode.YSZLX = res.data
    }
    await searchHandle()
  } catch (e) {
    console.error(e)
  }
}

const isClickData = (columns: any[], field: string): boolean => {
  return !!columns.find((item) => item.canBeCt && item.field === field)
}

const startTiemHandle = (val: string) => {
  if (searchForm.endTime) {
    const endtTime = new Date(searchForm.endTime)
    const endMonth = endtTime.getMonth()
    const endYear = endtTime.getFullYear()
    const startTime = new Date(val)
    const startMonth = startTime.getMonth()
    const startYear = startTime.getFullYear()
    if (startYear !== endYear || startMonth > endMonth) {
      if (startMonth === 12) {
        searchForm.endTime = (startTime.getFullYear() + startMonth).toString()
      } else {
        searchForm.endTime = (startTime.getFullYear() + startMonth + 1).toString()
      }
    }
  }
}

const handleChangeXswsData = () => {
  getTableData()
}

watch(
  () => searchForm.startTime,
  (newVal) => {
    if (newVal && searchForm.endTime) {
      const startTime = new Date(newVal)
      year.value = startTime.getFullYear().toString()
      const endTime = new Date(searchForm.endTime)
      if (
        endTime.getFullYear() !== startTime.getFullYear() ||
        endTime.getMonth() < startTime.getMonth()
      ) {
        const curMonth = startTime.getMonth() + 1
        if (curMonth === 12) {
          searchForm.endTime = year.value + '-' + curMonth.toString().padStart(2, '0')
        } else {
          searchForm.endTime = year.value + '-' + (curMonth + 1).toString().padStart(2, '0')
        }
      }
    }
  }
)

const disabledEndMonth = (time: Date) => {
  if (!searchForm.startTime) return false
  const startTime = new Date(searchForm.startTime)
  const startYear = startTime.getFullYear()
  const startMonth = startTime.getMonth()
  const currentYear = time.getFullYear()
  const currentMonth = time.getMonth()
  const monthDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth)
  return currentYear !== startYear || monthDiff < 0
}

const setDefaultValue = async () => {
  let defaultValue: any = {
    0: ['mbz', 'zxz', 'zxl', 'wcz'],
    1: ['mbz', 'zxz', 'wcz'],
    2: ['mbz', 'zxz', 'wcz']
  }
  for (const key in searchForm) {
    if (Array.isArray(searchForm[key])) {
      if (key === 'yslx') {
        searchForm[key] = ['nd']
      } else if (key === 'dwLists') {
        if (userInfo.value && userInfo.value.code !== 'ZZ') {
          searchForm[key].length = 0
        }
      } else {
        searchForm[key].length = 0
      }
    } else {
      searchForm[key] = ''
    }
    if (key === 'templateCode' && publicCode.BZCBCXPZ_TEMPLATE_CODE) {
      searchForm.templateCode = publicCode.BZCBCXPZ_TEMPLATE_CODE[0].code
    }
  }
  year.value = new Date().getFullYear().toString()
  const curMonth = new Date().getMonth() + 1
  // 设置默认值
  searchForm.startTime = year.value + '-01'
  searchForm.endTime = year.value + '-' + curMonth.toString().padStart(2, '0')
  searchForm.xsws = 'XSWS_2'
  const $dwSelect = dwSelectRef.value
  if ($dwSelect && userInfo.value && userInfo.value.code !== 'ZZ') {
    $dwSelect.clearHandle()
  }
  const $yskmSelect = yskmSelectRef.value
  if ($yskmSelect) {
    $yskmSelect.clearHandle()
  }
  searchForm.yszlx = defaultValue[acitveName.value]
}

const setFormData = async () => {
  const $dwSelect = dwSelectRef.value
  if ($dwSelect) {
    const selectDatas = $dwSelect.dwSelectRef.getCheckedNodes()
    if (selectDatas.length !== 0) {
      searchForm.dwLists = selectDatas.map((item: any) => {
        return {
          code: item.code,
          nodeType: item.nodeType
        }
      })
    }
  }
  const $yskmSelect = yskmSelectRef.value
  if ($yskmSelect) {
    const selectDatas = $yskmSelect.yskmSelectRef.getCheckedNodes()
    // 获取半选中数据
    const selectHalfDatas = $yskmSelect.yskmSelectRef.getHalfCheckedNodes()
    let selectDataList = selectDatas.map((item: any) => item.id)
    let seletHalfDataList = selectHalfDatas.map((item: any) => item.id)
    searchForm.yskmLists = selectDataList.concat(seletHalfDataList)
  }
}

// 获取数据
const getTableData = async () => {
  gridOptions.data.length = 0
  let xsws = searchForm.xsws
  if (xsws) xsws = xsws.split('_')[1]
  gridOptions.loading = true
  let params: any = {
    searchType: acitveName.value,
    parentId: '-1',
    dwId: dwId.value,
    ...searchForm,
    xsws: xsws
  }
  let res = await getData(params)
  if (res.success) {
    gridOptions.data = res.data
    await nextTick(() => {
      handleExpand()
    })
  }
  gridOptions.loading = false
}

const handleExpand = async () => {
  for (const row of gridOptions.data) {
    if (row.sfmrzk) {
      await gridRef.value.setTreeExpand(row, true)
    }
  }
}

// 获取表格
const getDynamicColumnData = async () => {
  gridOptions.loading = true
  let params: any = {
    parentId: '-1',
    dwId: dwId.value,
    ...searchForm
  }
  let res = await getDynamicColumn(params)
  if (res.success) {
    gridOptions.columns = res.data.map((item: any) => {
      if (item.field === 'name') {
        item.treeNode = true
        item.align = 'left'
        item.headerAlign = 'center'
      }
      flatColumns.length = 0
      formatterColumns(item)
      return {
        ...item
      }
    })
    gridOptions.loading = false
  } else {
    ElMessage.error(res.msg)
    gridOptions.loading = false
  }
}
// 格式化columns
const formatterColumns = (item: any) => {
  flatColumns.push(item)
  const childItemArr = item.children
  if (childItemArr && childItemArr.length !== 0) {
    childItemArr.forEach((childItem: any) => {
      formatterColumns(childItem)
    })
  }
  if (item.needFormat) {
    item.formatter = ({ cellValue }: any) => {
      if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
      return formatNumValue(cellValue.toString(), Number(searchForm.xsws.split('_')[1]))
    }
  }
}

const allExpandedRows = ref<Set<string | number>>(new Set())
const BATCH_SIZE = 3

// 展开
const expandHandle = async () => {
  const $table = gridRef.value
  if ($table) {
    expandNode(allExpandedRows.value, gridOptions.data, gridRef, BATCH_SIZE, 'leaf')
  }
}

const searchHandle = async () => {
  if (searchForm.yslx.length === 0) {
    ElMessage.error('预算类型不能为空！')
    return
  }
  if (searchForm.yszlx.length === 0) {
    ElMessage.error('预算值类型不能为空]！')
    return
  }
  await setFormData()
  await getDynamicColumnData()
  await getTableData()
}

const searchTable = (data: any) => {
  searchForm.dwLists = [
    {
      code: data.code,
      nodeType: data.nodeType
    }
  ]
  searchHandle()
}

const clearData = () => {
  searchForm.dwLists = []
}

const resetHandle = async () => {
  await setDefaultValue()
  await getDynamicColumnData()
  await getTableData()
}

// 获取帮助信息
const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const exportHandle = async () => {
  if (searchForm.yslx.length === 0 || searchForm.yszlx.length === 0) {
    ElMessage.error('预算值类型和预算类型不能为空！')
    return
  }
  await setFormData()
  let params: any = {
    parentId: '-1',
    dwId: dwId.value,
    ...searchForm,
    searchType: acitveName.value
  }
  gridOptions.loading = true
  exportData(params).then((res: any) => {
    const blob = res
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

const getRoleHandle = async () => {
  dwId.value = userDialogRef.value.userMsg.org_id
  userInfo.value = { ...userDialogRef.value.userMsg }
  let res = await getFormData(dwId.value)
  dwName.value = res.data
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    pageInfo.isShowPage = true
    if (userInfo.value.code !== 'ZZ') {
      searchHandle()
    }
  }
}

const initParams = async () => {
  await userDialogRef.value.getUser()
  let codes: Codes[] = ['YSZLX', 'YSLX', 'BZCBCX', 'BZCBCXPZ_TEMPLATE_CODE', 'XSWS']
  // 初始化值,获取公共代码
  let res = await getPublicCodeList({
    codes: codes
  })
  if (res.success) {
    codes.forEach((item) => {
      publicCode[item] = res.data[item]
    })
    await setDefaultValue()
  }
}

onMounted(initParams)
</script>

<style scoped lang="less">
.container {
  height: calc(100vh - 110px);
  .main {
    display: flex;
    flex-direction: column;
    .date {
      display: flex;
      span {
        padding: 0 10px;
      }
      :deep(.el-input__inner) {
        text-align: center;
      }
    }
    height: calc(100vh - 180px);
    .btn {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      .left {
        display: flex;
        flex: 1;
        min-height: 0;
        min-width: 0;
        font-weight: bold;
        color: #212529;

        span {
          display: inline-block;
          font-size: 14px;
          color: #555;
          padding: 5px 10px;
          background-color: #e9ecef;
          border-radius: 5px;
          min-height: 0;
          min-width: 0;
        }
      }
      .right {
        width: 300px;
        text-align: right;
      }
    }

    .operation {
      margin-left: 10px;
      margin-bottom: 10px;
    }

    .table {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
  }
}

.search-form-item {
  display: flex;
}

:deep(.el-tabs__content) {
  height: calc(100vh - 154px);
  padding: 10px;
  margin: 0;
}
:deep(.el-range-separator) {
  padding: 0;
  margin: 0;
}
:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-form-item) {
  margin-bottom: 10px;
}
</style>
