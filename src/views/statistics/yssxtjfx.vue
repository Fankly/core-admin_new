<template>
  <div v-show="pageInfo.isShowPage" class="container">
    <el-tabs v-model="tabsMsg.name" type="border-card" @tab-click="handleTabClick">
      <el-tab-pane :key="item.code" v-for="item in publicCodes.YSSXTJFS" :label="item.name" :name="item.code"> </el-tab-pane>
      <div class="main" v-if="pageInfo.isShowPage">
        <v-chart @click="clickBarHandle" :option="bar" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoresize"></v-chart>
      </div>
    </el-tabs>
    <div class="year">
      <div class="year-main">
        <span>金额：</span>
        <el-select class="je-select" v-model="initParam.je" placeholder="请选择">
          <template v-for="item in publicCodes.jeList" :key="item.yearCode">
            <el-option :label="item.yearName" :value="item.yearCode"></el-option>
          </template>
        </el-select>
        <span style="padding: 0 10px"></span>
        <span>年度：</span>
        <el-select v-model="initParam.nd" placeholder="请选择" @change="changeNdDataHandle">
          <template v-for="item in publicCodes.ndList" :key="item.yearCode">
            <el-option :label="item.yearName" :value="item.yearCode"></el-option>
          </template>
        </el-select>
      </div>

      <div class="help">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <YssxDetail ref="yssxDetailRef" :detailParams="detailParams"></YssxDetail>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/statistics/yssxtjfx'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import YssxDetail from '@/views/statistics/components/YssxDetail.vue'
import { getPublicData, getYearData } from '@/api/common'
import { onMounted, reactive, ref } from 'vue'
import { Data, getData } from '@/api/statistics/yssxtjfx'
import { EChartsOption } from 'echarts'
import { formatValue } from '@/utils/utils'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

interface SelectData {
  bmid: string
  value: number
}

interface PublicCode {
  name: string
  code: string
}
interface NdData {
  yearName: string
  yearCode: string
}

interface RowVo {
  bmId: string
  bmName: string
  je: number
}

const userDialogRef = ref()
const helpModalRef = ref()
const yssxDetailRef = ref()

const tabsMsg = reactive({
  name: '1'
})
const pageInfo = reactive({
  isShowPage: false
})

const publicCodes = reactive<{
  YSSXTJFS: PublicCode[]
  ndList: NdData[]
  jeList: NdData[]
}>({
  YSSXTJFS: [],
  ndList: [],
  jeList: [
    {
      yearCode: '1',
      yearName: '万元'
    }
  ]
})

const getPublicCodes = async () => {
  const ndDataList = await getYearData()
  publicCodes.ndList = ndDataList.data
  initParam.nd = new Date().getFullYear().toString()
  const res = await getPublicData('YSSXTJFS')
  if (res.success && res.data) {
    publicCodes.YSSXTJFS = res.data
  }
}

const initParam = reactive({
  nd: '',
  dwId: '',
  je: '1'
})

const detailParams = ref()

const theme = ref('')
const autoresize = ref(true)

const barLoadingOptions = reactive({
  text: 'Loading…',
  color: '#4ea397',
  maskColor: 'rgba(255, 255, 255, 0.4)'
})

const bar = reactive<EChartsOption>({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  xAxis: {
    type: 'category',
    data: [],
    axisLabel: {
      color: '#5b9bd5',
      interval: 0,
      rotate: 45
    }
  },
  grid: {
    left: '2%',
    right: '2%',
    bottom: '2%',
    containLabel: true
  },
  yAxis: {},
  series: []
})

const handleTabClick = () => {
  getBarData()
}

const changeNdDataHandle = () => {
  getBarData()
}

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  initParam.dwId = userDialogRef.value.userMsg.org_id
  if (isQuery) {
    pageInfo.isShowPage = true
    getBarData()
  }
}

// 获取预算事项统计分析柱状图
const getBarData = async () => {
  let tjfs = tabsMsg.name.split('-').concat()
  let params: Data = {
    ...initParam,
    tjfs
  }
  let res = await getData(params)
  if (res.success && res.data) {
    let jeData = res.data.bmLists.map((item: RowVo) => item.je)
    const maxValue = Math.max(...jeData)
    const adjustedMax = maxValue + maxValue / 2
    let barData = res.data.bmLists.map((item: RowVo) => ({
      value: item.je,
      bmid: item.bmId
    }))
    let barName = res.data.bmLists.map((item: RowVo) => item.bmName)

    bar.graphic = [
      {
        type: 'text',
        left: 'center',
        top: 20,
        style: {
          text: `合计数：${formatterData(res.data.total)}万元`,
          fontSize: 14,
          fill: '#5b9bd5'
        }
      }
    ]
    bar.xAxis = {
      type: 'category',
      data: barName,
      nameTextStyle: {
        color: '#5b9bd5'
      }
    }
    bar.yAxis = { type: 'value', name: '万元', max: adjustedMax }
    bar.series = {
      data: barData,
      type: 'bar',
      showBackground: true,
      barWidth: 40,
      itemStyle: {
        color: '#5b9bd5'
      },
      backgroundStyle: {
        color: 'rgba(180,180,180,0.2)'
      },
      label: {
        show: true,
        position: 'top',
        formatter: function (a: any) {
          return formatterData(a.value)
        },
        fontSize: 12,
        color: '#5b9bd5'
      },
      barGap: 1,
      name: '金额(万元)'
    }
  }
}

const clickBarHandle = (params: any) => {
  let tjfs = tabsMsg.name.split('-').concat()
  let data: SelectData = params.data
  detailParams.value = {
    tjfs,
    ...initParam,
    ...data
  }
  yssxDetailRef.value.isShowModal = true
}

const formatterData = (cellValue: string) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue.toString())
}

const initParams = () => {
  getPublicCodes()
  userDialogRef.value.getUser()
}

onMounted(() => {
  initParams()
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  position: relative;
  .year {
    width: 320px;
    position: absolute;
    top: 0;
    right: 10px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .el-select {
      width: 110px;
      height: 100%;
      :deep(.el-input__inner) {
        height: 40px;
      }
      :deep(.el-select__caret) {
        height: 40px;
      }
    }

    .je-select {
      width: 80px;
    }
  }
  .el-tabs {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    .main {
      height: 100%;
    }
    :deep(.el-tabs__content) {
      min-width: 0;
      min-height: 0;
      flex: 1;
      height: 100%;
      padding: 10px;
    }
  }
}
</style>
