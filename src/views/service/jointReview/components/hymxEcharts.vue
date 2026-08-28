<!-- 会议明细列表 -->
<template>
  <div>
    <vxe-modal
      ref="modalRef"
      resize
      show-zoom
      v-model="isShowTable"
      :destroy-on-close="true"
      :title="tableTitle"
      :width="1200"
      :height="700"
      :close-on-press-escape="false"
      @close="closeSxModal"
      :loading="loading"
    >
      <div class="modal_content">
        <div class="modal_top">
          <div v-for="(item, index) in typeCount" :key="index">
            <div
              :class="countType.code == item.code ? 'modal_top_content_activer' : ''"
              class="modal_top_content"
              @click="clickCount(item)"
            >
              <div>{{ item.name }}</div>
              <div>{{ item.count }}个</div>
            </div>
          </div>
        </div>
        <div class="container-charts">
          <div class="container-charts-box">
            <div class="container-charts-box-content" style="margin-left: 10px">
              <el-select style="width: 180px" v-model="searchData.dw" placeholder="请选择展示类型">
                <el-option
                  v-for="item in typeList"
                  :key="item.name"
                  :label="item.name"
                  :value="item.name"
                >
                </el-option>
              </el-select>
              <div class="container-charts-box-title">
                {{ countType.name }}
                <span @click="handleActive">{{ countType.count }}</span>
                个
              </div>
              <div class="container-charts-box-content-main">
                <v-chart @click="handleClick" :option="dwOBarOptions" :autoresize="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </vxe-modal>
  </div>
  <sxTable
    ref="modalTbaleRef"
    :getTableApi="pageYssxInfoByMeeting"
    :exportApi="exportYssxInfoByMeeting"
    :xmGetTableApi="pageXmInfoByMeetingYssx"
    :xmExportApi="exportXmInfoByMeetingYssx"
    :xm-lsxt="false"
    :api-params-type="'LHHS'"
  />
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, reactive, defineEmits, nextTick, defineExpose } from 'vue'
import {
  getOverviewDataByMeeting,
  getStatDataByMeetingDw,
  pageYssxInfoByMeeting,
  exportYssxInfoByMeeting,
  pageXmInfoByMeetingYssx,
  exportXmInfoByMeetingYssx
} from '@/api/service/expertinformation'
import sxTable from '@/components/yssxTable/sxTable.vue'

// 子组件
const emit = defineEmits(['pageType'])
const typeList = [{ name: '按单位展示', code: 'dw' }]
const typeCount = ref<any[]>([
  {
    name: '会审中',
    code: 'hsz',
    count: 0
  },
  {
    name: '会审通过',
    code: 'hstg',
    count: 0
  },
  {
    name: '会审驳回',
    code: 'hsbh',
    count: 0
  },
  {
    name: '待批复',
    code: 'dpf',
    count: 0
  },
  {
    name: '合规审核',
    code: 'hgsh',
    count: 0
  }
])
const formData = ref<any>({})
const modalTbaleRef = ref()
const modalRef = ref()
const tableTitle = ref<any>('')
const isShowTable = ref<boolean>(false)
const apiType = ref<any>('1')
const loading = ref<boolean>(false)
const countType = ref<any>({})
const dwIdList = ref<any[]>([])
const searchData = reactive<any>({
  dw: '按单位展示'
})

const closeSxModal = () => {
  isShowTable.value = false
  apiType.value = '1'
}

const getMeetingData = async () => {
  let res = await getOverviewDataByMeeting({ ...formData.value })
  if (res.success && res.data) {
    typeCount.value.forEach((item: any) => {
      for (const key in res.data) {
        if (item.code == key) {
          item.count = res.data[key]
        }
      }
    })
    countType.value = typeCount.value[0]
    loading.value = false
    echartsData()
  }
}

