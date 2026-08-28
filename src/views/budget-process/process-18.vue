<template>
  <div class="BiddingCT" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目招标信息</h2>
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
        <el-form label-width="110px" label-position="left">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目编码：">
                <copyTextBox class="formWidth" ref="xmbm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="计划批次名称：">
                <el-input class="formWidth" v-model="dataList.zzbpcmc" />
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
              <el-form-item label="采购申请号：">
                <copyTextBox class="formWidth" ref="cgsqh"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="需求上报日期：">
                <el-date-picker
                  v-model="dataList.zhzsj"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  :picker-options="pickerOptions0"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <projectType class="formWidth" ref="type"></projectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="供应商编码：">
                <copyTextBox class="formWidth" ref="gysbm"></copyTextBox>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="中标日期：">
                <el-date-picker
                  v-model="dataList.zdate"
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
                <el-input class="formWidth" v-model="dataList.xmb" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="供应商名称：">
                <el-input class="formWidth" v-model="dataList.lifnr_name" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="预算年度：">
                <el-date-picker
                  v-model="dataList.nd"
                  value-format="YYYY"
                  format="YYYY"
                  type="year"
                  placeholder="请选择"
                  :prefix-icon="customPrefix"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目性质：">
                <projectnature class="formWidth" ref="xmxz"></projectnature>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" @click="search">查 询 </el-button>
                <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
                <el-button type="warning" icon="el-icon-download" @click="exportData">导 出</el-button>
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
      style="width: 100%; margin-top: 20px"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column width="170" prop="pspid" label="项目编码"></el-table-column>
      <el-table-column width="170" prop="post1" label="项目名称"></el-table-column>
      <el-table-column width="170" prop="qkjxmlxmc" label="项目类型"></el-table-column>
      <el-table-column width="160" prop="xmb_name" label="项目包"></el-table-column>
      <el-table-column width="160" prop="zjsjd_mc" label="项目性质"></el-table-column>
      <el-table-column width="170" prop="qkjyjdw" label="一级单位"></el-table-column>
      <el-table-column width="170" prop="qkjejdw" label="二级单位"></el-table-column>
      <el-table-column width="170" prop="qkjgkbm" label="归口部门"></el-table-column>
      <el-table-column width="160" prop="erpjdys" label="年度预算"></el-table-column>
      <el-table-column width="160" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>
      <el-table-column width="160" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>
      <el-table-column width="160" prop="qkjlxrq" label="项目立项时间"></el-table-column>
      <el-table-column width="170" prop="num" align="center" label="序号"></el-table-column>
      <el-table-column width="170" prop="banfn" label="采购申请号"></el-table-column>
      <el-table-column width="170" prop="bnfpo" label="采购申请行项目号"></el-table-column>
      <el-table-column width="170" prop="zblx" label="计划类型"></el-table-column>
      <el-table-column width="170" prop="zzbpc" label="计划批次"></el-table-column>
      <el-table-column width="170" prop="zzbpcmc" label="计划批次名称"></el-table-column>
      <el-table-column width="170" prop="zcjrq" label="采购申请创建日期"></el-table-column>
      <el-table-column width="170" prop="zhzsj" label="需求提报日期"></el-table-column>
      <el-table-column width="170" prop="preis" label="需求上报金额"></el-table-column>
      <el-table-column width="170" prop="lfdat" label="首批交货日期（计划）"></el-table-column>
      <el-table-column width="170" prop="eeind" label="最后一批交货日期（计划）"></el-table-column>
      <el-table-column width="170" prop="zghzq" label="供货周期（计划）（天）"></el-table-column>
      <el-table-column width="170" prop="zdate" label="中标时间"></el-table-column>
      <el-table-column width="170" prop="zhszj" label="中标金额"></el-table-column>
      <el-table-column width="170" prop="lifnr_name" label="供应商名称"></el-table-column>
      <el-table-column width="170" prop="lifnr" label="供应商编码"></el-table-column>
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
    ></el-pagination>
    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  </div>
</template>

