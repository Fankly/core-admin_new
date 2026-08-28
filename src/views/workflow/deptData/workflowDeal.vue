<!-- 指标查看页面 -->
<template>
  <div class="container" v-show="isShowPage" v-loading="loading">
    <div class="modal_cont">
      <el-button :disabled="loading" type="primary" size="mini" plain @click="notifyHandle">知道了</el-button>
      <el-button :disabled="loading" type="primary" size="mini" plain @click="closeDialogHandle">关闭页面</el-button>
      <div class="modal_title">
        <div class="highlight" style="margin-left: auto">{{ `截至年月：${searchForm.endDate}` }}</div>
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
      :row-style="rowStyle"
      ref="proTableRef"
      :pagination="false"
      :data="apiList"
      :search-col="4"
      :toolButton="false"
      :columns="tableColumns"
    />
  </div>
  <detaildeptData ref="detaildeptDataRef" />
</template>
<script lang="ts">
export default {
  name: '/workflow/deptData/workflowDeal'
}
</script>

<script setup lang="ts">
import { reactive, ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notify } from '@/api/workflow'
import VChart from 'vue-echarts'
import ProTable from '@/components/ProTable/index.vue'
import detaildeptData from '@/views/service/deptData/components/detailDeptData.vue'
import { getProSlDataByDept } from '@/api/service/deptData/index'

const workItemIdString = ref<string>('')
const proTableRef = ref()
const detaildeptDataRef = ref()
const isShowPage = ref<boolean>(false)
const loading = ref<boolean>(false)
const dataList = ref<any[]>([])
const apiList = ref<any[]>([])
const searchForm = reactive<any>({
  endDate: '',
  deptId: '',
  currentUserDwId: ''
})
const barLoadingOptions = ref<any>({
  text: 'Loading…',
  color: '#4ea397',
  maskColor: 'rgba(255, 255, 255, 0.4)'
})

onMounted(() => {
  const workItemId = getQueryString('workItemId')
  const deptId = getQueryString('deptId')
  const endDate = getQueryString('endDate')
  const currentUserDwId = getQueryString('currentUserDwId')
  workItemIdString.value = workItemId
  searchForm.endDate = endDate
  searchForm.deptId = deptId
  searchForm.currentUserDwId = currentUserDwId

  getDataList()
})

// 柱状图
const bmOBarOptions = reactive<any>({
  title: {
    text: '专业归口预算执行查询',
    x: 'center',
    y: '4%',
    textStyle: {
      color: '#000',
      fontWeight: 'bold',
      fontFamily: 'Microsoft YaHei',
      fontSize: '16px'
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '1%',
    bottom: '10%',
    top: '15%',
    containLabel: true
  },
  legend: {
    icon: 'rect',
    x: 'center',
    y: 'bottom',
    textStyle: {
      color: '#6a6866'
    },
    itemWidth: 12,
    itemHeight: 10
  },
  xAxis: {
    type: 'category',
    data: [],
    axisLine: {
      show: false,
      lineStyle: {
        color: '#6a6866'
      }
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      textStyle: {
        fontFamily: 'Microsoft YaHei',
        padding: [20, 0, 0, 105]
      },
      interval: 0,
      rotate: 15,
      clickable: true,
      rich: {
        a: {
          textDecoration: 'underline',
          cursor: 'pointer'
        }
      },
      color: function (value: any, index: any) {
        const item = dataList.value[index]
        return item && searchForm.deptId == item.deptcode ? '#00706B' : '#000000'
      }
    },
    silent: false,
    triggerEvent: true
  },
  yAxis: {
    name: '百分比(%)',
    nameTextStyle: {
      color: '#9eaabb',
      fontSize: 12
    },
    type: 'value',
    axisLine: {
      show: false,
      lineStyle: {
        color: '#939aa3'
      }
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#efefef'
      }
    }
  },
  series: [
    {
      name: '分解率',
      type: 'bar',
      barWidth: 10,
      itemStyle: {
        color: '#3ba9fd',
        borderRadius: [2, 2, 0, 0]
      },
      data: []
    },
    {
      name: '立项率',
      type: 'bar',
      barWidth: 10,
      itemStyle: {
        color: '#01b998',
        borderRadius: [2, 2, 0, 0]
      },
      data: []
    },
    {
      name: '完成率',
      type: 'bar',
      barWidth: 10,
      itemStyle: {
        color: '#f4a05d',
        borderRadius: [2, 2, 0, 0]
      },
      data: []
    },
    {
      name: '省平均分解率',
      type: 'line',
      smooth: true,
      showAllSymbol: true,
      symbol: 'circle',
      symbolSize: 10,
      itemStyle: {
        color: '#3ba9fd'
      },
      data: []
    },
    {
      name: '省平均立项率',
      type: 'line',
      smooth: true,
      showAllSymbol: true,
      symbol: 'circle',
      symbolSize: 10,
      itemStyle: {
        color: '#01b998'
      },
      data: []
    },
    {
      name: '省平均完成率',
      type: 'line',
      smooth: true,
      showAllSymbol: true,
      symbol: 'circle',
      symbolSize: 10,
      itemStyle: {
        color: '#f4a05d'
      },
      data: []
    }
  ]
})

