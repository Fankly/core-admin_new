<template>
  <div class="accountsCT" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目决算与增资信息</h2>
        </div>
        <div class="searchBox">
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
        <el-form label-width="100px" label-position="left">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目编码：">
                <copyTextBox class="formWidth" ref="xmbm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目性质：">
                <projectnature class="formWidth" ref="xmxz"></projectnature>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
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
              <el-form-item label="项目包：">
                <el-input class="formWidth" v-model="dataList.xmb" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="截至日期：">
                <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"> </el-date-picker>
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
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6"></el-col>
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
      border
      :data="example"
      v-if="tableHeight"
      :height="tableHeight"
      style="width: 100%; margin-top: 20px"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="基本信息">
        <el-table-column width="120" prop="pspid" label="项目编号"></el-table-column>
        <el-table-column width="290" prop="post1" label="项目名称"></el-table-column>
        <el-table-column width="120" prop="qkjxmlxmc" label="项目类型"></el-table-column>
        <el-table-column width="120" prop="qkjxmb_mc" label="项目包"></el-table-column>
        <el-table-column width="120" prop="zjsjd_mc" label="项目性质"></el-table-column>
        <el-table-column width="230" prop="qkjyjdw_name" label="一级单位"></el-table-column>
        <el-table-column width="230" prop="qkjejdw_name" label="二级单位"></el-table-column>
        <el-table-column width="120" prop="qkjgkbm_name" label="归口部门"></el-table-column>
        <el-table-column width="120" prop="erpjdys" label="年度预算"></el-table-column>
        <el-table-column width="160" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>
        <el-table-column width="160" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>
      </el-table-column>
      <el-table-column width="160" prop="zgzzrq" label="首笔增资时间"></el-table-column>
      <el-table-column width="160" prop="zgzzje" label="首笔增资金额"></el-table-column>
      <el-table-column width="160" prop="zjzzrq" label="最新增资时间"></el-table-column>
      <el-table-column width="160" prop="zdnzzje" label="累计增资金额"></el-table-column>
      <el-table-column width="160" prop="jus_sendrq" label="决算送审日期"></el-table-column>
      <el-table-column width="160" prop="jus_sdrq" label="决算审定日期"></el-table-column>
      <el-table-column width="160" prop="jus_sendamt" label="决算送审金额"></el-table-column>
      <el-table-column width="160" prop="jus_settleamt" label="决算审定金额"></el-table-column>
      <el-table-column width="160" prop="zjgcye" label="在建工程余额"></el-table-column>
      <el-table-column width="160" prop="jus_sjbgh" label="决算审计报告文号"></el-table-column>
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
import { defineComponent, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import Centralized from '@/components/select/Centralized.vue'
import projectnature from '@/components/select/projectnature.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'

export default defineComponent({
  name: '/budget-process/process-23',
  components: {
    projectType,
    affiliatedUnit,
    copyTextBox,
    Centralized,
    projectnature,
    userDialog
  },
  setup() {
    const store = useStore()
    const helpHandle = () => {
      const url = store.getters.getMenuMsg.url
      showHelpMsg(url)
    }
    return reactive({
      store,
      helpHandle,
      example: [],
      searchShow: true,
      dataList: {
        post1: '',
        xmb: '',
        month: new Date()
      },
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      loading: false,
      userCode: '',
      userId: '',
      specialorgid: ''
    })
  },
  watch: {
    'store.state.jsyzzData.pspid': {
      handler: function (val) {
        if (val) {
          this.$refs.xmbm.ids = val
          this.$refs.xmbm.text = val
          this.$refs.xmbm.array.push(val)
          this.specialorgid = JSON.parse(this.store.state.jsyzzData.specialorgid)
          this.loadData()
          // 清空vuex中的数据
          this.store.commit('jsyzzData', {})
        }
      }
    },
    deep: true
  },
  mounted() {
    this.topHeight = document.querySelector('.topBox').clientHeight
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.searchHeight = document.querySelector('.search').clientHeight
    this.setTableHeight()
    if (this.store.state.jsyzzData.pspid && this.store.state.jsyzzData.specialorgid) {
      this.$refs.xmbm.ids = this.store.state.jsyzzData.pspid
      this.$refs.xmbm.text = this.store.state.jsyzzData.pspid
      this.$refs.xmbm.array.push(this.store.state.jsyzzData.pspid)
      this.specialorgid = JSON.parse(this.store.state.jsyzzData.specialorgid)
      this.loadData()
      // 清空vuex中的数据
      this.store.commit('jsyzzData', {})
    } else {
      this.loading = true
      this.$refs.userDialog.getUser()
    }
  },
  methods: {
    loadData() {
      this.loading = true
      const params = {
        pspids: [],
        zjsjd_mc: this.$refs.xmxz.value,
        gkbms: [],
        post1: this.dataList.post1,
        xmb: this.dataList.xmb,
        zyear: '',
        zmonth: '',

        qkjxmlxbms: [],
        qkjejdws: [],

        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid
      }
      //项目编码
      params.pspids = this.$refs.xmbm.array
      //归口部门
      params.gkbms = this.$refs.gkbm.selectList
      //截至日期
      if (this.dataList.month != '') {
        let time = new Date(this.dataList.month)
        let zyear = time.getFullYear()
        let zmonth = time.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      //项目类型
      params.qkjxmlxbms = this.$refs.type.selectList
      // 所属单位
      params.qkjejdws = this.$refs.company.selectList

      baseService.post('/process/process23/', params).then((res) => {
        if (res.success == true) {
          this.loading = false
          this.example = res.data.list
          this.page.total = res.data.total
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },

    //导出按钮
    async exportBtn() {
      this.loading = true
      const params = {
        pspids: [],
        zjsjd_mc: this.$refs.xmxz.value,
        gkbms: [],
        post1: this.dataList.post1,
        xmb: this.dataList.xmb,
        zyear: '',
        zmonth: '',

        qkjxmlxbms: [],
        qkjejdws: [],

        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid
      }
      //项目编码
      params.pspids = this.$refs.xmbm.array
      //归口部门
      params.gkbms = this.$refs.gkbm.selectList
      //截至日期
      if (this.dataList.month != '') {
        let time = new Date(this.dataList.month)
        let zyear = time.getFullYear()
        let zmonth = time.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      //项目类型
      params.qkjxmlxbms = this.$refs.type.selectList
      // 所属单位
      params.qkjejdws = this.$refs.company.selectList
      await baseService.export('/process/process23/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '决算与增资环节穿透.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    },
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 100 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 100 + 'px'
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

    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },
    //查询按钮
    search() {
      if (this.dataList.month) {
        this.loadData()
      } else {
        ElMessage({
          message: '请选择日期查询',
          iconClass: 'el-icon-search',
          customClass: 'tipsBox'
        })
      }
    },
    //重置按钮
    reset() {
      this.$refs.xmbm.clear()
      this.$refs.xmxz.clear()
      this.$refs.gkbm.clear()
      this.dataList.post1 = ''
      this.dataList.xmb = ''
      this.dataList.month = new Date()
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.example = []
      this.search()
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
.accountsCT {
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

  .el-switch__core {
    background-color: #ccc !important;
  }
}

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-range-separator) {
  padding: 0;
}
</style>
