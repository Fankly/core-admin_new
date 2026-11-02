<template>
  <div class="accounts38" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>设备关联项目成本明细情况</h2>
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
              <el-form-item label="三级分类：">
                <el-select class="formWidth" v-model="sjflValue" clearable placeholder="请选择">
                  <el-option v-for="item in sjfl" :key="item.code" :label="item.name" :value="item.code"> </el-option>
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
              <el-form-item label="是否挂接设备：">
                <el-select class="formWidth" v-model="sfgjsb" placeholder="请选择" clearable>
                  <el-option v-for="item in selectList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="是否关联资产：">
                <el-select class="formWidth" v-model="sfglzc" placeholder="请选择" clearable>
                  <el-option v-for="item in selectList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="年度：">
                <el-date-picker v-model="year" value-format="YYYY" type="year" placeholder="选择年"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-button type="primary" :icon="EpSearch" style="margin-left: 120px" @click="loadData"> 查询 </el-button>
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
      <el-table-column fixed label="一级单位" prop="yjdwmc" width="200" v-if="columnObj.yjdw"> </el-table-column>
      <el-table-column fixed label="二级单位" prop="ejdwmc" width="200" v-if="columnObj.ejdw"> </el-table-column>
      <el-table-column label="PMS设备编号" prop="pmsbm" width="200" v-if="columnObj.pmssbbh"> </el-table-column>
      <el-table-column label="PMS设备名称" prop="pmsmc" width="200" v-if="columnObj.pmssbmc"> </el-table-column>
      <el-table-column label="国网项目编码" prop="gwxmbm" width="200" v-if="columnObj.gwxmbm"> </el-table-column>
      <el-table-column label="储备编码" prop="cbbm" width="200" v-if="columnObj.cbbm"> </el-table-column>
      <el-table-column label="项目名称" prop="xmmc" width="200" v-if="columnObj.xmmc"> </el-table-column>
      <el-table-column label="项目分类（三级分类）" prop="xmflmc" width="200" v-if="columnObj.xmfl"> </el-table-column>
      <el-table-column label="当年预算金额（万元）" prop="dnys" width="200" v-if="columnObj.dnysje"> </el-table-column>
      <el-table-column label="累计投入金额（万元）" prop="ljtr" width="200" v-if="columnObj.ljtrje"> </el-table-column>
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
import copyTextBox from '@/components/select/copyTextBox.vue'
import { showHelpMsg } from '@/utils/message'
defineOptions({
  name: '/budget-process/process-38'
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
      value: 'yjdw',
      label: '一级单位',
      checked: true
    },
    {
      value: 'ejdw',
      label: '二级单位',
      checked: true
    },
    {
      value: 'pmssbbh',
      label: 'PMS设备编号',
      checked: true
    },
    {
      value: 'pmssbmc',
      label: 'PMS设备名称',
      checked: true
    },
    {
      value: 'gwxmbm',
      label: '国网项目编码',
      checked: true
    },
    {
      value: 'cbbm',
      label: '储备编码',
      checked: true
    },
    {
      value: 'xmmc',
      label: '项目名称',
      checked: true
    },
    {
      value: 'xmfl',
      label: '项目分类（三级分类）',
      checked: true
    },
    {
      value: 'dnysje',
      label: '当年预算金额（万元）',
      checked: true
    },
    {
      value: 'ljtrje',
      label: '累计投入金额（万元）',
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
  spanArr2: [],
  // 用于存放需要合并的行的个数
  spanIndex: 0,
  // 记录spanArr数组的下标
  spanIndex1: 0,
  // 记录spanArr数组的下标
  spanIndex2: 0,
  // 记录spanArr数组的下标
  //一级单位
  yjdw: [],
  yjdwValue: '',
  //二级单位
  ejdw: [],
  ejdwValue: '',
  // 三级分类
  sjfl: [],
  sjflValue: '',
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
  // 是否挂接设备
  sfgjsb: '',
  // 是否关联资产
  sfglzc: '',
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
const spanArr2 = toRef(setupState, 'spanArr2')
const spanIndex = toRef(setupState, 'spanIndex')
const spanIndex1 = toRef(setupState, 'spanIndex1')
const spanIndex2 = toRef(setupState, 'spanIndex2')
const yjdw = toRef(setupState, 'yjdw')
const yjdwValue = toRef(setupState, 'yjdwValue')
const ejdw = toRef(setupState, 'ejdw')
const ejdwValue = toRef(setupState, 'ejdwValue')
const sjfl = toRef(setupState, 'sjfl')
const sjflValue = toRef(setupState, 'sjflValue')
const projectName = toRef(setupState, 'projectName')
const selectList = toRef(setupState, 'selectList')
const sfgjsb = toRef(setupState, 'sfgjsb')
const sfglzc = toRef(setupState, 'sfglzc')
const year = toRef(setupState, 'year')
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
    setupState.segmentIds.push(item.value)
    setupState.columnObj[item.value] = item.checked
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
  setupState.spanArr2 = []
  setupState.spanIndex = 0
  setupState.spanIndex1 = 0
  setupState.spanIndex2 = 0
  setupState.example = []
  setupState.loading = true
  let params = {
    specialorgid: setupState.specialorgid,
    page: setupState.page.page,
    limit: setupState.page.limit,
    yjdw: setupState.yjdwValue,
    ejdw: setupState.ejdwValue,
    sjfl: setupState.sjflValue,
    cbbms: cbbmRef.value.array,
    gwxmbms: gwxmbmRef.value.array,
    xmmc: setupState.projectName,
    sfgjsb: setupState.sfgjsb,
    sfglzc: setupState.sfglzc,
    nd: setupState.year
  }
  baseService.post('/process36/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.example = res.data.records
      setupState.page.total = res.data.total
      getSpanArr(setupState.example)
      getSpanArr1(setupState.example)
      getSpanArr2(setupState.example)
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
    sjfl: setupState.sjflValue,
    cbbms: cbbmRef.value.array,
    gwxmbms: gwxmbmRef.value.array,
    xmmc: setupState.projectName,
    sfgjsb: setupState.sfgjsb,
    sfglzc: setupState.sfglzc,
    nd: setupState.year
  }
  baseService.export('/process36/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '设备关联项目成本明细情况.xlsx'
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
      if (data[i].yjdw === data[i - 1].yjdw) {
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
      if (data[i].ejdw === data[i - 1].ejdw) {
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
function getSpanArr2(data) {
  let len = 0
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      len += 1
      setupState.spanArr2.push(1)
      setupState.spanIndex2 = 0
    } else {
      // 判断当前行与前一行内容是否相同
      if (data[i].pmsbm === data[i - 1].pmsbm) {
        setupState.spanArr2[setupState.spanIndex2] += 1 // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
        setupState.spanArr2.push(0) // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
        len += 1
      } else {
        len = 1
        setupState.spanArr2.push(1) // 否则，依旧是一行
        setupState.spanIndex2 = i
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
  } else if (columnIndex < 4) {
    const _row = setupState.spanArr2[rowIndex] // 行数
    const _col = _row > 0 ? 1 : 0 // 列数
    return {
      rowspan: _row,
      colspan: _col
    }
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
function reset() {
  setupState.page.page = 1
  setupState.page.limit = 10
  setupState.page.total = 0
  setupState.yjdwValue = ''
  setupState.ejdwValue = ''
  setupState.ejdw = []
  setupState.sjflValue = ''
  cbbmRef.value.clear()
  gwxmbmRef.value.clear()
  setupState.projectName = ''
  setupState.sfglzc = ''
  setupState.sfgjsb = ''
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
  //获取三级分类
  baseService.get('/commonCode/getSjfl').then((res) => {
    if (res.success) {
      setupState.sjfl = res.data
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
  spanArr2,
  spanIndex,
  spanIndex1,
  spanIndex2,
  yjdw,
  yjdwValue,
  ejdw,
  ejdwValue,
  sjfl,
  sjflValue,
  projectName,
  selectList,
  sfgjsb,
  sfglzc,
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
  getSpanArr2,
  objectSpanMethod,
  pageChangeHandle,
  limitChangeHandle,
  reset
})
</script>

<style lang="less" scoped>
.accounts38 {
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
