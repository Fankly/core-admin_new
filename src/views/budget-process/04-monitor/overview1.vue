<template>
  <div class="allSee" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <!-- 头部信息 -->
    <div class="topBox">
      <div class="titleBox">
        <img class="top" src="@/assets/allsee/leftTop.svg" />
        <img class="bottom" src="@/assets/allsee/rightBottom.svg" />
        <div class="title">今日新增项目</div>
        <div class="textBox">
          <span class="one">64</span>
          <span class="two" style="margin-left: 20px">个</span>
        </div>
      </div>
      <div class="titleBox">
        <img class="top" src="@/assets/allsee/leftTop.svg" />
        <img class="bottom" src="@/assets/allsee/rightBottom.svg" />
        <div class="title">今日新增预算</div>
        <div class="textBox">
          <span class="one">1022.03</span>
          <span class="two" style="margin-left: 20px">万元</span>
        </div>
      </div>
      <div class="titleBox">
        <img class="top" src="@/assets/allsee/leftTop.svg" />
        <img class="bottom" src="@/assets/allsee/rightBottom.svg" />
        <div class="title">今日关闭项目</div>
        <div class="textBox">
          <span class="one">422.32</span>
          <span class="two" style="margin-left: 20px">万元</span>
        </div>
      </div>
      <div class="titleBox">
        <img class="top" src="@/assets/allsee/leftTop.svg" />
        <img class="bottom" src="@/assets/allsee/rightBottom.svg" />
        <div class="title">预警 异常项目</div>
        <div class="textBox">
          <span class="one">24</span>
          <span class="two" style="margin-left: 20px">个</span>
        </div>
      </div>
    </div>
    <!-- /头部信息 -->
    <div class="echartsBox1">
      <div style="margin: 10px; width: 50%">
        <figure>
          <div class="tabBox">
            <div class="tabTitle">
              <img src="@/assets/allsee/u12.svg" alt="" />
              <span>项目立项</span>
            </div>
            <div class="tabButton">
              <el-check-tag :checked="!checked" @change="onChange(false)" style="margin-left: 150px">项目性质</el-check-tag>
              <span>|</span>
              <el-check-tag :checked="checked" @change="onChange(true)">项目类型</el-check-tag>
            </div>
          </div>
          <div class="echartsBox" v-if="!checked">
            <div class="small">
              <h3>总体项目立项率</h3>
              <div style="width: 100%">
                <v-chart style="height: 200px" :option="sqt1" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
              </div>
              <div style="width: 100%; margin-top: 30px">
                <div style="width: 100%">
                  <span style="font-size: 14px">立项个数</span>
                  <span style="color: #ffa115; float: right">1920个</span>
                </div>
                <div style="width: 100%; margin-top: 5px">
                  <span style="font-size: 14px">总体预算</span>
                  <span style="color: #65c89a; float: right">2498万元</span>
                </div>
                <div style="width: 100%; margin-top: 5px">
                  <span style="font-size: 14px">下达预算</span>
                  <span style="color: #34c1f0; float: right">1215万元</span>
                </div>
              </div>
            </div>
            <div class="small">
              <h3>总体项目立项率</h3>
              <div style="width: 100%">
                <v-chart style="height: 200px" :option="sqt1" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
              </div>
              <div style="width: 100%; margin-top: 30px">
                <div style="width: 100%">
                  <span style="font-size: 14px">立项个数</span>
                  <span style="color: #ffa115; float: right">1920个</span>
                </div>
                <div style="width: 100%; margin-top: 5px">
                  <span style="font-size: 14px">总体预算</span>
                  <span style="color: #65c89a; float: right">2498万元</span>
                </div>
                <div style="width: 100%; margin-top: 5px">
                  <span style="font-size: 14px">下达预算</span>
                  <span style="color: #34c1f0; float: right">1215万元</span>
                </div>
              </div>
            </div>
            <div class="small">
              <h3>总体项目立项率</h3>
              <div style="width: 100%">
                <v-chart style="height: 200px" :option="sqt1" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
              </div>
              <div style="width: 100%; margin-top: 30px">
                <div style="width: 100%">
                  <span style="font-size: 14px">立项个数</span>
                  <span style="color: #ffa115; float: right">1920个</span>
                </div>
                <div style="width: 100%; margin-top: 5px">
                  <span style="font-size: 14px">总体预算</span>
                  <span style="color: #65c89a; float: right">2498万元</span>
                </div>
                <div style="width: 100%; margin-top: 5px">
                  <span style="font-size: 14px">下达预算</span>
                  <span style="color: #34c1f0; float: right">1215万元</span>
                </div>
              </div>
            </div>
          </div>
          <div class="echartsBox" v-else>
            <v-chart style="height: 380px" :option="bar" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
          </div>
        </figure>
      </div>

      <div style="margin: 10px; width: 50%">
        <figure>
          <div class="tabBox">
            <div class="tabTitle">
              <img src="@/assets/allsee/u12.svg" alt="" />
              <span>项目执行进度</span>
            </div>
          </div>
          <div class="sjxBox">
            <div class="bzt">
              <el-steps :active="6" align-center>
                <el-step title="立项" description="17600.60元">
                  <template v-slot:icon>
                    <img src="@/assets/allsee/u19-06.svg" alt="" />
                  </template>
                </el-step>
                <el-step title="需求提报" description="17600.60元">
                  <template v-slot:icon>
                    <img src="@/assets/allsee/u19-01.svg" alt="" />
                  </template>
                </el-step>
                <el-step title="中标" description="17600.60元">
                  <template v-slot:icon>
                    <img src="@/assets/allsee/u19-05.svg" alt="" />
                  </template>
                </el-step>
                <el-step title="合同签订" description="17600.60元">
                  <template v-slot:icon>
                    <img src="@/assets/allsee/u19-02.svg" alt="" />
                  </template>
                </el-step>
                <el-step title="账务入账" description="17600.60元">
                  <template v-slot:icon>
                    <img src="@/assets/allsee/u19-03.svg" alt="" />
                  </template>
                </el-step>
                <el-step title="项目关闭" description="17600.60元">
                  <template v-slot:icon>
                    <img src="@/assets/allsee/u19-04.svg" alt="" />
                  </template>
                </el-step>
              </el-steps>
            </div>
            <div class="jindu">
              <div class="ggjddiv">
                <div class="bb">立项率</div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#65c89a" /></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#ff9f41" /></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#34c1f0" /></div>
              </div>
            </div>
            <div class="jindu">
              <div class="ggjddiv">
                <div class="bb">提报比率</div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#65c89a" /></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#ff9f41" /></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#34c1f0" /></div>
              </div>
            </div>
            <div class="jindu">
              <div class="ggjddiv">
                <div class="bb">中标比率</div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#65c89a" /></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#ff9f41" /></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#34c1f0" /></div>
              </div>
            </div>
            <div class="jindu">
              <div class="ggjddiv">
                <div class="bb">合同签订率</div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#65c89a" /></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#ff9f41" /></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#34c1f0" /></div>
              </div>
            </div>
            <div class="jindu">
              <div class="ggjddiv">
                <div class="bb">执行率</div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#65c89a" /></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#ff9f41" /></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#34c1f0" /></div>
              </div>
            </div>
            <div class="jindu">
              <div class="ggjddiv">
                <div class="bb">关闭率</div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#65c89a" /> <span class="name" style="color: #65c89a">立项</span></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#ff9f41" /> <span class="name" style="color: #ff9f41">资本</span></div>
                <div class="aa"><el-progress class="jdtjj" :percentage="20" color="#34c1f0" /> <span class="name" style="color: #34c1f0">成本</span></div>
              </div>
            </div>
          </div>
        </figure>
      </div>
    </div>
    <div class="echartsBox2">
      <div style="margin: 10px; width: 50%">
        <figure>
          <div class="tabBox">
            <div class="tabTitle">
              <img src="@/assets/allsee/u12.svg" alt="" />
              <span>项目执行质量</span>
            </div>
            <div class="tabButton">
              <el-check-tag :checked="!checked2" @change="onChange2(false)" style="margin-left: 100px">及时性</el-check-tag>
              <span>|</span>
              <el-check-tag :checked="checked2" @change="onChange2(true)">规范性</el-check-tag>
            </div>
          </div>
          <div v-if="!checked2">
            <v-chart style="height: 380px" :option="zz1" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
          </div>
          <div v-else>
            <v-chart style="height: 380px" :option="zz2" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
          </div>
        </figure>
      </div>
      <div style="margin: 10px; width: 50%">
        <figure>
          <div class="tabBox">
            <div class="tabTitle">
              <img src="@/assets/allsee/u12.svg" alt="" />
              <span>预算基础管理</span>
            </div>
            <div class="tabButton" style="display: flex">
              <div>
                <span style="font-size: 14px">预算辞条数</span>
                <span style="font-size: 22px; color: #ffa115; font-weight: 700">332个</span>
              </div>
              <div>
                <span style="font-size: 14px">预算科目</span>
                <span style="font-size: 22px; color: #65c89a; font-weight: 700">42个</span>
              </div>
            </div>
          </div>
          <div class="bxyzz">
            <div class="echbox dw">
              <!-- <h3 class="jddw">项目预算组织</h3> -->
              <v-chart style="height: 380px" :option="bt" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
            </div>
            <div class="echbox">
              <v-chart style="height: 380px" :option="zz" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
            </div>
          </div>
        </figure>
      </div>
    </div>
    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  </div>
