<template>
  <div class="newBox">
    <div class="valueBox">
      <figure>
        <v-chart :option="bar" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize"></v-chart>
      </figure>

      <figure>
        <v-chart :option="pia" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize"></v-chart>
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
  setup() {
    const pia = ref({
      tooltip: {
        formatter: "{b} : {c} ({d}%)"
      },
      legend: {
        left: "center",
        data: ["大中型基站", "配网", "生产技改", "小型基建", "生产辅助技改"]
      },
      series: [
        {
          name: "name",
          type: "pie",
          radius: "55%",
          center: ["40%", "50%"],
          data: [
            { value: 335, name: "大中型基站" },
            { value: 310, name: "配网" },
            { value: 234, name: "生产技改" },
            { value: 135, name: "小型基建" },
            { value: 1548, name: "生产辅助技改" }
          ],
          label: {
            formatter: "{b} : {c} ({d}%)"
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)"
            }
          }
        }
      ]
    });

    const bar = ref({
      tooltip: {
        trigger: "axis"
      },
      legend: {
        data: ["项目金额", "项目数量", "项目"]
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true
      },
      xAxis: [
        {
          type: "category",
          boundaryGap: false,
          data: ["储备立项", "招投标", "合同签订", "项目实施", "项目审计", "结算支付", "决算增资", "项目关闭"]
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
          name: "个",
          min: 0,
          max: 70,
          interval: 10,
          axisLabel: {
            formatter: "{value}.00"
          }
        }
      ],
      series: [
        {
          name: "项目金额",
          type: "line",
          tooltip: {
            valueFormatter: function (value) {
              return value + "万元";
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
              return value + "个";
            }
          },
          data: [56, 45, 57, 48, 65, 46, 53, 45]
        },
        {
          name: "项目",
          type: "line",
          yAxisIndex: 1,
          tooltip: {
            valueFormatter: function (value) {
              return value + "个";
            }
          },
          data: [45, 37, 65, 44, 65, 44, 35, 56]
        }
      ]
    });
    return {
      bar,
      pia,
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
.newBox {
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
