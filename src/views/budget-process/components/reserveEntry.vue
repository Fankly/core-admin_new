<template>
  <div class="htqdBox">
    <div class="valueBox">
      <div class="leftBox">
        <figure>
          <div class="container">
            <div class="line"></div>
            <div class="box">
              <span class="title">{{ new Date().getFullYear() }}年全省储备立项情况</span>
              <div class="card-box">
                <div class="left">
                  <img src="@/assets/images/img1.png" alt="" />
                </div>
                <div class="right">
                  <div class="content">
                    <span>储备个数</span>
                    <span>102</span>
                    <span>个</span>
                  </div>
                  <div class="content">
                    <span>储备金额</span>
                    <span>758</span>
                    <span>万元</span>
                  </div>
                  <div class="content">
                    <span>立项个数</span>
                    <span>102</span>
                    <span>个</span>
                  </div>
                  <div class="content">
                    <span>立项金额</span>
                    <span>758</span>
                    <span>万元</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </figure>
      </div>

      <div class="rightBox">
        <div class="box">
          <div class="line"></div>
          <figure class="figure-box">
            <div class="title">储备立项情况-单位</div>
            <v-chart :option="barUnit" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
          </figure>
        </div>
        <div class="box">
          <div class="line"></div>
          <figure class="figure-box">
            <div class="title">储备立项情况-类型</div>
            <v-chart :option="barType" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
          </figure>
        </div>
      </div>
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

use([BarChart, LineChart, PieChart, MapChart, RadarChart, ScatterChart, EffectScatterChart, LinesChart, GridComponent, PolarComponent, GeoComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent, DatasetComponent, CanvasRenderer, ToolboxComponent, DataZoomComponent]);
export default defineComponent({
  components: {
    VChart
  },
  provide: {
    [THEME_KEY]: "westeros"
  },
  setup() {
    const barUnit = ref({
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
        data: ["储备金额", "立项金额", "储备数量", "立项项目数"]
      },
      xAxis: [
        {
          type: "category",
          data: ["苏州", "无锡", "南京", "常州", "镇江", "扬州", "泰州", "南通", "盐城", "淮安", "宿迁", "徐州"],
          axisPointer: {
            type: "shadow"
          }
        }
      ],
      yAxis: [
        {
          type: "value",
          name: "单位：万元",
          min: 0,
          max: 150,
          interval: 30,
          axisLabel: {
            formatter: "{value}"
          }
        },
        {
          type: "value",
          name: "单位：个",
          min: 0,
          max: 60,
          interval: 10,
          axisLabel: {
            formatter: "{value}"
          }
        }
      ],
      series: [
        {
          name: "储备金额",
          type: "bar",
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
        },
        {
          name: "立项金额",
          type: "bar",
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3]
        },
        {
          name: "储备数量",
          type: "line",
          yAxisIndex: 1,
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2]
        },
        {
          name: "立项项目数",
          type: "line",
          yAxisIndex: 1,
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [2.6, 3.9, 5.0, 12.4, 18.7, 30.7, 35.6, 37.2, 20.6, 18.8, 6.0, 2.3]
        }
      ]
    });
    const barType = ref({
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
        data: ["储备金额", "立项金额", "储备数量", "立项项目数"]
      },
      xAxis: [
        {
          type: "category",
          data: ["大中性基建", "小型基建", "配网资本", "居配", "商业建筑", "住宅建筑", "特高压", "变电站", "电缆", "电缆", "其他"],
          axisPointer: {
            type: "shadow"
          }
        }
      ],
      yAxis: [
        {
          type: "value",
          name: "单位：万元",
          min: 0,
          max: 150,
          interval: 30,
          axisLabel: {
            formatter: "{value}"
          }
        },
        {
          type: "value",
          name: "单位：个",
          min: 0,
          max: 60,
          interval: 10,
          axisLabel: {
            formatter: "{value}"
          }
        }
      ],
      series: [
        {
          name: "储备金额",
          type: "bar",
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
        },
        {
          name: "立项金额",
          type: "bar",
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3]
        },
        {
          name: "储备数量",
          type: "line",
          yAxisIndex: 1,
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2]
        },
        {
          name: "立项项目数",
          type: "line",
          yAxisIndex: 1,
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [2.6, 3.9, 5.0, 12.4, 18.7, 30.7, 35.6, 37.2, 20.6, 18.8, 6.0, 2.3]
        }
      ]
    });
    return {
      barUnit,
      barType,
      value: "",
      value2: "",
      dataList: {},
      activeName: "first",
      activeName1: "first",
      barLoadingOptions: {
        text: "Loading…",
        color: "#4ea397",
        maskColor: "rgba(255, 255, 255, 0.4)"
      },
      theme: "",
      autoResize: true,
      options: [
        {
          value: "南京供电公司",
          label: "南京供电公司",
          children: [
            {
              value: "南京供电公司本部",
              label: "南京供电公司本部",
              children: [
                {
                  value: "采购部",
                  label: "采购部"
                },
                {
                  value: "管理部",
                  label: "管理部"
                },
                {
                  value: "生产部",
                  label: "生产部"
                }
              ]
            },
            {
              value: "江宁区供电分公司",
              label: "江宁区供电分公司",
              children: [
                {
                  value: "采购部",
                  label: "采购部"
                },
                {
                  value: "管理部",
                  label: "管理部"
                },
                {
                  value: "生产部",
                  label: "生产部"
                }
              ]
            }
          ]
        },
        {
          value: "无锡供电公司",
          label: "无锡供电公司"
        },
        {
          value: "苏州供电公司",
          label: "苏州供电公司"
        },
        {
          value: "常州供电公司",
          label: "常州供电公司"
        },
        {
          value: "盐城供电公司",
          label: "盐城供电公司"
        },
        {
          value: "宿迁供电公司",
          label: "宿迁供电公司"
        },
        {
          value: "淮安供电公司",
          label: "淮安供电公司"
        },
        {
          value: "徐州供电公司",
          label: "徐州供电公司"
        },
        {
          value: "连云港供电公司",
          label: "连云港供电公司"
        },
        {
          value: "泰州供电公司",
          label: "泰州供电公司"
        }
      ],
      projects: [
        {
          value: "资本项目",
          label: "资本项目",
          children: [
            {
              value: "大中型基建",
              label: "大中型基建"
            },
            {
              value: "配网建设改造",
              label: "配网建设改造"
            },
            {
              value: "独立二次",
              label: "独立二次"
            },
            {
              value: "生产技改",
              label: "生产技改"
            },
            {
              value: "生产辅助技改",
              label: "生产辅助技改"
            }
          ]
        },
        {
          value: "成本项目",
          label: "成本项目",
          children: [
            {
              value: "生产修理",
              label: "生产修理"
            }
          ]
        }
      ]
    };
  }
});
</script>

