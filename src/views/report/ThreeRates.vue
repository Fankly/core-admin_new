<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="container-operation" v-if="pageInfo.isShowPage" style="margin-bottom: 10px">
      <div class="left">
        <el-button
          :loading="gridOptions.loading"
          v-permission="'EXPORT'"
          type="primary"
          size="mini"
          plain
          @click="exportHandle"
          >导 出</el-button
        >
        <el-button
          :loading="gridOptions.loading"
          v-permission="'EXPAND'"
          type="primary"
          size="mini"
          plain
          @click="expandHandle"
          >一键展开</el-button
        >
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search">
      <el-form label-position="right" :label-width="110" :model="searchForm">
        <Grid ref="gridRef" :gap="[12, 0]" :cols="4">
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `指标项` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form" v-if="pageInfo.isShowPage">
                <el-select
                  clearable
                  collapse-tags
                  style="width: 100%"
                  multiple
                  v-model="searchForm.indicatorList"
                >
                  <el-option
                    v-for="item in zbxDataList"
                    :key="item.code"
                    :label="item.name"
                    :value="item.code"
                  ></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <div class="search-form-item">
              <div class="search-form-date">
                <el-form-item>
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `预算期间` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form">
                    <div class="date">
                      <el-date-picker
                        style="width: 120px"
                        @change="startTimeHandle"
                        :clearable="false"
                        v-model="searchForm.startDate"
                        value-format="YYYY-MM"
                        format="YYYY-MM"
                        type="month"
                      ></el-date-picker>
                      <span style="padding: 0 10px">至</span>
                      <el-date-picker
                        style="width: 120px"
                        :disabledDate="disabledEndMonth"
                        :clearable="false"
                        v-model="searchForm.endDate"
                        value-format="YYYY-MM"
                        format="YYYY-MM"
                        type="month"
                      ></el-date-picker>
                    </div>
                  </div>
                </el-form-item>
              </div>
            </div>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `项目类型` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <TreeSelect
                  ref="xmlxRef"
                  @clearData="clearDataHandle"
                  :is-leaf="false"
                  data-type="id"
                  :default-props="projectTypeProps"
                  @selectChange="getProjectType"
                  style="width: 100%"
                  :data="xmlxTreeData"
                  node-key="id"
                ></TreeSelect>
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
              <div class="form" v-if="pageInfo.isShowPage">
                <DwTreeSelect
                  v-model="searchForm.selectedDwId"
                  :flag="true"
                  :userInfo="userInfo"
                  :dwId="dwId"
                  ref="dwSelectRef"
                ></DwTreeSelect>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem />
          <GridItem />
          <GridItem />
          <GridItem>
            <el-form-item>
              <div class="operation">
                <el-button
                  :loading="gridOptions.loading"
                  type="primary"
                  size="mini"
                  plain
                  @click="searchData"
                  >查 询</el-button
                >
                <el-button :loading="gridOptions.loading" size="mini" plain @click="resetHandle"
                  >重 置</el-button
                >
              </div>
            </el-form-item>
          </GridItem>
        </Grid>
      </el-form>
    </div>
    <div class="table">
      <vxe-grid
        ref="gridRef"
        @cell-click="handleCellClick"
        height="100%"
        v-bind="gridOptions"
      ></vxe-grid>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <ThreeRatesModal ref="processModalRef" :click-table-data="clickTableData" />
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/report/ThreeRates'
}
</script>

<script setup lang="ts">
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import userDialog from '@/components/select/userDialog.vue'

import { onMounted, reactive, ref, watch } from 'vue'
import {
  getDynamicColumnByTypeNew,
  getProTypeTree,
  getStatDataByTypeNew,
} from '@/api/report'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { ElMessage } from 'element-plus'
import { getPublicCodeList } from '@/api/common'
import DwTreeSelect from '@/views/report/components/DwTreeSelect.vue'
import ThreeRatesModal from '@/views/report/components/ThreeRatesModal.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

const userDialogRef = ref()
const helpModalRef = ref()
const processModalRef = ref()
const xmlxRef = ref()
const gridRef = ref()
const dwSelectRef = ref()
const userInfo = ref<any>()
const clickTableData = ref<any>()
const dwId = ref('')
const BATCH_SIZE = 3

const searchForm = reactive<any>({
  currentUserDwId: '',
  endDate: '',
  startDate: '',
  selectedDwId: null,
  indicatorList: ['fjl', 'lxl', 'wcl'],
  xmlxIdList: []
})

const pageInfo = reactive({
  isShowPage: false
})

const xmlxTreeData = ref([])
const flatColumns = ref<any>([])
const zbxDataList = ref<any>([])

