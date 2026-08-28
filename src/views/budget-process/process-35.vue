<template>
  <div class="accounts35" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目执行进度监控</h2>
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
                <copyTextBox class="formWidth" ref="xmbm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <el-input class="formWidth" v-model="dataList.post1" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <allProjectType class="formWidth" ref="type"></allProjectType>
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
              <el-form-item label="实施部门：">
                <ssBm class="formWidth" ref="ssbm"></ssBm>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目分类：">
                <threeLevel class="formWidth" ref="sjfl"></threeLevel>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目进度状态：">
                <el-select class="formWidth" v-model="value" placeholder="请选择" clearable @change="changeParams">
                  <el-option v-for="item in projects" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="截至日期：">
                <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"> </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-button type="primary" icon="el-icon-search" @click="loadData"> 查询</el-button>
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
      v-if="tableHeight"
      :height="tableHeight"
      :data="example"
      row-key="id"
      style="width: 100%; margin-top: 10px"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="项目基本信息" v-if="columnObj.xmjbxx">
        <el-table-column label="项目编码" width="250" prop="pspid"> </el-table-column>
        <el-table-column label="项目名称" width="250" prop="post1"> </el-table-column>
        <el-table-column label="一级单位" width="250" prop="yjdwName"> </el-table-column>
        <el-table-column label="二级单位" width="250" prop="ejdwName"> </el-table-column>
        <el-table-column label="归口部门" width="250" prop="gkbmName"> </el-table-column>
        <el-table-column label="实施部门" width="250" prop="ssbmName"> </el-table-column>
        <el-table-column label="项目类别" width="250" prop="zsjfl09"> </el-table-column>
        <el-table-column label="项目分类" width="250" prop="xmfl"> </el-table-column>
        <el-table-column label="当年预算（含税）资本（万元）" width="250" prop="dnyszb"> </el-table-column>
        <el-table-column label="当年预算（不含税）成本 （万元）" width="250" prop="dnyscb"> </el-table-column>
        <el-table-column label="当年财务支出（万元）" width="250" prop="dncwzc"> </el-table-column>
        <el-table-column label="当年税金（万元）" width="250" prop="dnsj"> </el-table-column>
        <el-table-column label="当年完成值（含税）（万元）" width="250" prop="dnwcz"> </el-table-column>
        <el-table-column label="年度预算完成率" width="250" prop="ndyswcl"> </el-table-column>
        <el-table-column label="项目进度状态" width="250" prop="xmjdmc"> </el-table-column>
      </el-table-column>
      <el-table-column label="立项环节" v-if="columnObj.lxhj">
        <el-table-column label="立项时间" width="250" prop="erdat"> </el-table-column>
      </el-table-column>
      <el-table-column label="招投标环节" v-if="columnObj.ztbhj">
        <el-table-column label="首笔需求提报日期" width="250" prop="sbxqtbrq"> </el-table-column>
        <el-table-column label="首笔需求提报审批完成时间" width="250" prop="sbxqtbwcrq"> </el-table-column>
        <el-table-column label="首笔中标日期" width="250" prop="sbxqzbrq"> </el-table-column>
      </el-table-column>
      <el-table-column label="合同签订环节" v-if="columnObj.htqdhj">
        <el-table-column label="首笔合同签订日期" width="250" prop="sbhtqdrq"> </el-table-column>
      </el-table-column>
      <el-table-column label="项目实施环节" v-if="columnObj.xmsshj">
        <el-table-column label="实际开工日期" width="250" prop="zsjks"> </el-table-column>
        <el-table-column label="首笔物资到货日期" width="250" prop="sbwzsjdhrq"> </el-table-column>
        <el-table-column label="首笔物资领用日期" width="250" prop="wbwzlyrq"> </el-table-column>
        <el-table-column label="首笔支出发生日期" width="250" prop="sbcwzcrq"> </el-table-column>
        <el-table-column label="竣工日期" width="250" prop="zsjjg"> </el-table-column>
        <el-table-column label="首次送审日期" width="250" prop="scssrq"> </el-table-column>
      </el-table-column>
      <el-table-column label="项目决算审计环节" v-if="columnObj.xmjssjhj">
        <el-table-column label="决算送审日期" width="250" prop="jsssrq"> </el-table-column>
        <el-table-column label="决算审计任务下达日期" width="250" prop="jssjxdrq"> </el-table-column>
        <el-table-column label="决算审定日期" width="250" prop="jssdrq"> </el-table-column>
      </el-table-column>
      <el-table-column label="增资审计环节" v-if="columnObj.zzsjhj">
        <el-table-column label="首次增资日期" width="250" prop="zgzzrq"> </el-table-column>
      </el-table-column>
      <el-table-column label="项目关闭" v-if="columnObj.xmgb">
        <el-table-column label="项目关闭时间" width="250" prop="xmgbrq"> </el-table-column>
      </el-table-column>
      <!-- <el-table-column label="物资领用标识" prop="zwzflag" width="250" v-if="columnObj.wzlybs"> </el-table-column>
      <el-table-column label="业务报销标识" prop="zbzflag" width="250" v-if="columnObj.ywbxbs"> </el-table-column>
      <el-table-column label="服务确认标识" prop="zfwflag" width="250" v-if="columnObj.fwqrbs"> </el-table-column> -->
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
  </div>

  <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import copyTextBox from '@/components/select/copyTextBox.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import allProjectType from '@/components/select/allProjectType.vue'
