<template>
  <div class="quaBroDetail" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>预算全过程规范性监控明细</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon class="ep-icon-s-operation" style="font-size: 18px">
                <EpArrowDown />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in applications" :key="item.value">
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
            <el-icon class="ep-icon-question" style="font-size: 18px" @click="helpHandle"><EpQuestionFilled /></el-icon>
          </span>
        </div>
      </div>
      <div class="search" v-show="searchShow">
        <el-form label-position="left" label-width="100px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目编码：">
                <copyTextBox class="formWidth" ref="xmbm"></copyTextBox>
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
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <el-input class="formWidth" v-model="dataList.post1" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目状态：">
                <Projectstatus class="formWidth" ref="xmzt"></Projectstatus>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目包名称：">
                <el-input class="formWidth" v-model="dataList.xmb" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目性质：">
                <projectnature class="formWidth" ref="xmxz"></projectnature>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="截止日期：">
                <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"> </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="不规范项：">
                <el-select class="formWidth" v-model="dataList.zbxLists" multiple collapse-tags clearable filterable placeholder="请选择">
                  <el-option v-for="item in zbxOptions" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="监控规则：">
                <el-switch v-model="remarks" active-text="开" inactive-text="关" @change="remarksbtn" />
              </el-form-item>
            </el-col>
            <el-col :span="6" class="btnPostion">
              <el-button type="primary" :icon="EpSearch" @click="search">查 询</el-button>
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
      :data="example"
      v-if="tableHeight"
      :height="tableHeight"
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column width="160px" label="项目编码" fixed>
        <template #default="scope">
          <span v-if="scope.row.pspids == 3">{{ scope.row.pspid }}</span>
          <el-dropdown v-else>
            <span class="el-dropdown-link">
              <a>{{ scope.row.pspid }}</a>
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
      <el-table-column width="280px" fixed prop="post1" label="项目名称"></el-table-column>
      <el-table-column width="160px" prop="zxmzt" label="项目状态"></el-table-column>
      <el-table-column width="160px" prop="qkjxmlxmc" label="项目类型" v-if="columnObj.QKJXMLXMC"></el-table-column>
      <el-table-column width="160px" prop="qkjxmb_mc" label="项目包" v-if="columnObj.QKJXMB_MC"></el-table-column>
      <el-table-column width="160px" prop="zjsjd_mc" label="项目性质"></el-table-column>
      <el-table-column width="240px" prop="qkjyjdw_name" label="一级单位" v-if="columnObj.QKJYJDW_NAME"></el-table-column>
      <el-table-column width="240px" prop="qkjejdw_name" label="二级单位" v-if="columnObj.QKJEJDW_NAME"></el-table-column>
      <el-table-column width="160px" prop="qkjgkbm_name" label="归口部门" v-if="columnObj.QKJGKBM_NAME"></el-table-column>
      <el-table-column width="160px" prop="erpjdys" label="年度预算" v-if="columnObj.ERPJDYS"></el-table-column>
      <el-table-column width="160px" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>
      <el-table-column width="160px" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>

      <el-table-column label="招投标" v-if="columnObj.ztb">
        <el-table-column width="160px" label="招投标差额" prop="jh_ztbcylz"></el-table-column>
      </el-table-column>

      <el-table-column label="合同签订" v-if="columnObj.htqd">
        <el-table-column width="160px" label="合同签订规范性" prop="jh_htqdgfxz"></el-table-column>
        <el-table-column width="160px" label="合同履约规范性" prop="jh_htlygfxz"></el-table-column>
      </el-table-column>

      <el-table-column label="项目实施" v-if="columnObj.xmss">
        <el-table-column label="物资领用">
          <el-table-column width="160px" label="物资整领整退" prop="jh_wzzlztbsz"></el-table-column>
          <el-table-column width="160px" label="物资退库率(%)" prop="jh_wztklz"> </el-table-column>
          <el-table-column width="160px" label="物资超欠供差额" prop="jh_wzcqgcez"></el-table-column>
        </el-table-column>
        <el-table-column label="预算调整">
          <el-table-column width="160px" label="预算调整金额" prop="erpndysbd"></el-table-column>
          <el-table-column width="160px" label="预算调整次数" prop="erpndysbdcs"></el-table-column>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目审计" v-if="columnObj.xmsj">
        <el-table-column width="160px" label="审计核减金额" prop="xmsj"></el-table-column>
      </el-table-column>

      <el-table-column label="结算与资金支付" v-if="columnObj.jsyzjzf">
        <el-table-column width="160px" label="服务入账规范性" prop="sbfwqrpje"></el-table-column>
        <el-table-column width="160px" label="资金支付规范性" prop="jh_htzfgfx_sl"></el-table-column>
        <el-table-column width="160px" label="收款单位一致性" prop="jh_skdwyzx_sl"></el-table-column>
      </el-table-column>

      <el-table-column label="决算与增资" v-if="columnObj.jsyzz">
        <el-table-column width="160px" label="暂估增资合理性" prop="jh_zgzzhlxz"></el-table-column>
        <el-table-column width="160px" label="在建工程余额" prop="zjgcye"></el-table-column>
      </el-table-column>

      <el-table-column label="项目关闭" v-if="columnObj.xmgb">
        <el-table-column width="160px" label="项目状态" prop="stat"></el-table-column>
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
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import Centralized from '@/components/select/Centralized.vue'
import projectnature from '@/components/select/projectnature.vue'
import Projectstatus from '@/components/select/Projectstatus.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from '@/store/business'
import { showHelpMsg } from '@/utils/message'
import { getPublicData } from '@/api/common'
import { useRoute, useRouter } from 'vue-router'
defineOptions({
  name: '/budget-process/process-06'
})
const route = useRoute()
const router = useRouter()
const xmxzRef = useTemplateRef('xmxz')
const xmztRef = useTemplateRef('xmzt')
const typeRef = useTemplateRef('type')
const companyRef = useTemplateRef('company')
const gkbmRef = useTemplateRef('gkbm')
const xmbmRef = useTemplateRef('xmbm')
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
  helpHandle,
  store,
  dataList: {
    month: new Date(),
    post1: '',
    xmb: '',
    zbxLists: []
  },
  //搜索区域显示与隐藏
  searchShow: true,
  tableHeight: '',
  topHeight: '',
  heightNum: '',
  searchHeight: '',
  //穿透数据
  tables: [
    {
      label: '招投标环节',
      value: '/budget-process/process-18'
    },
    {
      label: '合同签订环节',
      value: '/budget-process/process-19'
    },
    {
      label: '项目实施环节',
      value: '/budget-process/process-20'
    },
    {
      label: '项目审计环节',
      value: '/budget-process/process-21'
    },
    {
      label: '结算与资金支付环节',
      value: '/budget-process/process-22'
    },
    {
      label: '决算与增资环节',
      value: '/budget-process/process-23'
    }
  ],
  //表格备足开关
  remarks: false,
  example: [],
  zbxOptions: [],
  //控制表格列显示与隐藏
  columnObj: {},
  //列设置默认展示字段
  //默认所有
  applicationId: [],
  //列菜单数据
  applications: [
    {
      value: 'QKJXMLXMC',
      label: '项目类型',
      checked: true
    },
    {
      value: 'QKJXMB_MC',
      label: '项目包',
      checked: true
    },
    {
      value: 'QKJYJDW_NAME',
      label: '一级单位',
      checked: true
    },
    {
      value: 'QKJEJDW_NAME',
      label: '二级单位',
      checked: true
    },
    {
      value: 'QKJGKBM_NAME',
      label: '部门',
      checked: true
    },
    {
      value: 'ERPJDYS',
      label: '年度预算',
      checked: true
    },
    {
      value: 'NDZCB_HS',
      label: '当年财务支出',
      checked: true
    },
    {
      value: 'ztb',
      label: '招投标',
      checked: true
    },
    {
      value: 'htqd',
      label: '合同签订',
      checked: true
    },
    {
      value: 'xmss',
      label: '项目实施',
      checked: true
    },
    {
      value: 'xmsj',
      label: '项目审计',
      checked: true
    },
    {
      value: 'jsyzjzf',
      label: '结算与资金支付',
      checked: true
    },
    {
      value: 'jsyzz',
      label: '决算与增资',
      checked: true
    },
    {
      value: 'xmgb',
      label: '项目关闭',
      checked: true
    }
  ],
  page: {
    total: 0,
    limit: 10,
    page: 1,
    current: 1
  },
  loading: false,
  userCode: '',
  userId: '',
  specialorgid: '',
  pendingPenetration: null
})
const dataList = toRef(setupState, 'dataList')
const searchShow = toRef(setupState, 'searchShow')
const tableHeight = toRef(setupState, 'tableHeight')
const topHeight = toRef(setupState, 'topHeight')
const heightNum = toRef(setupState, 'heightNum')
const searchHeight = toRef(setupState, 'searchHeight')
const tables = toRef(setupState, 'tables')
const remarks = toRef(setupState, 'remarks')
const example = toRef(setupState, 'example')
const zbxOptions = toRef(setupState, 'zbxOptions')
const columnObj = toRef(setupState, 'columnObj')
const applicationId = toRef(setupState, 'applicationId')
const applications = toRef(setupState, 'applications')
const page = toRef(setupState, 'page')
const loading = toRef(setupState, 'loading')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
const pendingPenetration = toRef(setupState, 'pendingPenetration')
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
    qkjxmlxbms: [],
    qkjejdws: [],
    pspids: [],
    zyear: '',
    zmonth: '',
    page: setupState.page.page,
    limit: setupState.page.limit,
    post1: setupState.dataList.post1,
    zjsjd_mc: xmxzRef.value.value,
    gkbms: [],
    xmb: setupState.dataList.xmb,
    zxmzt: xmztRef.value.value,
    specialorgid: setupState.specialorgid,
    zbxLists: setupState.dataList.zbxLists
  }
  params.qkjxmlxbms = typeRef.value.selectList
  params.qkjejdws = companyRef.value.selectList
  params.gkbms = gkbmRef.value.selectList
  //项目编码
  if (xmbmRef.value) {
    params.pspids = xmbmRef.value.array
  }
  if (setupState.dataList.month != '') {
    let time = new Date(setupState.dataList.month)
    let zyear = time.getFullYear()
    let zmonth = time.getMonth() + 1
    params.zyear = JSON.stringify(zyear)
    params.zmonth = JSON.stringify(zmonth)
  }
  if (setupState.dataList.month) {
    if (setupState.remarks == false) {
      baseService.post('/process/process06/', params).then((res) => {
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
    } else {
      setupState.example = []
      remarksbtn()
      baseService.post('/process/process06/', params).then((res) => {
        if (res.success == true) {
          setupState.loading = false
          res.data.records.forEach((item) => {
            setupState.example.push(item)
          })
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
  } else {
    setupState.loading = false
    ElMessage({
      message: '请选择日期查询',
      icon: EpSearch,
      customClass: 'tipsBox'
    })
  }
}
//导出按钮
async function exportBtn() {
  setupState.loading = true
  if (setupState.dataList.month) {
    const params = {
      qkjxmlxbms: [],
      qkjejdws: [],
      pspids: [],
      zyear: '',
      zmonth: '',
      page: setupState.page.page,
      limit: setupState.page.limit,
      post1: setupState.dataList.post1,
      zjsjd_mc: xmxzRef.value.value,
      gkbms: [],
      xmb: setupState.dataList.xmb,
      zxmzt: xmztRef.value.value,
      specialorgid: setupState.specialorgid,
      zbxLists: setupState.dataList.zbxLists
    }
    params.qkjxmlxbms = typeRef.value.selectList
    params.qkjejdws = companyRef.value.selectList
    params.gkbms = gkbmRef.value.selectList
    //项目编码
    if (xmbmRef.value) {
      params.pspids = xmbmRef.value.array
    }
    if (setupState.dataList.month != '') {
      let time = new Date(setupState.dataList.month)
      let zyear = time.getFullYear()
      let zmonth = time.getMonth() + 1
      params.zyear = JSON.stringify(zyear)
      params.zmonth = JSON.stringify(zmonth)
    }
    await baseService.export('/process/process06/export', params).then((res) => {
      setupState.loading = false
      const blob = res
      let dom = document.createElement('a')
      let url = window.URL.createObjectURL(blob)
      dom.href = url
      dom.download = '预算全过程规范性监控明细.xlsx'
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
    })
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
//搜索按钮
function search() {
  loadData()
}
//重置按钮
function reset() {
  setupState.dataList.month = new Date()
  setupState.remarks = false
  typeRef.value.clear()
  companyRef.value.clear()
  setupState.dataList.post1 = ''
  setupState.dataList.xmb = ''
  setupState.dataList.zbxLists = []
  gkbmRef.value.clear()
  xmxzRef.value.clear()
  xmztRef.value.clear()
  xmbmRef.value.clear()
  setupState.example = []
  loadData()
}
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  setTableHeight()
}
//处理列数据
function handleColumn() {
  setupState.applications.forEach((item) => {
    setupState.applicationId.push(item.value)
    setupState.columnObj[item.value] = item.checked
  })
}
function listShow(value, checked) {
  for (let i in setupState.columnObj) {
    if (i == value) {
      setupState.columnObj[i] = checked
    }
  }
}
function getPenetrationQuery() {
  const query = route.query
  if (!query || query.id == undefined) {
    return null
  }
  const id = Array.isArray(query.id) ? query.id[0] : query.id
  const zbx = Array.isArray(query.zbx) ? query.zbx[0] : query.zbx
  const wd = Array.isArray(query.wd) ? query.wd[0] : query.wd
  const specialorgid = Array.isArray(query.specialorgid) ? query.specialorgid[0] : query.specialorgid
  if (!id || !zbx) {
    return null
  }
  return {
    id,
    zbx,
    wd: wd == undefined ? '0' : String(wd),
    specialorgid
  }
}
async function applyPenetrationQuery() {
  const penetration = setupState.pendingPenetration
  if (!penetration) {
    return
  }
  if (penetration.wd === '1') {
    await typeRef.value.setCheckedById(penetration.id)
  } else {
    await companyRef.value.setCheckedByCode(penetration.id)
  }
  setupState.dataList.zbxLists = [penetration.zbx]
  setupState.pendingPenetration = null
  loadData()
}
//表格备注开关
function remarksbtn() {
  if (setupState.remarks) {
    let calculation = {
      pspid: '稽核规则（计算公式）',
      jh_ztbcylz: '招投标差异率=（招标金额-中标金额）/招标金额，统计差异率超10%的招标金额与中标金额差额绝对值的合计数',
      jh_htqdgfxz: '合同签订规范性=服务入账日期-对应服务合同签订日期，统计<0天的入账金额合计数；仅指服务合同',
      jh_htlygfxz: '合同履约规范性=财务支出（含税）-对应合同金额，统计>0万元，差额合计值；仅指项目化物资和服务',
      jh_wzlygfxz: '物资领用规范性=首批物资领用日期-首笔服务确认日期；指标值>0天的物资领用金额合计数',
      jh_wzzlztbsz: '物资整领整退：通过项目定义+物资唯一码，汇总出库、退库数量，如果数量相等，则为整出整退。',
      jh_wztklz: '物资退库率=物资累计退库金额/（物资累计领用金额+物资累计退库金额）',
      jh_wzcqgcez: '物资超欠供差额=审定结果材料费-入账材料费（含税领料金额）；同一项目多次送审的，取合计数',
      erpndysbd: '预算调整率=（当前预算金额-年初预算下达金额）/年初预算下达金额；',
      erpndysbdcs: '当年预算调整次数 ',
      xmsj: '审计核减率=（累计送审金额-累计审定金额）/累计送审金额；同一项目多次送审，取合计数',
      sbfwqrpje: '首笔服务入账合理性=实际开工日期-首笔服务类财务支出日期',
      jh_htzfgfx_sl: '资金支付规范性=资金支付金额-对应合同金额，涉及多个合同的，统计合计值；仅项目服务',
      jh_skdwyzx_sl: '合同供应商=实际收款单位，统计不一致支付金额合计值',
      jh_zgzzhlxz: '暂估增资合理性=设备购置支出-累计暂估增资金额',
      zjgcye: '在建工程余额 ',
      stat: '根据前7个环节，判断是否展示此项目：前7个环节都规范，不展示',
      pspids: '3',
      jh_ztbcyl: '3',
      jh_htqdgfx: '3',
      jh_htlygfx: '3',
      jh_wzlygfx: '3',
      jh_wzlygfx: '3',
      JH_WZTKL: '3',
      jh_wzcqgce: '3',
      jh_ndystzl: '3',
      jh_ndystzcs: '3',
      jh_sjhjl: '3',
      jh_sbfwrzhlx: '3',
      jh_zjzfje: '3',
      jh_skdwyzx: '3',
      jh_zgzzhlx: '3',
      jh_zjgcfs: '3',
      STAT: '3'
    }
    let judge = {
      pspid: '判断标准',
      JH_LXGFX: '根据智能审核结果判断，不规范数量',
      jh_ztbcylz: '差异率绝对值≥10%',
      jh_htqdgfxz: '<0天',
      jh_htlygfxz: '>0万元',
      jh_wzlygfxz: '>0天',
      jh_wzzlztbsz: '出库=退库',
      jh_wztklz: '退库率≥20%（暂定）',
      jh_wzcqgcez: '≠0',
      erpndysbd: '预算调整率绝对值≥15%（暂定）',
      erpndysbdcs: '>3次（暂定） ',
      xmsj: '≥10%（暂定）',
      sbfwqrpje: '>0天',
      jh_htzfgfx_sl: '>0万元',
      jh_skdwyzx_sl: '不一致',
      jh_zgzzhlxz: '>0万元',
      zjgcye: '<0万元 ',
      stat: '',
      pspids: '3',
      jh_lxgfx: '3',
      jh_ztbcyl: '3',
      jh_htqdgfx: '3',
      jh_htlygfx: '3',
      jh_wzlygfx: '3',
      jh_wzlygfx: '3',
      JH_WZTKL: '3',
      jh_wzcqgce: '3',
      jh_ndystzl: '3',
      jh_ndystzcs: '3',
      jh_sjhjl: '3',
      jh_sbfwrzhlx: '3',
      jh_zjzfje: '3',
      jh_skdwyzx: '3',
      jh_zgzzhlx: '3',
      jh_zjgcfs: '3',
      STAT: '3'
    }
    let exhibition = {
      pspid: '展示内容',
      JH_LXGFX: '展示不规范点的数量',
      jh_ztbcylz: '展示差额绝对值合计数',
      jh_htqdgfxz: '展示入账金额合计数',
      jh_htlygfxz: '展示差额合计数',
      jh_wzlygfxz: '展示物资领用金额',
      jh_wzzlztbsz: '展示整领整退物资金额（整领部分的合计金额） ',
      jh_wztklz: '展示物资退库率',
      jh_wzcqgcez: '物资超欠供差额绝对值',
      erpndysbd: '展示调整金额',
      erpndysbdcs: '展示调整次数 ',
      xmsj: '展示核减金额',
      sbfwqrpje: '展示服务入账金额',
      jh_htzfgfx_sl: '展示差额合计数',
      jh_skdwyzx_sl: '展示资金支付金额',
      jh_zgzzhlxz: '展示差额',
      zjgcye: '在建工程余额 ',
      stat: '项目状态 ',
      pspids: '3',
      jh_lxgfx: '3',
      jh_ztbcyl: '3',
      jh_htqdgfx: '3',
      jh_htlygfx: '3',
      jh_wzlygfx: '3',
      jh_wzlygfx: '3',
      JH_WZTKL: '3',
      jh_wzcqgce: '3',
      jh_ndystzl: '3',
      jh_ndystzcs: '3',
      jh_sjhjl: '3',
      jh_sbfwrzhlx: '3',
      jh_zjzfje: '3',
      jh_skdwyzx: '3',
      jh_zgzzhlx: '3',
      jh_zjgcfs: '3',
      STAT: '3'
    }
    setupState.example.unshift(exhibition)
    setupState.example.unshift(judge)
    setupState.example.unshift(calculation)
  } else {
    setupState.example.splice(0, 3)
  }
}
//穿透跳转
function goTable(path, pspid) {
  router.push({
    path: path,
    query: {
      pspid: pspid
    }
  })
}
function loadZbxOptions() {
  return getPublicData('YSQGC_GFX_ZBX').then((res) => {
    if (res.success) {
      setupState.zbxOptions = res.data
    }
  })
}
function loadCompany() {
  setupState.specialorgid = parseInt(userDialogRef.value.specialorgid)
  loadCompanyData()
}
function loadCompanyData() {
  setupState.loading = false
  companyRef.value.getAffiliatedUnit(setupState.specialorgid).then(() => {
    applyPenetrationQuery()
  })
  gkbmRef.value.getProjectType(setupState.specialorgid)
}
onMounted(() => {
  setupState.topHeight = (document.querySelector('.topBox')?.clientHeight ?? 0)
  setupState.heightNum = (document.querySelector('.ds-workspace__viewport')?.clientHeight ?? window.innerHeight)
  setupState.searchHeight = (document.querySelector('.search')?.clientHeight ?? 0)
  setTableHeight()
  setupState.loading = true
  if (setupState.pendingPenetration && setupState.pendingPenetration.specialorgid) {
    setupState.specialorgid = parseInt(setupState.pendingPenetration.specialorgid)
    loadCompanyData()
  } else {
    userDialogRef.value.getUser(setupState.userId, setupState.userCode)
  }
})
;(() => {
  handleColumn()
  setupState.pendingPenetration = getPenetrationQuery()
  loadZbxOptions()
})()
defineExpose({
  EpArrowDown,
  EpArrowUp,
  EpDownload,
  EpQuestionFilled,
  EpRefreshRight,
  EpSearch,
  helpHandle,
  store,
  dataList,
  searchShow,
  tableHeight,
  topHeight,
  heightNum,
  searchHeight,
  tables,
  remarks,
  example,
  zbxOptions,
  columnObj,
  applicationId,
  applications,
  page,
  loading,
  userCode,
  userId,
  specialorgid,
  pendingPenetration,
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
  getPenetrationQuery,
  applyPenetrationQuery,
  remarksbtn,
  goTable,
  loadZbxOptions,
  loadCompany,
  loadCompanyData
})
</script>

<style lang="less" scoped>
.quaBroDetail {
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
</style>
