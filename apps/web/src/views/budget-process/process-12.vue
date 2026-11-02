<template>
  <div class="ganFra" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>通用服务执行明细表穿透</h2>
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
        <el-form label-position="left" label-width="110px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="采购申请号：">
                <copyTextBox class="formWidth" ref="cgsqh"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目编码：">
                <copyTextBox class="formWidth" ref="xmbm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="采购订单号：">
                <copyTextBox class="formWidth" ref="cgddh"></copyTextBox>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <el-input class="formWidth" v-model="dataList.xmmc"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="经法合同编号：">
                <copyTextBox class="formWidth" ref="jfhtbhzx"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <projectType class="formWidth" ref="type"></projectType>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
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
              <el-form-item label="经法合同名称">
                <el-input class="formWidth" v-model="dataList.jfhtmc"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目包名称：">
                <el-input class="formWidth" v-model="dataList.qkjxmb_mc" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="中标日期：">
                <el-date-picker
                  v-model="dataList.zzbsj"
                  value-format="YYYYMMDD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="执行协议编码：">
                <copyTextBox class="formWidth" ref="zxxybm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目性质：">
                <projectnature class="formWidth" ref="xmxz"></projectnature>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="取值逻辑：">
                <el-switch v-model="remarks" active-text="开" inactive-text="关" @change="remarksbtn" />
              </el-form-item>
            </el-col>
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
      border
      :data="example"
      v-if="tableHeight"
      :height="tableHeight"
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column
        :width="item.width"
        :key="item.prop"
        v-for="item in dropCol"
        class-name="dropTableColumn"
        :prop="item.prop"
        :label="item.label"
      />
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
import { markRaw as markElementIconRaw, reactive, toRef, nextTick, reactive as reactiveLocal, toRefs, onMounted, useTemplateRef } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import Centralized from '@/components/select/Centralized.vue'
import projectnature from '@/components/select/projectnature.vue'
import { useStore } from '@/store/business'
import Sortable from 'sortablejs'
import { showHelpMsg } from '@/utils/message'
import { getConfigDetail } from '@/api/menu/menuConfig'
import { getMaxLength } from '@/utils/utils'
import { useRoute } from 'vue-router'
defineOptions({
  name: '/budget-process/process-12'
})
const route = useRoute()
const xmxzRef = useTemplateRef('xmxz')
const cgsqhRef = useTemplateRef('cgsqh')
const xmbmRef = useTemplateRef('xmbm')
const companyRef = useTemplateRef('company')
const cgddhRef = useTemplateRef('cgddh')
const gkbmRef = useTemplateRef('gkbm')
const jfhtbhzxRef = useTemplateRef('jfhtbhzx')
const typeRef = useTemplateRef('type')
const zxxybmRef = useTemplateRef('zxxybm')
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
  tableKey: 0,
  store,
  remarks: false,
  helpHandle,
  searchShow: true,
  dataList: {
    xmmc: '',
    time: '',
    zhzsj: '',
    jfhtmc: '',
    zzbsj: '',
    qkjxmb_mc: ''
  },
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
      label: '合同类型（ECP）',
      prop: 'con_type'
    },
    {
      label: 'ERP框架协议号',
      prop: 'zebeln'
    },
    {
      label: '经法合同编码',
      prop: 'zhtbh'
    },
    {
      label: '经法合同名称',
      prop: 'zhtmc1'
    },
    {
      label: '需求上报日期',
      prop: 'zhzsj'
    },
    {
      label: '中标日期',
      prop: 'zzbsj'
    },
    {
      label: '招标金额',
      prop: 'zbje'
    },
    {
      label: '中标金额',
      prop: 'zhszj'
    },
    {
      label: '合同金额',
      prop: 'zhtje'
    },
    {
      label: '执行协议编码',
      prop: 'zhtbh_xy'
    },
    {
      label: '执行协议名称',
      prop: 'zhtmc1_xy'
    },
    {
      label: '执行协议金额',
      prop: 'zhtje_xy'
    },
    {
      label: '项目编码',
      prop: 'pspid'
    },
    {
      label: '采购申请',
      prop: 'banfn_xy'
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
      label: '项目名称',
      prop: 'post1'
    },
    {
      label: '项目类型',
      prop: 'qkjxmlxbm'
    },
    {
      label: '项目包',
      prop: 'qkjxmb'
    },
    {
      label: '项目性质',
      prop: 'zjsjd_mc'
    },
    {
      label: '一级单位',
      prop: 'qkjyjdw'
    },
    {
      label: '二级单位',
      prop: 'qkjejdw'
    },
    {
      label: '归口部门',
      prop: 'qkjgkbm'
    },
    {
      label: '年度预算',
      prop: 'erpjdys'
    },
    {
      label: '当年财务支出（含税）',
      prop: 'ndzc_hs'
    },
    {
      label: '当年财务支出（不含税）',
      prop: 'ndzcb_hs'
    },
    {
      label: '服务确认金额',
      prop: 'menge'
    },
    {
      label: '服务确认金额（不含税）',
      prop: 'dmbtr'
    },
    {
      label: '合同金额备注',
      prop: 'zhtjebz'
    }
  ],
  tableHeight: '',
  topHeight: '',
  heightNum: '',
  searchHeight: '',
  loading: false,
  page: {
    total: 0,
    limit: 10,
    page: 1,
    current: 1
  },
  userCode: '',
  userId: '',
  specialorgid: '',
  tableMsg: []
})
const tableKey = toRef(setupState, 'tableKey')
const remarks = toRef(setupState, 'remarks')
const searchShow = toRef(setupState, 'searchShow')
const dataList = toRef(setupState, 'dataList')
const example = toRef(setupState, 'example')
const dropCol = toRef(setupState, 'dropCol')
const tableHeight = toRef(setupState, 'tableHeight')
const topHeight = toRef(setupState, 'topHeight')
const heightNum = toRef(setupState, 'heightNum')
const searchHeight = toRef(setupState, 'searchHeight')
const loading = toRef(setupState, 'loading')
const page = toRef(setupState, 'page')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
const tableMsg = toRef(setupState, 'tableMsg')
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
    if (value.prop === 'zhtmc1' || value.prop === 'zhtmc1_xy' || value.prop === 'post1' || value.prop === 'qkjxmb') {
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
  const wrapperTr = document.getElementById('crTable')?.querySelector('.el-table__header-wrapper tr')
  if (!wrapperTr) return
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
    pspids: [],
    qkjejdws: [],
    ebelns: [],
    post1: setupState.dataList.xmmc,
    gkbms: [],
    zhtbhs_jf: [],
    zhzsj_begin: '',
    zhzsj_end: '',
    zhtmc1_jf: setupState.dataList.jfhtmc,
    qkjxmbs: setupState.dataList.qkjxmb_mc,
    zzbsj_begin: '',
    zzbsj_end: '',
    zprxmlxs: [],
    zjsjds: xmxzRef.value.value,
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  //采购申请号
  if (cgsqhRef.value) {
    params.banfns = cgsqhRef.value.newArr
  }
  //项目编码
  if (xmbmRef.value) {
    params.pspids = xmbmRef.value.array
  }
  //所属单位
  if (companyRef.value) {
    params.qkjejdws = companyRef.value.selectList
  }
  //采购订单号
  if (cgddhRef.value) {
    params.ebelns = cgddhRef.value.array
  }
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  //经法合同编号
  if (jfhtbhzxRef.value) {
    params.zhtbhs_jf = jfhtbhzxRef.value.array
  }
  //项目类型
  if (typeRef.value) {
    params.zprxmlxs = typeRef.value.selectList
  }
  //需求上报日期
  if (setupState.dataList.zhzsj) {
    params.zhzsj_begin = setupState.dataList.zhzsj[0]
    params.zhzsj_end = setupState.dataList.zhzsj[1]
  }
  //项目包
  // if (this.$refs.xmb) {
  //   params.qkjxmbs = this.$refs.xmb.array;
  // }
  //中标日期
  if (setupState.dataList.zzbsj) {
    params.zzbsj_begin = setupState.dataList.zzbsj[0]
    params.zzbsj_end = setupState.dataList.zzbsj[1]
  }
  //执行协议编码
  if (zxxybmRef.value) {
    params.zhtbhs_zx = zxxybmRef.value.array
  }
  if (route.query.banfn && route.query.bnfpo) {
    params.banfn = route.query.banfn
    params.bnfpo = route.query.bnfpo
  }
  baseService.post('/process/process12/', params).then((res) => {
    if (res.success == true) {
      setupState.loading = false
      setupState.example = res.data.records
      if (setupState.remarks) {
        setupState.example.unshift(...setupState.tableMsg)
      }
      setupState.page.total = res.data.total
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
    banfns: [],
    pspids: [],
    qkjejdws: [],
    ebelns: [],
    post1: setupState.dataList.xmmc,
    gkbms: [],
    zhtbhs_jf: [],
    zhzsj_begin: '',
    zhzsj_end: '',
    zhtmc1_jf: setupState.dataList.jfhtmc,
    qkjxmbs: setupState.dataList.qkjxmb_mc,
    zzbsj_begin: '',
    zzbsj_end: '',
    zprxmlxs: [],
    zjsjds: xmxzRef.value.value,
    page: setupState.page.page,
    limit: setupState.page.limit,
    specialorgid: setupState.specialorgid
  }
  //采购申请号
  if (cgsqhRef.value) {
    params.banfns = cgsqhRef.value.newArr
  }
  //项目编码
  if (xmbmRef.value) {
    params.pspids = xmbmRef.value.array
  }
  //所属单位
  if (companyRef.value) {
    params.qkjejdws = companyRef.value.selectList
  }
  //采购订单号
  if (cgddhRef.value) {
    params.ebelns = cgddhRef.value.array
  }
  //归口部门
  params.gkbms = gkbmRef.value.selectList
  //经法合同编号
  if (jfhtbhzxRef.value) {
    params.zhtbhs_jf = jfhtbhzxRef.value.array
  }
  //项目类型
  if (typeRef.value) {
    params.zprxmlxs = typeRef.value.selectList
  }
  //需求上报日期
  if (setupState.dataList.zhzsj) {
    params.zhzsj_begin = setupState.dataList.zhzsj[0]
    params.zhzsj_end = setupState.dataList.zhzsj[1]
  }
  // //项目包
  // if (this.$refs.xmb) {
  //   params.qkjxmbs = this.$refs.xmb.array;
  // }
  //中标日期
  if (setupState.dataList.zzbsj) {
    params.zzbsj_begin = setupState.dataList.zzbsj[0]
    params.zzbsj_end = setupState.dataList.zzbsj[1]
  }
  //执行协议编码
  if (zxxybmRef.value) {
    params.zhtbhs_zx = zxxybmRef.value.array
  }
  if (route.query.banfn && route.query.bnfpo) {
    params.banfn = route.query.banfn
    params.bnfpo = route.query.bnfpo
  }
  baseService.export('/process/process12/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '通用服务执行明细表穿透.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
}
//查询按钮
function search() {
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
//重置按钮
function reset() {
  setupState.remarks = false
  cgsqhRef.value.clear()
  xmbmRef.value.clear()
  companyRef.value.clear()
  cgddhRef.value.clear()
  setupState.dataList.xmmc = ''
  gkbmRef.value.clear()
  jfhtbhzxRef.value.clear()
  typeRef.value.clear()
  setupState.dataList.zhzsj = ''
  setupState.dataList.jfhtmc = ''
  setupState.dataList.qkjxmb_mc = ''
  setupState.dataList.zzbsj = ''
  zxxybmRef.value.clear()
  xmxzRef.value.clear()
  setupState.example = []
  setupState.page.total = 0
  setupState.page.limit = 10
  setupState.page.page = 1
  setupState.page.current = 1
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
  gkbmRef.value.getProjectType(setupState.specialorgid)
  columnDrop()
}
onMounted(() => {
  setupState.tableKey = 0
  setupState.topHeight = (document.querySelector('.topBox')?.clientHeight ?? 0)
  setupState.heightNum = (document.querySelector('.ds-workspace__viewport')?.clientHeight ?? window.innerHeight)
  setupState.searchHeight = (document.querySelector('.search')?.clientHeight ?? 0)
  setTableHeight()
  if (typeof route.query.specialorgid === 'string' && route.query.specialorgid) {
    // this.$refs.jfhtbhzx.ids = this.$route.query.zhtbh;
    // this.$refs.jfhtbhzx.text = this.$route.query.zhtbh;
    // this.$refs.jfhtbhzx.array.push(this.$route.query.zhtbh);
    cgsqhRef.value.ids = route.query.banfn
    cgsqhRef.value.text = route.query.banfn
    cgsqhRef.value.array.push(route.query.banfn)
    cgsqhRef.value.newArr.push(route.query.banfn)
    setupState.specialorgid = JSON.parse(route.query.specialorgid)
    loadData()
  } else {
    setupState.loading = true
    userDialogRef.value.getUser()
  }
  compTableWidth()
})
defineExpose({
  EpArrowDown,
  EpArrowUp,
  EpDownload,
  EpQuestionFilled,
  EpRefreshRight,
  EpSearch,
  tableKey,
  store,
  remarks,
  helpHandle,
  searchShow,
  dataList,
  example,
  dropCol,
  tableHeight,
  topHeight,
  heightNum,
  searchHeight,
  loading,
  page,
  userCode,
  userId,
  specialorgid,
  tableMsg,
  compTableWidth,
  remarksbtn,
  columnDrop,
  setTableHeight,
  loadData,
  exportBtn,
  search,
  pageChangeHandle,
  limitChangeHandle,
  reset,
  showSearch,
  loadCompany,
  ...toRefs(componentData)
})
</script>

<style lang="less" scoped>
.ganFra {
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
