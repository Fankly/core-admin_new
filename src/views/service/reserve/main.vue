<script lang="ts">
export default {
  name: "/service/reserve/main"
};
</script>

<script setup lang="ts">
import userDialog from "@/components/select/userDialog.vue";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import SvgIcon from "@/components/base/svg-icon/index.vue";
import VChart from "vue-echarts";
import { getAppMenu } from "@/api/menu/menuConfig";
import { MenuConfig } from "@/views/service/xq/interface";
import baseService from "@/service/baseService";
import { getVal } from "@/api/service/expertinformation";
import { useStore } from "vuex";
const userDialogRef = ref();
const userInfo = ref();
const isShowPage = ref(false);
const router = useRouter();
const store = useStore();
const flag = ref("");
const typeTotal = reactive({
  finishVal: 0,
  enterVal: 0,
  processVal: 0,
  draftVal: 0,
  rejectVal: 0
});
const handelGetVal = async () => {
  let res = await getVal();
  if (res.success) {
    typeTotal.finishVal = res.data.finishVal;
    typeTotal.enterVal = res.data.enterVal;
    typeTotal.processVal = res.data.processVal;
    typeTotal.draftVal = res.data.draftVal;
    typeTotal.rejectVal = res.data.rejectVal;
  }
};

const searchData = reactive({
  yjdw: "",
  ejdw: "",
  center: ""
});

const operationBtn = ref<MenuConfig[]>([]);
const searchBtn = ref<MenuConfig[]>([]);

const handleRequired = (url: string) => {
  router.push({
    name: url
  });
};

