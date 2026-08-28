<script setup lang="ts">
import { ref } from "vue";
import VChart from "vue-echarts";

const oneTab = ref(true);
const twoTab = ref(false);
const threeTab = ref(false);
const unit = ref(true);
const type = ref(false);
const power = ref(true);
const direct = ref(false);
const leftClick = (name: string) => {
  if (name === "one") {
    oneTab.value = true;
    twoTab.value = false;
    threeTab.value = false;
  } else if (name === "two") {
    oneTab.value = false;
    twoTab.value = true;
    threeTab.value = false;
  } else if (name === "three") {
    oneTab.value = false;
    twoTab.value = false;
    threeTab.value = true;
  }
};
const rightClick = (name: string) => {
  if (name === "unit") {
    unit.value = true;
    type.value = false;
  } else if (name === "type") {
    unit.value = false;
    type.value = true;
  }
};
const erectClick = (name: string) => {
  if (name === "one") {
    power.value = true;
    direct.value = false;
  } else if (name === "two") {
    power.value = false;
    direct.value = true;
  }
};
const hierarchy = ref("1");
const contractPieOne = ref({
  tooltip: {
    trigger: "item"
  },
  title: {
    text: "项目开工情况",
    left: "10%",
    textStyle: {
      fontSize: 14
    }
  },
  legend: {
    top: "center",
    left: "center",
    data: ["项目总数", "开工数"],
    textStyle: {
      fontSize: 12
    },
    orient: "vertical"
  },
  series: [
    {
      name: "招投标及时性",
      type: "pie",
      radius: ["80%", "70%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderWidth: 4
      },
      label: {
        show: false
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 735, name: "项目总数" },
        { value: 580, name: "开工数" }
      ]
    }
  ]
});
const contractPieTwo = ref({
  tooltip: {
    trigger: "item"
  },
  title: {
    text: "项目竣工情况",
    left: "10%",
    textStyle: {
      fontSize: 14
    }
  },
  legend: {
    top: "center",
    left: "center",
    data: ["项目总数", "开工数"],
    textStyle: {
      fontSize: 12
    },
    orient: "vertical"
  },
  series: [
    {
      name: "招投标及时性",
      type: "pie",
      radius: ["80%", "70%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderWidth: 4
      },
      label: {
        show: false
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 735, name: "项目总数" },
        { value: 580, name: "开工数" }
      ]
    }
  ]
});
const contract = ref({
  title: {
    text: "项目实施总体情况",
    left: "left",
    textStyle: {
      fontSize: 14
    }
  },
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
    data: ["项目数量", "开工数", "竣工数"],
    right: "8%"
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
      max: 300,
      interval: 50,
      axisLabel: {
        formatter: "{value}"
      }
    }
  ],
  series: [
    {
      name: "项目数量",
      type: "bar",
      tooltip: {
        valueFormatter: function (value:string) {
          return value;
        }
      },
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
    },
    {
      name: "开工数",
      type: "bar",
      tooltip: {
        valueFormatter: function (value:string) {
          return value;
        }
      },
      data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3]
    },
    {
      name: "竣工数",
      type: "bar",
      tooltip: {
        valueFormatter: function (value:string) {
          return value;
        }
      },
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
    }
  ]
});
const line = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      crossStyle: {
        color: "#999"
      }
    }
  },
  grid:{
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true
  },
  legend: {
    data: ["开工及时性", "物资到货及时性", "物资领用及时性", "竣工及时性"]
  },
  xAxis: [
    {
      type: "category",
      data: ["苏州", "无锡", "南京", "常州", "镇江", "扬州", "泰州"],
      axisPointer: {
        type: "shadow"
      }
    }
  ],
  yAxis: [
    {
      type: "value",
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
      name: "开工及时性",
      type: "line",
      tooltip: {
        valueFormatter: function (value:string) {
          return value;
        }
      },
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
    },
    {
      name: "物资到货及时性",
      type: "line",
      tooltip: {
        valueFormatter: function (value:string) {
          return value;
        }
      },
      data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3]
    },
    {
      name: "物资领用及时性",
      type: "line",
      tooltip: {
        valueFormatter: function (value:string) {
          return value;
        }
      },
      data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2]
    },
    {
      name: "竣工及时性",
      type: "line",
      tooltip: {
        valueFormatter: function (value:string) {
          return value;
        }
      },
      data: [2.6, 3.9, 5.0, 12.4, 18.7, 30.7, 35.6, 37.2, 20.6, 18.8, 6.0, 2.3]
    }
  ]
});
const timelyData = ref([
  {
    unit: "苏州",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "无锡",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "南京",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "常州",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "镇江",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "扬州",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "泰州",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "南通",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "盐城",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "淮安",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "宿迁",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  },
  {
    unit: "徐州",
    proNum: 100,
    proTimely: 20,
    timelyMoney: 100
  }
]);
const monitor = ref({ title: {
    text: '规范性监控'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {},
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    boundaryGap: [0, 0.01]
  },
  yAxis: {
    type: 'category',
    data: ['物资领用规范性', '物资整领整退', '物资退库率', '物资超欠供差额']
  },
  series: [
    {
      name: '项目数量',
      type: 'bar',
      data: [27, 42, 32, 23],
      barWidth: 20,
    }
  ]});
