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
                  <el-radio :value="0" border style="margin-right: 10px">单位</el-radio>
                  <el-radio :value="1" border>类型</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
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
import allProjectType from '@/components/select/allProjectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import Centralized from '@/components/select/Centralized.vue'
import projectnature from '@/components/select/projectnature.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from '@/store/business'
import { showHelpMsg } from '@/utils/message'
defineOptions({
  name: '/budget-process/process-13'
})
const xmxzRef = useTemplateRef('xmxz')
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
const dataList = toRef(setupState, 'dataList')
const searchShow = toRef(setupState, 'searchShow')
const example = toRef(setupState, 'example')
const tableHeight = toRef(setupState, 'tableHeight')
const topHeight = toRef(setupState, 'topHeight')
const heightNum = toRef(setupState, 'heightNum')
const searchHeight = toRef(setupState, 'searchHeight')
const loading = toRef(setupState, 'loading')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
function getTime() {
  let date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  month = month > 9 ? month : '0' + month
  let start = year + '-' + '01'
  let last = year + '-' + month
  setupState.dataList.time.push(start)
  setupState.dataList.time.push(last)
}
function setTableHeight() {
  if (setupState.searchShow == true) {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight - 40 + 'px'
  } else {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight + setupState.searchHeight - 40 + 'px'
  }
}
function loadData() {
  if (setupState.dataList.time) {
    setupState.loading = true
    const params = {
      qkjxmlxbms: [],
      qkjejdws: [],
      zyear: setupState.dataList.year,
      sdate: '',
      edate: '',
      wd: setupState.dataList.select,
      gkbms: [],
      zjsjd_mc: xmxzRef.value.value,
      specialorgid: setupState.specialorgid
    }
    if (typeRef.value.selectList.length > 0) {
      params.qkjxmlxbms = typeRef.value.selectList
    } else {
      params.qkjxmlxbms = typeRef.value.allId
    }
    if (companyRef.value.selectList.length > 0) {
      params.qkjejdws = companyRef.value.selectList
    } else {
      params.qkjejdws = companyRef.value.allId
    }
    if (setupState.dataList.time) {
      params.sdate = setupState.dataList.time[0].replace('-', '')
      params.edate = setupState.dataList.time[1].replace('-', '')
    }
    params.gkbms = gkbmRef.value.selectList
    baseService.post('/process/process13/', params).then((res) => {
      if (res.success == true) {
        setupState.loading = false
        setupState.example = res.data
      } else {
        setupState.loading = false
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
}
function exportData() {
  if (setupState.dataList.time) {
    setupState.loading = true
    const params = {
      qkjxmlxbms: [],
      qkjejdws: [],
      zyear: setupState.dataList.year,
      sdate: '',
      edate: '',
      wd: setupState.dataList.select,
      gkbms: [],
      zjsjd_mc: xmxzRef.value.value,
      specialorgid: setupState.specialorgid
    }
    if (typeRef.value.selectList.length > 0) {
      params.qkjxmlxbms = typeRef.value.selectList
    } else {
      params.qkjxmlxbms = typeRef.value.allId
    }
    if (companyRef.value.selectList.length > 0) {
      params.qkjejdws = companyRef.value.selectList
    } else {
      params.qkjejdws = companyRef.value.allId
    }
    if (setupState.dataList.time) {
      params.sdate = setupState.dataList.time[0]
      params.edate = setupState.dataList.time[1]
    }
    params.gkbms = gkbmRef.value.selectList
    baseService.export('/process/process13/export', params).then((res) => {
      setupState.loading = false
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
}
//搜索按钮
function search() {
  if (setupState.dataList.time) {
    loadData()
  } else {
    ElMessage({
      type: 'error',
      message: '请选择往来查询时间'
    })
  }
}
//重置按钮
function reset() {
  companyRef.value.clear()
  typeRef.value.clear()
  setupState.dataList.select = 0
  setupState.dataList.year = new Date().getFullYear().toString()
  gkbmRef.value.clear()
  xmxzRef.value.clear()
  setupState.dataList.time = []
  getTime()
  setupState.example = []
  search()
}
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  setTableHeight()
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
  getTime()
  setupState.loading = true
  userDialogRef.value.getUser(setupState.userId, setupState.userCode)
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
  dataList,
  searchShow,
  example,
  tableHeight,
  topHeight,
  heightNum,
  searchHeight,
  loading,
  userCode,
  userId,
  specialorgid,
  getTime,
  setTableHeight,
  loadData,
  exportData,
  search,
  reset,
  showSearch,
  loadCompany
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
