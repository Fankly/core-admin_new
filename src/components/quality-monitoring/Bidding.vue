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

<script lang="ts">
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, LineChart, PieChart, MapChart, RadarChart, ScatterChart, EffectScatterChart, LinesChart } from "echarts/charts";
import { GridComponent, PolarComponent, GeoComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent, DatasetComponent, ToolboxComponent, DataZoomComponent } from "echarts/components";
import VChart, { THEME_KEY } from "vue-echarts";
import { ref, defineComponent } from "vue";
import { setup } from "xe-utils/ctor";

use([BarChart, LineChart, PieChart, MapChart, RadarChart, ScatterChart, EffectScatterChart, LinesChart, GridComponent, PolarComponent, GeoComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent, DatasetComponent, CanvasRenderer, ToolboxComponent, DataZoomComponent]);
export default defineComponent({
  components: {
    VChart
  },
  provide: {
    [THEME_KEY]: "westeros"
  },
  setup() {
    const barOne = ref({
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: {
            color: "#999"
          }
        }
      },
      legend: {
        data: ["项目金额", "项目数量"]
      },
      xAxis: [
        {
          type: "category",
          data: ["南京", "苏州", "无锡", "常州", "镇江", "扬州", "泰州", "南通"],
          axisPointer: {
            type: "shadow"
          }
        }
      ],
      yAxis: [
        {
          type: "value",
          name: "万元",
          min: 0,
          max: 150,
          interval: 30,
          axisLabel: {
            formatter: "{value}.00"
          }
        },
        {
          type: "value",
          min: 30,
          max: 70,
          interval: 10,
          axisLabel: {
            formatter: "{value}.00%"
          }
        }
      ],
      series: [
        {
          name: "项目金额",
          type: "bar",
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [70, 56, 86, 72, 65, 99, 92, 64]
        },
        {
          name: "项目数量",
          type: "line",
          yAxisIndex: 1,
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [56, 45, 57, 48, 65, 46, 53, 45]
        }
      ]
    });
    const barTwo = ref({
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: {
            color: "#999"
          }
        }
      },
      legend: {
        data: ["项目金额", "项目数量"]
      },
      xAxis: [
        {
          type: "category",
          data: ["大中型基建", "配网资本", "新能源", "电力设备", "电力服务", "电力贸易", "电力工程", "电力设备"],
          axisPointer: {
            type: "shadow"
          }
        }
      ],
      yAxis: [
        {
          type: "value",
          name: "万元",
          min: 0,
          max: 150,
          interval: 30,
          axisLabel: {
            formatter: "{value}.00"
          }
        },
        {
          type: "value",
          min: 30,
          max: 70,
          interval: 10,
          axisLabel: {
            formatter: "{value}.00%"
          }
        }
      ],
      series: [
        {
          name: "项目金额",
          type: "bar",
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [70, 56, 86, 72, 65, 99, 92, 64]
        },
        {
          name: "项目数量",
          type: "line",
          yAxisIndex: 1,
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [56, 45, 57, 48, 65, 46, 53, 45]
        }
      ]
    });
    return {
      dataList: {},
      barOne,
      barTwo,
      barLoadingOptions: {
        text: "Loading…",
        color: "#4ea397",
        maskColor: "rgba(255, 255, 255, 0.4)"
      },
      theme: "",
      autoResize: true
    };
  }
});
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