</template>

<script lang="ts">
import { use } from "echarts/core";
import { PictorialBarChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, LineChart, PieChart, MapChart, RadarChart, ScatterChart, EffectScatterChart, LinesChart } from "echarts/charts";
import { GridComponent, PolarComponent, GeoComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent, DatasetComponent, ToolboxComponent, DataZoomComponent } from "echarts/components";
import VChart, { THEME_KEY } from "vue-echarts";
import { ref, defineComponent } from "vue";
import { setup } from "xe-utils/ctor";
import userDialog from "@/components/select/userDialog.vue";
import baseService from "@/service/baseService";
import { ElMessage } from "element-plus";
import { useStore } from "vuex";

use([
  PictorialBarChart,
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
]);
export default defineComponent({
  name: "/budget-process/04-monitor/overview",
  components: {
    VChart,
    userDialog
  },

  provide: {
    [THEME_KEY]: "westeros"
  },
  setup() {
    const store = useStore();
    const loading = ref(false);
    const userCode = ref();
    const userId = ref();
    const specialorgid = ref();
    const checked = ref(false);
    const checked2 = ref(false);
    const onChange = (value) => {
      checked.value = value;
    };
    const onChange2 = (value) => {
      checked2.value = value;
    };
    const list = ref([
      {
        name: "立项及时性",
        value: 42
      },
      {
        name: "招投标及时性",
        value: 255
      },
      {
        name: "中标结果下达及时性",
        value: 50
      },
      {
        name: "合同签订及时性",
        value: 213
      },
      {
        name: "开工及时性",
        value: 225
      },
      {
        name: "物质到货及时性",
        value: 135
      },
      {
        name: "物资领用及时性",
        value: 174
      },
      {
        name: "竣工及时性",
        value: 146
      },
      {
        name: "送审及时性",
        value: 152
      },
      {
        name: "审计及时性",
        value: 210
      },
      {
        name: "资金支付及时性",
        value: 145
      },
      {
        name: "决算送审及时性",
        value: 220
      },
      {
        name: "决算审计及时性",
        value: 70
      },
      {
        name: "暂估转资及时性",
        value: 96
      },
      {
        name: "正式转资及时性",
        value: 196
      },
      {
        name: "关闭及时性",
        value: 210
      }
    ]);

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
        data: ["立项个数", "预算金额"]
      },
      xAxis: [
        {
          type: "category",
          data: ["基建", "技改", "小型基建", "大修", "科技", "营销", "信息", "管理咨询", "教育培训", "工程项目", "股权投资", "专项成本", "专项资金", "固定资产零星购置"],
          axisPointer: {
            type: "shadow"
          },
          axisLabel: {
            interval: 0,
            rotate: 50
          }
        }
      ],
      yAxis: [
        {
          type: "value",
          name: "万元",
          min: 0,
          max: 1500,
          interval: 500,
          axisLabel: {
            formatter: "{value} "
          }
        },
        {
          type: "value",
          name: "个",
          min: 0,
          max: 150,
          interval: 50,
          axisLabel: {
            formatter: "{value}"
          }
        }
      ],
      series: [
        {
          name: "立项个数",
          type: "bar",
          itemStyle: {
            color: "#65c89a"
          },
          tooltip: {
            valueFormatter: function (value) {
              return value + " 个";
            }
          },
          data: [216, 163, 1020, 590, 346, 126.3, 246.5, 162.2, 176.3, 263, 368, 464, 635, 769]
        },
        {
          name: "预算金额",
          type: "bar",
          itemStyle: {
            color: "#ffa115"
          },
          tooltip: {
            valueFormatter: function (value) {
              return value + " 万元";
            }
          },
          data: [254.2, 1065.5, 863.4, 854.2, 1025.4, 1425.4, 175.6, 182.2, 452, 765, 432, 123, 345, 569]
        }
      ]
    });

    const bt = ref({
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)"
      },
      legend: {
        top: "5%",
        left: "center"
      },
      color: ["#65c89a", "#4fa8a4", "#ffa115"],
      title: {
        text: "项目预算组织",
        left: "center",
        top: "45%",
        textStyle: {
          textAlign: "center",
          fill: "#333",
          fontSize: 18,
          fontWeight: 700
        }
      },
      series: [
        {
          name: "项目预算组织",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: "center"
          },
          data: [
            { value: 13, name: "地市公司" },
            { value: 9, name: "直属单位" },
            { value: 2, name: "省公司本部" }
          ]
        }
      ]
    });

    const zz = ref({
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      xAxis: {
        type: "category",
        data: ["资本性", "成本性"]
      },
      yAxis: {
        type: "value"
      },
      series: [
        {
          data: [120, 200],
          type: "bar",
          barWidth: "20%",
          itemStyle: {
            color: "#65c89a"
          }
        }
      ]
    });

    const sqt1 = ref({
      series: [
        {
          type: "liquidFill", //水位图
          radius: "90%", //显示比例
          center: ["50%", "50%"], //中心点
          amplitude: 10, //水波振幅
          data: [0.5], // data个数代表波浪数
          // color: ["#23cc72"], color: {
          itemStyle: {
            normal: {
              // 水波渐变色
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "#65c89a"
                  },
                  {
                    offset: 1,
                    color: "#f7fffb"
                  }
                ],
                globalCoord: false
              },
              shadowBlur: 0,
              shadowColor: "white"
            }
          },
          backgroundStyle: {
            borderWidth: 0, //外边框
            borderColor: "#ffffff", //边框颜色
            color: "#f2f2f2" //边框内部填充部分颜色
          },
          label: {
            //标签设置
            normal: {
              position: ["50%", "70%"],
              formatter: "50%", //显示文本,
              textStyle: {
                fontSize: "30px", //文本字号,
                color: "#fff"
              }
            }
          },
          outline: {
            show: true, //最外层边框显示控制
            itemStyle: {
              color: "none",
              borderColor: "#3e9f99",
              borderWidth: 5,
              shadowBlur: 20,
              shadowColor: "none"
            }
          }
        }
      ]
    });

    const zz1 = ref({
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        },
        formatter: function (params) {
          return params[0].name + ":" + params[0].value + "个";
        }
      },
      grid: {
        containLabel: true,
        left: 10,
        top: 0,
        right: 50,
        bottom: 0
      },
      xAxis: {
        splitLine: {
          show: false
        },
        axisLabel: {
          show: true
        },
        axisTick: {
          show: false
        },
        axisLine: {
          show: false
        }
      },
      yAxis: [
        {
          inverse: true,
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            margin: 10,
            textStyle: {
              fontSize: 14,
              color: "#ccc"
            }
          },
          data: ["立项及时性", "招投标及时性", "中标结果下达及时性", "合同签订及时性", "开工及时性", "物质到货及时性", "物资领用及时性", "竣工及时性", "送审及时性", "审计及时性", "资金支付及时性", "决算送审及时性", "决算审计及时性", "暂估转资及时性", "正式转资及时性", "关闭及时性"]
        }
      ],
      series: [
        {
          //内
          type: "bar",
          barWidth: "10",
          legendHoverLink: false,
          symbolRepeat: true,
          silent: true,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color: "#65c89a" // 0% 处的颜色
                },
                {
                  offset: 1,
                  color: "#65c89a" // 100% 处的颜色
                }
              ]
            }
          },
          data: list,
          z: 1,
          animationEasing: "elasticOut"
        },
        {
          // 背景
          type: "pictorialBar",
          animationDuration: 0,
          symbolRepeat: "fixed",
          symbolMargin: "20%",
          symbol: "roundRect",
          symbolSize: [6, 10],
          itemStyle: {
            normal: {
              color: "#f4f9f9"
            }
          },
          data: list,
          z: 0,
          animationEasing: "elasticOut"
        },
        {
          //分隔
          type: "pictorialBar",
          itemStyle: {
            color: "#f4f9f9"
          },
          symbolRepeat: "fixed",
          symbolMargin: 2,
          symbol: "rect",
          symbolClip: true,
          symbolSize: [3, 10],
          symbolPosition: "start",
          data: list,
          z: 2,
          animationEasing: "elasticOut"
        }
      ]
    });

    const zz2 = ref({
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        },
        formatter: function (params) {
          return params[0].name + ":" + params[0].value + "个";
        }
      },
      grid: {
        containLabel: true,
        left: 10,
        top: 0,
        right: 50,
        bottom: 0
      },
      xAxis: {
        splitLine: {
          show: false
        },
        axisLabel: {
          show: true
        },
        axisTick: {
          show: false
        },
        axisLine: {
          show: false
        }
      },
      yAxis: [
        {
          inverse: true,
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            margin: 10,
            textStyle: {
              fontSize: 14,
              color: "#ccc"
            }
          },
          data: ["立项规范性", "招投标差额", "合同签订规范性", "合同履约规范性", "合同领用规范性", "物资整领整退", "物资退库率", "物资超欠供差额", "预算调整金额", "预算调整次数", "审计核减金额", "服务入账规范性", "资金支付规范性", "收款单位一致性", "暂估增资合理性", "在建工程余额"]
        }
      ],
      series: [
        {
          //内
          type: "bar",
          barWidth: "10",
          legendHoverLink: false,
          symbolRepeat: true,
          silent: true,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color: "#ff9f41" // 0% 处的颜色
                },
                {
                  offset: 1,
                  color: "#ff9f41" // 100% 处的颜色
                }
              ]
            }
          },
          data: list,
          z: 1,
          animationEasing: "elasticOut"
        },
        {
          // 背景
          type: "pictorialBar",
          animationDuration: 0,
          symbolRepeat: "fixed",
          symbolMargin: "20%",
          symbol: "roundRect",
          symbolSize: [6, 10],
          itemStyle: {
            normal: {
              color: "#f4f9f9"
            }
          },
          data: list,
          z: 0,
          animationEasing: "elasticOut"
        },
        {
          //分隔
          type: "pictorialBar",
          itemStyle: {
            color: "#f4f9f9"
          },
          symbolRepeat: "fixed",
          symbolMargin: 2,
          symbol: "rect",
          symbolClip: true,
          symbolSize: [3, 10],
          symbolPosition: "start",
          data: list,
          z: 2,
          animationEasing: "elasticOut"
        }
      ]
    });

    return {
      theme: "",
      bar,
      bt,
      zz,
      sqt1,
      zz1,
      zz2,
      barLoadingOptions: {
        text: "Loading…",
        color: "#4ea397",
        maskColor: "rgba(255, 255, 255, 0.4)"
      },
      autoResize: true,
      loading,
      userCode,
      userId,
      specialorgid,
      store,
      onChange,
      onChange2,
      checked,
      checked2,
      list
    };
  },

  methods: {
    loadCompany() {
      this.loading = false;
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid);
    }
  }
});
</script>

