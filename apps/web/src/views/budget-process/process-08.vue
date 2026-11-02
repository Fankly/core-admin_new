<template>
  <div class="genMater" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>通用物资执行明细表</h2>
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
        <el-form label-position="left" label-width="100px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="采购申请号:">
                <copyTextBox class="formWidth" ref="caigou"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="采购订单号:">
                <copyTextBox class="formWidth" ref="ebelns"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="需求上报日期:">
                <el-date-picker
                  v-model="dataList.sbMonth"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="经法合同编号:">
                <copyTextBox class="formWidth" ref="htbhs"></copyTextBox>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目类型:">
                <projectType class="formWidth" ref="type" style="width: 100%"></projectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="中标日期:">
                <el-date-picker
                  v-model="dataList.zbMonth"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="经法合同名称:">
                <el-input class="formWidth" v-model="dataList.htmc"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位:">
                <affiliatedUnit class="formWidth" ref="company" style="width: 100%"></affiliatedUnit>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="取值逻辑：">
                <el-switch v-model="remarks" active-text="开" inactive-text="关" @change="remarksbtn" />
              </el-form-item>
            </el-col>
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
      row-key="row_id"
      id="crTable"
      :key="tableKey"
      stripe
      border
      :data="example"
      @row-dblclick="clickJump"
      v-if="tableHeight"
      :height="tableHeight"
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column
        :width="item.width"
        v-for="(item, index) in dropCol"
        :key="item.prop"
        class-name="dropTableColumn"
        :prop="item.prop"
        :label="item.label"
        header-align="center"
        align="center"
      ></el-table-column>
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
import { markRaw as markElementIconRaw, reactive, toRef, nextTick, reactive as reactiveLocal, toRefs, onMounted, useTemplateRef } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from '@/store/business'
import Sortable from 'sortablejs'
import { showHelpMsg } from '@/utils/message'
import { getConfigDetail } from '@/api/menu/menuConfig'
import { getMaxLength } from '@/utils/utils'
import { useRouter } from 'vue-router'
defineOptions({
  name: '/budget-process/process-08'
})
const router = useRouter()
const caigouRef = useTemplateRef('caigou')
const htbhsRef = useTemplateRef('htbhs')
const ebelnsRef = useTemplateRef('ebelns')
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
  tableMsg: [],
  remarks: false,
  helpHandle,
  store,
  tableKey: 0,
  example: [],
  dropCol: [
    {
      label: '采购申请号',
      prop: 'banfn'
    },
    {
      label: '采购申请行项目号',
      prop: 'bnfpo'
    },
    {
      label: '采购订单号',
      prop: 'ebeln'
    },
    {
      label: '采购订单行项目号',
      prop: 'ebelp'
    },
    {
      label: '合同属性',
      prop: 'zhtsx'
    },
    {
      label: '经法合同编码',
      prop: 'htbh'
    },
    {
      label: '经法合同名称',
      prop: 'zhtmc'
    },
    {
      label: '合同行项目号',
      prop: 'hthxm'
    },
    {
      label: '计划批次号',
      prop: 'zzbpc'
    },
    {
      label: '计划批次名称',
      prop: 'zzbpcmc'
    },
    {
      label: '项目类型',
      prop: 'zprxmlx'
    },
    {
      label: '一级单位',
      prop: 'qkjyjdw_name'
    },
    {
      label: '二级单位',
      prop: 'qkjejdw_name'
    },
    {
      label: '需求上报日期',
      prop: 'zhzsj'
    },
    {
      label: '中标日期',
      prop: 'zdate'
    },
    {
      label: '招标金额 ',
      prop: 'preis'
    },
    {
      label: '中标金额',
      prop: 'zhszj'
    },
    {
      label: '合同金额',
      prop: 'htje'
    },
    {
      label: '物资到货金额',
      prop: 'zwzdhje'
    },
    {
      label: '物资领用金额',
      prop: 'zwzlyje'
    },
    {
      label: '物资领用金额（不含税）',
      prop: 'zwzlyje_bhs'
    }
  ],
  dataList: {
    sbMonth: '',
    zbMonth: '',
    banfn: '',
    bnfpo: '',
    htmc: ''
  },
  fn: [],
  po: [],
  //搜索区域显示与隐藏
  searchShow: true,
  tableHeight: '',
  topHeight: '',
  heightNum: '',
  searchHeight: '',
  page: {
    total: 0,
    limit: 50,
    page: 1,
    current: '1'
  },
  loading: false,
  userCode: '',
  userId: '',
  specialorgid: ''
})
const tableMsg = toRef(setupState, 'tableMsg')
const remarks = toRef(setupState, 'remarks')
const tableKey = toRef(setupState, 'tableKey')
const example = toRef(setupState, 'example')
const dropCol = toRef(setupState, 'dropCol')
const dataList = toRef(setupState, 'dataList')
const fn = toRef(setupState, 'fn')
const po = toRef(setupState, 'po')
const searchShow = toRef(setupState, 'searchShow')
const tableHeight = toRef(setupState, 'tableHeight')
const topHeight = toRef(setupState, 'topHeight')
const heightNum = toRef(setupState, 'heightNum')
const searchHeight = toRef(setupState, 'searchHeight')
const page = toRef(setupState, 'page')
const loading = toRef(setupState, 'loading')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
const componentData = reactiveLocal({})
componentData.sortable = undefined
const sortable = toRef(componentData, 'sortable')
function compTableWidth() {
  const tableData = setupState.example
  setupState.dropCol = setupState.dropCol.map((value) => {
    const arr = tableData.map((item) => {
      return item[value.prop]
    })
    arr.push(value.label)
    let width = getMaxLength(arr)
    if (value.prop === 'zzbpcmc' || value.prop === 'zhtmc') {
      value.width = 320
    } else {
      value.width = Math.round(width + 20)
    }
    return value
  })
}
function remarksbtn(val) {
  if (val) {
    getConfigDetail(setupState.store.getters.getMenuMsg.url).then((res) => {
      if (res.success) {
        if (res.data) {
          setupState.tableMsg = res.data
        }
      } else {
        ElMessage.error(res.msg)
      }
    })
  }
  loadData()
}
function columnDrop() {
  const wrapperTr = document.getElementById('crTable').querySelector('.el-table__header-wrapper tr')
  componentData.sortable = Sortable.create(wrapperTr, {
    animation: 180,
    delay: 0,
    draggable: '.dropTableColumn',
    onEnd: (evt) => {
      const oldItem = setupState.dropCol[evt.oldIndex]
      setupState.dropCol.splice(evt.oldIndex, 1)
      setupState.dropCol.splice(evt.newIndex, 0, oldItem)
      setupState.tableKey += 1
      nextTick(() => {
        columnDrop()
      })
    }
  })
}
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
    banfns: [],
    // bnfpos: [],
    qkjejdws: [],
    zprxmlxs: [],
    // zzbpc: this.dataList.zzbpc,
    szhzsj: '',
    ezhzsj: '',
    szdate: '',
    ezdate: '',
    htmc: setupState.dataList.htmc,
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  //采购申请号
  params.banfns = caigouRef.value.newArr
  // 采购合同编号
  params.htbhs = htbhsRef.value.array
  // 采购订单号
  params.ebelns = ebelnsRef.value.array
  //采购申请项目行
  // params.bnfpos = this.$refs.xmh.array;
  //项目类型
  params.zprxmlxs = typeRef.value.selectList
  //单位
  params.qkjejdws = companyRef.value.selectList

  //需求上报日期
  if (setupState.dataList.sbMonth) {
    params.szhzsj = setupState.dataList.sbMonth[0]
    params.ezhzsj = setupState.dataList.sbMonth[1]
  }
  //需求中标日期
  if (setupState.dataList.zbMonth) {
    params.szdate = setupState.dataList.zbMonth[0]
    params.ezdate = setupState.dataList.zbMonth[1]
  }
  baseService.post('/process/process08/', params).then((res) => {
    if (res.success == true) {
      setupState.loading = false
      setupState.example = res.data.records
      if (setupState.remarks) {
        setupState.example.unshift(...setupState.tableMsg)
      }
      compTableWidth()
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
function exportBtn() {
  setupState.loading = true
  const params = {
    banfns: [],
    // bnfpos: [],
    qkjejdws: [],
    zprxmlxs: [],
    htmc: setupState.dataList.htmc,
    // zzbpc: this.dataList.zzbpc,
    szhzsj: '',
    ezhzsj: '',
    szdate: '',
    ezdate: '',
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  //采购申请号
  params.banfns = caigouRef.value.newArr
  //采购申请项目行
  // params.bnfpos = this.$refs.xmh.array;
  //项目类型
  params.zprxmlxs = typeRef.value.selectList
  //单位
  params.qkjejdws = companyRef.value.selectList
  // 采购合同编号
  params.htbhs = htbhsRef.value.array
  // 采购订单号
  params.ebelns = ebelnsRef.value.array
  //采购申请项目行
  //项目类型
  // if (this.$refs.type.selectList.length > 0) {
  //   params.zprxmlxs = this.$refs.type.selectList;
  // } else {
  //   params.zprxmlxs = this.$refs.type.allId;
  // }
  // //单位
  // if (this.$refs.company.selectList.length > 0) {
  //   params.qkjejdws = this.$refs.company.selectList;
  // } else {
  //   params.qkjejdws = this.$refs.company.allId;
  // }
  //需求上报日期
  if (setupState.dataList.sbMonth) {
    params.szhzsj = setupState.dataList.sbMonth[0]
    params.ezhzsj = setupState.dataList.sbMonth[1]
  }
  //需求中标日期
  if (setupState.dataList.zbMonth) {
    params.szdate = setupState.dataList.zbMonth[0]
    params.ezdate = setupState.dataList.zbMonth[1]
  }
  baseService.export('/process/process08/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '通用物资执行明细表.xlsx'
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
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  setTableHeight()
}
//重置按钮
function reset() {
  setupState.remarks = false
  setupState.dataList.sbMonth = []
  setupState.dataList.zbMonth = []
  // this.dataList.zzbpc = "";
  setupState.dataList.banfn = ''
  setupState.dataList.bnfpo = ''
  typeRef.value.clear()
  companyRef.value.clear()
  caigouRef.value.clear()
  htbhsRef.value.clear()
  ebelnsRef.value.clear()
  setupState.dataList.htmc = ''
  // this.$refs.xmh.clear();
  setupState.example = []
  search()
}
//页面穿透
function clickJump(row) {
  router.push({
    path: './process-09',
    query: {
      banfn: row.banfn,
      specialorgid: setupState.specialorgid
    }
  })
}
function loadCompany() {
  setupState.loading = false
  setupState.specialorgid = parseInt(userDialogRef.value.specialorgid)
  companyRef.value.getAffiliatedUnit(setupState.specialorgid)
  columnDrop()
}
onMounted(() => {
  setupState.tableKey = 0
  setupState.topHeight = document.querySelector('.topBox').clientHeight
  setupState.heightNum = document.querySelector('.el-card').clientHeight
  setupState.searchHeight = document.querySelector('.search').clientHeight
  setTableHeight()
  setupState.loading = true
  userDialogRef.value.getUser()
  compTableWidth()
})
defineExpose({
  EpArrowDown,
  EpArrowUp,
  EpDownload,
  EpQuestionFilled,
  EpRefreshRight,
  EpSearch,
  tableMsg,
  remarks,
  helpHandle,
  store,
  tableKey,
  example,
  dropCol,
  dataList,
  fn,
  po,
  searchShow,
  tableHeight,
  topHeight,
  heightNum,
  searchHeight,
  page,
  loading,
  userCode,
  userId,
  specialorgid,
  compTableWidth,
  remarksbtn,
  columnDrop,
  setTableHeight,
  loadData,
  exportBtn,
  pageChangeHandle,
  limitChangeHandle,
  search,
  showSearch,
  reset,
  clickJump,
  loadCompany,
  ...toRefs(componentData)
})
</script>

<style lang="less" scoped>
.genMater {
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
