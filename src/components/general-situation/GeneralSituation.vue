<template>
  <div class="ztqkBox">
    <div class="searchBox">
      <el-form :inline="true">
        <el-row>
          <el-col :span="6">
            <el-form-item label="项目类型：">
              <projectType ref="type"></projectType>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属单位：">
              <affiliatedUnit ref="company"></affiliatedUnit>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="截至时间：">
              <el-date-picker v-model="time" type="month" placeholder="选择月"> </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="search">查 询</el-button>
              <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="valueBox">
      <!-- <div class="leftBox">
        <div class="textBox">
          <figure class="ztFigure">
            <el-form>
              <el-row>
                <el-col>
                  <el-form-item>
                    <label slot="label">
                      <span style="font-size: 16px">年度预算总额</span>
                    </label>
                    <span style="font-size: 14px; color: blue; margin-left: 30px">
                      {{ `(12.3)` }}
                    </span>
                    <span style="font-size: 14px; margin-left: 10px">亿元</span>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row>
                <el-col>
                  <el-form-item>
                    <label slot="label">
                      <span style="font-size: 13px">较2021年</span>
                    </label>
                    <i class="el-icon-top"></i>
                    <span style="font-size: 13px; text-decoration: underline">
                      {{ "上升/下降" }}
                    </span>
                    <span style="font-size: 13px; margin-left: 10px; color: blue">{{ `(10)` }}</span>
                    <span style="font-size: 13px">%</span>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row>
                <el-col>
                  <el-form-item>
                    <label slot="label">
                      <span style="font-size: 13px">较2020年</span>
                    </label>
                    <i class="el-icon-bottom"></i>
                    <span style="font-size: 13px; text-decoration: underline">
                      {{ "上升/下降" }}
                    </span>
                    <span style="font-size: 13px; margin-left: 10px; color: blue">{{ `(5)` }}</span>
                    <span style="font-size: 13px">%</span>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </figure>

          <figure class="ztFigure" style="margin-top: 20px">
            <el-form>
              <el-row>
                <el-col>
                  <el-form-item>
                    <label slot="label">
                      <span style="font-size: 16px">预算执行金额</span>
                    </label>
                    <span style="font-size: 14px; color: blue; margin-left: 30px">
                      {{ `(12)` }}
                    </span>
                    <span style="font-size: 14px; margin-left: 10px">亿元</span>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row>
                <el-col>
                  <el-form-item>
                    <label slot="label">
                      <span style="font-size: 13px">较2021年</span>
                    </label>
                    <i class="el-icon-top"></i>
                    <span style="font-size: 13px; text-decoration: underline">
                      {{ "上升/下降" }}
                    </span>
                    <span style="font-size: 13px; margin-left: 10px; color: blue">{{ `(6)` }}</span>
                    <span style="font-size: 13px">%</span>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row>
                <el-col>
                  <el-form-item>
                    <label slot="label">
                      <span style="font-size: 13px">较2020年</span>
                    </label>
                    <i class="el-icon-bottom"></i>
                    <span style="font-size: 13px; text-decoration: underline">
                      {{ "上升/下降" }}
                    </span>
                    <span style="font-size: 13px; margin-left: 10px; color: blue">{{ `(22)` }}</span>
                    <span style="font-size: 13px">%</span>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </figure>

          <figure class="ztFigure" style="margin-top: 20px">
            <el-form>
              <el-row>
                <el-col>
                  <el-form-item>
                    <label slot="label">
                      <span style="font-size: 16px">预算完成率</span>
                    </label>
                    <span style="font-size: 14px; color: blue; margin-left: 30px">
                      {{ `(45)` }}
                    </span>
                    <span style="font-size: 14px; margin-left: 10px">亿元</span>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row>
                <el-col>
                  <el-form-item>
                    <label slot="label">
                      <span style="font-size: 13px">较2021年</span>
                    </label>
                    <i class="el-icon-top"></i>
                    <span style="font-size: 13px; text-decoration: underline">
                      {{ "上升/下降" }}
                    </span>
                    <span style="font-size: 13px; margin-left: 10px; color: blue">{{ `(2)` }}</span>
                    <span style="font-size: 13px">%</span>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row>
                <el-col>
                  <el-form-item>
                    <label slot="label">
                      <span style="font-size: 13px">较2020年</span>
                    </label>
                    <i class="el-icon-bottom"></i>
                    <span style="font-size: 13px; text-decoration: underline">
                      {{ "上升/下降" }}
                    </span>
                    <span style="font-size: 13px; margin-left: 10px; color: blue">{{ `(1)` }}</span>
                    <span style="font-size: 13px">%</span>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </figure>
        </div>
      </div> -->

      <div class="rightBox">
        <figure style="margin-top: 2em">
          <v-chart :option="bar" :loadingOptions="barLoadingOptions" :theme="theme" :autoresize="autoResize" />
        </figure>
        <figure style="margin-top: 1em">
          <el-table stripe border :data="tableData" row-key="id" :header-cell-style="{ 'text-align': 'center' }">
            <el-table-column label="单位" width="250" fixed>
              <template #default="scope">
                <span style="cursor: pointer" v-if="scope.row.children">{{ scope.row.name }}</span>
                <div style="width: 100%; text-align: center" v-else>{{ scope.row.name }}</div>
              </template>
            </el-table-column>
            <el-table-column label="储备立项">
              <template #default="scope">
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ylxxms + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '项目金额:' + scope.row.dataMap.erpjdys + '万元' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="招投标">
              <template #default="scope">
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.xqtbfxzc + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '项目金额:' + scope.row.dataMap.xqtbxzs + '万元' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="合同签订">
              <template #default="scope">
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.tyhtqdfxzc + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '项目金额:' + scope.row.dataMap.tyhtqdxzs + '万元' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="项目实施">
              <template #default="scope">
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zsjksxms + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '项目金额:' + scope.row.dataMap.zsjksys + '万元' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="项目审计">
              <template #default="scope">
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ljssjexms + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '项目金额:' + scope.row.dataMap.ljssje + '万元' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="结算支付">
              <template #default="scope">
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ndzcb_hsxms + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '项目金额:' + scope.row.dataMap.ndzc_hs + '万元' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="决算增资">
              <template #default="scope">
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.zszzjexms + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '项目金额:' + scope.row.dataMap.zszzje + '万元' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="项目关闭">
              <template #default="scope">
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.ygbxms + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '项目金额:' + scope.row.dataMap.ygbys + '万元' }}</div>
              </template>
            </el-table-column>
          </el-table>
        </figure>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { number, time, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart, MapChart, RadarChart, ScatterChart, EffectScatterChart, LinesChart } from 'echarts/charts'