const echartsData = async () => {
  let res = await getStatDataByMeetingDw({
    ...formData.value,
    indicatorCode: countType.value.code
  })
  if (res.success) {
    dwOBarOptions.yAxis.name = '数量：个'
    dwOBarOptions.xAxis.data = res.data.xAxisData
    dwOBarOptions.series.forEach((item: any, index: any) => {
      item.data = res.data.seriesDataList[index].map((root: any) => (root == 0 ? '' : root))
    })
    dwIdList.value = res.data.dwIdList
    loading.value = false
  }
}

// 点击数字
const clickCount = (val: any) => {
  countType.value = val
  loading.value = true
  echartsData()
}

// 点击柱状图
const handleClick = (val: any) => {
  if (val.componentType == 'series') {
    modalTbaleRef.value.isShowTable = true
    modalTbaleRef.value.loading = true
    nextTick(() => {
      modalTbaleRef.value.tableTitle = `${countType.value.name}-${val.name}-事项明细`
      modalTbaleRef.value.formData = {
        ...formData.value,
        dwId: dwIdList.value[val.dataIndex],
        indicatorCode: countType.value.code
      }
      modalTbaleRef.value?.proTableRef.getTableList()
    })
  }
}
// 显示事项
const handleActive = () => {
  modalTbaleRef.value.isShowTable = true
  modalTbaleRef.value.loading = true
  nextTick(() => {
    const parmas = {
      ...formData.value,
      indicatorCode: countType.value.code
    }    
    modalTbaleRef.value.tableTitle = `${countType.value.name}-事项明细`
    modalTbaleRef.value.formData = { ...parmas }    
    modalTbaleRef.value?.proTableRef.getTableList()
  })
}

const dwOBarOptions = reactive<any>({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '4%',
    right: '4%',
    bottom: '4%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: [],
    axisLine: {
      show: false,
      lineStyle: {
        color: '#6a6866',
        fontSize: '50'
      }
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      textStyle: {
        fontFamily: 'Microsoft YaHei'
        // padding: [20, 0, 0, 105]
      },
      interval: 0,
      clickable: true,
      rich: {
        a: {
          color: 'blue',
          textDecoration: 'underline',
          cursor: 'pointer'
        }
      }
    },
    silent: false,
    triggerEvent: true
  },
  yAxis: {
    name: '数量：个',
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
    },
    triggerEvent: true
  },
  series: [
    {
      name: '',
      type: 'bar',
      barWidth: 10,
      label: {
        show: true,
        position: 'top'
      },
      itemStyle: {
        color: '#01b998',
        borderRadius: [2, 2, 0, 0]
      },
      data: []
    }
  ]
})

defineExpose({
  formData,
  tableTitle,
  isShowTable,
  apiType,
  loading,
  getMeetingData
})
</script>
<style scoped lang="less">
.modal_content {
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  .modal_top {
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: space-between;
    .modal_top_content {
      width: 200px;
      height: 50px;
      line-height: 50px;
      border: 1px solid var(--color-primary, #00857c);
      color: var(--color-primary, #00857c);
      display: flex;
      box-sizing: border-box;
      border-radius: 8px;
      cursor: pointer;
      > div:first-child {
        width: 120px;
        height: 50px;
        line-height: 50px;
        text-align: center;
        box-sizing: border-box;
        font-weight: bold;
      }
      > div:last-child {
      }
    }
    .modal_top_content:hover {
      background: var(--color-primary, #00857c);
      color: #fff;
    }
    .modal_top_content_activer {
      background: var(--color-primary, #00857c);
      color: #fff;
    }
  }
  .container-charts {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .container-charts-box {
      width: 100%;
      height: 100%;

      .container-charts-box-content {
        border-radius: 10px;
        border: 1px solid #eeeeee;
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding-top: 10px;
        box-sizing: border-box;
        .container-charts-box-title {
          font-weight: bold;
          letter-spacing: 2px;
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translate(-50%, -50%);
          > span {
            cursor: pointer;
            text-decoration: underline;
            color: var(--color-primary, #00857c);
          }
        }

        .container-charts-box-content-main {
          flex: 1;
          min-height: 0;
          min-width: 0;
        }
      }
    }
  }
}
</style>
