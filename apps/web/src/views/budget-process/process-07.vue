<template>
  <div class="genMaters" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>通用物资执行总览</h2>
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
              <el-form-item label="提报日期：">
                <el-date-picker
                  v-model="dataList.date"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  range-separator="至"
                ></el-date-picker>
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
      <el-table-column label="单位/项目类型" fixed width="250">
        <template #default="scope">
          <span style="cursor: pointer" v-if="scope.row.children">{{ scope.row.name }}</span>
          <div style="width: 100%; text-align: center" v-else>{{ scope.row.name }}</div>
        </template>
      </el-table-column>

      <el-table-column :width="columns[13].width" prop="dataMap.ysmbz" align="right" label="年度预算（万元）" fixed />

      <el-table-column label="招投标" v-if="columnObj.ztb">
        <el-table-column :min-width="columns[0].width" prop="dataMap.preis" align="center" label="招标金额"></el-table-column>
        <el-table-column :min-width="columns[1].width" prop="dataMap.xqtbxz" align="center" label="招标金额（修正）"></el-table-column>
        <el-table-column :min-width="columns[2].width" prop="dataMap.zhszj" align="center" label="中标金额"></el-table-column>
        <el-table-column :min-width="columns[3].width" prop="dataMap.zbjgxz" align="center" label="中标金额（修正）"></el-table-column>
        <el-table-column :min-width="columns[4].width" prop="dataMap.zxqzbz" align="center" label="需求招标中"></el-table-column>
      </el-table-column>

      <el-table-column label="合同签订" v-if="columnObj.htqd">
        <el-table-column :min-width="columns[5].width" prop="dataMap.htje" align="center" label="合同签订"></el-table-column>
        <el-table-column :min-width="columns[6].width" prop="dataMap.htqdxz" align="center" label="合同签订(修正)"></el-table-column>
        <el-table-column :min-width="columns[7].width" prop="dataMap.zhtqdz" align="center" label="合同签订中"></el-table-column>
      </el-table-column>

      <el-table-column label="合同履约" v-if="columnObj.htly">
        <el-table-column :min-width="columns[8].width" prop="dataMap.zwzdhje" align="center" label="物资到货"></el-table-column>
        <el-table-column :min-width="columns[9].width" prop="dataMap.wzdhxz" align="center" label="物资到货(修正)"></el-table-column>
        <el-table-column :min-width="columns[10].width" prop="dataMap.zghzje" align="center" label="在途物资"></el-table-column>
        <el-table-column :min-width="columns[11].width" prop="dataMap.zwzlyje" align="center" label="物资领用"></el-table-column>
        <el-table-column :min-width="columns[12].width" prop="dataMap.zlyzje" align="center" label="库存物资"></el-table-column>
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
import { getMaxLength } from '@/utils/utils'
defineOptions({
  name: '/budget-process/process-07'
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
  dataList: {
    date: [],
    select: 0
  },
  columns: [
    {
      columnKey: 'preis',
      columnValue: '招标金额'
    },
    {
      columnKey: 'xqtbxz',
      columnValue: '招标金额（修正）'
    },
    {
      columnKey: 'zhszj',
      columnValue: '中标金额'
    },
    {
      columnKey: 'zbjgxz',
      columnValue: '中标金额（修正）'
    },
    {
      columnKey: 'zxqzbz',
      columnValue: '需求招标中'
    },
    {
      columnKey: 'dataMap.htje',
      columnValue: '合同签订'
    },
    {
      columnKey: 'htqdxz',
      columnValue: '合同签订(修正)'
    },
    {
      columnKey: 'zhtqdz',
      columnValue: '合同签订中'
    },
    {
      columnKey: 'zwzdhje',
      columnValue: '物资到货'
    },
    {
      columnKey: 'wzdhxz',
      columnValue: '物资到货(修正)'
    },
    {
      columnKey: 'zghzje',
      columnValue: '在途物资'
    },
    {
      columnKey: 'zwzlyje',
      columnValue: '物资领用'
    },
    {
      columnKey: 'zlyzje',
      columnValue: '库存物资'
    },
    {
      columnKey: 'ysmbz',
      columnValue: '年度预算（万元）'
    }
  ],
  example: [],
  searchShow: true,
  segment: [
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
      value: 'htly',
      label: '合同履约',
      checked: true
    }
  ],
  columnObj: {},
  segmentIds: [],
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
const columns = toRef(setupState, 'columns')
const example = toRef(setupState, 'example')
const searchShow = toRef(setupState, 'searchShow')
const segment = toRef(setupState, 'segment')
const columnObj = toRef(setupState, 'columnObj')
const segmentIds = toRef(setupState, 'segmentIds')
const tableHeight = toRef(setupState, 'tableHeight')
const topHeight = toRef(setupState, 'topHeight')
const heightNum = toRef(setupState, 'heightNum')
const searchHeight = toRef(setupState, 'searchHeight')
const loading = toRef(setupState, 'loading')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
function compTableWidth() {
  const tableData = setupState.example
  setupState.columns = setupState.columns.map((value) => {
    const arr = tableData.map((item) => {
      if (item.dataMap[value.columnKey] && Number(item.dataMap[value.columnKey])) {
        return item[value.columnKey]
      } else {
        return value.columnValue
      }
    })
    if (!getMaxLength(arr)) {
      value.width = 120
    } else {
      value.width = Math.round(getMaxLength(arr) + 20)
    }
    return value
  })
}
function setTableHeight() {
  if (setupState.searchShow) {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight - 40 + 'px'
  } else {
    setupState.tableHeight = setupState.heightNum - setupState.topHeight + setupState.searchHeight - 40 + 'px'
  }
}
function getTime() {
  let date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDay()
  month = month > 9 ? month : '0' + month
  day = day > 9 ? day : '0' + day
  let start = year + '-' + '01' + '-' + '01'
  let last = year + '-' + month + '-' + day
  setupState.dataList.date.push(start)
  setupState.dataList.date.push(last)
}
function loadData() {
  setupState.loading = true
  const params = {
    qkjxmlxbms: [],
    qkjejdws: [],
    sbadat: '',
    ebadat: '',
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
  if (setupState.dataList.date) {
    params.sbadat = setupState.dataList.date[0]
    params.ebadat = setupState.dataList.date[1]
  }
  baseService.post('/process/process07/', params).then((res) => {
    if (res.success == true) {
      setupState.loading = false
      setupState.example = res.data
      compTableWidth()
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
  setupState.loading = true
  const params = {
    qkjxmlxbms: [],
    qkjejdws: [],
    sbadat: '',
    ebadat: '',
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
  if (setupState.dataList.date) {
    params.sbadat = setupState.dataList.date[0]
    params.ebadat = setupState.dataList.date[1]
  }
  baseService.export('/process/process07/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '通用物资执行总览.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
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
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  setTableHeight()
}
//搜索按钮
function search() {
  loadData()
}
//重置按钮
function reset() {
  setupState.dataList.date = []
  getTime()
  setupState.dataList.select = 0
  typeRef.value.clear()
  companyRef.value.clear()
  setupState.example = []
  loadData()
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
  getTime()
  setupState.loading = true
  userDialogRef.value.getUser(setupState.userId, setupState.userCode)
  compTableWidth()
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
  helpHandle,
  store,
  dataList,
  columns,
  example,
  searchShow,
  segment,
  columnObj,
  segmentIds,
  tableHeight,
  topHeight,
  heightNum,
  searchHeight,
  loading,
  userCode,
  userId,
  specialorgid,
  compTableWidth,
  setTableHeight,
  getTime,
  loadData,
  exportBtn,
  handleColumn,
  listShow,
  showSearch,
  search,
  reset,
  loadCompany
})
</script>

<style lang="less" scoped>
.genMaters {
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
