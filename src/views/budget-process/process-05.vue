<template>
  <div class="qualityBrowse" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>预算全过程规范性监控总览</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon class="el-icon-s-operation" style="font-size: 18px">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in segment" :key="item.value">
                  <el-checkbox style="margin-right: 10px" v-model="item.checked" @change="listShow(item.value, item.checked)"></el-checkbox>
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span style="margin-right: 20px">
            <span class="searchShow" v-if="searchShow == false" @click="showSearch(true)">
              <i style="font-size: 18px" class="el-icon-arrow-down"></i>
            </span>
            <span class="searchShow" @click="showSearch(false)" v-else>
              <i style="font-size: 18px" class="el-icon-arrow-up"></i>
            </span>
          </span>
          <span class="searchShow">
            <i style="font-size: 18px" class="el-icon-question" @click="helpHandle"></i>
          </span>
        </div>
      </div>

      <div class="search" v-show="searchShow">
        <el-form label-position="left" label-width="100px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <allProjectType class="formWidth" ref="type"></allProjectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="日期：">
                <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"> </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="统计纬度：">
                <el-radio-group v-model="dataList.select">
                  <el-radio :label="0" border style="margin-right: 10px">单位</el-radio>
                  <el-radio :label="1" border>类型</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="监控规则：">
                <el-switch v-model="remarks" active-text="开" inactive-text="关" @change="remarksbtn" />
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" @click="search">查 询</el-button>
                <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
                <el-button type="warning" icon="el-icon-download" @click="exportBtn">导 出</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <el-table
      stripe
      border
      :data="example"
      v-if="tableHeight"
      :height="tableHeight"
      style="width: 100%"
      row-key="id"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="单位/项目类型" width="250" fixed>
        <template #default="scope">
          <span style="cursor: pointer" v-if="scope.row.children">{{ scope.row.name }}</span>
          <div style="width: 100%; text-align: center" v-else>{{ scope.row.name }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="dataMap.ysmbz" align="right" width="150" label="年度预算（万元）" fixed />

      <el-table-column label="招投标" v-if="columnObj.Bidding">
        <el-table-column label="招投标差额" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_ztbcylje }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_ztbcylxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '差额绝对值合计：' + scope.row.dataMap.jh_ztbcylje + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="合同签订" v-if="columnObj.contract">
        <el-table-column label="合同签订规范性" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_htqdgfxje }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_htqdgfxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '入账金额合计数：' + scope.row.dataMap.jh_htqdgfxje + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="合同履约规范性" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_htlygfxje }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_htlygfxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '差额：' + scope.row.dataMap.jh_htlygfxje + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目实施" v-if="columnObj.implementation">
        <el-table-column label="物资领用">
          <el-table-column label="物资整领整退" align="left" width="240">
            <template #default="scope">
              <div v-if="scope.row.auditSwitch">
                {{ scope.row.jh_wzzlztbsje }}
              </div>
              <div v-else>
                <span v-if="scope.row.dataMap" class="wzzlztbs-penetration" @click="goProcess06Detail(scope.row)">
                  <span>{{ '项目数量：' + scope.row.dataMap.jh_wzzlztbsms + '个' }}</span>
                  <span>{{ '整领整退金额：' + scope.row.dataMap.jh_wzzlztbsje + '万元' }}</span>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="物资退库率" align="left" width="240">
            <template #default="scope">
              <div v-if="scope.row.auditSwitch">
                {{ scope.row.jh_wztklys }}
              </div>
              <div v-else>
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_wztklxms + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '当年预算：' + scope.row.dataMap.jh_wztklys + '万元' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="物资超欠供差额" align="left" width="300">
            <template #default="scope">
              <div v-if="scope.row.auditSwitch">
                {{ scope.row.jh_wzcqgceje }}
              </div>
              <div v-else>
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_wzcqgcexms + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '超欠供绝对值合计：' + scope.row.dataMap.jh_wzcqgceje + '万元' }}</div>
              </div>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="预算调整">
          <el-table-column label="预算调整金额" align="left" width="240">
            <template #default="scope">
              <div v-if="scope.row.auditSwitch">
                {{ scope.row.jh_ndystzlje }}
              </div>
              <div v-else>
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_ndystzlxms + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '预算项目金额：' + scope.row.dataMap.jh_ndystzlje + '万元' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="预算调整次数" align="left" width="240">
            <template #default="scope">
              <div v-if="scope.row.auditSwitch">
                {{ scope.row.jh_ndystzcsys }}
              </div>
              <div v-else>
                <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_ndystzcsxms + '个' }}</div>
                <div v-if="scope.row.dataMap">{{ '预算项目金额：' + scope.row.dataMap.jh_ndystzcsys + '万元' }}</div>
              </div>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目审计" v-if="columnObj.audit">
        <el-table-column label="审计核减金额" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_sjhjlje }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_sjhjlxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '核减金额：' + scope.row.dataMap.jh_sjhjlje + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="结算与资金支付" v-if="columnObj.settlement">
        <el-table-column label="服务入账规范性" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_sbfwrzhlxje }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_sbfwrzhlxxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '服务入账金额：' + scope.row.dataMap.jh_sbfwrzhlxje + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="资金支付规范性" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_zjzfjeje }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_zjzfjexms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '差额合计数：' + scope.row.dataMap.jh_zjzfjeje + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="收款单位一致性" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_skdwyzxje }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_skdwyzxxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '资金支付金额：' + scope.row.dataMap.jh_skdwyzxje + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="决算与增资" v-if="columnObj.finalAccounts">
        <el-table-column label="暂估增资合理性" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_zgzzhlxje }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_zgzzhlxxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '差额：' + scope.row.dataMap.jh_zgzzhlxje + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="在建工程余额" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_zjgcfsje }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_zjgcfsxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '在建工程余额：' + scope.row.dataMap.jh_zjgcfsje + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目关闭" v-if="columnObj.close">
        <el-table-column label="项目状态" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_xmgbs }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '已关闭项目数量：' + scope.row.dataMap.jh_xmgbs }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>
    </el-table>
    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  </div>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import allProjectType from '@/components/select/allProjectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'
