<!-- 市管部门维度 -->
<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="container-operation" v-if="pageInfo.isShowPage" style="margin-bottom: 10px">
      <div class="left">
        <el-button :loading="gridOptions.loading" v-permission="'EXPORT'" type="primary" size="mini" plain @click="exportHandle">导 出</el-button>
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
                <el-select clearable collapse-tags style="width: 100%" multiple v-model="searchForm.indicatorCodeList">
                  <el-option v-for="item in zbxDataList" :key="item.code" :label="item.name" :value="item.code"></el-option>
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
                        v-model="searchForm.budgetPeriodStart"
                        value-format="YYYY-MM"
                        format="YYYY-MM"
                        type="month"
                      ></el-date-picker>
                      <span style="padding: 0 10px">至</span>
                      <el-date-picker
                        style="width: 120px"
                        :disabledDate="disabledEndMonth"
                        :clearable="false"
                        v-model="searchForm.budgetPeriodEnd"
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
              <div class="operation">
                <el-button :loading="gridOptions.loading" type="primary" size="mini" plain @click="searchData">查 询</el-button>
                <el-button :loading="gridOptions.loading" size="mini" plain @click="resetHandle">重 置</el-button>
              </div>
            </el-form-item>
          </GridItem>
        </Grid>
      </el-form>
    </div>
    <div class="table">
      <vxe-grid ref="gridRef" height="100%" v-bind="gridOptions" />
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <ThreeRatesModal ref="processModalRef" :click-table-data="clickTableData" />
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/report/ThreeCityDept'
}
</script>

<script setup lang="ts">
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import userDialog from '@/components/select/userDialog.vue'

import { onMounted, reactive, ref, watch } from 'vue'
import { getDynamicColumnBySgbm, getStatDataBySgbm } from '@/api/report'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { ElMessage } from 'element-plus'
import { getPublicCodeList } from '@/api/common'
import ThreeRatesModal from '@/views/report/components/ThreeRatesModal.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { formatNumValue } from '@/utils/utils'
import { vxeExportHandle } from '@/utils/export'
import { getSubProtypeTree } from '@/api/common'

