<template>
  <div class="container_echarts" v-loading="loading" v-show="!formData.isCity">
    <div class="container_bar">
      <div class="echarts_title">
        <template v-for="(item, index) in dwTitle" :key="index">
          <span>{{ item.name }}：</span>
          <span class="echarts_title_click" :style="{ color: item.color }" @click="handleNumber(item, index, 'DW')">{{ item.total }}</span>
          <span>({{ item.type }})；</span>
        </template>
      </div>
      <v-chart
        @click="handleClick"
        class="echarts_style"
        style="height: 90%"
        :option="dwOBarOptions"
        :autoresize="true"
        :update-options="{ notMerge: true }"
        :loadingOptions="barLoadingOptions"
        @legendselectchanged="handleLegnedChange"
      />
    </div>
    <div class="container_bar" v-if="isBMCW">
      <div class="echarts_title">
        <template v-for="(item, index) in zgkbmTitle" :key="index">
          <span>{{ item.name }}：</span>
          <span class="echarts_title_click" :style="{ color: item.color }" @click="handleNumber(item, index, 'GKBM')">{{ item.total }}</span>
          <span>({{ item.type }})；</span>
        </template>
      </div>
      <v-chart
        @click="handleBar"
        class="echarts_style"
        style="height: 90%"
        :option="bmOBarOptions"
        :autoresize="true"
        :update-options="{ notMerge: true }"
        :loadingOptions="barLoadingOptions"
      />
    </div>
    <div class="container_bar" v-if="!isBMCW">
      <div class="echarts_title" v-show="txOBarOptions.xAxis.data.length != 0">
        <template v-for="(item, index) in zdtxTitle" :key="index">
          <span>{{ item.name }}：</span>
          <span class="echarts_title_click" :style="{ color: item.color }" @click="handleNumber(item, index, 'ZDTX')">{{ item.total }}</span>
          <span>({{ item.type }})；</span>
        </template>
      </div>
      <v-chart
        @click="handleZdtx"
        class="echarts_style"
        v-show="txOBarOptions.xAxis.data.length != 0"
        style="height: 90%"
        :option="txOBarOptions"
        :autoresize="true"
        :update-options="{ notMerge: true }"
        :loadingOptions="barLoadingOptions"
      />
      <v-chart class="echarts_style" v-show="txOBarOptions.xAxis.data.length == 0" style="height: 90%" :option="nullOptions" :autoresize="true" />
    </div>
  </div>
  <sxTable ref="modalTbaleRef" />
</template>
<script lang="ts">
export default {
  name: '/lkyptzl/components/echarts'
}
</script>
<script setup lang="ts">
import { reactive, ref, defineExpose, watch, nextTick, defineEmits } from 'vue'
import VChart from 'vue-echarts'
import { getStatDataByDw, getStatDataByZgkbm, getStatDataByZdtx } from '@/api/lkyptzl/index'
import sxTable from '@/views/service/lkyptzl/components/sxTable.vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { encrypt } from '@/utils/crypto'
import { ElMessage } from 'element-plus'

const route = useRoute()
const formData = ref<any>({})
const isBMCW = ref<boolean>(false)
const loading = ref<boolean>(false)
const modalTbaleRef = ref()
const flowStatusLists = ref<any[]>([]) //按单位统计项目状态
const dwIdList = ref<any[]>([]) //单位ID
const zgkbmIdList = ref<any[]>([]) //按省归口部门统计项目状态
const zdtxIdList = ref<any[]>([]) //按重点投向统计项目状态
const emits = defineEmits(['changeNd'])
const showBar = ref<any>('1')
const appNo = ref<any>('XQK')
const echartsName = ref<string>('')
const dwTitle = ref<any[]>([])
const zgkbmTitle = ref<any[]>([])
const zdtxTitle = ref<any[]>([])
const barLoadingOptions = ref<any>({
  text: 'Loading…',
  color: '#4ea397',
  maskColor: 'rgba(255, 255, 255, 0.4)'
})
const formatterFun = (params: any) => {
  var str = ''
  var paramsLen = params.length
  var len = 4
  var rowNumber = Math.ceil(paramsLen / len)
  if (paramsLen > len) {
    for (var i = 0; i < rowNumber; i++) {
      var temp = ''
      var start = i * len
      var end = start + len
      temp = i == rowNumber - 1 ? params.substring(start, paramsLen) : `${params.substring(start, end)}\n`
      str += temp
    }
  } else {
    str = params
  }
  return str
}

const nullOptions = reactive<any>({
  title: {
    text: '暂无数据',
    x: 'center',
    y: 'center',
    textStyle: {
      color: '#9d9d9d',
      fontWeight: 'bold',
      fontFamily: 'Microsoft YaHei',
      fontSize: '24px'
    }
  }
})

