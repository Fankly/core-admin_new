<template>
  <div class="allSee" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="title">
      <div class="searchBox">
        <span class="searchShow" v-if="searchShow == false" @click="showSearch(true)">
          <i class="el-icon-arrow-down"></i>
        </span>
        <span class="searchShow" @click="showSearch(false)" v-else>
          <i class="el-icon-arrow-up"></i>
        </span>
      </div>
    </div>
    <div class="searchBox" v-show="searchShow">
      <el-form :inline="true">
        <el-col :span="8">
          <el-form-item label="所属单位：">
            <affiliatedUnit ref="company"></affiliatedUnit>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="截至日期：">
            <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" icon="el-icon-search" @click="search">查 询</el-button>
        </el-col>
      </el-form>
    </div>
    <!-- 头部信息框 -->
    <div class="headerInformationBox">
      <figure class="blueBox2">
        <div class="underline"></div>
        <div class="titBox">年度预算总额</div>
        <div class="moneyBox">{{ formatMoney(totalAnnualBudget) }}万元</div>
        <div class="proportionBox">
          <div>上年同期：{{ formatMoney(lastYearBudget) }}万元</div>
          <div class="percentageBox">
            <img v-if="totalAnnualBudgetPercentage > 0" src="@/assets/allsee/raise.png" />
            <img v-else src="@/assets/allsee/decline.png" />
            <div style="margin-left: 10px">{{ totalAnnualBudgetPercentage }}</div>
          </div>
        </div>
      </figure>
      <figure class="blueBox3">
        <div class="underline"></div>
        <div class="titBox">预算执行金额</div>
        <div class="moneyBox">{{ formatMoney(budgetExecutionAmount) }}万元</div>
        <div class="proportionBox">
          <div>上年同期：{{ formatMoney(lastYearAmount) }}万元</div>
          <div class="percentageBox">
            <img v-if="budgetExecutionAmountPercentage > 0" src="@/assets/allsee/raise.png" />
            <img v-else src="@/assets/allsee/decline.png" />
            <div style="margin-left: 10px">{{ budgetExecutionAmountPercentage }}</div>
          </div>
        </div>
      </figure>
      <figure class="blueBox4">
        <div class="underline"></div>
        <div class="titBox">预算执行率</div>
        <div class="moneyBox">{{ budgetExecutionRate }}%</div>
        <div class="proportionBox">
          <div>上年同期：{{ formatMoney(lastYearRate) }}万元</div>
          <div class="percentageBox">
            <img v-if="budgetExecutionRatePercentage > 0" src="@/assets/allsee/raise.png" />
            <img v-else src="@/assets/allsee/decline.png" />
            <div style="margin-left: 10px">{{ budgetExecutionRatePercentage }}</div>
          </div>
        </div>
      </figure>
    </div>
    <!-- /头部信息框 -->
    <!-- 下方数据框 -->
    <div class="lowerDataFrame">
      <figure>
        <div class="stepBox" style="margin-top: 50px">
          <el-steps :active="8" align-center>
            <el-step title="立项">
              <template v-slot:icon>
                <img src="@/assets/allsee/7.png" alt="" />
              </template>
            </el-step>
            <el-step title="需求提报">
              <template v-slot:icon>
                <img src="@/assets/allsee/6.png" alt="" />
              </template>
            </el-step>
            <el-step title="中标">
              <template v-slot:icon>
                <img src="@/assets/allsee/5.png" alt="" />
              </template>
            </el-step>
            <el-step title="合同签订">
              <template v-slot:icon>
                <img src="@/assets/allsee/3.png" alt="" />
              </template>
            </el-step>
            <el-step title="财务入账  ">
              <template v-slot:icon>
                <img src="@/assets/allsee/1.png" alt="" />
              </template>
            </el-step>
            <el-step title="项目关闭">
              <template v-slot:icon>
                <img src="@/assets/allsee/2.png" alt="" />
              </template>
            </el-step>
          </el-steps>
        </div>

        <div class="imgBox">
          <div class="total">
            <span>{{ formatMoney(establishment) }}万元</span>
          </div>
          <div class="total">
            <span>{{ formatMoney(demand) }}万元</span>
          </div>
          <div class="total">
            <span>{{ formatMoney(bidding) }}万元</span>
          </div>
          <div class="total">
            <span>{{ formatMoney(contract) }}万元</span>
          </div>
          <div class="total">
            <span>{{ formatMoney(finance) }}万元</span>
          </div>
          <div class="total">
            <span>{{ formatMoney(close) }}万元</span>
          </div>
        </div>

        <div class="progressBarBox">
          <div class="proBox">
            <div class="jdt1">
              <div class="wz">
                <div>资本</div>
                <div>成本</div>
                <div>总体</div>
              </div>
            </div>
            <div class="jdt">
              <div class="tx">
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="92.4" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="75.1" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="85.6" color="#46acda" />
              </div>
            </div>
          </div>
          <div class="proBox">
            <div class="jdt1">
              <div class="wz">
                <div>资本</div>
                <div>成本</div>
                <div>总体</div>
              </div>
            </div>
            <div class="jdt">
              <div class="tx">
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="95.8" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="88.1" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="93.6" color="#46acda" />
              </div>
            </div>
          </div>
          <div class="proBox">
            <div class="jdt1">
              <div class="wz">
                <div>资本</div>
                <div>成本</div>
                <div>总体</div>
              </div>
            </div>
            <div class="jdt">
              <div class="tx">
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="95.4" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="83.1" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="92.4" color="#46acda" />
              </div>
            </div>
          </div>
          <div class="proBox">
            <div class="jdt1">
              <div class="wz">
                <div>资本</div>
                <div>成本</div>
                <div>总体</div>
              </div>
            </div>
            <div class="jdt">
              <div class="tx">
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="84.2" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="69.8" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="77.9" color="#46acda" />
              </div>
            </div>
          </div>
          <div class="proBox">
            <div class="jdt1">
              <div class="wz">
                <div>资本</div>
                <div>成本</div>
                <div>总体</div>
              </div>
            </div>
            <div class="jdt">
              <div class="tx">
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="79.4" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="52.8" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="64.6" color="#46acda" />
              </div>
            </div>
          </div>
          <div class="proBox">
            <div class="jdt1">
              <div class="wz">
                <div>资本</div>
                <div>成本</div>
                <div>总体</div>
              </div>
            </div>
            <div class="jdt">
              <div class="tx">
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="71.6" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="45.5" color="#46acda" />
                <el-progress class="jdtel" :text-inside="true" :stroke-width="24" percentage="65.8" color="#46acda" />
              </div>
            </div>
          </div>
        </div>
      </figure>
    </div>
    <!-- /下方数据框 -->
  </div>
