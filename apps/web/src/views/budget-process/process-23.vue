<template>
  <div class="accountsCT" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目决算与增资信息</h2>
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
        <el-form label-width="100px" label-position="left">
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
                <el-button type="primary" :icon="EpSearch" @click="search">查 询</el-button>
                <el-button :icon="EpRefreshRight" @click="reset">重 置</el-button>
                <el-button type="warning" :icon="EpDownload" @click="exportBtn">导 出</el-button>
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
      style="width: 100%; margin-top: 20px"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="基本信息">
        <el-table-column width="120" prop="pspid" label="项目编号"></el-table-column>
        <el-table-column width="290" prop="post1" label="项目名称"></el-table-column>
        <el-table-column width="120" prop="qkjxmlxmc" label="项目类型"></el-table-column>
        <el-table-column width="120" prop="qkjxmb_mc" label="项目包"></el-table-column>
        <el-table-column width="120" prop="zjsjd_mc" label="项目性质"></el-table-column>
        <el-table-column width="230" prop="qkjyjdw_name" label="一级单位"></el-table-column>
        <el-table-column width="230" prop="qkjejdw_name" label="二级单位"></el-table-column>
        <el-table-column width="120" prop="qkjgkbm_name" label="归口部门"></el-table-column>
        <el-table-column width="120" prop="erpjdys" label="年度预算"></el-table-column>
        <el-table-column width="160" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>
        <el-table-column width="160" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>
      </el-table-column>
      <el-table-column width="160" prop="zgzzrq" label="首笔增资时间"></el-table-column>
      <el-table-column width="160" prop="zgzzje" label="首笔增资金额"></el-table-column>
      <el-table-column width="160" prop="zjzzrq" label="最新增资时间"></el-table-column>
      <el-table-column width="160" prop="zdnzzje" label="累计增资金额"></el-table-column>
      <el-table-column width="160" prop="jus_sendrq" label="决算送审日期"></el-table-column>
      <el-table-column width="160" prop="jus_sdrq" label="决算审定日期"></el-table-column>
      <el-table-column width="160" prop="jus_sendamt" label="决算送审金额"></el-table-column>
      <el-table-column width="160" prop="jus_settleamt" label="决算审定金额"></el-table-column>
      <el-table-column width="160" prop="zjgcye" label="在建工程余额"></el-table-column>
      <el-table-column width="160" prop="jus_sjbgh" label="决算审计报告文号"></el-table-column>
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
  name: '/budget-process/process-23'
})
const componentInstance = getCurrentInstance().proxy
const xmxzRef = useTemplateRef('xmxz')
const xmbmRef = useTemplateRef('xmbm')
const gkbmRef = useTemplateRef('gkbm')
const typeRef = useTemplateRef('type')
const companyRef = useTemplateRef('company')
const userDialogRef = useTemplateRef('userDialog')
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
  example: [],
  searchShow: true,
  dataList: {
    post1: '',
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
  loading: false,
  userCode: '',
  userId: '',
  specialorgid: ''
})
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
function loadData() {
  setupState.loading = true
  const params = {
    pspids: [],
    zjsjd_mc: xmxzRef.value.value,
    gkbms: [],
    post1: setupState.dataList.post1,
    xmb: setupState.dataList.xmb,
    zyear: '',
    zmonth: '',
    qkjxmlxbms: [],
    qkjejdws: [],
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  //项目编码
  params.pspids = xmbmRef.value.array
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  //截至日期
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  //项目类型
  params.qkjxmlxbms = typeRef.value.selectList
  // 所属单位
  params.qkjejdws = companyRef.value.selectList
  baseService.post('/process/process23/', params).then((res) => {
    if (res.success == true) {
      setupState.loading = false
      setupState.example = res.data.list
      setupState.page.total = res.data.total
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
//导出按钮
async function exportBtn() {
  setupState.loading = true
  const params = {
    pspids: [],
    zjsjd_mc: xmxzRef.value.value,
    gkbms: [],
    post1: setupState.dataList.post1,
    xmb: setupState.dataList.xmb,
    zyear: '',
    zmonth: '',
    qkjxmlxbms: [],
    qkjejdws: [],
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  //项目编码
  params.pspids = xmbmRef.value.array
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  //截至日期
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  //项目类型
  params.qkjxmlxbms = typeRef.value.selectList
  // 所属单位
  params.qkjejdws = companyRef.value.selectList
  await baseService.export('/process/process23/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '决算与增资环节穿透.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
}
function setTableHeight() {
  if (setupState.searchShow == true) {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight - 100 + 'px'
  } else {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight + setupState.searchHeight - 100 + 'px'
  }
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
  gkbmRef.value.clear()
  setupState.dataList.post1 = ''
  setupState.dataList.xmb = ''
  setupState.dataList.month = new Date()
  typeRef.value.clear()
  companyRef.value.clear()
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
  () => setupState.store.state.jsyzzData.pspid,
  function (val) {
    if (val) {
      xmbmRef.value.ids = val
      xmbmRef.value.text = val
      xmbmRef.value.array.push(val)
      setupState.specialorgid = JSON.parse(setupState.store.state.jsyzzData.specialorgid)
      loadData()
      // 清空vuex中的数据
      setupState.store.commit('jsyzzData', {})
    }
  },
  {}
)
watch(() => componentInstance.deep, true)
onMounted(() => {
  setupState.topHeight = document.querySelector('.topBox').clientHeight
  setupState.heightNum = document.querySelector('.el-card').clientHeight
  setupState.searchHeight = document.querySelector('.search').clientHeight
  setTableHeight()
  if (setupState.store.state.jsyzzData.pspid && setupState.store.state.jsyzzData.specialorgid) {
    xmbmRef.value.ids = setupState.store.state.jsyzzData.pspid
    xmbmRef.value.text = setupState.store.state.jsyzzData.pspid
    xmbmRef.value.array.push(setupState.store.state.jsyzzData.pspid)
    setupState.specialorgid = JSON.parse(setupState.store.state.jsyzzData.specialorgid)
    loadData()
    // 清空vuex中的数据
    setupState.store.commit('jsyzzData', {})
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
  loadData,
  exportBtn,
  setTableHeight,
  pageChangeHandle,
  limitChangeHandle,
  showSearch,
  search,
  reset,
  loadCompany
})
</script>

<style lang="less" scoped>
.accountsCT {
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