const projectTypeProps = {
  children: 'children',
  label: 'name'
}

const loadChildrenMethod = ({ row }: any) => {
  return new Promise((resolve: any) => {
    let api = getStatDataByTypeNew
    if (!api) return
    let params: any = {
      ...searchForm,
      parentId: row.id
    }
    api(params).then((res: any) => {
      if (res.success) {
        if (res.data) {
          const data = res.data.map((item: any) => ({
            ...item,
            hasChild: item.leaf === '0'
          }))
          resolve(data)
        } else {
          resolve([])
        }
      } else {
        ElMessage.error(res.msg)
        resolve([])
      }
    })
  })
}

const gridOptions = reactive<any>({
  border: true,
  stripe: true,
  loading: false,
  columnConfig: {
    resizable: true
  },
  treeConfig: {
    lazy: true,
    hasChildField: 'hasChild',
    loadMethod: loadChildrenMethod
  },
  align: 'center',
  headerAlign: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  exportConfig: {
    sheetName: '成本性项目三率报表-导出',
    type: 'xlsx',
    filename: '成本性项目三率报表-导出',
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
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
        row.eachCell((cell: any, cellNumber: any) => {
          if (rowNumber > 2 && newArr[rowNumber - 3].cj === 1) {
            cell.font = {
              ...cell.font,
              bold: true
            }
          }
        })
      })
    }
  },
  rowStyle: ({ row }: any) => {
    if (row['hasChild']) {
      return {
        fontWeight: 'bold'
      }
    }
  },
  cellStyle: ({ row, column }: any) => {
    const findData = flatColumns.value.find(
      (item: any) => item.field === column.field && item.canBeCt
    )
    if (findData) {
      return {
        cursor: 'pointer'
      }
    }
  },
  rowConfig: {
    height: 32
  },
  columns: [],
  data: []
})

const exportHandle = () => {
  const $table = gridRef.value
  if ($table) {
    $table.exportData(gridOptions.exportConfig)
  }
}

const allExpandedRows = ref(new Set())

const expandHandle = async () => {
  try {
    gridOptions.loading = true
    // 使用广度优先搜索
    const queue = [...gridOptions.data] as any[]
    const processedIds = new Set()
    while (queue.length > 0) {
      const currentBatch = queue.splice(0, BATCH_SIZE)
      const expandPromises = []
      for (const row of currentBatch) {
        if (processedIds.has(row.id)) continue
        processedIds.add(row.id)
        if (row.hasChild) {
          const expandPromise = (async () => {
            try {
              const isExpanded = row.children && row.children.length > 0
              if (!isExpanded) {
                await gridRef.value.toggleTreeExpand(row, true)
                allExpandedRows.value.add(row.id)
              }
            } catch (error) {
              console.error('Error expanding row:', error)
            }
          })()
          expandPromises.push(expandPromise)
        }
      }
      await Promise.all(expandPromises)
      await new Promise((resolve) => setTimeout(resolve, 200))
      for (const row of currentBatch) {
        if (row.children && row.children.length) {
          queue.push(...row.children)
        }
      }
      if (processedIds.size > 1000) {
        console.warn('已达到最大处理节点限制')
        break
      }
    }
  } catch (error) {
    console.error('展开节点时出错', error)
  } finally {
    gridOptions.loading = false
  }
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

const getRoleHandle = async () => {
  searchForm.currentUserDwId = userDialogRef.value.userMsg.org_id
  dwId.value = userDialogRef.value.userMsg.org_id
  userInfo.value = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    pageInfo.isShowPage = true
    await searchHandle()
    await getDynamicColumnHeader()
  }
}

const startTimeHandle = (val: string) => {
  if (searchForm.endDate) {
    const endtTime = new Date(searchForm.endDate)
    const endMonth = endtTime.getMonth()
    const endYear = endtTime.getFullYear()
    const startTime = new Date(val)
    const startMonth = startTime.getMonth()
    const startYear = startTime.getFullYear()
    if (startYear !== endYear || startMonth > endMonth) {
      if (startMonth === 12) {
        searchForm.endDate = (startTime.getFullYear() + startMonth).toString()
      } else {
        searchForm.endDate = (startTime.getFullYear() + startMonth + 1).toString()
      }
    }
  }
}

const disabledEndMonth = (time: Date) => {
  if (!searchForm.startDate) return false
  const startTime = new Date(searchForm.startDate)
  const startYear = startTime.getFullYear()
  const startMonth = startTime.getMonth()
  const currentYear = time.getFullYear()
  const currentMonth = time.getMonth()
  const monthDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth)
  return currentYear !== startYear || monthDiff < 0
}

