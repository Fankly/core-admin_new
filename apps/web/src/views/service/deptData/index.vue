<!-- 部门指标看板 省三率-->
<template>
  <div class="container" v-if="isShowPage" v-loading="loading">
    <div class="container_top">
      <div class="container_top_left">
        <el-button v-permission="'SENDTODO'" size="small" type="primary" plain @click="sendTodo">推送待办</el-button>
        <el-button v-permission="'TB'" size="small" type="primary" plain @click="openTbhb('tb')">同比</el-button>
        <el-button v-permission="'HB'" size="small" type="primary" plain @click="openTbhb('hb')">环比</el-button>
      </div>
      <div class="container_top_right">
        <span>{{ `截至年月：` }}</span>
        <el-date-picker
          style="width: 120px"
          @change="endTimeHandle"
          :clearable="false"
          v-model="searchForm.endDate"
          value-format="YYYY-MM"
          format="YYYY-MM"
          type="month"
        />
        <div class="container_top_right_year">
          <span class="unit-wanyuan">单位：万元</span>
          <span class="unit-wanyuan">小数位数：2</span>
        </div>
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <v-chart
      @click="handleClick"
      class="echarts_style"
      :option="bmOBarOptions"
      :autoresize="true"
      :update-options="{ notMerge: true }"
      :loadingOptions="barLoadingOptions"
    />
    <proTable
      @row-click="detailView"
      @cell-click="detailView"
      @sort-change="handleSortChange"
      :cell-style="columnStyle"
      :row-style="rowStyle"
      ref="proTableRef"
      :pagination="false"
      :data="apiList"
      :search-col="4"
      :toolButton="false"
      :columns="tableColumns"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <detaildeptData ref="detaildeptDataRef" />
  <todoModal ref="todoModalRef" />
  <TbhbDeptSumModal ref="tbhbDeptSumModalRef" />
  <!-- 帮助 -->
  <HelpModal ref="helpModalRef" />
</template>
<script setup lang="ts">
defineOptions({ name: "/service/deptData/index" })
import { h, reactive, ref, computed, onMounted, nextTick } from 'vue'
import { useStore } from '@/store/business'
import { ElMessage, ElMessageBox, ElTooltip } from 'element-plus'
import userDialog from '@/components/select/userDialog.vue'
import VChart from 'vue-echarts'
import ProTable from '@/components/ProTable/index.vue'
import detaildeptData from '@/views/service/deptData/components/detailDeptData.vue'
import todoModal from '@/views/service/deptData/components/todoModal.vue'
import TbhbDeptSumModal from '@/views/service/deptData/components/TbhbDeptSumModal/index.vue'
import { getProSlDataByDept } from '@/api/service/deptData/index'
import { echartOption } from '@/views/service/deptData/hooks/index'
import { helpModalMeun } from '@/views/service/jointReview/hooks/help'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { formatNumValue } from '@/utils/utils'

const userDialogRef = ref() //用户角色
const detaildeptDataRef = ref()
const proTableRef = ref()
const todoModalRef = ref()
const tbhbDeptSumModalRef = ref()
const userInfo = ref<any>({}) //角色信息
const isShowPage = ref<boolean>(false)
const loading = ref<boolean>(false)
const store = useStore()
const dataList = ref<any[]>([])
const apiList = ref<any[]>([])
const searchForm = reactive<any>({
  endDate: '',
  selectedDwId: null
})
const { bmOBarOptions, barLoadingOptions } = echartOption()
const { helpModalRef, getHelpMessageHandle } = helpModalMeun()

// 当前角色是否为财务归口（specialorgcode 含 CW）
const isCwRole = computed(() => (userInfo.value?.specialorgcode ?? '').includes('CW'))

// 当前行是否属于当前角色（财务归口或匹配部门）
const isCurrentRoleRow = (row: any) => isCwRole.value || userInfo.value.specialorgid == row?.deptcode
const isBgRow = (row: any) => userInfo.value.specialorgid == row?.deptcode