const userDialogRef = ref()
const helpModalRef = ref()
const processModalRef = ref()
const xmlxRef = ref()
const gridRef = ref()
const dwSelectRef = ref()
const userInfo = ref<any>()
const apiParams = ref<any>()
const clickTableData = ref<any>()
const searchForm = reactive<any>({
  currentUserDwId: '',
  budgetPeriodEnd: '',
  budgetPeriodStart: '',
  indicatorCodeList: ['fjl', 'lxl', 'wcl'],
  proTypeIdList: []
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

const gridOptions = reactive<any>({
  border: true,
  stripe: true,
  loading: false,
  columnConfig: {
    resizable: true
  },
  treeConfig: {
    rowField: 'id',
    childrenField: 'children',
    expandAll: true
  },
  align: 'center',
  headerAlign: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  rowStyle: ({ row }: any) => {
    if (row['hasChild']) {
      return {
        fontWeight: 'bold'
      }
    }
  },
  cellStyle: ({ row, column }: any) => {
    const findData = flatColumns.value.find((item: any) => item.field === column.field && item.canBeCt)
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
    vxeExportHandle($table, `市管部门维度报表`, gridOptions.data)
  }
}

const getRoleHandle = async () => {
  searchForm.currentUserDwId = userDialogRef.value.userMsg.org_id
  userInfo.value = { ...userDialogRef.value.userMsg }
  apiParams.value = {
    dwId: userInfo.value?.org_id || '',
    bmId: userInfo.value?.specialorgid || '',
    bmxz: userInfo.value?.specialorgcode || ''
  }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    pageInfo.isShowPage = true
    await searchHandle()
    await getDynamicColumnHeader()
  }
}

const startTimeHandle = (val: string) => {
  if (searchForm.budgetPeriodEnd) {
    const endtTime = new Date(searchForm.budgetPeriodEnd)
    const endMonth = endtTime.getMonth()
    const endYear = endtTime.getFullYear()
    const startTime = new Date(val)
    const startMonth = startTime.getMonth()
    const startYear = startTime.getFullYear()
    if (startYear !== endYear || startMonth > endMonth) {
      if (startMonth === 12) {
        searchForm.budgetPeriodEnd = (startTime.getFullYear() + startMonth).toString()
      } else {
        searchForm.budgetPeriodEnd = (startTime.getFullYear() + startMonth + 1).toString()
      }
    }
  }
}

const disabledEndMonth = (time: Date) => {
  if (!searchForm.budgetPeriodStart) return false
  const startTime = new Date(searchForm.budgetPeriodStart)
  const startYear = startTime.getFullYear()
  const startMonth = startTime.getMonth()
  const currentYear = time.getFullYear()
  const currentMonth = time.getMonth()
  const monthDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth)
  return currentYear !== startYear || monthDiff < 0
}

const searchData = () => {
  if (searchForm.indicatorCodeList.length === 0) {
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
  const res = await getStatDataBySgbm({
    ...searchForm,
    ...apiParams.value
  } as any)
  if (res.success) {
    gridOptions.loading = false
    if (res.data) {
      gridOptions.data = res.data.map((item: any) => ({
        ...item,
        hasChild: !item.leaf
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
  const res = await getDynamicColumnBySgbm({
    ...searchForm,
    ...apiParams.value
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
    editColumns(gridOptions.columns)
    flatColumnsMethod(res.data)
  } else {
    gridOptions.loading = false
  }
}

const editColumns = (data: any) => {
  data.forEach((item: any) => {
    if (item.children && item.children.length > 0) {
      item.children.forEach((filed: any) => {
        if (filed.title.includes('万元')) {
          filed.align = 'right'
          filed.headerAlign = 'center'
          filed.formatter = ({ cellValue }: any) => {
            if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
            return formatNumValue(cellValue.toString(), 6)
          }
        }
        if (filed.title.includes('%')) {
          filed.formatter = ({ cellValue }: any) => {
            if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
            return formatNumValue(cellValue.toString(), 2)
          }
        }
      })
    }
  })
}

const resetHandle = () => {
  const year = new Date().getFullYear().toString()
  const curMonth = new Date().getMonth() + 1
  // 设置默认值
  searchForm.budgetPeriodStart = year + '-01'
  searchForm.budgetPeriodEnd = year + '-' + curMonth.toString().padStart(2, '0')
  searchForm.proTypeIdList.length = 0
  searchForm.indicatorCodeList = zbxDataList.value.map((item: any) => item.code) as string[]
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
  () => searchForm.budgetPeriodStart,
  (newVal) => {
    if (newVal && searchForm.budgetPeriodEnd) {
      const startTime = new Date(newVal)
      const year = startTime.getFullYear().toString()
      const endTime = new Date(searchForm.budgetPeriodEnd)
      if (endTime.getFullYear() !== startTime.getFullYear() || endTime.getMonth() < startTime.getMonth()) {
        const curMonth = startTime.getMonth() + 1
        if (curMonth === 12) {
          searchForm.budgetPeriodEnd = year + '-' + curMonth.toString().padStart(2, '0')
        } else {
          searchForm.budgetPeriodEnd = year + '-' + (curMonth + 1).toString().padStart(2, '0')
        }
      }
    }
  }
)

const getProjectType = (value: any) => {
  searchForm.proTypeIdList = value
}

const clearDataHandle = () => {
  searchForm.proTypeIdList.length = 0
}

const initParams = async () => {
  await userDialogRef.value.getUser()
  const year = new Date().getFullYear().toString()
  const curMonth = new Date().getMonth() + 1
  searchForm.budgetPeriodStart = year + '-01'
  searchForm.budgetPeriodEnd = year + '-' + curMonth.toString().padStart(2, '0')
  const publicCodeRes = await getPublicCodeList({
    codes: ['SLBB_BY_SGBM_INDICATOR_COM']
  })
  if (publicCodeRes.success) {
    zbxDataList.value = publicCodeRes.data['SLBB_BY_SGBM_INDICATOR_COM']
    searchForm.indicatorCodeList = zbxDataList.value.map((item: any) => item.code) as string[]
  }
  const xmlxRes = await getSubProtypeTree()
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
