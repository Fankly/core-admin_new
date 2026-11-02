<template>
  <div class="accounts24" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>在线稽核总表</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon class="ep-icon-s-operation" style="font-size: 18px">
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
                <copyTextBox ref="xmbm" class="formWidth"></copyTextBox>
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
                <el-input class="formWidth" v-model="dataList.xmbmc"></el-input>
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
      :span-method="objectSpanMethod"
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
        <el-table-column width="160" v-if="columnObj.lxjsx" prop="jh_lxjsx" label="立项及时性异常"> </el-table-column>
        <el-table-column width="160" v-if="columnObj.ztbjsx" prop="jh_ztbjsx" label="招投标及时性异常"> </el-table-column>
        <el-table-column width="160" v-if="columnObj.zbxdjsx" prop="jh_zbjgxdjsx" label="中标下达及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.ztbcy" prop="ztbjsx_sl" label="招投标差异异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.htqdjsx" prop="jh_htqdjsx" label="合同签订及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.htqdgfx" prop="jh_htqdgfx_sl" label="合同签订规范性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.htlygfx" prop="jh_htlygfx_sl" label="合同履约规范性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.kgjsx" prop="jh_kgjsx" label="开工及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.jgjsx" prop="jh_jgjsx" label="竣工及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.wzzlzt" prop="jh_wzzlztbs" label="物资整领整退"></el-table-column>
        <el-table-column width="160" v-if="columnObj.wztklg" prop="jh_wztkl" label="物资退库率高"></el-table-column>
        <el-table-column width="160" v-if="columnObj.wzcqg" prop="jh_wzcqgce" label="物资超欠拱"></el-table-column>
        <el-table-column width="160" v-if="columnObj.ystzcyd" prop="jh_ndystzl" label="预算调整差异大"></el-table-column>
        <el-table-column width="160" v-if="columnObj.ystzpcg" prop="jh_ndystzcs" label="预算调整频次高"></el-table-column>
        <el-table-column width="160" v-if="columnObj.jsssjsx" prop="jh_jsssjsx" label="结算送审及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.jssjjsx" prop="jh_jssjjsx" label="结算审计及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.sjhjl" prop="jh_sjhjl" label="审计核减率高"></el-table-column>
        <el-table-column width="160" v-if="columnObj.zjzfjsx" prop="jh_zjzfjsx" label="资金支付及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.chtzf" prop="jh_htzfgfx_sl" label="超合同支付"></el-table-column>
        <el-table-column width="160" v-if="columnObj.skdwbyz" prop="jh_skdwyzx" label="收款单位不一致"></el-table-column>
        <el-table-column width="160" v-if="columnObj.juessjjsx" prop="jh_jusssjsxz" label="决算送审及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.juesusjjsx" prop="jh_jussjjsx" label="决算审计及时性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.zgzjsx" prop="jh_zgzzjsx" label="暂估转及时性"></el-table-column>
        <el-table-column width="160" v-if="columnObj.zszzjsx" prop="jh_zszzjsx" label="正式转资及时性"></el-table-column>
        <el-table-column width="160" v-if="columnObj.zgzzhlx" prop="jh_zgzzhlx" label="暂估增资合理性异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.zjgcye" prop="jh_zjgcfs" label="在建工程余额异常"></el-table-column>
        <el-table-column width="160" v-if="columnObj.gbjsx" prop="jh_gbjsx" label="关闭及时性异常"></el-table-column>
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