</template>

<script>
import VChart from 'vue-echarts'
import { ref, defineComponent, reactive } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'
import process from '@/views/budget-process/js/process-data'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'

export default defineComponent({
  name: '/budget-process/components/overview',
  components: {
    VChart,
    userDialog,
    affiliatedUnit
  },
  props: {
    dataObj: {
      type: Object,
      default: () => {}
    }
  },
  setup(props) {
    const store = useStore()
    let totalAnnualBudget = props.dataObj.data3 * 98574
    let lastYearBudget = props.dataObj.data3 * 87941
    let totalAnnualBudgetPercentage = (totalAnnualBudget / lastYearBudget).toFixed(2)
    let budgetExecutionAmount = props.dataObj.data3 * 71521
    let lastYearAmount = props.dataObj.data3 * 61521
    let budgetExecutionAmountPercentage = (budgetExecutionAmount / lastYearAmount).toFixed(2)
    let budgetExecutionRate = props.dataObj.data3 / 10
    let lastYearRate = (props.dataObj.data3 * 12) / 100
    let budgetExecutionRatePercentage = (budgetExecutionRate / lastYearRate).toFixed(2)
    let establishment = props.dataObj.data1 * 12311
    let demand = props.dataObj.data3 * 42141
    let bidding = props.dataObj.data3 * 12213
    let contract = props.dataObj.data3 * 12341
    let finance = props.dataObj.data3 * 14124
    let close = props.dataObj.data3 * 12441
    return reactive({
      store,
      totalAnnualBudget,
      lastYearBudget,
      totalAnnualBudgetPercentage,
      budgetExecutionAmount,
      lastYearAmount,
      budgetExecutionAmountPercentage,
      budgetExecutionRate,
      lastYearRate,
      budgetExecutionRatePercentage,
      establishment,
      demand,
      bidding,
      contract,
      finance,
      close,
      loading: false,
      dataList: {
        month: new Date()
      },
      projects: [],
      searchShow: false,
      one: '',
      two: '',
      three: '',
      four: 1
    })
  },
  methods: {
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
    },
    formatMoney(money) {
      // 格式化金额 10000 => 10,000
      return money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  }
})
</script>

