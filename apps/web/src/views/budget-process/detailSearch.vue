<template>
  <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  <div v-loading="loading" id="process_42" class="process process_42" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目明细查询</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon class="ep-icon-s-operation">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="dropdown-max">
                <el-dropdown-item v-for="item in columns" :key="item.value">
                  <el-checkbox v-model="item.checked" @change="listShow(item.columnKey, item.checked)">
                    {{ item.columnName }}
                  </el-checkbox>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span class="searchShow" v-if="searchShow === false" @click="showSearch(true)">
            <el-icon class="ep-icon-arrow-down"><EpArrowDown /></el-icon>
          </span>
          <span class="searchShow" @click="showSearch(false)" v-else>
            <el-icon class="ep-icon-arrow-up"><EpArrowUp /></el-icon>
          </span>
        </div>
      </div>

      <div class="search" v-if="searchShow">
        <el-form :inline="true" size="small" class="formStyle" label-position="right" :label-width="140">
          <el-row class="rowStyle">
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <copyTextBox ref="XMMC"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="一级分类：">
                <el-select v-model="searchData.YJFL" @change="getEjflData" clearable>
                  <el-option v-for="(item, index) in searchCombo.YJFL" :key="index" :label="item.label" :value="item"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="重点项目投向：">
                <el-select v-model="searchData.IMPORTANTITEMS" multiple collapse-tags>
                  <el-option v-for="(item, index) in searchCombo.IMPORTANTITEMS" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="电压等级：">
                <el-select v-model="searchData.DYDJ" clearable>
                  <el-option v-for="(item, index) in searchCombo.DYDJ" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="rowStyle">
            <el-col :span="6">
              <el-form-item label="国网项目编码：">
                <copyTextBox ref="GWXMBM"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="二级分类：">
                <el-select v-model="searchData.EJFL" @change="getSjflData" clearable>
                  <el-option v-for="(item, index) in searchCombo.EJFL" :key="index" :label="item.label" :value="item"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="资产性质：">
                <el-select v-model="searchData.ZCXZ" clearable>
                  <el-option v-for="(item, index) in searchCombo.ZCXZ" :key="index" :label="item.label" :value="item"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目执行状态：">
                <el-select v-model="searchData.CIRCUL_STATUS" clearable>
                  <el-option v-for="(item, index) in searchCombo.CIRCUL_STATUS" :key="index" :label="item.label" :value="item"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="rowStyle">
            <el-col :span="6">
              <el-form-item label="项目类型：" class="cacelDel">
                <el-select v-model="searchData.XmlxIDTreeValue" :teleported="false" multiple placeholder="请选择" collapse-tags>
                  <el-option :value="searchData.XMLXID" class="setstyle" disabled>
                    <el-tree
                      :data="searchCombo.XMLXID"
                      :props="xmlxProps"
                      ref="XmlxTree"
                      show-checkbox
                      :expand-on-click-node="false"
                      node-key="id"
                      check-on-click-node
                      @check-change="handleXmlxClick"
                    ></el-tree>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="三级分类：">
                <el-select v-model="searchData.SJFL" clearable>
                  <el-option v-for="(item, index) in searchCombo.SJFL" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="是否预安排项目：">
                <el-select v-model="searchData.PRE_ARR_STATUS" clearable>
                  <el-option v-for="(item, index) in searchCombo.PRE_ARR_STATUS" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目性质：">
                <el-select v-model="searchData.XMXZ" multiple>
                  <el-option v-for="(item, index) in searchCombo.XMXZ" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="rowStyle">
            <el-col :span="6">
              <el-form-item label="项目包类型：">
                <el-select v-model="searchData.JDDETYPE_TYPE" @change="setXmbmcData" clearable>
                  <el-option v-for="(item, index) in searchCombo.JDDETYPE_TYPE" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="立项时间：" class="date_width">
                <el-date-picker :editable="false" v-model="searchData.LXSJ_DATE" type="daterange" range-separator="至：" :size="size" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="研发经费投入统计范围：" :label-width="160">
                <el-select v-model="searchData.ZYFJFTRTJFW" clearable>
                  <el-option v-for="(item, index) in searchCombo.ZYFJFTRTJFW" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="rowStyle">
            <el-col :span="6">
              <el-form-item label="项目包名称：">
                <el-select v-model="searchData.XMBMC" multiple collapse-tags>
                  <el-option v-for="(item, index) in searchCombo.XMBMC" :key="index" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="预算期间：" class="budgetPeriod">
                <el-date-picker
                  @change="startChangeDateHandle"
                  :disabled-date="startDateDisableHandler"
                  :clearable="false"
                  :editable="false"
                  v-model="searchData.YSQJ_DATE_START"
                  type="date"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="至：" class="budgetPeriod">
                <el-date-picker
                  @change="endChangeDateHandle"
                  :disabled-date="endDateDisableHandler"
                  :clearable="false"
                  :editable="false"
                  v-model="searchData.YSQJ_DATE_END"
                  type="date"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="预期成果：">
                <el-select v-model="searchData.ZYQCGBM" clearable>
                  <el-option v-for="(item, index) in searchCombo.ZYQCGBM" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="rowStyle">
            <el-col :span="6">
              <el-form-item label="一二级单位：" class="cacelDel">
                <el-select v-model="searchData.DWID" :teleported="false" multiple placeholder="请选择" collapse-tags>
                  <el-option :value="searchData.DWIDTree" class="setstyle" disabled>
                    <el-tree
                      :data="searchCombo.DWList"
                      :props="defaultProps"
                      ref="DwTree"
                      show-checkbox
                      :expand-on-click-node="false"
                      node-key="id"
                      check-on-click-node
                      @check-change="handleDwClick"
                    ></el-tree>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6" class="completion">
              <el-form-item label="当年完成率（%）：">
                <el-select clearable v-model="searchData.NDYSWCL_START_QJ" @change="setYswclHandler">
                  <el-option v-for="(item, index) in searchCombo.NDYSWCL_START_QJ" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
                <el-input-number v-model="searchData.NDYSWCL_START_NUM" size="small" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="至：" class="completion">
                <el-select clearable :disabled="show_Yswcl" v-model="searchData.NDYSWCL_END_QJ">
                  <el-option v-for="(item, index) in searchCombo.NDYSWCL_END_QJ" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
                <el-input-number :disabled="show_Yswcl" v-model="searchData.NDYSWCL_END_NUM" size="small" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="是否安全生产：">
                <el-select clearable v-model="searchData.SFAQSC" placeholder="">
                  <el-option v-for="(item, index) in searchCombo.SFAQSC" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="rowStyle">
            <el-col :span="6">
              <el-form-item label="归口部门：" class="cacelDel">
                <el-select v-model="searchData.centerTreeValue" multiple placeholder="请选择" collapse-tags>
                  <el-option :value="searchData.centerId" class="setstyle" disabled>
                    <el-tree
                      :data="searchCombo.centerId"
                      :props="defaultProps"
                      ref="centerTree"
                      show-checkbox
                      :expand-on-click-node="false"
                      node-key="id"
                      check-on-click-node
                      @check-change="handleCenterClick"
                    ></el-tree>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6" class="completion">
              <el-form-item label="累计完成率（%）：">
                <el-select clearable v-model="searchData.XMLJWCL_START_QJ" @change="setXmljwclHandler">
                  <el-option v-for="(item, index) in searchCombo.XMLJWCL_START_QJ" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
                <el-input-number v-model="searchData.XMLJWCL_START_NUM" size="small" />
              </el-form-item>
            </el-col>
            <el-col :span="6" class="completion">
              <el-form-item label="至：">
                <el-select clearable v-model="searchData.XMLJWCL_END_QJ" :disabled="show_Ljwcl">
                  <el-option v-for="(item, index) in searchCombo.XMLJWCL_END_QJ" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
                <el-input-number :disabled="show_Ljwcl" v-model="searchData.XMLJWCL_END_NUM" size="small" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="重大项目：">
                <el-select v-model="searchData.ZDXM" clearable>
                  <el-option v-for="(item, index) in searchCombo.ZDXM" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="6">
              <el-form-item label="辞条名称：">
                <copyTextBox ref="CTMC"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="查询类型：">
                <el-radio-group v-model="searchData.searchType">
                  <template v-for="item in searchCombo.searchType" :key="item.value">
                    <el-radio size="small" :value="item.value">{{ item.label }}</el-radio>
                  </template>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="6" style="text-align: right; font-size: 12px">
              <el-button size="small" v-debounce="[loadData]" type="primary" :icon="EpSearch" style="margin-left: 90px"> 查询 </el-button>
              <el-button size="small" :icon="EpRefreshRight" @click="reset">重 置</el-button>
              <el-button size="small" v-debounce="[exportData]" type="warning" :icon="EpDownload">导 出</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
    <div class="content_table" ref="contentTables">
      <div class="content_table_center">
        <el-table
          ref="tableName"
          stripe
          border
          height="100%"
          :data="example"
          row-key="id"
          style="width: 100%; margin-top: 10px"
          :header-cell-style="{ 'text-align': 'center' }"
        >
          <template v-for="item in columns" :key="item.columnKey">
            <el-table-column
              v-if="item.columnKey === 'xmmc' && item.checked"
              :formatter="formatString"
              align="center"
              :show-overflow-tooltip="true"
              fixed
              width="300"
              :prop="item.columnKey"
              :label="item.columnName"
            />
            <el-table-column
              v-else-if="item.columnKey === 'gwxmbm' && item.checked"
              :formatter="formatString"
              align="center"
              :show-overflow-tooltip="true"
              fixed
              width="140"
              :prop="item.columnKey"
              :label="item.columnName"
            />
            <el-table-column
              v-else-if="isMoneyColumn(item) && item.checked"
              align="right"
              :formatter="formatMoney"
              :show-overflow-tooltip="true"
              width="200"
              :prop="item.columnKey"
              :label="item.columnName"
            />
            <el-table-column
              v-else-if="(item.columnKey === 'ndyswcl' || item.columnKey === 'xmljwcl') && item.checked"
              align="center"
              :formatter="formatBaiFeiBi"
              :show-overflow-tooltip="true"
              width="200"
              :prop="item.columnKey"
              :label="item.columnName"
            />
            <el-table-column
              v-else-if="item.columnKey && item.checked"
              :formatter="formatString"
              align="center"
              :show-overflow-tooltip="true"
              width="200"
              :prop="item.columnKey"
              :label="item.columnName"
            />
          </template>
        </el-table>
      </div>
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
  </div>
