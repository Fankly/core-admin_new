<template>
  <div class="accounts32" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目关闭稽核</h2>
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
                <el-input class="formWidth" v-model="dataList.xmb"></el-input>
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
        <el-table-column label="关闭及时性（个）" width="160">
          <template #default="scope">
            <div v-if="scope.row.jh_gbjsx == 0">1</div>
            <div v-else>{{ scope.row.jh_gbjsx }}</div>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column width="160" prop="xmgbrq" label="项目关闭日期"></el-table-column>
      <el-table-column width="160" prop="mbcwzcrq" label="最后一笔财务支出时间"></el-table-column>
      <el-table-column width="160" prop="jh_gbjsxz" label="关闭及时性（天）"></el-table-column>
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
import copyTextBox from '@/components/select/copyTextBox.vue'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import userDialog from '@/components/select/userDialog.vue'
import Centralized from '@/components/select/Centralized.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'

export default defineComponent({
  name: '/budget-process/process-32',
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
      dataList: {
        name: '',
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
      searchShow: true,
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
        qkjxmb: this.dataList.xmb,
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
      baseService.post('/process/process32/', params).then((res) => {
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
      this.dataList.name = ''
      this.dataList.month = new Date()
      this.dataList.xmb = ''
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.$refs.xmbm.clear()
      this.$refs.gkbm.clear()
      this.example = []
      this.loadData()
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
        qkjxmb: this.dataList.xmb,
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
      await baseService.export('/process/process32/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '项目关闭稽核.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    },

    goTable(path, pspid) {
      this.$router.push({ path: path, query: { pspid: pspid } })
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
.accounts32 {
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