const searchData = () => {
  if (searchForm.indicatorList.length === 0) {
    ElMessage.error('指标项不能为空!')
    return
  }
  searchHandle()
  getDynamicColumnHeader()
}

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const flatColumnsMethod = (dynamicHeader: any[]) => {
  if (dynamicHeader.length !== 0) {
    for (const header of dynamicHeader) {
      flatColumns.value.push(header)
      if (header.children && header.children.length !== 0) {
        flatColumnsMethod(header.children)
      }
    }
  }
}

const searchHandle = async () => {
  gridOptions.loading = true
  const res = await getStatDataByTypeNew({
    ...searchForm,
    parentId: null
  } as any)
  if (res.success) {
    gridOptions.loading = false
    if (res.data) {
      gridOptions.data = res.data.map((item: any) => ({
        ...item,
        hasChild: item.leaf === '0'
      }))
    }
  } else {
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

const getDynamicColumnHeader = async () => {
  flatColumns.value.length = 0
  gridOptions.loading = true
  const res = await getDynamicColumnByTypeNew({
    ...searchForm
  })
  if (res.success) {
    gridOptions.loading = false
    gridOptions.columns = res.data.map((item: any) => {
      if (item.field === 'name') {
        item.treeNode = true
        item.width = 300
        item.align = 'left'
        item.fixed = 'left'
      }
      return {
        headerAlign: 'center',
        align: 'center',
        ...item
      }
    })
    flatColumnsMethod(res.data)
  } else {
    gridOptions.loading = false
  }
}

const resetHandle = () => {
  const year = new Date().getFullYear().toString()
  const curMonth = new Date().getMonth() + 1
  // 设置默认值
  searchForm.startDate = year + '-01'
  searchForm.endDate = year + '-' + curMonth.toString().padStart(2, '0')
  searchForm.xmlxIdList.length = 0
  searchForm.selectedDwId = null
  searchForm.indicatorList = zbxDataList.value.map((item: any) => item.code) as string[]
  const $xlsxSelect = xmlxRef.value
  if ($xlsxSelect) {
    $xlsxSelect.clearSelect()
  }
  const $dwSelect = dwSelectRef.value
  if ($dwSelect) {
    $dwSelect.clearHandle()
  }
  searchHandle()
  getDynamicColumnHeader()
}

watch(
  () => searchForm.startDate,
  (newVal) => {
    if (newVal && searchForm.endDate) {
      const startTime = new Date(newVal)
      const year = startTime.getFullYear().toString()
      const endTime = new Date(searchForm.endDate)
      if (
        endTime.getFullYear() !== startTime.getFullYear() ||
        endTime.getMonth() < startTime.getMonth()
      ) {
        const curMonth = startTime.getMonth() + 1
        if (curMonth === 12) {
          searchForm.endDate = year + '-' + curMonth.toString().padStart(2, '0')
        } else {
          searchForm.endDate = year + '-' + (curMonth + 1).toString().padStart(2, '0')
        }
      }
    }
  }
)

const handleCellClick = ({ row, column }: any) => {
  const findData = flatColumns.value.find(
    (item: any) => item.field === column.field && item.canBeCt
  )
  if (findData) {
    processModalRef.value.isShowModal = true
    clickTableData.value = {
      ...searchForm,
      ...findData,
      ...row
    }
  }
}

const getProjectType = (value: any) => {
  searchForm.xmlxIdList = value
}

const clearDataHandle = () => {
  searchForm.xmlxIdList.length = 0
}

const initParams = async () => {
  await userDialogRef.value.getUser()
  const year = new Date().getFullYear().toString()
  const curMonth = new Date().getMonth() + 1
  searchForm.startDate = year + '-01'
  searchForm.endDate = year + '-' + curMonth.toString().padStart(2, '0')
  const publicCodeRes = await getPublicCodeList({
    codes: ['SLZBX_CODE']
  })
  if (publicCodeRes.success) {
    zbxDataList.value = publicCodeRes.data['SLZBX_CODE']
    searchForm.indicatorList = zbxDataList.value.map((item: any) => item.code) as string[]
  }
  const xmlxRes = await getProTypeTree()
  if (xmlxRes.success) {
    xmlxTreeData.value = xmlxRes.data
  }
}

onMounted(initParams)
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  padding: 10px;
  height: 100%;
  .container-operation {
    display: flex;
    align-items: center;
    .right {
      width: 100px;
      text-align: right;
    }
    .left {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
  }
  .operation {
    text-align: right;
  }
  .table {
    flex: 1;
    min-height: 0;
  }
}
.tips {
  color: red;
}
</style>
