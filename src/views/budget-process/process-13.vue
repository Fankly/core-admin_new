<template>
  <div class="tranSummary" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>往来汇总表</h2>
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
              <el-form-item label="查询年度：">
                <el-date-picker v-model="dataList.year" type="year" value-format="YYYY" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="查询期间：">
                <el-date-picker v-model="dataList.time" type="monthrange" value-format="YYYY-MM" range-separator="至"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目性质：">
                <projectnature class="formWidth" ref="xmxz"></projectnature>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="展示维度：">
                <el-radio-group v-model="dataList.select" @change="changeCompany">
                  <el-radio :label="0" border style="margin-right: 10px">单位</el-radio>
                  <el-radio :label="1" border>类型</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" @click="search">查 询</el-button>
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
      row-key="id"
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="单位/项目类型" fixed width="250">
        <template #default="scope">
          <span style="cursor: pointer" v-if="scope.row.children">{{ scope.row.name }}</span>
          <div style="width: 100%; text-align: center" v-else>{{ scope.row.name }}</div>
        </template>
      </el-table-column>

      <el-table-column width="160" prop="dataMap.ysmbz" fixed align="right" label="年度预算" />
      <el-table-column width="160" prop="dataMap.ndzc_hs" label="当年财务支出（含税）" align="center"> </el-table-column>
      <el-table-column width="160" prop="dataMap.ljcwzc" label="累计财务支出（含税）" align="center"> </el-table-column>
      <el-table-column width="160" prop="dataMap.qcye" label="期初余额" align="center"> </el-table-column>
      <el-table-column width="160" prop="dataMap.bqxz" label="本期新增" align="center"> </el-table-column>
      <el-table-column width="160" prop="dataMap.bqjs" label="本期减少" align="center"> </el-table-column>
      <el-table-column label="期末余额">
        <el-table-column width="160" prop="dataMap.zl99" label="小计" align="center"></el-table-column>
        <el-table-column width="160" prop="dataMap.zl01" label="1年内" align="center"></el-table-column>
        <el-table-column width="160" prop="dataMap.zl02" label="1-2年" align="center"></el-table-column>
        <el-table-column width="160" prop="dataMap.zl03" label="2-3年" align="center"></el-table-column>
        <el-table-column width="160" prop="dataMap.zl04" label="3年以上" align="center"></el-table-column>
      </el-table-column>
    </el-table>
    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  </div>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import allProjectType from '@/components/select/allProjectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import Centralized from '@/components/select/Centralized.vue'
import projectnature from '@/components/select/projectnature.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'
export default defineComponent({
  name: '/budget-process/process-13',
  components: {
    projectType,
    affiliatedUnit,
    Centralized,
    projectnature,
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
      store,
      helpHandle,
      dataList: {
        select: 0,
        year: new Date().getFullYear().toString(),
        time: []
      },
      searchShow: true,
      example: [],
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
  mounted() {
    this.topHeight = document.querySelector('.topBox').clientHeight
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.searchHeight = document.querySelector('.search').clientHeight
    this.setTableHeight()
    this.getTime()
    this.loading = true
    this.$refs.userDialog.getUser(this.userId, this.userCode)
  },
  methods: {
    getTime() {
      let date = new Date()
      let year = date.getFullYear()
      let month = date.getMonth() + 1
      month = month > 9 ? month : '0' + month
      let start = year + '-' + '01'
      let last = year + '-' + month
      this.dataList.time.push(start)
      this.dataList.time.push(last)
    },
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 40 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 40 + 'px'
      }
    },
    loadData() {
      if (this.dataList.time) {
        this.loading = true
        const params = {
          qkjxmlxbms: [],
          qkjejdws: [],
          zyear: this.dataList.year,
          sdate: '',
          edate: '',
          wd: this.dataList.select,
          gkbms: [],
          zjsjd_mc: this.$refs.xmxz.value,
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
        if (this.dataList.time) {
          params.sdate = this.dataList.time[0].replace('-', '')
          params.edate = this.dataList.time[1].replace('-', '')
        }
        params.gkbms = this.$refs.gkbm.selectList
        baseService.post('/process/process13/', params).then((res) => {
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
        ElMessage({
          type: 'error',
          message: '请选择查询期间'
        })
      }
    },

    exportData() {
      if (this.dataList.time) {
        this.loading = true
        const params = {
          qkjxmlxbms: [],
          qkjejdws: [],
          zyear: this.dataList.year,
          sdate: '',
          edate: '',
          wd: this.dataList.select,
          gkbms: [],
          zjsjd_mc: this.$refs.xmxz.value,
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
        if (this.dataList.time) {
          params.sdate = this.dataList.time[0]
          params.edate = this.dataList.time[1]
        }
        params.gkbms = this.$refs.gkbm.selectList
        baseService.export('/process/process13/export', params).then((res) => {
          this.loading = false
          const blob = res
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          dom.download = '往来汇总表.xlsx'
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
        })
      } else {
        ElMessage({
          type: 'error',
          message: '请选择查询期间'
        })
      }
    },
    //搜索按钮
    search() {
      if (this.dataList.time) {
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
      this.$refs.company.clear()
      this.$refs.type.clear()
      this.dataList.select = 0
      this.dataList.year = new Date().getFullYear().toString()
      this.$refs.gkbm.clear()
      this.$refs.xmxz.clear()
      this.dataList.time = []
      this.getTime()
      this.example = []
      this.search()
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
    }
  }
})
</script>

<style lang="less" scoped>
.tranSummary {
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
