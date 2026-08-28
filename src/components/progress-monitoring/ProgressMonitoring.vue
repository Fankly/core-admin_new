<template>
  <div class="zxjdjkBox">
    <div class="searchBox">
      <el-form :inline="true">
        <el-row>
          <el-col :span="6">
            <el-form-item label="项目类型：">
              <el-cascader :props="props1" clearable :options="projects" @change="handleChange" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属单位：">
              <el-cascader :props="props1" clearable :options="options" @change="handleChange" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="截至时间：">
              <el-date-picker v-model="value2" type="month" placeholder="选择月"> </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item>
              <el-button type="primary" icon="el-icon-search">查 询</el-button>
              <el-button icon="el-icon-refresh-right">重 置</el-button>
              <el-button type="warning" icon="el-icon-download">导 出</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="Page">
      <el-tabs v-model="activeName">
        <el-tab-pane label="1" name="first"></el-tab-pane>
        <el-tab-pane label="2" name="second"></el-tab-pane>
      </el-tabs>
    </div>
    <div class="valueBox">
      <figure>
        <v-chart :option="bar" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
      </figure>
      <figure>
        <el-table border :data="company" style="width: 100%" :header-cell-style="{ 'text-align': 'center' }">
          <el-table-column prop="projectType" label="单位"> </el-table-column>
          <el-table-column prop="value" label="储备立项"></el-table-column>
          <el-table-column prop="label" label="招投标"></el-table-column>
          <el-table-column prop="value" label="合同签订"></el-table-column>
          <el-table-column prop="label" label="项目实施"></el-table-column>
          <el-table-column prop="label" label="项目审计"></el-table-column>
          <el-table-column prop="label" label="结算支付"></el-table-column>
          <el-table-column prop="label" label="决算增资"></el-table-column>
          <el-table-column prop="label" label="项目关闭"></el-table-column>
        </el-table>
      </figure>
    </div>
  </div>
</template>

<script lang="ts">
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
import VChart, { THEME_KEY } from 'vue-echarts'
import { ref, defineComponent } from 'vue'
import { setup } from 'xe-utils/ctor'
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
    VChart
  },
  provide: {
    [THEME_KEY]: 'westeros'
  },
  setup() {
    const bar = ref({
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
          data: ['储备立项', '招投标', '合同签订', '项目实施', '项目审计', '结算支付', '决算增资', '项目关闭'],
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
    return {
      value: '',
      value2: '',
      dataList: {},
      props1: {
        checkStrictly: true,
        multiple: true
      },
      bar,
      barLoadingOptions: {
        text: 'Loading…',
        color: '#4ea397',
        maskColor: 'rgba(255, 255, 255, 0.4)'
      },
      theme: '',
      autoResize: true,

      company: [
        {
          projectType: '全省合计'
        },

        {
          projectType: '南京供电公司'
        },
        {
          projectType: '无锡供电公司'
        },
        {
          projectType: '苏州供电公司'
        },
        {
          projectType: '常州供电公司'
        },
        {
          projectType: '盐城供电公司'
        },
        {
          projectType: '宿迁供电公司'
        },
        {
          projectType: '淮安供电公司'
        },
        {
          projectType: '徐州供电公司'
        },
        {
          projectType: '连云港供电公司'
        },
        {
          projectType: '泰州供电公司'
        }
      ],
      options: [
        {
          value: '南京供电公司',
          label: '南京供电公司',
          children: [
            {
              value: '南京供电公司本部',
              label: '南京供电公司本部',
              children: [
                {
                  value: '采购部',
                  label: '采购部'
                },
                {
                  value: '管理部',
                  label: '管理部'
                },
                {
                  value: '生产部',
                  label: '生产部'
                }
              ]
            },
            {
              value: '江宁区供电分公司',
              label: '江宁区供电分公司',
              children: [
                {
                  value: '采购部',
                  label: '采购部'
                },
                {
                  value: '管理部',
                  label: '管理部'
                },
                {
                  value: '生产部',
                  label: '生产部'
                }
              ]
            }
          ]
        },
        {
          value: '无锡供电公司',
          label: '无锡供电公司'
        },
        {
          value: '苏州供电公司',
          label: '苏州供电公司'
        },
        {
          value: '常州供电公司',
          label: '常州供电公司'
        },
        {
          value: '盐城供电公司',
          label: '盐城供电公司'
        },
        {
          value: '宿迁供电公司',
          label: '宿迁供电公司'
        },
        {
          value: '淮安供电公司',
          label: '淮安供电公司'
        },
        {
          value: '徐州供电公司',
          label: '徐州供电公司'
        },
        {
          value: '连云港供电公司',
          label: '连云港供电公司'
        },
        {
          value: '泰州供电公司',
          label: '泰州供电公司'
        }
      ],
      projects: [
        {
          value: '资本项目',
          label: '资本项目',
          children: [
            {
              value: '大中型基建',
              label: '大中型基建'
            },
            {
              value: '配网建设改造',
              label: '配网建设改造'
            },
            {
              value: '独立二次',
              label: '独立二次'
            },
            {
              value: '生产技改',
              label: '生产技改'
            },
            {
              value: '生产辅助技改',
              label: '生产辅助技改'
            }
          ]
        },
        {
          value: '成本项目',
          label: '成本项目',
          children: [
            {
              value: '生产修理',
              label: '生产修理'
            }
          ]
        }
      ]
    }
  }
})
</script>

<style lang="less" scoped>
.zxjdjkBox {
  .searchBox {
    width: 100%;
    margin: auto;
    margin-top: 20px;
    min-width: 985px;
  }
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
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
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
