<template>
  <div class="implementationCT" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目实施信息</h2>
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
              <el-form-item label="项目类型：">
                <projectType class="formWidth" ref="type"></projectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
              </el-form-item>
            </el-col>
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
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
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
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="基本信息">
        <el-table-column show-overflow-tooltip width="160" prop="pspid" label="项目编码"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="post1" label="项目名称"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="qkjxmlxmc" label="项目类型"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="qkjxmb_mc" label="项目包"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="zjsjd_mc" label="项目性质"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="qkjyjdw_name" label="一级单位"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="qkjejdw_name" label="二级单位"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="qkjgkbm_name" label="归口部门"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="erpjdys" label="年度预算"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="ndzc_hs" label="当年财务支出(含税)"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="ndzcb_hs" label="当年财务支出(不含税)"></el-table-column>
      </el-table-column>
      <el-table-column label="现场实施">
        <el-table-column show-overflow-tooltip width="160" prop="zjhkg" label="计划开工日期"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="zsjkg" label="实际竣工日期"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="" label="现场变更"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="" label="停电日期"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="zjhjg" label="计划竣工日期"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="zsjjg" label="实际竣工日期"></el-table-column>
      </el-table-column>
      <el-table-column label="物资到货与领用情况">
        <el-table-column show-overflow-tooltip width="160" prop="sbwzsjdhrq" label="首笔物资到货日期"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="xmwzdhje" label="累计物资到货金额"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="wbwzlyrq" label="首次物资领用日期"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="ljwzlyje" label="累计物资领用金额"></el-table-column>
      </el-table-column>
      <el-table-column label="预算调整">
        <el-table-column show-overflow-tooltip width="160" prop="erpndysbd" label="预算调整金额"></el-table-column>
        <el-table-column show-overflow-tooltip width="160" prop="erpndysbdcs" label="预算调整次数"></el-table-column>
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
import { markRaw as markElementIconRaw, reactive, toRef, watch, onMounted, getCurrentInstance, useTemplateRef } from 'vue'
import baseService from '@/service/baseService'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import Centralized from '@/components/select/Centralized.vue'
import projectnature from '@/components/select/projectnature.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from '@/store/business'
import { ElMessage } from 'element-plus'
import { showHelpMsg } from '@/utils/message'
defineOptions({
  name: '/budget-process/process-20'
})
const componentInstance = getCurrentInstance().proxy
const xmxzRef = useTemplateRef('xmxz')
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
  spanArr: [],
  // 用于存放需要合并的行的个数
  spanIndex: 0,
  // 记录spanArr数组的下标
  example: [],
  searchShow: true,
  dataList: {
    post1: '',
    month: new Date(),
    xmb: ''
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
    setupState.tableHeight = setupState.heightNum - setupState.topHeight - 64 + 'px'
  } else {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight + setupState.searchHeight - 64 + 'px'
  }
}
// getSpanArr(data) {
//   for (let i = 0; i < data.length; i++) {
//     if (i === 0) {
//       this.spanArr.push(1);
//       this.spanIndex = 0;
//     } else {
//       // 判断当前行与前一行内容是否相同
//       if (data[i].pspid === data[i - 1].pspid) {
//         this.spanArr[this.spanIndex] += 1; // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
//         this.spanArr.push(0); // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
//       } else {
//         this.spanArr.push(1); // 否则，依旧是一行
//         this.spanIndex = i;
//       }
//     }
//   }
// },
function loadData() {
  setupState.loading = true
  setupState.spanArr = [] // 用于存放需要合并的行的个数
  setupState.spanIndex = 0 // 记录spanArr数组的下标
  const params = {
    post1: setupState.dataList.post1,
    pspids: [],
    qkjxmlxbms: [],
    qkjejdws: [],
    gkbms: [],
    xmb: setupState.dataList.xmb,
    zjsjd_mc: xmxzRef.value.value,
    zyear: '',
    zmonth: '',
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  params.pspids = xmbmRef.value.array
  params.qkjxmlxbms = typeRef.value.selectList
  params.qkjejdws = companyRef.value.selectList
  params.gkbms = gkbmRef.value.selectList
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  baseService.post('/process/process20/', params).then((res) => {
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
function exportData() {
  setupState.loading = true
  const params = {
    post1: setupState.dataList.post1,
    pspids: [],
    qkjxmlxbms: [],
    qkjejdws: [],
    gkbms: [],
    xmb: setupState.dataList.xmb,
    zjsjd_mc: xmxzRef.value.value,
    zyear: '',
    zmonth: '',
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  params.pspids = xmbmRef.value.array
  params.qkjxmlxbms = typeRef.value.selectList
  params.qkjejdws = companyRef.value.selectList
  params.gkbms = gkbmRef.value.selectList
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  baseService.export('/process/process20/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '项目实施环节穿透.xlsx'
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
// objectSpanMethod({ row, column, rowIndex, columnIndex }) {
//   // console.log(columnIndex);
//   if (columnIndex < 6) {
//     const _row = this.spanArr[rowIndex]; // 行数
//     const _col = _row > 0 ? 1 : 0; // 列数
//     return {
//       rowspan: _row,
//       colspan: _col
//     };
//   }
// },
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
  setupState.dataList.post1 = ''
  xmbmRef.value.clear()
  typeRef.value.clear()
  companyRef.value.clear()
  setupState.dataList.xmb = ''
  gkbmRef.value.clear()
  xmxzRef.value.clear()
  setupState.dataList.month = new Date()
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
  () => setupState.store.state.xmssData.pspid,
  function (val) {
    if (val) {
      xmbmRef.value.ids = val
      xmbmRef.value.text = val
      xmbmRef.value.array.push(val)
      setupState.specialorgid = JSON.parse(setupState.store.state.xmssData.specialorgid)
      loadData()
      // 清空vuex中的数据
      setupState.store.commit('xmssData', {})
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
  if (setupState.store.state.xmssData.pspid && setupState.store.state.xmssData.specialorgid) {
    xmbmRef.value.ids = setupState.store.state.xmssData.pspid
    xmbmRef.value.text = setupState.store.state.xmssData.pspid
    xmbmRef.value.array.push(setupState.store.state.xmssData.pspid)
    setupState.specialorgid = JSON.parse(setupState.store.state.xmssData.specialorgid)
    loadData()
    // 清空vuex中的数据
    setupState.store.commit('xmssData', {})
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
.implementationCT {
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
