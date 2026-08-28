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
// 10, 22, 33, 22, 11, 23, 32, 22, 33, 23, 22, 33, 32
const submitPro = ref([
  {
    name: "苏州",
    value: 10
  },
  {
    name: "无锡",
    value: 22
  },
  {
    name: "南京",
    value: 33
  },
  {
    name: "常州",
    value: 22
  },
  {
    name: "镇江",
    value: 11
  },
  {
    name: "扬州",
    value: 23
  },
  {
    name: "泰州",
    value: 32
  },
  {
    name: "南通",
    value: 22
  },
  {
    name: "盐城",
    value: 33
  },
  {
    name: "淮安",
    value: 23
  },
  {
    name: "宿迁",
    value: 22
  },
  {
    name: "徐州",
    value: 33
  }
]);
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
const contract = ref({
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
    data: ["提报金额", "中标金额"],
    right: "8%"
  },
  xAxis: [
    {
      type: "category",
      data: ["苏州", "无锡", "南京", "常州", "镇江", "扬州", "泰州", "南通", "盐城", "淮安", "宿迁", "徐州"],
      axisLabel: {
        formatter: function (value: string) {
          submitPro.value.forEach((item) => {
            if (item.name === value) {
              value = value + "\n\n\n\n{a|" + item.value + "}";
            }
          });
          return value;
        },
        rich: {
          a: {
            fontSize: 16,
            align: "center",
            fontWeight: "bold",
            color: "#0c6f67"
          }
        }
      },
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
      name: "提报金额",
      type: "bar",
      tooltip: {
        valueFormatter: function (value:string) {
          return value;
        }
      },
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
    },
    {
      name: "中标金额",
      type: "bar",
      tooltip: {
        valueFormatter: function (value:string) {
          return value;
        }
      },
      data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3]
    }
  ]
});
const contractPieOne = ref({
  tooltip: {
    trigger: "item"
  },
  title: {
    text: "招投标及时性",
    left: "center",
    textStyle: {
      fontSize: 14
    }
  },
  legend: {
    top: "center",
    left: "center",
    data: ["项目总数", "异常数"],
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
        { value: 580, name: "异常数" }
      ]
    }
  ]
});
const contractPieTwo = ref({
  tooltip: {
    trigger: "item"
  },
  title: {
    text: "中标下达及时性",
    left: "center",
    textStyle: {
      fontSize: 14
    }
  },
  legend: {
    top: "center",
    left: "center",
    data: ["项目总数", "异常数"],
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
        { value: 580, name: "异常数" }
      ]
    }
  ]
});
const abnormal = ref({
  title: {
    text: "招投标差异异常",
    left: "center",
    textStyle: {
      fontSize: 14
    }
  },
  tooltip: {
    trigger: "item"
  },
  legend: {
    top: "bottom",
    left: "center"
  },
  series: [
    {
      name: "招投标差异异常",
      type: "pie",
      radius: ["50%", "70%"],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: "center"
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 1048, name: "苏州" },
        { value: 735, name: "无锡" },
        { value: 580, name: "常州" },
        { value: 484, name: "南京" },
        { value: 300, name: "镇江" },
        { value: 200, name: "扬州" }
      ]
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
            <figure class="box" style="background: linear-gradient(#45e1ee, #22b2e7)">
              <div class="title">
                <span>{{ new Date().getFullYear() }}年全省招投标</span>
              </div>
              <div class="content">
                <div class="left">
                  <img src="@/assets/images/img1.png" alt="" />
                </div>
                <div class="right">
                  <div class="right-box">
                    <span>提报金额</span>
                    <span>102</span>
                    <span>亿元</span>
                  </div>
                  <div class="right-box">
                    <span>中标金额</span>
                    <span>89</span>
                    <span>亿元</span>
                  </div>
                </div>
              </div>
            </figure>
            <figure class="box" style="background: linear-gradient(#527efb, #3d6cf8)">
              <div class="title">
                <span>{{ new Date().getFullYear() }}年全省项目化招投标</span>
              </div>
              <div class="content">
                <div class="left">
                  <img src="@/assets/images/img1.png" alt="" />
                </div>
                <div class="right">
                  <div class="right-box">
                    <span>提报项目</span>
                    <span>102</span>
                    <span>个</span>
                  </div>
                  <div class="right-box">
                    <span>提报金额</span>
                    <span>102</span>
                    <span>亿元</span>
                  </div>
                  <div class="right-box">
                    <span>中标金额</span>
                    <span>89</span>
                    <span>亿元</span>
                  </div>
                </div>
              </div>
            </figure>
            <figure class="box" style="background: linear-gradient(#5ce0ae, #34b8a1)">
              <div class="title">
                <span>{{ new Date().getFullYear() }}年全省通用招投标</span>
              </div>
              <div class="content">
                <div class="left">
                  <img src="@/assets/images/img1.png" alt="" />
                </div>
                <div class="right">
                  <div class="right-box">
                    <span>提报金额</span>
                    <span>102</span>
                    <span>亿元</span>
                  </div>
                  <div class="right-box">
                    <span>中标金额</span>
                    <span>89</span>
                    <span>亿元</span>
                  </div>
                </div>
              </div>
            </figure>
          </div>
          <div class="figure-right">
            <h1>招投标信息总体情况</h1>
            <div class="figure-main">
              <figure>
                <v-chart style="width: 100%; height: 100%" :option="contract" />
              </figure>
              <div class="tips">
                <div class="title">
                  <span>提报项目</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <div class="footer">
          <el-card>
            <div class="footer-figure">
              <figure class="footer-echarts">
                <div class="footer-main">
                  <div class="footer-pie">
                    <v-chart :option="contractPieOne" />
                  </div>
                  <div class="footer-tables">
                    <el-table :data="timelyData" style="width: 100%; height: 100%; overflow: auto">
                      <el-table-column prop="unit" label="单位"></el-table-column>
                      <el-table-column prop="proNum" label="项目总数"></el-table-column>
                      <el-table-column prop="proTimely" label="项目异常数"></el-table-column>
                      <el-table-column prop="timelyMoney" label="异常金额"></el-table-column>
                    </el-table>
                  </div>
                </div>
                <div class="footer-main">
                  <div class="footer-pie">
                    <v-chart :option="contractPieTwo" />
                  </div>
                  <div class="footer-tables">
                    <el-table :data="timelyData" style="width: 100%; height: 100%; overflow: auto">
                      <el-table-column prop="unit" label="单位"></el-table-column>
                      <el-table-column prop="proNum" label="项目总数"></el-table-column>
                      <el-table-column prop="proTimely" label="项目异常数"></el-table-column>
                      <el-table-column prop="timelyMoney" label="异常金额"></el-table-column>
                    </el-table>
                  </div>
                </div>
              </figure>
              <figure class="footer-echarts">
                <div class="footer-main footer-right">
                  <v-chart :option="abnormal" />
                  <div class="footer-tables">
                    <el-table :data="timelyData" style="width: 100%; height: 100%; overflow: auto">
                      <el-table-column prop="unit" label="单位"></el-table-column>
                      <el-table-column prop="proTimely" label="异常数"></el-table-column>
                      <el-table-column prop="timelyMoney" label="异常金额"></el-table-column>
                    </el-table>
                  </div>
                </div>
              </figure>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
img {
  width: 80px;
}

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

      .content {
        display: flex;
        box-sizing: border-box;

        .left {
          width: 30%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .right {
          width: 70%;
          margin: auto;
        }
      }

      .figure-left {
        float: left;

        .box {
          border-radius: 10px;
          min-width: 325px;
          height: 120px;
          box-sizing: border-box;

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
        float: right;
        position: relative;
        width: calc(100% - 405px);
        height: 100%;

        h1 {
          top: 0;
          left: 0;
          position: absolute;
          font-size: 16px;
        }

        figure {
          width: 100%;
          position: relative;
          margin: 0 auto;
          margin-top: 80px;
          border-radius: 8px;
          height: 300px;
        }

        .figure-main {
          position: relative;
          .tips {
            left: 0;
            bottom: 0;
            position: absolute;
            width: 80px;
            height: 20px;
            display: flex;
            font-size: 16px;
            font-weight: 700;
            color: #0c6f67;
          }
        }


      }

      .footer {
        width: 100%;
        margin-top: 20px;

        .footer-figure {
          display: flex;
          justify-content: space-between;

          .footer-echarts {
            width: 48%;
            height: 400px;
            border-radius: 8px;

            .footer-main {
              display: flex;
              height: 50%;

              .footer-pie {
                width: 32%;
                height: 100%;
              }

              .footer-tables {
                width: 68%;
                height: 100%;
              }
            }

            .footer-right {
              display: flex;
              align-items: center;
              height: 100%;
            }

            .right-pie {
              height: 200px !important;
              display: flex;
              justify-content: center;
              align-items: center;
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

.right-box {
  display: flex;
  justify-content: space-between;
  padding: 4px 20px;
  color: white;

  span {
    font-size: 16px;
    font-weight: 700;
  }
}
</style>