</script>

<template>
  <div class="container">
    <div class="nav">
      <div class="left">
        <div class="tabs">
          <div :class="['tab', 'one', oneTab ? 'tabClick' : '']" @click="leftClick('one')">
            <span>合计</span>
          </div>
          <div :class="['tab', twoTab ? 'tabClick' : '']" @click="leftClick('two')">
            <span>物资</span>
          </div>
          <div :class="['tab', 'two', threeTab ? 'tabClick' : '']" @click="leftClick('three')">
            <span>服务</span>
          </div>
        </div>
      </div>
      <div class="right">
        <div class="tabs">
          <div :class="['tab', 'one', unit ? 'tabClick' : '']" @click="rightClick('unit')">
            <span>单位</span>
          </div>
          <div :class="['tab', type ? 'tabClick' : '']" @click="rightClick('type')">
            <span>类型</span>
          </div>
        </div>
        <div class="select">
          <el-select v-model="hierarchy">
            <el-option label="全省" value="1"></el-option>
            <el-option label="市公司" value="2"></el-option>
            <el-option label="县公司" value="3"></el-option>
          </el-select>
        </div>
      </div>
    </div>
    <div class="main">
      <div class="left">
        <div class="erect">
          <div :class="['tab', 'one', power ? 'tabClick' : '']" @click="erectClick('one')">
            <span>供电公司</span>
          </div>
          <div :class="['tab', direct ? 'tabClick' : '']" @click="erectClick('two')">
            <span>直属单位</span>
          </div>
        </div>
      </div>
      <div class="right">
        <el-card>
          <div class="figure-left">
            <figure class="box">
              <v-chart :option="contractPieOne" />
            </figure>
            <figure class="box">
              <v-chart :option="contractPieTwo" />
            </figure>
          </div>
          <div class="figure-right">
            <figure>
              <v-chart style="width: 100%; height: 100%" :option="contract" />
            </figure>
          </div>
        </el-card>

        <div class="footer">
          <div class="footer-card">
            <el-card>
              <div class="footer-figure">
                <figure class="footer-echarts">
                  <div class="figure-box">
                    <h1>及时性监控</h1>
                    <div class="box" style="background-color: #c9f6fb">
                      <div class="title">
                        <h2 style="color: #5cc7d8">开工及时性</h2>
                      </div>
                      <div class="content">
                        <div class="content-font">
                          <span>异常项目数</span>
                          <span style="color: #56d0e6">{{ 147 }}</span>
                          <span>个</span>
                        </div>
                        <div class="content-font">
                          <span>异常金额</span>
                          <span style="color: #56d0e6">{{ 8500 }}</span>
                          <span>万元</span>
                        </div>
                      </div>
                    </div>
                    <div class="box" style="background-color: #f8d0d8">
                      <div class="title">
                        <h2 style="color: #e36688">物资到货及时性</h2>
                      </div>
                      <div class="content">
                        <div class="content-font">
                          <span>异常项目数</span>
                          <span style="color: #e66e82">{{ 147 }}</span>
                          <span>个</span>
                        </div>
                        <div class="content-font">
                          <span>异常金额</span>
                          <span style="color: #e66e82">{{ 8500 }}</span>
                          <span>万元</span>
                        </div>
                      </div>
                    </div>
                    <div class="box" style="background-color: #f7dcd1">
                      <div class="title">
                        <h2 style="color: #e38961">物资领用及时性</h2>
                      </div>
                      <div class="content">
                        <div class="content-font">
                          <span>异常项目数</span>
                          <span style="color: #e78f6b">{{ 147 }}</span>
                          <span>个</span>
                        </div>
                        <div class="content-font">
                          <span>异常金额</span>
                          <span style="color: #e78f6b">{{ 8500 }}</span>
                          <span>万元</span>
                        </div>
                      </div>
                    </div>
                    <div class="box" style="background-color: #e0f9e3">
                      <div class="title">
                        <h2 style="color: #70e284">竣工及时性</h2>
                      </div>
                      <div class="content">
                        <div class="content-font">
                          <span>异常项目数</span>
                          <span style="color: #66e67a">{{ 147 }}</span>
                          <span>个</span>
                        </div>
                        <div class="content-font">
                          <span>异常金额</span>
                          <span style="color: #66e67a">{{ 8500 }}</span>
                          <span>万元</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </figure>
                <figure class="footer-echarts footer-content">
                  <v-chart :option="line" />
                </figure>
              </div>
            </el-card>
          </div>
          <div class="footer-card" style="margin-left: 2%">
            <el-card>
              <div class="figure-bottom">
                <div class="footer-pie">
                  <v-chart :option="monitor"></v-chart>
                </div>
                <div class="footer-tables">
                  <el-table :data="timelyData" style="width: 100%; height: 100%; overflow: auto">
                    <el-table-column prop="unit" label="单位"></el-table-column>
                    <el-table-column prop="proTimely" label="异常数"></el-table-column>
                    <el-table-column prop="timelyMoney" label="异常金额"></el-table-column>
                  </el-table>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.container {
  width: 100%;

  .nav {
    width: 100%;
    height: 40px;
    margin-top: 10px;

    .left {
      float: left;
    }

    .right {
      display: flex;
      vertical-align: center;
      float: right;

      .select {
        border-radius: 50px;
        margin-left: 20px;
        width: 100px;
      }
    }
  }

  .main {
    width: 100%;
    margin-top: 10px;

    .left {
      float: left;

      .erect {
        width: 30px;
        display: flex;
        border-radius: 20px;
        flex-direction: column;

        .tab {
          width: 30px;
          line-height: 30px;
          text-align: center;
          cursor: pointer;

          span {
            font-size: 16px;
          }
        }
      }
    }

    .right {
      width: calc(100% - 70px);
      margin-left: 50px;

      .figure-left {
        float: left;

        .box {
          margin: 14px 0;
          border-radius: 10px;
          min-width: 325px;
          height: 200px;
        }
      }

      .figure-right {
        float: right;
        width: calc(100% - 405px);
        height: 100%;

        figure {
          width: 100%;
          position: relative;
          margin: 14px auto;
          border-radius: 8px;
          padding: 30px;
          height: 400px;
        }
      }

      .footer {
        width: 100%;
        margin-top: 20px;
        display: flex;

        .footer-card {
          width: 49%;
          height: 600px;

          .el-card {
            height: 94%;
          }
        }

        .footer-figure {
          display: flex;

          .footer-content {
            width: 70% !important;
            margin-top: 50px !important;
          }

          .footer-echarts {
            width: 30%;
            border-radius: 8px;
            margin: 0;

            .figure-echarts {
              width: calc(100% - 300px);
            }

            .figure-box {
              width: 300px;
              box-sizing: border-box;

              .box {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                width: 260px;
                margin: 10px;
                height: 100px;
                border-radius: 8px;
                box-shadow: 0 0 10px 4px rgba(0, 0, 0, 0.1);

                h2 {
                  font-size: 16px;
                  text-shadow: rgba(0, 0, 0, 0.6) 1px 1px 2px;
                }

                .content {
                  display: flex;
                  flex-direction: column;

                  .content-font {
                    display: flex;
                    align-items: center;

                    span {
                      font-size: 14px;
                      font-weight: 700;
                      margin: 0 8px;
                      text-align: center;
                    }
                  }
                }
              }

              h1 {
                font-size: 16px;
                margin-left: 20px;
                color: #57677d;
              }
            }
          }
        }
      }
    }
  }

  .tabClick {
    border-radius: 20px;
    background-color: #08ab94;
  }
}

.tabs {
  background-color: rgba(0, 0, 0, 0.1);
  height: 30px;
  display: flex;
  border-radius: 20px;

  .tab {
    width: 80px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    cursor: pointer;

    span {
      font-size: 16px;
    }
  }
}

.figure-bottom {
  display: flex;
  width: 100%;
  height: 100%;
  margin-top: 20px;

  .footer-pie {
    width: 50%;
    height: 500px;
  }

  .footer-tables {
    width: 50%;
    height: 100%;
    overflow: auto;
  }
}
</style>
