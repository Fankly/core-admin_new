<template>
  <div class="accounts31" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>决算与增资稽核</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon style="font-size: 18px" class="ep-icon-s-operation">
                <EpArrowDown />
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
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column prop="pspid" fixed label="项目编号" width="150">
        <template #default="scope">
          <el-dropdown>
            <span class="el-dropdown-link">
              <a style="cursor: pointer">{{ scope.row.pspid }}</a>
              <el-icon class="ep-icon-arrow-down"><EpArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goTable(item.value, scope.row.pspid)" v-for="(item, index) in tables" :key="index">{{
                  item.label
                }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
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
        <el-table-column width="160" v-if="columnObj.jsjsx" prop="jh_jusssjsxsl" label="决算及时性异常（个）"> </el-table-column>
        <el-table-column width="160" v-if="columnObj.zgzjsx" label="暂估转及时性异常（个）">
          <template #default="scope">
            <div v-if="scope.row.jh_zgzzjsx == 0">1</div>
            <div v-else>{{ scope.row.jh_zgzzjsx }}</div>
          </template>
        </el-table-column>

        <el-table-column width="160" label="正式转资及时性异常（个）" v-if="columnObj.zszjsx">
          <template #default="scope">
            <div v-if="scope.row.jh_zszzjsx == 0">1</div>
            <div v-else>{{ scope.row.jh_zszzjsx }}</div>
          </template>
        </el-table-column>

        <el-table-column width="160" label="暂估增资合理性异常（个）" v-if="columnObj.zgzzhlx">
          <template #default="scope">
            <div v-if="scope.row.jh_zgzzhlx == 0">1</div>
            <div v-else>{{ scope.row.jh_zgzzhlx }}</div>
          </template>
        </el-table-column>

        <el-table-column width="160" label="在建工程余额异常（个）" v-if="columnObj.zjgcye">
          <template #default="scope">
            <div v-if="scope.row.jh_zjgcfs < 0">1</div>
            <div v-else>{{ scope.row.jh_zjgcfs }}</div>
          </template>
        </el-table-column>
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
import { markRaw as markElementIconRaw, reactive, toRef, onMounted, useTemplateRef } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import copyTextBox from '@/components/select/copyTextBox.vue'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import userDialog from '@/components/select/userDialog.vue'
import Centralized from '@/components/select/Centralized.vue'
import { useStore } from '@/store/business'
import { showHelpMsg } from '@/utils/message'
import { useRouter } from 'vue-router'
defineOptions({
  name: '/budget-process/process-31'
})
const router = useRouter()
const userDialogRef = useTemplateRef('userDialogInstance')
const companyRef = useTemplateRef('company')
const gkbmRef = useTemplateRef('gkbm')
const xmbmRef = useTemplateRef('xmbm')
const typeRef = useTemplateRef('type')
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
  tables: [
    {
      label: '决算及时性',
      value: './process-31-1'
    },
    {
      label: '暂估转资及时性',
      value: './process-31-2'
    },
    {
      label: '正式转资及时性',
      value: './process-31-3'
    },
    {
      label: '暂估增资合理性',
      value: './process-31-4'
    }
  ],
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
    current: 1
  },
  tableHeight: '',
  topHeight: '',
  heightNum: '',
  searchHeight: '',
  searchShow: true,
  segment: [
    {
      value: 'jsjsx',
      label: '决算及时性异常',
      checked: true
    },
    {
      value: 'zgzjsx',
      label: '暂估转及时性异常',
      checked: true
    },
    {
      value: 'zszjsx',
      label: '正式转资及时性异常',
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
    }
  ],
  segmentIds: [],
  columnObj: {},
  loading: false,
  userCode: '',
  userId: '',
  specialorgid: ''
})
const tables = toRef(setupState, 'tables')
const example = toRef(setupState, 'example')
const dataList = toRef(setupState, 'dataList')
const page = toRef(setupState, 'page')
const tableHeight = toRef(setupState, 'tableHeight')
const topHeight = toRef(setupState, 'topHeight')
const heightNum = toRef(setupState, 'heightNum')
const searchHeight = toRef(setupState, 'searchHeight')
const searchShow = toRef(setupState, 'searchShow')
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
//处理环节数据
function handleColumn() {
  setupState.segment.forEach((item) => {
    setupState.segmentIds.push(item.value)
    setupState.columnObj[item.value] = item.checked
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
function loadData() {
  setupState.loading = true
  const params = {
    pspids: [],
    post1: setupState.dataList.name,
    qkjxmlxbms: [],
    qkjejdws: [],
    zyear: '',
    zmonth: '',
    qkjxmb: setupState.dataList.xmb,
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
  baseService.post('/process/process31/', params).then((res) => {
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
    qkjxmb: setupState.dataList.xmb,
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
  await baseService.export('/process/process31/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '决算与增资稽核.xlsx'
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
  setupState.dataList.name = ''
  setupState.dataList.month = new Date()
  setupState.dataList.xmb = ''
  typeRef.value.clear()
  companyRef.value.clear()
  xmbmRef.value.clear()
  gkbmRef.value.clear()
  setupState.example = []
  loadData()
}
function goTable(path, pspid) {
  let params = {
    zyear: '',
    zmonth: ''
  }
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  router.push({
    path: path,
    query: {
      pspid: pspid,
      specialorgid: setupState.specialorgid,
      zyear: params.zyear,
      zmonth: params.zmonth
    }
  })
}
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  thi.setTableHeight()
}
onMounted(() => {
  setupState.topHeight = (document.querySelector('.topBox')?.clientHeight ?? 0)
  setupState.heightNum = (document.querySelector('.ds-workspace__viewport')?.clientHeight ?? window.innerHeight)
  setupState.searchHeight = (document.querySelector('.search')?.clientHeight ?? 0)
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
  tables,
  example,
  dataList,
  page,
  tableHeight,
  topHeight,
  heightNum,
  searchHeight,
  searchShow,
  segment,
  segmentIds,
  columnObj,
  loading,
  userCode,
  userId,
  specialorgid,
  setTableHeight,
  handleColumn,
  listShow,
  loadCompany,
  loadData,
  exportBtn,
  pageChangeHandle,
  limitChangeHandle,
  search,
  reset,
  goTable,
  showSearch
})
</script>

<style lang="less" scoped>
.accounts31 {
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
