<template>
  <div class="xmsjBox">
    <div class="Page">
      <el-tabs v-model="activeName">
        <el-tab-pane label="1" name="first"></el-tab-pane>
        <el-tab-pane label="2" name="second"></el-tab-pane>
      </el-tabs>
    </div>
    <div class="valueBox">
      <div class="leftBox">
        <figure>
          <el-tabs v-model="activeName" @tab-click="handleClick">
            <el-tab-pane label="项目送审情况" name="first">
              <div style="display: flex">
                <v-chart style="width: 30%; height: 300px" :option="leftEch" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />

                <el-form style="margin-left: 20px">
                  <el-row>
                    <el-col>
                      <el-form-item>
                        <label slot="label">
                          <span style="font-size: 16px">项目送审金额</span>
                        </label>
                        <div>
                          <span style="font-size: 14px; color: blue; margin-left: 30px">
                            {{ `(4445)` }}
                          </span>
                          <span style="font-size: 14px; margin-left: 10px">亿元</span>
                        </div>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row>
                    <el-col>
                      <el-form-item>
                        <label slot="label">
                          <span style="font-size: 16px">项目送审数量</span>
                        </label>
                        <div>
                          <span style="font-size: 14px; color: blue; margin-left: 30px">
                            {{ `(12)` }}
                          </span>
                          <span style="font-size: 14px; margin-left: 10px">个</span>
                        </div>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>
              </div>
            </el-tab-pane>

            <el-tab-pane label="项目审定情况" name="second">
              <div style="display: flex">
                <v-chart style="width: 30%; height: 300px" :option="leftEch" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
                <el-form style="margin-left: 20px">
                  <el-row>
                    <el-col>
                      <el-form-item>
                        <label slot="label">
                          <span style="font-size: 16px">项目送审金额</span>
                        </label>
                        <div>
                          <span style="font-size: 14px; color: blue; margin-left: 30px">
                            {{ `(4445)` }}
                          </span>
                          <span style="font-size: 14px; margin-left: 10px">亿元</span>
                        </div>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row>
                    <el-col>
                      <el-form-item>
                        <label slot="label">
                          <span style="font-size: 16px">项目送审数量</span>
                        </label>
                        <div>
                          <span style="font-size: 14px; color: blue; margin-left: 30px">
                            {{ `(12)` }}
                          </span>
                          <span style="font-size: 14px; margin-left: 10px">个</span>
                        </div>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>
              </div>
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
    const leftEch = ref({
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
        data: ["2021"]
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
          data: ["2021"],
          axisPointer: {
            type: "shadow"
          }
        }
      ],
      yAxis: [
        {
          type: "value",
          min: 0,
          max: 100,
          interval: 20,
          axisLabel: {
            formatter: "{value}"
          }
        }
      ],
      series: [
        {
          name: "2021",
          type: "bar",
          tooltip: {
            valueFormatter: function (value) {
              return value;
            }
          },
          data: [70]
        }
      ]
    });

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
      bar,
      leftEch,
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
.xmsjBox {
  .Page {
    float: right;
  }
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