import {
  GridComponent,
  PolarComponent,
  GeoComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
  DatasetComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { ref, defineComponent, reactive } from 'vue'
import { setup } from 'xe-utils/ctor'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
use([
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
])
export default defineComponent({
  components: {
    VChart,
    projectType,
    affiliatedUnit
  },

  provide: {
    [THEME_KEY]: 'westeros'
  },
  setup() {
    const time = ref(new Date())
    const num = ref([])
    const amount = ref([])
    const tableData = ref([])
    const type = ref()
    const company = ref()
    // 搜索按钮
    const search = () => {
      let params = {
        zyear: '',
        zmonth: '',
        qkjxmlxbms: [],
        qkjejdws: []
      }
      params.qkjxmlxbms = type.value.selectList
      params.qkjejdws = company.value.selectList
      if (time) {
        let month = new Date(time.value)
        let zyear = month.getFullYear()
        let zmonth = month.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      baseService.post('/process/chart01/', params).then((res) => {
        if (res.success == true) {
          tableData.value = res.data
          res.data.forEach((item) => {
            if (item.name == '合计') {
              if (item.dataMap) {
                let jine = {
                  one: item.dataMap.erpjdys,
                  two: item.dataMap.xqtbxzs,
                  three: item.dataMap.tyhtqdxzs,
                  four: item.dataMap.zsjksys,
                  five: item.dataMap.ljssje,
                  six: item.dataMap.ndzc_hs,
                  seven: item.dataMap.zszzje,
                  eight: item.dataMap.ygbys
                }
                let shuliang = {
                  one: item.dataMap.ylxxms,
                  two: item.dataMap.xqtbfxzc,
                  three: item.dataMap.tyhtqdfxzc,
                  four: item.dataMap.zsjksxms,
                  five: item.dataMap.ljssjexms,
                  six: item.dataMap.ndzcb_hsxms,
                  seven: item.dataMap.zszzjexms,
                  eight: item.dataMap.ygbxms
                }
                for (let key in jine) {
                  amount.value.push(jine[key].split(',').join(''))
                }
                for (let key in shuliang) {
                  num.value.push(shuliang[key])
                }
              }
            }
          })
        }
      })
    }
    // 重置按钮
    const reset = () => {
      num.value = []
      amount.value = []
      tableData.value = []
      time.value = new Date()
      type.value.clear()
      company.value.clear()
    }
    // echarts
    const bar = ref({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      legend: {
        data: ['项目金额', '项目数量']
      },
      xAxis: [
        {
          type: 'category',
          data: ['储备立项', '招投标', '合同签订', '项目实施', '项目审计', '结算支付', '决算增资', '项目关闭'],
          axisPointer: {
            type: 'shadow'
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '万元',
          min: 0,
          max: 10000000,
          interval: 1000000,
          axisLabel: {
            formatter: '{value}'
          }
        },
        {
          type: 'value',
          name: '个',
          min: 0,
          max: 100000,
          interval: 10000,
          axisLabel: {
            formatter: '{value}'
          }
        }
      ],
      series: [
        {
          name: '项目金额',
          type: 'bar',
          barMaxWidth: 100,
          tooltip: {
            valueFormatter: function (value) {
              let num = Number(value).toLocaleString()
              return num
            }
          },
          data: amount
        },
        {
          name: '项目数量',
          type: 'line',
          yAxisIndex: 1,
          tooltip: {
            valueFormatter: function (value) {
              return value
            }
          },
          data: num
        }
      ]
    })
    return {
      time,
      bar,
      barLoadingOptions: {
        text: 'Loading…',
        color: '#4ea397',
        maskColor: 'rgba(255, 255, 255, 0.4)'
      },
      theme: '',
      autoResize: true,
      search,
      reset,
      num,
      amount,
      tableData,
      type,
      company
    }
  },
  mounted() {
    let id = sessionStorage.getItem('specialorgid')
    this.$refs.company.getAffiliatedUnit(id)
  }
})
</script>

<style lang="less" scoped>
.ztqkBox {
  .searchBox {
    width: 90%;
    margin: auto;
    margin-top: 20px;
    min-width: 985px;
  }
  .valueBox {
    width: 100%;
    display: flex;
    .leftBox {
      width: 30%;
      padding-right: 20px;
      padding-top: 2%;
      padding-bottom: 5%;
      padding-left: 3%;

      .ztFigure {
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
      .el-icon-top {
        margin-left: 30px;
        color: red;
        font-size: 16px;
        font-weight: 700;
      }
      .el-icon-bottom {
        margin-left: 30px;
        font-size: 16px;
        font-weight: 700;
        color: green;
      }
      .textBox {
        width: 100%;
        margin: auto;
      }

      .title {
        color: black;
        font-size: 18px;
        margin-left: 10px;
        display: inline-block;
        width: 120px;
      }
      .allNum {
        display: inline-block;
        width: 100px;
        font-size: 22px;
        background-color: #ccc;
        text-align: center;
        color: rgb(29, 29, 205);
      }
      .last {
        margin-left: 80px;
        margin-top: 50px;
        .lastText {
          color: blue;
          text-decoration: underline;
        }
      }
    }
    .rightBox {
      width: 100%;
      padding-left: 20px;
      figure {
        width: 100%;
        display: inline-block;
        position: relative;
        margin: auto;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        padding: 10px;

        .echarts {
          width: 100%;
          min-width: 400px;
          height: 350px;
        }
      }
    }
  }
}
</style>