<script>
import { defineComponent, reactive, watch } from 'vue'
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
  name: '/budget-process/process-18',
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
      spanArr: [], // 用于存放需要合并的行的个数
      spanIndex: 0, // 记录spanArr数组的下标
      //搜索区域显示与隐藏
      dataList: {
        zzbpcmc: '',
        post1: '',
        zhzsj: '',
        zdate: '',
        xmb: '',
        lifnr_name: '',
        nd: ''
      },
      searchShow: true,
      example: [],
      itemCode: [],
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
  // 监听store.state.processData
  watch: {
    'store.state.ztbData.pspid': {
      handler: function (val) {
        if (val) {
          this.$refs.xmbm.ids = val
          this.$refs.xmbm.text = val
          this.$refs.xmbm.array.push(val)
          this.specialorgid = JSON.parse(this.store.state.ztbData.specialorgid)
          this.loadData()
          // 清空vuex中的数据
          this.store.commit('ztbData', {})
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
    if (this.store.state.ztbData.pspid && this.store.state.ztbData.specialorgid) {
      this.$refs.xmbm.ids = this.store.state.ztbData.pspid
      this.$refs.xmbm.text = this.store.state.ztbData.pspid
      this.$refs.xmbm.array.push(this.store.state.ztbData.pspid)
      this.specialorgid = JSON.parse(this.store.state.ztbData.specialorgid)
      this.loadData()
      // 清空vuex中的数据
      this.store.commit('ztbData', {})
    } else {
      this.loading = true
      this.$refs.userDialog.getUser()
    }
  },
  methods: {
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 100 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 100 + 'px'
      }
    },
    getSpanArr(data) {
      let len = 0
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          len += 1
          data[i].xuhao = len
          this.spanArr.push(1)
          this.spanIndex = 0
        } else {
          // 判断当前行与前一行内容是否相同
          if (data[i].pspid === data[i - 1].pspid) {
            this.spanArr[this.spanIndex] += 1 // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
            this.spanArr.push(0) // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
            len += 1
            data[i].xuhao = len
          } else {
            len = 1
            data[i].xuhao = len
            this.spanArr.push(1) // 否则，依旧是一行
            this.spanIndex = i
          }
        }
      }
    },
    objectSpanMethod({ rowIndex, columnIndex }) {
      if (columnIndex < 12) {
        const _row = this.spanArr[rowIndex] // 行数
        const _col = _row > 0 ? 1 : 0 // 列数
        return {
          rowspan: _row,
          colspan: _col
        }
      }
    },
    loadData() {
      this.loading = true
      this.spanArr = [] // 用于存放需要合并的行的个数
      this.spanIndex = 0 // 记录spanArr数组的下标
      const params = {
        banfns: [],
        pspids: [],
        zzbpcmc: this.dataList.zzbpcmc,
        gkbms: [],
        post1: this.dataList.post1,
        zhzsj_begin: '',
        zhzsj_end: '',
        qkjxmlxbms: [],
        lifnrs: [],
        zdate_begin: '',
        zdate_end: '',
        xmb: this.dataList.xmb,
        lifnr_name: this.dataList.lifnr_name,
        nd: this.dataList.nd,
        zjsjd_mc: this.$refs.xmxz.value,
        qkjejdws: [],
        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid
      }
      //项目编码
      params.pspids = this.$refs.xmbm.array
      //归口部门
      params.gkbms = this.$refs.gkbm.selectList
      //采购申请号
      params.banfns = this.$refs.cgsqh.array
      //需求上报日期
      if (this.dataList.zhzsj) {
        params.zhzsj_begin = this.dataList.zhzsj[0]
        params.zhzsj_end = this.dataList.zhzsj[1]
      }
      //项目类型
      params.qkjxmlxbms = this.$refs.type.selectList
      //供应商编码
      params.lifnrs = this.$refs.gysbm.array
      //中标日期
      if (this.dataList.zdate) {
        params.zdate_begin = this.dataList.zdate[0]
        params.zdate_end = this.dataList.zdate[1]
      }
      //所属单位
      params.qkjejdws = this.$refs.company.selectList
      baseService.post('/process/process18/', params).then((res) => {
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
    exportData() {
      this.loading = true
      const params = {
        pspids: [],
        zzbpcmc: this.dataList.zzbpcmc,
        gkbms: [],
        post1: this.dataList.post1,
        banfns: [],
        zhzsj_begin: '',
        zhzsj_end: '',
        qkjxmlxbms: [],
        lifnrs: [],
        zdate_begin: '',
        zdate_end: '',
        xmb: this.dataList.xmb,
        lifnr_name: this.dataList.lifnr_name,
        nd: this.dataList.nd,
        zjsjd_mc: this.$refs.xmxz.value,
        qkjejdws: [],
        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid
      }
      //项目编码
      params.pspids = this.$refs.xmbm.array
      //归口部门
      params.gkbms = this.$refs.gkbm.selectList
      //采购申请号
      params.banfns = this.$refs.cgsqh.selectList
      //需求上报日期
      if (this.dataList.zhzsj) {
        params.zhzsj_begin = this.dataList.zhzsj[0]
        params.zhzsj_end = this.dataList.zhzsj[1]
      }
      //项目类型
      params.qkjxmlxbms = this.$refs.type.selectList
      //供应商编码
      params.lifnrs = this.$refs.gysbm.selectList
      //中标日期
      if (this.dataList.zdate) {
        params.zdate_begin = this.dataList.zdate[0]
        params.zdate_end = this.dataList.zdate[1]
      }
      //所属单位
      params.qkjejdws = this.$refs.company.selectList

      baseService.export('/process/process18/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '招投标环节穿透.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    },
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },
    //查询按钮
    search() {
      this.loadData()
    },
    //重置按钮
    reset() {
      this.$refs.xmbm.clear()
      this.dataList.zzbpcmc = ''
      this.$refs.gkbm.clear()
      this.dataList.post1 = ''
      this.$refs.cgsqh.clear()
      this.dataList.zhzsj = ''
      this.$refs.type.clear()
      this.$refs.gysbm.clear()
      this.dataList.zdate = ''
      this.dataList.xmb = ''
      this.dataList.lifnr_name = ''
      this.dataList.nd = ''
      this.$refs.xmxz.clear()
      this.$refs.company.clear()
      this.example = []
      this.loadData()
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
.BiddingCT {
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
