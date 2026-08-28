<template>
  <div class="cbylxBox">
    <div class="searchBox">
      <el-form :inline="true" label-width="100px">
        <el-row>
          <el-col :span="8">
            <el-form-item label="项目类型：">
              <projectType ref="type"></projectType>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="所属单位：">
              <affiliatedUnit ref="company"></affiliatedUnit>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="截至时间：">
              <el-date-picker v-model="time" type="month" placeholder="选择月"> </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="展示维度：">
              <el-select v-model="dimension" placeholder="请选择">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8"> </el-col>
          <el-col :span="8">
            <el-form-item>
              <el-button style="margin-left: 100px" type="primary" icon="el-icon-search" @click="search">查 询</el-button>
              <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="valueBox">
      <div class="rightBox">
        <el-tabs v-model="activeName1" @tab-click="handleClick">
          <el-tab-pane label="供电公司" name="1"></el-tab-pane>
          <el-tab-pane label="直属单位" name="2"></el-tab-pane>
        </el-tabs>
        <figure>
          <v-chart :option="echarts1" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
        </figure>

        <el-tabs v-model="activeName2" @tab-click="handleClick2">
          <el-tab-pane label="资本" name="3"></el-tab-pane>
          <el-tab-pane label="成本" name="4"></el-tab-pane>
        </el-tabs>
        <figure>
          <v-chart :option="echarts2" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
        </figure>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { number, use } from 'echarts/core'
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
import VChart, { THEME_KEY } from 'vue-echarts'
import { ref, defineComponent } from 'vue'
import { setup } from 'xe-utils/ctor'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
use([
  BarChart,
  LineChart,
  PieChart,
  MapChart,
  RadarChart,
  ScatterChart,
  EffectScatterChart,
  LinesChart,
  GridComponent,
  PolarComponent,
  GeoComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
  DatasetComponent,
  CanvasRenderer,
  ToolboxComponent,
  DataZoomComponent
])
export default defineComponent({
  components: {
    VChart,
    affiliatedUnit,
    projectType
  },

  provide: {
    [THEME_KEY]: 'westeros'
  },
  setup() {
    const time = ref(new Date())
    const type = ref()
    const company = ref()
    const activeName1 = ref('1')
    const activeName2 = ref('3')
    const echarts1nnm = ref([])
    const echarts1amount = ref([])
    const echarts1name = ref([])
    const echarts2nnm = ref([])
    const echarts2amount = ref([])
    const echarts2name = ref([])
    const options = ref([
      {
        label: '省公司层面',
        value: 'a'
      },
      {
        label: '地市公司层面',
        value: 'b'
      },
      {
        label: '直属单位/本部/县公司层面',
        value: 'c'
      }
    ])
    const dimension = ref('a')
    const search = () => {
      echarts1name.value = []
      echarts1nnm.value = []
      echarts1amount.value = []
      echarts2name.value = []
      echarts2nnm.value = []
      echarts2amount.value = []
      let params = {
        level: 'a',
        zyear: '',
        zmonth: '',
        qkjejdws: [],
        qkjxmlxbms: [],
        type1: activeName1.value,
        type2: activeName2.value
      }
      params.qkjxmlxbms = type.value.selectList
      params.qkjejdws = company.value.selectList
      if (time) {
        let month = new Date(time.value)
        let zyear = month.getFullYear()
        let zmonth = month.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      baseService.post('/process/chart02/', params).then((res) => {
        if (res.success) {
          res.data.chart1.forEach((item) => {
            echarts1name.value.push(item.name)
            echarts1nnm.value.push(item.ylxxms)
            echarts1amount.value.push(item.erpjdys.split(',').join(''))
          })
          res.data.chart2.forEach((item) => {
            echarts2name.value.push(item.name)
            echarts2nnm.value.push(item.ylxxms)
            echarts2amount.value.push(item.erpjdys.split(',').join(''))
          })
        }
      })
    }
    const handleClick = () => {
      search()
    }
    const handleClick2 = () => {
      search()
    }
    const echarts1 = ref({
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
          axisPointer: {
            type: 'shadow'
          },
          axisLabel: { interval: 0, rotate: 30 },
          data: echarts1name
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '万元',
          min: 0,
          max: 1000000,
          interval: 100000,
          axisLabel: {
            formatter: '{value}'
          }
        },
        {
          type: 'value',
          name: '个',
          min: 0,
          max: 10000,
          interval: 1000,
          axisLabel: {
            formatter: '{value}'
          }
        }
      ],
      series: [
        {
          name: '项目金额',
          type: 'bar',
          barMaxWidth: 100,
          tooltip: {
            valueFormatter: function (value) {
              let num = Number(value).toLocaleString()
              return num
            }
          },
          data: echarts1amount
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
          data: echarts1nnm
        }
      ]
    })
    const echarts2 = ref({
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
          axisPointer: {
            type: 'shadow'
          },
          axisLabel: { interval: 0, rotate: 30 },
          data: echarts2name
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '万元',
          min: 0,
          max: 1000000,
          interval: 100000,
          axisLabel: {
            formatter: '{value}'
          }
        },
        {
          type: 'value',
          name: '个',
          min: 0,
          max: 10000,
          interval: 1000,
          axisLabel: {
            formatter: '{value}'
          }
        }
      ],
      series: [
        {
          name: '项目金额',
          type: 'bar',
          barMaxWidth: 100,
          tooltip: {
            valueFormatter: function (value) {
              let num = Number(value).toLocaleString()
              return num
            }
          },
          data: echarts2amount
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
          data: echarts2nnm
        }
      ],
      dataZoom: [
        {
          show: true,
          start: 0,
          end: 30
        }
      ]
    })
    const pia = ref({
      tooltip: {
        formatter: '{b} : {c} ({d}%)'
      },
      legend: {
        left: 'center',
        data: ['大中型基站', '配网', '生产技改', '小型基建', '生产辅助技改']
      },
      series: [
        {
          name: 'name',
          type: 'pie',
          radius: '55%',
          center: ['40%', '50%'],
          data: [
            { value: 335, name: '大中型基站' },
            { value: 310, name: '配网' },
            { value: 234, name: '生产技改' },
            { value: 135, name: '小型基建' },
            { value: 1548, name: '生产辅助技改' }
          ],
          label: {
            formatter: '{d}%'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    })
    return {
      activeName1,
      activeName2,
      echarts1,
      echarts2,
      pia,
      barLoadingOptions: {
        text: 'Loading…',
        color: '#4ea397',
        maskColor: 'rgba(255, 255, 255, 0.4)'
      },
      theme: '',
      autoResize: true,
      time,
      search,
      handleClick,
      handleClick2,
      type,
      company,
      echarts1nnm,
      echarts1amount,
      echarts1name,
      echarts2nnm,
      echarts2amount,
      echarts2name,
      options,
      dimension
    }
  },
  mounted() {
    let id = sessionStorage.getItem('specialorgid')
    this.$refs.company.getAffiliatedUnit(id)
  }
})
</script>

<style lang="less" scoped>
.cbylxBox {
  .searchBox {
    width: 90%;
    margin: auto;
    margin-top: 20px;
    min-width: 985px;
  }
  .valueBox {
    width: 100%;
    display: flex;
    .leftBox {
      width: 30%;
      padding-right: 20px;
      padding-top: 2%;
      padding-bottom: 5%;
      padding-left: 3%;

      figure {
        width: 95%;
        min-width: 325px;
        display: inline-block;
        position: relative;
        margin: auto;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        padding: 10px;
        padding-left: 30px;
      }

      .echarts {
        width: 100%;
        height: 255px;
      }
    }

    .rightBox {
      width: 100%;
      padding-left: 20px;
      figure {
        width: 100%;
        display: inline-block;
        position: relative;
        margin: 2em auto;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        padding: 30px;

        .echarts {
          width: 100%;
          min-width: 400px;
          height: 350px;
        }
      }
    }
  }
}
</style>
