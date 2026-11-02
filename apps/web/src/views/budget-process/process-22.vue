<template>
  <div class="settlementCT" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="title">
      <div class="titleBox">
        <h2>项目结算与资金支付信息</h2>
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

    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="结算信息" name="first">
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
          <el-table-column label="基本信息">
            <el-table-column width="160" prop="pspid" label="项目编号"></el-table-column>
            <el-table-column width="290" prop="post1" label="项目名称"></el-table-column>
            <el-table-column width="160" prop="qkjxmlxmc" label="项目类型"></el-table-column>
            <el-table-column width="160" prop="qkjxmb_mc" label="项目包"></el-table-column>
            <el-table-column width="160" prop="zjsjd_mc" label="项目性质"></el-table-column>
            <el-table-column width="230" prop="qkjyjdw_name" label="一级单位"></el-table-column>
            <el-table-column width="230" prop="qkjejdw_name" label="二级单位"></el-table-column>
            <el-table-column width="160" prop="qkjgkbm_name" label="归口部门"></el-table-column>
            <el-table-column width="160" prop="erpjdys" label="年度预算"></el-table-column>
          </el-table-column>

          <el-table-column label="当年财务支出情况（不含税）">
            <el-table-column width="160" prop="ndzcb_hs" label="小计"></el-table-column>
            <el-table-column width="160" prop="ndzyclf_bhs" label="自营材料费"></el-table-column>
            <el-table-column width="160" prop="ndwbclf_bhs" label="外包材料费"></el-table-column>
            <el-table-column width="160" prop="ndwbjjf_bhs" label="外包检修费"></el-table-column>
            <el-table-column width="160" prop="ndjzgczc_bhs" label="建筑工程支出"></el-table-column>
            <el-table-column width="160" prop="ndazgczc_bhs" label="安装工程支出"></el-table-column>
            <el-table-column width="160" prop="ndsbgzzc_bhs" label="设备购置支出"></el-table-column>
            <el-table-column width="160" prop="ndxmfrglf_bhs" label="项目法人管理费"></el-table-column>
            <el-table-column width="160" prop="qtzc1" label="其他支出"></el-table-column>
          </el-table-column>
          <el-table-column label="累计财务支出情况（不含税）">
            <el-table-column width="160" prop="dncwzc" label="小计"></el-table-column>
            <el-table-column width="160" prop="ljzzclf_bhs" label="自营材料费"></el-table-column>
            <el-table-column width="160" prop="ljwbclf_bhs" label="外包材料费"></el-table-column>
            <el-table-column width="160" prop="ljwbjxf_bhs" label="外包检修费"></el-table-column>
            <el-table-column width="160" prop="ljjzgczc_bhs" label="建筑工程支出"></el-table-column>
            <el-table-column width="160" prop="ljanzgzc_bhs" label="安装工程支出"></el-table-column>
            <el-table-column width="160" prop="ljsbgzzc_bhs" label="设备购置支出"></el-table-column>
            <el-table-column width="160" prop="ljxmfrglf_bhs" label="项目法人管理费"></el-table-column>
            <el-table-column width="160" prop="qtzc2" label="其他支出"></el-table-column>
          </el-table-column>
          <el-table-column label="当年财务支出情况（含税）">
            <el-table-column width="160" prop="ndzc_hs" label="小计"></el-table-column>
            <el-table-column width="160" prop="ndzyclf_hs" label="自营材料费"></el-table-column>
            <el-table-column width="160" prop="ndwbclf_hs" label="外包材料费"></el-table-column>
            <el-table-column width="160" prop="ndwbjxf_hs" label="外包检修费"></el-table-column>
            <el-table-column width="160" prop="ndjzgczc_hs" label="建筑工程支出"></el-table-column>
            <el-table-column width="160" prop="ndazgczc_hs" label="安装工程支出"></el-table-column>
            <el-table-column width="160" prop="ndsbgzzc_hs" label="设备购置支出"></el-table-column>
            <el-table-column width="160" prop="ndxmfrglf_hs" label="项目法人管理费"></el-table-column>
            <el-table-column width="160" prop="qtzc3" label="其他支出"></el-table-column>
          </el-table-column>
          <el-table-column label="累计财务支出情况（含税）">
            <el-table-column width="160" prop="dncwzc2" label="小计"></el-table-column>
            <el-table-column width="160" prop="ljzzclf_hs" label="自营材料费"></el-table-column>
            <el-table-column width="160" prop="ljwbclf_hs" label="外包材料费"></el-table-column>
            <el-table-column width="160" prop="ljwbjxf_hs" label="外包检修费"></el-table-column>
            <el-table-column width="160" prop="ljjzgczc_hs" label="建筑工程支出"></el-table-column>
            <el-table-column width="160" prop="ljangczc_hs" label="安装工程支出"></el-table-column>
            <el-table-column width="160" prop="ljsbgzxc_hs" label="设备购置支出"></el-table-column>
            <el-table-column width="160" prop="ljxmfrglf_hs" label="项目法人管理费"></el-table-column>
            <el-table-column width="160" prop="qtzc4" label="其他支出"></el-table-column>
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
      </el-tab-pane>

      <el-tab-pane label="资金支付信息" name="second">
        <div v-show="searchShow">
          <el-form label-width="110px" label-position="left">
            <el-row :gutter="24">
              <el-col :span="6">
                <el-form-item label="项目编码：">
                  <copyTextBox class="formWidth" ref="xmbm2"></copyTextBox>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="付款申请编号：">
                  <copyTextBox class="formWidth" ref="fksqbh"></copyTextBox>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="所属单位：">
                  <affiliatedUnit class="formWidth" ref="company2"></affiliatedUnit>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="项目名称：">
                  <el-input class="formWidth" v-model="dataList2.post1" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="6">
                <el-form-item label="付款申请日期：">
                  <el-date-picker
                    v-model="dataList2.fksqrq"
                    value-format="YYYYMMDD"
                    format="YYYY-MM-DD"
                    type="daterange"
                    range-separator="至"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="归口部门：">
                  <Centralized class="formWidth" ref="gkbm2"></Centralized>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="项目类型：">
                  <projectType class="formWidth" ref="type2"></projectType>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="银经付凭证号：">
                  <el-input class="formWidth" v-model="dataList2.yqpzh" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="6">
                <el-form-item label="截至日期：">
                  <el-date-picker v-model="dataList2.month" type="month" placeholder="选择月"> </el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="项目性质：">
                  <projectnature class="formWidth" ref="xmxz2"></projectnature>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="凭证日期：">
                  <el-date-picker
                    v-model="dataList2.bldat"
                    value-format="YYYYMMDD"
                    format="YYYY-MM-DD"
                    type="daterange"
                    range-separator="至"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="项目包：">
                  <el-input v-model="dataList2.xmb" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="6"></el-col>
              <el-col :span="6"></el-col>
              <el-col :span="6"></el-col>
              <el-col :span="6" class="btnPostion">
                <el-form-item>
                  <el-button type="primary" :icon="EpSearch" @click="search2">查 询</el-button>
                  <el-button :icon="EpRefreshRight" @click="reset2">重 置</el-button>
                  <el-button type="warning" :icon="EpDownload" @click="exportBtn2">导 出</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <el-table
          border
          :data="example2"
          v-if="tableHeight"
          :height="tableHeight2"
          :span-method="objectSpanMethod1"
          style="width: 100%"
          :header-cell-style="{ 'text-align': 'center' }"
          :cell-style="{ 'text-align': 'center' }"
        >
          <el-table-column label="基本信息">
            <el-table-column width="160" prop="pspid" label="项目编码"></el-table-column>
            <el-table-column width="290" prop="post1" label="项目名称"></el-table-column>
            <el-table-column width="160" prop="qkjxmlxmc" label="项目类型"></el-table-column>
            <el-table-column width="160" prop="qkjxmb_mc" label="项目包"></el-table-column>
            <el-table-column width="160" prop="zjsjd_mc" label="项目性质"></el-table-column>
            <el-table-column width="230" prop="qkjyjdw_name" label="一级单位"></el-table-column>
            <el-table-column width="230" prop="qkjejdw_name" label="二级单位"></el-table-column>
            <el-table-column width="160" prop="qkjgkbm_name" label="归口部门"></el-table-column>
            <el-table-column width="160" prop="erpjdys" label="年度预算"></el-table-column>
            <el-table-column width="160" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>
            <el-table-column width="160" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>
          </el-table-column>
          <el-table-column label="资金支付情况">
            <el-table-column width="160" prop="zfksq" label="付款申请编号"></el-table-column>
            <el-table-column width="160" prop="fksqrq" label="付款申请日期"></el-table-column>
            <el-table-column width="160" prop="lifnr" label="收款单位编码"></el-table-column>
            <el-table-column width="160" prop="lifnr_name" label="收款单位名称"></el-table-column>
            <el-table-column width="160" prop="zhxmzfje" label="支付金额"></el-table-column>
            <el-table-column width="160" prop="yqpzh" label="银经付凭证号"></el-table-column>
            <el-table-column width="160" prop="bldat" label="凭证日期"></el-table-column>
          </el-table-column>
        </el-table>

        <el-pagination
          :current-page="page2.current"
          background
          align="center"
          :page-sizes="[10, 20, 50, 100, 500]"
          :page-size="page2.limit"
          :total="parseInt(page2.total + '')"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="limitChangeHandle2"
          @current-change="pageChangeHandle2"
        >
        </el-pagination>
      </el-tab-pane>
    </el-tabs>

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
  name: '/budget-process/process-22'
})
const componentInstance = getCurrentInstance().proxy
const xmbmRef = useTemplateRef('xmbm')
const xmxzRef = useTemplateRef('xmxz')
const gkbmRef = useTemplateRef('gkbm')
const typeRef = useTemplateRef('type')
const companyRef = useTemplateRef('company')
const xmbm2Ref = useTemplateRef('xmbm2')
const fksqbhRef = useTemplateRef('fksqbh')
const company2Ref = useTemplateRef('company2')
const gkbm2Ref = useTemplateRef('gkbm2')
const type2Ref = useTemplateRef('type2')
const xmxz2Ref = useTemplateRef('xmxz2')
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
    post1: '',
    month: new Date(),
    xmb: ''
  },
  dataList2: {
    post1: '',
    month: new Date(),
    xmb: '',
    fksqrq: '',
    yqpzh: '',
    bldat: ''
  },
  activeName: 'first',
  dataListLoading2: false,
  spanArr: [],
  // 用于存放需要合并的行的个数
  spanIndex: 0,
  // 记录spanArr数组的下标

  spanArr1: [],
  // 用于存放需要合并的行的个数
  spanIndex1: 0,
  // 记录spanArr数组的下标

  example: [],
  page: {
    total: 0,
    limit: 10,
    page: 1,
    current: '1'
  },
  example2: [],
  page2: {
    total: 0,
    limit: 10,
    page: 1,
    current: '1'
  },
  searchShow: true,
  titleHeight: '',
  searchHeight: '',
  heightNum: '',
  tableHeight: '',
  tableHeight2: '',
  loading: false,
  userCode: '',
  userId: '',
  specialorgid: ''
})
const dataList = toRef(setupState, 'dataList')
const dataList2 = toRef(setupState, 'dataList2')
const activeName = toRef(setupState, 'activeName')
const dataListLoading2 = toRef(setupState, 'dataListLoading2')
const spanArr = toRef(setupState, 'spanArr')
const spanIndex = toRef(setupState, 'spanIndex')
const spanArr1 = toRef(setupState, 'spanArr1')
const spanIndex1 = toRef(setupState, 'spanIndex1')
const example = toRef(setupState, 'example')
const page = toRef(setupState, 'page')
const example2 = toRef(setupState, 'example2')
const page2 = toRef(setupState, 'page2')
const searchShow = toRef(setupState, 'searchShow')
const titleHeight = toRef(setupState, 'titleHeight')
const searchHeight = toRef(setupState, 'searchHeight')
const heightNum = toRef(setupState, 'heightNum')
const tableHeight = toRef(setupState, 'tableHeight')
const tableHeight2 = toRef(setupState, 'tableHeight2')
const loading = toRef(setupState, 'loading')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
//结算信息查询按钮
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
//结算信息重置按钮
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
//结算信息获取数据
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
  //所属单位
  params.qkjejdws = companyRef.value.selectList
  baseService.post('/process/process22/tab1/', params).then((res) => {
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
//结算信息导出
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
  //所属单位
  params.qkjejdws = companyRef.value.selectList
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  await baseService.export('/process/process22/export1', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '结算与资金支付环节穿透_结算信息.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
}
function setTableHeight() {
  if (setupState.searchShow == true) {
    setupState.tableHeight = setupState.heightNum - setupState.titleHeight - setupState.searchHeight - 155 + 'px'
  } else {
    setupState.tableHeight = setupState.heightNum - setupState.titleHeight + setupState.searchHeight - 310 + 'px'
  }
}
//资金支付信息查询按钮
function search2() {
  if (setupState.dataList2.month) {
    loadData2()
  } else {
    ElMessage({
      message: '请选择日期查询',
      icon: EpSearch,
      customClass: 'tipsBox'
    })
  }
}
//资金支付信息重置按钮
function reset2() {
  xmbm2Ref.value.clear()
  fksqbhRef.value.clear()
  company2Ref.value.clear()
  setupState.dataList2.post1 = ''
  setupState.dataList2.fksqrq = ''
  gkbm2Ref.value.clear()
  type2Ref.value.clear()
  setupState.dataList2.yqpzh = ''
  setupState.dataList2.month = new Date()
  xmxz2Ref.value.clear()
  setupState.dataList2.bldat = ''
  setupState.dataList2.xmb = ''
  setupState.example2 = []
  search2()
}
//资金支付信息获取数据
function loadData2() {
  setupState.loading = true
  setupState.spanArr1 = [] // 用于存放需要合并的行的个数
  setupState.spanIndex1 = 0 // 记录spanArr数组的下标
  const params = {
    pspids: [],
    zfksqs: [],
    qkjejdws: [],
    post1: setupState.dataList2.post1,
    sfksqrq: '',
    efksqrq: '',
    gkbms: [],
    qkjxmlxbms: [],
    yqpzh: setupState.dataList2.yqpzh,
    zyear: '',
    zmonth: '',
    zjsjd_mc: xmxz2Ref.value.value,
    sbldat: '',
    ebldat: '',
    xmb: setupState.dataList2.xmb,
    page: setupState.page2.page,
    limit: setupState.page2.limit,
    specialorgid: setupState.specialorgid
  }
  //项目编码
  params.pspids = xmbm2Ref.value.array
  //付款申请编码
  params.zfksqs = fksqbhRef.value.array
  //所属单位
  params.qkjejdws = company2Ref.value.selectList
  //付款申请日期
  if (setupState.dataList2.fksqrq) {
    params.sfksqrq = setupState.dataList2.fksqrq[0]
    params.efksqrq = setupState.dataList2.fksqrq[1]
  }
  //归口部门
  params.gkbms = gkbm2Ref.value.selectList
  //项目类型
  params.qkjxmlxbms = type2Ref.value.selectList
  //截至日期
  if (setupState.dataList2.month != '') {
    let time = new Date(setupState.dataList2.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  //凭证日期
  if (setupState.dataList2.bldat) {
    params.sbldat = setupState.dataList2.bldat[0]
    params.ebldat = setupState.dataList2.bldat[1]
  }
  baseService.post('/process/process22/tab2/', params).then((res) => {
    if (res.success == true) {
      setupState.loading = false
      setupState.example2 = res.data.list
      setupState.page2.total = res.data.total
      getSpanArr(res.data)
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
//资金支付信息导出
async function exportBtn2() {
  setupState.loading = true
  const params = {
    pspids: [],
    zfksqs: [],
    qkjejdws: [],
    post1: setupState.dataList2.post1,
    sfksqrq: '',
    efksqrq: '',
    gkbms: [],
    qkjxmlxbms: [],
    yqpzh: setupState.dataList2.yqpzh,
    zyear: '',
    zmonth: '',
    zjsjd_mc: xmxz2Ref.value.value,
    sbldat: '',
    ebldat: '',
    xmb: setupState.dataList2.xmb,
    page: setupState.page2.page,
    limit: setupState.page2.limit,
    specialorgid: setupState.specialorgid
  }
  //项目编码
  params.pspids = xmbm2Ref.value.array
  //付款申请编码
  params.zfksqs = fksqbhRef.value.array
  //所属单位
  params.qkjejdws = company2Ref.value.selectList
  //付款申请日期
  if (setupState.dataList2.fksqrq) {
    params.sfksqrq = setupState.dataList2.fksqrq[0]
    params.efksqrq = setupState.dataList2.fksqrq[1]
  }
  //归口部门
  params.gkbms = gkbm2Ref.value.selectList
  //项目类型
  params.qkjxmlxbms = type2Ref.value.selectList
  //截至日期
  if (setupState.dataList2.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  //凭证日期
  if (setupState.dataList2.bldat) {
    params.sbldat = setupState.dataList2.bldat[0]
    params.ebldat = setupState.dataList2.bldat[1]
  }
  await baseService.export('/process/process22/export2', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '结算与资金支付环节穿透_资金支付信息.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
}
function setTableHeight2() {
  if (setupState.searchShow == true) {
    setupState.tableHeight2 = setupState.heightNum - setupState.titleHeight - setupState.searchHeight - 255 + 'px'
  } else {
    setupState.tableHeight2 = setupState.heightNum - setupState.titleHeight + setupState.searchHeight - 310 + 'px'
  }
}
function handleClick() {
  if (setupState.activeName == 'second') {
    type2Ref.value.getProjectType(setupState.specialorgid)
    company2Ref.value.getAffiliatedUnit(setupState.specialorgid)
    gkbm2Ref.value.getProjectType(setupState.specialorgid)
  }
}
function getSpanArr(data) {
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      setupState.spanArr.push(1)
      setupState.spanIndex = 0
      setupState.spanArr1.push(1)
      setupState.spanIndex1 = 0
    } else {
      if (data[i].pspid === data[i - 1].pspid) {
        setupState.spanArr1[setupState.spanIndex1] += 1
        setupState.spanArr1.push(0)
      } else {
        setupState.spanArr1.push(1)
        setupState.spanIndex1 = i
      }
    }
  }
}
// 分页控件当前页修改事件
function pageChangeHandle2(currentPageNum) {
  setupState.page2.page = currentPageNum
  loadData2()
}
// 分页控件请求数量修改事件
function limitChangeHandle2(currentLimitNum) {
  setupState.page2.limit = currentLimitNum
  loadData2()
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
// objectSpanMethod1({ row, column, rowIndex, columnIndex }) {},
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  setTableHeight()
  setTableHeight2()
}
function loadCompany() {
  setupState.loading = false
  setupState.specialorgid = parseInt(userDialogRef.value.specialorgid)
  companyRef.value.getAffiliatedUnit(setupState.specialorgid)
  company2Ref.value.getAffiliatedUnit(setupState.specialorgid)
  gkbmRef.value.getProjectType(setupState.specialorgid)
  gkbm2Ref.value.getProjectType(setupState.specialorgid)
}
watch(
  () => setupState.store.state.jsyzjzfData.pspid,
  function (val) {
    if (val) {
      xmbmRef.value.ids = val
      xmbmRef.value.text = val
      xmbmRef.value.array.push(val)
      setupState.specialorgid = JSON.parse(setupState.store.state.jsyzjzfData.specialorgid)
      loadData()
      // 清空vuex中的数据
      setupState.store.commit('jsyzjzfData', {})
    }
  },
  {}
)
watch(() => componentInstance.deep, true)
onMounted(() => {
  setupState.titleHeight = document.querySelector('.title').clientHeight
  setupState.searchHeight = document.querySelector('.search').clientHeight
  setupState.heightNum = document.querySelector('.el-card').clientHeight
  setTableHeight()
  setTableHeight2()
  if (setupState.store.state.jsyzjzfData.pspid && setupState.store.state.jsyzjzfData.specialorgid) {
    xmbmRef.value.ids = setupState.store.state.jsyzjzfData.pspid
    xmbmRef.value.text = setupState.store.state.jsyzjzfData.pspid
    xmbmRef.value.array.push(setupState.store.state.jsyzjzfData.pspid)
    setupState.specialorgid = JSON.parse(setupState.store.state.jsyzjzfData.specialorgid)
    loadData()
    // 清空vuex中的数据
    setupState.store.commit('jsyzjzfData', {})
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
  dataList,
  dataList2,
  activeName,
  dataListLoading2,
  spanArr,
  spanIndex,
  spanArr1,
  spanIndex1,
  example,
  page,
  example2,
  page2,
  searchShow,
  titleHeight,
  searchHeight,
  heightNum,
  tableHeight,
  tableHeight2,
  loading,
  userCode,
  userId,
  specialorgid,
  search,
  reset,
  loadData,
  exportBtn,
  setTableHeight,
  search2,
  reset2,
  loadData2,
  exportBtn2,
  setTableHeight2,
  handleClick,
  getSpanArr,
  pageChangeHandle2,
  limitChangeHandle2,
  pageChangeHandle,
  limitChangeHandle,
  showSearch,
  loadCompany
})
</script>

<style lang="less" scoped>
.settlementCT {
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
