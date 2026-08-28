<script setup lang="ts">
import { onMounted, ref } from "vue";

const oneTab = ref(true);
const twoTab = ref(false);
const leftClick = (name: string) => {
  if (name === "one") {
    oneTab.value = true;
    twoTab.value = false;
  } else if (name === "two") {
    oneTab.value = false;
    twoTab.value = true;
  }
};
const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);

const timerYear: any = ref([]);
const timerMonth: any = ref([]);

const BarOneUnit = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      crossStyle: {
        color: "#999"
      }
    }
  },
  grid: {
    top: "30%",
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true
  },
  title: {
    text: "正式增资情况-单位"
  },
  legend: {
    data: ["应增资项目数量", "已增资项目数量", "完成占比"]
  },
  xAxis: [
    {
      type: "category",
      data: ["苏州", "南京", "无锡", "常州", "扬州", "镇江", "泰州", "南通", "盐城", "淮安", "宿迁", "徐州", "连云港"],
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
      max: 50,
      interval: 10,
      axisLabel: {
        formatter: "{value}"
      }
    }
  ],
  series: [
    {
      name: "应增资项目数量",
      type: "bar",
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 10.6, 130.2, 32.6, 20.0, 6.4, 3.3, 2.0]
    },
    {
      name: "已增资项目数量",
      type: "bar",
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 120.6, 18.2, 48.7, 18.8, 6.0, 2.3, 3.0]
    },
    {
      name: "完成占比",
      type: "line",
      yAxisIndex: 1,
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2, 3.0]
    }
  ]
});
const BarOnePro = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      crossStyle: {
        color: "#999"
      }
    }
  },
  grid: {
    top: "30%",
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true
  },
  title: {
    text: "正式增资情况-项目"
  },
  legend: {
    data: ["应增资项目数量", "已增资项目数量", "完成占比"]
  },
  xAxis: [
    {
      type: "category",
      data: ["苏州", "南京", "无锡", "常州", "扬州", "镇江", "泰州", "南通", "盐城", "淮安", "宿迁", "徐州", "连云港"],
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
      max: 50,
      interval: 10,
      axisLabel: {
        formatter: "{value}"
      }
    }
  ],
  series: [
    {
      name: "应增资项目数量",
      type: "bar",
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 10.6, 130.2, 32.6, 20.0, 6.4, 3.3, 2.0]
    },
    {
      name: "已增资项目数量",
      type: "bar",
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 120.6, 18.2, 48.7, 18.8, 6.0, 2.3, 3.0]
    },
    {
      name: "完成占比",
      type: "line",
      yAxisIndex: 1,
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2, 3.0]
    }
  ]
});

const BarTwoUnit = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      crossStyle: {
        color: "#999"
      }
    }
  },
  grid: {
    top: "30%",
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true
  },
  title: {
    text: "增资及时性异常-单位"
  },
  legend: {
    data: ["应增资项目数量", "已增资项目数量", "完成占比"]
  },
  xAxis: [
    {
      type: "category",
      data: ["苏州", "南京", "无锡", "常州", "扬州", "镇江", "泰州", "南通", "盐城", "淮安", "宿迁", "徐州", "连云港"],
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
      max: 50,
      interval: 10,
      axisLabel: {
        formatter: "{value}"
      }
    }
  ],
  series: [
    {
      name: "及时性支付异常金额",
      type: "bar",
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 10.6, 130.2, 32.6, 20.0, 6.4, 3.3, 2.0]
    },
    {
      name: "及时性支付异常数量",
      type: "bar",
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 120.6, 18.2, 48.7, 18.8, 6.0, 2.3, 3.0]
    },
    {
      name: "及时性支付占比",
      type: "line",
      yAxisIndex: 1,
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2, 3.0]
    }
  ]
});
const BarTwoPro = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      crossStyle: {
        color: "#999"
      }
    }
  },
  grid: {
    top: "30%",
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true
  },
  title: {
    text: "增资及时性异常-项目"
  },
  legend: {
    data: ["应增资项目数量", "已增资项目数量", "完成占比"]
  },
  xAxis: [
    {
      type: "category",
      data: ["苏州", "南京", "无锡", "常州", "扬州", "镇江", "泰州", "南通", "盐城", "淮安", "宿迁", "徐州", "连云港"],
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
      max: 50,
      interval: 10,
      axisLabel: {
        formatter: "{value}"
      }
    }
  ],
  series: [
    {
      name: "及时性支付异常金额",
      type: "bar",
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [10, 5, 20.0, 23.2, 25.6, 76.7, 135.6, 80.2, 32.6, 20.0, 6.4, 3.3, 2.0]
    },
    {
      name: "及时性支付异常数量",
      type: "bar",
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.6, 5.9, 120.0, 26.4, 28.7, 70.7, 140.6, 120.2, 48.7, 18.8, 6.0, 2.3, 3.0]
    },
    {
      name: "及时性支付占比",
      type: "line",
      yAxisIndex: 1,
      tooltip: {
        valueFormatter: function (value) {
          return value;
        }
      },
      data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2, 3.0]
    }
  ]
});
// 生成前后5年
const generateYear = () => {
  const year = new Date().getFullYear();
  for (let i = year - 5; i <= year + 5; i++) {
    timerYear.value.push({
      label: `${i}年`,
      year: i
    });
  }
};

