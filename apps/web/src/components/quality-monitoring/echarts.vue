<template>
  <div class="zlcbylxBox">
    <div class="Page">
      <el-tabs v-model="activeName">
        <el-tab-pane label="1" name="first"></el-tab-pane>
        <el-tab-pane label="2" name="second"></el-tab-pane>
      </el-tabs>
    </div>
    <div class="valueBox">
      <figure>
        <v-chart :option="barOne" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
      </figure>
      <figure>
        <v-chart :option="barTwo" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
      </figure>
    </div>
  </div>
</template>

<script setup lang="ts">
import './echarts.module'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart, MapChart, RadarChart, ScatterChart, EffectScatterChart, LinesChart } from 'echarts/charts'
import {
  GridComponent,
  PolarComponent,
  GeoComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
  DatasetComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from '@/components/charts/VChart'
import { ref, provide } from 'vue'
const activeName = ref('first')

const props = defineProps({
  dataOne: Array,
  dataTwo: Array
})
const barOne = ref({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: '#999'
      }
    }
  },
  legend: {
    data: ['项目金额', '项目数量']
  },
  xAxis: [
    {
      type: 'category',
      data: props.dataOne,
      axisPointer: {
        type: 'shadow'
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      name: '万元',
      min: 0,
      max: 150,
      interval: 30,
      axisLabel: {
        formatter: '{value}.00'
      }
    },
    {
      type: 'value',
      min: 30,
      max: 70,
      interval: 10,
      axisLabel: {
        formatter: '{value}.00%'
      }
    }
  ],
  series: [
    {
      name: '项目金额',
      type: 'bar',
      tooltip: {
        valueFormatter: function (value) {
          return value
        }
      },
      data: [70, 56, 86, 72, 65, 99, 92, 64]
    },
    {
      name: '项目数量',
      type: 'line',
      yAxisIndex: 1,
      tooltip: {
        valueFormatter: function (value) {
          return value
        }
      },
      data: [56, 45, 57, 48, 65, 46, 53, 45]
    }
  ]
})
const barTwo = ref({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: '#999'
      }
    }
  },
  legend: {
    data: ['项目金额', '项目数量']
  },
  xAxis: [
    {
      type: 'category',
      data: props.dataTwo,
      axisPointer: {
        type: 'shadow'
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      name: '万元',
      min: 0,
      max: 150,
      interval: 30,
      axisLabel: {
        formatter: '{value}.00'
      }
    },
    {
      type: 'value',
      min: 30,
      max: 70,
      interval: 10,
      axisLabel: {
        formatter: '{value}.00%'
      }
    }
  ],
  series: [
    {
      name: '项目金额',
      type: 'bar',
      tooltip: {
        valueFormatter: function (value) {
          return value
        }
      },
      data: [70, 56, 86, 72, 65, 99, 92, 64]
    },
    {
      name: '项目数量',
      type: 'line',
      yAxisIndex: 1,
      tooltip: {
        valueFormatter: function (value) {
          return value
        }
      },
      data: [56, 45, 57, 48, 65, 46, 53, 45]
    }
  ]
})
const dataList = ref({})
const barLoadingOptions = ref({
  text: 'Loading…',
  color: '#4ea397',
  maskColor: 'rgba(255, 255, 255, 0.4)'
})
const theme = ref('')
const autoResize = ref(true)
provide(THEME_KEY, 'westeros')
defineExpose({
  dataList,
  barOne,
  barTwo,
  barLoadingOptions,
  theme,
  autoResize
})
</script>

<style lang="less" scoped>
.zlcbylxBox {
  .Page {
    float: right;
  }

  .valueBox {
    width: 80%;
    margin: auto;

    figure {
      width: 100%;
      display: inline-block;
      position: relative;
      margin: 2em auto;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      box-shadow: 0 0 45px rgba(0, 0, 0, 0.2);
      padding: 30px;

      .echarts {
        width: 100%;
        min-width: 400px;
        height: 255px;
      }
    }
  }
}
</style>
