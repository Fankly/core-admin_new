<template>
  <div class="accounts37" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目关联设备资产总览</h2>
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
        <el-form label-position="left" label-width="120px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="立项时间开始：">
                <el-date-picker
                  v-model="dataList.start"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="date"
                  placeholder="请选择开始时间"
                  :clearable="false"
                >
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="立项时间结束：">
                <el-date-picker
                  v-model="dataList.end"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="date"
                  placeholder="请选择结束时间"
                  :clearable="false"
                >
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="年度：">
                <el-date-picker v-model="year" value-format="YYYY" type="year" placeholder="选择年"> </el-date-picker>
              </el-form-item>
            </el-col>
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
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="单位" prop="yjdwName" width="150" v-if="columnObj.dw"> </el-table-column>
      <el-table-column label="Z701配网专项成本" v-if="columnObj.z701">
        <el-table-column label="设备挂接率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z701sbNum, row.z701lxsl)" placement="top" effect="light">
                <span>{{ row.z701sbsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z701sbAmount, row.z701lxje)" placement="top" effect="light">
                <span>{{ row.z701sbje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="资产关联率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z701zcNum, row.z701lxsl)" placement="top" effect="light">
                <span>{{ row.z701zcsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z701zcAmount, row.z701lxje)" placement="top" effect="light">
                <span>{{ row.z701zcje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table-column>
      <el-table-column label="Z702农网专项成本（主业）" width="250" v-if="columnObj.z702">
        <el-table-column label="设备挂接率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z702sbNum, row.z702lxsl)" placement="top" effect="light">
                <span>{{ row.z702sbsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z702sbAmount, row.z702lxje)" placement="top" effect="light">
                <span>{{ row.z702sbje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="资产关联率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z702zcNum, row.z702lxsl)" placement="top" effect="light">
                <span>{{ row.z702zcsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z702zcAmount, row.z702lxje)" placement="top" effect="light">
                <span>{{ row.z702zcje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table-column>
      <el-table-column label="Z703业扩专项成本" width="250" v-if="columnObj.z703">
        <el-table-column label="设备挂接率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z703sbNum, row.z703lxsl)" placement="top" effect="light">
                <span>{{ row.z703sbsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z703sbAmount, row.z703lxje)" placement="top" effect="light">
                <span>{{ row.z703sbje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="资产关联率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z703zcNum, row.z703lxsl)" placement="top" effect="light">
                <span>{{ row.z703zcsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z703zcAmount, row.z703lxje)" placement="top" effect="light">
                <span>{{ row.z703zcje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table-column>
      <el-table-column label="Z248农村低压电网修理" v-if="columnObj.z248">
        <el-table-column label="设备挂接率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z248sbNum, row.z248lxsl)" placement="top" effect="light">
                <span>{{ row.z248sbsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z248sbAmount, row.z248lxje)" placement="top" effect="light">
                <span>{{ row.z248sbje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="资产关联率">
          <el-table-column label="数量(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z248zcNum, row.z248lxsl)" placement="top" effect="light">
                <span>{{ row.z248zcsl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="金额(%)" width="80">
            <template #default="{ row }">
              <el-tooltip :content="showPercentage(row.z248zcAmount, row.z248lxje)" placement="top" effect="light">
                <span>{{ row.z248zcje }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table-column>
    </el-table>
  </div>

  <userDialog ref="userDialogInstance" @loadCompany="loadCompany"></userDialog>
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
import { showHelpMsg } from '@/utils/message'
defineOptions({
  name: '/budget-process/process-37'
})
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
      value: 'dw',
      label: '单位',
      checked: true
    },
    {
      value: 'z701',
      label: 'Z701配网专项成本',
      checked: true
    },
    {
      value: 'z702',
      label: 'Z702农网专项成本（主业）',
      checked: true
    },
    {
      value: 'z703',
      label: 'Z703业扩专项成本',
      checked: true
    },
    {
      value: 'z248',
      label: 'Z248农村低压电网修理',
      checked: true
    }
  ],
  dataList: {
    start: '',
    end: ''
  },
  year: new Date().getFullYear().toString()
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
const year = toRef(setupState, 'year')
// 展示百分比计算规则
function showPercentage(numOne, numTwo) {
  return numOne + '/' + numTwo
}
//计算表格高度
function setTableHeight() {
  if (setupState.searchShow == true) {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight - 60 + 'px'
  } else {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight + setupState.searchHeight - 60 + 'px'
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
}
function loadData() {
  setupState.loading = true
  let params = {
    specialorgid: setupState.specialorgid,
    lxkssj: setupState.dataList.start,
    lxjssj: setupState.dataList.end,
    year: setupState.year
  }
  baseService.post(`/process34/getData`, params).then((res) => {
    if (res.success) {
      setupState.example = res.data
      setupState.loading = false
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function exportBtn() {
  let params = {
    specialorgid: setupState.specialorgid,
    lxkssj: setupState.dataList.start,
    lxjssj: setupState.dataList.end,
    year: setupState.year
  }
  baseService.export(`/process34/export`, params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '项目关联设备资产总览.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
}
function reset() {
  setupState.dataList.start = ''
  setupState.dataList.end = ''
  setupState.year = new Date().getFullYear().toString()
  setupState.example = []
  loadData()
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
  year,
  showPercentage,
  setTableHeight,
  showSearch,
  handleColumn,
  listShow,
  loadCompany,
  loadData,
  exportBtn,
  reset
})
</script>

<style lang="less" scoped>
.accounts37 {
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
