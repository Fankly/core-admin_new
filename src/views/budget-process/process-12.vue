<template>
  <div class="ganFra" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>通用服务执行明细表穿透</h2>
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
        <el-form label-position="left" label-width="110px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="采购申请号：">
                <copyTextBox class="formWidth" ref="cgsqh"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目编码：">
                <copyTextBox class="formWidth" ref="xmbm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="采购订单号：">
                <copyTextBox class="formWidth" ref="cgddh"></copyTextBox>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <el-input class="formWidth" v-model="dataList.xmmc"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="经法合同编号：">
                <copyTextBox class="formWidth" ref="jfhtbhzx"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <projectType class="formWidth" ref="type"></projectType>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
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
              <el-form-item label="经法合同名称">
                <el-input class="formWidth" v-model="dataList.jfhtmc"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目包名称：">
                <el-input class="formWidth" v-model="dataList.qkjxmb_mc" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="中标日期：">
                <el-date-picker
                  v-model="dataList.zzbsj"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  :picker-options="pickerOptions0"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="执行协议编码：">
                <copyTextBox class="formWidth" ref="zxxybm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目性质：">
                <projectnature class="formWidth" ref="xmxz"></projectnature>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="取值逻辑：">
                <el-switch v-model="remarks" active-text="开" inactive-text="关" @change="remarksbtn" />
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
      row-key="row_id"
      id="crTable"
      :key="tableKey"
      border
      :data="example"
      v-if="tableHeight"
      :height="tableHeight"
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column
        :width="item.width"
        :key="item.prop"
        v-for="item in dropCol"
        class-name="dropTableColumn"
        :prop="item.prop"
        :label="item.label"
      />
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
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import Centralized from '@/components/select/Centralized.vue'
import projectnature from '@/components/select/projectnature.vue'
import { useStore } from 'vuex'
import Sortable from 'sortablejs'
import { showHelpMsg } from '@/utils/message'
import { getConfigDetail } from '@/api/menu/menuConfig'
import { getMaxLength } from '@/utils/utils'