// 生成月份
const generateMonth = () => {
  for (let i = 1; i <= 12; i++) {
    timerMonth.value.push({
      label: `${i}月`,
      month: i
    });
  }
};

const unitData = ref("常州");
const classifyData = ref("资本性");
const typeData = ref("全部");

const unitsData = ref([
  {
    label: "常州",
    value: "常州"
  },
  {
    label: "南京",
    value: "南京"
  },
  {
    label: "苏州",
    value: "苏州"
  },
  {
    label: "无锡",
    value: "无锡"
  },
  {
    label: "镇江",
    value: "镇江"
  },
  {
    label: "扬州",
    value: "扬州"
  },
  {
    label: "泰州",
    value: "泰州"
  },
  {
    label: "南通",
    value: "南通"
  },
  {
    label: "盐城",
    value: "盐城"
  },
  {
    label: "淮安",
    value: "淮安"
  },
  {
    label: "宿迁",
    value: "宿迁"
  },
  {
    label: "徐州",
    value: "徐州"
  }
]);

const classifysData = ref([
  {
    label: "资本性",
    value: "资本性"
  },
  {
    label: "非资本性",
    value: "非资本性"
  }
]);

const typesData = ref([
  {
    label: "全部",
    value: "全部"
  },
  {
    label: "工程",
    value: "工程"
  },
  {
    label: "设备",
    value: "设备"
  },
  {
    label: "材料",
    value: "材料"
  },
  {
    label: "其他",
    value: "其他"
  }
]);

onMounted(() => {
  generateYear();
  generateMonth();
});

const onePane = ref("first");
const proType = ref("大中型基建");
const proTypes = ref([
  {
    label: "大中型基建",
    value: "大中型基建"
  },
  {
    label: "小型基建",
    value: "小型基建"
  },
  {
    label: "其他",
    value: "其他"
  }
]);
</script>