<script setup>
import {
  ArrowDown as EpArrowDown,
  ArrowUp as EpArrowUp,
  Download as EpDownload,
  QuestionFilled as EpQuestionFilled,
  RefreshRight as EpRefreshRight,
  Search as EpSearch
} from '@element-plus/icons-vue'
import { markRaw as markElementIconRaw, reactive, toRef, onMounted, useTemplateRef } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import Centralized from '@/components/select/Centralized.vue'
import { useStore } from '@/store/business'
import { showHelpMsg } from '@/utils/message'
defineOptions({
  name: '/budget-process/process-24'
})
const xmbmRef = useTemplateRef('xmbm')
const typeRef = useTemplateRef('type')
const companyRef = useTemplateRef('company')
const gkbmRef = useTemplateRef('gkbm')
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
    month: new Date(),
    name: '',
    xmbmc: ''
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
  segment: [
    {
      value: 'lxjsx',
      label: '立项及时性异常',
      checked: true
    },
    {
      value: 'ztbjsx',
      label: '招投标及时性异常',
      checked: true
    },
    {
      value: 'zbxdjsx',
      label: '中标下达及时性异常',
      checked: true
    },
    {
      value: 'ztbcy',
      label: '招投标差异异常',
      checked: true
    },
    {
      value: 'htqdjsx',
      label: '合同签订及时性异常',
      checked: true
    },
    {
      value: 'htqdgfx',
      label: '合同签订规范性异常',
      checked: true
    },
    {
      value: 'htlygfx',
      label: '合同履约规范性异常',
      checked: true
    },
    {
      value: 'kgjsx',
      label: '开工及时性异常',
      checked: true
    },
    {
      value: 'jgjsx',
      label: '竣工及时性异常',
      checked: true
    },
    {
      value: 'wzzlzt',
      label: '物资整领整退',
      checked: true
    },
    {
      value: 'wztklg',
      label: '物资退库率高',
      checked: true
    },
    {
      value: 'wzcqg',
      label: '物资超欠拱',
      checked: true
    },
    {
      value: 'ystzcyd',
      label: '预算调整差异大',
      checked: true
    },
    {
      value: 'ystzpcg',
      label: '预算调整频此高',
      checked: true
    },
    {
      value: 'jsssjsx',
      label: '结算送审及时性异常',
      checked: true
    },
    {
      value: 'jssjjsx',
      label: '结算审计及时性异常',
      checked: true
    },
    {
      value: 'sjhjl',
      label: '审计核减率高',
      checked: true
    },
    {
      value: 'zjzfjsx',
      label: '资金支付及时性异常',
      checked: true
    },
    {
      value: 'chtzf',
      label: '超合同支付',
      checked: true
    },
    {
      value: 'skdwbyz',
      label: '收款单位不一致',
      checked: true
    },
    {
      value: 'juessjjsx',
      label: '决算送审及时性异常',
      checked: true
    },
    {
      value: 'juesusjjsx',
      label: '决算审计及时性异常',
      checked: true
    },
    {
      value: 'zgzjsx',
      label: '暂估转及时性',
      checked: true
    },
    {
      value: 'zszzjsx',
      label: '正式转资及时性',
      checked: true
    },
    {
      value: 'zgzzhlx',
      label: '暂估增资合理性异常',
      checked: true
    },
    {
      value: 'zjgcye',
      label: '在建工程余额异常',
      checked: true
    },
    {
      value: 'gbjsx',
      label: '关闭及时性异常',
      checked: true
    }
  ],
  segmentIds: [],
  columnObj: {},
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
const segment = toRef(setupState, 'segment')
const segmentIds = toRef(setupState, 'segmentIds')
const columnObj = toRef(setupState, 'columnObj')
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
function loadData() {
  setupState.loading = true
  const params = {
    pspids: [],
    post1: setupState.dataList.name,
    qkjxmlxbms: [],
    qkjejdws: [],
    zyear: '',
    zmonth: '',
    qkjxmb: setupState.dataList.xmbmc,
    gkbms: [],
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  //项目编码
  params.pspids = xmbmRef.value.array
  //项目类型
  params.qkjxmlxbms = typeRef.value.selectList
  //单位
  params.qkjejdws = companyRef.value.selectList
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  baseService.post('/process/process24/', params).then((res) => {
    if (res.success == true) {
      setupState.loading = false
      setupState.example = res.data.records
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
    post1: setupState.dataList.name,
    qkjxmlxbms: [],
    qkjejdws: [],
    zyear: '',
    zmonth: '',
    qkjxmb: setupState.dataList.xmbmc,
    gkbms: [],
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  //项目编码
  params.pspids = xmbmRef.value.array
  //项目类型
  params.qkjxmlxbms = typeRef.value.selectList
  //单位
  params.qkjejdws = companyRef.value.selectList
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  await baseService.export('/process/process24/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '在线稽核总表.xlsx'
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
//搜索按钮
function search() {
  loadData()
}
//重置按钮
function reset() {
  setupState.dataList.month = new Date()
  setupState.dataList.name = ''
  setupState.dataList.xmbmc = ''
  typeRef.value.clear()
  companyRef.value.clear()
  xmbmRef.value.clear()
  gkbmRef.value.clear()
  setupState.example = []
  loadData()
}
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  setTableHeight()
}
//处理环节数据
function handleColumn() {
  setupState.segment.forEach((item) => {
    setupState.segmentIds.push(item.value)
    setupState.columnObj[item.value] = true
  })
}
//项目环节
function listShow(value, checked) {
  for (let i in setupState.columnObj) {
    if (i == value) {
      setupState.columnObj[i] = checked
    }
  }
}
function loadCompany() {
  setupState.loading = false
  setupState.specialorgid = parseInt(userDialogRef.value.specialorgid)
  companyRef.value.getAffiliatedUnit(setupState.specialorgid)
  gkbmRef.value.getProjectType(setupState.specialorgid)
}
onMounted(() => {
  setupState.topHeight = document.querySelector('.topBox').clientHeight
  setupState.heightNum = document.querySelector('.el-card').clientHeight
  setupState.searchHeight = document.querySelector('.search').clientHeight
  setTableHeight()
  setupState.loading = true
  userDialogRef.value.getUser(setupState.userId, setupState.userCode)
})
;(() => {
  handleColumn()
})()
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
  segment,
  segmentIds,
  columnObj,
  loading,
  userCode,
  userId,
  specialorgid,
  setTableHeight,
  loadData,
  exportBtn,
  pageChangeHandle,
  limitChangeHandle,
  search,
  reset,
  showSearch,
  handleColumn,
  listShow,
  loadCompany
})
</script>

<style lang="less" scoped>
.accounts24 {
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
