<template>
  <div class="supplierAccount" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>往来明细情况表(按供应商)</h2>
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
              <el-form-item label="供应商编码：">
                <copyTextBox class="formWidth" ref="gysbm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="预算年度：">
                <el-date-picker v-model="dataList.year" value-format="YYYY" type="year"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="供应商名称：">
                <el-input class="formWidth" v-model="dataList.lifnr_name" :options="projects" @change="handleChange" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="往来账龄：">
                <el-select class="formWidth" v-model="applicationId" multiple collapse-tags @change="change">
                  <el-option v-for="item in applications" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
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
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
                <el-button @click="search" type="primary" icon="el-icon-search">查 询</el-button>
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
      <el-table-column :width="dropCol[0].width" prop="lifnr" fixed label="供应商编码">
        <template #default="scope">
          <a style="cursor: pointer" @click="jump(scope.row.lifnr)">{{ scope.row.lifnr }}</a>
        </template>
      </el-table-column>
      <el-table-column :min-width="dropCol[1].width" prop="lifnr_name" label="供应商名称" />
      <el-table-column :min-width="dropCol[2].width" prop="zdwxz" label="供应商单位性质" />
      <el-table-column :min-width="dropCol[3].width" prop="qkjyjdw_name" label="一级单位"> </el-table-column>
      <el-table-column :min-width="dropCol[4].width" prop="qkjejdw_name" label="二级单位" />
      <el-table-column :min-width="dropCol[5].width" prop="qcye" label="期初余额" />
      <el-table-column :min-width="dropCol[6].width" prop="bqxz" label="本期新增" />
      <el-table-column :min-width="dropCol[7].width" prop="bqjs" label="本期减少" />
      <el-table-column label="期末余额">
        <el-table-column :min-width="dropCol[8].width" prop="qmye" label="小计" />
        <el-table-column :min-width="dropCol[9].width" prop="zl01" v-if="colObj.one" label="1年内" />
        <el-table-column :min-width="dropCol[10].width" prop="zl02" v-if="colObj.two" label="1-2年" />
        <el-table-column :min-width="dropCol[11].width" prop="zl03" v-if="colObj.three" label="2-3年" />
        <el-table-column :min-width="dropCol[12].width" prop="zl04" v-if="colObj.four" label="3年以上" />
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
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'
import { getMaxLength } from '@/utils/utils'

export default defineComponent({
  name: '/budget-process/process-16',
  components: {
    affiliatedUnit,
    copyTextBox,
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
      searchShow: true,
      dataList: {
        lifnr_name: '',
        yearRange: [],
        year: ''
      },
      colObj: {
        one: true,
        two: true,
        three: true,
        four: true
      },
      dropCol: [
        {
          label: '供应商编码',
          prop: 'lifnr'
        },
        {
          label: '供应商名称',
          prop: 'lifnr_name'
        },
        {
          label: '供应商单位性质',
          prop: 'zdwxz'
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
      applicationId: [],
      applications: [
        {
          label: '一年内',
          value: 'one'
        },
        {
          label: '1-2年',
          value: 'two'
        },
        {
          label: '2-3年',
          value: 'three'
        },
        {
          label: '3年以上',
          value: 'four'
        }
      ],
      example: [],
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
  created() {
    this.showall()
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
        if (value.prop === 'lifnr_name') {
          value.width = 320
        } else {
          value.width = Math.round(width + 20)
        }
        return value
      })
    },
    showall() {
      this.applications.forEach((item) => {
        this.applicationId.push(item.value)
      })
    },
    change() {
      for (let i in this.colObj) {
        if (this.applicationId.indexOf(i) == -1) {
          this.colObj[i] = false
        } else {
          this.colObj[i] = true
        }
      }
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

    reset() {
      this.dataList.lifnr_name = ''
      this.dataList.yearRange = []
      this.getTime()
      this.$refs.company.clear()
      this.$refs.gysbm.clear()
      this.example = []
      this.search()
    },
    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
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

    jump(lifnr) {
      let yearStart = this.dataList.yearRange[0].split('-')
      let yearEnd = this.dataList.yearRange[1].split('-')
      let params = {
        lifnr: lifnr,
        // 往来查询期间 起始年
        zyearStart: yearStart[0],
        // 往来查询期间 起始月
        zmonthStart: yearStart[1],
        // 往来查询期间 结束年
        zyearEnd: yearEnd[0],
        // 往来查询期间 结束月
        zmonthEnd: yearEnd[1],
        specialorgid: this.specialorgid
      }
      this.$router.push({ path: '/budget-process/process-17', query: params })
    },
    loadData() {
      if (this.dataList.yearRange) {
        this.loading = true
        const params = {
          qkjejdws: [],
          lifnr_name: this.dataList.lifnr_name,
          lifnrs: [],
          zyearStart: '',
          zmonthStart: '',
          zyearEnd: '',
          zmonthEnd: '',
          year: this.dataList.year,
          page: this.page.page,
          limit: this.page.limit,
          specialorgid: this.specialorgid
        }
        params.qkjejdws = this.$refs.company.selectList
        params.lifnrs = this.$refs.gysbm.array
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

        baseService.post('/process/process16/', params).then((res) => {
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

    // 数据导出
    exportData() {
      if (this.dataList.yearRange) {
        this.loading = true
        // 参数列表
        const params = {
          qkjejdws: [],
          lifnr_name: this.dataList.lifnr_name,
          lifnrs: [],
          zyearStart: '',
          zmonthStart: '',
          zyearEnd: '',
          zmonthEnd: '',
          year: this.dataList.year,
          page: this.page.page,
          limit: this.page.limit,
          specialorgid: this.specialorgid
        }
        params.qkjejdws = this.$refs.company.selectList
        params.lifnrs = this.$refs.gysbm.array
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

        baseService.export('/process/process16/export', params).then((res) => {
          this.loading = false
          const blob = res
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          dom.download = '往来明细情况表(按供应商).xlsx'
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
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.$refs.company.getAffiliatedUnit(this.specialorgid)
    }
  }
})
</script>

<style lang="less" scoped>
.supplierAccount {
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