<template>
  <div class="container">
    <div class="search">
      <div class="select">
        <sapn>单位选择</sapn>
        <el-select v-model="unitData">
          <el-option v-for="item in unitsData" :label="item.label" :value="item.value" :key="item.value"></el-option>
        </el-select>
      </div>
      <div class="select">
        <sapn>项目分类</sapn>
        <el-select v-model="classifyData">
          <el-option v-for="item in classifysData" :label="item.label" :value="item.value" :key="item.value"></el-option>
        </el-select>
      </div>
      <div class="select">
        <sapn>项目类型</sapn>
        <el-select v-model="typeData">
          <el-option v-for="item in typesData" :label="item.label" :value="item.value" :key="item.value"></el-option>
        </el-select>
      </div>
    </div>
    <div class="nav">
      <div class="left">
        <div class="tabs">
          <div :class="['tab', 'one', oneTab ? 'tabClick' : '']" @click="leftClick('one')">
            <span>正式增资情况</span>
          </div>
          <div :class="['tab', twoTab ? 'tabClick' : '']" @click="leftClick('two')">
            <span>增资及时性异常</span>
          </div>
        </div>
      </div>
      <div class="right">
        <div class="timer">
          <span>报告期</span>
          <el-select class="timer-select" v-model="year">
            <el-option v-for="item in timerYear" :label="item.label" :value="item.year" :key="item.year"></el-option>
          </el-select>
          <el-select class="timer-select" v-model="month">
            <el-option v-for="item in timerMonth" :label="item.label" :value="item.month" :key="item.month"></el-option>
          </el-select>
        </div>
      </div>
    </div>
    <div v-if="oneTab" class="main">
      <div class="left">
        <div class="card">
          <el-card class="oneCard">
            <div class="title">
              <h1>{{ new Date().getFullYear() }}年项目总体情况</h1>
            </div>
            <div class="content">
              <div class="left">
                <img src="@/assets/images/img1.png" alt="" />
              </div>
              <div class="right">
                <div class="right-one">
                  <div class="right-one-content">
                    <span>开工项目</span>
                    <span>102</span>
                    <span>个</span>
                  </div>
                  <div class="right-one-content">
                    <span>竣工项目</span>
                    <span>758</span>
                    <span>个</span>
                  </div>
                </div>
                <div class="right-content">
                  <div class="right-content-box">
                    <div class="right-content-box-content big-font">
                      <span>当年财务结算</span>
                      <span>102</span>
                      <span>亿元</span>
                    </div>
                    <div class="right-content-box-content">
                      <span>资本项目</span>
                      <span>102</span>
                      <span>亿元</span>
                    </div>
                    <div class="right-content-box-content">
                      <span>成本项目</span>
                      <span>102</span>
                      <span>亿元</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      <div class="right">
        <div class="oneCard">
          <el-card>
            <div class="figure-right">
              <div class="tabPane">
                <el-tabs v-model="onePane">
                  <el-tab-pane label="供电分公司" name="first"></el-tab-pane>
                  <el-tab-pane label="直属单位" name="second"></el-tab-pane>
                </el-tabs>
              </div>
              <v-chart :option="BarOneUnit"></v-chart>
            </div>
          </el-card>
        </div>
        <div class="twoCard">
          <el-card>
            <div class="figure-right">
              <div class="tabPane">
                <el-tabs>
                  <el-tab-pane label="资本" name="first"></el-tab-pane>
                  <el-tab-pane label="成本" name="second"></el-tab-pane>
                </el-tabs>
                <el-select v-model="proType" class="select">
                  <el-option v-for="item in proTypes" :label="item.label" :value="item.value" :key="item.value"></el-option>
                </el-select>
              </div>
              <v-chart :option="BarOnePro"></v-chart>
            </div>
          </el-card>
        </div>
      </div>
    </div>
    <div v-if="twoTab" class="main">
      <div class="left">
        <div class="card">
          <el-card class="oneCard">
            <div class="title">
              <h1>{{ new Date().getFullYear() }}年项目总体情况</h1>
            </div>
            <div class="content">
              <div class="left">
                <img src="@/assets/images/img1.png" alt="" />
              </div>
              <div class="right">
                <div class="right-one">
                  <div class="right-one-content">
                    <span>开工项目</span>
                    <span>102</span>
                    <span>个</span>
                  </div>
                  <div class="right-one-content">
                    <span>竣工项目</span>
                    <span>758</span>
                    <span>个</span>
                  </div>
                </div>
                <div class="right-content">
                  <div class="right-content-box">
                    <div class="right-content-box-content big-font">
                      <span>当年财务结算</span>
                      <span>102</span>
                      <span>亿元</span>
                    </div>
                    <div class="right-content-box-content">
                      <span>资本项目</span>
                      <span>102</span>
                      <span>亿元</span>
                    </div>
                    <div class="right-content-box-content">
                      <span>成本项目</span>
                      <span>102</span>
                      <span>亿元</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
        <div class="card">
          <el-card class="twoCard">
            <div class="title">
              <h1>{{ new Date().getFullYear() }}年全支付及时性监控</h1>
            </div>
            <div class="content">
              <div class="left" style="padding: 0">
                <img src="@/assets/images/img1.png" alt="" />
              </div>
              <div class="right">
                <div class="right-one">
                  <div class="right-one-content">
                    <span>支付及时性异常</span>
                    <span>102</span>
                    <span>个</span>
                  </div>
                  <div class="right-one-content">
                    <span>合计</span>
                    <span>758</span>
                    <span>亿元</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      <div class="right">
        <div class="oneCard">
          <el-card>
            <div class="figure-right">
              <div class="tabPane">
                <el-tabs v-model="onePane">
                  <el-tab-pane label="供电公司" name="first"></el-tab-pane>
                  <el-tab-pane label="直属单位" name="second"></el-tab-pane>
                </el-tabs>
              </div>
              <v-chart :option="BarTwoUnit"></v-chart>
            </div>
          </el-card>
        </div>
        <div class="twoCard">
          <el-card>
            <div class="figure-right">
              <div class="tabPane">
                <el-tabs>
                  <el-tab-pane label="资本" name="first"></el-tab-pane>
                  <el-tab-pane label="成本" name="second"></el-tab-pane>
                </el-tabs>
                <el-select v-model="proType" class="select">
                  <el-option v-for="item in proTypes" :label="item.label" :value="item.value" :key="item.value"></el-option>
                </el-select>
              </div>
              <v-chart :option="BarTwoPro"></v-chart>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.container {
  width: 100%;

  .search {
    width: 100%;
    height: 40px;
    display: flex;
    margin-top: 10px;

    .select {
      margin-right: 20px;

      .el-select {
        width: 100px;
        margin-left: 20px;
      }
    }
  }

  .nav {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    height: 40px;
    margin-top: 10px;

    .left {
      width: 180px;
    }

    .right {
      width: calc(100% - 180px);
      display: flex;
      justify-content: flex-end;
      vertical-align: center;

      .timer {
        font-size: 16px;
        font-weight: 700;
        margin-right: 60px;

        .timer-select {
          border: 1px solid #08ab94;
          border-radius: 4px;
          width: 100px;
          margin-left: 10px;
        }
      }
    }
  }

  .main {
    width: 100%;
    margin-top: 10px;

    .left {
      float: left;
      width: 400px;
      margin-right: 40px;

      .card {
        width: 100%;
        height: 100%;
        background-color: white;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        padding: 20px;

        .title {
          height: 40px;

          h1 {
            font-size: 18px;
            font-weight: 700;
            color: white;
            text-align: center;
            padding-top: 10px;
          }
        }

        .content {
          width: 100%;
          height: 210px;

          .left {
            margin: 0;
            width: 100px;
            height: 100%;
            padding-top: 40px;

            img {
              width: 100px;
            }
          }

          .right {
            width: calc(100% - 100px);
            height: 100%;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;

            .right-one {
              box-sizing: border-box;
              width: 200px;

              &-content {
                display: flex;
                justify-content: space-between;
                padding: 10px 20px;

                span {
                  font-size: 14px;
                  font-weight: 700;
                  color: white;
                }
              }
            }
          }

          .right-content {
            width: 220px;
            background-color: rgba(0, 0, 0, 0.1);

            .right-content-box {
              padding: 10px 0;

              .big-font {
                font-weight: 700;

                span {
                  font-size: 16px;
                }

                span:nth-child(2) {
                  padding-right: 36px;
                }
              }

              &-content {
                padding: 4px 10px;
                display: flex;
                justify-content: space-between;

                span {
                  font-size: 14px;
                  color: white;
                }
              }
            }
          }
        }

        .oneCard {
          background: linear-gradient(#5de1af, #36baa3);
          height: 300px;
          margin-bottom: 10px;
          border-radius: 10px;
        }

        .twoCard {
          background: linear-gradient(#45e1ee, #29b5e7);
          border-radius: 10px;
          height: 200px;
        }
      }
    }

    .right {
      width: calc(100% - 440px);
      margin-left: 50px;
      display: flex;
      flex-direction: column;

      .twoCard {
        margin-top: 20px;
      }

      .figure-left {
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 400px;
        float: left;

        .box {
          border-radius: 10px;
          min-width: 300px;
          min-height: 160px;

          .title {
            font-size: 18px;
            font-weight: 700;
            text-align: center;
            color: white;
            padding-top: 10px;
          }
        }
      }

      .figure-right {
        position: relative;
        float: right;
        width: 100%;
        height: 400px;
      }

      .tabPane {
        z-index: 999;
        display: flex;
        align-items: center;
        position: absolute;
        top: 20px;
        left: 0;

        .select {
          width: 120px;
          margin-left: 20px;
        }
      }
    }

    .echarts-box {
      margin-top: 20px;
      margin-left: 50px;
      min-height: 310px;

      .bottom-box {
        height: 300px;

        figure {
          height: 300px;
        }
      }

      .el-card {
        width: 49%;
        float: left;
        min-height: 300px;
      }

      .audit {
        margin-left: 24px;
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
  margin-right: 20px;
  width: 220px;

  .tab {
    width: 220px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    cursor: pointer;

    span {
      font-size: 14px;
    }
  }
}


</style>
