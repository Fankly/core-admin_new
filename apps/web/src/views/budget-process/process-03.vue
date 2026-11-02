<template>
  <div class="processBrowse" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>预算全过程及时性监控总览</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon style="font-size: 18px" class="ep-icon-s-operation">
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
            <el-icon class="ep-icon-question" style="font-size: 18px" @click="helpHandle"><EpQuestionFilled /></el-icon>
          </span>
        </div>
      </div>

      <div class="search" v-show="searchShow">
        <el-form label-position="left" label-width="100px">
          <el-row :gutter="24">
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

            <el-col :span="6">
              <el-form-item label="截至日期：">
                <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"> </el-date-picker>
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
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="监控规则：">
                <el-switch class="formWidth" v-model="remarks" active-text="开" inactive-text="关" @change="remarksbtn" />
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
                <el-button type="primary" :icon="EpSearch" @click="search">查询</el-button>
                <el-button :icon="EpRefreshRight" @click="reset">重置</el-button>
                <el-button type="warning" :icon="EpDownload" @click="exportBtn">导出</el-button>
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
      style="width: 100%"
      row-key="id"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="单位/项目类型" width="250" fixed>
        <template #default="scope">
          <span style="cursor: pointer" v-if="scope.row.children">{{ scope.row.name }}</span>
          <div style="width: 100%; text-align: center" v-else>{{ scope.row.name }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="dataMap.ysmbz" align="right" width="150" label="年度预算（万元）" fixed />

      <el-table-column label="项目储备与立项" v-if="columnObj.reserve">
        <el-table-column label="已立项" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_lxjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_lxjsxxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_lxjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="招投标" v-if="columnObj.Bidding">
        <el-table-column label="需求提报" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_ztbjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_ztbjsxxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_ztbjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="需求中标" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_zbjgxdjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_zbjgxdjsxxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_zbjgxdjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="合同签订" v-if="columnObj.contract">
        <el-table-column label="已签订" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_htqdjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_htqdjsxxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_htqdjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目实施" v-if="columnObj.implementation">
        <el-table-column label="项目开工" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_kgjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_kgjsxxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_kgjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="物资到货" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_wzdhjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_wzdhjsxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_wzdhjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="物资领用" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_wzlyjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_wzlyjsxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_wzlyjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="项目竣工" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_jgjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_jgjsxxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_jgjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目审计" v-if="columnObj.audit">
        <el-table-column label="结算送审" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_jsssjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_jsssjsxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_jsssjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="结算审定" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_jssjjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_jssjjsxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_jssjjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="结算与资金支付" v-if="columnObj.settlement">
        <el-table-column label="资金支付" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_zjzfjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_zjzfjsxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_zjzfjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="决算与增资" v-if="columnObj.finalAccounts">
        <el-table-column label="决算审计" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_jusssjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_jusssjsxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_jusssjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="暂估转资" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_zgzzjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_zgzzjsxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_zgzzjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="正式转资" align="left" width="240">
          <template #default="scope">
            <div v-if="scope.row.auditSwitch">
              {{ scope.row.jh_zszzjsxys }}
            </div>
            <div v-else>
              <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_zszzjsxms + '个' }}</div>
              <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_zszzjsxys + '万元' }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="项目关闭" align="left" width="240" v-if="columnObj.close">
        <template #default="scope">
          <div v-if="scope.row.auditSwitch">
            {{ scope.row.jh_gbjsxys }}
          </div>
          <div v-else>
            <div v-if="scope.row.dataMap">{{ '项目数量：' + scope.row.dataMap.jh_gbjsxms + '个' }}</div>
            <div v-if="scope.row.dataMap">{{ '年度预算：' + scope.row.dataMap.jh_gbjsxys + '万元' }}</div>
          </div>
        </template>
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
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from '@/store/business'
import { showHelpMsg } from '@/utils/message'
defineOptions({
  name: '/budget-process/process-03'
})
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
  helpHandle,
  store,
  searchShow: true,
  example: [],
  dataList: {
    select: 0,
    month: new Date()
  },
  segment: [
    {
      value: 'reserve',
      label: '项目储备与立项',
      checked: true
    },
    {
      value: 'Bidding',
      label: '招投标',
      checked: true
    },
    {
      value: 'contract',
      label: '合同签订',
      checked: true
    },
    {
      value: 'implementation',
      label: '项目实施',
      checked: true
    },
    {
      value: 'audit',
      label: '项目审计',
      checked: true
    },
    {
      value: 'settlement',
      label: '结算与资金支付',
      checked: true
    },
    {
      value: 'finalAccounts',
      label: '决算与增资',
      checked: true
    },
    {
      value: 'close',
      label: '项目关闭',
      checked: true
    }
  ],
  segmentIds: [],
  columnObj: {},
  tableHeight: '',
  topHeight: '',
  heightNum: '',
  searchHeight: '',
  loading: false,
  //表格备足开关
  remarks: false,
  userCode: '',
  userId: '',
  specialorgid: ''
})
const searchShow = toRef(setupState, 'searchShow')
const example = toRef(setupState, 'example')
const dataList = toRef(setupState, 'dataList')
const segment = toRef(setupState, 'segment')
const segmentIds = toRef(setupState, 'segmentIds')
const columnObj = toRef(setupState, 'columnObj')
const tableHeight = toRef(setupState, 'tableHeight')
const topHeight = toRef(setupState, 'topHeight')
const heightNum = toRef(setupState, 'heightNum')
const searchHeight = toRef(setupState, 'searchHeight')
const loading = toRef(setupState, 'loading')
const remarks = toRef(setupState, 'remarks')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
function setTableHeight() {
  if (setupState.searchShow == true) {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight - 40 + 'px'
  } else {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight + setupState.searchHeight - 40 + 'px'
  }
}
function loadData() {
  setupState.loading = true
  if (setupState.dataList.month) {
    const params = {
      qkjxmlxbms: [],
      qkjejdws: [],
      zyear: '',
      zmonth: '',
      wd: setupState.dataList.select,
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
    if (setupState.dataList.month != '') {
      let time = new Date(setupState.dataList.month)
      let zyear = time.getFullYear()
      let zmonth = time.getMonth() + 1
      params.zyear = JSON.stringify(zyear)
      params.zmonth = JSON.stringify(zmonth)
    }
    if (setupState.remarks == false) {
      baseService.post('/process/process03/', params).then((res) => {
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
      setupState.example = []
      remarksbtn()
      baseService.post('/process/process03/', params).then((res) => {
        if (res.success == true) {
          setupState.loading = false
          res.data.forEach((item) => {
            item.auditSwitch = false
            setupState.example.push(item)
          })
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
function exportBtn() {
  setupState.loading = true
  if (setupState.dataList.month) {
    const params = {
      qkjxmlxbms: [],
      qkjejdws: [],
      zyear: '',
      zmonth: '',
      wd: setupState.dataList.select,
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
    if (setupState.dataList.month != '') {
      let time = new Date(setupState.dataList.month)
      let zyear = time.getFullYear()
      let zmonth = time.getMonth() + 1
      params.zyear = JSON.stringify(zyear)
      params.zmonth = JSON.stringify(zmonth)
    }
    baseService.export('/process/process03/export', params).then((res) => {
      setupState.loading = false
      const blob = res
      let dom = document.createElement('a')
      let url = window.URL.createObjectURL(blob)
      dom.href = url
      dom.download = '预算全过程及时性监控总览.xlsx'
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
    })
  } else {
    setupState.loading = false
    ElMessage({
      message: '请选择日期查询',
      icon: EpSearch,
      customClass: 'tipsBox'
    })
  }
}
//搜索按钮
function search() {
  loadData()
}
//处理环节数据
function handleColumn() {
  setupState.segment.forEach((item) => {
    setupState.segmentIds.push(item.value)
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
//稽核规则开关
function remarksbtn() {
  if (setupState.remarks) {
    let name = {
      auditSwitch: true,
      name: '指标名称',
      jh_lxjsxys: '立项及时性',
      jh_ztbjsxys: '招投标及时性',
      jh_zbjgxdjsxys: '中标结果下达及时性',
      jh_htqdjsxys: '合同签订的及时性',
      jh_kgjsxys: '开工及时性',
      jh_wzdhjsxys: '物资到货及时性',
      jh_wzlyjsxys: '物资领用及时性',
      jh_jgjsxys: '竣工及时性',
      jh_jsssjsxys: '送审及时性',
      jh_jssjjsxys: '审计及时性',
      jh_zjzfjsxys: '资金支付及时性',
      jh_jusssjsxys: '送审及时性',
      jh_zgzzjsxys: '暂估转资及时性',
      jh_zszzjsxys: '正式转资及时性',
      jh_gbjsxys: '关闭及时性'
    }
    let calculation = {
      auditSwitch: true,
      name: '稽核规则（计算公式）',
      jh_lxjsxys: '项目立项日期-预算下达日期',
      jh_ztbjsxys: '首笔需求提报时间-项目立项时间',
      jh_zbjgxdjsxys: '首个中标日期-对应需求上报日期',
      jh_htqdjsxys: '首份合同签订日期-对应中标日期',
      jh_kgjsxys: '实际开工日期-计划开工时间',
      jh_wzdhjsxys: '首笔物资实际到货日期（同批次）-物资计划到货日期（同批次）',
      jh_wzlyjsxys: '首笔物资领用日期（同批次）-物资到货日期（同批次）',
      jh_jgjsxys: '实际竣工日期-计划竣工日期',
      jh_jsssjsxys: '首次送审日期-对应实际竣工日期',
      jh_jssjjsxys: '首次审定日期-对应收审日期',
      jh_zjzfjsxys: '首笔资金支付日期-财务支出日期',
      jh_jusssjsxys: '决算报告日期-最后一次结算审定日期',
      jh_zgzzjsxys: '首笔增资过账日期-实际竣工日期',
      jh_zszzjsxys: '最后一笔增资过账日期（项目关闭后判断）-决算报告日期',
      jh_gbjsxys: '关闭时间-最后一笔财务支出'
    }
    let judge = {
      auditSwitch: true,
      name: '参照依据',
      jh_lxjsxys: '15天（暂定）',
      jh_ztbjsxys: '省招：60天;市招：30天',
      jh_zbjgxdjsxys: '国招4个月;省招80-100天;市招40-50天',
      jh_htqdjsxys: '30天',
      jh_kgjsxys: '15天（暂定）',
      jh_wzdhjsxys: '15天（暂定）',
      jh_wzlyjsxys: '15天（暂定）',
      jh_jgjsxys: '15天（暂定）',
      jh_jsssjsxys: '220kV及以上基建项目60天；110kV及以上基建、技改项目40天；其他资本项目30天；成本性项目10天。',
      jh_jssjjsxys: '220kV及以上基建项目40天；110kV及以上基建、技改项目20天；其他资本项目15天；成本性项目15天。',
      jh_zjzfjsxys: '60天',
      jh_jusssjsxys: '220kV及以上基建项目80天；110kV及以上基建、技改项目30天；其他资本性项目45天。',
      jh_zgzzjsxys: '30天',
      jh_zszzjsxys: '30天',
      jh_gbjsxys: '15天'
    }
    setupState.example.unshift(judge)
    setupState.example.unshift(calculation)
    setupState.example.unshift(name)
  } else {
    setupState.example.splice(0, 3)
  }
}
//切换维度
function changeCompany() {
  loadData()
}
//重置按钮
function reset() {
  setupState.dataList.month = new Date()
  setupState.dataList.select = 0
  typeRef.value.clear()
  companyRef.value.clear()
  setupState.example = []
  loadData()
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
}
onMounted(() => {
  setupState.topHeight = document.querySelector('.topBox').clientHeight
  setupState.heightNum = document.querySelector('.el-card').clientHeight
  setupState.searchHeight = document.querySelector('.search').clientHeight
  setTableHeight()
  setupState.loading = true
  userDialogRef.value.getUser()
})
;(() => {
  handleColumn()
  remarksbtn()
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
  searchShow,
  example,
  dataList,
  segment,
  segmentIds,
  columnObj,
  tableHeight,
  topHeight,
  heightNum,
  searchHeight,
  loading,
  remarks,
  userCode,
  userId,
  specialorgid,
  setTableHeight,
  loadData,
  exportBtn,
  search,
  handleColumn,
  listShow,
  remarksbtn,
  changeCompany,
  reset,
  showSearch,
  loadCompany
})
</script>

<style lang="less" scoped>
.processBrowse {
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
