<template>
  <div class="accounts24" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>在线稽核总表</h2>
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
        <el-form label-width="110px" label-position="left">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目编码：">
                <copyTextBox ref="xmbm" class="formWidth"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <el-input class="formWidth" v-model="dataList.name" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <projectType class="formWidth" ref="type"></projectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目包名称：">
                <el-input class="formWidth" v-model="dataList.xmbmc"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="截至年月：">
                <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"> </el-date-picker>
              </el-form-item>
            </el-col>
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
      :span-method="objectSpanMethod"
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column width="160" fixed prop="pspid" label="项目编号"></el-table-column>
      <el-table-column width="300" fixed prop="post1" label="项目名称"></el-table-column>
      <el-table-column width="160" prop="qkjxmlxmc" label="项目类型"></el-table-column>
      <el-table-column width="160" prop="qkjxmb_mc" label="项目包名称"></el-table-column>
      <el-table-column width="300" prop="qkjyjdw_name" label="一级单位"></el-table-column>
      <el-table-column width="300" prop="qkjejdw_name" label="二级单位"></el-table-column>
      <el-table-column width="160" prop="qkjgkbm_name" label="归口部门"></el-table-column>
      <el-table-column width="160" prop="erpztys" label="项目总预算"></el-table-column>
      <el-table-column width="160" prop="erpjdys" label="当年预算"></el-table-column>
      <el-table-column width="160" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>
      <el-table-column width="160" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>

      <el-table-column label="稽核疑点数量">
        <el-table-column width="160" v-if="columnObj.lxjsx" prop="jh_lxjsx" label="立项及时性异常"> </el-table-column>
        <el-table-column width="160" v-if="columnObj.ztbjsx" prop="jh_ztbjsx" label="招投标及时性异常"> </el-table-column>
        <el-table-column width="160" v-if="columnObj.zbxdjsx" prop="jh_zbjgxdjsx" label="中标下达及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.ztbcy" prop="ztbjsx_sl" label="招投标差异异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.htqdjsx" prop="jh_htqdjsx" label="合同签订及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.htqdgfx" prop="jh_htqdgfx_sl" label="合同签订规范性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.htlygfx" prop="jh_htlygfx_sl" label="合同履约规范性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.kgjsx" prop="jh_kgjsx" label="开工及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.jgjsx" prop="jh_jgjsx" label="竣工及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.wzzlzt" prop="jh_wzzlztbs" label="物资整领整退"></el-table-column>
        <el-table-column width="160" v-if="columnObj.wztklg" prop="jh_wztkl" label="物资退库率高"></el-table-column>
        <el-table-column width="160" v-if="columnObj.wzcqg" prop="jh_wzcqgce" label="物资超欠拱"></el-table-column>
        <el-table-column width="160" v-if="columnObj.ystzcyd" prop="jh_ndystzl" label="预算调整差异大"></el-table-column>
        <el-table-column width="160" v-if="columnObj.ystzpcg" prop="jh_ndystzcs" label="预算调整频次高"></el-table-column>
        <el-table-column width="160" v-if="columnObj.jsssjsx" prop="jh_jsssjsx" label="结算送审及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.jssjjsx" prop="jh_jssjjsx" label="结算审计及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.sjhjl" prop="jh_sjhjl" label="审计核减率高"></el-table-column>
        <el-table-column width="160" v-if="columnObj.zjzfjsx" prop="jh_zjzfjsx" label="资金支付及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.chtzf" prop="jh_htzfgfx_sl" label="超合同支付"></el-table-column>
        <el-table-column width="160" v-if="columnObj.skdwbyz" prop="jh_skdwyzx" label="收款单位不一致"></el-table-column>
        <el-table-column width="160" v-if="columnObj.juessjjsx" prop="jh_jusssjsxz" label="决算送审及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.juesusjjsx" prop="jh_jussjjsx" label="决算审计及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.zgzjsx" prop="jh_zgzzjsx" label="暂估转及时性"></el-table-column>
        <el-table-column width="160" v-if="columnObj.zszzjsx" prop="jh_zszzjsx" label="正式转资及时性"></el-table-column>
        <el-table-column width="160" v-if="columnObj.zgzzhlx" prop="jh_zgzzhlx" label="暂估增资合理性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.zjgcye" prop="jh_zjgcfs" label="在建工程余额异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.gbjsx" prop="jh_gbjsx" label="关闭及时性异常"></el-table-column>
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
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import Centralized from '@/components/select/Centralized.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'