export default defineComponent({
  name: '/budget-process/process-12',
  components: {
    projectType,
    affiliatedUnit,
    copyTextBox,
    userDialog,
    Centralized,
    projectnature
  },
  setup() {
    const store = useStore()
    const helpHandle = () => {
      const url = store.getters.getMenuMsg.url
      showHelpMsg(url)
    }
    return reactive({
      tableKey: 0,
      store,
      remarks: false,
      helpHandle,
      searchShow: true,
      dataList: {
        xmmc: '',
        time: '',
        zhzsj: '',
        jfhtmc: '',
        zzbsj: '',
        qkjxmb_mc: ''
      },
      example: [],
      dropCol: [
        {
          label: '采购申请号',
          prop: 'banfn'
        },
        {
          label: '采购申请行项目号',
          prop: 'bnfpo'
        },
        {
          label: '合同类型（ECP）',
          prop: 'con_type'
        },
        {
          label: 'ERP框架协议号',
          prop: 'zebeln'
        },
        {
          label: '经法合同编码',
          prop: 'zhtbh'
        },
        {
          label: '经法合同名称',
          prop: 'zhtmc1'
        },
        {
          label: '需求上报日期',
          prop: 'zhzsj'
        },
        {
          label: '中标日期',
          prop: 'zzbsj'
        },
        {
          label: '招标金额',
          prop: 'zbje'
        },
        {
          label: '中标金额',
          prop: 'zhszj'
        },
        {
          label: '合同金额',
          prop: 'zhtje'
        },
        {
          label: '执行协议编码',
          prop: 'zhtbh_xy'
        },
        {
          label: '执行协议名称',
          prop: 'zhtmc1_xy'
        },
        {
          label: '执行协议金额',
          prop: 'zhtje_xy'
        },
        {
          label: '项目编码',
          prop: 'pspid'
        },
        {
          label: '采购申请',
          prop: 'banfn_xy'
        },
        {
          label: '采购订单号',
          prop: 'ebeln'
        },
        {
          label: '采购订单行项目号',
          prop: 'ebelp'
        },
        {
          label: '项目名称',
          prop: 'post1'
        },
        {
          label: '项目类型',
          prop: 'qkjxmlxbm'
        },
        {
          label: '项目包',
          prop: 'qkjxmb'
        },
        {
          label: '项目性质',
          prop: 'zjsjd_mc'
        },
        {
          label: '一级单位',
          prop: 'qkjyjdw'
        },
        {
          label: '二级单位',
          prop: 'qkjejdw'
        },
        {
          label: '归口部门',
          prop: 'qkjgkbm'
        },
        {
          label: '年度预算',
          prop: 'erpjdys'
        },
        {
          label: '当年财务支出（含税）',
          prop: 'ndzc_hs'
        },
        {
          label: '当年财务支出（不含税）',
          prop: 'ndzcb_hs'
        },
        {
          label: '服务确认金额',
          prop: 'menge'
        },
        {
          label: '服务确认金额（不含税）',
          prop: 'dmbtr'
        },
        {
          label: '合同金额备注',
          prop: 'zhtjebz'
        }
      ],
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      loading: false,
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      userCode: '',
      userId: '',
      specialorgid: '',
      tableMsg: []
    })
  },
  mounted() {
    this.tableKey = 0
    this.topHeight = document.querySelector('.topBox').clientHeight
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.searchHeight = document.querySelector('.search').clientHeight
    this.setTableHeight()
    if (JSON.stringify(this.$route.query) != '{}') {
      // this.$refs.jfhtbhzx.ids = this.$route.query.zhtbh;
      // this.$refs.jfhtbhzx.text = this.$route.query.zhtbh;
      // this.$refs.jfhtbhzx.array.push(this.$route.query.zhtbh);
      this.$refs.cgsqh.ids = this.$route.query.banfn
      this.$refs.cgsqh.text = this.$route.query.banfn
      this.$refs.cgsqh.array.push(this.$route.query.banfn)
      this.$refs.cgsqh.newArr.push(this.$route.query.banfn)
      this.specialorgid = JSON.parse(this.$route.query.specialorgid)
      this.loadData()
    } else {
      this.loading = true
      this.$refs.userDialog.getUser()
    }
    this.compTableWidth()
  },
  methods: {
    compTableWidth() {
      const tableData = this.example
      this.dropCol = this.dropCol.map((value) => {
        const arr = tableData.map((item) => {
          return item[value.prop]
        })
        arr.push(value.label)
        let width = getMaxLength(arr)
        if (value.prop === 'zhtmc1' || value.prop === 'zhtmc1_xy' || value.prop === 'post1' || value.prop === 'qkjxmb') {
          value.width = 320
        } else {
          value.width = Math.round(width + 20)
        }
        return value
      })
    },
    remarksbtn(val) {
      if (val) {
        getConfigDetail(this.store.getters.getMenuMsg.url).then((res) => {
          if (res.success) {
            if (res.data) {
              this.tableMsg = res.data
            }
          } else {
            ElMessage.error(res.msg)
          }
        })
      }
      this.loadData()
    },
    columnDrop() {
      const wrapperTr = document.getElementById('crTable').querySelector('.el-table__header-wrapper tr')
      const _this = this
      this.sortable = Sortable.create(wrapperTr, {
        animation: 180,
        delay: 0,
        draggable: '.dropTableColumn',
        onEnd: (evt) => {
          const oldItem = _this.dropCol[evt.oldIndex]
          _this.dropCol.splice(evt.oldIndex, 1)
          _this.dropCol.splice(evt.newIndex, 0, oldItem)
          _this.tableKey += 1
          this.$nextTick(() => {
            this.columnDrop()
          })
        }
      })
    },
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
        banfns: [],
        pspids: [],
        qkjejdws: [],
        ebelns: [],
        post1: this.dataList.xmmc,
        gkbms: [],
        zhtbhs_jf: [],
        zhzsj_begin: '',
        zhzsj_end: '',
        zhtmc1_jf: this.dataList.jfhtmc,
        qkjxmbs: this.dataList.qkjxmb_mc,
        zzbsj_begin: '',
        zzbsj_end: '',
        zprxmlxs: [],
        zjsjds: this.$refs.xmxz.value,
        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid
      }
      //采购申请号
      if (this.$refs.cgsqh) {
        params.banfns = this.$refs.cgsqh.newArr
      }
      //项目编码
      if (this.$refs.xmbm) {
        params.pspids = this.$refs.xmbm.array
      }
      //所属单位
      if (this.$refs.company) {
        params.qkjejdws = this.$refs.company.selectList
      }
      //采购订单号
      if (this.$refs.cgddh) {
        params.ebelns = this.$refs.cgddh.array
      }
      //归口部门
      params.gkbms = this.$refs.gkbm.selectList
      //经法合同编号
      if (this.$refs.jfhtbhzx) {
        params.zhtbhs_jf = this.$refs.jfhtbhzx.array
      }
      //项目类型
      if (this.$refs.type) {
        params.zprxmlxs = this.$refs.type.selectList
      }
      //需求上报日期
      if (this.dataList.zhzsj) {
        params.zhzsj_begin = this.dataList.zhzsj[0]
        params.zhzsj_end = this.dataList.zhzsj[1]
      }
      //项目包
      // if (this.$refs.xmb) {
      //   params.qkjxmbs = this.$refs.xmb.array;
      // }
      //中标日期
      if (this.dataList.zzbsj) {
        params.zzbsj_begin = this.dataList.zzbsj[0]
        params.zzbsj_end = this.dataList.zzbsj[1]
      }
      //执行协议编码
      if (this.$refs.zxxybm) {
        params.zhtbhs_zx = this.$refs.zxxybm.array
      }
      if (this.$route.query.banfn && this.$route.query.bnfpo) {
        params.banfn = this.$route.query.banfn
        params.bnfpo = this.$route.query.bnfpo
      }

      baseService.post('/process/process12/', params).then((res) => {
        if (res.success == true) {
          this.loading = false
          this.example = res.data.records
          if (this.remarks) {
            this.example.unshift(...this.tableMsg)
          }
          this.page.total = res.data.total
          this.compTableWidth()
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    exportBtn() {
      this.loading = true
      const params = {
        banfns: [],
        pspids: [],
        qkjejdws: [],
        ebelns: [],
        post1: this.dataList.xmmc,
        gkbms: [],
        zhtbhs_jf: [],
        zhzsj_begin: '',
        zhzsj_end: '',
        zhtmc1_jf: this.dataList.jfhtmc,
        qkjxmbs: this.dataList.qkjxmb_mc,
        zzbsj_begin: '',
        zzbsj_end: '',
        zprxmlxs: [],
        zjsjds: this.$refs.xmxz.value,
        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid
      }
      //采购申请号
      if (this.$refs.cgsqh) {
        params.banfns = this.$refs.cgsqh.newArr
      }
      //项目编码
      if (this.$refs.xmbm) {
        params.pspids = this.$refs.xmbm.array
      }
      //所属单位
      if (this.$refs.company) {
        params.qkjejdws = this.$refs.company.selectList
      }
      //采购订单号
      if (this.$refs.cgddh) {
        params.ebelns = this.$refs.cgddh.array
      }
      //归口部门
      params.gkbms = this.$refs.gkbm.selectList
      //经法合同编号
      if (this.$refs.jfhtbhzx) {
        params.zhtbhs_jf = this.$refs.jfhtbhzx.array
      }
      //项目类型
      if (this.$refs.type) {
        params.zprxmlxs = this.$refs.type.selectList
      }
      //需求上报日期
      if (this.dataList.zhzsj) {
        params.zhzsj_begin = this.dataList.zhzsj[0]
        params.zhzsj_end = this.dataList.zhzsj[1]
      }
      // //项目包
      // if (this.$refs.xmb) {
      //   params.qkjxmbs = this.$refs.xmb.array;
      // }
      //中标日期
      if (this.dataList.zzbsj) {
        params.zzbsj_begin = this.dataList.zzbsj[0]
        params.zzbsj_end = this.dataList.zzbsj[1]
      }
      //执行协议编码
      if (this.$refs.zxxybm) {
        params.zhtbhs_zx = this.$refs.zxxybm.array
      }
      if (this.$route.query.banfn && this.$route.query.bnfpo) {
        params.banfn = this.$route.query.banfn
        params.bnfpo = this.$route.query.bnfpo
      }
      baseService.export('/process/process12/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '通用服务执行明细表穿透.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    },
    //查询按钮
    search() {
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
    //重置按钮
    reset() {
      this.remarks = false
      this.$refs.cgsqh.clear()
      this.$refs.xmbm.clear()
      this.$refs.company.clear()
      this.$refs.cgddh.clear()
      this.dataList.xmmc = ''
      this.$refs.gkbm.clear()
      this.$refs.jfhtbhzx.clear()
      this.$refs.type.clear()
      this.dataList.zhzsj = ''
      this.dataList.jfhtmc = ''
      this.dataList.qkjxmb_mc = ''
      this.dataList.zzbsj = ''
      this.$refs.zxxybm.clear()
      this.$refs.xmxz.clear()
      this.example = []
      this.page.total = 0
      this.page.limit = 10
      this.page.page = 1
      this.page.current = '1'
      this.loadData()
    },
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.$refs.company.getAffiliatedUnit(this.specialorgid)
      this.$refs.gkbm.getProjectType(this.specialorgid)
      this.columnDrop()
    }
  }
})
</script>

<style lang="less" scoped>
.ganFra {
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