<style lang="less" scoped>
.line {
  left: 0;
  top: 0;
  position: absolute;
  width: 4px;
  height: 30px;
  background-color: #41d1ab;
}

.container {
  display: flex;
  height: 300px;
  width: 100%;
  align-items: center;

  .box {
    border-radius: 10px;
    width: 90%;
    height: 80%;
    margin: 0 auto;
    background: linear-gradient(#50d4aa, #44c8a7);

    text-align: center;

    .title {
      font-size: 20px;
      color: white;
      display: inline-block;
      padding: 20px 0;
      border-bottom: 1px solid black;
    }

    .card-box {
      height: calc(100% - 60px);
      display: flex;

      .left {
        width: 50%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;

        img {
          width: 120px;
        }
      }

      .right {
        .content {
          font-weight: 700;
          padding: 6px 0;
          font-size: 16px;
          color: white;
        }

        .content:first-child {
          padding-top: 20px;
        }
      }
    }
  }
}

.htqdBox {
  .valueBox {
    width: 100%;
    display: flex;
    margin-top: 50px;

    .leftBox {
      width: 30%;

      figure {
        width: 95%;
        min-width: 325px;
        display: inline-block;
        position: relative;
        margin: auto;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        padding: 10px 10px 10px 30px;
      }
    }

    .rightBox {
      width: 70%;
      padding-left: 20px;

      .box {
        position: relative;
        box-sizing: border-box;

        .line {
          left: 0;
          top: 30px;
        }
      }

      .figure-box {
        .title {
          font-size: 16px;
          font-weight: 700;
          margin-left: 20px;
        }
      }

      figure {
        width: 100%;
        display: inline-block;
        position: relative;
        margin: 2em auto;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        padding: 30px 0 0 0;

        .echarts {
          width: 100%;
          min-width: 400px;
          height: 255px;
        }
      }
    }
  }
}

.leftBox {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