<style lang="less" scoped>
.allSee {
  .title {
    width: 100%;
    color: #00706b;
    display: flex;

    .searchBox {
      width: 100%;
      text-align: right;

      .searchShow {
        cursor: pointer;
        color: #00706b;
        box-shadow: 0 0 0 0.3px;
      }
    }
  }

  .searchBox {
    width: 100%;
    height: 20px;
  }

  .headerInformationBox {
    width: 100%;
    display: flex;

    .blueBox1 {
      width: 28%;
      height: 240px;
      display: inline-block;
      position: relative;
      margin: auto;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      background-color: #e2f8f6;
      text-align: center;

      .underline {
        width: 1px;
        height: 30px;
        border-left: 4px solid #41d1ab;
      }

      .titBox {
        margin-top: 20px;
        width: 60%;
        height: 40px;
        border-bottom: 2px solid #028f83;
        display: inline-block;
        text-align: center;
        color: #028f83;
        font-size: 20px;
        font-weight: 700;
      }

      .moneyBox {
        text-align: center;
        color: #028f83;
        font-size: 30px;
        font-weight: 700;
        margin-top: 12px;
      }

      .proportionBox {
        margin-top: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #028f83;
        font-weight: 700;

        .percentageBox {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 30px;
        }
      }
    }

    .blueBox2 {
      width: 28%;
      height: 240px;
      display: inline-block;
      position: relative;
      margin: auto;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      background-color: #ecedf7;
      text-align: center;

      .underline {
        width: 1px;
        height: 30px;
        border-left: 4px solid #3f237e;
      }

      .titBox {
        margin-top: 20px;
        width: 60%;
        height: 40px;
        border-bottom: 2px solid #3f237e;
        display: inline-block;
        text-align: center;
        color: #3f237e;
        font-size: 20px;
        font-weight: 700;
      }

      .moneyBox {
        text-align: center;
        color: #3f237e;
        font-size: 30px;
        font-weight: 700;
        margin-top: 12px;
      }

      .proportionBox {
        margin-top: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #3f237e;
        font-weight: 700;

        .percentageBox {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 30px;
        }
      }
    }

    .blueBox3 {
      width: 28%;
      height: 240px;
      display: inline-block;
      position: relative;
      margin: auto;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      background-color: #e4f7fe;
      text-align: center;

      .underline {
        width: 1px;
        height: 30px;
        border-left: 4px solid #02798f;
      }

      .titBox {
        margin-top: 20px;
        width: 60%;
        height: 40px;
        border-bottom: 2px solid #02798e;
        display: inline-block;
        text-align: center;
        color: #02798e;
        font-size: 20px;
        font-weight: 700;
      }

      .moneyBox {
        text-align: center;
        color: #02798e;
        font-size: 30px;
        font-weight: 700;
        margin-top: 12px;
      }

      .proportionBox {
        margin-top: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #02798e;
        font-weight: 700;

        .percentageBox {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 30px;
        }
      }
    }

    .blueBox4 {
      width: 24%;
      height: 240px;
      display: inline-block;
      position: relative;
      margin: auto;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      background-color: #fef1e4;
      text-align: center;

      .underline {
        width: 1px;
        height: 30px;
        border-left: 4px solid #e9771a;
      }

      .titBox {
        margin-top: 20px;
        width: 60%;
        height: 40px;
        border-bottom: 2px solid #e9771a;
        display: inline-block;
        text-align: center;
        color: #e9771a;
        font-size: 20px;
        font-weight: 700;
      }

      .moneyBox {
        text-align: center;
        color: #e9771a;
        font-size: 30px;
        font-weight: 700;
        margin-top: 12px;
      }

      .proportionBox {
        margin-top: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #e9771a;
        font-weight: 700;

        .percentageBox {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 30px;
        }
      }
    }
  }

  .lowerDataFrame {
    width: 99%;
    margin: auto;
    margin-top: 30px;

    figure {
      width: 100%;
      display: inline-block;
      position: relative;
      margin: auto;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);

      .stepBox {
        margin-left: auto;
        margin-top: 50px;

        .el-step__title.is-finish {
          color: #59c9bf;
          font-size: 22px;
          font-weight: 700;
        }
      }

      .imgBox {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 10px;

        .total {
          width: 18%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 10px;

          span {
            font-size: 18px;
            font-weight: 700;
          }
        }
      }

      .progressBarBox {
        height: 30vh;
        width: 100%;
        display: flex;
        align-items: center;
        margin-top: 30px;

        .proBox {
          width: 100%;
          height: 100%;
          display: flex;

          .jdt1 {
            width: 40px;
            height: 100px;
            display: flex;
            margin-left: 10px;

            .wz {
              width: 100%;
              margin-right: 10px;
              text-align: center;
              font-size: 14px;
              font-weight: 700;

              div {
                width: 40px;
                height: 35px;
                margin-bottom: 10px;
              }
            }

            .tx {
              width: 70%;

              .el-progress-bar__innerText {
                color: black;
              }
            }

            .jdtel {
              margin-bottom: 20px;
            }
          }

          .jdt {
            width: calc(100% - 40px);
            height: 100px;
            margin-top: 15px;
            display: flex;
            margin: 0 10px;

            .wz {
              width: 100%;
              margin-right: 10px;
              text-align: center;
              font-size: 18px;
              font-weight: 700;

              div {
                height: 35px;
                margin-bottom: 10px;
              }
            }

            .tx {
              width: 80%;

              .el-progress-bar__innerText {
                color: black;
              }
            }

            .jdtel {
              margin-bottom: 20px;
            }
          }
        }
      }
    }
  }
}

:deep(.el-step__title) {
  font-size: 21px !important;
  color: #38baaf;
  font-weight: 700;
}
</style>