</template>

<script setup>
import {
  ArrowDown as EpArrowDown,
  ArrowUp as EpArrowUp,
  Download as EpDownload,
  RefreshRight as EpRefreshRight,
  Search as EpSearch
} from '@element-plus/icons-vue'
import {
  markRaw as markElementIconRaw,
  reactive,
  toRef,
  nextTick,
  reactive as reactiveLocal,
  toRefs,
  watch,
  onMounted,
  useTemplateRef
} from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from '@/store/business'
defineOptions({
  name: '/budget-process/process-42'
})
const tableNameRef = useTemplateRef('tableName')
const centerTreeRef = useTemplateRef('centerTree')
const XmlxTreeRef = useTemplateRef('XmlxTree')
const DwTreeRef = useTemplateRef('DwTree')
const userDialogRef = useTemplateRef('userDialog')
const contentTablesRef = useTemplateRef('contentTables')
const XMMCRef = useTemplateRef('XMMC')
const GWXMBMRef = useTemplateRef('GWXMBM')
const CTMCRef = useTemplateRef('CTMC')
const store = useStore()
const setupState = reactive({
  EpArrowDown: markElementIconRaw(EpArrowDown),
  EpArrowUp: markElementIconRaw(EpArrowUp),
  EpDownload: markElementIconRaw(EpDownload),
  EpRefreshRight: markElementIconRaw(EpRefreshRight),
  EpSearch: markElementIconRaw(EpSearch),
  store,
  show_Ljwcl: true,
  show_Yswcl: true,
  page: {
    total: 0,
    limit: 10,
    page: 1,
    current: '1'
  },
  isQuery: false,
  searchShow: true,
  segment: [],
  example: [],
  loading: false,
  userCode: '',
  userId: '',
  specialorgid: '',
  columnObj: {},
  searchData: {
    ZDXM: '',
    ND: new Date().getFullYear(),
    // 今天
    YSQJ_DATE_END: new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate(),
    YSQJ_DATE_START: new Date().getFullYear() + '-01-01',
    XMMC: '',
    YJFL: null,
    IMPORTANTITEMS: '',
    DYDJ: '',
    EJFL: null,
    SJFL: null,
    ZCXZ: '',
    XMLXID: [],
    XmlxIDTreeValue: [],
    PRE_ARR_STATUS: '',
    XMXZ: '',
    JDDETYPE_TYPE: '',
    LXSJ_DATE: '',
    XMBMC: '',
    ZYQCGBM: '',
    DWID: [],
    DWIDTree: [],
    NDYSWCL_START_NUM: '',
    NDYSWCL_START_QJ: '',
    NDYSWCL_END_NUM: '',
    NDYSWCL_END_QJ: '',
    SFAQSC: '',
    centerTreeValue: [],
    centerId: [],
    yjdw: '',
    ejdw: '',
    profit_center: '',
    apply_center: '',
    xmlx_id: '',
    roleCode: '',
    searchType: ''
  },
  columns: [],
  defaultProps: {
    children: 'children',
    label: 'text'
  },
  xmlxProps: {
    children: 'children',
    label: 'name'
  },
  searchCombo: {
    ZDXM: [],
    searchType: [],
    YJFL: [],
    IMPORTANTITEMS: [],
    DYDJ: [],
    EJFL: [],
    SJFL: [],
    ZCXZ: [],
    CIRCUL_STATUS: [
      {
        label: '已立项',
        value: '6'
      },
      {
        label: '已关闭',
        value: '8'
      }
    ],
    XMLXID: [],
    PRE_ARR_STATUS: [],
    XMXZ: [],
    JDDETYPE_TYPE: [],
    ZYFJFTRTJFW: [],
    XMBMC: [],
    ZYQCGBM: [],
    DWList: [],
    NDYSWCL_END_QJ: [],
    NDYSWCL_START_QJ: [],
    XMLJWCL_START_QJ: [],
    dateFlag: false,
    XMLJWCL_END_QJ: [],
    SFAQSC: []
  }
})
const show_Ljwcl = toRef(setupState, 'show_Ljwcl')
const show_Yswcl = toRef(setupState, 'show_Yswcl')
const page = toRef(setupState, 'page')
const isQuery = toRef(setupState, 'isQuery')
const searchShow = toRef(setupState, 'searchShow')
const segment = toRef(setupState, 'segment')
const example = toRef(setupState, 'example')
const loading = toRef(setupState, 'loading')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
const columnObj = toRef(setupState, 'columnObj')
const searchData = toRef(setupState, 'searchData')
const columns = toRef(setupState, 'columns')
const defaultProps = toRef(setupState, 'defaultProps')
const xmlxProps = toRef(setupState, 'xmlxProps')
const searchCombo = toRef(setupState, 'searchCombo')
const componentData = reactiveLocal({})
componentData.roleCode = undefined
const roleCode = toRef(componentData, 'roleCode')
function startChangeDateHandle(val) {
  // 如果设置val的年份和结束时间的年份不一致，就把结束时间设置为和开始时间一样的年份，把月份设置为12月，日期设置为31号
  if (setupState.searchData.YSQJ_DATE_END) {
    const endDate = new Date(setupState.searchData.YSQJ_DATE_END)
    if (val.getFullYear() !== endDate.getFullYear()) {
      endDate.setFullYear(val.getFullYear())
      endDate.setMonth(11)
      endDate.setDate(31)
      setupState.searchData.YSQJ_DATE_END = endDate
      // 设置年度
      setupState.searchData.ND = val.getFullYear()
    }
  }
}
function endChangeDateHandle(val) {
  // 如果设置val的年份和开始时间的年份不一致，就把开始时间设置为和结束时间一样的年份，把月份设置为1月，日期设置为1号
  if (setupState.searchData.YSQJ_DATE_START) {
    const startDate = new Date(setupState.searchData.YSQJ_DATE_START)
    if (val.getFullYear() !== startDate.getFullYear()) {
      startDate.setFullYear(val.getFullYear())
      startDate.setMonth(0)
      startDate.setDate(1)
      setupState.searchData.YSQJ_DATE_START = startDate
      // 设置年度
      setupState.searchData.ND = val.getFullYear()
    }
  }
}
function startDateDisableHandler(time) {
  if (setupState.searchData.YSQJ_DATE_END) {
    return time.getTime() > new Date(setupState.searchData.YSQJ_DATE_END).getTime()
  } else {
    return false
  }
}
function endDateDisableHandler(time) {
  if (setupState.searchData.YSQJ_DATE_START) {
    return time.getTime() < new Date(setupState.searchData.YSQJ_DATE_START).getTime()
  } else {
    return false
  }
}
function getComboData(combo, values) {
  const params = {
    codes: values
  }
  baseService.post('process40/getComCodeByCode/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      const data = res.data
      for (let key in res.data) {
        switch (key) {
          case 'QUERYTYPE':
            // 设置查询类型默认值
            setupState.searchData.searchType = data[key][0].code
            setupState.searchCombo.searchType = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'GY_TJFH':
            setupState.searchCombo.NDYSWCL_START_QJ = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            setupState.searchCombo.XMLJWCL_START_QJ = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'DETAIL_IMPORTANTITEMS':
            setupState.searchCombo.IMPORTANTITEMS = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'ZYQCGBM_COM':
            setupState.searchCombo.ZYQCGBM = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'ZYFJFTRTJFW_COM':
            setupState.searchCombo.ZYFJFTRTJFW = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'SFAQSC':
            setupState.searchCombo.SFAQSC = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'PRE_ARR_STATUS':
            setupState.searchCombo.PRE_ARR_STATUS = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'XMXZ':
            setupState.searchCombo.XMXZ = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'XMBTYPE_COM':
            setupState.searchCombo.JDDETYPE_TYPE = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'DYDJ':
            setupState.searchCombo.DYDJ = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'ZCXZ':
            setupState.searchCombo.ZCXZ = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'ZDXM_COM':
            setupState.searchCombo.ZDXM = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
        }
      }
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function handleGetCenter(val) {
  setupState.loading = true
  if (val) {
    const params = {
      parentCode: 'CBZX',
      rootCode: val,
      objId: -1,
      level: 0
    }
    setupState.searchCombo.centerId = []
    setupState.searchData.centerId = []
    setupState.searchData.centerTreeValue = []
    setupState.searchData.profit_center = ''
    setupState.searchData.apply_center = ''
    // 重置归口部门
    baseService.post('process40/getTreeNodeCbzx/', params).then((res) => {
      if (res.success) {
        if (res.data) {
          setupState.searchCombo.centerId = res.data
        }
        setupState.loading = false
      } else {
        setupState.loading = false
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
  } else {
    setupState.loading = false
    getCbzxData()
  }
}
function getDynamicColumn() {
  // 获取用户id
  const id = setupState.store.getters.getUserMsg.id
  setupState.loading = true
  baseService.get(`process40/getDynamicColumn?userId=${id}`).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.columns = res.data.map((item) => {
        return {
          columnKey: item.columnKey,
          columnName: item.columnName,
          checked: true
        }
      })
      // 重新按照上面el-table-column的顺序排序
      nextTick(() => {
        tableNameRef.value.doLayout()
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
function isMoneyColumn(item) {
  const moneyColumn = [
    'dntzjh',
    'year_invest_tax',
    'dnys',
    'dncwzc',
    'dnsj',
    'dnwcz',
    'ztzjh',
    'all_invest_tax',
    'yqljtzjh',
    'amount',
    'ljfsz',
    'ljsj',
    'ljwcz',
    'jyys',
    'scwysys',
    'ywwbje',
    'wbrgcb',
    'zjgcye',
    'zjgckpye',
    'ljzzje'
  ]
  return moneyColumn.includes(item.columnKey)
}
function formatString(row, column, cellValue, index) {
  if (cellValue) {
    return cellValue
  } else {
    return '-'
  }
}
function formatBaiFeiBi(row, column, cellValue, index) {
  if (cellValue) {
    return cellValue.toFixed(2) + '%'
  } else {
    return '0.00%'
  }
}
function formatMoney(row, column, cellValue, index) {
  if (cellValue) {
    return cellValue.toFixed(4)
  } else {
    return '0.0000'
  }
}
function getXmlxData() {
  let startDate = new Date().getFullYear()
  if (setupState.searchData.ND) {
    startDate = setupState.searchData.ND
  }
  setupState.loading = true
  const params = {
    parentId: '0',
    startDate: startDate
  }
  setupState.searchCombo.centerId = []
  setupState.searchData.XMLXID = [] //置空
  setupState.searchData.XmlxIDTreeValue = []
  setupState.searchData.xmlx_id = ''
  setupState.searchCombo.XMLXID = []
  baseService.post('process40/getProTypeTreeNode/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.searchCombo.XMLXID = res.data
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function getCbzxData() {
  setupState.loading = true
  const params = {
    parentCode: null,
    rootCode: 'childtree:CBZX',
    objId: -1,
    level: 0
  }
  setupState.searchCombo.centerId = []
  baseService.post('process40/getTreeNodeCbzx/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.searchCombo.centerId = res.data
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function getYjdwOrEjdwData() {
  setupState.loading = true
  const params = {
    parentCode: null,
    rootCode: 'childtree:DW_COM',
    objId: -1,
    level: 0
  }
  setupState.searchCombo.DWList = []
  baseService.post('process40/getTreeNode/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.searchCombo.DWList = res.data
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function setXmljwclHandler(data) {
  setupState.searchCombo.XMLJWCL_END_QJ = []
  setupState.searchData.XMLJWCL_END_QJ = ''
  setupState.searchData.XMLJWCL_END_NUM = undefined
  if (data === '>' || data === '>=') {
    setupState.show_Ljwcl = false
    setupState.searchCombo.XMLJWCL_END_QJ.push(
      {
        label: '<',
        value: '<'
      },
      {
        label: '<=',
        value: '<='
      }
    )
  } else if (data === '<' || data === '<=') {
    setupState.show_Ljwcl = false
    setupState.searchCombo.XMLJWCL_END_QJ.push(
      {
        label: '>',
        value: '>'
      },
      {
        label: '>=',
        value: '>='
      }
    )
  } else {
    setupState.show_Ljwcl = true
  }
}
function setYswclHandler(data) {
  setupState.searchCombo.NDYSWCL_END_QJ = []
  setupState.searchData.NDYSWCL_END_QJ = ''
  setupState.searchData.NDYSWCL_END_NUM = undefined
  if (data === '>' || data === '>=') {
    setupState.searchCombo.NDYSWCL_END_QJ.push(
      {
        label: '<',
        value: '<'
      },
      {
        label: '<=',
        value: '<='
      }
    )
    setupState.show_Yswcl = false
  } else if (data === '<' || data === '<=') {
    setupState.searchCombo.NDYSWCL_END_QJ.push(
      {
        label: '>',
        value: '>'
      },
      {
        label: '>=',
        value: '>='
      }
    )
    setupState.show_Yswcl = false
  } else {
    setupState.show_Yswcl = true
  }
}
function setXmbmcData() {
  setupState.searchCombo.XMBMC = []
  setupState.searchData.XMBMC = []
  getXmbmcData()
}
function getXmbmcData() {
  setupState.loading = true
  let str = ''
  if (setupState.searchData.XMXZ && setupState.searchData.XMXZ.length > 0) {
    str = setupState.searchData.XMXZ.join(',')
  }
  const params = {
    year: setupState.searchData.ND,
    xmlx: setupState.searchData.xmlx_id,
    xmblx: setupState.searchData.JDDETYPE_TYPE,
    xmxz: str,
    sjfl: setupState.searchData.SJFL,
    xmbid: ''
  }
  baseService.post('process40/getXmbArr/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.searchCombo.XMBMC = res.data
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function getYjflData() {
  setupState.loading = true
  const params = {
    rootCode: 'GWXMFL'
  }
  baseService.post('process40/getRootComCode/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      res.data.forEach((item) => {
        setupState.searchCombo.YJFL.push({
          value: item.code,
          label: item.name,
          id: item.id
        })
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
function handleCenterClick(data, self, child) {
  let datalist = centerTreeRef.value.getCheckedNodes()
  setupState.searchData.centerId = [] //置空
  setupState.searchData.centerTreeValue = []
  setupState.searchData.profit_center = ''
  setupState.searchData.apply_center = ''
  datalist.forEach((item) => {
    if (item.level == '1') {
      setupState.searchData.profit_center += item.objCode + ','
    } else if (item.level == '2') {
      setupState.searchData.apply_center += item.objCode + ','
    }
    setupState.searchData.centerId.push({
      id: item.id,
      label: item.text
    })
    setupState.searchData.centerTreeValue.push(item.text)
  })
  setupState.searchData.profit_center = setupState.searchData.profit_center.substring(0, setupState.searchData.profit_center.length - 1)
  setupState.searchData.apply_center = setupState.searchData.apply_center.substring(0, setupState.searchData.apply_center.length - 1)
}
// 获取项目类型数据
function handleXmlxClick(data, self, child) {
  let datalist = XmlxTreeRef.value.getCheckedNodes()
  setupState.searchData.XMLXID = [] //置空
  setupState.searchData.XmlxIDTreeValue = []
  setupState.searchData.xmlx_id = ''
  datalist.forEach((item) => {
    setupState.searchData.xmlx_id += item.code + ','
    setupState.searchData.XMLXID.push({
      id: item.id,
      label: item.name
    })
    setupState.searchData.XmlxIDTreeValue.push(item.name)
  })
  setupState.searchData.xmlx_id = setupState.searchData.xmlx_id.substring(0, setupState.searchData.xmlx_id.length - 1)
}
function getSjflData(selectedData) {
  setupState.searchCombo.SJFL = []
  setupState.searchData.SJFL = null
  if (selectedData && selectedData.id) {
    setupState.loading = true
    const params = {
      parentId: selectedData.id
    }
    baseService.post('process40/getComCodeByParent/', params).then((res) => {
      if (res.success) {
        setupState.loading = false
        res.data.forEach((item) => {
          setupState.searchCombo.SJFL.push({
            value: item.code,
            label: item.name,
            id: item.id
          })
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
}
function getEjflData(selectedData) {
  setupState.searchCombo.EJFL = []
  setupState.searchCombo.SJFL = []
  setupState.searchData.EJFL = null
  setupState.searchData.SJFL = null
  if (selectedData && selectedData.id) {
    setupState.loading = true
    const params = {
      parentId: selectedData.id
    }
    baseService.post('process40/getComCodeByParent/', params).then((res) => {
      if (res.success) {
        setupState.loading = false
        res.data.forEach((item) => {
          setupState.searchCombo.EJFL.push({
            value: item.code,
            label: item.name,
            id: item.id
          })
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
}
function handleDwClick(data, self, child) {
  let datalist = DwTreeRef.value.getCheckedNodes()
  setupState.searchData.DWID = [] //置空
  setupState.searchData.DWIDTree = []
  setupState.searchData.yjdw = ''
  setupState.searchData.ejdw = ''
  datalist.forEach((item) => {
    if (item.level == '1') {
      setupState.searchData.yjdw += item.objCode + ','
    } else if (item.level == '2') {
      setupState.searchData.ejdw += item.objCode + ','
    }
    setupState.searchData.DWIDTree.push({
      id: item.id,
      label: item.text
    })
    setupState.searchData.DWID.push(item.text)
  })
  setupState.searchData.yjdw = setupState.searchData.yjdw.substring(0, setupState.searchData.yjdw.length - 1)
  setupState.searchData.ejdw = setupState.searchData.ejdw.substring(0, setupState.searchData.ejdw.length - 1)
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
function loadCompany() {
  setupState.loading = false
  setupState.specialorgid = parseInt(userDialogRef.value.specialorgid)
  componentData.roleCode = parseInt(userDialogRef.value.roleCode)
  setupState.isQuery = userDialogRef.value.isQuery
  if (setupState.isQuery) {
    const processHtml = document.querySelector('.process_42')
    processHtml.style.display = 'block'
  }
}
//项目环节
function listShow(value, checked) {
  setupState.columns.forEach((item) => {
    if (item.columnKey === value) {
      item.checked = checked
    }
  })
}
function setTableHeight() {
  if (setupState.searchShow == true) {
    contentTablesRef.value.style.height = 'calc(100% - 280px)'
  } else {
    contentTablesRef.value.style.height = 'calc(100% - 17px)'
  }
}
//处理环节数据
function handleColumn() {
  setupState.segment.forEach((item) => {
    setupState.columnObj[item.value] = item.checked
  })
}
//搜索按钮
function loadData() {
  setupState.loading = true
  if (XMMCRef.value.array.length > 0) {
    setupState.searchData.XMMC = XMMCRef.value.array.join(',')
  } else {
    setupState.searchData.XMMC = ''
  }
  let yjfl = ''
  if (setupState.searchData.YJFL && setupState.searchData.YJFL.value) {
    yjfl = setupState.searchData.YJFL.value
  }
  let importantitems = ''
  if (setupState.searchData.IMPORTANTITEMS) {
    importantitems = setupState.searchData.IMPORTANTITEMS.join(',')
  }
  if (GWXMBMRef.value.array.length > 0) {
    setupState.searchData.GWXMBM = GWXMBMRef.value.array.join(',')
  } else {
    setupState.searchData.GWXMBM = ''
  }
  let ejfl = ''
  if (setupState.searchData.EJFL && setupState.searchData.EJFL.value) {
    ejfl = setupState.searchData.EJFL.value
  }
  let zcxz = ''
  if (setupState.searchData.ZCXZ && setupState.searchData.ZCXZ.value) {
    zcxz = setupState.searchData.ZCXZ.value
  }
  if (CTMCRef.value.array.length > 0) {
    setupState.searchData.CTMC = CTMCRef.value.array.join(',')
  } else {
    setupState.searchData.CTMC = ''
  }
  let LXSJ_START_DATE = ''
  let LXSJ_END_DATE = ''
  if (setupState.searchData.LXSJ_DATE) {
    LXSJ_START_DATE = formatDate(setupState.searchData.LXSJ_DATE[0])
    LXSJ_END_DATE = formatDate(setupState.searchData.LXSJ_DATE[1])
  }
  let startMonth = ''
  let endMonth = ''
  if (setupState.searchData.YSQJ_DATE_END && setupState.searchData.YSQJ_DATE_START) {
    startMonth = new Date(setupState.searchData.YSQJ_DATE_START).getMonth() + 1
    endMonth = new Date(setupState.searchData.YSQJ_DATE_END).getMonth() + 1
  }
  let xmbmc = ''
  if (setupState.searchData.XMBMC) {
    xmbmc = setupState.searchData.XMBMC.join(',')
  }
  let xmxz = ''
  if (setupState.searchData.XMXZ) {
    xmxz = setupState.searchData.XMXZ.join(',')
  }
  let circul_status = ''
  if (setupState.searchData.CIRCUL_STATUS) {
    circul_status = setupState.searchData.CIRCUL_STATUS.value
  }
  if (!setupState.searchData.searchType) {
    setupState.searchData.searchType = setupState.searchCombo.searchType[0].value
  }
  const params = {
    specialorgid: setupState.specialorgid,
    roleCode: componentData.roleCode,
    page: setupState.page.page,
    limit: setupState.page.limit,
    XMMC: setupState.searchData.XMMC,
    YJFL: yjfl,
    IMPORTANTITEMS: importantitems,
    DYDJ: setupState.searchData.DYDJ,
    GWXMBM: setupState.searchData.GWXMBM,
    EJFL: ejfl,
    ZCXZ: zcxz,
    CIRCUL_STATUS: circul_status,
    SJFL: setupState.searchData.SJFL,
    PRE_ARR_STATUS: setupState.searchData.PRE_ARR_STATUS,
    XMXZ: xmxz,
    JDDETYPE_TYPE: setupState.searchData.JDDETYPE_TYPE,
    LXSJ_START_DATE: LXSJ_START_DATE,
    LXSJ_END_DATE: LXSJ_END_DATE,
    ZYFJFTRTJFW: setupState.searchData.ZYFJFTRTJFW,
    XMBMC: xmbmc,
    /* YSQJ_START_DATE: YSQJ_START_DATE,
    YSQJ_END_DATE: YSQJ_END_DATE, */
    XMLX_ID: setupState.searchData.xmlx_id,
    ZYQCGBM: setupState.searchData.ZYQCGBM,
    YJDW: setupState.searchData.yjdw,
    EJDW: setupState.searchData.ejdw,
    NDYSWCL_START_QJ: setupState.searchData.NDYSWCL_START_QJ,
    NDYSWCL_START_NUM: parseInt(setupState.searchData.NDYSWCL_START_NUM),
    NDYSWCL_END_QJ: setupState.searchData.NDYSWCL_END_QJ,
    NDYSWCL_END_NUM: parseInt(setupState.searchData.NDYSWCL_END_NUM),
    SFAQSC: setupState.searchData.SFAQSC,
    PROFIT_CENTER: setupState.searchData.profit_center,
    APPLY_CENTER: setupState.searchData.apply_center,
    XMLJWCL_START_QJ: setupState.searchData.XMLJWCL_START_QJ,
    XMLJWCL_START_NUM: parseInt(setupState.searchData.XMLJWCL_START_NUM),
    XMLJWCL_END_QJ: setupState.searchData.XMLJWCL_END_QJ,
    XMLJWCL_END_NUM: parseInt(setupState.searchData.XMLJWCL_END_NUM),
    CTMC: setupState.searchData.CTMC,
    ND: setupState.searchData.ND,
    YD_START: startMonth,
    YD_END: endMonth,
    QUERYTYPE: setupState.searchData.searchType,
    ZDXM: setupState.searchData.ZDXM
  }
  baseService.post('/process40/', params).then((res) => {
    if (res.success) {
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
}
//重置按钮
function reset() {
  setupState.page.page = 1
  setupState.page.limit = 10
  setupState.page.total = 0
  for (const key in setupState.searchData) {
    if (key === 'YSQJ_DATE_END') {
      setupState.searchData[key] = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
    } else if (key === 'YSQJ_DATE_START') {
      setupState.searchData[key] = new Date().getFullYear() + '-01-01'
    } else if (key === 'centerTreeValue' || key === 'XmlxIDTreeValue' || key === 'DWIDTree') {
      setupState.searchData[key] = []
    } else if (key === 'centerId' || key === 'XMLXID' || key === 'DWID') {
      setupState.searchData[key] = []
    } else if (
      key === 'YJFL' ||
      key === 'IMPORTANTITEMS' ||
      key === 'DYDJ' ||
      key === 'EJFL' ||
      key === 'SJFL' ||
      key === 'ZCXZ' ||
      key === 'CIRCUL_STATUS' ||
      key === 'PRE_ARR_STATUS' ||
      key === 'XMXZ' ||
      key === 'JDDETYPE_TYPE' ||
      key === 'ZYFJFTRTJFW' ||
      key === 'ZYQCGBM' ||
      key === 'SFAQSC'
    ) {
      setupState.searchData[key] = null
    } else if (key === 'ND') {
      setupState.searchData[key] = new Date().getFullYear()
    } else if (key === 'NDYSWCL_START_NUM' || key === 'NDYSWCL_END_NUM' || key === 'XMLJWCL_START_NUM' || key === 'XMLJWCL_END_NUM') {
      setupState.searchData[key] = undefined
    } else if (key === 'searchType') {
      setupState.searchData[key] = setupState.searchCombo.searchType[0].value
    } else {
      setupState.searchData[key] = ''
    }
  }
  getYjdwOrEjdwData()
  XMMCRef.value.clear()
  GWXMBMRef.value.clear()
  CTMCRef.value.clear()
  // 成本中心
  getCbzxData()
  getXmbmcData()
  getXmlxData()
  setupState.searchCombo.EJFL = []
  setupState.searchCombo.SJFL = []
  setupState.example = []
}
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  setTableHeight()
}
function formatDate(date) {
  let time = new Date(date)
  let zyear = time.getFullYear()
  let zmonth = time.getMonth() + 1
  let zday = time.getDate()
  return JSON.stringify(zyear) + JSON.stringify(zmonth).padStart(2, '0') + JSON.stringify(zday).padStart(2, '0') + '000000'
}
// 数据导出
function exportData() {
  // 获取当前用户信息中id
  const user = setupState.store.getters.getUserMsg
  setupState.loading = true
  if (XMMCRef.value.array.length > 0) {
    setupState.searchData.XMMC = XMMCRef.value.array.join(',')
  } else {
    setupState.searchData.XMMC = ''
  }
  let yjfl = ''
  if (setupState.searchData.YJFL && setupState.searchData.YJFL.value) {
    yjfl = setupState.searchData.YJFL.value
  }
  let importantitems = ''
  if (setupState.searchData.IMPORTANTITEMS) {
    importantitems = setupState.searchData.IMPORTANTITEMS.join(',')
  }
  if (GWXMBMRef.value.array.length > 0) {
    setupState.searchData.GWXMBM = GWXMBMRef.value.array.join(',')
  } else {
    setupState.searchData.GWXMBM = ''
  }
  let ejfl = ''
  if (setupState.searchData.EJFL && setupState.searchData.EJFL.value) {
    ejfl = setupState.searchData.EJFL.value
  }
  let zcxz = ''
  if (setupState.searchData.ZCXZ && setupState.searchData.ZCXZ.value) {
    zcxz = setupState.searchData.ZCXZ.value
  }
  if (CTMCRef.value.array.length > 0) {
    setupState.searchData.CTMC = CTMCRef.value.array.join(',')
  } else {
    setupState.searchData.CTMC = ''
  }
  let LXSJ_START_DATE = ''
  let LXSJ_END_DATE = ''
  if (setupState.searchData.LXSJ_DATE) {
    LXSJ_START_DATE = formatDate(setupState.searchData.LXSJ_DATE[0])
    LXSJ_END_DATE = formatDate(setupState.searchData.LXSJ_DATE[1])
  }
  let startMonth = ''
  let endMonth = ''
  if (setupState.searchData.YSQJ_DATE_END && setupState.searchData.YSQJ_DATE_START) {
    // this.searchData.YSQJ_DATE_START为string类型，转换为date类型，获取月份
    startMonth = new Date(setupState.searchData.YSQJ_DATE_START).getMonth() + 1
    endMonth = new Date(setupState.searchData.YSQJ_DATE_END).getMonth() + 1
  }
  let xmbmc = ''
  if (setupState.searchData.XMBMC) {
    xmbmc = setupState.searchData.XMBMC.join(',')
  }
  let xmxz = ''
  if (setupState.searchData.XMXZ) {
    xmxz = setupState.searchData.XMXZ.join(',')
  }
  let circul_status = ''
  if (setupState.searchData.CIRCUL_STATUS) {
    circul_status = setupState.searchData.CIRCUL_STATUS.value
  }
  if (!setupState.searchData.searchType) {
    setupState.searchData.searchType = setupState.searchCombo.searchType[0].value
  }
  const params = {
    userId: user.id,
    specialorgid: setupState.specialorgid,
    page: setupState.page.page,
    limit: setupState.page.limit,
    XMMC: setupState.searchData.XMMC,
    YJFL: yjfl,
    IMPORTANTITEMS: importantitems,
    DYDJ: setupState.searchData.DYDJ,
    GWXMBM: setupState.searchData.GWXMBM,
    EJFL: ejfl,
    ZCXZ: zcxz,
    CIRCUL_STATUS: circul_status,
    SJFL: setupState.searchData.SJFL,
    PRE_ARR_STATUS: setupState.searchData.PRE_ARR_STATUS,
    XMXZ: xmxz,
    JDDETYPE_TYPE: setupState.searchData.JDDETYPE_TYPE,
    LXSJ_START_DATE: LXSJ_START_DATE,
    LXSJ_END_DATE: LXSJ_END_DATE,
    ZYFJFTRTJFW: setupState.searchData.ZYFJFTRTJFW,
    XMBMC: xmbmc,
    XMLX_ID: setupState.searchData.xmlx_id,
    /* YSQJ_START_DATE: YSQJ_START_DATE,
    YSQJ_END_DATE: YSQJ_END_DATE, */
    ZYQCGBM: setupState.searchData.ZYQCGBM,
    YJDW: setupState.searchData.yjdw,
    EJDW: setupState.searchData.ejdw,
    NDYSWCL_START_QJ: setupState.searchData.NDYSWCL_START_QJ,
    NDYSWCL_START_NUM: parseInt(setupState.searchData.NDYSWCL_START_NUM),
    NDYSWCL_END_QJ: setupState.searchData.NDYSWCL_END_QJ,
    NDYSWCL_END_NUM: parseInt(setupState.searchData.NDYSWCL_END_NUM),
    SFAQSC: setupState.searchData.SFAQSC,
    PROFIT_CENTER: setupState.searchData.profit_center,
    APPLY_CENTER: setupState.searchData.apply_center,
    XMLJWCL_START_QJ: setupState.searchData.XMLJWCL_START_QJ,
    XMLJWCL_START_NUM: parseInt(setupState.searchData.XMLJWCL_START_NUM),
    XMLJWCL_END_QJ: setupState.searchData.XMLJWCL_END_QJ,
    XMLJWCL_END_NUM: parseInt(setupState.searchData.XMLJWCL_END_NUM),
    CTMC: setupState.searchData.CTMC,
    ND: setupState.searchData.ND,
    YD_START: startMonth,
    YD_END: endMonth,
    QUERYTYPE: setupState.searchData.searchType,
    ZDXM: setupState.searchData.ZDXM
  }
  baseService.export('/process40/export', params).then((res) => {
    setupState.loading = false
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '项目明细查询.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
}
watch(
  () => setupState.searchData.XMLXID,
  function () {
    setXmbmcData()
  },
  {
    deep: true
  }
)
watch(
  () => setupState.searchData.ejdw,
  function (val) {
    handleGetCenter(val)
  },
  {
    deep: true
  }
)
watch(
  () => setupState.searchData.XMXZ,
  function () {
    setupState.searchData.XMBMC = []
    setXmbmcData()
  },
  {}
)
watch(
  () => setupState.searchData.SJFL,
  function () {
    setXmbmcData()
  },
  {}
)
watch(
  () => setupState.searchData.ND,
  function () {
    setXmbmcData()
    getXmlxData()
  },
  {}
)
onMounted(() => {
  setupState.loading = true
  userDialogRef.value.getUser(setupState.userId, setupState.userCode)
  getDynamicColumn()
  handleColumn()
  getYjflData()
  getXmbmcData()
  getYjdwOrEjdwData()
  getCbzxData()
  getXmlxData()
  getComboData(
    [
      setupState.searchCombo.searchType,
      setupState.searchCombo.NDYSWCL_START_QJ,
      setupState.searchCombo.XMLJWCL_START_QJ,
      setupState.searchCombo.IMPORTANTITEMS,
      setupState.searchCombo.ZYQCGBM,
      setupState.searchCombo.ZYFJFTRTJFW,
      setupState.searchCombo.SFAQSC,
      setupState.searchCombo.PRE_ARR_STATUS,
      setupState.searchCombo.XMXZ,
      setupState.searchCombo.JDDETYPE_TYPE,
      setupState.searchCombo.ZDXM
    ],
    [
      'QUERYTYPE',
      'GY_TJFH',
      'DETAIL_IMPORTANTITEMS',
      'ZYQCGBM_COM',
      'ZYFJFTRTJFW_COM',
      'SFAQSC',
      'PRE_ARR_STATUS',
      'XMXZ',
      'XMBTYPE_COM',
      'DYDJ',
      'ZCXZ',
      'ZDXM_COM'
    ]
  )
  setupState.loading = false
})
defineExpose({
  EpArrowDown,
  EpArrowUp,
  EpDownload,
  EpRefreshRight,
  EpSearch,
  store,
  show_Ljwcl,
  show_Yswcl,
  page,
  isQuery,
  searchShow,
  segment,
  example,
  loading,
  userCode,
  userId,
  specialorgid,
  columnObj,
  searchData,
  columns,
  defaultProps,
  xmlxProps,
  searchCombo,
  startChangeDateHandle,
  endChangeDateHandle,
  startDateDisableHandler,
  endDateDisableHandler,
  getComboData,
  handleGetCenter,
  getDynamicColumn,
  isMoneyColumn,
  formatString,
  formatBaiFeiBi,
  formatMoney,
  getXmlxData,
  getCbzxData,
  getYjdwOrEjdwData,
  setXmljwclHandler,
  setYswclHandler,
  setXmbmcData,
  getXmbmcData,
  getYjflData,
  handleCenterClick,
  handleXmlxClick,
  getSjflData,
  getEjflData,
  handleDwClick,
  pageChangeHandle,
  limitChangeHandle,
  loadCompany,
  listShow,
  setTableHeight,
  handleColumn,
  loadData,
  reset,
  showSearch,
  formatDate,
  exportData,
  ...toRefs(componentData)
})
</script>

<style lang="less" scoped>
.process_42 {
  display: none;
}

.dropdown-max {
  max-width: 800px;
  display: flex;
  flex-flow: row wrap;

  li {
    width: 210px;
    white-space: nowrap;
  }
}

.setstyle {
  height: auto;
  padding: 0 0 10px 0 !important;
  margin: 0;
  cursor: default !important;
}

.date_width {
  width: 100% !important;

  :deep(.el-date-editor) {
    width: 100%;
  }
}

.process {
  padding: 10px;
  width: 100%;
  height: calc(100vh - 130px);
  .completion {
    :deep(.el-form-item__content) {
      display: flex;

      .el-select {
        width: 80% !important;
        padding-right: 10px;
      }
    }
  }

  .budgetPeriod {
    :deep(.el-input) {
      width: 100%;
    }
  }

  .cacelDel {
    :deep(.el-select-dropdown__wrap) {
      max-height: 500px !important;
    }

    :deep(.el-tag__close) {
      display: none;
    }
  }

  .formStyle {
    .el-form-item {
      width: 100%;
      margin-bottom: 4px;

      :deep(.el-form-item__label) {
        font-size: 13px;
      }

      .el-select {
        width: 100%;
      }
    }
  }

  .content_table {
    height: calc(100% - 280px);
    overflow: hidden;

    .content_table_center {
      height: calc(100% - 60px);
    }
  }

  .topBox {
    .title {
      width: 100%;
      color: #00706b;
      display: flex;

      .titleBox {
        width: 50%;
        text-align: right;

        h2 {
          font-size: 16px;
          margin: 0 0 4px 0;
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
    }
  }
}
</style>