const txOBarOptions = reactive<any>({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '1%',
    bottom: '2%',
    top: '15%',
    containLabel: true
  },
  legend: {
    icon: 'rect',
    x: 'center',
    y: 10,
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
      rotate: 15
      // formatter:formatterFun
    }
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
    }
  },
  series: []
})

const bmOBarOptions = reactive<any>({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '1%',
    bottom: '2%',
    top: '15%',
    containLabel: true
  },
  legend: {
    icon: 'rect',
    x: 'center',
    y: 10,
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
      rotate: 15
      // formatter:formatterFun
    }
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
    }
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
    },
    {
      name: '',
      type: 'bar',
      barWidth: 10,
      label: {
        show: true,
        position: 'top'
      },
      itemStyle: {
        color: '#3ba9fd',
        borderRadius: [2, 2, 0, 0]
      },
      data: []
    },
    {
      name: '',
      type: 'bar',
      barWidth: 10,
      label: {
        show: true,
        position: 'top'
      },
      itemStyle: {
        color: '#f4a05d',
        borderRadius: [2, 2, 0, 0]
      },
      data: []
    }
  ]
})
const dwOBarOptions = reactive<any>({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '1%',
    bottom: '3%',
    top: '15%',
    containLabel: true
  },
  legend: {
    icon: 'rect',
    x: 'center',
    y: 10,
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
  series: []
})
const handleLegnedChange = (e: any) => {
  console.log(e, 'ee')
}

const getDataChar = async () => {
  try {
    loading.value = true
    const colorList: any = ['#01b998', '#3ba9fd', '#f4a05d']
    formData.value.statType = formData.value.statType ? formData.value.statType : 'xmsl'
    echartsName.value = formData.value.statType == 'amount' ? '金额：万元' : '数量：个'
    dwOBarOptions.yAxis.name = txOBarOptions.yAxis.name = bmOBarOptions.yAxis.name = echartsName.value
    formData.value.appNo = appNo.value
    const res: any = await getStatDataByDw(formData.value)
    if (res.success && res.data) {
      dwOBarOptions.series.length = 0
      dwTitle.value.length = 0
      res.data.legendData.forEach((item: any, index: any) => {
        let totalDw: any = 0
        totalDw = res.data.seriesDataList[index].reduce((acc: number, curr: any) => acc + Number(curr), 0)
        dwTitle.value.push({
          name: item,
          type: echartsName.value,
          color: colorList[index],
          total: formData.value.statType == 'amount' ? Number(totalDw).toFixed(2) : totalDw,
          flowStatusLists: res.data.flowStatusLists[index]
        })
        dwOBarOptions.series.push({
          name: item,
          type: 'bar',
          barWidth: 10,
          label: {
            show: formData.value.statType == 'xmsl',
            position: 'top'
          },
          itemStyle: {
            color: colorList[index],
            borderRadius: [2, 2, 0, 0]
          },
          data: res.data.seriesDataList[index].map((root: any) => (root == 0 ? '' : root))
        })
      })
      dwOBarOptions.xAxis.data = res.data.xAxisData
      flowStatusLists.value = res.data.flowStatusLists
      dwIdList.value = res.data.dwIdList
    }

    if (isBMCW.value) {
      let root: any = await getStatDataByZgkbm(formData.value)
      if (root.success && root.data) {
        bmOBarOptions.series.length = 0
        zgkbmTitle.value.length = 0
        root.data.legendData.forEach((item: any, index: any) => {
          let totalBm: any = 0
          totalBm = root.data.seriesDataList[index].reduce((acc: number, curr: any) => acc + Number(curr), 0)
          bmOBarOptions.series.push({
            name: item,
            type: 'bar',
            barWidth: 10,
            label: {
              show: formData.value.statType == 'xmsl',
              position: 'top'
            },
            itemStyle: {
              color: colorList[index],
              borderRadius: [2, 2, 0, 0]
            },
            data: root.data.seriesDataList[index].map((rootBm: any) => (rootBm == 0 ? '' : rootBm))
          })
          zgkbmTitle.value.push({
            name: item,
            type: echartsName.value,
            color: colorList[index],
            total: formData.value.statType == 'amount' ? Number(totalBm).toFixed(2) : totalBm,
            flowStatusLists: root.data.flowStatusLists[index]
          })
        })
        bmOBarOptions.xAxis.data = root.data.xAxisData
        zgkbmIdList.value = root.data.zgkbmIdList
      }
    } else {
      let item: any = await getStatDataByZdtx(formData.value)
      if (item.success && item.data) {
        txOBarOptions.series.length = 0
        zdtxTitle.value.length = 0
        item.data.legendData.forEach((txTime: any, index: any) => {
          let totalTx: any = 0
          totalTx = item.data.seriesDataList[index].reduce((acc: number, curr: any) => acc + Number(curr), 0)
          zdtxTitle.value.push({
            name: txTime,
            type: echartsName.value,
            color: colorList[index],
            total: formData.value.statType == 'amount' ? Number(totalTx).toFixed(2) : totalTx,
            flowStatusLists: item.data.flowStatusLists[index]
          })
          txOBarOptions.series.push({
            name: txTime,
            type: 'bar',
            barWidth: 10,
            label: {
              show: formData.value.statType == 'xmsl',
              position: 'top'
            },
            itemStyle: {
              color: colorList[index],
              borderRadius: [2, 2, 0, 0]
            },
            data: item.data.seriesDataList[index].map((rootBm: any) => (rootBm == 0 ? '' : rootBm))
          })
        })
        txOBarOptions.xAxis.data = item.data.xAxisData
        zdtxIdList.value = item.data.zdtxIdList
      }
    }
    loading.value = false
  } catch (error) {
    loading.value = false
    const e = error as Error
    ElMessage.error(e.message)
  }
}
const handleClick = (val: any) => {
  if (val.componentType == 'series') {
    modalTbaleRef.value.isShowTable = true
    modalTbaleRef.value.loading = true
    nextTick(() => {
      modalTbaleRef.value.tableTitle = `${val.seriesName}-${val.name}-事项明细`
      modalTbaleRef.value.formData = { ...formData.value }
      modalTbaleRef.value.formData.dwId = dwIdList.value[val.dataIndex]
      modalTbaleRef.value.formData.flowStatusList = flowStatusLists.value[val.seriesIndex]
      modalTbaleRef.value?.proTableRef.getTableList()
    })
  } else if (val.componentType == 'xAxis') {
    var str = encrypt(
      JSON.stringify({
        dwId: dwIdList.value[val.dataIndex],
        isBMCW: isBMCW.value,
        bmId: formData.value.bmId,
        bmxz: formData.value.bmxz,
        id: formData.value.id
      })
    )
    router.push({
      name: '/service/lkyptzl/drillDown',
      query: {
        drillDownParams: str
      }
    })
  }
}
const handleBar = (val: any) => {
  modalTbaleRef.value.isShowTable = true
  modalTbaleRef.value.loading = true
  nextTick(() => {
    modalTbaleRef.value.tableTitle = `${val.seriesName}-${val.name}-事项明细`
    modalTbaleRef.value.formData = { ...formData.value }
    modalTbaleRef.value.formData.zgkbmId = zgkbmIdList.value[val.dataIndex]
    modalTbaleRef.value.formData.flowStatusList = flowStatusLists.value[val.seriesIndex]
    modalTbaleRef.value?.proTableRef.getTableList()
  })
}
const handleZdtx = (val: any) => {
  modalTbaleRef.value.isShowTable = true
  modalTbaleRef.value.loading = true
  nextTick(() => {
    modalTbaleRef.value.tableTitle = `${val.seriesName}-${val.name}-事项明细`
    modalTbaleRef.value.formData = { ...formData.value }
    modalTbaleRef.value.formData.zdtxId = zdtxIdList.value[val.dataIndex]
    modalTbaleRef.value.formData.flowStatusList = flowStatusLists.value[val.seriesIndex]
    modalTbaleRef.value?.proTableRef.getTableList()
  })
}

