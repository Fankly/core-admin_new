<template>
  <div class="auditCT" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目审计信息</h2>
        </div>
        <div class="searchBox">
          <span style="margin-right: 20px">
            <span class="searchShow" v-if="searchShow == false" @click="showSearch(true)">
              <el-icon style="font-size: 18px" class="ep-icon-arrow-down"><EpArrowDown /></el-icon>
            </span>
            <span class="searchShow" @click="showSearch(false)" v-else>
              <el-icon style="font-size: 18px" class="ep-icon-arrow-up"><EpArrowUp /></el-icon>
            </span>
          </span>
          <span class="searchShow">
            <el-icon style="font-size: 18px" class="ep-icon-question" @click="helpHandle"><EpQuestionFilled /></el-icon>
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
              <el-form-item label="项目性质：">
                <projectnature class="formWidth" ref="xmxz"></projectnature>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
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
              <el-form-item label="送审日期：">
                <el-date-picker
                  v-model="dataList.SendDate"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <projectType class="formWidth" ref="type"></projectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="收审日期：">
                <el-date-picker
                  v-model="dataList.SettleDate"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="截至日期：">
                <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"> </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目包：">
                <el-input class="formWidth" v-model="dataList.xmb" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="审定日期：">
                <el-date-picker
                  v-model="dataList.AuditDate"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item class="btnPostion">
                <el-button type="primary" :icon="EpSearch" @click="search">查 询</el-button>
                <el-button :icon="EpRefreshRight" @click="reset">重 置</el-button>
                <el-button type="warning" :icon="EpDownload" @click="exportData">导 出</el-button>
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
      style="width: 100%; margin-top: 10px"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column width="160" prop="pspid" label="项目编号"></el-table-column>
      <el-table-column width="300" fixed prop="post1" label="项目名称"></el-table-column>
      <el-table-column width="160" prop="qkjxmlxmc" label="项目类型"></el-table-column>
      <el-table-column width="160" prop="qkjxmb_mc" label="项目包"></el-table-column>
      <el-table-column width="160" prop="zjsjd_mc" label="项目性质"></el-table-column>
      <el-table-column width="300" prop="qkjyjdw_name" label="一级单位"></el-table-column>
      <el-table-column width="300" prop="qkjejdw_name" label="二级单位"></el-table-column>
      <el-table-column width="160" prop="qkjgkbm_name" label="归口部门"></el-table-column>
      <el-table-column width="160" prop="erpjdys" label="年度预算"></el-table-column>
      <el-table-column width="160" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>
      <el-table-column width="160" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>
      <el-table-column width="160" prop="xuhao" label="序号"></el-table-column>
      <el-table-column width="160" prop="send_id" label="送审单id"></el-table-column>
      <el-table-column width="160" prop="send_date" label="送审时间"></el-table-column>
      <el-table-column width="160" label="送审金额">
        <el-table-column width="160" prop="ssjezj" label="总计"></el-table-column>
        <el-table-column width="160" prop="send_build_mny" label="土建金额"></el-table-column>
        <el-table-column width="160" prop="send_install_mny" label="安装金额"></el-table-column>
        <el-table-column width="160" prop="send_mate_mny" label="甲供材金额"></el-table-column>
      </el-table-column>

      <el-table-column width="160" prop="settle_date" label="收审时间"></el-table-column>
      <el-table-column width="160" prop="audit_date" label="审定日期"></el-table-column>
      <el-table-column width="160" label="审定金额">
        <el-table-column width="160" prop="sdjezj" label="总计"></el-table-column>
        <el-table-column width="160" prop="settle_build_mny" label="土建金额"></el-table-column>
        <el-table-column width="160" prop="settle_install_mny" label="安装金额"></el-table-column>
        <el-table-column width="160" prop="settle_mate_mny" label="甲供材金额"></el-table-column>
      </el-table-column>

      <el-table-column width="160" label="审计核减金额">
        <el-table-column width="160" prop="sjhjzj" label="总计"></el-table-column>
        <el-table-column width="160" prop="sjhjtjje" label="土建金额"></el-table-column>
        <el-table-column width="160" prop="sjhjazje" label="安装金额"></el-table-column>
        <el-table-column width="160" prop="sjhjjgcje" label="甲供材金额"></el-table-column>
      </el-table-column>

      <el-table-column width="160" label="审定核减率">
        <el-table-column width="160" prop="sdhjl" label="总计"></el-table-column>
        <el-table-column width="160" prop="sdhjl_build" label="土建金额"></el-table-column>
        <el-table-column width="160" prop="sdhjl_install" label="安装金额"></el-table-column>
        <el-table-column width="160" prop="sdhjl_mate" label="甲供材金额"></el-table-column>
      </el-table-column>
      <el-table-column width="160" prop="report_num" label="审计报告号"></el-table-column>
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
    <userDialog ref="userDialogInstance" @loadCompany="loadCompany"></userDialog>
  </div>
</template>