const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery;
    userInfo.value = { ...userDialogRef.value.userMsg };
    if (isQuery) {
      isShowPage.value = true;
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfo.value.specialorgid}`);
      if (flagData.success && flagData.data) {
        flag.value = flagData.data;
        await handelGetVal();
        store.commit("setXqGlobalInfo", {
          deptId: userInfo.value.specialorgid,
          deptName: userInfo.value.specialorgname,
          dwId: userInfo.value.org_id,
          dwName: userInfo.value.org_name,
          roleId: userInfo.value.role_id,
          roleCode: userInfo.value.code,
          spRoleId: userInfo.value.id,
          specialorgcode: userInfo.value.specialorgcode,
          fqzzFlag: flag.value
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
};

const dwOBarOptions = reactive<any>({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow"
    }
  },
  grid: {
    left: "4%",
    right: "4%",
    bottom: "4%",
    top: "10%",
    containLabel: true
  },
  legend: {
    data: ["草稿", "审核中", "已完成"],
    top: 0,
    right: 20,
    textStyle: {
      color: "#6a6866"
    },
    itemWidth: 12,
    itemHeight: 10
  },
  xAxis: {
    type: "category",
    data: ["南京", "扬州", "苏州", "盐城", "常州", "泰州", "无锡", "徐州"],
    axisLine: {
      lineStyle: {
        color: "#6a6866"
      }
    },
    axisLabel: {
      textStyle: {
        fontFamily: "Microsoft YaHei"
      }
    }
  },
  yAxis: {
    type: "value",
    axisLine: {
      show: false,
      lineStyle: {
        color: "#939aa3"
      }
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: "#efefef"
      }
    }
  },
  series: [
    {
      name: "草稿",
      type: "bar",
      barWidth: "10%",
      itemStyle: {
        color: "#01b998",
        borderRadius: [12, 12, 0, 0]
      },
      data: [60, 64, 45, 42, 45, 14, 45, 14]
    },
    {
      name: "审核中",
      type: "bar",
      barWidth: "10%",
      itemStyle: {
        color: "#3ba9fd",
        borderRadius: [12, 12, 0, 0]
      },
      data: [80, 12, 60, 20, 40, 64, 54, 45]
    },
    {
      name: "已完成",
      type: "bar",
      barWidth: "10%",
      itemStyle: {
        color: "#f4a05d",
        borderRadius: [12, 12, 0, 0]
      },
      data: [48, 12, 45, 12, 42, 42, 12, 75]
    }
  ]
});

const cbBarOptions = reactive<any>({
  title: {
    text: "单位:个",
    left: 0,
    right: 0
  },
  grid: {
    left: "15%",
    right: "5%",
    top: "10%",
    bottom: "3%"
  },
  xAxis: {
    type: "value",
    max: 100,
    splitLine: {
      lineStyle: {
        type: "dashed"
      }
    }
  },
  yAxis: {
    type: "category",
    data: ["发展部", "科技部", "配网部", "设备部", "营销部"],
    axisLabel: {
      fontSize: 14
    }
  },
  series: [
    {
      type: "bar",
      data: [50, 60, 70, 80, 90],
      barWidth: "30%",
      itemStyle: {
        color: "#1abc9c"
      },
      label: {
        show: true,
        position: "right",
        fontSize: 14
      }
    }
  ]
});

const pieOptions = reactive<any>({
  tooltip: {
    trigger: "item",
    formatter: "{b}: {c} ({d}%)"
  },
  series: [
    {
      name: "项目状态",
      type: "pie",
      radius: "70%",
      itemStyle: {
        borderRadius: 0
      },
      label: {
        formatter: "{b}\n{d}%"
      },
      data: [
        { value: 50, name: "已立项" },
        { value: 30, name: "已储备" },
        { value: 20, name: "未处理" }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0,0,0,0.5)"
        }
      }
    }
  ],
  color: ["#01b998", "#3ba9fd", "#f4a05d"]
});

onMounted(async () => {
  const operationRes = await getAppMenu({
    appNo: "CBK",
    label: "1"
  });
  const searchRes = await getAppMenu({
    appNo: "CBK",
    label: "2"
  });
  if (operationRes.success && searchRes.success) {
    operationBtn.value = operationRes.data;
    searchBtn.value = searchRes.data;
  }
  await userDialogRef.value.getUser();
});
</script>

<template>
  <div class="container" v-show="isShowPage">
    <div class="container-btn">
      <div class="container-btn-box container-btn-bgcOne">
        <div class="container-btn-box-content">
          <h2>储备总览</h2>
          <div class="container-btn-box-content-middel"></div>
        </div>
        <div class="container-btn-box-icon">
          <svg-icon name="date" color="rgba(255, 255, 255, 0.3)" class="icon-style"></svg-icon>
        </div>
      </div>
      <div class="container-btn-box container-btn-bgcTwo">
        <div class="container-btn-box-content">
          <h2>业务处理</h2>
          <div class="container-btn-box-content-container-operation">
            <el-row :gutter="24">
              <template v-for="operation in operationBtn" :key="operation.id">
                <el-col :span="12">
                  <div class="container-btn-box-content-container-box" @click="handleRequired(operation.url)">
                    <i class="el-icon-search"></i>
                    <span>{{ operation.name }}</span>
                  </div>
                </el-col>
              </template>
            </el-row>
          </div>
        </div>
        <div class="container-btn-box-icon">
          <svg-icon name="date-range" color="rgba(255, 255, 255, 0.3)" class="icon-style"></svg-icon>
        </div>
      </div>
      <div class="container-btn-box container-btn-bgcThree">
        <div class="container-btn-box-content">
          <h2>快速查询</h2>
          <div class="container-btn-box-content-container-operation">
            <el-row :gutter="24">
              <template v-for="search in searchBtn" :key="search.id">
                <el-col :span="12">
                  <div class="container-btn-box-content-container-box" @click="handleRequired(search.url)">
                    <i class="el-icon-search"></i>
                    <span>{{ search.name }}</span>
                  </div>
                </el-col>
              </template>
            </el-row>
          </div>
        </div>
        <div class="container-btn-box-icon">
          <svg-icon name="table" color="rgba(255, 255, 255, 0.3)" class="icon-style"></svg-icon>
        </div>
      </div>
    </div>
    <div class="container-search">
      <div class="container-search-outside">
        <div class="container-search-box">
          <span>一级单位：</span>
          <el-select style="width: 100%" v-model="searchData.yjdw"></el-select>
        </div>
        <div class="container-search-box">
          <span>二级单位：</span>
          <el-select style="width: 100%" v-model="searchData.yjdw"></el-select>
        </div>
        <div class="container-search-box">
          <span>成本中心：</span>
          <el-select style="width: 100%" v-model="searchData.yjdw"></el-select>
        </div>
      </div>
    </div>
    <div class="container-charts">
      <div class="container-charts-box">
        <div class="container-charts-box-content charts-style">
          <div class="line"></div>
          <h3>各单位需求总览</h3>
          <div class="container-charts-box-content-main">
            <v-chart :option="dwOBarOptions" :autoresize="true" />
          </div>
        </div>
        <div class="container-charts-box-content charts-style">
          <div class="line"></div>
          <h3>需求储备立项分布</h3>
          <div class="container-charts-box-content-main">
            <v-chart :option="cbBarOptions" :autoresize="true" />
          </div>
        </div>
      </div>
      <div class="container-charts-box">
        <div class="container-charts-box-content">
          <div class="line"></div>
          <h3>省归口需求总览</h3>
          <div class="container-charts-box-content-main">
            <v-chart :option="pieOptions" :autoresize="true" />
          </div>
        </div>
        <div class="container-charts-box-content">
          <div class="line"></div>
          <h3>项目类型需求总览</h3>
          <div class="container-charts-box-content-main">
            <v-chart :option="dwOBarOptions" :autoresize="true" />
          </div>
        </div>
      </div>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<style scoped lang="less">
.charts-style {
  margin-right: 10px;
}

.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;

  .icon-style {
    width: 80px;
    height: 80px;
    cursor: auto;
  }

  .line {
    position: absolute;
    width: 4px;
    height: 20px;
    border-radius: 10px;
    background-color: #077f72;
    margin-top: 20px;
  }

  .container-btn {
    display: flex;
    justify-content: space-evenly;
    height: 140px;

    .container-btn-bgcOne {
      background: linear-gradient(to right, #db8300, #ddb427);
    }

    .container-btn-bgcTwo {
      background: linear-gradient(to right, #00857c, #1abfb6);
    }

    .container-btn-bgcThree {
      background: linear-gradient(to right, #1c7ba7, #02a9b4);
    }

    .container-btn-box {
      padding: 0 20px;
      width: 100%;
      height: 100%;
      border-radius: 10px;
      color: white;
      display: flex;

      &:nth-of-type(2) {
        margin: 0 10px;
      }

      .container-btn-box-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 150px;
      }

      .container-btn-box-content {
        flex: 1;
        min-height: 0;
        min-width: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
        .container-btn-box-content-middel {
          font-size: 18px;
          letter-spacing: 2px;
          span {
            vertical-align: middle;
          }
        }
        .container-btn-box-content-middel1 {
          width: 500px;
          font-size: 14px;
          position: absolute;
          left: 0;
          bottom: 20px;
          color: rgba(255, 255, 255, 0.6);
          > .number {
            font-weight: bold;
            color: rgba(255, 255, 255, 0.8);
            font-size: 16px;
            padding: 0 4px;
            vertical-align: middle;
          }
        }

        .container-btn-box-content-container {
          flex: 1;
          min-height: 0;
          min-width: 0;
          display: flex;
          align-items: center;
          height: 100%;
          justify-content: space-between;
          max-width: 280px;

          .container-btn-box-content-box {
            font-size: 14px;
            font-weight: 400;
            text-align: center;

            .container-btn-box-content-box__content:first-of-type {
              font-size: 16px;
            }
          }
        }

        .container-btn-box-content-container-box {
          padding: 6px 0;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.6);

          span {
            padding: 0 4px;
          }
        }
      }
    }
  }

  .container-search {
    width: 100%;
    margin: 10px 0;

    .container-search-outside {
      box-sizing: border-box;
      width: 100%;
      border: 1px solid #eeeeee;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .container-search-box {
        width: 33.3%;
        padding: 20px;
        align-items: center;
        display: flex;

        span {
          width: 150px;
          padding: 0 20px;
        }
      }
    }
  }

  .container-charts {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .container-charts-box {
      width: 100%;
      height: 100%;

      .container-charts-box-content {
        border-radius: 10px;
        border: 1px solid #eeeeee;
        position: relative;
        height: calc(50% - 5px);
        margin-bottom: 10px;
        display: flex;
        flex-direction: column;

        h3 {
          padding: 20px;
          margin: 0;
          font-weight: bold;
        }

        .container-charts-box-content-main {
          flex: 1;
          min-height: 0;
          min-width: 0;
        }
      }
    }
  }
}
</style>
