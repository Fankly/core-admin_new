<template>
  <div class="running" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>往来明细情况表(按项目)</h2>
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
              <el-form-item label="往来查询时间：">
                <el-date-picker
                  v-model="dataList.yearRange"
                  value-format="YYYY-MM"
                  format="YYYY-MM"
                  type="monthrange"
                  range-separator="至"
                ></el-date-picker>
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
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="项目年度：">
                <el-date-picker v-model="dataList.year" type="year" value-format="YYYY" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目包名称：">
                <el-input class="formWidth" v-model="dataList.qkjxmb_mc" />
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
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6"> </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
                <el-button type="primary" @click="search" icon="el-icon-search">查 询</el-button>
                <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
                <el-button type="warning" icon="el-icon-download" @click="exportData">导 出</el-button>
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
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column width="160" fixed label="项目编码">
        <template #default="scope">
          <a style="cursor: pointer" @click="jump(scope.row.pspid)">{{ scope.row.pspid }}</a>
        </template>
      </el-table-column>
      <el-table-column :width="dropCol[0].width" prop="post1" label="项目名称" />
      <el-table-column :width="dropCol[1].width" prop="qkjxmlxmc" label="项目类型" />
      <el-table-column :width="dropCol[2].width" prop="qkjxmb_mc" label="项目包"> </el-table-column>
      <el-table-column :width="dropCol[3].width" prop="zjsjd_mc" label="项目性质"> </el-table-column>
      <el-table-column :width="dropCol[4].width" prop="qkjyjdw_name" label="一级单位" />
      <el-table-column :width="dropCol[5].width" prop="qkjejdw_name" label="二级单位" />
      <el-table-column :width="dropCol[6].width" prop="qkjgkbm_name" label="归口部门" />
      <el-table-column :width="dropCol[7].width" prop="erpjdys" label="年度预算" />
      <el-table-column :width="dropCol[8].width" prop="ndzc_hs" label="当年财务支出（含税）" />
      <el-table-column :width="dropCol[9].width" prop="ndzcb_hs" label="当年财务支出（不含税）" />
      <el-table-column :width="dropCol[10].width" prop="qcye" label="期初余额" />
      <el-table-column :width="dropCol[11].width" prop="bqxz" label="本期新增" />
      <el-table-column :width="dropCol[12].width" prop="bqjs" label="本期减少" />
      <el-table-column label="期末余额">
        <el-table-column :width="dropCol[13].width" prop="qmye" label="小计" />
        <el-table-column :width="dropCol[14].width" prop="zl01" label="1年内" />
        <el-table-column :width="dropCol[15].width" prop="zl02" label="1-2年" />
        <el-table-column :width="dropCol[16].width" prop="zl03" label="2-3年" />
        <el-table-column :width="dropCol[17].width" prop="zl04" label="3年以上" />
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
import { defineComponent, nextTick, reactive, ref } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import projectnature from '@/components/select/projectnature.vue'
import Centralized from '@/components/select/Centralized.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'
import { getMaxLength } from '@/utils/utils'