import Centralized from '@/components/select/Centralized.vue'
import threeLevel from '@/components/select/threeLevel.vue'
import ssBm from '@/components/select/ssBm.vue'
import { showHelpMsg } from '@/utils/message'

export default defineComponent({
  name: '/budget-process/process-35',
  components: {
    userDialog,
    copyTextBox,
    affiliatedUnit,
    allProjectType,
    Centralized,
    threeLevel,
    ssBm
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
      loading: false,
      searchShow: true,
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      userCode: '',
      userId: '',
      specialorgid: '',
      example: [],
      columnObj: {},
      segmentIds: [],
      segment: [
        {
          value: 'xmjbxx',
          label: '项目基本信息',
          checked: true
        },
        {
          value: 'lxhj',
          label: '立项环节',
          checked: true
        },
        {
          value: 'ztbhj',
          label: '招投标环节',
          checked: true
        },
        {
          value: 'htqdhj',
          label: '合同签订环节',
          checked: true
        },
        {
          value: 'xmsshj',
          label: '项目实施环节',
          checked: true
        },
        {
          value: 'xmjssjhj',
          label: '项目决算审计环节',
          checked: true
        },
        {
          value: 'zzsjhj',
          label: '增资审计环节',
          checked: true
        },
        {
          value: 'xmgb',
          label: '项目关闭',
          checked: true
        },
        {
          value: 'wzlybs',
          label: '物资领用标识',
          checked: true
        },
        {
          value: 'ywbxbs',
          label: '业务报销标识',
          checked: true
        },
        {
          value: 'fwqrbs',
          label: '服务确认标识',
          checked: true
        }
      ],
      dataList: {
        month: new Date(),
        post1: ''
      },
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      projects: [
        {
          code: '01',
          name: '项目已立项'
        },
        {
          code: '02',
          name: '需求提报中'
        },
        {
          code: '03',
          name: '项目招标中'
        },
        {
          code: '04',
          name: '合同签订中'
        },
        {
          code: '05',
          name: '合同已签订'
        },
        {
          code: '06',
          name: '项目实施中'
        },
        {
          code: '07',
          name: '项目已竣工'
        },
        {
          code: '08',
          name: '项目决算送审中'
        },
        {
          code: '09',
          name: '项目决算审计中'
        },
        {
          code: '10',
          name: '项目已决算审计'
        },
        {
          code: '11',
          name: '项目增资中'
        },
        {
          code: '12',
          name: '项目已关闭'
        }
      ],
      value: ''
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
    //计算表格高度
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 80 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 80 + 'px'
      }
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
        this.columnObj[item.value] = item.checked
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
    },
    loadData() {
      this.loading = true
      const params = {
        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid,
        pspids: [],
        post1: this.dataList.post1,
        qkjejdws: [],
        qkjxmlxbms: [],
        gkbms: [],
        ssbms: [],
        sjfls: [],
        xmjdzt: this.value,
        zyear: '',
        zmonth: ''
      }
      //项目编码
      params.pspids = this.$refs.xmbm.array
      //所属单位
      params.qkjejdws = this.$refs.company.selectList
      //项目类型
      params.qkjxmlxbms = this.$refs.type.selectList
      //归口部门
      params.gkbms = this.$refs.gkbm.selectList
      //实施部门
      params.ssbms = this.$refs.ssbm.list
      //三级分类
      params.sjfls = this.$refs.sjfl.list
      //年月
      if (this.dataList.month != '') {
        let time = new Date(this.dataList.month)
        let zyear = time.getFullYear()
        let zmonth = time.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      baseService.post('/process33/', params).then((res) => {
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
    async exportBtn() {
      this.loading = true
      const params = {
        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid,
        pspids: [],
        post1: this.dataList.post1,
        qkjejdws: [],
        qkjxmlxbms: [],
        gkbms: [],
        ssbms: [],
        sjfls: [],
        xmjdzt: this.value,
        zyear: '',
        zmonth: ''
      }
      //项目编码
      params.pspids = this.$refs.xmbm.array
      //所属单位
      params.qkjejdws = this.$refs.company.selectList
      //项目类型
      params.qkjxmlxbms = this.$refs.type.selectList
      //归口部门
      params.gkbms = this.$refs.gkbm.selectList
      //实施部门
      params.ssbms = this.$refs.ssbm.list
      //三级分类
      params.sjfls = this.$refs.sjfl.list
      //年月
      if (this.dataList.month != '') {
        let time = new Date(this.dataList.month)
        let zyear = time.getFullYear()
        let zmonth = time.getMonth() + 1
        params.zyear = JSON.stringify(zyear)
        params.zmonth = JSON.stringify(zmonth)
      }
      await baseService.export('/process33/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '项目执行进度监控.xlsx'
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
    reset() {
      this.$refs.xmbm.clear()
      this.dataList.post1 = ''
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.$refs.gkbm.clear()
      this.$refs.ssbm.clear()
      this.$refs.sjfl.clear()
      this.value = ''
      this.dataList.month = new Date()
      this.example = []
      this.loadData()
    }
  }
})
</script>

<style lang="less" scoped>
.accounts35 {
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
