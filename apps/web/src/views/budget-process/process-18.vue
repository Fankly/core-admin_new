<template>
  <div class="BiddingCT" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目招标信息</h2>
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
              <el-form-item label="计划批次名称：">
                <el-input class="formWidth" v-model="dataList.zzbpcmc" />
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
              <el-form-item label="采购申请号：">
                <copyTextBox class="formWidth" ref="cgsqh"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="需求上报日期：">
                <el-date-picker
                  v-model="dataList.zhzsj"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <projectType class="formWidth" ref="type"></projectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="供应商编码：">
                <copyTextBox class="formWidth" ref="gysbm"></copyTextBox>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="中标日期：">
                <el-date-picker
                  v-model="dataList.zdate"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目包：">
                <el-input class="formWidth" v-model="dataList.xmb" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="供应商名称：">
                <el-input class="formWidth" v-model="dataList.lifnr_name" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="预算年度：">
                <el-date-picker
                  v-model="dataList.nd"
                  value-format="YYYY"
                  format="YYYY"
                  type="year"
                  placeholder="请选择"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
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
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
                <el-button type="primary" :icon="EpSearch" @click="search">查 询 </el-button>
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
      style="width: 100%; margin-top: 20px"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column width="170" prop="pspid" label="项目编码"></el-table-column>
      <el-table-column width="170" prop="post1" label="项目名称"></el-table-column>
      <el-table-column width="170" prop="qkjxmlxmc" label="项目类型"></el-table-column>
      <el-table-column width="160" prop="xmb_name" label="项目包"></el-table-column>
      <el-table-column width="160" prop="zjsjd_mc" label="项目性质"></el-table-column>
      <el-table-column width="170" prop="qkjyjdw" label="一级单位"></el-table-column>
      <el-table-column width="170" prop="qkjejdw" label="二级单位"></el-table-column>
      <el-table-column width="170" prop="qkjgkbm" label="归口部门"></el-table-column>
      <el-table-column width="160" prop="erpjdys" label="年度预算"></el-table-column>
      <el-table-column width="160" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>
      <el-table-column width="160" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>
      <el-table-column width="160" prop="qkjlxrq" label="项目立项时间"></el-table-column>
      <el-table-column width="170" prop="num" align="center" label="序号"></el-table-column>
      <el-table-column width="170" prop="banfn" label="采购申请号"></el-table-column>
      <el-table-column width="170" prop="bnfpo" label="采购申请行项目号"></el-table-column>
      <el-table-column width="170" prop="zblx" label="计划类型"></el-table-column>
      <el-table-column width="170" prop="zzbpc" label="计划批次"></el-table-column>
      <el-table-column width="170" prop="zzbpcmc" label="计划批次名称"></el-table-column>
      <el-table-column width="170" prop="zcjrq" label="采购申请创建日期"></el-table-column>
      <el-table-column width="170" prop="zhzsj" label="需求提报日期"></el-table-column>
      <el-table-column width="170" prop="preis" label="需求上报金额"></el-table-column>
      <el-table-column width="170" prop="lfdat" label="首批交货日期（计划）"></el-table-column>
      <el-table-column width="170" prop="eeind" label="最后一批交货日期（计划）"></el-table-column>
      <el-table-column width="170" prop="zghzq" label="供货周期（计划）（天）"></el-table-column>
      <el-table-column width="170" prop="zdate" label="中标时间"></el-table-column>
      <el-table-column width="170" prop="zhszj" label="中标金额"></el-table-column>
      <el-table-column width="170" prop="lifnr_name" label="供应商名称"></el-table-column>
      <el-table-column width="170" prop="lifnr" label="供应商编码"></el-table-column>
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
    ></el-pagination>
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
import {
  markRaw as markElementIconRaw,
  reactive,
  watch,
  toRef,
  watch as watchLocal,
  onMounted,
  getCurrentInstance,
  useTemplateRef
} from 'vue'
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
  name: '/budget-process/process-18'
})
const componentInstance = getCurrentInstance().proxy
const xmxzRef = useTemplateRef('xmxz')
const xmbmRef = useTemplateRef('xmbm')
const gkbmRef = useTemplateRef('gkbm')
const cgsqhRef = useTemplateRef('cgsqh')
const typeRef = useTemplateRef('type')
const gysbmRef = useTemplateRef('gysbm')
const companyRef = useTemplateRef('company')
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
  //搜索区域显示与隐藏
  dataList: {
    zzbpcmc: '',
    post1: '',
    zhzsj: '',
    zdate: '',
    xmb: '',
    lifnr_name: '',
    nd: ''
  },
  searchShow: true,
  example: [],
  itemCode: [],
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
const dataList = toRef(setupState, 'dataList')
const searchShow = toRef(setupState, 'searchShow')
const example = toRef(setupState, 'example')
const itemCode = toRef(setupState, 'itemCode')
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
    setupState.tableHeight = setupState.heightNum - setupState.topHeight - 100 + 'px'
  } else {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight + setupState.searchHeight - 100 + 'px'
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
  if (columnIndex < 12) {
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
    banfns: [],
    pspids: [],
    zzbpcmc: setupState.dataList.zzbpcmc,
    gkbms: [],
    post1: setupState.dataList.post1,
    zhzsj_begin: '',
    zhzsj_end: '',
    qkjxmlxbms: [],
    lifnrs: [],
    zdate_begin: '',
    zdate_end: '',
    xmb: setupState.dataList.xmb,
    lifnr_name: setupState.dataList.lifnr_name,
    nd: setupState.dataList.nd,
    zjsjd_mc: xmxzRef.value.value,
    qkjejdws: [],
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  //项目编码
  params.pspids = xmbmRef.value.array
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  //采购申请号
  params.banfns = cgsqhRef.value.array
  //需求上报日期
  if (setupState.dataList.zhzsj) {
    params.zhzsj_begin = setupState.dataList.zhzsj[0]
    params.zhzsj_end = setupState.dataList.zhzsj[1]
  }
  //项目类型
  params.qkjxmlxbms = typeRef.value.selectList
  //供应商编码
  params.lifnrs = gysbmRef.value.array
  //中标日期
  if (setupState.dataList.zdate) {
    params.zdate_begin = setupState.dataList.zdate[0]
    params.zdate_end = setupState.dataList.zdate[1]
  }
  //所属单位
  params.qkjejdws = companyRef.value.selectList
  baseService.post('/process/process18/', params).then((res) => {
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
    zzbpcmc: setupState.dataList.zzbpcmc,
    gkbms: [],
    post1: setupState.dataList.post1,
    banfns: [],
    zhzsj_begin: '',
    zhzsj_end: '',
    qkjxmlxbms: [],
    lifnrs: [],
    zdate_begin: '',
    zdate_end: '',
    xmb: setupState.dataList.xmb,
    lifnr_name: setupState.dataList.lifnr_name,
    nd: setupState.dataList.nd,
    zjsjd_mc: xmxzRef.value.value,
    qkjejdws: [],
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  //项目编码
  params.pspids = xmbmRef.value.array
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  //采购申请号
  params.banfns = cgsqhRef.value.selectList
  //需求上报日期
  if (setupState.dataList.zhzsj) {
    params.zhzsj_begin = setupState.dataList.zhzsj[0]
    params.zhzsj_end = setupState.dataList.zhzsj[1]
  }
  //项目类型
  params.qkjxmlxbms = typeRef.value.selectList
  //供应商编码
  params.lifnrs = gysbmRef.value.selectList
  //中标日期
  if (setupState.dataList.zdate) {
    params.zdate_begin = setupState.dataList.zdate[0]
    params.zdate_end = setupState.dataList.zdate[1]
  }
  //所属单位
  params.qkjejdws = companyRef.value.selectList
  baseService.export('/process/process18/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '招投标环节穿透.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
}
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  setTableHeight()
}
//查询按钮
function search() {
  loadData()
}
//重置按钮
function reset() {
  xmbmRef.value.clear()
  setupState.dataList.zzbpcmc = ''
  gkbmRef.value.clear()
  setupState.dataList.post1 = ''
  cgsqhRef.value.clear()
  setupState.dataList.zhzsj = ''
  typeRef.value.clear()
  gysbmRef.value.clear()
  setupState.dataList.zdate = ''
  setupState.dataList.xmb = ''
  setupState.dataList.lifnr_name = ''
  setupState.dataList.nd = ''
  xmxzRef.value.clear()
  companyRef.value.clear()
  setupState.example = []
  loadData()
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
function loadCompany() {
  setupState.loading = false
  setupState.specialorgid = parseInt(userDialogRef.value.specialorgid)
  companyRef.value.getAffiliatedUnit(setupState.specialorgid)
  gkbmRef.value.getProjectType(setupState.specialorgid)
}
watchLocal(
  () => setupState.store.state.ztbData.pspid,
  function (val) {
    if (val) {
      xmbmRef.value.ids = val
      xmbmRef.value.text = val
      xmbmRef.value.array.push(val)
      setupState.specialorgid = JSON.parse(setupState.store.state.ztbData.specialorgid)
      loadData()
      // 清空vuex中的数据
      setupState.store.commit('ztbData', {})
    }
  },
  {}
)
onMounted(() => {
  setupState.topHeight = (document.querySelector('.topBox')?.clientHeight ?? 0)
  setupState.heightNum = (document.querySelector('.ds-workspace__viewport')?.clientHeight ?? window.innerHeight)
  setupState.searchHeight = (document.querySelector('.search')?.clientHeight ?? 0)
  setTableHeight()
  if (setupState.store.state.ztbData.pspid && setupState.store.state.ztbData.specialorgid) {
    xmbmRef.value.ids = setupState.store.state.ztbData.pspid
    xmbmRef.value.text = setupState.store.state.ztbData.pspid
    xmbmRef.value.array.push(setupState.store.state.ztbData.pspid)
    setupState.specialorgid = JSON.parse(setupState.store.state.ztbData.specialorgid)
    loadData()
    // 清空vuex中的数据
    setupState.store.commit('ztbData', {})
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
  dataList,
  searchShow,
  example,
  itemCode,
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
  showSearch,
  search,
  reset,
  pageChangeHandle,
  limitChangeHandle,
  loadCompany
})
</script>

<style lang="less" scoped>
.BiddingCT {
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
