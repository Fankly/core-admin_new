<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="opeartion" v-if="pageInfo.isShowPage" style="margin-bottom: 10px">
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
                  v-model="searchForm.indicators"
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
                  @selectChange="getProjectType"
                  ref="xmlxRef"
                  @clearData="clearDataHandle"
                  :is-leaf="false"
                  data-type="id"
                  :default-props="projectTypeProps"
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
  <type-process-modal ref="processModalRef" :click-table-data="clickTableData" />
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/report/ThreeRatesDw'
}
</script>

<script setup lang="ts">
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import userDialog from '@/components/select/userDialog.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { onMounted, reactive, ref, watch } from 'vue'
import {
  DwSearchForm,
  getProTypeTree,
  getDataListByDw,
  getThreeRateReportDynamicColumn
} from '@/api/report'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { ElMessage } from 'element-plus'
import { getPublicCodeList } from '@/api/common'
import TypeProcessModal from '@/views/report/components/typeProcessModal.vue'

const userDialogRef = ref()
const gridRef = ref()
const processModalRef = ref()
const clickTableData = ref([])
const helpModalRef = ref<InstanceType<typeof HelpModal>>()
const xmlxRef = ref()
const userInfo = ref<any>()
const dwId = ref('')

interface DwSearchForms {
  dwId: number | null
  endDate: string
  startDate: string
  proType: string
  indicators: string[]
}

const searchForm = reactive<DwSearchForms>({
  startDate: '',
  endDate: '',
  proType: '',
  dwId: null,
  indicators: ['fjl', 'lxl', 'wcl']
})

const pageInfo = reactive({
  isShowPage: false
})

const xmlxTreeData = ref([])
const zbxDataList = ref<any>([])

// 获取帮助信息
const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const projectTypeProps = {
  children: 'children',
  label: 'name'
}

const handleCellClick = ({ row }: any) => {
  if (!row.overStriking) {
    processModalRef.value.isShowModal = true
    clickTableData.value = {
      ...searchForm,
      ...row
    }
  }
}

const gridOptions = reactive<any>({
  border: true,
  stripe: true,
  loading: false,
  columnConfig: {
    resizable: true
  },
  align: 'center',
  headerAlign: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  rowConfig: {
    height: 32
  },
  exportConfig: {
    sheetName: '成本性项目三率报表-按单位-导出',
    type: 'xlsx',
    filename: '成本性项目三率报表-按单位-导出',
    useStyle: true
  },
  rowStyle: ({ row }: any) => {
    if (row['overStriking']) {
      return {
        fontWeight: '700'
      }
    }
    return {
      cursor: 'pointer'
    }
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

const getRoleHandle = async () => {
  searchForm.dwId = userDialogRef.value.userMsg.org_id
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

const getProjectType = (value: string[]) => {
  searchForm.proType = value.join(',')
}

const getDynamicColumnHeader = async () => {
  gridOptions.loading = true
  const params: DwSearchForm = {
    dwId: searchForm.dwId,
    startDate: searchForm.startDate,
    endDate: searchForm.endDate,
    indicators: searchForm.indicators.join(','),
    proType: searchForm.proType
  }
  const res = await getThreeRateReportDynamicColumn(params)
  if (res.success) {
    gridOptions.columns = res.data
    gridOptions.loading = false
  } else {
    ElMessage.error(res.msg)
    gridOptions.loading = false
  }
}

const searchData = () => {
  if (searchForm.indicators && searchForm.indicators.length === 0) {
    ElMessage.error('指标项不能为空!')
    return
  }
  getDynamicColumnHeader()
  searchHandle()
}

const searchHandle = async () => {
  gridOptions.loading = true
  const params: DwSearchForm = {
    dwId: searchForm.dwId,
    startDate: searchForm.startDate,
    endDate: searchForm.endDate,
    indicators: searchForm.indicators.join(','),
    proType: searchForm.proType
  }
  const res = await getDataListByDw(params)
  if (res.success) {
    gridOptions.data = res.data
    gridOptions.loading = false
  } else {
    ElMessage.error(res.msg)
    gridOptions.loading = false
  }
}

const resetHandle = () => {
  const year = new Date().getFullYear().toString()
  const curMonth = new Date().getMonth() + 1
  // 设置默认值
  searchForm.startDate = year + '-01'
  searchForm.endDate = year + '-' + curMonth.toString().padStart(2, '0')
  searchForm.proType = ''
  searchForm.indicators = zbxDataList.value.map((item: any) => item.code)
  const $xlsxSelect = xmlxRef.value
  if ($xlsxSelect) {
    $xlsxSelect.clearSelect()
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

const clearDataHandle = () => {
  searchForm.proType = ''
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
    searchForm.indicators = zbxDataList.value.map((item: any) => item.code)
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

  :deep(.el-form) {
    height: 43px;
  }
  .opeartion {
    display: flex;
    justify-content: space-between;
  }
  .operation {
    text-align: right;
  }
  .table {
    flex: 1;
    min-height: 0;
  }
}
</style>