const handleNumber = (val: any, index: any, type: any) => {
  modalTbaleRef.value.isShowTable = true
  modalTbaleRef.value.loading = true
  nextTick(() => {
    modalTbaleRef.value.tableTitle = `${val.name}-事项明细`
    modalTbaleRef.value.formData = { ...formData.value }
    if (type == 'DW') {
      modalTbaleRef.value.formData.dwIdList = dwIdList.value
    } else if (type == 'GKBM') {
      modalTbaleRef.value.formData.zgkbmIdList = zgkbmIdList.value
    } else {
      modalTbaleRef.value.formData.zdtxIdList = zdtxIdList.value
    }
    modalTbaleRef.value.formData.flowStatusList = val.flowStatusLists
    modalTbaleRef.value?.proTableRef.getTableList()
  })
}

defineExpose({
  formData,
  getDataChar,
  isBMCW,
  appNo
})
</script>
<style lang="less" scoped>
.container_echarts {
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .container_bar {
    flex: 1;
    min-height: 0;
    min-width: 0;
  }
}

.back_icon {
  font-size: 20px;
  font-weight: bold;
  position: absolute;
  left: 10px;
  top: 10px;
  z-index: 999;
  cursor: pointer;
}

.echarts_style {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 10px;
}

.echarts_title {
  width: 100%;
  height: 15px;
  margin: 10px 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.echarts_title_click {
  cursor: pointer;
  text-decoration: underline;
  margin: 0 5px;
}
</style>