// 点击柱状图
const handleClick = (val: any) => {
  const target = dataList.value[val?.dataIndex]
  if (val.componentType == 'xAxis' && target && isCurrentRoleRow(target)) {
    const params = {
      title: val.value,
      endDate: searchForm.endDate,
      deptcode: target.deptcode,
      currentUserDwId: userInfo.value.org_id,
      deptId: target.deptcode
    }
    detaildeptDataRef.value?.acceptParams(params)
  }
}

const sendTodo = async () => {
  const params = {
    endDate: searchForm.endDate,
    deptId: userInfo.value.specialorgid,
    specialorgid: userInfo.value.specialorgid,
    currentUserDwId: userInfo.value.org_id,
    senderId: store.getters.getUserMsg.id
  }
  todoModalRef.value.acceptParams({ ...params })
}

// 部门汇总级 同比/环比分析
const openTbhb = (type: 'tb' | 'hb') => {
  tbhbDeptSumModalRef.value?.open({
    type,
    endDate: searchForm.endDate,
    currentUserDwId: userInfo.value.org_id,
    userInfo: userInfo.value
  })
}

// 列颜色
const columnStyle = ({ row, column }: any) => {
  if (column.label == '归口部门' && row.deptname != '省平均' && isCurrentRoleRow(row)) {
    return {
      cursor: 'pointer',
      color: 'var(--color-primary)',
      textDecoration: 'underline',
      fontWeight: '600'
    }
  }
}
// 行样式
const rowStyle = ({ row }: any) => {
  if (isCurrentRoleRow(row) && row.deptname != '省平均') {
    return {
      cursor: 'pointer'
    }
  }

  if (row.deptname == '省平均') {
    return {
      fontWeight: 'bolder'
    }
  }
}
//
// 查看指标详情
const detailView = async (row: any, column: any) => {
  if (isCurrentRoleRow(row) && row.deptname != '省平均') {
    const params = {
      title: row.deptname,
      endDate: searchForm.endDate,
      currentUserDwId: userInfo.value.org_id,
      deptcode: row.deptcode,
      deptId: row.deptcode
    }
    nextTick(() => {
      detaildeptDataRef.value?.acceptParams(params)
    })
  }
}

const endTimeHandle = () => {
  getDataList()
}

const initParams = async () => {
  await userDialogRef.value.getUser()
  const year = new Date().getFullYear().toString()
  const curMonth = new Date().getMonth() + 1
  searchForm.endDate = year + '-' + curMonth.toString().padStart(2, '0')
}