export default defineComponent({
  name: '/budget-process/process-14',
  components: {
    projectType,
    affiliatedUnit,
    copyTextBox,
    projectnature,
    Centralized,
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
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      searchShow: true,
      dataList: {
        post1: '',
        qkjxmb_mc: '',
        year: new Date().getFullYear().toString(),
        yearRange: []
      },
      dropCol: [
        {
          label: '项目名称',
          prop: 'post1'
        },
        {
          label: '项目类型',
          prop: 'qkjxmlxmc'
        },
        {
          label: '项目包',
          prop: 'qkjxmb_mc'
        },
        {
          label: '项目性质',
          prop: 'zjsjd_mc'
        },
        {
          label: '一级单位',
          prop: 'qkjyjdw_name'
        },
        {
          label: '二级单位',
          prop: 'qkjejdw_name'
        },
        {
          label: '归口部门',
          prop: 'qkjgkbm_name'
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
          label: '期初余额',
          prop: 'qcye'
        },
        {
          label: '本期新增',
          prop: 'bqxz'
        },
        {
          label: '本期减少',
          prop: 'bqjs'
        },
        {
          label: '小计',
          prop: 'qmye'
        },
        {
          label: '1年内',
          prop: 'zl01'
        },
        {
          label: '1-2年',
          prop: 'zl02'
        },
        {
          label: '2-3年',
          prop: 'zl03'
        },
        {
          label: '3年以上',
          prop: 'zl04'
        }
      ],
      example: [],
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      loading: false,
      userCode: '',
      userId: '',
      specialorgid: '',
      dialogVisible: false
    })
  },
  mounted() {
    this.topHeight = document.querySelector('.topBox').clientHeight
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.searchHeight = document.querySelector('.search').clientHeight
    this.setTableHeight()
    this.getTime()
    this.loading = true
    this.$refs.userDialog.getUser(this.userId, this.userCode)
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
        if (value.prop === 'qkjxmb_mc' || value.prop === 'post1') {
          value.width = 320
        } else {
          value.width = Math.round(width + 20)
        }
        return value
      })
    },
    getTime() {
      let date = new Date()
      let year = date.getFullYear()
      let month = date.getMonth() + 1
      month = month > 9 ? month : '0' + month
      let start = year + '-' + '01'
      let last = year + '-' + month
      this.dataList.yearRange.push(start)
      this.dataList.yearRange.push(last)
    },
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 80 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 80 + 'px'
      }
    },

    loadData() {
      if (this.dataList.yearRange) {
        this.loading = true
        const params = {
          qkjxmlxmc: [], //类型
          qkjejdw_name: [], //单位
          pspid: [], //项目编码
          post1: this.dataList.post1, //项目名称
          qkjxmb_mc: this.dataList.qkjxmb_mc, //项目包
          year: this.dataList.year, //项目年度
          zyearStart: '',
          zmonthStart: '',
          zyearEnd: '',
          zmonthEnd: '',
          page: this.page.page,
          limit: this.page.limit,
          gkbms: [],
          zjsjd_mc: this.$refs.xmxz.value,
          specialorgid: this.specialorgid
        }
        params.pspid = this.$refs.xmbm.array
        params.qkjxmlxmc = this.$refs.type.selectList
        params.qkjejdw_name = this.$refs.company.selectList
        params.gkbms = this.$refs.gkbm.selectList
        let yearStart = this.dataList.yearRange[0].split('-')
        let yearEnd = this.dataList.yearRange[1].split('-')
        // 往来查询期间 起始年
        params.zyearStart = yearStart[0]
        // 往来查询期间 起始月
        params.zmonthStart = yearStart[1]
        // 往来查询期间 结束年
        params.zyearEnd = yearEnd[0]
        // 往来查询期间 结束月
        params.zmonthEnd = yearEnd[1]

        baseService.post('/process/process14/', params).then((res) => {
          if (res.success == true) {
            this.loading = false
            this.example = res.data.list
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
      } else {
        ElMessage({
          type: 'error',
          message: '请选择往来查询时间'
        })
      }
    },

    jump(pspid) {
      let params = {
        pspid: pspid,
        year: this.dataList.year,
        time: this.dataList.yearRange,
        specialorgid: this.specialorgid
      }
      this.$router.push({ path: '/budget-process/process-15', query: params })
    },

    //搜索按钮
    search() {
      if (this.dataList.yearRange) {
        this.loadData()
      } else {
        ElMessage({
          type: 'error',
          message: '请选择往来查询时间'
        })
      }
    },
    //重置按钮
    reset() {
      this.$refs.xmbm.clear()
      this.dataList.post1 = ''
      this.dataList.qkjxmb_mc = ''
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.dataList.year = new Date().getFullYear().toString()
      this.dataList.yearRange = []
      this.getTime()
      this.$refs.gkbm.clear()
      this.$refs.xmxz.clear()
      this.example = []
      this.search()
    },

    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },

    // 数据导出
    exportData() {
      if (this.dataList.yearRange) {
        this.loading = true
        // 参数列表
        const params = {
          qkjxmlxmc: [], //类型
          qkjejdw_name: [], //单位
          pspid: [], //项目编码
          post1: this.dataList.post1, //项目名称
          qkjxmb_mc: this.dataList.qkjxmb_mc, //项目包
          year: this.dataList.year, //项目年度
          zyearStart: '',
          zmonthStart: '',
          zyearEnd: '',
          zmonthEnd: '',
          page: this.page.page,
          limit: this.page.limit,
          gkbms: [],
          zjsjd_mc: this.$refs.xmxz.value,
          specialorgid: this.specialorgid
        }
        params.pspid = this.$refs.xmbm.array
        params.qkjxmlxmc = this.$refs.type.selectList
        params.qkjejdw_name = this.$refs.company.selectList
        params.gkbms = this.$refs.gkbm.selectList
        let yearStart = this.dataList.yearRange[0].split('-')
        let yearEnd = this.dataList.yearRange[1].split('-')
        // 往来查询期间 起始年
        params.zyearStart = yearStart[0]
        // 往来查询期间 起始月
        params.zmonthStart = yearStart[1]
        // 往来查询期间 结束年
        params.zyearEnd = yearEnd[0]
        // 往来查询期间 结束月
        params.zmonthEnd = yearEnd[1]

        baseService.export('/process/process14/export', params).then((res) => {
          this.loading = false
          const blob = res
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          dom.download = '往来明细情况表(按项目).xlsx'
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
        })
      } else {
        ElMessage({
          type: 'error',
          message: '请选择往来查询时间'
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
.running {
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
