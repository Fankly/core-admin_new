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
      </div>
      <div class="right">
        <el-tooltip content="帮助" placement="top">
          <span style="cursor: pointer; font-size: 18px" @click="getHelpMessageHandle">
            <i class="el-icon-question"></i>
          </span>
        </el-tooltip>
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
  <process-modal ref="processModalRef" :click-table-data="clickTableData" />
  <vxe-modal title="帮助" width="600" height="350" v-model="isShowHelpMsg">
    <div class="tips">
      <p
        >项目类型包括检修运维成本、研究开发成本、其他运营费用（省级统筹），数据统计排除机动、定额包项目。</p
      >
      <p
        ><span style="font-weight: bold">分解率=分解金额/目标值</span
        >。其中，一级单位分解金额为目标值分解金额，二级单位分解金额取项目类型下普通包金额（排除机动、定额包）。</p
      >
      <p style="font-weight: bold">立项率=立项预算不含税/目标值。</p>
      <p style="font-weight: bold">完成率=当年结算不含税/目标值。</p>
      <p
        >针对2024年及以前同比数据，以年底立项项目清单为基础，排除机动、定额包项目，按还原项目类型统计各项目类型立项预算不含税，合计值即为各项目类型各月份的目标值（同一项目类型，各月份目标值相同）。</p
      >
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: '/report/ThreeRatesType'
}
</script>

<script setup lang="ts">
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import userDialog from '@/components/select/userDialog.vue'

import { onMounted, reactive, ref, watch } from 'vue'
import { getDynamicColumn, getProTypeTree, getStatData, SearchForm } from '@/api/report'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPublicCodeList } from '@/api/common'
import DwTreeSelect from '@/views/report/components/DwTreeSelect.vue'
import ProcessModal from '@/views/report/components/processModal.vue'

const userDialogRef = ref()
const processModalRef = ref()
const xmlxRef = ref()
const gridRef = ref()
const dwSelectRef = ref()
const userInfo = ref<any>()
const clickTableData = ref<any>()
const dwId = ref('')
const isShowHelpMsg = ref(false)

const searchForm = reactive<SearchForm>({
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
  align: 'center',
  headerAlign: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  exportConfig: {
    sheetName: '成本性项目三率报表-按类型-导出',
    type: 'xlsx',
    filename: '成本性项目三率报表-按类型-导出',
    useStyle: true
  },
  rowStyle: () => {
    return {
      cursor: 'pointer'
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

const getHelpMessageHandle = () => {
  isShowHelpMsg.value = true
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

const searchHandle = async () => {
  gridOptions.loading = true
  const res = await getStatData({
    ...searchForm
  })
  if (res.success) {
    gridOptions.loading = false
    gridOptions.data = res.data
  } else {
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

const getDynamicColumnHeader = async () => {
  gridOptions.loading = true
  const res = await getDynamicColumn({
    ...searchForm
  })
  if (res.success) {
    gridOptions.loading = false
    gridOptions.columns = res.data
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

const handleCellClick = ({ row }: any) => {
  processModalRef.value.isShowModal = true
  clickTableData.value = {
    ...searchForm,
    ...row
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
