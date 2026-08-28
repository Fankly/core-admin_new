<template>
  <div class="allSee" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
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
            <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"> </el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" icon="el-icon-search" @click="search">查 询</el-button>
        </el-col>
      </el-form>
    </div>
    <!-- 头部信息框 -->
    <div class="headerInformationBox">
      <figure class="blueBox1">
        <div class="underline"></div>
        <div class="titBox">全口径项目值</div>
        <div class="moneyBox">{{ allData.ysje }}万元</div>
        <div class="proportionBox">
          <div>上年同期：{{ allData.lastYsje }}万元</div>
          <div class="percentageBox">
            <img v-if="this.one > 0" src="@/assets/allsee/raise.png" />
            <img v-else src="@/assets/allsee/decline.png" />
            <div style="margin-left: 10px">{{ allData.ysjeChange }}</div>
          </div>
        </div>
      </figure>
      <figure class="blueBox2">
        <div class="underline"></div>
        <div class="titBox">年度预算总额</div>
        <div class="moneyBox">{{ allData.ndysze }}万元</div>
        <div class="proportionBox">
          <div>上年同期：{{ allData.lastNdysze }}万元</div>
          <div class="percentageBox">
            <img v-if="this.two > 0" src="@/assets/allsee/raise.png" />
            <img v-else src="@/assets/allsee/decline.png" />
            <div style="margin-left: 10px">{{ allData.ndyszeChange }}</div>
          </div>
        </div>
      </figure>
      <figure class="blueBox3">
        <div class="underline"></div>
        <div class="titBox">预算执行金额</div>
        <div class="moneyBox">{{ allData.yszxje }}万元</div>
        <div class="proportionBox">
          <div>上年同期：{{ allData.lastYszxje }}万元</div>
          <div class="percentageBox">
            <img v-if="this.three > 0" src="@/assets/allsee/raise.png" />
            <img v-else src="@/assets/allsee/decline.png" />
            <div style="margin-left: 10px">{{ allData.yszxjeChange }}</div>
          </div>
        </div>
      </figure>
      <figure class="blueBox4">
        <div class="underline"></div>
        <div class="titBox">预算执行率</div>
        <div class="moneyBox">{{ allData.yszxl }}</div>
        <div class="proportionBox">
          <div>上年同期：{{ allData.lastYszxl }}</div>
          <div class="percentageBox">
            <img v-if="this.four > 0" src="@/assets/allsee/raise.png" />
            <img v-else src="@/assets/allsee/decline.png" />
            <div style="margin-left: 10px">{{ allData.yszxlChange }}</div>
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
            <el-step title="招投标">
              <template v-slot:icon>
                <img src="@/assets/allsee/6.png" alt="" />
              </template>
            </el-step>
            <el-step title="合同签订">
              <template v-slot:icon>
                <img src="@/assets/allsee/5.png" alt="" />
              </template>
            </el-step>
            <el-step title="项目实施">
              <template v-slot:icon>
                <img src="@/assets/allsee/3.png" alt="" />
              </template>
            </el-step>
            <el-step title="项目审计  ">
              <template v-slot:icon>
                <img src="@/assets/allsee/1.png" alt="" />
              </template>
            </el-step>
            <el-step title="项目结算">
              <template v-slot:icon>
                <img src="@/assets/allsee/4.png" alt="" />
              </template>
            </el-step>
            <el-step title="决算与增资">
              <template v-slot:icon>
                <img src="@/assets/allsee/8.png" alt="" />
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
          <div class="imgSonBox">
            <img src="../../../assets/allsee/xian.png" alt="" />
            <div class="messBox">
              <div class="titBox">立项</div>
              <div class="moneyBox">
                <div>项目数：</div>
                <span>{{ allData.xmcbylxc }}个</span>
              </div>
              <div class="moneyBox">
                <div>本月金额值：</div>
                <span>{{ allData.xmcbylx }}万元</span>
              </div>
              <div class="moneyBox">
                <div>上月金额值：</div>
                <span>{{ allData.lastXmcbylx }}万元</span>
              </div>
            </div>
          </div>
          <div class="imgSonBox">
            <img src="../../../assets/allsee/xian2.png" alt="" />
            <div class="messBox">
              <div class="titBox">招投标</div>
              <div class="moneyBox">
                <div>项目数：</div>
                <span>{{ allData.ztbc }}个</span>
              </div>
              <div class="moneyBox">
                <div>本月金额值：</div>
                <span>{{ allData.ztb }}万元</span>
              </div>
              <div class="moneyBox">
                <div>上月金额值：</div>
                <span>{{ allData.lastZtb }}万元</span>
              </div>
            </div>
          </div>
          <div class="imgSonBox">
            <img src="../../../assets/allsee/xian.png" alt="" />
            <div class="messBox">
              <div class="titBox">合同签订</div>
              <div class="moneyBox">
                <div>项目数：</div>
                <span>{{ allData.htqdc }}个</span>
              </div>
              <div class="moneyBox">
                <div>本月金额值：</div>
                <span>{{ allData.htqd }}万元</span>
              </div>
              <div class="moneyBox">
                <div>上月金额值：</div>
                <span>{{ allData.lastHtqd }}万元</span>
              </div>
            </div>
          </div>
          <div class="imgSonBox">
            <img src="../../../assets/allsee/xian2.png" alt="" />
            <div class="messBox">
              <div class="titBox">项目实施</div>
              <div class="moneyBox">
                <div>项目数：</div>
                <span>{{ allData.xmssc }}个</span>
              </div>
              <div class="moneyBox">
                <div>本月金额值：</div>
                <span>{{ allData.xmss }}万元</span>
              </div>
              <div class="moneyBox">
                <div>上月金额值：</div>
                <span>{{ allData.lastXmss }}万元</span>
              </div>
            </div>
          </div>
          <div class="imgSonBox">
            <img src="../../../assets/allsee/xian.png" alt="" />
            <div class="messBox">
              <div class="titBox">项目审计</div>
              <div class="moneyBox">
                <div>项目数：</div>
                <span>{{ allData.xmsjc }}个</span>
              </div>
              <div class="moneyBox">
                <div>本月金额值：</div>
                <span>{{ allData.xmsj }}万元</span>
              </div>
              <div class="moneyBox">
                <div>上月金额值：</div>
                <span>{{ allData.lastXmsj }}万元</span>
              </div>
            </div>
          </div>
          <div class="imgSonBox">
            <img src="../../../assets/allsee/xian2.png" alt="" />
            <div class="messBox">
              <div class="titBox">项目结算</div>
              <div class="moneyBox">
                <div>项目数：</div>
                <span>{{}}个</span>
              </div>
              <div class="moneyBox">
                <div>本月金额值：</div>
                <span>{{}}万元</span>
              </div>
              <div class="moneyBox">
                <div>上月金额值：</div>
                <span>{{}}万元</span>
              </div>
            </div>
          </div>
          <div class="imgSonBox">
            <img src="../../../assets/allsee/xian.png" alt="" />
            <div class="messBox">
              <div class="titBox">决算与增资</div>
              <div class="moneyBox">
                <div>项目数：</div>
                <span>{{ allData.jsyzzc }}个</span>
              </div>
              <div class="moneyBox">
                <div>本月金额值：</div>
                <span>{{ allData.jsyzz }}万元</span>
              </div>
              <div class="moneyBox">
                <div>上月金额值：</div>
                <span>{{ allData.lastJsyzz }}万元</span>
              </div>
            </div>
          </div>
          <div class="imgSonBox">
            <img src="../../../assets/allsee/xian2.png" alt="" />
            <div class="messBox">
              <div class="titBox">项目关闭</div>
              <div class="moneyBox">
                <div>项目数：</div>
                <span>{{ allData.xmgbc }}个</span>
              </div>
              <div class="moneyBox">
                <div>本月金额值：</div>
                <span>{{ allData.xmgb }}万元</span>
              </div>
              <div class="moneyBox">
                <div>上月金额值：</div>
                <span>{{ allData.lastXmgb }}万元</span>
              </div>
            </div>
          </div>
        </div>

        <div class="progressBarBox">
          <div class="jdt1">
            <div class="wz">
              <div>资本</div>
              <div>成本</div>
              <div>总体</div>
            </div>
          </div>
          <div class="jdt">
            <div class="tx">
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmcbylxzbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmcbylxcbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmcbylxp" color="#46acda" />
            </div>
          </div>
          <div class="jdt">
            <div class="tx">
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.ztbzbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.ztbcbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.ztbp" color="#46acda" />
            </div>
          </div>
          <div class="jdt">
            <div class="tx">
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.htqdzbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.htqdcbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.htqdp" color="#46acda" />
            </div>
          </div>
          <div class="jdt">
            <div class="tx">
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmsszbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmsscbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmssp" color="#46acda" />
            </div>
          </div>
          <div class="jdt">
            <div class="tx">
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmsjzbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmsjcbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmsjp" color="#46acda" />
            </div>
          </div>
          <div class="jdt">
            <div class="tx">
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" color="#46acda" />
            </div>
          </div>
          <div class="jdt">
            <div class="tx">
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.jsyzzzbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.jsyzzcbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.jsyzzp" color="#46acda" />
            </div>
          </div>
          <div class="jdt">
            <div class="tx">
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmgbzbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmgbcbp" color="#46acda" />
              <el-progress class="jdtel" :text-inside="true" :stroke-width="24" :percentage="allData.xmgbp" color="#46acda" />
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
  name: '/budget-process/04-monitor/overview',
  components: {
    VChart,
    userDialog,
    affiliatedUnit
  },

  setup() {
    const store = useStore()
    return reactive({
      store,
      userCode: '',
      userId: '',
      specialorgid: '',
      loading: false,
      dataList: {
        month: new Date()
      },
      projects: [],
      //选中数据 页面直接调用即可
      selectList: [],
      allId: [],
      allData: [],
      searchShow: false,
      one: '',
      two: '',
      three: '',
      four: ''
    })
  },

  mounted() {
    this.loading = true
    this.$refs.userDialog.getUser(this.userId, this.userCode)
  },
  methods: {
    search() {
      setTimeout(() => {
        this.loading = true
        let params = {
          qkjejdws: [],
          year: '',
          month: '',
          specialorgid: this.specialorgid
        }
        if (this.$refs.company.selectList.length !== 0) {
          params.qkjejdws = this.$refs.company.selectList
        } else {
          params.qkjejdws = this.$refs.company.allId
        }

        if (this.dataList.month) {
          let time = new Date(this.dataList.month)
          let zyear = time.getFullYear()
          let zmonth = time.getMonth() + 1
          params.year = JSON.stringify(zyear)
          params.month = JSON.stringify(zmonth)
        }
        baseService.post('/process/view/', params).then((res) => {
          this.loading = false
          if (res.success) {
            this.allData = res.data
            this.one = res.data.ysjeChange.replace('%', '')
            this.one = this.one / 1
            this.two = res.data.ndyszeChange.replace('%', '')
            this.two = this.two / 1
            this.three = res.data.yszxjeChange.replace('%', '')
            this.three = this.three / 1
            this.four = res.data.yszxlChange.replace('%', '')
            this.four = this.four / 1
          } else {
            ElMessage({
              type: 'error',
              message: res.msg
            })
          }
        })
      }, 1000)
    },
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.$refs.company.getAffiliatedUnit(this.specialorgid)
      this.search()
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
        box-shadow: 0 0 0 0.3;
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
      width: 24%;
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
      width: 24%;
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
      width: 24%;
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
        .imgSonBox {
          width: 15%;
          height: 100px;
          img {
            margin-left: 48%;
          }
          .messBox {
            width: 100%;
            height: 120px;
            padding: 5px;
            background-color: #f0fbfa;

            .titBox {
              width: 100%;
              color: #07c0b1;
              font-size: 18px;
              font-weight: 700;
              text-align: center;
            }
            .moneyBox {
              display: flex;
              font-size: 12px;
              margin-top: 10px;
              div {
                width: 80px;
                color: #24bbae;
                font-weight: 700;
              }
              span {
                font-weight: 700;
              }
            }
          }
        }
      }

      .progressBarBox {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: center;
        margin-top: 150px;
        .jdt1 {
          width: 3%;
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
          width: 12%;
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
</style>
