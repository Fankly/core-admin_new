<script setup lang="ts">
import { onMounted, ref } from "vue";

const oneTab = ref(true);
const twoTab = ref(false);
const oneCopmpany = ref(true);
const twoCopmpany = ref(false);
const oneCapital = ref(true);
const twoCapital = ref(false);
const capitalClick = (name: string) => {
  if (name === "one") {
    oneCapital.value = true;
    twoCapital.value = false;
  } else if (name === "two") {
    oneCapital.value = false;
    twoCapital.value = true;
  }
};
const companyClick = (name: string) => {
  if (name === "one") {
    oneCopmpany.value = true;
    twoCopmpany.value = false;
  } else if (name === "two") {
    oneCopmpany.value = false;
    twoCopmpany.value = true;
  }
};
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
    data: ["送审金额", "送审数量"],
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
          return value;
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
      name: "送审金额",
      type: "bar",
      tooltip: {
        valueFormatter: function (value: string) {
          return value;
        }
      },
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
    },
    {
      name: "送审数量",
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
    data: ["送审金额", "送审数量"],
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
      data: [
        "营销零购项目",
        "生产零购项目",
        "基建零购项目",
        "调度零购项目",
        "通信零购项目",
        "安措零购项目",
        "科技零购项目",
        "信息零购项目",
        "综合后勤零购项目",
        "培训零购项目",
        "规划零购项目",
        "资产零购项目",
        "调度零购项目",
        "通信零购项目",
        "安措零购项目",
        "科技零购项目",
        "信息零购项目",
        "综合后勤零购项目",
        "培训零购项目",
        "规划零购项目",
        "资产零购项目"
      ],
      axisLabel: {
        interval: 0,
        rotate: 40,
        formatter: function (value: string) {
          return value;
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
      name: "送审金额",
      type: "bar",
      tooltip: {
        valueFormatter: function (value: string) {
          return value;
        }
      },
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3, 2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6]
    },
    {
      name: "送审数量",
      type: "bar",
      tooltip: {
        valueFormatter: function (value: string) {
          return value;
        }
      },
      data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3, 2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7]
    }
  ]
});
const barPromptly = ref({
  title: {
    text: "审计及时性监控"
  },
  tooltip: {
    trigger: "axis"
  },
  legend: {
    data: ["送审及时异常性", "审计审定及时异常性"]
  },
  grid: {
    left: "3%",
    right: "4%",
    containLabel: true
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    axisLabel: {
      interval: 0,
      rotate: 40,
      formatter: function (value: string) {
        return value;
      }
    },
    data: ["常州供电所", "镇江供电所", "扬州供电所", "泰州供电所", "南通供电所", "盐城供电所", "淮安供电所", "宿迁供电所", "徐州供电所", "苏州供电所", "无锡供电所", "南京供电所", "连云港供电所"]
  },
  yAxis: {
    type: "value"
  },
  series: [
    {
      name: "送审及时异常性",
      type: "line",
      data: [1200, 2000, 1500, 800, 1000, 1200, 2000, 1500, 800, 1000, 1200, 2000, 1500]
    },
    {
      name: "审计审定及时异常性",
      type: "line",
      data: [1000, 1500, 800, 1000, 1200, 2000, 1500, 800, 1000, 3000, 2000, 1500, 4000]
    }
  ]
});
const barAudit = ref({
  title: {
    text: "审计规范性监控"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: "#6a7985"
      }
    }
  },
  grid: {
    left: "3%",
    right: "1%",
    containLabel: true
  },
  xAxis: [
    {
      type: "category",
      boundaryGap: false,
      axisLabel: {
        interval: 0,
        rotate: 40,
        formatter: function (value: string) {
          return value;
        }
      },
      data: ["常州供电所", "镇江供电所", "扬州供电所", "泰州供电所", "南通供电所", "盐城供电所", "淮安供电所", "宿迁供电所", "徐州供电所", "苏州供电所", "无锡供电所", "南京供电所", "连云港供电所"]
    }
  ],
  yAxis: [
    {
      type: "value"
    }
  ],
  series: [
    {
      type: "line",
      smooth: true,
      areaStyle: {},
      emphasis: {
        focus: "series"
      },
      data: [1200, 2000, 1500, 800, 1000, 1200, 2000, 1500, 800, 1000, 1200, 2000, 1500]
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

onMounted(() => {
  generateYear();
  generateMonth();
});
</script>

<template>
  <div class="container">
    <div class="nav">
      <div class="left"></div>
      <div class="right">
        <div class="tabs">
          <div :class="['tab', 'one', oneTab ? 'tabClick' : '']" @click="leftClick('one')">
            <span>送审情况</span>
          </div>
          <div :class="['tab', twoTab ? 'tabClick' : '']" @click="leftClick('two')">
            <span>审定情况</span>
          </div>
        </div>
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
        <div class="erect"></div>
      </div>
      <div class="right">
        <el-card>
          <div class="figure-left">
            <figure class="box" style="background: linear-gradient(#36baa3, #54d9ac)">
              <div class="title">
                <div>
                  <span>{{ new Date().getFullYear() }}年度{{ new Date().getMonth() + 1 }}月份{{ "徐州" }}省(市)</span>
                </div>
                <div>
                  <span>项目审定汇总</span>
                </div>
              </div>
              <div class="content">
                <div class="right-box">
                  <div class="img">
                    <img src="@/assets/images/money.png" alt="" />
                  </div>
                  <div class="right-content">
                    <span>送审金额</span>
                    <span>102</span>
                    <span>万元</span>
                  </div>
                </div>
                <div class="right-box">
                  <div class="img">
                    <img src="@/assets/images/table.png" alt="" />
                  </div>
                  <div class="right-content">
                    <span>送审数量</span>
                    <span>99</span>
                    <span>个</span>
                  </div>
                </div>
              </div>
            </figure>
          </div>
          <div class="figure-right">
            <div class="tabs" style="width: 160px;position: absolute;left: 50%;top: 20px;z-index:999">
              <div :class="['tab', 'one', oneCopmpany ? 'tabClick' : '']" @click="companyClick('one')">
                <span>供电公司</span>
              </div>
              <div :class="['tab', twoCopmpany ? 'tabClick' : '']" @click="companyClick('two')">
                <span>直属公司</span>
              </div>
            </div>
            <figure>
              <v-chart :option="barUnit"></v-chart>
            </figure>
          </div>
          <div class="figure-left">
            <figure class="box" style="background: linear-gradient(#526bfb, #89a7fd)">
              <div class="title">
                <div>
                  <span>{{ new Date().getFullYear() }}年度{{ new Date().getMonth() + 1 }}月份{{ "徐州" }}省(市)</span>
                </div>
                <div>
                  <span>资本性(成本行)项目审定汇总</span>
                </div>
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
          <div class="figure-right">
            <div class="tabs" style="width: 160px;position: absolute;left: 50%;top: 20px;z-index:999">
              <div :class="['tab', 'one', oneCapital ? 'tabClick' : '']" @click="capitalClick('one')">
                <span>项目性资本</span>
              </div>
              <div :class="['tab', twoCapital ? 'tabClick' : '']" @click="capitalClick('two')">
                <span>成本性资本</span>
              </div>
            </div>
            <figure>
              <v-chart :option="barType"></v-chart>
            </figure>
          </div>
        </el-card>
      </div>
      <div class="echarts-box" v-if="oneTab">
        <el-card class="bottom-box">
          <figure>
            <v-chart :option="barPromptly"></v-chart>
          </figure>
        </el-card>
        <el-card class="audit bottom-box">
          <figure>
            <v-chart :option="barAudit"></v-chart>
          </figure>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.container {
  width: 100%;

  .nav {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    height: 40px;
    margin-top: 10px;

    .right {
      display: flex;
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
      display: flex;
      flex-direction: column;

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

  .tab {
    width: 80px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    cursor: pointer;

    span {
      font-size: 14px;
    }
  }
}

.box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
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
</style>
