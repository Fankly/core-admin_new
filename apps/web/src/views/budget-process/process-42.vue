<template>
  <userDialog ref="userDialogInstance" @loadCompany="loadCompany"></userDialog>
  <div v-loading="loading" id="process_42" class="process process_42" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目明细查询</h2>
        </div>
        <div class="searchBox">
          <span class="searchShow" v-if="searchShow === false" @click="showSearch(true)">
            <el-icon class="ep-icon-arrow-down"><EpArrowDown /></el-icon>
          </span>
          <span class="searchShow" @click="showSearch(false)" v-else>
            <el-icon class="ep-icon-arrow-up"><EpArrowUp /></el-icon>
          </span>
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
      <div class="search" v-if="searchShow">
        <el-form :inline="true" size="small" class="formStyle" label-position="right" :label-width="160">
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
              <el-form-item label="重点投向名称：">
                <el-select v-model="searchData.ZDTX_ID" clearable filterable @change="handleZdtxChange">
                  <el-option v-for="(item, index) in searchCombo.ZDTX_ID" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="预算事项名称：">
                <el-select
                  v-model="searchData.YSSX_NEW_ID"
                  clearable
                  filterable
                  multiple
                  collapse-tags
                  reserve-keyword
                  :remote="!searchData.ZDTX_ID"
                  :remote-method="handleYssxRemoteSearch"
                  :loading="yssxRemoteLoading"
                  :placeholder="searchData.ZDTX_ID ? '请选择' : '请输入预算事项名称搜索'"
                >
                  <el-option v-for="(item, index) in searchCombo.YSSX_NEW_ID" :key="index" :label="item.label" :value="item.value"></el-option>
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
            <el-col :span="6">
              <el-form-item label="立项时间：" class="date_width">
                <el-date-picker :disabled-date="lxsjStartDateDisableHandler" :editable="false" v-model="searchData.LXSJ_DATE_START" type="date" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="至：" class="date_width">
                <el-date-picker :disabled-date="lxsjEndDateDisableHandler" :editable="false" v-model="searchData.LXSJ_DATE_END" type="date" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="研发经费投入统计范围：">
                <el-select v-model="searchData.ZYFJFTRTJFW" clearable>
                  <el-option v-for="(item, index) in searchCombo.ZYFJFTRTJFW" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="rowStyle">
            <el-col :span="6">
              <el-form-item label="项目包名称：" class="cacelDel">
                <el-select
                  v-model="searchData.XmbmcTreeValue"
                  :loading="xmbmcLoading"
                  :disabled="xmbmcLoading"
                  :teleported="false"
                  multiple
                  clearable
                  collapse-tags
                  placeholder="请选择"
                  @clear="clearXmbmcSelection"
                >
                  <el-option :value="searchData.XMBMC" class="setstyle" disabled>
                    <el-tree
                      ref="XmbmcTree"
                      :data="xmbmcTreeData"
                      :props="xmlxProps"
                      :default-checked-keys="searchData.XMBMC"
                      show-checkbox
                      default-expand-all
                      :expand-on-click-node="false"
                      node-key="code"
                      check-on-click-node
                      @check="handleXmbmcCheck"
                    ></el-tree>
                  </el-option>
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
                      :props="dwProps"
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
                <el-select
                  v-model="searchData.centerTreeValue"
                  :loading="centerLoading"
                  :disabled="centerLoading"
                  multiple
                  placeholder="请选择"
                  collapse-tags
                >
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
          <el-row class="rowStyle">
            <el-col :span="6">
              <el-form-item label="预算来源：">
                <el-select v-model="searchData.YSLY" clearable>
                  <el-option v-for="(item, index) in searchCombo.YSLY" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="计划类型：">
                <el-select v-model="searchData.JHLX" clearable>
                  <el-option v-for="item in searchCombo.JHLX" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="查询类型：">
                <el-radio-group v-model="searchData.searchType">
                  <template v-for="item in searchCombo.searchType" :key="item.value">
                    <el-radio size="small" :value="item.value">{{ item.label }}</el-radio>
                  </template>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col v-if="isQuery" :span="24" style="text-align: right; font-size: 12px">
              <el-button size="small" v-debounce="[loadData]" type="primary" :icon="EpSearch" style="margin-left: 90px"> 查询 </el-button>
              <el-button size="small" :icon="EpRefreshRight" @click="reset">重 置</el-button>
              <el-button size="small" v-debounce="[exportData]" type="warning" :icon="EpDownload">导 出</el-button>
              <el-button v-permission="'VIEWFILE'" v-debounce="[showFile, `click`, 300]" type="primary" plain> 会计凭证 </el-button>
              <el-button v-permission="'SETTING'" plain type="primary" @click="handleSetting">高级设置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
    <div class="content_table" ref="contentTables">
      <div class="content_table_center">
        <vxe-table
          :cell-config="{ height: 32 }"
          ref="tableName"
          stripe
          border
          height="100%"
          :data="example"
          :row-config="{ keyField: 'id' }"
          :checkbox-config="{ highlight: true, trigger: 'row' }"
          style="width: 100%; margin-top: 10px"
          :column-config="{ resizable: true }"
          header-align="center"
          show-overflow="tooltip"
          :sync-resize="searchShow"
          :header-cell-style="headerCellStyle"
          @header-cell-click="handleHeaderCellClick"
          @checkbox-change="handleTableSelection"
          @checkbox-all="handleTableSelection"
          :cell-style="handleCellStyle"
          @cell-dblclick="handleRowDblclick"
        >
          <vxe-column v-if="example.length != 0" type="checkbox" fixed="left" width="50" align="center" />
          <template v-for="item in columns" :key="item.columnKey">
            <vxe-column
              v-if="item.columnKey === 'xmmc' && item.checked"
              :formatter="formatString"
              align="center"
              show-overflow="tooltip"
              header-align="center"
              fixed="left"
              width="300"
              :field="item.columnKey"
              :title="getColumnTitle(item)"
              :cell-style="xmmcCellStyle"
            />
            <vxe-column
              v-else-if="item.columnKey === 'gwxmbm' && item.checked"
              :formatter="formatString"
              align="center"
              show-overflow="tooltip"
              header-align="center"
              fixed="left"
              width="140"
              :field="item.columnKey"
              :title="getColumnTitle(item)"
            />
            <vxe-column
              v-else-if="isSumColumn(item) && item.checked"
              :formatter="formatMoney"
              align="right"
              show-overflow="tooltip"
              header-align="center"
              width="200"
              :field="item.columnKey"
              :title="getColumnTitle(item)"
            />
            <vxe-column
              v-else-if="(item.columnKey === 'ndyswcl' || item.columnKey === 'xmljwcl') && item.checked"
              align="center"
              :formatter="formatBaiFeiBi"
              show-overflow="tooltip"
              header-align="center"
              width="200"
              :field="item.columnKey"
              :title="getColumnTitle(item)"
            />
            <vxe-column
              v-else-if="item.columnKey && item.checked"
              :formatter="formatString"
              header-align="center"
              align="center"
              show-overflow="tooltip"
              width="200"
              :field="item.columnKey"
              :title="getColumnTitle(item)"
            />
          </template>
        </vxe-table>
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
  <HelpModal ref="helpModalRef" />
  <projectDetailSearchSetting @search="getDynamicColumn" ref="projectDetailSearchSettingRef" />
  <CentralizedModification ref="editPageRef" :userInfo="userInfo" :formData="selectData" flag="VIEW" />
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
  computed,
  watch,
  onMounted,
  useTemplateRef
} from 'vue'
import baseService from '@/service/baseService'
import { getYssxByZdtx } from '@/api/matter/matterBasic'
import { getYslxct } from '@/api/matter/yssxMatter'
import { ElMessage } from 'element-plus'
import VXETable from 'vxe-table'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import CentralizedModification from '@/views/budget-process/components/CentralizedModification.vue'
import { useStore } from '@/store/business'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { formatValue, isValidNumber } from '@/utils/utils'
import Decimal from 'decimal.js'
import { getSumValue } from '@/api/process'
import ProjectDetailSearchSetting from '@/views/budget-process/components/projectDetailSearchSetting.vue'
import { buildProcess42MatterParams, mapProcess42YssxOptions, mapProcess42ZdtxOptions } from '@/views/budget-process/utils/process42Search'
import { getBizOrgXzTreeExcludeBmNoPermissionNoLazy, getParamValueMulti } from '@/api/common' //公共代码
// import { useStore } from '@/store/business'
import { usePage } from '@/hooks/useUser'
import { useRoute } from 'vue-router'
defineOptions({
  name: '/budget-process/process-42'
})
const route = useRoute()
const projectDetailSearchSettingRefRef = useTemplateRef('projectDetailSearchSettingRef')
const helpModalRefRef = useTemplateRef('helpModalRef')
const tableNameRef = useTemplateRef('tableName')
const XMMCRef = useTemplateRef('XMMC')
const GWXMBMRef = useTemplateRef('GWXMBM')
const centerTreeRef = useTemplateRef('centerTree')
const XmbmcTreeRef = useTemplateRef('XmbmcTree')
const XmlxTreeRef = useTemplateRef('XmlxTree')
const DwTreeRef = useTemplateRef('DwTree')
const userDialogRef = useTemplateRef('userDialogInstance')
const contentTablesRef = useTemplateRef('contentTables')
const editPageRefRef = useTemplateRef('editPageRef')
const store = useStore()
const setupState = reactive({
  EpArrowDown: markElementIconRaw(EpArrowDown),
  EpArrowUp: markElementIconRaw(EpArrowUp),
  EpDownload: markElementIconRaw(EpDownload),
  EpRefreshRight: markElementIconRaw(EpRefreshRight),
  EpSearch: markElementIconRaw(EpSearch),
  selectData: {},
  userInfo: {},
  store,
  show_Ljwcl: true,
  show_Yswcl: true,
  page: {
    total: 0,
    limit: 10,
    page: 1,
    current: 1
  },
  isQuery: false,
  searchShow: true,
  segment: [],
  example: [],
  loading: false,
  centerLoading: false,
  centerRequestId: 0,
  xmbmcLoading: false,
  xmbmcRequestId: 0,
  yssxRemoteLoading: false,
  yssxRemoteQuery: '',
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
    YSSX_NEW_ID: [],
    ZDTX_ID: '',
    EJFL: null,
    SJFL: null,
    ZCXZ: '',
    XMLXID: [],
    XmlxIDTreeValue: [],
    PRE_ARR_STATUS: '',
    XMXZ: '',
    JDDETYPE_TYPE: '',
    LXSJ_DATE_START: '',
    LXSJ_DATE_END: '',
    XMBMC: [],
    XmbmcTreeValue: [],
    ZYQCGBM: '',
    DWID: [],
    DWIDTree: [],
    NDYSWCL_START_NUM: undefined,
    NDYSWCL_START_QJ: '',
    NDYSWCL_END_NUM: undefined,
    NDYSWCL_END_QJ: '',
    SFAQSC: '',
    YSLY: '',
    JHLX: '',
    centerTreeValue: [],
    centerId: [],
    yjdw: '',
    ejdw: '',
    profit_center: '',
    apply_center: '',
    xmlx_id: '',
    roleCode: '',
    roleId: '',
    spRoleId: '',
    searchType: ''
  },
  columns: [],
  defaultProps: {
    children: 'children',
    label: 'text'
  },
  dwProps: {
    children: 'children',
    label: 'name'
  },
  xmlxProps: {
    children: 'children',
    label: 'name'
  },
  searchCombo: {
    ZDXM: [],
    searchType: [],
    YJFL: [],
    YSSX_NEW_ID: [],
    ZDTX_ID: [],
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
    centerId: [],
    DWList: [],
    NDYSWCL_END_QJ: [],
    NDYSWCL_START_QJ: [],
    XMLJWCL_START_QJ: [],
    dateFlag: false,
    XMLJWCL_END_QJ: [],
    SFAQSC: [],
    YSLY: [],
    JHLX: []
  },
  selectList: {},
  selectedRows: [],
  sapUrl: ''
})
const selectData = toRef(setupState, 'selectData')
const userInfo = toRef(setupState, 'userInfo')
const show_Ljwcl = toRef(setupState, 'show_Ljwcl')
const show_Yswcl = toRef(setupState, 'show_Yswcl')
const page = toRef(setupState, 'page')
const isQuery = toRef(setupState, 'isQuery')
const searchShow = toRef(setupState, 'searchShow')
const segment = toRef(setupState, 'segment')
const example = toRef(setupState, 'example')
const loading = toRef(setupState, 'loading')
const centerLoading = toRef(setupState, 'centerLoading')
const centerRequestId = toRef(setupState, 'centerRequestId')
const xmbmcLoading = toRef(setupState, 'xmbmcLoading')
const xmbmcRequestId = toRef(setupState, 'xmbmcRequestId')
const yssxRemoteLoading = toRef(setupState, 'yssxRemoteLoading')
const yssxRemoteQuery = toRef(setupState, 'yssxRemoteQuery')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
const columnObj = toRef(setupState, 'columnObj')
const searchData = toRef(setupState, 'searchData')
const columns = toRef(setupState, 'columns')
const defaultProps = toRef(setupState, 'defaultProps')
const dwProps = toRef(setupState, 'dwProps')
const xmlxProps = toRef(setupState, 'xmlxProps')
const searchCombo = toRef(setupState, 'searchCombo')
const selectList = toRef(setupState, 'selectList')
const selectedRows = toRef(setupState, 'selectedRows')
const sapUrl = toRef(setupState, 'sapUrl')
const componentData = reactiveLocal({})
componentData.roleCode = undefined
const roleCode = toRef(componentData, 'roleCode')
componentData.roleId = undefined
const roleId = toRef(componentData, 'roleId')
componentData.spRoleId = undefined
const spRoleId = toRef(componentData, 'spRoleId')
function handleSetting() {
  projectDetailSearchSettingRefRef.value.acceptParams({
    dataType: '1'
  })
}
function getHelpMessageHandle() {
  helpModalRefRef.value.showModal = true
}
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
function lxsjStartDateDisableHandler(time) {
  if (setupState.searchData.LXSJ_DATE_END) {
    return time.getTime() > new Date(setupState.searchData.LXSJ_DATE_END).getTime()
  } else {
    return false
  }
}
function lxsjEndDateDisableHandler(time) {
  if (setupState.searchData.LXSJ_DATE_START) {
    return time.getTime() < new Date(setupState.searchData.LXSJ_DATE_START).getTime()
  } else {
    return false
  }
}
function getComboData(values) {
  const params = {
    codes: values
  }
  baseService.post('process40/getComCodeByCode/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      const data = res.data
      for (let key in res.data) {
        switch (key) {
          case 'QUERYTYPE_NEW':
            // 设置查询类型默认值
            setupState.searchData.searchType = data[key][0]?.code ?? ''
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
          case 'XMLB_YSLY':
            setupState.searchCombo.YSLY = data[key].map((item) => {
              return {
                label: item.name,
                value: item.code
              }
            })
            break
          case 'XMLB_JHLX':
            setupState.searchCombo.JHLX = data[key].map((item) => {
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
function syncSelectedYssxOptions() {
  const yssxIds = Array.isArray(setupState.searchData.YSSX_NEW_ID) ? setupState.searchData.YSSX_NEW_ID : []
  const availableYssxIds = setupState.searchCombo.YSSX_NEW_ID.map((item) => item.value)
  setupState.searchData.YSSX_NEW_ID = yssxIds.filter((id) => availableYssxIds.includes(id))
}
function mergeSelectedYssxOptions(nextOptions) {
  const yssxIds = Array.isArray(setupState.searchData.YSSX_NEW_ID) ? setupState.searchData.YSSX_NEW_ID : []
  const selectedOptions = setupState.searchCombo.YSSX_NEW_ID.filter((item) => yssxIds.includes(item.value))
  const nextOptionIds = nextOptions.map((item) => item.value)
  return selectedOptions.filter((item) => !nextOptionIds.includes(item.value)).concat(nextOptions)
}
function getYssxOptions(zdtxId = setupState.searchData.ZDTX_ID) {
  getYssxByZdtx({
    zdtxId,
    nd: setupState.searchData.ND
  }).then((res) => {
    if (res.success) {
      setupState.searchCombo.YSSX_NEW_ID = mapProcess42YssxOptions(res.data)
      syncSelectedYssxOptions()
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function handleYssxRemoteSearch(query) {
  if (setupState.searchData.ZDTX_ID) {
    return
  }
  const keyword = query.trim()
  setupState.yssxRemoteQuery = keyword
  if (!keyword) {
    if (setupState.searchData.YSSX_NEW_ID.length === 0) {
      setupState.searchCombo.YSSX_NEW_ID = []
    }
    setupState.yssxRemoteLoading = false
    return
  }
  setupState.yssxRemoteLoading = true
  getYssxByZdtx({
    yssxName: keyword,
    nd: setupState.searchData.ND
  })
    .then((res) => {
      if (setupState.searchData.ZDTX_ID || setupState.yssxRemoteQuery !== keyword) {
        return
      }
      if (res.success) {
        setupState.searchCombo.YSSX_NEW_ID = mergeSelectedYssxOptions(mapProcess42YssxOptions(res.data))
      } else {
        setupState.searchCombo.YSSX_NEW_ID = []
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
    .finally(() => {
      if (setupState.yssxRemoteQuery === keyword) {
        setupState.yssxRemoteLoading = false
      }
    })
}
function refreshYssxOptionsByNd() {
  if (setupState.searchData.ZDTX_ID) {
    getYssxOptions()
    return
  }
  if (setupState.yssxRemoteQuery) {
    handleYssxRemoteSearch(setupState.yssxRemoteQuery)
    return
  }
  setupState.searchData.YSSX_NEW_ID = []
  setupState.searchCombo.YSSX_NEW_ID = []
}
function handleZdtxChange(value) {
  setupState.yssxRemoteQuery = ''
  setupState.yssxRemoteLoading = false
  setupState.searchData.YSSX_NEW_ID = []
  if (!value) {
    setupState.searchCombo.YSSX_NEW_ID = []
    return
  }
  getYssxOptions(value)
}
function getZdtxOptions() {
  getYslxct().then((res) => {
    if (res.success) {
      setupState.searchCombo.ZDTX_ID = mapProcess42ZdtxOptions(res.data)
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function getDynamicColumn() {
  // 获取用户id
  setupState.columns.length = 0
  const id = setupState.store.getters.getUserMsg.id
  setupState.loading = true
  baseService.get(`process40/getDynamicColumn?userId=${id}`).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.columns = res.data.map((item) => {
        return {
          columnKey: item.columnKey,
          columnName: item.columnName,
          checked: true,
          sumFlag: item.sumFlag || '0',
          sumValue: ''
        }
      })

      // 重新按照上面el-table-column的顺序排序
      nextTick(() => {
        if (tableNameRef.value) {
          tableNameRef.value.refreshColumn()
          tableNameRef.value.recalculate(true)
        }
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
function isSumColumn(itemOrField) {
  const column = typeof itemOrField === 'string' ? setupState.columns.find((item) => item.columnKey === itemOrField) : itemOrField
  return !!column && String(column.sumFlag) === '1'
}
function getColumnTitle(item) {
  const extraText = isSumColumn(item) ? `${item.sumValue ? `\n${item.sumValue}` : ''}` : ''
  if (!extraText) return item.columnName
  if (item.columnName.includes('（万元）')) {
    return item.columnName.replace('（万元）', `\n${extraText}（万元）`)
  }
  if (item.columnName.includes('(万元)')) {
    return item.columnName.replace('(万元)', `\n${extraText}(万元)`)
  }
  return `${item.columnName}${extraText}`
}
function headerCellStyle({ column }) {
  if (column && isSumColumn(column.field)) {
    return {
      cursor: 'pointer',
      color: 'rgb(0, 112, 107)'
    }
  }
  return {
    cursor: 'default'
  }
}
function resetColumnSumValues() {
  setupState.columns.forEach((item) => {
    item.sumValue = ''
  })
}
function formatSumValue(sumValue) {
  if (typeof sumValue === 'undefined' || sumValue === null || sumValue === '') return ''
  if (isValidNumber(sumValue)) {
    return formatValue(sumValue.toString(), 6)
  }
  return sumValue
}
function updateColumnSumValue(columnKey, sumValue) {
  setupState.columns.forEach((item) => {
    if (item.columnKey === columnKey) {
      item.sumValue = formatSumValue(sumValue)
    }
  })
  nextTick(() => {
    if (tableNameRef.value) {
      tableNameRef.value.refreshColumn()
      tableNameRef.value.recalculate(true)
    }
  })
}
function syncSearchQueryText() {
  if (XMMCRef.value.array.length > 0) {
    setupState.searchData.XMMC = XMMCRef.value.array.join(',')
  } else {
    setupState.searchData.XMMC = ''
  }
  if (GWXMBMRef.value.array.length > 0) {
    setupState.searchData.GWXMBM = GWXMBMRef.value.array.join(',')
  } else {
    setupState.searchData.GWXMBM = ''
  }
  if (!setupState.searchData.searchType) {
    if (setupState.searchCombo.searchType.length === 0) {
      setupState.searchData.searchType = '1'
    } else {
      setupState.searchData.searchType = setupState.searchCombo.searchType[0].value
    }
  }
}
function buildSearchParams(extraParams = {}) {
  syncSearchQueryText()
  let yjfl = ''
  if (setupState.searchData.YJFL && setupState.searchData.YJFL.value) {
    yjfl = setupState.searchData.YJFL.value
  }
  let ejfl = ''
  if (setupState.searchData.EJFL && setupState.searchData.EJFL.value) {
    ejfl = setupState.searchData.EJFL.value
  }
  let zcxz = ''
  if (setupState.searchData.ZCXZ && setupState.searchData.ZCXZ.value) {
    zcxz = setupState.searchData.ZCXZ.value
  }
  let LXSJ_START_DATE = ''
  let LXSJ_END_DATE = ''
  if (setupState.searchData.LXSJ_DATE_START) {
    LXSJ_START_DATE = formatDate(setupState.searchData.LXSJ_DATE_START)
  }
  if (setupState.searchData.LXSJ_DATE_END) {
    LXSJ_END_DATE = formatDate(setupState.searchData.LXSJ_DATE_END)
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
  return {
    specialorgid: setupState.specialorgid,
    roleCode: componentData.roleCode,
    page: setupState.page.page,
    limit: setupState.page.limit,
    XMMC: setupState.searchData.XMMC,
    YJFL: yjfl,
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
    ND: setupState.searchData.ND,
    YD_START: startMonth,
    YD_END: endMonth,
    QUERYTYPE: setupState.searchData.searchType,
    ZDXM: setupState.searchData.ZDXM,
    ysly: setupState.searchData.YSLY,
    JHLX: setupState.searchData.JHLX,
    ...buildProcess42MatterParams(setupState.searchData),
    ...extraParams
  }
}
function handleHeaderCellClick({ column }) {
  if (!column || !isSumColumn(column.field)) return
  setupState.loading = true
  getSumValue({
    ...buildSearchParams(),
    sumColumn: column.field
  })
    .then((res) => {
      if (res.success) {
        const sumValue =
          res.data && typeof res.data === 'object' && Object.prototype.hasOwnProperty.call(res.data, 'sumValue')
            ? res.data.sumValue
            : res.data
        updateColumnSumValue(column.field, sumValue)
      } else {
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
    .finally(() => {
      setupState.loading = false
    })
}
// 会计凭证
async function showFile() {
  try {
    if (JSON.stringify(setupState.selectList) == '{}') return ElMessage.warning('仅支持单个项目会计凭证查看！')
    let year = new Date().getFullYear()
    let month = new Date().getMonth() + 1 > 9 ? new Date().getMonth() + 1 : `0${new Date().getMonth() + 1}`
    let day = new Date().getDate() > 9 ? new Date().getDate() : '0' + new Date().getDate()
    let date = `${year}${month}${day}`
    let res = await getParamValueMulti(['ERP_TCODE228_URL'])
    if (res.success) {
      setupState.sapUrl = `${res.data.ERP_TCODE228_URL}&AutoStart=true&DynamicParameter=P_BUKRS=${setupState.selectList.profit_center.substring(2, 6)};S_PSPID-LOW=${setupState.selectList.gwxmbm};S_BUDAT-HIGH=`
      const type = await VXETable.modal.confirm('过账日期是否默认设置为今日？', '提示', {
        status: 'warning',
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type === 'close') return ElMessage.info('已取消')
      const url = type === 'confirm' ? setupState.sapUrl + date : setupState.sapUrl
      openWithSAPGUI(url)
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    console.log(e, '出错啦')
  }
}
//打开SAP
function openWithSAPGUI(fileUrl) {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
    var iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = fileUrl
    document.body.appendChild(iframe)
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  } else {
    window.open(fileUrl, '_blank')
  }
}
function syncSelectedRows(records = []) {
  setupState.selectedRows = records
  setupState.selectList =
    records.length === 1
      ? {
          ...records[0]
        }
      : {}
}
function handleTableSelection({ records }) {
  syncSelectedRows(records)
}
function xmmcCellStyle({ row }) {
  if (row.sfxqlr) {
    return {
      cursor: 'pointer',
      color: 'var(--color-primary)',
      textDecoration: 'underline'
    }
  }
}
function handleCellStyle({ row, column }) {
  if (column.title == '项目名称' && row.sfxqlr) {
    return {
      cursor: 'pointer',
      textDecoration: 'underline',
      color: 'var(--color-primary)'
    }
  }
}
function getFormatterValue(params, cellValue) {
  if (params && typeof params === 'object' && Object.prototype.hasOwnProperty.call(params, 'cellValue')) {
    return params.cellValue
  }
  return cellValue
}
function formatString(params, column, cellValue) {
  const value = getFormatterValue(params, cellValue)
  if (typeof value === 'undefined' || value === null || value === '') return '-'
  return value
}
function formatBaiFeiBi(params, column, cellValue) {
  const value = getFormatterValue(params, cellValue)
  if (typeof value === 'undefined' || value === null || value === '') return '-'
  if (isValidNumber(value)) {
    return new Decimal(value.toString()).toFixed(2) + '%'
  } else {
    return '0.00%'
  }
}
function formatMoney({ cellValue }) {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (isValidNumber(cellValue)) {
    return formatValue(cellValue.toString(), 6)
  } else {
    return '0.000000'
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
async function getCbzxData() {
  const requestId = ++setupState.centerRequestId
  const unitCodes = selectedUnitCodes.value
  setupState.centerLoading = true
  // 单位切换或清空时，同时清理勾选、展示值和查询参数。
  centerTreeRef.value?.setCheckedKeys([])
  setupState.searchData.centerId = []
  setupState.searchData.centerTreeValue = []
  setupState.searchData.profit_center = ''
  setupState.searchData.apply_center = ''
  setupState.searchCombo.centerId = []
  const params = {
    parentCode: unitCodes ? 'CBZX' : null,
    rootCode: unitCodes || 'childtree:CBZX',
    objId: -1,
    level: 0
  }
  try {
    const res = await baseService.post('process40/getTreeNodeCbzx/', params)
    // 快速切换单位时，旧请求不得覆盖当前单位的归口部门。
    if (requestId !== setupState.centerRequestId || unitCodes !== selectedUnitCodes.value) return
    if (res.success) {
      setupState.searchCombo.centerId = res.data || []
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  } catch (e) {
    if (requestId === setupState.centerRequestId && unitCodes === selectedUnitCodes.value) {
      ElMessage.error(e.message || '归口部门加载失败')
    }
  } finally {
    if (requestId === setupState.centerRequestId) setupState.centerLoading = false
  }
}
function getYjdwOrEjdwData() {
  setupState.loading = true
  setupState.searchCombo.DWList = []
  return getBizOrgXzTreeExcludeBmNoPermissionNoLazy()
    .then((res) => {
      if (res.success) {
        setupState.searchCombo.DWList = res.data
      } else {
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
    .finally(() => {
      setupState.loading = false
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
  getXmbmcData()
}
function clearXmbmcSelection() {
  XmbmcTreeRef.value?.setCheckedKeys([])
  setupState.searchData.XMBMC = []
  setupState.searchData.XmbmcTreeValue = []
}
function handleXmbmcCheck() {
  // 仅提交项目包叶子节点，排除“全部项目包”父节点。
  const selectedPackages = XmbmcTreeRef.value.getCheckedNodes(true)
  setupState.searchData.XMBMC = selectedPackages.map((item) => item.code)
  setupState.searchData.XmbmcTreeValue = selectedPackages.map((item) => item.name)
}
async function getXmbmcData() {
  const requestId = ++setupState.xmbmcRequestId
  setupState.xmbmcLoading = true
  clearXmbmcSelection()
  setupState.searchCombo.XMBMC = []
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
  try {
    const res = await baseService.post('process40/getXmbArr/', params)
    if (requestId !== setupState.xmbmcRequestId) return
    if (res.success) {
      setupState.searchCombo.XMBMC = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  } catch (e) {
    if (requestId === setupState.xmbmcRequestId) ElMessage.error(e.message || '项目包加载失败')
  } finally {
    if (requestId === setupState.xmbmcRequestId) setupState.xmbmcLoading = false
  }
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
    // 按业务节点类型区分单位级别，省级及分组节点不参与筛选。
    if (item.nodeType === 'CITY' || item.nodeType === 'ZSDW') {
      setupState.searchData.yjdw += item.code + ','
    } else if (item.nodeType === 'COUNTY') {
      setupState.searchData.ejdw += item.code + ','
    } else {
      return
    }
    setupState.searchData.DWIDTree.push({
      id: item.id,
      label: item.name
    })
    setupState.searchData.DWID.push(item.name)
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
  let userInfOther = {
    ...userDialogRef.value.userMsg
  }
  setupState.userInfo = {
    deptId: userInfOther.specialorgid,
    deptName: userInfOther.specialorgname,
    dwId: userInfOther.org_id,
    dwName: userInfOther.org_name,
    roleId: userInfOther.role_id,
    roleCode: userInfOther.code,
    spRoleId: userInfOther.id,
    specialorgcode: userInfOther.specialorgcode
  }
  if (setupState.isQuery) {
    const processHtml = document.querySelector('.process_42')
    processHtml.style.display = 'block'
    nextTick(() => {
      if (tableNameRef.value) tableNameRef.value.recalculate(true)
    })
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
  nextTick(() => {
    if (tableNameRef.value) tableNameRef.value.recalculate(true)
  })
}
//处理环节数据
function handleColumn() {
  setupState.segment.forEach((item) => {
    setupState.columnObj[item.value] = item.checked
  })
}
//搜索按钮
function loadData() {
  resetColumnSumValues()
  setupState.loading = true
  setupState.selectList = {}
  setupState.selectedRows = []
  const params = buildSearchParams()
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
  const hadSelectedUnits = Boolean(selectedUnitCodes.value)
  setupState.page.page = 1
  setupState.page.limit = 10
  setupState.page.total = 0
  setupState.selectList = {}
  setupState.selectedRows = []
  for (const key in setupState.searchData) {
    if (key === 'YSQJ_DATE_END') {
      setupState.searchData[key] = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
    } else if (key === 'YSQJ_DATE_START') {
      setupState.searchData[key] = new Date().getFullYear() + '-01-01'
    } else if (
      key === 'centerTreeValue' ||
      key === 'XmlxIDTreeValue' ||
      key === 'DWIDTree' ||
      key === 'XmbmcTreeValue' ||
      key === 'XMBMC'
    ) {
      setupState.searchData[key] = []
    } else if (key === 'centerId' || key === 'XMLXID' || key === 'DWID' || key === 'YSSX_NEW_ID') {
      setupState.searchData[key] = []
    } else if (
      key === 'YJFL' ||
      key === 'ZDTX_ID' ||
      key === 'EJFL' ||
      key === 'SJFL' ||
      key === 'ZCXZ' ||
      key === 'CIRCUL_STATUS' ||
      key === 'PRE_ARR_STATUS' ||
      key === 'XMXZ' ||
      key === 'JDDETYPE_TYPE' ||
      key === 'ZYFJFTRTJFW' ||
      key === 'ZYQCGBM' ||
      key === 'SFAQSC' ||
      key === 'YSLY'
    ) {
      setupState.searchData[key] = null
    } else if (key === 'ND') {
      setupState.searchData[key] = new Date().getFullYear()
    } else if (key === 'NDYSWCL_START_NUM' || key === 'NDYSWCL_END_NUM' || key === 'XMLJWCL_START_NUM' || key === 'XMLJWCL_END_NUM') {
      setupState.searchData[key] = undefined
    } else if (key === 'searchType') {
      setupState.searchData[key] = setupState.searchCombo.searchType.length ? setupState.searchCombo.searchType[0].value : '1'
    } else {
      setupState.searchData[key] = ''
    }
  }
  DwTreeRef.value?.setCheckedKeys([])
  XMMCRef.value.clear()
  GWXMBMRef.value.clear()
  // 有单位时由联动监听刷新；无单位时主动刷新，避免重复请求。
  if (!hadSelectedUnits) getCbzxData()
  getXmbmcData()
  getXmlxData()
  setupState.searchData.ZDTX_ID = ''
  setupState.yssxRemoteQuery = ''
  setupState.yssxRemoteLoading = false
  setupState.searchCombo.YSSX_NEW_ID = []
  setupState.searchCombo.EJFL = []
  setupState.searchCombo.SJFL = []
  resetColumnSumValues()
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
function handleRowDblclick({ row, column }) {
  if (column.title != '项目名称' || !row.sfxqlr) return
  setupState.selectData = {
    ...row,
    xmlx: row.xmlb
  }
  editPageRefRef.value.isShowModal = true
}
// 数据导出
function exportData() {
  // 获取当前用户信息中id
  const user = setupState.store.getters.getUserMsg
  setupState.loading = true
  const params = buildSearchParams({
    userId: user.id
  })
  const selectedGwxmbm = setupState.selectedRows.map((item) => item.gwxmbm).filter((item) => item)
  if (selectedGwxmbm.length > 0) {
    params.GWXMBM = selectedGwxmbm.join(',')
  }
  delete params.roleCode
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
const xmbmcTreeData = computed(() => {
  return setupState.searchCombo.XMBMC.length
    ? [
        {
          code: '__all_xmb__',
          name: '全部项目包',
          children: setupState.searchCombo.XMBMC
        }
      ]
    : []
})
const selectedUnitCodes = computed(() => {
  return [...new Set([...setupState.searchData.yjdw.split(','), ...setupState.searchData.ejdw.split(',')])].filter(Boolean).sort().join(',')
})
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
  () => selectedUnitCodes.value,
  function () {
    getCbzxData()
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
    refreshYssxOptionsByNd()
  },
  {}
)
onMounted(async () => {
  setupState.loading = true
  getDynamicColumn()
  handleColumn()
  getYjflData()
  getXmbmcData()
  getYjdwOrEjdwData()
  getCbzxData()
  getXmlxData()
  getComboData([
    'QUERYTYPE_NEW',
    'GY_TJFH',
    'ZYQCGBM_COM',
    'ZYFJFTRTJFW_COM',
    'SFAQSC',
    'PRE_ARR_STATUS',
    'XMXZ',
    'XMBTYPE_COM',
    'ZCXZ',
    'ZDXM_COM',
    'XMLB_YSLY',
    'XMLB_JHLX'
  ])
  getZdtxOptions()
  if (typeof route.query.specialorgid === 'string' && route.query.specialorgid) {
    const nd = new Date(route.query.nd).getFullYear() || new Date().getFullYear()
    setupState.searchData.YSQJ_DATE_START = nd + '-01-01'
    setupState.searchData.YSQJ_DATE_END = nd + '-12-31'
    GWXMBMRef.value.setValue(route.query.xmbm)
    setupState.specialorgid = JSON.parse(route.query.specialorgid) || ''
    componentData.roleCode = route.query.roleCode || ''
    componentData.roleId = route.query?.roleId || ''
    componentData.spRoleId = route.query?.spRoleId || ''
    const isRoel = await usePage(componentData.roleId, setupState.specialorgid, componentData.spRoleId)
    console.log(isRoel)
    if (isRoel) {
      setupState.isQuery = true
      if (setupState.isQuery) {
        const processHtml = document.querySelector('.process_42')
        processHtml.style.display = 'block'
      }
    } else {
      userDialogRef.value.getUser(setupState.userId, setupState.userCode)
    }
    loadData()
  } else {
    userDialogRef.value.getUser(setupState.userId, setupState.userCode)
  }
  setupState.loading = false
})
defineExpose({
  EpArrowDown,
  EpArrowUp,
  EpDownload,
  EpRefreshRight,
  EpSearch,
  selectData,
  userInfo,
  store,
  show_Ljwcl,
  show_Yswcl,
  page,
  isQuery,
  searchShow,
  segment,
  example,
  loading,
  centerLoading,
  centerRequestId,
  xmbmcLoading,
  xmbmcRequestId,
  yssxRemoteLoading,
  yssxRemoteQuery,
  userCode,
  userId,
  specialorgid,
  columnObj,
  searchData,
  columns,
  defaultProps,
  dwProps,
  xmlxProps,
  searchCombo,
  selectList,
  selectedRows,
  sapUrl,
  handleSetting,
  getHelpMessageHandle,
  startChangeDateHandle,
  endChangeDateHandle,
  startDateDisableHandler,
  endDateDisableHandler,
  lxsjStartDateDisableHandler,
  lxsjEndDateDisableHandler,
  getComboData,
  syncSelectedYssxOptions,
  mergeSelectedYssxOptions,
  getYssxOptions,
  handleYssxRemoteSearch,
  refreshYssxOptionsByNd,
  handleZdtxChange,
  getZdtxOptions,
  getDynamicColumn,
  isSumColumn,
  getColumnTitle,
  headerCellStyle,
  resetColumnSumValues,
  formatSumValue,
  updateColumnSumValue,
  syncSearchQueryText,
  buildSearchParams,
  handleHeaderCellClick,
  showFile,
  openWithSAPGUI,
  syncSelectedRows,
  handleTableSelection,
  xmmcCellStyle,
  handleCellStyle,
  getFormatterValue,
  formatString,
  formatBaiFeiBi,
  formatMoney,
  getXmlxData,
  getCbzxData,
  getYjdwOrEjdwData,
  setXmljwclHandler,
  setYswclHandler,
  setXmbmcData,
  clearXmbmcSelection,
  handleXmbmcCheck,
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
  handleRowDblclick,
  exportData,
  ...toRefs(componentData),
  xmbmcTreeData,
  selectedUnitCodes
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
    height: calc(100% - 290px);
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
          margin-right: 30px;
          cursor: pointer;
          color: #00706b;
        }
      }
    }
  }
}

:deep(.vxe-table--render-default .vxe-header--column) {
  line-height: 1.2 !important;
  padding: 16px 0 16px 0 !important;
}
</style>
