<script setup lang="ts">
import { onMounted, ref } from "vue";
import VChart from "vue-echarts";

const oneTab = ref(true);
const twoTab = ref(false);
const threeTab = ref(false);
const power = ref(true);
const direct = ref(false);
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
const erectClick = (name: string) => {
  if (name === "one") {
    power.value = true;
    direct.value = false;
  } else if (name === "two") {
    power.value = false;
    direct.value = true;
  }
};
const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);

const timerYear: any = ref([]);
const timerMonth: any = ref([]);
const abnormal = ref({
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
        { value: 1048, name: "项目总数" },
        { value: 735, name: "异常数" }
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
    data: ["储备金额", "立项金额"],
    right: "0"
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
    }
  ],
  series: [
    {
      name: "储备金额",
      type: "bar",
      tooltip: {
        valueFormatter: function (value: string) {
          return value;
        }
      },
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
    },
    {
      name: "立项金额",
      type: "bar",
      tooltip: {
        valueFormatter: function (value: string) {
          return value;
        }
      },
      data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3]
    }
  ]
});

// 生成月份
const generateMonth = () => {
  for (let i = 1; i <= 12; i++) {
    timerMonth.value.push({
      label: `${i}月`,
      month: i
    });
  }
};

onMounted(() => {
  generateYear();
  generateMonth();
});
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
        <div class="timer">
          <span>填报时间</span>
          <el-select class="timer-select" v-model="year">
            <el-option v-for="item in timerYear" :label="item.label" :value="item.year" :key="item.year"></el-option>
          </el-select>
          <el-select class="timer-select" v-model="month">
            <el-option v-for="item in timerMonth" :label="item.label" :value="item.month" :key="item.month"></el-option>
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
        <div class="card-content">
          <el-card class="first-card">
            <div class="figure-left">
              <figure class="box" style="background: linear-gradient(#36baa3, #54d9ac)">
                <div class="title">
                  <span>{{ new Date().getFullYear() }}年全省年度合同签订</span>
                </div>
                <div class="content">
                  <div class="right-box">
                    <div class="img">
                      <img src="@/assets/images/money.png" alt="" />
                    </div>
                    <div class="right-content">
                      <span>采购合同金额</span>
                      <span>102</span>
                      <span>亿元</span>
                    </div>
                  </div>
                  <div class="right-box">
                    <div class="img">
                      <img src="@/assets/images/table.png" alt="" />
                    </div>
                    <div class="right-content">
                      <span>占年度预算占比</span>
                      <span>99</span>
                      <span>%</span>
                    </div>
                  </div>
                </div>
              </figure>
              <figure class="box" style="background: linear-gradient(#526bfb, #89a7fd)">
                <div class="title">
                  <span>{{ new Date().getFullYear() }}年全省年度合同签订</span>
                </div>
                <div class="content">
                  <div class="right-box">
                    <div class="img">
                      <img src="@/assets/images/money.png" alt="" />
                    </div>
                    <div class="right-content">
                      <span>采购合同金额</span>
                      <span>102</span>
                      <span>亿元</span>
                    </div>
                  </div>
                  <div class="right-box">
                    <div class="img">
                      <img src="@/assets/images/table.png" alt="" />
                    </div>
                    <div class="right-content">
                      <span>占年度预算占比</span>
                      <span>99</span>
                      <span>%</span>
                    </div>
                  </div>
                </div>
              </figure>
              <figure class="box" style="background: linear-gradient(#22b2e7, #43dae7)">
                <div class="title">
                  <span>{{ new Date().getFullYear() }}年全省年度合同签订</span>
                </div>
                <div class="content">
                  <div class="right-box">
                    <div class="img">
                      <img src="@/assets/images/money.png" alt="" />
                    </div>
                    <div class="right-content">
                      <span>采购合同金额</span>
                      <span>102</span>
                      <span>亿元</span>
                    </div>
                  </div>
                  <div class="right-box">
                    <div class="img">
                      <img src="@/assets/images/table.png" alt="" />
                    </div>
                    <div class="right-content">
                      <span>占年度预算占比</span>
                      <span>99</span>
                      <span>%</span>
                    </div>
                  </div>
                </div>
              </figure>
            </div>
          </el-card>
          <el-card class="sec-card">
            <div class="figure-right">
              <div class="figure-top">
                <v-chart :option="barUnit" />
                <div class="tips">
                  <div class="title">
                    <span>提报项目</span>
                  </div>
                </div>
              </div>

              <div class="figure-bottom">
                <div class="footer-pie">
                  <v-chart :option="abnormal" />
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

      .erect {
        width: 30px;
        display: flex;
        border-radius: 20px;
        background-color: rgba(0, 0, 0, 0.1);
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
        float: right;
        width: 100%;
        height: 100%;

        .figure-top {
          position: relative;
          width: 100%;
          height: 300px;

          .tips {
            position: absolute;
            bottom: 3%;
            left: 0;
            width: 100%;
            height: 20px;
            display: flex;

            .tips-content {
              display: flex;
              justify-content: space-between;
              align-items: center;

              span:first-of-type {
                margin-left: 28px;
              }

              span {
                text-align: center;
                width: 60px;
              }
            }

            span {
              font-size: 16px;
              font-weight: 700;
              color: #0c6f67;
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

.box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;

  .content {
    margin-top: 20px;
  }
}

.right-box {
  display: flex;
  margin-top: 10px;
  align-items: center;
  margin-left: 30px;

  .img {
    width: 30px;
    height: 30px;
    background-color: #08ab94;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .right-content {
    padding-left: 30px;
  }

  span {
    padding: 0 10px;
    font-size: 14px;
    font-weight: 700;
    color: white;
  }
}

.card-content {
  display: flex;

  .first-card {
    width: 30%;
  }

  .sec-card {
    margin-left: 10px;
    width: 68%;
  }
}

.figure-bottom {
  display: flex;
  width: 100%;
  height: 300px;
  margin-top: 20px;

  .footer-pie {
    width: 50%;
    height: 100%;
  }

  .footer-tables {
    width: 50%;
    height: 100%;
    overflow: auto;
  }
}
</style>