// 点击柱状图
const handleClick = (val: any) => {
  const item = dataList.value[val.dataIndex]
  if (val.componentType == 'xAxis' && item && searchForm.deptId == item.deptcode) {
    let params = {
      title: val.value,
      endDate: searchForm.endDate,
      currentUserDwId: searchForm.currentUserDwId,
      deptcode: item.deptcode,
      deptId: item.deptcode
    }
    detaildeptDataRef.value?.acceptParams(params)
  }
}

// 行样式
const rowStyle = ({ row }: any) => {
  if (searchForm.deptId == row.deptcode) {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element?.toggleRowSelection(row)
    return {
      cursor: 'pointer'
    }
  }
}

// 查看指标详情
const detailView = async (row: any, column: any) => {
  if (searchForm.deptId == row.deptcode) {
    let params = {
      title: row.deptname,
      endDate: searchForm.endDate,
      currentUserDwId: searchForm.currentUserDwId,
      deptcode: row.deptcode,
      deptId: row.deptcode
    }
    nextTick(() => {
      detaildeptDataRef.value?.acceptParams(params)
    })
  }
}

const getDataList = async () => {
  let params = {
    endDate: searchForm.endDate,
    currentUserDwId: searchForm.currentUserDwId
  }
  loading.value = true
  try {
    let res = await getProSlDataByDept({ ...params })
    if (res && res.success && Array.isArray(res.data)) {
      const deptSpj = res.data.filter((item: any) => item.deptname == '省平均')
      const spjItem = deptSpj[0]
      dataList.value = res.data.filter((item: any) => item.deptname != '省平均')
      apiList.value = res.data.filter((item: any) => item.deptname != '省平均')
      dataList.value.forEach((item) => {
        item.spjfjl = spjItem?.fjl
        item.spjlxl = spjItem?.lxl
        item.spjjsl = spjItem?.jsl
      })
      if (spjItem) {
        apiList.value.splice(0, 0, ...deptSpj)
      }
      bmOBarOptions.xAxis.data = dataList.value.map((item) => item.deptname)
      bmOBarOptions.series[0].data = dataList.value.map((item) => item.fjl)
      bmOBarOptions.series[1].data = dataList.value.map((item) => item.lxl)
      bmOBarOptions.series[2].data = dataList.value.map((item) => item.jsl)
      bmOBarOptions.series[3].data = dataList.value.map((item) => item.spjfjl)
      bmOBarOptions.series[4].data = dataList.value.map((item) => item.spjlxl)
      bmOBarOptions.series[5].data = dataList.value.map((item) => item.spjjsl)
      isShowPage.value = true
    } else {
      ElMessage.error(res?.msg || '数据加载失败')
    }
  } catch (e) {
    ElMessage.error('数据加载异常')
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

// 获取"workItemId"
const getQueryString = (name: string): string => {
  const allParams = window.location.href.split('?').reduce((acc, part) => {
    const params = new URLSearchParams(part.split('#')[0])
    params.forEach((value, k) => acc.set(k, value))
    return acc
  }, new Map())
  if (window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1]
    new URLSearchParams(hashQuery).forEach((value, k) => allParams.set(k, value))
  }
  return allParams.get(name) ?? ''
}

// 知道了-按钮
const notifyHandle = async () => {
  ElMessageBox.confirm('确定结束待办？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      let res = await notify(workItemIdString.value)
      if (res.success) {
        closeDialogHandle()
        loading.value = false
      } else {
        ElMessage.error(res.msg)
        loading.value = false
      }
    })
    .catch((error: any) => {
      console.log(error)
    })
}

// 关闭工作流
const closeDialogHandle = () => {
  try {
    window.parent.Appframe.closePopWindow(window)
  } catch (e) {
    window.parent.postMessage('close', '*')
  }
}
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  box-sizing: border-box;
  background: #fff;
  gap: 10px;
  .modal_cont {
    display: flex;
    margin-bottom: 10px;
    .modal_title {
      display: flex;
      margin-left: auto;
      gap: 10px;
      .highlight {
        display: inline-flex;
        align-items: center;
        font-size: 14px;
        padding: 4px 12px;
        background-color: var(--el-fill-color-light, #f5f7fa);
        border: 1px solid var(--el-border-color-light, #dcdfe6);
        border-radius: 4px;
        white-space: nowrap;
        transition: background-color 0.2s;
        max-width: 300px;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-wrap: break-word;
        word-break: break-all;
        -webkit-line-clamp: 1;
        text-overflow: ellipsis;
      }
    }
  }
}

.echarts_style {
  width: 100%;
  height: 600px;
  border: 1px solid #eee;
  border-radius: 10px;
}
</style>
