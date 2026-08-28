<!-- 部门指标看板 -->
<template>
  <div class="container" v-if="isShowPage" v-loading="loading">
    <div class="container_top">
      <el-button v-permission="'SENDTODO'" size="mini" type="primary" plain @click="sendTodo">推送待办</el-button>
      <div></div>
      <div class="date">
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
  <!-- 帮助 -->
  <HelpModal ref="helpModalRef" />
</template>
<script setup lang="ts" name="/service/deptData/index">
import { reactive, ref, computed, onMounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import userDialog from '@/components/select/userDialog.vue'
import VChart from 'vue-echarts'
import ProTable from '@/components/ProTable/index.vue'
import detaildeptData from '@/views/service/deptData/components/detailDeptData.vue'
import todoModal from '@/views/service/deptData/components/todoModal.vue'
import { getProSlDataByDept } from '@/api/service/deptData/index'
import { echartOption } from '@/views/service/deptData/hooks/index'
import { helpModalMeun } from '@/views/service/jointReview/hooks/help'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

const userDialogRef = ref() //用户角色
const detaildeptDataRef = ref()
const proTableRef = ref()
const todoModalRef = ref()
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
  if (isCurrentRoleRow(row)) {
    return {
      cursor: 'pointer'
    }
  }
}
//
// 查看指标详情
const detailView = async (row: any, column: any) => {
  if (isCurrentRoleRow(row)) {
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

const tableColumns = reactive<any>([
  //   { type: 'selection', width: 50 },
  { type: 'index', label: '序号', width: 50 },
  { prop: 'deptname', label: '归口部门' },
  { prop: 'fjl', label: '分解率（%）' },
  { prop: 'lxl', label: '立项率（%）' },
  { prop: 'jsl', label: '完成率（%）' }
])

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
  }
}

.echarts_style {
  width: 100%;
  height: 600px;
  border: 1px solid #eee;
  border-radius: 10px;
}
</style>
