<template>
  <div class="htqdBox">
    <div class="valueBox">
      <div class="leftBox">
        <figure>
          <el-tabs v-model="activeName" @tab-click="handleClick">
            <el-tab-pane label="物资类" name="first">
              <el-form>
                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">年度合同签订金额</span>
                      </label>
                      <span style="font-size: 14px; color: blue; margin-left: 30px">
                        {{ `(4445)` }}
                      </span>
                      <span style="font-size: 14px; margin-left: 10px">亿元</span>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">年度合同签订数量</span>
                      </label>
                      <span style="font-size: 14px; color: blue; margin-left: 30px">
                        {{ `(50)` }}
                      </span>
                      <span style="font-size: 14px; margin-left: 10px">个</span>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">其中：</span>
                      </label>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">通用物资合同签订数量</span>
                      </label>
                      <span style="font-size: 14px; color: blue; margin-left: 30px">
                        {{ `(50)` }}
                      </span>
                      <span style="font-size: 14px; margin-left: 10px">亿元</span>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">框架服务合同签订金额</span>
                      </label>
                      <span style="font-size: 14px; color: blue; margin-left: 30px">
                        {{ `(50)` }}
                      </span>
                      <span style="font-size: 14px; margin-left: 10px">亿元</span>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">框架服务合同签订数量</span>
                      </label>
                      <span style="font-size: 14px; color: blue; margin-left: 30px">
                        {{ `(50)` }}
                      </span>
                      <span style="font-size: 14px; margin-left: 10px">亿元</span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="服务类" name="second">
              <el-form>
                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">年度合同签订金额</span>
                      </label>
                      <span style="font-size: 14px; color: blue; margin-left: 30px">
                        {{ `(4445)` }}
                      </span>
                      <span style="font-size: 14px; margin-left: 10px">亿元</span>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">年度合同签订数量</span>
                      </label>
                      <span style="font-size: 14px; color: blue; margin-left: 30px">
                        {{ `(50)` }}
                      </span>
                      <span style="font-size: 14px; margin-left: 10px">个</span>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">其中：</span>
                      </label>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">通用物资合同签订数量</span>
                      </label>
                      <span style="font-size: 14px; color: blue; margin-left: 30px">
                        {{ `(50)` }}
                      </span>
                      <span style="font-size: 14px; margin-left: 10px">亿元</span>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">框架服务合同签订金额</span>
                      </label>
                      <span style="font-size: 14px; color: blue; margin-left: 30px">
                        {{ `(50)` }}
                      </span>
                      <span style="font-size: 14px; margin-left: 10px">亿元</span>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col>
                    <el-form-item>
                      <label slot="label">
                        <span style="font-size: 16px">框架服务合同签订数量</span>
                      </label>
                      <span style="font-size: 14px; color: blue; margin-left: 30px">
                        {{ `(50)` }}
                      </span>
                      <span style="font-size: 14px; margin-left: 10px">亿元</span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </figure>
      </div>

      <div class="rightBox">
        <el-tabs v-model="activeName" @tab-click="handleClick">
          <el-tab-pane label="总览" name="first"></el-tab-pane>
          <el-tab-pane label="供电公司" name="second"></el-tab-pane>
          <el-tab-pane label="直属单位" name="third"></el-tab-pane>
        </el-tabs>
        <figure>
          <v-chart :option="bar" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
        </figure>
        <el-tabs v-model="activeName" @tab-click="handleClick">
          <el-tab-pane label="总览" name="first"></el-tab-pane>
          <el-tab-pane label="资本" name="second"></el-tab-pane>
          <el-tab-pane label="成本" name="third"></el-tab-pane>
        </el-tabs>
        <figure>
          <v-chart :option="bar" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
        </figure>
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
    const bar = ref({
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
          data: ["储备立项", "招投标", "合同签订", "项目实施", "项目审计", "结算支付", "决算增资", "项目关闭"],
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
      value: "",
      value2: "",
      dataList: {},
      activeName: "first",
      activeName1: "first",
      bar,
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
.htqdBox {
  .valueBox {
    width: 100%;
    display: flex;
    margin-top: 50px;
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
    }
    .rightBox {
      width: 70%;
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
          height: 255px;
        }
      }
    }
  }
}
</style>