export default defineComponent({
  name: '/budget-process/process-24',
  components: {
    projectType,
    affiliatedUnit,
    copyTextBox,
    userDialog,
    Centralized
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
        month: new Date(),
        name: '',
        xmbmc: ''
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
      segment: [
        {
          value: 'lxjsx',
          label: '立项及时性异常',
          checked: true
        },
        {
          value: 'ztbjsx',
          label: '招投标及时性异常',
          checked: true
        },
        {
          value: 'zbxdjsx',
          label: '中标下达及时性异常',
          checked: true
        },
        {
          value: 'ztbcy',
          label: '招投标差异异常',
          checked: true
        },
        {
          value: 'htqdjsx',
          label: '合同签订及时性异常',
          checked: true
        },
        {
          value: 'htqdgfx',
          label: '合同签订规范性异常',
          checked: true
        },
        {
          value: 'htlygfx',
          label: '合同履约规范性异常',
          checked: true
        },
        {
          value: 'kgjsx',
          label: '开工及时性异常',
          checked: true
        },
        {
          value: 'jgjsx',
          label: '竣工及时性异常',
          checked: true
        },
        {
          value: 'wzzlzt',
          label: '物资整领整退',
          checked: true
        },
        {
          value: 'wztklg',
          label: '物资退库率高',
          checked: true
        },
        {
          value: 'wzcqg',
          label: '物资超欠拱',
          checked: true
        },
        {
          value: 'ystzcyd',
          label: '预算调整差异大',
          checked: true
        },
        {
          value: 'ystzpcg',
          label: '预算调整频此高',
          checked: true
        },
        {
          value: 'jsssjsx',
          label: '结算送审及时性异常',
          checked: true
        },
        {
          value: 'jssjjsx',
          label: '结算审计及时性异常',
          checked: true
        },
        {
          value: 'sjhjl',
          label: '审计核减率高',
          checked: true
        },
        {
          value: 'zjzfjsx',
          label: '资金支付及时性异常',
          checked: true
        },
        {
          value: 'chtzf',
          label: '超合同支付',
          checked: true
        },
        {
          value: 'skdwbyz',
          label: '收款单位不一致',
          checked: true
        },
        {
          value: 'juessjjsx',
          label: '决算送审及时性异常',
          checked: true
        },
        {
          value: 'juesusjjsx',
          label: '决算审计及时性异常',
          checked: true
        },
        {
          value: 'zgzjsx',
          label: '暂估转及时性',
          checked: true
        },
        {
          value: 'zszzjsx',
          label: '正式转资及时性',
          checked: true
        },
        {
          value: 'zgzzhlx',
          label: '暂估增资合理性异常',
          checked: true
        },
        {
          value: 'zjgcye',
          label: '在建工程余额异常',
          checked: true
        },
        {
          value: 'gbjsx',
          label: '关闭及时性异常',
          checked: true
        }
      ],
      segmentIds: [],
      columnObj: {},
      loading: false,
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
        this.tableHeight = this.heightNum - this.topHeight - 80 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 80 + 'px'
      }
    },
    loadData() {
      this.loading = true
      const params = {
        pspids: [],
        post1: this.dataList.name,
        qkjxmlxbms: [],
        qkjejdws: [],
        zyear: '',
        zmonth: '',
        qkjxmb: this.dataList.xmbmc,
        gkbms: [],
        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid
      }
      //项目编码
      params.pspids = this.$refs.xmbm.array
      //项目类型
      params.qkjxmlxbms = this.$refs.type.selectList
      //单位
      params.qkjejdws = this.$refs.company.selectList
      //归口部门
      params.gkbms = this.$refs.gkbm.selectList
      if (this.dataList.month != '') {
        let time = new Date(this.dataList.month)
        let zyear = time.getFullYear()
        let zmonth = time.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      baseService.post('/process/process24/', params).then((res) => {
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
    },

    //导出按钮
    async exportBtn() {
      this.loading = true
      const params = {
        pspids: [],
        post1: this.dataList.name,
        qkjxmlxbms: [],
        qkjejdws: [],
        zyear: '',
        zmonth: '',
        qkjxmb: this.dataList.xmbmc,
        gkbms: [],
        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid
      }
      //项目编码
      params.pspids = this.$refs.xmbm.array
      //项目类型
      params.qkjxmlxbms = this.$refs.type.selectList
      //单位
      params.qkjejdws = this.$refs.company.selectList
      //归口部门
      params.gkbms = this.$refs.gkbm.selectList
      if (this.dataList.month != '') {
        let time = new Date(this.dataList.month)
        let zyear = time.getFullYear()
        let zmonth = time.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      await baseService.export('/process/process24/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '在线稽核总表.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
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
      this.dataList.name = ''
      this.dataList.xmbmc = ''
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.$refs.xmbm.clear()
      this.$refs.gkbm.clear()
      this.example = []
      this.loadData()
    },
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },
    //处理环节数据
    handleColumn() {
      this.segment.forEach((item) => {
        this.segmentIds.push(item.value)
        this.columnObj[item.value] = true
      })
    },
    //项目环节
    listShow(value, checked) {
      for (let i in this.columnObj) {
        if (i == value) {
          this.columnObj[i] = checked
        }
      }
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
.accounts24 {
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