<style lang="less" scoped>
.allSee {
  .topBox {
    width: 100%;
    display: flex;
    justify-content: center;
    .titleBox {
      width: 24%;
      height: 100px;
      background-color: #319994;
      margin: 10px;
      position: relative;
      padding-top: 10px;
      padding-left: 20px;

      .top {
        opacity: 0.3;
        position: absolute;
        top: 0;
        left: 0;
      }
      .bottom {
        opacity: 0.3;
        position: absolute;
        bottom: 0;
        right: 0;
      }
      .title {
        font-size: 18px;
        color: #ffffff;
        position: absolute;
      }
      .textBox {
        position: absolute;
        top: 40px;
        left: 18px;
        .one {
          font-size: 28px;
          color: #ffffff;
        }
        .two {
          font-size: 20px;
          color: #ffffff;
        }
      }
    }
  }
  .echartsBox1 {
    width: 100%;
    display: flex;

    figure {
      width: 100%;
      min-width: 325px;
      height: 444px;
      display: inline-block;
      position: relative;
      margin: auto;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
      .tabBox {
        width: 100%;
        border-bottom: 1px solid rgb(233, 233, 233);
        display: flex;
        .tabTitle {
          height: 46px;
          line-height: 46px;
          display: flex;
          img {
            width: 18px;
            margin-left: 30px;
          }
          span {
            margin-left: 10px;
            font-size: 18px;
            font-weight: 700;
          }
        }
        .tabButton {
          margin-left: auto;
          margin-top: 8px;
          .el-check-tag.is-checked {
            color: #ffffff;
            background-color: #0d867f;
          }
          span {
            margin: 0 5px;
          }
        }
      }
      .echartsBox {
        width: 95%;
        margin: auto;
        display: flex;
        .small {
          width: 33%;
          height: 300px;
          margin: 0 10px;
          margin-top: 30px;
          h3 {
            font-size: 16px;
            text-align: center;
          }
        }
      }
      .sjxBox {
        width: 100%;
        .bzt {
          width: 99%;
          margin: auto;
          margin-top: 20px;
          .el-step__head.is-finish {
            color: #0d867f;
          }
          .el-step__title.is-finish {
            color: #0d867f;
          }
          .el-step__description.is-finish {
            color: black;
          }
          .el-step__icon.is-text {
            width: 36px;
            height: 36px;
            border: none;
          }
        }
        .jindu {
          width: 100%;
          margin: auto;
          display: flex;
          margin-top: 10px;

          .ggjddiv {
            width: 100%;
            margin: 0 10px;
            text-align: center;
            display: flex;
            .aa {
              width: 28%;
            }
            .bb {
              width: 15%;
              color: #000;
              font-size: 14px;
              margin-top: 15px;
              line-height: 10px;
            }
            .jdtjj {
              margin-top: 15px;
            }
            .name {
              font-size: 16px;
              margin-right: 30px;
            }
          }
        }
      }
    }
  }

  .echartsBox2 {
    width: 100%;
    display: flex;

    figure {
      width: 100%;
      min-width: 325px;
      height: 444px;
      display: inline-block;
      position: relative;
      margin: auto;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
      .tabBox {
        width: 100%;
        border-bottom: 1px solid rgb(233, 233, 233);
        display: flex;
        .tabTitle {
          height: 46px;
          line-height: 46px;
          display: flex;
          img {
            width: 18px;
            margin-left: 30px;
          }
          span {
            margin-left: 10px;
            font-size: 18px;
            font-weight: 700;
          }
        }
        .tabButton {
          margin-left: auto;
          margin-top: 8px;
          .el-check-tag.is-checked {
            color: #ffffff;
            background-color: #0d867f;
          }
          span {
            margin: 0 5px;
          }
        }
      }
      .bxyzz {
        width: 100%;
        display: flex;
        justify-content: center;
        .echbox {
          width: 45%;
          margin: 0 10px;
          margin-top: 20px;
        }
      }
    }
  }
}
</style>


