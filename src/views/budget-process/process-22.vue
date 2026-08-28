<template>
  <div class="settlementCT" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="title">
      <div class="titleBox">
        <h2>项目结算与资金支付信息</h2>
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

    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="结算信息" name="first">
        <div class="search" v-show="searchShow">
          <el-form label-width="110px" label-position="left">
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
          <el-table-column label="基本信息">
            <el-table-column width="160" prop="pspid" label="项目编号"></el-table-column>
            <el-table-column width="290" prop="post1" label="项目名称"></el-table-column>
            <el-table-column width="160" prop="qkjxmlxmc" label="项目类型"></el-table-column>
            <el-table-column width="160" prop="qkjxmb_mc" label="项目包"></el-table-column>
            <el-table-column width="160" prop="zjsjd_mc" label="项目性质"></el-table-column>
            <el-table-column width="230" prop="qkjyjdw_name" label="一级单位"></el-table-column>
            <el-table-column width="230" prop="qkjejdw_name" label="二级单位"></el-table-column>
            <el-table-column width="160" prop="qkjgkbm_name" label="归口部门"></el-table-column>
            <el-table-column width="160" prop="erpjdys" label="年度预算"></el-table-column>
          </el-table-column>

          <el-table-column label="当年财务支出情况（不含税）">
            <el-table-column width="160" prop="ndzcb_hs" label="小计"></el-table-column>
            <el-table-column width="160" prop="ndzyclf_bhs" label="自营材料费"></el-table-column>
            <el-table-column width="160" prop="ndwbclf_bhs" label="外包材料费"></el-table-column>
            <el-table-column width="160" prop="ndwbjjf_bhs" label="外包检修费"></el-table-column>
            <el-table-column width="160" prop="ndjzgczc_bhs" label="建筑工程支出"></el-table-column>
            <el-table-column width="160" prop="ndazgczc_bhs" label="安装工程支出"></el-table-column>
            <el-table-column width="160" prop="ndsbgzzc_bhs" label="设备购置支出"></el-table-column>
            <el-table-column width="160" prop="ndxmfrglf_bhs" label="项目法人管理费"></el-table-column>
            <el-table-column width="160" prop="qtzc1" label="其他支出"></el-table-column>
          </el-table-column>
          <el-table-column label="累计财务支出情况（不含税）">
            <el-table-column width="160" prop="dncwzc" label="小计"></el-table-column>
            <el-table-column width="160" prop="ljzzclf_bhs" label="自营材料费"></el-table-column>
            <el-table-column width="160" prop="ljwbclf_bhs" label="外包材料费"></el-table-column>
            <el-table-column width="160" prop="ljwbjxf_bhs" label="外包检修费"></el-table-column>
            <el-table-column width="160" prop="ljjzgczc_bhs" label="建筑工程支出"></el-table-column>
            <el-table-column width="160" prop="ljanzgzc_bhs" label="安装工程支出"></el-table-column>
            <el-table-column width="160" prop="ljsbgzzc_bhs" label="设备购置支出"></el-table-column>
            <el-table-column width="160" prop="ljxmfrglf_bhs" label="项目法人管理费"></el-table-column>
            <el-table-column width="160" prop="qtzc2" label="其他支出"></el-table-column>
          </el-table-column>
          <el-table-column label="当年财务支出情况（含税）">
            <el-table-column width="160" prop="ndzc_hs" label="小计"></el-table-column>
            <el-table-column width="160" prop="ndzyclf_hs" label="自营材料费"></el-table-column>
            <el-table-column width="160" prop="ndwbclf_hs" label="外包材料费"></el-table-column>
            <el-table-column width="160" prop="ndwbjxf_hs" label="外包检修费"></el-table-column>
            <el-table-column width="160" prop="ndjzgczc_hs" label="建筑工程支出"></el-table-column>
            <el-table-column width="160" prop="ndazgczc_hs" label="安装工程支出"></el-table-column>
            <el-table-column width="160" prop="ndsbgzzc_hs" label="设备购置支出"></el-table-column>
            <el-table-column width="160" prop="ndxmfrglf_hs" label="项目法人管理费"></el-table-column>
            <el-table-column width="160" prop="qtzc3" label="其他支出"></el-table-column>
          </el-table-column>
          <el-table-column label="累计财务支出情况（含税）">
            <el-table-column width="160" prop="dncwzc2" label="小计"></el-table-column>
            <el-table-column width="160" prop="ljzzclf_hs" label="自营材料费"></el-table-column>
            <el-table-column width="160" prop="ljwbclf_hs" label="外包材料费"></el-table-column>
            <el-table-column width="160" prop="ljwbjxf_hs" label="外包检修费"></el-table-column>
            <el-table-column width="160" prop="ljjzgczc_hs" label="建筑工程支出"></el-table-column>
            <el-table-column width="160" prop="ljangczc_hs" label="安装工程支出"></el-table-column>
            <el-table-column width="160" prop="ljsbgzxc_hs" label="设备购置支出"></el-table-column>
            <el-table-column width="160" prop="ljxmfrglf_hs" label="项目法人管理费"></el-table-column>
            <el-table-column width="160" prop="qtzc4" label="其他支出"></el-table-column>
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
      </el-tab-pane>

      <el-tab-pane label="资金支付信息" name="second">
        <div v-show="searchShow">
          <el-form label-width="110px" label-position="left">
            <el-row :gutter="24">
              <el-col :span="6">
                <el-form-item label="项目编码：">
                  <copyTextBox class="formWidth" ref="xmbm2"></copyTextBox>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="付款申请编号：">
                  <copyTextBox class="formWidth" ref="fksqbh"></copyTextBox>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="所属单位：">
                  <affiliatedUnit class="formWidth" ref="company2"></affiliatedUnit>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="项目名称：">
                  <el-input class="formWidth" v-model="dataList2.post1" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="6">
                <el-form-item label="付款申请日期：">
                  <el-date-picker
                    v-model="dataList2.fksqrq"
                    value-format="YYYYMMDD"
                    format="YYYY-MM-DD"
                    type="daterange"
                    :picker-options="pickerOptions0"
                    range-separator="至"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="归口部门：">
                  <Centralized class="formWidth" ref="gkbm2"></Centralized>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="项目类型：">
                  <projectType class="formWidth" ref="type2"></projectType>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="银经付凭证号：">
                  <el-input class="formWidth" v-model="dataList2.yqpzh" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="6">
                <el-form-item label="截至日期：">
                  <el-date-picker v-model="dataList2.month" type="month" placeholder="选择月"> </el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="项目性质：">
                  <projectnature class="formWidth" ref="xmxz2"></projectnature>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="凭证日期：">
                  <el-date-picker
                    v-model="dataList2.bldat"
                    value-format="YYYYMMDD"
                    format="YYYY-MM-DD"
                    type="daterange"
                    :picker-options="pickerOptions0"
                    range-separator="至"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="项目包：">
                  <el-input v-model="dataList2.xmb" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="6"></el-col>
              <el-col :span="6"></el-col>
              <el-col :span="6"></el-col>
              <el-col :span="6" class="btnPostion">
                <el-form-item>
                  <el-button type="primary" icon="el-icon-search" @click="search2">查 询</el-button>
                  <el-button icon="el-icon-refresh-right" @click="reset2">重 置</el-button>
                  <el-button type="warning" icon="el-icon-download" @click="exportBtn2">导 出</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <el-table
          border
          :data="example2"
          v-if="tableHeight"
          :height="tableHeight2"
          :span-method="objectSpanMethod1"
          style="width: 100%"
          :header-cell-style="{ 'text-align': 'center' }"
          :cell-style="{ 'text-align': 'center' }"
        >
          <el-table-column label="基本信息">
            <el-table-column width="160" prop="pspid" label="项目编码"></el-table-column>
            <el-table-column width="290" prop="post1" label="项目名称"></el-table-column>
            <el-table-column width="160" prop="qkjxmlxmc" label="项目类型"></el-table-column>
            <el-table-column width="160" prop="qkjxmb_mc" label="项目包"></el-table-column>
            <el-table-column width="160" prop="zjsjd_mc" label="项目性质"></el-table-column>
            <el-table-column width="230" prop="qkjyjdw_name" label="一级单位"></el-table-column>
            <el-table-column width="230" prop="qkjejdw_name" label="二级单位"></el-table-column>
            <el-table-column width="160" prop="qkjgkbm_name" label="归口部门"></el-table-column>
            <el-table-column width="160" prop="erpjdys" label="年度预算"></el-table-column>
            <el-table-column width="160" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>
            <el-table-column width="160" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>
          </el-table-column>
          <el-table-column label="资金支付情况">
            <el-table-column width="160" prop="zfksq" label="付款申请编号"></el-table-column>
            <el-table-column width="160" prop="fksqrq" label="付款申请日期"></el-table-column>
            <el-table-column width="160" prop="lifnr" label="收款单位编码"></el-table-column>
            <el-table-column width="160" prop="lifnr_name" label="收款单位名称"></el-table-column>
            <el-table-column width="160" prop="zhxmzfje" label="支付金额"></el-table-column>
            <el-table-column width="160" prop="yqpzh" label="银经付凭证号"></el-table-column>
            <el-table-column width="160" prop="bldat" label="凭证日期"></el-table-column>
          </el-table-column>
        </el-table>

        <el-pagination
          :current-page="page2.current"
          background
          align="center"
          :page-sizes="[10, 20, 50, 100, 500]"
          :page-size="page2.limit"
          :total="parseInt(page2.total + '')"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="limitChangeHandle2"
          @current-change="pageChangeHandle2"
        >
        </el-pagination>
      </el-tab-pane>
    </el-tabs>

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
  name: '/budget-process/process-22',
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
      dataList: {
        post1: '',
        month: new Date(),
        xmb: ''
      },
      dataList2: {
        post1: '',
        month: new Date(),
        xmb: '',
        fksqrq: '',
        yqpzh: '',
        bldat: ''
      },

      activeName: 'first',
      dataListLoading2: false,

      spanArr: [], // 用于存放需要合并的行的个数
      spanIndex: 0, // 记录spanArr数组的下标

      spanArr1: [], // 用于存放需要合并的行的个数
      spanIndex1: 0, // 记录spanArr数组的下标

      example: [],
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      example2: [],
      page2: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      searchShow: true,
      titleHeight: '',
      searchHeight: '',
      heightNum: '',
      tableHeight: '',
      tableHeight2: '',
      loading: false,
      userCode: '',
      userId: '',
      specialorgid: ''
    })
  },
  watch: {
    'store.state.jsyzjzfData.pspid': {
      handler: function (val) {
        if (val) {
          this.$refs.xmbm.ids = val
          this.$refs.xmbm.text = val
          this.$refs.xmbm.array.push(val)
          this.specialorgid = JSON.parse(this.store.state.jsyzjzfData.specialorgid)
          this.loadData()
          // 清空vuex中的数据
          this.store.commit('jsyzjzfData', {})
        }
      }
    },
    deep: true
  },
  mounted() {
    this.titleHeight = document.querySelector('.title').clientHeight
    this.searchHeight = document.querySelector('.search').clientHeight
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.setTableHeight()
    this.setTableHeight2()
    if (this.store.state.jsyzjzfData.pspid && this.store.state.jsyzjzfData.specialorgid) {
      this.$refs.xmbm.ids = this.store.state.jsyzjzfData.pspid
      this.$refs.xmbm.text = this.store.state.jsyzjzfData.pspid
      this.$refs.xmbm.array.push(this.store.state.jsyzjzfData.pspid)
      this.specialorgid = JSON.parse(this.store.state.jsyzjzfData.specialorgid)
      this.loadData()
      // 清空vuex中的数据
      this.store.commit('jsyzjzfData', {})
    } else {
      this.loading = true
      this.$refs.userDialog.getUser()
    }
  },
  methods: {
    //结算信息查询按钮
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
    //结算信息重置按钮
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
    //结算信息获取数据
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
      //所属单位
      params.qkjejdws = this.$refs.company.selectList
      baseService.post('/process/process22/tab1/', params).then((res) => {
        if (res.success == true) {
          this.loading = false
          this.example = res.data.list
          this.page.total = res.data.total
          this.getSpanArr(this.example)
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    //结算信息导出
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
      //所属单位
      params.qkjejdws = this.$refs.company.selectList
      if (this.dataList.month != '') {
        let time = new Date(this.dataList.month)
        let zyear = time.getFullYear()
        let zmonth = time.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      await baseService.export('/process/process22/export1', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '结算与资金支付环节穿透_结算信息.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    },
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.titleHeight - this.searchHeight - 155 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.titleHeight + this.searchHeight - 310 + 'px'
      }
    },

    //资金支付信息查询按钮
    search2() {
      if (this.dataList2.month) {
        this.loadData2()
      } else {
        ElMessage({
          message: '请选择日期查询',
          iconClass: 'el-icon-search',
          customClass: 'tipsBox'
        })
      }
    },
    //资金支付信息重置按钮
    reset2() {
      this.$refs.xmbm2.clear()
      this.$refs.fksqbh.clear()
      this.$refs.company2.clear()
      this.dataList2.post1 = ''
      this.dataList2.fksqrq = ''
      this.$refs.gkbm2.clear()
      this.$refs.type2.clear()
      this.dataList2.yqpzh = ''
      this.dataList2.month = new Date()
      this.$refs.xmxz2.clear()
      this.dataList2.bldat = ''
      this.dataList2.xmb = ''
      this.example2 = []
      this.search2()
    },
    //资金支付信息获取数据
    loadData2() {
      this.loading = true
      this.spanArr1 = [] // 用于存放需要合并的行的个数
      this.spanIndex1 = 0 // 记录spanArr数组的下标
      const params = {
        pspids: [],
        zfksqs: [],
        qkjejdws: [],
        post1: this.dataList2.post1,
        sfksqrq: '',
        efksqrq: '',
        gkbms: [],
        qkjxmlxbms: [],
        yqpzh: this.dataList2.yqpzh,
        zyear: '',
        zmonth: '',
        zjsjd_mc: this.$refs.xmxz2.value,
        sbldat: '',
        ebldat: '',
        xmb: this.dataList2.xmb,
        page: this.page2.page,
        limit: this.page2.limit,
        specialorgid: this.specialorgid
      }
      //项目编码
      params.pspids = this.$refs.xmbm2.array
      //付款申请编码
      params.zfksqs = this.$refs.fksqbh.array
      //所属单位
      params.qkjejdws = this.$refs.company2.selectList
      //付款申请日期
      if (this.dataList2.fksqrq) {
        params.sfksqrq = this.dataList2.fksqrq[0]
        params.efksqrq = this.dataList2.fksqrq[1]
      }
      //归口部门
      params.gkbms = this.$refs.gkbm2.selectList
      //项目类型
      params.qkjxmlxbms = this.$refs.type2.selectList
      //截至日期
      if (this.dataList2.month != '') {
        let time = new Date(this.dataList2.month)
        let zyear = time.getFullYear()
        let zmonth = time.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      //凭证日期
      if (this.dataList2.bldat) {
        params.sbldat = this.dataList2.bldat[0]
        params.ebldat = this.dataList2.bldat[1]
      }
      baseService.post('/process/process22/tab2/', params).then((res) => {
        if (res.success == true) {
          this.loading = false
          this.example2 = res.data.list
          this.page2.total = res.data.total
          this.getSpanArr(res.data)
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    //资金支付信息导出
    async exportBtn2() {
      this.loading = true
      const params = {
        pspids: [],
        zfksqs: [],
        qkjejdws: [],
        post1: this.dataList2.post1,
        sfksqrq: '',
        efksqrq: '',
        gkbms: [],
        qkjxmlxbms: [],
        yqpzh: this.dataList2.yqpzh,
        zyear: '',
        zmonth: '',
        zjsjd_mc: this.$refs.xmxz2.value,
        sbldat: '',
        ebldat: '',
        xmb: this.dataList2.xmb,
        page: this.page2.page,
        limit: this.page2.limit,
        specialorgid: this.specialorgid
      }
      //项目编码
      params.pspids = this.$refs.xmbm2.array
      //付款申请编码
      params.zfksqs = this.$refs.fksqbh.array
      //所属单位
      params.qkjejdws = this.$refs.company2.selectList
      //付款申请日期
      if (this.dataList2.fksqrq) {
        params.sfksqrq = this.dataList2.fksqrq[0]
        params.efksqrq = this.dataList2.fksqrq[1]
      }
      //归口部门
      params.gkbms = this.$refs.gkbm2.selectList
      //项目类型
      params.qkjxmlxbms = this.$refs.type2.selectList
      //截至日期
      if (this.dataList2.month != '') {
        let time = new Date(this.dataList.month)
        let zyear = time.getFullYear()
        let zmonth = time.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      //凭证日期
      if (this.dataList2.bldat) {
        params.sbldat = this.dataList2.bldat[0]
        params.ebldat = this.dataList2.bldat[1]
      }
      await baseService.export('/process/process22/export2', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '结算与资金支付环节穿透_资金支付信息.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    },

    setTableHeight2() {
      if (this.searchShow == true) {
        this.tableHeight2 = this.heightNum - this.titleHeight - this.searchHeight - 255 + 'px'
      } else {
        this.tableHeight2 = this.heightNum - this.titleHeight + this.searchHeight - 310 + 'px'
      }
    },
    handleClick() {
      if (this.activeName == 'second') {
        this.$refs.type2.getProjectType(this.specialorgid)
        this.$refs.company2.getAffiliatedUnit(this.specialorgid)
        this.$refs.gkbm2.getProjectType(this.specialorgid)
      }
    },
    getSpanArr(data) {
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          this.spanArr.push(1)
          this.spanIndex = 0
          this.spanArr1.push(1)
          this.spanIndex1 = 0
        } else {
          if (data[i].pspid === data[i - 1].pspid) {
            this.spanArr1[this.spanIndex1] += 1
            this.spanArr1.push(0)
          } else {
            this.spanArr1.push(1)
            this.spanIndex1 = i
          }
        }
      }
    },

    // 分页控件当前页修改事件
    pageChangeHandle2(currentPageNum) {
      this.page2.page = currentPageNum
      this.loadData2()
    },
    // 分页控件请求数量修改事件
    limitChangeHandle2(currentLimitNum) {
      this.page2.limit = currentLimitNum
      this.loadData2()
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

    // objectSpanMethod1({ row, column, rowIndex, columnIndex }) {},

    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
      this.setTableHeight2()
    },

    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.$refs.company.getAffiliatedUnit(this.specialorgid)
      this.$refs.company2.getAffiliatedUnit(this.specialorgid)
      this.$refs.gkbm.getProjectType(this.specialorgid)
      this.$refs.gkbm2.getProjectType(this.specialorgid)
    }
  }
})
</script>

<style lang="less" scoped>
.settlementCT {
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

:deep(.el-range-separator) {
  padding: 0;
}
</style>
