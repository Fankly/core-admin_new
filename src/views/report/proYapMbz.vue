<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="operation" v-if="pageInfo.isShowPage">
      <div class="left">
        <el-button :loading="gridOptions.loading" v-permission="'EXPAND'" size="mini" plain type="primary" @click="expandHandle">一键展开</el-button>
        <el-button :loading="gridOptions.loading" v-permission="'EXPORT'" size="mini" plain type="primary" @click="exportDataHandle">导 出</el-button>
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
    <div class="search">
      <el-form :model="formData" label-position="right" label-width="100px">
        <Grid ref="gridRef" :gap="[10, 0]" :cols="4">
          <GridItem>
            <el-form-item prop="sjx">
              <template #label>
                <el-space :size="4">
                  <span>{{ `指标项` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select multiple collapse-tags clearable v-model="formData.sjx" class="form-select">
                  <el-option :key="item.code" v-for="item in formList.YSZXYL_SJX" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="ysnd">
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算年度` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-date-picker v-model="formData.ysnd" value-format="YYYY" format="YYYY" type="year" @change="changeYsndData"></el-date-picker>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="saveDate">
              <template #label>
                <el-space :size="4">
                  <span>{{ `归档时间` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-date-picker :clearable="false" v-model="formData.saveDate" value-format="YYYY-MM" format="YYYY-MM" type="month"></el-date-picker>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="xmlbIds">
              <template #label>
                <el-space :size="4">
                  <span>{{ `项目类别` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <XmlbSelect ref="xmlbRef" class="form-select" :tree-data="selectData.xmlbData" v-model="formData.xmlbIds"></XmlbSelect>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `单位` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form dwForm" v-if="pageInfo.isShowPage">
                <DwSelect :dwId="dwId" ref="dwSelectRef"></DwSelect>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem></GridItem>
          <GridItem></GridItem>
          <GridItem>
            <el-form-item style="text-align: right">
              <el-button type="primary" plain size="mini" :loading="gridOptions.loading" @click="searchDataHandle">查 询</el-button>
              <el-button plain size="mini" :loading="gridOptions.loading" @click="resetDataHandle">重 置</el-button>
            </el-form-item>
          </GridItem>
        </Grid>
      </el-form>
    </div>
    <div class="main">
      <vxe-grid ref="gridRef" v-bind="gridOptions"></vxe-grid>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/report/proYapMbz'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import DwSelect from '@/views/fy/standardCost/components/DwSelect.vue'
import XmlbSelect from '@/views/statistics/components/XmlbSelect.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import { onMounted, reactive, ref, watch } from 'vue'
import { VxeGridProps, VxeGridPropTypes } from 'vxe-table'
import { getPublicCodeList } from '@/api/common'
import { getProTypeTreeNode } from '@/api/process'
import { ElMessage } from 'element-plus'
import { getNodeTree } from '@/api/statistics/budgetStatisticsConfig'
import { getDynamicColumnByDw, getProYapMbzData, ProYapMbaSearch } from '@/api/statistics/ydxcylb'
import { formatNumValue } from '@/utils/utils'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

interface RowVo {
  id: string
}

interface CodeData {
  code: string
  name: string
}

interface FormData {
  sjx: string[]
  xsws: string
  jedw: string
  xsfs: string
  ysnd: string
  saveDate: string
  protype: string[]
  xmlbIds: string
  dwList: []
}

interface Column {
  canBeCt: boolean
  children: Column[]
  edit: boolean
  field: string
  needFormat: boolean
  title: string
  visible: boolean
  width: number
}

const flatColumns = reactive<Column[]>([])

const selectData = reactive<{
  projectType: any
  xmlbData: any
}>({
  projectType: [],
  xmlbData: []
})

const pageInfo = reactive({
  isShowPage: false
})

const formList = reactive<{
  YSZXYL_SJX: CodeData[]
  XSWS: CodeData[]
}>({
  YSZXYL_SJX: [],
  XSWS: []
})

const userDialogRef = ref()
const helpModalRef = ref()
const dwSelectRef = ref()
const xmlbRef = ref()
const dwId = ref<string>('')
const dwName = ref<string>('')
const year = ref('')
const busiType = ref('YSZXYL')

const formData = reactive<FormData>({
  sjx: ['MBZ', 'DFJ', 'LXZ', 'WCZ', 'WCL'],
  xsws: '',
  jedw: '',
  xsfs: '',
  ysnd: '',
  saveDate: '',
  protype: [],
  xmlbIds: '',
  dwList: []
})

const gridRef = ref()

const gridOptions = reactive<VxeGridProps<RowVo>>({
  border: true,
  stripe: true,
  columnConfig: {
    resizable: true
  },
  treeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod: ({ row }: any) => {
      return new Promise((resolve: any) => {
        gridOptions.loading = true
        let params: ProYapMbaSearch = getFormParams()
        params.parentId = row.id
        getProYapMbzData(params).then((res: any) => {
          if (res.success) {
            gridOptions.loading = false
            const data = res.data.map((item: any) => {
              let values = {
                ...item
              }
              values.leaf = item.leaf === '0'
              return {
                ...values
              }
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
  },
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  rowStyle: ({ row }: any) => {
    if (row && row['leaf']) {
      return {
        fontWeight: 'bold'
      }
    }
  },
  exportConfig: {
    sheetName: '项目预安排目标值-导出',
    type: 'xlsx',
    filename: '项目预安排目标值-导出',
    useStyle: true,
    sheetMethod: function ({ worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, gridOptions.data as any, 1)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3].cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
        }
      })
      worksheet.eachRow((row: any, rowNumber: any) => {
        row.eachCell((cell: any) => {
          if (rowNumber > 2 && newArr[rowNumber - 3].cj === 1) {
            cell.font = {
              ...cell.font,
              bold: true
            }
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

const changeYsndData = (val: string) => {
  if (val) year.value = formData.ysnd
  else formData.ysnd = ''
  getXmlbData(val)
}

const getExportData = (newArr: any[], data: any[], cj: number) => {
  const $table = gridRef.value
  data.forEach((item) => {
    let flag = $table.isTreeExpandByRow(item)
    newArr.push({
      name: item.name,
      cj: cj
    })
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children, cj + 1)
    }
  })
  return newArr
}

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const handleChangeXswsData = () => {
  searchDataHandle()
}

const getTableData = async () => {
  gridOptions.loading = true
  let params: ProYapMbaSearch = getFormParams()
  const res = await getProYapMbzData(params)
  if (res.success) {
    gridOptions.data = res.data.map((item: any) => {
      let values = {
        ...item
      }
      values.leaf = item.leaf === '0'
      return {
        ...values
      }
    })

    gridOptions.loading = false
  } else {
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

// 动态列修改
const editDynamicColumnData = async <T extends VxeGridPropTypes.Columns & Column[]>(data: T) => {
  for (const item of data) {
    flatColumns.push(item)
    if (item.children && item.children.length !== 0) {
      await editDynamicColumnData(item.children)
    }
    item.headerAlign = 'center'
    if (item.field === 'name') {
      item.align = 'left'
      item.fixed = 'left'
      item.treeNode = true
    } else {
      if (item.field.includes('JYL')) {
        item.formatter = ({ cellValue }: any) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString())
        }
      } else if (item.field.includes('WCL')) {
        item.formatter = ({ cellValue }: any) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 2)
        }
      } else {
        item.formatter = ({ cellValue }: any) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), Number(formData.xsws.split('_')[1]))
        }
      }
      item.align = 'right'
    }
  }
}

const getDynamicColumnData = async () => {
  gridOptions.loading = true
  let params: ProYapMbaSearch = getFormParams()
  const res = await getDynamicColumnByDw(params)
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
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

const getFormParams = (): ProYapMbaSearch => {
  return {
    busiType: busiType.value,
    dwId: dwId.value,
    saveDate: formData.saveDate,
    ysnd: formData.ysnd,
    dwList: formData.dwList,
    indicators: formData.sjx.join(','),
    parentId: '-1',
    xmlbIds: formData.xmlbIds
  }
}

const setFormData = async () => {
  const $dwSelect = dwSelectRef.value
  if ($dwSelect) {
    const selectDatas = $dwSelect.dwSelectRef.getCheckedNodes()
    formData.dwList = selectDatas.map((item: any) => ({
      code: item.code,
      nodeType: item.nodeType
    }))
  }
}

const searchDataHandle = async () => {
  if (gridOptions.data) gridOptions.data.length = 0
  if (gridOptions.columns) gridOptions.columns.length = 0
  if (formData.sjx && formData.sjx.length === 0) {
    ElMessage.error('指标项不能为空！')
    return
  }
  await setFormData()
  await getDynamicColumnData()
  await getTableData()
}

const resetDataHandle = async () => {
  await setDefaultValue()
  await getDynamicColumnData()
  await getTableData()
}

const setDefaultValue = async () => {
  const now = new Date()
  year.value = now.getFullYear().toString()
  formData.ysnd = ''
  // 设置默认值
  formData.saveDate = year.value + '-' + (now.getMonth() + 1).toString().padStart(2, '0')
  const $dwSelect = dwSelectRef.value
  if ($dwSelect) {
    $dwSelect.clearHandle()
  }
  formData.xsws = 'XSWS_4'
  formData.jedw = 'JEDW_WY'
  formData.xsfs = '0'
  formData.sjx = formList.YSZXYL_SJX.map((item: any) => item.code)
  formData.xmlbIds = ''
  formData.dwList.length = 0
}

const exportDataHandle = () => {
  const $table = gridRef.value
  if ($table) {
    $table.exportData(gridOptions.exportConfig)
  }
}

// 展开
const expandHandle = async () => {
  const $table = gridRef.value
  if ($table) {
    await expandAllTree(gridOptions.data as any[], $table)
  }
}

const expandAllTree = async (data: any[], $table: any) => {
  for (const row of data) {
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      if (row.children) {
        await expandAllTree(row.children, $table)
      }
    }
  }
}

// 获取项目类型
const getProjectData = () => {
  let newYear: string = year.value ? year.value : new Date().getFullYear().toString()
  const params = {
    parentId: '-1',
    ysnd: newYear
  }
  getProTypeTreeNode(params).then((res) => {
    if (res.success) {
      selectData.projectType = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

const getPublicCode = async () => {
  let codes = ['YAP_MBZ_INDICATOR', 'XSWS']
  const res = await getPublicCodeList({ codes })
  if (res.success && res.data) {
    formList.YSZXYL_SJX = res.data['YAP_MBZ_INDICATOR']
    formList.XSWS = res.data['XSWS']
  }
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  dwId.value = userDialogRef.value.userMsg.org_id
  dwName.value = userDialogRef.value.userMsg.org_name

  if (isQuery) {
    pageInfo.isShowPage = true
    await searchDataHandle()
  }
}

const getXmlbData = async (val?: string) => {
  if (xmlbRef.value) xmlbRef.value.clearHandle()
  const nd = val ? val : year.value
  let res = await getNodeTree(busiType.value, nd)
  if (res.success && res.data) {
    selectData.xmlbData = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

const initParams = async () => {
  await getPublicCode()
  await setDefaultValue()
  await getXmlbData()
  userDialogRef.value.getUser()
}

onMounted(() => {
  initParams()
})

watch(
  () => year.value,
  () => {
    getProjectData()
  },
  {
    immediate: true
  }
)
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;

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

  .search {
    min-height: 0;
    min-width: 0;

    .form {
      .form-select {
        width: 100%;
      }
    }
  }

  .main {
    min-height: 0;
    min-width: 0;
    flex: 1;
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

:deep(.el-date-editor) {
  width: 100%;
}
</style>