<script setup>
import {
  ArrowDown as EpArrowDown,
  ArrowUp as EpArrowUp,
  Download as EpDownload,
  QuestionFilled as EpQuestionFilled,
  RefreshRight as EpRefreshRight,
  Search as EpSearch
} from '@element-plus/icons-vue'
import { markRaw as markElementIconRaw, reactive, toRef, watch, onMounted, getCurrentInstance, useTemplateRef } from 'vue'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import Centralized from '@/components/select/Centralized.vue'
import projectnature from '@/components/select/projectnature.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from '@/store/business'
import { showHelpMsg } from '@/utils/message'
defineOptions({
  name: '/budget-process/process-21'
})
const componentInstance = getCurrentInstance().proxy
const xmxzRef = useTemplateRef('xmxz')
const xmbmRef = useTemplateRef('xmbm')
const companyRef = useTemplateRef('company')
const gkbmRef = useTemplateRef('gkbm')
const typeRef = useTemplateRef('type')
const userDialogRef = useTemplateRef('userDialogInstance')
const store = useStore()
const helpHandle = () => {
  const url = store.getters.getMenuMsg.url
  showHelpMsg(url)
}
const setupState = reactive({
  EpArrowDown: markElementIconRaw(EpArrowDown),
  EpArrowUp: markElementIconRaw(EpArrowUp),
  EpDownload: markElementIconRaw(EpDownload),
  EpQuestionFilled: markElementIconRaw(EpQuestionFilled),
  EpRefreshRight: markElementIconRaw(EpRefreshRight),
  EpSearch: markElementIconRaw(EpSearch),
  store,
  helpHandle,
  spanArr: [],
  // 用于存放需要合并的行的个数
  spanIndex: 0,
  // 记录spanArr数组的下标
  example: [],
  searchShow: true,
  dataList: {
    post1: '',
    xmb: '',
    month: new Date(),
    SendDate: '',
    SettleDate: '',
    AuditDate: ''
  },
  page: {
    total: 0,
    limit: 10,
    page: 1,
    current: 1
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
const spanArr = toRef(setupState, 'spanArr')
const spanIndex = toRef(setupState, 'spanIndex')
const example = toRef(setupState, 'example')
const searchShow = toRef(setupState, 'searchShow')
const dataList = toRef(setupState, 'dataList')
const page = toRef(setupState, 'page')
const tableHeight = toRef(setupState, 'tableHeight')
const topHeight = toRef(setupState, 'topHeight')
const heightNum = toRef(setupState, 'heightNum')
const searchHeight = toRef(setupState, 'searchHeight')
const loading = toRef(setupState, 'loading')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
function setTableHeight() {
  if (setupState.searchShow == true) {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight - 80 + 'px'
  } else {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight + setupState.searchHeight - 80 + 'px'
  }
}
function getSpanArr(data) {
  let len = 0
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      len += 1
      data[i].xuhao = len
      setupState.spanArr.push(1)
      setupState.spanIndex = 0
    } else {
      // 判断当前行与前一行内容是否相同
      if (data[i].pspid === data[i - 1].pspid) {
        setupState.spanArr[setupState.spanIndex] += 1 // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
        setupState.spanArr.push(0) // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
        len += 1
        data[i].xuhao = len
      } else {
        len = 1
        data[i].xuhao = len
        setupState.spanArr.push(1) // 否则，依旧是一行
        setupState.spanIndex = i
      }
    }
  }
}
function objectSpanMethod({ rowIndex, columnIndex }) {
  if (columnIndex < 11) {
    const _row = setupState.spanArr[rowIndex] // 行数
    const _col = _row > 0 ? 1 : 0 // 列数
    return {
      rowspan: _row,
      colspan: _col
    }
  }
}
function loadData() {
  setupState.loading = true
  setupState.spanArr = [] // 用于存放需要合并的行的个数
  setupState.spanIndex = 0 // 记录spanArr数组的下标
  const params = {
    pspids: [],
    zjsjd_mc: xmxzRef.value.value,
    qkjejdws: [],
    post1: setupState.dataList.post1,
    sSendDate: '',
    eSendDate: '',
    gkbms: [],
    qkjxmlxbms: [],
    sSettleDate: '',
    eSettleDate: '',
    zyear: '',
    zmonth: '',
    xmb: setupState.dataList.xmb,
    sAuditDate: '',
    eAuditDate: '',
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }

  //项目编码
  params.pspids = xmbmRef.value.array
  //所属单位
  params.qkjejdws = companyRef.value.selectList
  //送审日期
  if (setupState.dataList.SendDate) {
    params.sSendDate = setupState.dataList.SendDate[0]
    params.eSendDate = setupState.dataList.SendDate[1]
  }
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  //项目类型
  params.qkjxmlxbms = typeRef.value.selectList
  //收审日期
  if (setupState.dataList.SettleDate) {
    params.sSettleDate = setupState.dataList.SettleDate[0]
    params.eSettleDate = setupState.dataList.SettleDate[1]
  }
  //截止日期
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  //审定日期
  if (setupState.dataList.AuditDate) {
    params.sAuditDate = setupState.dataList.AuditDate[0]
    params.eAuditDate = setupState.dataList.AuditDate[1]
  }
  baseService.post('/process/process21/', params).then((res) => {
    if (res.success == true) {
      setupState.loading = false
      setupState.example = res.data.list
      setupState.page.total = res.data.total
      getSpanArr(setupState.example)
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function exportData() {
  setupState.loading = true
  const params = {
    pspids: [],
    zjsjd_mc: xmxzRef.value.value,
    qkjejdws: [],
    post1: setupState.dataList.post1,
    sSendDate: '',
    eSendDate: '',
    gkbms: [],
    qkjxmlxbms: [],
    sSettleDate: '',
    eSettleDate: '',
    zyear: '',
    zmonth: '',
    xmb: setupState.dataList.xmb,
    sAuditDate: '',
    eAuditDate: '',
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }

  //项目编码
  params.pspids = xmbmRef.value.array
  //所属单位
  params.qkjejdws = companyRef.value.selectList
  //送审日期
  if (setupState.dataList.SendDate) {
    params.sSendDate = setupState.dataList.SendDate[0]
    params.eSendDate = setupState.dataList.SendDate[1]
  }
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  //项目类型
  params.qkjxmlxbms = typeRef.value.selectList
  //收审日期
  if (setupState.dataList.SettleDate) {
    params.sSettleDate = setupState.dataList.SettleDate[0]
    params.eSettleDate = setupState.dataList.SettleDate[1]
  }
  //截止日期
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  //审定日期
  if (setupState.dataList.AuditDate) {
    params.sAuditDate = setupState.dataList.AuditDate[0]
    params.eAuditDate = setupState.dataList.AuditDate[1]
  }
  baseService.export('/process/process21/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '项目审计环节穿透.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
}
// 分页控件当前页修改事件
function pageChangeHandle(currentPageNum) {
  setupState.page.page = currentPageNum
  loadData()
}
// 分页控件请求数量修改事件
function limitChangeHandle(currentLimitNum) {
  setupState.page.limit = currentLimitNum
  loadData()
}
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  setTableHeight()
}
//查询按钮
function search() {
  if (setupState.dataList.month) {
    loadData()
  } else {
    ElMessage({
      message: '请选择日期查询',
      icon: EpSearch,
      customClass: 'tipsBox'
    })
  }
}
//重置按钮
function reset() {
  xmbmRef.value.clear()
  xmxzRef.value.clear()
  companyRef.value.clear()
  setupState.dataList.post1 = ''
  setupState.dataList.SendDate = ''
  gkbmRef.value.clear()
  typeRef.value.clear()
  setupState.dataList.SettleDate = ''
  setupState.dataList.month = new Date()
  setupState.dataList.xmb = ''
  setupState.dataList.AuditDate = ''
  setupState.example = []
  search()
}
function loadCompany() {
  setupState.loading = false
  setupState.specialorgid = parseInt(userDialogRef.value.specialorgid)
  companyRef.value.getAffiliatedUnit(setupState.specialorgid)
  gkbmRef.value.getProjectType(setupState.specialorgid)
}
watch(
  () => setupState.store.state.xmsjData.pspid,
  function (val) {
    if (val) {
      xmbmRef.value.ids = val
      xmbmRef.value.text = val
      xmbmRef.value.array.push(val)
      setupState.specialorgid = JSON.parse(setupState.store.state.xmsjData.specialorgid)
      loadData()
      // 清空vuex中的数据
      setupState.store.commit('xmsjData', {})
    }
  },
  {}
)
onMounted(() => {
  setupState.topHeight = (document.querySelector('.topBox')?.clientHeight ?? 0)
  setupState.heightNum = (document.querySelector('.ds-workspace__viewport')?.clientHeight ?? window.innerHeight)
  setupState.searchHeight = (document.querySelector('.search')?.clientHeight ?? 0)
  setTableHeight()
  if (setupState.store.state.xmsjData.pspid && setupState.store.state.xmsjData.specialorgid) {
    xmbmRef.value.ids = setupState.store.state.xmsjData.pspid
    xmbmRef.value.text = setupState.store.state.xmsjData.pspid
    xmbmRef.value.array.push(setupState.store.state.xmsjData.pspid)
    setupState.specialorgid = JSON.parse(setupState.store.state.xmsjData.specialorgid)
    loadData()
    // 清空vuex中的数据
    setupState.store.commit('xmsjData', {})
  } else {
    setupState.loading = true
    userDialogRef.value.getUser()
  }
})
defineExpose({
  EpArrowDown,
  EpArrowUp,
  EpDownload,
  EpQuestionFilled,
  EpRefreshRight,
  EpSearch,
  store,
  helpHandle,
  spanArr,
  spanIndex,
  example,
  searchShow,
  dataList,
  page,
  tableHeight,
  topHeight,
  heightNum,
  searchHeight,
  loading,
  userCode,
  userId,
  specialorgid,
  setTableHeight,
  getSpanArr,
  objectSpanMethod,
  loadData,
  exportData,
  pageChangeHandle,
  limitChangeHandle,
  showSearch,
  search,
  reset,
  loadCompany
})
</script>

<style lang="less" scoped>
.auditCT {
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
