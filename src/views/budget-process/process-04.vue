<template>
  <div class="proBrwDetail" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>预算全过程及时性监控明细</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon style="font-size: 18px" class="el-icon-s-operation">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in applications" :key="item.value">
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
              <el-form-item label="项目编码：">
                <copyTextBox class="formWidth" ref="xmbm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <projectType class="formWidth" ref="type"></projectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <el-input class="formWidth" v-model="dataList.post1" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目状态：">
                <div class="formWidth">
                  <Projectstatus class="formWidth" ref="xmzt"></Projectstatus>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目包名称：">
                <el-input class="formWidth" v-model="dataList.xmb" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目性质：">
                <projectnature class="formWidth" ref="xmxz"></projectnature>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="截止日期：">
                <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"> </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="监控规则：">
                <el-switch v-model="remarks" active-text="开" inactive-text="关" @change="remarksbtn" />
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-button type="primary" icon="el-icon-search" @click="search">查 询</el-button>
              <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
              <el-button type="warning" icon="el-icon-download" @click="exportBtn">导 出</el-button>
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
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column width="160px" fixed label="项目编码">
        <template #default="scope">
          <span v-if="scope.row.pspids == 2">{{ scope.row.pspid }} </span>
          <el-dropdown v-else>
            <span class="el-dropdown-link">
              <a style="cursor: pointer">{{ scope.row.pspid }}</a>
              <i class="el-icon-arrow-down"></i>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goTable(item.value, scope.row.pspid)" v-for="(item, index) in tables" :key="index">{{
                  item.label
                }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
      <el-table-column width="280px" fixed prop="post1" label="项目名称"></el-table-column>
      <el-table-column width="160px" prop="zxmzt" label="项目状态"></el-table-column>
      <el-table-column width="160px" prop="qkjxmlxmc" label="项目类型" v-if="columnObj.QKJXMLXMC"></el-table-column>
      <el-table-column width="160px" prop="qkjxmb_mc" label="项目包" v-if="columnObj.QKJXMB_MC"></el-table-column>
      <el-table-column width="160px" prop="zjsjd_mc" label="项目性质"></el-table-column>
      <el-table-column width="240px" prop="qkjyjdw_name" label="一级单位" v-if="columnObj.QKJYJDW_NAME"></el-table-column>
      <el-table-column width="240px" prop="qkjejdw_name" label="二级单位" v-if="columnObj.QKJEJDW_NAME"></el-table-column>
      <el-table-column width="160px" prop="qkjgkbm_name" label="归口部门" v-if="columnObj.QKJGKBM_NAME"></el-table-column>
      <el-table-column width="160px" prop="erpjdys" label="年度预算" v-if="columnObj.ERPJDYS"></el-table-column>
      <el-table-column width="160px" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>
      <el-table-column width="160px" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>
      <el-table-column label="项目储备与立项" v-if="columnObj.xmcbylx">
        <el-table-column width="160px" label="已立项">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_lxjsx == 1">{{ scope.row.jh_lxjsxz }} </span>
            <span style="color: red" v-show="scope.row.jh_lxjsx == 0">{{ scope.row.jh_lxjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_lxjsx == 2">{{ scope.row.jh_lxjsxz }}</span>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="招投标" v-if="columnObj.ztb">
        <el-table-column width="160px" label="需求提报">
          <template #default="scope">
            <span style="color: #737675" v-show="scope.row.jh_ztbjsx == 2">{{ scope.row.jh_ztbjsxz }}</span>
            <span style="color: green" v-show="scope.row.jh_ztbjsx == 1">{{ scope.row.jh_ztbjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_ztbjsx == 0">{{ scope.row.jh_ztbjsxz }}</span>
          </template>
        </el-table-column>
        <el-table-column width="160px" label="中标结果">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_zbjgxdjsx == 1">{{ scope.row.jh_zbjgxdjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_zbjgxdjsx == 0">{{ scope.row.jh_zbjgxdjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_zbjgxdjsx == 2">{{ scope.row.jh_zbjgxdjsxz }}</span>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="合同签订" v-if="columnObj.htqd">
        <el-table-column width="160px" label="已签订">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_htqdjsx == 1">{{ scope.row.jh_htqdjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_htqdjsx == 0">{{ scope.row.jh_htqdjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_htqdjsx == 2">{{ scope.row.jh_htqdjsxz }}</span>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目实施" v-if="columnObj.xmss">
        <el-table-column width="160px" label="项目开工">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_kgjsx == 1">{{ scope.row.jh_kgjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_kgjsx == 0">{{ scope.row.jh_kgjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_kgjsx == 2">{{ scope.row.jh_kgjsxz }}</span>
          </template>
        </el-table-column>
        <el-table-column width="160px" label="物资到货">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_wzdhjsx == 1">{{ scope.row.jh_wzdhjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_wzdhjsx == 0">{{ scope.row.jh_wzdhjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_wzdhjsx == 2">{{ scope.row.jh_wzdhjsxz }}</span>
          </template>
        </el-table-column>
        <el-table-column width="160px" label="物资领用">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_wzlyjsx == 1">{{ scope.row.jh_wzlyjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_wzlyjsx == 0">{{ scope.row.jh_wzlyjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_wzlyjsx == 2">{{ scope.row.jh_wzlyjsxz }}</span>
          </template>
        </el-table-column>
        <el-table-column width="160px" label="项目竣工">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_jgjsx == 1">{{ scope.row.jh_jgjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_jgjsx == 0">{{ scope.row.jh_jgjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_jgjsx == 2">{{ scope.row.jh_jgjsxz }}</span>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目审计" v-if="columnObj.xmsj">
        <el-table-column width="160px" label="结算送审">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_jsssjsx == 1">{{ scope.row.jh_jsssjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_jsssjsx == 0">{{ scope.row.jh_jsssjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_jsssjsx == 2">{{ scope.row.jh_jsssjsxz }}</span>
          </template>
        </el-table-column>
        <el-table-column width="160px" label="结算审定">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_jssjjsx == 1">{{ scope.row.jh_jssjjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_jssjjsx == 0">{{ scope.row.jh_jssjjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_jssjjsx == 2">{{ scope.row.jh_jssjjsxz }}</span>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="结算与资金支付" v-if="columnObj.jsyzjzf">
        <el-table-column width="160px" label="资金支付">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_zjzfjsx == 1">{{ scope.row.jh_zjzfjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_zjzfjsx == 0">{{ scope.row.jh_zjzfjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_zjzfjsx == 2">{{ scope.row.jh_zjzfjsxz }}</span>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="决算与增资" v-if="columnObj.jsyzz">
        <el-table-column width="160px" label="决算送审">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_jusssjsx == 1">{{ scope.row.jh_jusssjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_jusssjsx == 0">{{ scope.row.jh_jusssjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_jusssjsx == 2">{{ scope.row.jh_jusssjsxz }}</span>
          </template>
        </el-table-column>
        <el-table-column width="160px" label="暂估转资">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_zgzzjsx == 1">{{ scope.row.jh_zgzzjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_zgzzjsx == 0">{{ scope.row.jh_zgzzjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_zgzzjsx == 2">{{ scope.row.jh_zgzzjsxz }}</span>
          </template>
        </el-table-column>
        <el-table-column width="160px" label="正式转资">
          <template #default="scope">
            <span style="color: green" v-show="scope.row.jh_zszzjsx == 1">{{ scope.row.jh_zszzjsxz }}</span>
            <span style="color: red" v-show="scope.row.jh_zszzjsx == 0">{{ scope.row.jh_zszzjsxz }}</span>
            <span style="color: #737675" v-show="scope.row.jh_zszzjsx == 2">{{ scope.row.jh_zszzjsxz }}</span>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column width="160px" label="项目关闭" v-if="columnObj.xmgb">
        <template #default="scope">
          <span style="color: green" v-show="scope.row.jh_gbjsx == 1">{{ scope.row.jh_gbjsxz }}</span>
          <span style="color: red" v-show="scope.row.jh_gbjsx == 0">{{ scope.row.jh_gbjsxz }}</span>
          <span style="color: #737675" v-show="scope.row.jh_gbjsx == 2">{{ scope.row.jh_gbjsxz }}</span>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      :current-page="page.current"
      background
      align="center"
      :page-sizes="[10, 20, 50, 100, 500]"
      :page-size="page.limit"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="limitChangeHandle"
      @current-change="pageChangeHandle"
    >
    </el-pagination>
    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  </div>
</template>

<script>
import { defineComponent, reactive, ref } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import Centralized from '@/components/select/Centralized.vue'
import projectnature from '@/components/select/projectnature.vue'
import Projectstatus from '@/components/select/Projectstatus.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'
export default defineComponent({
  name: '/budget-process/process-04',
  components: {
    projectType,
    affiliatedUnit,
    copyTextBox,
    Centralized,
    projectnature,
    Projectstatus,
    userDialog
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
      dataList: {
        month: new Date(),
        post1: '',
        xmb: ''
      },
      //搜索区域显示与隐藏
      searchShow: true,
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      //穿透数据
      tables: [
        {
          label: '招投标环节',
          value: '/budget-process/process-18'
        },
        {
          label: '合同签订环节',
          value: '/budget-process/process-19'
        },
        {
          label: '项目实施环节',
          value: '/budget-process/process-20'
        },
        {
          label: '项目审计环节',
          value: '/budget-process/process-21'
        },
        {
          label: '结算与资金支付环节',
          value: '/budget-process/process-22'
        },
        {
          label: '决算与增资环节',
          value: '/budget-process/process-23'
        }
      ],
      //表格备足开关
      remarks: false,
      example: [],

      //控制表格列显示与隐藏
      columnObj: {},
      //列设置默认展示字段
      //默认所有
      applicationId: [],
      //列菜单数据
      applications: [
        {
          value: 'QKJXMLXMC',
          label: '项目类型',
          checked: true
        },
        {
          value: 'QKJXMB_MC',
          label: '项目包',
          checked: true
        },
        {
          value: 'QKJYJDW_NAME',
          label: '一级单位',
          checked: true
        },
        {
          value: 'QKJEJDW_NAME',
          label: '二级单位',
          checked: true
        },
        {
          value: 'QKJGKBM_NAME',
          label: '部门',
          checked: true
        },
        {
          value: 'ERPJDYS',
          label: '年度预算',
          checked: true
        },

        {
          value: 'xmcbylx',
          label: '项目储备与立项',
          checked: true
        },
        {
          value: 'ztb',
          label: '招投标',
          checked: true
        },
        {
          value: 'htqd',
          label: '合同签订',
          checked: true
        },
        {
          value: 'xmss',
          label: '项目实施',
          checked: true
        },
        {
          value: 'xmsj',
          label: '项目审计',
          checked: true
        },
        {
          value: 'jsyzjzf',
          label: '结算与资金支付',
          checked: true
        },
        {
          value: 'jsyzz',
          label: '决算与增资',
          checked: true
        },
        {
          value: 'xmgb',
          label: '项目关闭',
          checked: true
        }
      ],
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      loading: false,
      userCode: '',
      userId: '',
      specialorgid: ''
    })
  },
  created() {
    this.handleColumn()
    this.remarksbtn()
  },
  mounted() {
    this.topHeight = document.querySelector('.topBox').clientHeight
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.searchHeight = document.querySelector('.search').clientHeight
    this.setTableHeight()
    this.loading = true
    this.$refs.userDialog.getUser()
  },
  methods: {
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 80 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 80 + 'px'
      }
    },
    //获取页面数据
    loadData() {
      this.loading = true
      const params = {
        qkjxmlxbms: [],
        qkjejdws: [],
        zyear: '',
        zmonth: '',
        page: this.page.page,
        limit: this.page.limit,
        post1: this.dataList.post1,
        pspids: [],
        zjsjd_mc: this.$refs.xmxz.value,
        gkbms: [],
        xmb: this.dataList.xmb,
        zxmzt: this.$refs.xmzt.value,
        specialorgid: this.specialorgid
      }

      params.qkjxmlxbms = this.$refs.type.selectList
      params.qkjejdws = this.$refs.company.selectList
      params.gkbms = this.$refs.gkbm.selectList
      //项目编码
      if (this.$refs.xmbm) {
        params.pspids = this.$refs.xmbm.array
      }
      if (this.dataList.month != '') {
        let time = new Date(this.dataList.month)
        let zyear = time.getFullYear()
        let zmonth = time.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }

      if (this.dataList.month) {
        if (this.remarks == false) {
          baseService.post('/process/process04/', params).then((res) => {
            if (res.success == true) {
              this.loading = false
              this.example = res.data.records
              this.page.total = res.data.total
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
          baseService.post('/process/process04/', params).then((res) => {
            if (res.success == true) {
              this.loading = false
              res.data.list.forEach((item) => {
                this.example.push(item)
              })
              this.page.total = res.data.total
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

    //导出按钮
    async exportBtn() {
      this.loading = true
      if (this.dataList.month) {
        const params = {
          qkjxmlxbms: [],
          qkjejdws: [],
          zyear: '',
          zmonth: '',
          page: this.page.page,
          limit: this.page.limit,
          post1: this.dataList.post1,
          pspids: [],
          zjsjd_mc: this.$refs.xmxz.value,
          gkbms: [],
          xmb: this.dataList.xmb,
          zxmzt: this.$refs.xmzt.value,
          specialorgid: this.specialorgid
        }

        params.qkjxmlxbms = this.$refs.type.selectList
        params.qkjejdws = this.$refs.company.selectList
        params.gkbms = this.$refs.gkbm.selectList
        //项目编码
        if (this.$refs.xmbm) {
          params.pspids = this.$refs.xmbm.array
        }
        if (this.dataList.month != '') {
          let time = new Date(this.dataList.month)
          let zyear = time.getFullYear()
          let zmonth = time.getMonth() + 1
          params.zyear = JSON.stringify(zyear)
          params.zmonth = JSON.stringify(zmonth)
        }
        await baseService.export('/process/process04/export', params).then((res) => {
          this.loading = false
          const blob = res
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          dom.download = '预算全过程及时性监控明细.xlsx'
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
        })
      }
    },
    // 分页控件当前页修改事件
    pageChangeHandle(currentPageNum) {
      this.page.page = currentPageNum
      this.loadData()
    },
    // 分页控件请求数量修改事件
    limitChangeHandle(currentLimitNum) {
      this.page.limit = currentLimitNum
      this.loadData()
    },
    //搜索按钮
    search() {
      this.loadData()
    },

    //重置按钮
    reset() {
      this.dataList.month = new Date()
      this.remarks = false
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.example = []
      this.dataList.post1 = ''
      this.dataList.xmb = ''
      this.$refs.gkbm.clear()
      this.$refs.xmxz.clear()
      this.$refs.xmzt.clear()
      this.$refs.xmbm.clear()
      this.loadData()
    },

    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },

    //表格备注开关
    remarksbtn() {
      if (this.remarks) {
        let name = {
          pspid: '指标名称',
          jh_lxjsxz: '立项及时性',
          jh_ztbjsxz: '招投标及时性',
          jh_zbjgxdjsxz: '中标结果下达及时性',
          jh_htqdjsxz: '合同签订及时性',
          jh_kgjsxz: '开工及时性',
          jh_wzdhjsxz: '物资到货及时性',
          jh_wzlyjsxz: '物资领用及时性',
          jh_jgjsxz: '竣工及时性',
          jh_jsssjsxz: '送审及时性',
          jh_jssjjsxz: '审计及时性',
          jh_zjzfjsxz: '资金支付及时性',
          jh_jusssjsxz: '送审及时性',
          jh_jussjjsxz: '审计及时性',
          jh_zgzzjsxz: '暂估转资及时性',
          jh_zszzjsxz: '正式转资及时性',
          jh_gbjsxz: '关闭及时性',
          pspids: '2',
          jh_lxjsx: '2',
          jh_ztbjsx: '2',
          jh_zbjgxdjsx: '2',
          jh_htqdjsx: '2',
          jh_kgjsx: '2',
          jh_wzdhjsx: '2',
          jh_wzlyjsx: '2',
          jh_jgjsx: '2',
          jh_jsssjsx: '2',
          jh_jssjjsx: '2',
          jh_zjzfjsx: '2',
          jh_jsssjsx: '2',
          jh_jussjjsx: '2',
          jh_zgzzjsx: '2',
          jh_zszzjsx: '2',
          jh_gbjsx: '2',
          jh_jusssjsx: '2'
        }
        let calculation = {
          pspid: '稽核规则（计算公式）',
          jh_lxjsxz: '立项日期-预算下达日期',
          jh_ztbjsxz: '首笔需求提报时间-项目立项时间',
          jh_zbjgxdjsxz: '首个中标日期-对应需求上报日期',
          jh_htqdjsxz: '首份合同签订日期-对应中标日期',
          jh_kgjsxz: '实际开工日期-计划开工时间',
          jh_wzdhjsxz: '首批物资实际到货日期-物资计划到货日期（同批次）',
          jh_wzlyjsxz: '首批物资领用日期-物资到货日期（同批次）',
          jh_jgjsxz: '实际竣工日期-计划竣工日期',
          jh_jsssjsxz: '首次送审日期-实际竣工日期 ',
          jh_jssjjsxz: '首次审定日期-对应收审日期',
          jh_zjzfjsxz: '首笔资金支付日期-财务支出日期',
          jh_jusssjsxz: '首次决算送审日期-实际竣工日期',
          jh_jussjjsxz: '首次决算审定日期-决算收审日期',
          jh_zgzzjsxz: '首次暂估转资日期-实际竣工日期',
          jh_zszzjsxz: '首次正式增资日期-决算报告日期',
          jh_gbjsxz: '关闭时间-最后一笔财务支出',
          pspids: '2',
          jh_lxjsx: '2',
          jh_ztbjsx: '2',
          jh_zbjgxdjsx: '2',
          jh_htqdjsx: '2',
          jh_kgjsx: '2',
          jh_wzdhjsx: '2',
          jh_wzlyjsx: '2',
          jh_jgjsx: '2',
          jh_jsssjsx: '2',
          jh_jssjjsx: '2',
          jh_zjzfjsx: '2',
          jh_jsssjsx: '2',
          jh_jussjjsx: '2',
          jh_zgzzjsx: '2',
          jh_zszzjsx: '2',
          jh_gbjsx: '2',
          jh_jusssjsx: '2'
        }
        let judge = {
          pspid: '判断依据',
          jh_lxjsxz: '1、红色:>15天（暂定）  2、绿色： <=15天（暂定）',
          jh_ztbjsxz: '1、红色 ：省招>60天市招>30天 2、绿色  ：省招<=60天市招<=30天',
          jh_zbjgxdjsxz: '1、红色 ：国招>4个月省招>100天市招>50天2、绿色  ：国招<=4个月省招<=80天市招<=40天',
          jh_htqdjsxz: '1、红色  :>30天2、绿色： <=30天',
          jh_kgjsxz: '1、红色  :>15天2、绿色： <=15天',
          jh_wzdhjsxz: '1、红色  :>15天2、绿色： <=15天',
          jh_wzlyjsxz: '1、红色  :>15天2、绿色： <=15天',
          jh_jgjsxz: '1、红色  :>15天2、绿色： <=15天',
          jh_jsssjsxz: '1、红色  :>7天2、绿色： <=7天',
          jh_jssjjsxz: '1、红色  :>15天2、绿色： <=15天',
          jh_zjzfjsxz: '1、红色  :>60天2、绿色： <=60天',
          jh_jusssjsxz: '1、红色  :>60天2、绿色： <=60天',
          jh_jussjjsxz: '14天（基建项目无固定日期）',
          jh_zgzzjsxz: '1、红色  :>30天2、绿色： <=30天',
          jh_zszzjsxz: '1、红色  :>30天2、绿色： <=30天',
          jh_gbjsxz: '1、红色  :>15天2、绿色： <=15天',
          pspids: '2',
          jh_lxjsx: '2',
          jh_ztbjsx: '2',
          jh_zbjgxdjsx: '2',
          jh_htqdjsx: '2',
          jh_kgjsx: '2',
          jh_wzdhjsx: '2',
          jh_wzlyjsx: '2',
          jh_jgjsx: '2',
          jh_jsssjsx: '2',
          jh_jssjjsx: '2',
          jh_zjzfjsx: '2',
          jh_jsssjsx: '2',
          jh_jussjjsx: '2',
          jh_zgzzjsx: '2',
          jh_zszzjsx: '2',
          jh_gbjsx: '2',
          jh_jusssjsx: '2'
        }
        this.example.unshift(judge)
        this.example.unshift(calculation)
        this.example.unshift(name)
      } else {
        this.example.splice(0, 3)
      }
    },

    //处理列数据
    handleColumn() {
      this.applications.forEach((item) => {
        this.applicationId.push(item.value)
        this.columnObj[item.value] = item.checked
      })
    },

    //列表设置
    listShow(value, checked) {
      for (let i in this.columnObj) {
        if (i == value) {
          this.columnObj[i] = checked
        }
      }
    },

    //穿透跳转
    goTable(path, pspid) {
      this.$router.push({ path: path, query: { pspid: pspid } })
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.$refs.company.getAffiliatedUnit(this.specialorgid)
      this.$refs.gkbm.getProjectType(this.specialorgid)
    }
  }
})
</script>
<style lang="less" scoped>
.proBrwDetail {
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
</style>
