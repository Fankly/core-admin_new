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
              <el-button type="primary" :icon="EpSearch" @click="loadData"> 查询</el-button>
              <el-button :icon="EpRefreshRight" @click="reset">重 置</el-button>
              <el-button type="warning" :icon="EpDownload" @click="exportBtn">导 出</el-button>
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
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from '@/store/business'
import { ElMessage } from 'element-plus'
import copyTextBox from '@/components/select/copyTextBox.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import allProjectType from '@/components/select/allProjectType.vue'
import Centralized from '@/components/select/Centralized.vue'
import threeLevel from '@/components/select/threeLevel.vue'
import ssBm from '@/components/select/ssBm.vue'
import { showHelpMsg } from '@/utils/message'
defineOptions({
  name: '/budget-process/process-35'
})
const userDialogRef = useTemplateRef('userDialog')
const companyRef = useTemplateRef('company')
const gkbmRef = useTemplateRef('gkbm')
const xmbmRef = useTemplateRef('xmbm')
const typeRef = useTemplateRef('type')
const ssbmRef = useTemplateRef('ssbm')
const sjflRef = useTemplateRef('sjfl')
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
const loading = toRef(setupState, 'loading')
const searchShow = toRef(setupState, 'searchShow')
const tableHeight = toRef(setupState, 'tableHeight')
const topHeight = toRef(setupState, 'topHeight')
const heightNum = toRef(setupState, 'heightNum')
const searchHeight = toRef(setupState, 'searchHeight')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
const example = toRef(setupState, 'example')
const columnObj = toRef(setupState, 'columnObj')
const segmentIds = toRef(setupState, 'segmentIds')
const segment = toRef(setupState, 'segment')
const dataList = toRef(setupState, 'dataList')
const page = toRef(setupState, 'page')
const projects = toRef(setupState, 'projects')
const value = toRef(setupState, 'value')
//计算表格高度
function setTableHeight() {
  if (setupState.searchShow == true) {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight - 80 + 'px'
  } else {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight + setupState.searchHeight - 80 + 'px'
  }
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
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid,
    pspids: [],
    post1: setupState.dataList.post1,
    qkjejdws: [],
    qkjxmlxbms: [],
    gkbms: [],
    ssbms: [],
    sjfls: [],
    xmjdzt: setupState.value,
    zyear: '',
    zmonth: ''
  }
  //项目编码
  params.pspids = xmbmRef.value.array
  //所属单位
  params.qkjejdws = companyRef.value.selectList
  //项目类型
  params.qkjxmlxbms = typeRef.value.selectList
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  //实施部门
  params.ssbms = ssbmRef.value.list
  //三级分类
  params.sjfls = sjflRef.value.list
  //年月
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  baseService.post('/process33/', params).then((res) => {
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
async function exportBtn() {
  setupState.loading = true
  const params = {
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid,
    pspids: [],
    post1: setupState.dataList.post1,
    qkjejdws: [],
    qkjxmlxbms: [],
    gkbms: [],
    ssbms: [],
    sjfls: [],
    xmjdzt: setupState.value,
    zyear: '',
    zmonth: ''
  }
  //项目编码
  params.pspids = xmbmRef.value.array
  //所属单位
  params.qkjejdws = companyRef.value.selectList
  //项目类型
  params.qkjxmlxbms = typeRef.value.selectList
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  //实施部门
  params.ssbms = ssbmRef.value.list
  //三级分类
  params.sjfls = sjflRef.value.list
  //年月
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  await baseService.export('/process33/export', params).then((res) => {
    setupState.loading = false
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
function reset() {
  xmbmRef.value.clear()
  setupState.dataList.post1 = ''
  typeRef.value.clear()
  companyRef.value.clear()
  gkbmRef.value.clear()
  ssbmRef.value.clear()
  sjflRef.value.clear()
  setupState.value = ''
  setupState.dataList.month = new Date()
  setupState.example = []
  loadData()
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
  loading,
  searchShow,
  tableHeight,
  topHeight,
  heightNum,
  searchHeight,
  userCode,
  userId,
  specialorgid,
  example,
  columnObj,
  segmentIds,
  segment,
  dataList,
  page,
  projects,
  value,
  setTableHeight,
  showSearch,
  handleColumn,
  listShow,
  loadCompany,
  loadData,
  exportBtn,
  pageChangeHandle,
  limitChangeHandle,
  reset
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
