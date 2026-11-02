<template>
  <div class="accounts40" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目建设规模查询报表</h2>
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
                <el-dropdown-item v-for="item in segment" :key="item.label">
                  <el-checkbox style="margin-right: 10px" v-model="item.checked" @change="listShow(item.label, item.checked)"></el-checkbox>
                  {{ item.value }}
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
              <el-form-item label="一级单位：">
                <el-select class="formWidth" v-model="yjdwValue" clearable placeholder="请选择" @change="getEjdw(yjdwValue)">
                  <el-option v-for="item in yjdw" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="二级单位：">
                <el-select class="formWidth" v-model="ejdwValue" clearable placeholder="请选择">
                  <el-option v-for="item in ejdw" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="储备编码：">
                <copyTextBox class="formWidth" ref="cbbm"></copyTextBox>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="国网项目编码：">
                <copyTextBox class="formWidth" ref="gwxmbm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <el-input class="formWidth" v-model="projectName"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="年度：">
                <el-date-picker v-model="year" value-format="YYYY" type="year" placeholder="选择年"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6" class="btnPostion">
              <el-button type="primary" :icon="EpSearch" @click="loadData"> 查询 </el-button>
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
      :span-method="objectSpanMethod"
      row-key="id"
      style="width: 100%; margin-top: 10px"
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column fixed label="一级单位" prop="yjdwName" width="200" v-if="columnObj.yjdwName"> </el-table-column>
      <el-table-column fixed label="二级单位" prop="ejdwName" width="200" v-if="columnObj.ejdwName"> </el-table-column>
      <el-table-column label="项目名称" prop="xmmc" width="200" v-if="columnObj.xmmc"> </el-table-column>
      <el-table-column label="项目编码" prop="xmbm" width="200" v-if="columnObj.xmbm"> </el-table-column>
      <el-table-column label="国网项目编码" prop="gwxmbm" width="200" v-if="columnObj.gwxmbm"> </el-table-column>
      <el-table-column label="项目分类（三级分类）" prop="sjflName" width="200" v-if="columnObj.sjflName"> </el-table-column>
      <el-table-column label="项目包名称" prop="xmbmc" width="200" v-if="columnObj.xmbmc"> </el-table-column>
      <el-table-column label="当年预算（万元）" prop="dnys" width="200" v-if="columnObj.dnys"> </el-table-column>
      <el-table-column label="单项目" v-if="columnObj.dxm">
        <el-table-column prop="dxmgt" label="杆塔(根)"></el-table-column>
        <el-table-column prop="dxmdlfzx" label="电缆分支箱(只)"></el-table-column>
        <el-table-column prop="dxmjkxl" label="架空线路(Km)"></el-table-column>
        <el-table-column prop="dxmdlxl" label="电缆线路(Km)"></el-table-column>
      </el-table-column>
      <el-table-column label="台区" v-if="columnObj.tq">
        <el-table-column prop="tqgt" label="杆塔(根)"></el-table-column>
        <el-table-column prop="tqdlfzx" label="电缆分支箱(只)"></el-table-column>
        <el-table-column prop="tqjkxl" label="架空线路(Km)"></el-table-column>
        <el-table-column prop="tqdlxl" label="电缆线路(Km)"></el-table-column>
      </el-table-column>
    </el-table>
    <el-pagination
      :current-page="page.page"
      background
      align="center"
      :page-sizes="[10, 20, 50, 100, 500]"
      :page-size="page.limit"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="limitChangeHandle"
      @current-change="pageChangeHandle"
    ></el-pagination>
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
import { markRaw as markElementIconRaw, reactive, toRef, reactive as reactiveLocal, toRefs, onMounted, useTemplateRef } from 'vue'
import baseService from '@/service/baseService'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from '@/store/business'
import { ElMessage } from 'element-plus'
import copyTextBox from '@/components/select/copyTextBox.vue'
import { showHelpMsg } from '@/utils/message'
defineOptions({
  name: '/budget-process/process-40'
})
const userDialogRef = useTemplateRef('userDialogInstance')
const cbbmRef = useTemplateRef('cbbm')
const gwxmbmRef = useTemplateRef('gwxmbm')
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
      value: '一级单位',
      label: 'yjdwName',
      checked: true
    },
    {
      value: '二级单位',
      label: 'ejdwName',
      checked: true
    },
    {
      value: '项目名称',
      label: 'xmmc',
      checked: true
    },
    {
      value: '项目编码',
      label: 'xmbm',
      checked: true
    },
    {
      value: '国网项目编码',
      label: 'gwxmbm',
      checked: true
    },
    {
      value: '项目分类(三级分类)',
      label: 'sjflName',
      checked: true
    },
    {
      value: '项目包名称',
      label: 'xmbmc',
      checked: true
    },
    {
      value: '项目包编码',
      label: 'xmbbm',
      checked: true
    },
    {
      value: '当年预算(万元)',
      label: 'dnys',
      checked: true
    },
    {
      value: '单项目',
      label: 'dxm',
      checked: true
    },
    {
      value: '台区',
      label: 'tq',
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
    current: 1
  },
  //   跨行所需数据
  spanArr: [],
  // 用于存放需要合并的行的个数
  spanArr1: [],
  // 用于存放需要合并的行的个数
  spanIndex: 0,
  // 记录spanArr数组的下标
  spanIndex1: 0,
  // 记录spanArr数组的下标
  //一级单位
  yjdw: [],
  yjdwValue: '',
  //二级单位
  ejdw: [],
  ejdwValue: '',
  // 项目名称
  projectName: '',
  //本地下拉数据
  selectList: [
    {
      code: '0',
      name: '否'
    },
    {
      code: '1',
      name: '是'
    }
  ],
  // 年度
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
const page = toRef(setupState, 'page')
const spanArr = toRef(setupState, 'spanArr')
const spanArr1 = toRef(setupState, 'spanArr1')
const spanIndex = toRef(setupState, 'spanIndex')
const spanIndex1 = toRef(setupState, 'spanIndex1')
const yjdw = toRef(setupState, 'yjdw')
const yjdwValue = toRef(setupState, 'yjdwValue')
const ejdw = toRef(setupState, 'ejdw')
const ejdwValue = toRef(setupState, 'ejdwValue')
const projectName = toRef(setupState, 'projectName')
const selectList = toRef(setupState, 'selectList')
const year = toRef(setupState, 'year')
const componentData = reactiveLocal({})
componentData.spanIndex2 = undefined
const spanIndex2 = toRef(componentData, 'spanIndex2')
//根据一级单位获取二级单位
function getEjdw(code) {
  baseService.get(`/commonCode/getEjdwByYjdw?yjdw=${code}`).then((res) => {
    if (res.success) {
      setupState.ejdw = res.data
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
//计算表格高度
function setTableHeight() {
  if (setupState.searchShow === true) {
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
    setupState.segmentIds.push(item.label)
    setupState.columnObj[item.label] = item.checked
  })
}
//项目环节
function listShow(value, checked) {
  for (let i in setupState.columnObj) {
    if (i === value) {
      setupState.columnObj[i] = checked
    }
  }
}
function loadCompany() {
  setupState.loading = false
  setupState.specialorgid = parseInt(userDialogRef.value.specialorgid)
}
function loadData() {
  setupState.spanArr = []
  setupState.spanArr1 = []
  setupState.spanIndex = 0
  setupState.spanIndex1 = 0
  componentData.spanIndex2 = 0
  setupState.example = []
  setupState.loading = true
  let params = {
    specialorgid: setupState.specialorgid,
    current: setupState.page.page,
    size: setupState.page.limit,
    yjdw: setupState.yjdwValue,
    ejdw: setupState.ejdwValue,
    xmbms: cbbmRef.value.array,
    gwxmbms: gwxmbmRef.value.array,
    xmmc: setupState.projectName,
    nd: setupState.year
  }
  baseService.post('/process38/getDataPage', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.example = res.data.records
      setupState.page.total = res.data.total
      getSpanArr(setupState.example)
      getSpanArr1(setupState.example)
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
  let params = {
    specialorgid: setupState.specialorgid,
    page: setupState.page.page,
    limit: setupState.page.limit,
    yjdw: setupState.yjdwValue,
    ejdw: setupState.ejdwValue,
    cbbms: cbbmRef.value.array,
    gwxmbms: gwxmbmRef.value.array,
    xmmc: setupState.projectName,
    nd: setupState.year
  }
  baseService.export('/process38/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '项目建设规模查询报表.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
}
function getSpanArr(data) {
  let len = 0
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      len += 1
      setupState.spanArr.push(1)
      setupState.spanIndex = 0
    } else {
      // 判断当前行与前一行内容是否相同
      if (data[i].yjdwName === data[i - 1].yjdwName) {
        setupState.spanArr[setupState.spanIndex] += 1 // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
        setupState.spanArr.push(0) // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
        len += 1
      } else {
        len = 1
        setupState.spanArr.push(1) // 否则，依旧是一行
        setupState.spanIndex = i
      }
    }
  }
}
function getSpanArr1(data) {
  let len = 0
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      len += 1
      setupState.spanArr1.push(1)
      setupState.spanIndex1 = 0
    } else {
      // 判断当前行与前一行内容是否相同
      if (data[i].ejdwName === data[i - 1].ejdwName) {
        setupState.spanArr1[setupState.spanIndex1] += 1 // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
        setupState.spanArr1.push(0) // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
        len += 1
      } else {
        len = 1
        setupState.spanArr1.push(1) // 否则，依旧是一行
        setupState.spanIndex1 = i
      }
    }
  }
}
function objectSpanMethod({ rowIndex, columnIndex }) {
  if (columnIndex == 0) {
    const _row = setupState.spanArr[rowIndex] // 行数
    const _col = _row > 0 ? 1 : 0 // 列数
    return {
      rowspan: _row,
      colspan: _col
    }
  } else if (columnIndex === 1) {
    const _row = setupState.spanArr1[rowIndex] // 行数
    const _col = _row > 0 ? 1 : 0 // 列数
    return {
      rowspan: _row,
      colspan: _col
    }
  }
}
function pageChangeHandle(currentPageNum) {
  setupState.page.page = currentPageNum
  loadData()
}
function limitChangeHandle(currentLimitNum) {
  setupState.page.page = 1
  setupState.page.limit = currentLimitNum
  loadData()
}
function reset() {
  setupState.page.page = 1
  setupState.page.limit = 10
  setupState.page.total = 0
  setupState.yjdwValue = ''
  setupState.ejdwValue = ''
  setupState.ejdw = []
  cbbmRef.value.clear()
  gwxmbmRef.value.clear()
  setupState.projectName = ''
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
  //获取一级单位
  baseService.get('/commonCode/getYjdw').then((res) => {
    if (res.success) {
      setupState.yjdw = res.data
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
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
  spanArr,
  spanArr1,
  spanIndex,
  spanIndex1,
  yjdw,
  yjdwValue,
  ejdw,
  ejdwValue,
  projectName,
  selectList,
  year,
  getEjdw,
  setTableHeight,
  showSearch,
  handleColumn,
  listShow,
  loadCompany,
  loadData,
  exportBtn,
  getSpanArr,
  getSpanArr1,
  objectSpanMethod,
  pageChangeHandle,
  limitChangeHandle,
  reset,
  ...toRefs(componentData)
})
</script>

<style scoped lang="less">
.accounts40 {
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