export default defineComponent({
  name: '/budget-process/process-05',
  components: {
    affiliatedUnit,
    userDialog,
    allProjectType
  },
  setup() {
    const store = useStore()
    const helpHandle = () => {
      const url = store.getters.getMenuMsg.url
      showHelpMsg(url)
    }
    return reactive({
      helpHandle,
      store,
      example: [],
      dataList: {
        select: 0,
        month: new Date()
      },
      segment: [
        {
          value: 'Bidding',
          label: '招投标',
          checked: true
        },
        {
          value: 'contract',
          label: '合同签订',
          checked: true
        },
        {
          value: 'implementation',
          label: '项目实施',
          checked: true
        },
        {
          value: 'audit',
          label: '项目审计',
          checked: true
        },
        {
          value: 'settlement',
          label: '结算与资金支付',
          checked: true
        },
        {
          value: 'finalAccounts',
          label: '决算与增资',
          checked: true
        },
        {
          value: 'close',
          label: '项目关闭',
          checked: true
        }
      ],
      segmentIds: [],
      columnObj: {},
      searchShow: true,
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      loading: false,
      remarks: false,
      userCode: '',
      userId: '',
      specialorgid: ''
    })
  },
  created() {
    this.handleColumn()
  },
  mounted() {
    this.topHeight = document.querySelector('.topBox').clientHeight
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.searchHeight = document.querySelector('.search').clientHeight
    this.setTableHeight()
    this.loading = true
    this.$refs.userDialog.getUser(this.userId, this.userCode)
  },
  methods: {
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 40 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 40 + 'px'
      }
    },
    loadData() {
      this.loading = true
      if (this.dataList.month) {
        const params = {
          qkjxmlxbms: [],
          qkjejdws: [],
          zyear: '',
          zmonth: '',
          wd: this.dataList.select,
          specialorgid: this.specialorgid
        }

        if (this.$refs.type.selectList.length > 0) {
          params.qkjxmlxbms = this.$refs.type.selectList
        } else {
          params.qkjxmlxbms = this.$refs.type.allId
        }

        if (this.$refs.company.selectList.length > 0) {
          params.qkjejdws = this.$refs.company.selectList
        } else {
          params.qkjejdws = this.$refs.company.allId
        }

        if (this.dataList.month != '') {
          let time = new Date(this.dataList.month)
          let zyear = time.getFullYear()
          let zmonth = time.getMonth() + 1
          params.zyear = JSON.stringify(zyear)
          params.zmonth = JSON.stringify(zmonth)
        }
        if (this.remarks == false) {
          baseService.post('/process/process05/', params).then((res) => {
            if (res.success == true) {
              this.loading = false
              this.example = res.data
            } else {
              this.loading = false
              ElMessage({
                type: 'error',
                message: res.msg
              })
            }
          })
        } else {
          this.example = []
          this.remarksbtn()
          baseService.post('/process/process05/', params).then((res) => {
            if (res.success == true) {
              this.loading = false
              // this.example = res.data;
              res.data.forEach((item) => {
                item.auditSwitch = false
                this.example.push(item)
              })
            } else {
              this.loading = false
              ElMessage({
                type: 'error',
                message: res.msg
              })
            }
          })
        }
      } else {
        this.loading = false
        ElMessage({
          message: '请选择日期查询',
          iconClass: 'el-icon-search',
          customClass: 'tipsBox'
        })
      }
    },
    exportBtn() {
      this.loading = true
      if (this.dataList.month) {
        const params = {
          qkjxmlxbms: [],
          qkjejdws: [],
          zyear: '',
          zmonth: '',
          wd: this.dataList.select,
          specialorgid: this.specialorgid
        }

        if (this.$refs.type.selectList.length > 0) {
          params.qkjxmlxbms = this.$refs.type.selectList
        } else {
          params.qkjxmlxbms = this.$refs.type.allId
        }

        if (this.$refs.company.selectList.length > 0) {
          params.qkjejdws = this.$refs.company.selectList
        } else {
          params.qkjejdws = this.$refs.company.allId
        }

        if (this.dataList.month != '') {
          let time = new Date(this.dataList.month)
          let zyear = time.getFullYear()
          let zmonth = time.getMonth() + 1
          params.zyear = JSON.stringify(zyear)
          params.zmonth = JSON.stringify(zmonth)
        }
        baseService.export('/process/process05/export', params).then((res) => {
          this.loading = false
          const blob = res
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          dom.download = '预算全过程规范性监控总览.xlsx'
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
        })
      } else {
        this.loading = false
        ElMessage({
          message: '请选择日期查询',
          iconClass: 'el-icon-search',
          customClass: 'tipsBox'
        })
      }
    },
    //搜索按钮
    search() {
      this.loadData()
    },
    //处理环节数据
    handleColumn() {
      this.segment.forEach((item) => {
        this.segmentIds.push(item.value)
        this.columnObj[item.value] = item.checked
      })
    },

    //稽核规则开关
    remarksbtn() {
      if (this.remarks) {
        let name = {
          auditSwitch: true,
          name: '稽核规则（计算公式）',
          dataMap: {
            ysmbz: ''
          },
          jh_ztbcylje: '招投标差异率=（招标金额-中标金额）/招标金额，统计差异率超10%的招标金额与中标金额差额绝对值的合计数',
          jh_htqdgfxje: '合同签订规范性=服务入账日期-对应服务合同签订日期，统计<0天的入账金额合计数；仅指服务合同',
          jh_htlygfxje: '合同履约规范性=财务支出（含税）-对应合同金额，统计>0万元，差额合计值；仅指项目化物资和服务',
          jh_wzzlztbsje: '物资整领整退：通过项目定义+物资唯一码，汇总出库、退库数量，如果数量相等，则为整出整退。',
          jh_wztklys: '物资退库率=物资累计退库金额/（物资累计领用金额+物资累计退库金额）',
          jh_wzcqgceje: '物资超欠供差额=审定结果材料费-入账材料费（含税领料金额）；同一项目多次送审的，取合计数',
          jh_ndystzlje: '预算调整率=（当前预算金额-年初预算下达金额）/年初预算下达金额；',
          jh_ndystzcsys: '当年预算调整次数 ',
          jh_sjhjlje: '审计核减率=（累计送审金额-累计审定金额）/累计送审金额；同一项目多次送审，取合计数',
          jh_sbfwrzhlxje: '首笔服务入账合理性=实际开工日期-首笔服务类财务支出日期',
          jh_zjzfjeje: '资金支付规范性=资金支付金额-对应合同金额，涉及多个合同的，统计合计值；仅项目服务',
          jh_skdwyzxje: '合同供应商=实际收款单位，统计不一致支付金额合计值',
          jh_zgzzhlxje: '暂估增资合理性=设备购置支出-累计暂估增资金额',
          jh_zjgcfsje: '在建工程余额 ',
          jh_xmgbs: '根据前7个环节，判断是否展示此项目：前7个环节都规范，不展示'
        }
        let calculation = {
          auditSwitch: true,
          dataMap: {
            ysmbz: ''
          },
          name: '判断标准',
          jh_ztbcylje: '差异率绝对值≥10%',
          jh_htqdgfxje: '<0天',
          jh_htlygfxje: '>0万元',
          jh_wzzlztbsje: '出库=退库',
          jh_wztklys: '退库率≥20%（暂定）',
          jh_wzcqgceje: '≠0',
          jh_ndystzlje: '预算调整率绝对值≥15%（暂定）',
          jh_ndystzcsys: '>3次（暂定）',
          jh_sjhjlje: '≥10%（暂定）',
          jh_sbfwrzhlxje: '>0天',
          jh_zjzfjeje: '>0万元',
          jh_skdwyzxje: '不一致',
          jh_zgzzhlxje: '>0万元',
          jh_zjgcfsje: '<0万元',
          jh_xmgbs: ''
        }
        let judge = {
          auditSwitch: true,
          dataMap: {
            ysmbz: ''
          },
          name: '判断条件',
          jh_ztbcylje: '项目数量+差额绝对值合计',
          jh_htqdgfxje: '项目数量+入账金额合计数',
          jh_htlygfxje: '项目数量+差额',
          jh_wzzlztbsje: '项目数量+整领整退金额（整领部分的合计金额）',
          jh_wztklys: '项目数量+当年预算',
          jh_wzcqgceje: '项目数量+超欠供绝对值合计',
          jh_ndystzlje: '项目数量+调整金额',
          jh_ndystzcsys: '项目数量+当年预算',
          jh_sjhjlje: '项目数量+核减金额',
          jh_sbfwrzhlxje: '项目数量+服务入账金额',
          jh_zjzfjeje: '项目数量+差额合计数',
          jh_skdwyzxje: '项目数量+资金支付金额',
          jh_zgzzhlxje: '项目数量+差额',
          jh_zjgcfsje: '项目数量+在建工程余额 ',
          jh_xmgbs: '已关闭项目数量'
        }
        this.example.unshift(judge)
        this.example.unshift(calculation)
        this.example.unshift(name)
      } else {
        this.example.splice(0, 3)
      }
    },
    listShow(value, checked) {
      for (let i in this.columnObj) {
        if (i == value) {
          this.columnObj[i] = checked
        }
      }
    },

    //重置按钮
    reset() {
      this.dataList.month = new Date()
      this.dataList.select = 0
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.example = []
      this.loadData()
    },

    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },
    goProcess06Detail(row) {
      this.$router.push({
        path: '/budget-process/process-06',
        query: {
          id: row.id,
          zbx: 'JH_WZZLZTBS=0',
          wd: this.dataList.select,
          specialorgid: this.specialorgid
        }
      })
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.$refs.company.getAffiliatedUnit(this.specialorgid)
    }
  }
})
</script>

<style lang="less" scoped>
.qualityBrowse {
  padding: 10px;

  .title {
    width: 100%;
    color: #00706b;
    display: flex;

    .titleBox {
      width: 50%;
      text-align: right;

      h2 {
        font-size: 16px;
        margin: 0;
        margin-bottom: 20px;
      }
    }

    .searchBox {
      width: 50%;
      text-align: right;

      .searchShow {
        cursor: pointer;
        color: #00706b;
        box-shadow: 0 0 0 0.3;
      }
    }
  }
}

:deep(.el-date-editor) {
  width: 100%;
}

.wzzlztbs-penetration {
  color: #00706b;
  cursor: pointer;
  display: inline-flex;
  flex-direction: column;
  line-height: 22px;
}

.wzzlztbs-penetration:hover {
  text-decoration: underline;
}
</style>