const getDataList = async () => {
  const params = {
    endDate: searchForm.endDate,
    currentUserDwId: userInfo.value.org_id
  }
  loading.value = true
  try {
    const res = await getProSlDataByDept({ ...params })
    if (res.success) {
      const deptSpj = res.data.filter((item: any) => item.deptname == '省平均')
      const spj = deptSpj[0]
      if (!spj) {
        ElMessage.warning('未获取到省平均数据')
        return
      }
      const list = res.data.filter((item: any) => item.deptname != '省平均')
      dataList.value = list
      apiList.value = [...list]
      dataList.value.forEach((item) => {
        item.spjfjl = spj.fjl
        item.spjlxl = spj.lxl
        item.spjjsl = spj.jsl
      })
      apiList.value.splice(0, 0, ...deptSpj)
      bmOBarOptions.xAxis.data = dataList.value.map((item) => item.deptname)
      bmOBarOptions.series[0].data = dataList.value.map((item) => item.fjl)
      bmOBarOptions.series[1].data = dataList.value.map((item) => item.lxl)
      bmOBarOptions.series[2].data = dataList.value.map((item) => item.jsl)
      bmOBarOptions.series[3].data = dataList.value.map((item) => item.spjfjl)
      bmOBarOptions.series[4].data = dataList.value.map((item) => item.spjlxl)
      bmOBarOptions.series[5].data = dataList.value.map((item) => item.spjjsl)
      bmOBarOptions.xAxis.axisLabel.color = (value: any, index: any) => {
        const target = dataList.value[index]
        return isCurrentRoleRow(target) ? '#00706B' : '#000000'
      }
      isShowPage.value = true
      nextTick(() => {
        proTableRef.value?.clearSelection?.()
        apiList.value.forEach((row) => {
          if (isBgRow(row)) {
            proTableRef.value?.element?.toggleRowSelection?.(row)
          }
        })
      })
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const formatterData = (cellValue: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '' || cellValue === '0' || cellValue === 0) return '0'
  return formatNumValue(cellValue.toString(), 2)
}

const tableColumns = reactive<any>([
  { type: 'index', label: '序号', width: 50 },
  { prop: 'deptname', label: '归口部门' },
  { prop: 'mbz', label: '目标值', headerAlign: 'center', align: 'right', render: ({ row }: any) => formatterData(row.mbz) },
  { prop: 'dfj', label: '待分解', headerAlign: 'center', align: 'right', render: ({ row }: any) => formatterData(row.dfj) },
  { prop: 'lxz', label: '立项值', headerAlign: 'center', align: 'right', render: ({ row }: any) => formatterData(row.lxz) },
  { prop: 'wcz', label: '完成值', headerAlign: 'center', align: 'right', render: ({ row }: any) => formatterData(row.wcz) },
  {
    prop: 'fjl',
    label: '分解率（%）',
    headerRender: () =>
      h(
        ElTooltip,
        { effect: 'dark', placement: 'top', content: '分解率（%）= (目标值-待分解)/目标值*100' },
        {
          default: () => h('span', { style: 'display: inline-flex; align-items: center; gap: 2px' }, ['分解率（%）'])
        }
      )
  },
  {
    prop: 'lxl',
    label: '立项率（%）',
    headerRender: () =>
      h(
        ElTooltip,
        { effect: 'dark', placement: 'top', content: '立项率（%）= 立项值/目标值*100' },
        {
          default: () => h('span', { style: 'display: inline-flex; align-items: center; gap: 2px' }, ['立项率（%）'])
        }
      )
  },
  {
    prop: 'jsl',
    label: '完成率（%）',
    sortable: 'custom',
    headerRender: () =>
      h(
        ElTooltip,
        { effect: 'dark', placement: 'top', content: '完成率（%）= 完成值/目标值*100' },
        {
          default: () => h('span', { style: 'display: inline-flex; align-items: center; gap: 2px' }, ['完成率（%）'])
        }
      )
  }
])

// 完成率（%）自定义排序：省平均行不参与排序，恒保持在首行
const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => {
  if (prop !== 'jsl') return
  const spjRow = apiList.value.find((r) => r.deptname === '省平均')
  const rest = apiList.value.filter((r) => r.deptname !== '省平均')
  if (!order) {
    // 取消排序：恢复原始顺序
    apiList.value = spjRow ? [spjRow, ...dataList.value] : [...dataList.value]
    return
  }
  const dir = order === 'ascending' ? 1 : -1
  rest.sort((a, b) => (Number(a.jsl) - Number(b.jsl)) * dir)
  apiList.value = spjRow ? [spjRow, ...rest] : [...rest]
}

// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      await getDataList()
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  initParams()
})
</script>
<style lang="less" scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  box-sizing: border-box;
  gap: 10px;
  .container_top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .container_top_left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .container_top_right {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
}

.echarts_style {
  width: 100%;
  height: 600px;
  border: 1px solid #eee;
  border-radius: 10px;
}

// 公式提示图标：让用户一眼看出该表头可悬浮查看公式
:deep(.rate-formula-icon) {
  margin-left: 2px;
  color: var(--color-primary, #00706b);
  font-size: 14px;
  cursor: pointer;
  vertical-align: middle;
  transition: color 0.2s ease, transform 0.2s ease;
  &:hover {
    color: #005f5b;
    transform: scale(1.15);
  }
}
.container_top_right_year {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
}

.unit-wanyuan {
  background: var(--color-primary, #00706b);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  line-height: 20px;
}
</style>
