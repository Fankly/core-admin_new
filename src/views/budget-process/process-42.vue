<template>
  <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  <div v-loading="loading" id="process_42" class="process process_42" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>项目明细查询</h2>
        </div>
        <div class="searchBox">
          <span class="searchShow" v-if="searchShow === false" @click="showSearch(true)">
            <i class="el-icon-arrow-down"></i>
          </span>
          <span class="searchShow" @click="showSearch(false)" v-else>
            <i class="el-icon-arrow-up"></i>
          </span>
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
      <div class="search" v-if="searchShow">
        <el-form :inline="true" size="mini" class="formStyle" label-position="right" :label-width="140">
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
                <el-select v-model="searchData.XmlxIDTreeValue" :popper-append-to-body="false" multiple placeholder="请选择" collapse-tags>
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
                <el-select v-model="searchData.DWID" :popper-append-to-body="false" multiple placeholder="请选择" collapse-tags>
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
                <el-input-number v-model="searchData.NDYSWCL_START_NUM" size="mini" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="至：" class="completion">
                <el-select clearable :disabled="show_Yswcl" v-model="searchData.NDYSWCL_END_QJ">
                  <el-option v-for="(item, index) in searchCombo.NDYSWCL_END_QJ" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
                <el-input-number :disabled="show_Yswcl" v-model="searchData.NDYSWCL_END_NUM" size="mini" />
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
                <el-input-number v-model="searchData.XMLJWCL_START_NUM" size="mini" />
              </el-form-item>
            </el-col>
            <el-col :span="6" class="completion">
              <el-form-item label="至：">
                <el-select clearable v-model="searchData.XMLJWCL_END_QJ" :disabled="show_Ljwcl">
                  <el-option v-for="(item, index) in searchCombo.XMLJWCL_END_QJ" :key="index" :label="item.label" :value="item.value"></el-option>
                </el-select>
                <el-input-number :disabled="show_Ljwcl" v-model="searchData.XMLJWCL_END_NUM" size="mini" />
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
            <el-col :span="8">
              <el-form-item label="查询类型：">
                <el-radio-group v-model="searchData.searchType">
                  <template v-for="item in searchCombo.searchType" :key="item.value">
                    <el-radio size="mini" :label="item.value">{{ item.label }}</el-radio>
                  </template>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col v-if="isQuery" :span="16" style="text-align: right; font-size: 12px">
              <el-button size="mini" v-debounce="[loadData]" type="primary" icon="el-icon-search" style="margin-left: 90px"> 查询 </el-button>
              <el-button size="mini" icon="el-icon-refresh-right" @click="reset">重 置</el-button>
              <el-button size="mini" v-debounce="[exportData]" type="warning" icon="el-icon-download">导 出</el-button>
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
          ref="tableName"
          stripe
          border
          height="100%"
          :data="example"
          :row-config="{ keyField: 'id', height: 32 }"
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

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import { getYssxByZdtx } from '@/api/matter/matterBasic'
import { getYslxct } from '@/api/matter/yssxMatter'
import { ElMessage } from 'element-plus'
import VXETable from 'vxe-table'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import CentralizedModification from '@/views/budget-process/components/CentralizedModification.vue'
import { useStore } from 'vuex'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { formatValue, isValidNumber } from '@/utils/utils'
import Decimal from 'decimal.js'
import { getSumValue } from '@/api/process'
import ProjectDetailSearchSetting from '@/views/budget-process/components/projectDetailSearchSetting.vue'
import { buildProcess42MatterParams, mapProcess42YssxOptions, mapProcess42ZdtxOptions } from '@/views/budget-process/utils/process42Search'
import { getParamValueMulti } from '@/api/common' //公共代码
// import { useStore } from 'vuex'
import { usePage } from '@/hooks/useUser'

export default defineComponent({
  name: '/budget-process/process-42',
  components: {
    ProjectDetailSearchSetting,
    copyTextBox,
    userDialog,
    HelpModal,
    ToolbarButtons,
    CentralizedModification
  },
  setup() {
    const store = useStore()
    return reactive({
      selectData: {},
      userInfo: {},
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
        roleId: '',
        spRoleId: '',
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
        DWList: [],
        NDYSWCL_END_QJ: [],
        NDYSWCL_START_QJ: [],
        XMLJWCL_START_QJ: [],
        dateFlag: false,
        XMLJWCL_END_QJ: [],
        SFAQSC: []
      },
      selectList: {},
      selectedRows: [],
      sapUrl: ''
    })
  },
  async mounted() {
    this.loading = true
    this.getDynamicColumn()
    this.handleColumn()
    this.getYjflData()
    this.getXmbmcData()
    this.getYjdwOrEjdwData()
    this.getCbzxData()
    this.getXmlxData()
    this.getComboData([
      'QUERYTYPE_NEW',
      'GY_TJFH',
      'ZYQCGBM_COM',
      'ZYFJFTRTJFW_COM',
      'SFAQSC',
      'PRE_ARR_STATUS',
      'XMXZ',
      'XMBTYPE_COM',
      'ZCXZ',
      'ZDXM_COM'
    ])
    this.getZdtxOptions()

    if (this.$route.query && JSON.stringify(this.$route.query) != '{}') {
      const nd = new Date(this.$route.query.nd).getFullYear() || new Date().getFullYear()
      this.searchData['YSQJ_DATE_START'] = nd + '-01-01'
      this.searchData['YSQJ_DATE_END'] = nd + '-12-31'
      this.$refs.GWXMBM.setValue(this.$route.query.xmbm)
      this.specialorgid = JSON.parse(this.$route.query.specialorgid) || ''
      this.roleCode = this.$route.query.roleCode || ''
      this.roleId = this.$route.query?.roleId || ''
      this.spRoleId = this.$route.query?.spRoleId || ''
      const isRoel = await usePage(this.roleId, this.specialorgid, this.spRoleId)
      console.log(isRoel)
      if (isRoel) {
        this.isQuery = true
        if (this.isQuery) {
          const processHtml = document.querySelector('.process_42')
          processHtml.style.display = 'block'
        }
      } else {
        this.$refs.userDialog.getUser(this.userId, this.userCode)
      }

      this.loadData()
    } else {
      this.$refs.userDialog.getUser(this.userId, this.userCode)
    }
    this.loading = false
  },
  watch: {
    'searchData.XMLXID': {
      handler: function () {
        this.setXmbmcData()
      },
      deep: true
    },
    'searchData.ejdw': {
      handler: function (val) {
        this.handleGetCenter(val)
      },
      deep: true
    },
    'searchData.XMXZ': {
      handler: function () {
        this.searchData.XMBMC = []
        this.setXmbmcData()
      }
    },
    'searchData.SJFL': {
      handler: function () {
        this.setXmbmcData()
      }
    },
    'searchData.ND': {
      handler: function () {
        this.setXmbmcData()
        this.getXmlxData()
        this.refreshYssxOptionsByNd()
      }
    }
  },
  methods: {
    handleSetting() {
      this.$refs.projectDetailSearchSettingRef.acceptParams({
        dataType: '1'
      })
    },
    getHelpMessageHandle() {
      this.$refs.helpModalRef.showModal = true
    },
    startChangeDateHandle(val) {
      // 如果设置val的年份和结束时间的年份不一致，就把结束时间设置为和开始时间一样的年份，把月份设置为12月，日期设置为31号
      if (this.searchData.YSQJ_DATE_END) {
        const endDate = new Date(this.searchData.YSQJ_DATE_END)
        if (val.getFullYear() !== endDate.getFullYear()) {
          endDate.setFullYear(val.getFullYear())
          endDate.setMonth(11)
          endDate.setDate(31)
          this.searchData.YSQJ_DATE_END = endDate
          // 设置年度
          this.searchData.ND = val.getFullYear()
        }
      }
    },
    endChangeDateHandle(val) {
      // 如果设置val的年份和开始时间的年份不一致，就把开始时间设置为和结束时间一样的年份，把月份设置为1月，日期设置为1号
      if (this.searchData.YSQJ_DATE_START) {
        const startDate = new Date(this.searchData.YSQJ_DATE_START)
        if (val.getFullYear() !== startDate.getFullYear()) {
          startDate.setFullYear(val.getFullYear())
          startDate.setMonth(0)
          startDate.setDate(1)
          this.searchData.YSQJ_DATE_START = startDate
          // 设置年度
          this.searchData.ND = val.getFullYear()
        }
      }
    },
    startDateDisableHandler(time) {
      if (this.searchData.YSQJ_DATE_END) {
        return time.getTime() > new Date(this.searchData.YSQJ_DATE_END).getTime()
      } else {
        return false
      }
    },
    endDateDisableHandler(time) {
      if (this.searchData.YSQJ_DATE_START) {
        return time.getTime() < new Date(this.searchData.YSQJ_DATE_START).getTime()
      } else {
        return false
      }
    },
    getComboData(values) {
      const params = {
        codes: values
      }
      baseService.post('process40/getComCodeByCode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          const data = res.data
          for (let key in res.data) {
            switch (key) {
              case 'QUERYTYPE_NEW':
                // 设置查询类型默认值
                this.searchData.searchType = data[key][0].code
                this.searchCombo.searchType = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                break
              case 'GY_TJFH':
                this.searchCombo.NDYSWCL_START_QJ = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                this.searchCombo.XMLJWCL_START_QJ = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                break
              case 'ZYQCGBM_COM':
                this.searchCombo.ZYQCGBM = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                break
              case 'ZYFJFTRTJFW_COM':
                this.searchCombo.ZYFJFTRTJFW = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                break
              case 'SFAQSC':
                this.searchCombo.SFAQSC = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                break
              case 'PRE_ARR_STATUS':
                this.searchCombo.PRE_ARR_STATUS = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                break
              case 'XMXZ':
                this.searchCombo.XMXZ = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                break
              case 'XMBTYPE_COM':
                this.searchCombo.JDDETYPE_TYPE = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                break
              case 'ZCXZ':
                this.searchCombo.ZCXZ = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                break
              case 'ZDXM_COM':
                this.searchCombo.ZDXM = data[key].map((item) => {
                  return {
                    label: item.name,
                    value: item.code
                  }
                })
                break
            }
          }
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    syncSelectedYssxOptions() {
      const yssxIds = Array.isArray(this.searchData.YSSX_NEW_ID) ? this.searchData.YSSX_NEW_ID : []
      const availableYssxIds = this.searchCombo.YSSX_NEW_ID.map((item) => item.value)
      this.searchData.YSSX_NEW_ID = yssxIds.filter((id) => availableYssxIds.includes(id))
    },
    mergeSelectedYssxOptions(nextOptions) {
      const yssxIds = Array.isArray(this.searchData.YSSX_NEW_ID) ? this.searchData.YSSX_NEW_ID : []
      const selectedOptions = this.searchCombo.YSSX_NEW_ID.filter((item) => yssxIds.includes(item.value))
      const nextOptionIds = nextOptions.map((item) => item.value)
      return selectedOptions.filter((item) => !nextOptionIds.includes(item.value)).concat(nextOptions)
    },
    getYssxOptions(zdtxId = this.searchData.ZDTX_ID) {
      getYssxByZdtx({
        zdtxId,
        nd: this.searchData.ND
      }).then((res) => {
        if (res.success) {
          this.searchCombo.YSSX_NEW_ID = mapProcess42YssxOptions(res.data)
          this.syncSelectedYssxOptions()
        } else {
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    handleYssxRemoteSearch(query) {
      if (this.searchData.ZDTX_ID) {
        return
      }
      const keyword = query.trim()
      this.yssxRemoteQuery = keyword
      if (!keyword) {
        if (this.searchData.YSSX_NEW_ID.length === 0) {
          this.searchCombo.YSSX_NEW_ID = []
        }
        this.yssxRemoteLoading = false
        return
      }
      this.yssxRemoteLoading = true
      getYssxByZdtx({
        yssxName: keyword,
        nd: this.searchData.ND
      })
        .then((res) => {
          if (this.searchData.ZDTX_ID || this.yssxRemoteQuery !== keyword) {
            return
          }
          if (res.success) {
            this.searchCombo.YSSX_NEW_ID = this.mergeSelectedYssxOptions(mapProcess42YssxOptions(res.data))
          } else {
            this.searchCombo.YSSX_NEW_ID = []
            ElMessage({
              type: 'error',
              message: res.msg
            })
          }
        })
        .finally(() => {
          if (this.yssxRemoteQuery === keyword) {
            this.yssxRemoteLoading = false
          }
        })
    },
    refreshYssxOptionsByNd() {
      if (this.searchData.ZDTX_ID) {
        this.getYssxOptions()
        return
      }
      if (this.yssxRemoteQuery) {
        this.handleYssxRemoteSearch(this.yssxRemoteQuery)
        return
      }
      this.searchData.YSSX_NEW_ID = []
      this.searchCombo.YSSX_NEW_ID = []
    },
    handleZdtxChange(value) {
      this.yssxRemoteQuery = ''
      this.yssxRemoteLoading = false
      this.searchData.YSSX_NEW_ID = []
      if (!value) {
        this.searchCombo.YSSX_NEW_ID = []
        return
      }
      this.getYssxOptions(value)
    },
    getZdtxOptions() {
      getYslxct().then((res) => {
        if (res.success) {
          this.searchCombo.ZDTX_ID = mapProcess42ZdtxOptions(res.data)
        } else {
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    handleGetCenter(val) {
      this.loading = true
      if (val) {
        const params = {
          parentCode: 'CBZX',
          rootCode: val,
          objId: -1,
          level: 0
        }
        this.searchCombo.centerId = []
        this.searchData.centerId = []
        this.searchData.centerTreeValue = []
        this.searchData.profit_center = ''
        this.searchData.apply_center = ''
        // 重置归口部门
        baseService.post('process40/getTreeNodeCbzx/', params).then((res) => {
          if (res.success) {
            if (res.data) {
              this.searchCombo.centerId = res.data
            }
            this.loading = false
          } else {
            this.loading = false
            ElMessage({
              type: 'error',
              message: res.msg
            })
          }
        })
      } else {
        this.loading = false
        this.getCbzxData()
      }
    },
    getDynamicColumn() {
      // 获取用户id
      this.columns.length = 0
      const id = this.store.getters.getUserMsg.id
      this.loading = true
      baseService.get(`process40/getDynamicColumn?userId=${id}`).then((res) => {
        if (res.success) {
          this.loading = false
          this.columns = res.data.map((item) => {
            return {
              columnKey: item.columnKey,
              columnName: item.columnName,
              checked: true,
              sumFlag: item.sumFlag || '0',
              sumValue: ''
            }
          })

          // 重新按照上面el-table-column的顺序排序
          this.$nextTick(() => {
            if (this.$refs.tableName) {
              this.$refs.tableName.refreshColumn()
              this.$refs.tableName.recalculate(true)
            }
          })
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    isSumColumn(itemOrField) {
      const column = typeof itemOrField === 'string' ? this.columns.find((item) => item.columnKey === itemOrField) : itemOrField
      return !!column && String(column.sumFlag) === '1'
    },
    getColumnTitle(item) {
      const extraText = this.isSumColumn(item) ? `${item.sumValue ? `\n${item.sumValue}` : ''}` : ''
      if (!extraText) return item.columnName
      if (item.columnName.includes('（万元）')) {
        return item.columnName.replace('（万元）', `\n${extraText}（万元）`)
      }
      if (item.columnName.includes('(万元)')) {
        return item.columnName.replace('(万元)', `\n${extraText}(万元)`)
      }
      return `${item.columnName}${extraText}`
    },
    headerCellStyle({ column }) {
      if (column && this.isSumColumn(column.field)) {
        return {
          cursor: 'pointer',
          color: 'rgb(0, 112, 107)'
        }
      }
      return {
        cursor: 'default'
      }
    },
    resetColumnSumValues() {
      this.columns.forEach((item) => {
        item.sumValue = ''
      })
    },
    formatSumValue(sumValue) {
      if (typeof sumValue === 'undefined' || sumValue === null || sumValue === '') return ''
      if (isValidNumber(sumValue)) {
        return formatValue(sumValue.toString(), 6)
      }
      return sumValue
    },
    updateColumnSumValue(columnKey, sumValue) {
      this.columns.forEach((item) => {
        if (item.columnKey === columnKey) {
          item.sumValue = this.formatSumValue(sumValue)
        }
      })
      this.$nextTick(() => {
        if (this.$refs.tableName) {
          this.$refs.tableName.refreshColumn()
          this.$refs.tableName.recalculate(true)
        }
      })
    },
    syncSearchQueryText() {
      if (this.$refs.XMMC.array.length > 0) {
        this.searchData.XMMC = this.$refs.XMMC.array.join(',')
      } else {
        this.searchData.XMMC = ''
      }
      if (this.$refs.GWXMBM.array.length > 0) {
        this.searchData.GWXMBM = this.$refs.GWXMBM.array.join(',')
      } else {
        this.searchData.GWXMBM = ''
      }
      if (!this.searchData.searchType) {
        if (this.searchCombo.searchType.length === 0) {
          this.searchData.searchType = '1'
        } else {
          this.searchData.searchType = this.searchCombo.searchType[0].value
        }
      }
    },
    buildSearchParams(extraParams = {}) {
      this.syncSearchQueryText()
      let yjfl = ''
      if (this.searchData.YJFL && this.searchData.YJFL.value) {
        yjfl = this.searchData.YJFL.value
      }
      let ejfl = ''
      if (this.searchData.EJFL && this.searchData.EJFL.value) {
        ejfl = this.searchData.EJFL.value
      }
      let zcxz = ''
      if (this.searchData.ZCXZ && this.searchData.ZCXZ.value) {
        zcxz = this.searchData.ZCXZ.value
      }
      let LXSJ_START_DATE = ''
      let LXSJ_END_DATE = ''
      if (this.searchData.LXSJ_DATE) {
        LXSJ_START_DATE = this.formatDate(this.searchData.LXSJ_DATE[0])
        LXSJ_END_DATE = this.formatDate(this.searchData.LXSJ_DATE[1])
      }
      let startMonth = ''
      let endMonth = ''
      if (this.searchData.YSQJ_DATE_END && this.searchData.YSQJ_DATE_START) {
        startMonth = new Date(this.searchData.YSQJ_DATE_START).getMonth() + 1
        endMonth = new Date(this.searchData.YSQJ_DATE_END).getMonth() + 1
      }
      let xmbmc = ''
      if (this.searchData.XMBMC) {
        xmbmc = this.searchData.XMBMC.join(',')
      }
      let xmxz = ''
      if (this.searchData.XMXZ) {
        xmxz = this.searchData.XMXZ.join(',')
      }
      let circul_status = ''
      if (this.searchData.CIRCUL_STATUS) {
        circul_status = this.searchData.CIRCUL_STATUS.value
      }
      return {
        specialorgid: this.specialorgid,
        roleCode: this.roleCode,
        page: this.page.page,
        limit: this.page.limit,
        XMMC: this.searchData.XMMC,
        YJFL: yjfl,
        GWXMBM: this.searchData.GWXMBM,
        EJFL: ejfl,
        ZCXZ: zcxz,
        CIRCUL_STATUS: circul_status,
        SJFL: this.searchData.SJFL,
        PRE_ARR_STATUS: this.searchData.PRE_ARR_STATUS,
        XMXZ: xmxz,
        JDDETYPE_TYPE: this.searchData.JDDETYPE_TYPE,
        LXSJ_START_DATE: LXSJ_START_DATE,
        LXSJ_END_DATE: LXSJ_END_DATE,
        ZYFJFTRTJFW: this.searchData.ZYFJFTRTJFW,
        XMBMC: xmbmc,
        XMLX_ID: this.searchData.xmlx_id,
        ZYQCGBM: this.searchData.ZYQCGBM,
        YJDW: this.searchData.yjdw,
        EJDW: this.searchData.ejdw,
        NDYSWCL_START_QJ: this.searchData.NDYSWCL_START_QJ,
        NDYSWCL_START_NUM: parseInt(this.searchData.NDYSWCL_START_NUM),
        NDYSWCL_END_QJ: this.searchData.NDYSWCL_END_QJ,
        NDYSWCL_END_NUM: parseInt(this.searchData.NDYSWCL_END_NUM),
        SFAQSC: this.searchData.SFAQSC,
        PROFIT_CENTER: this.searchData.profit_center,
        APPLY_CENTER: this.searchData.apply_center,
        XMLJWCL_START_QJ: this.searchData.XMLJWCL_START_QJ,
        XMLJWCL_START_NUM: parseInt(this.searchData.XMLJWCL_START_NUM),
        XMLJWCL_END_QJ: this.searchData.XMLJWCL_END_QJ,
        XMLJWCL_END_NUM: parseInt(this.searchData.XMLJWCL_END_NUM),
        ND: this.searchData.ND,
        YD_START: startMonth,
        YD_END: endMonth,
        QUERYTYPE: this.searchData.searchType,
        ZDXM: this.searchData.ZDXM,
        ...buildProcess42MatterParams(this.searchData),
        ...extraParams
      }
    },
    handleHeaderCellClick({ column }) {
      if (!column || !this.isSumColumn(column.field)) return
      this.loading = true
      getSumValue({
        ...this.buildSearchParams(),
        sumColumn: column.field
      })
        .then((res) => {
          if (res.success) {
            const sumValue =
              res.data && typeof res.data === 'object' && Object.prototype.hasOwnProperty.call(res.data, 'sumValue') ? res.data.sumValue : res.data
            this.updateColumnSumValue(column.field, sumValue)
          } else {
            ElMessage({
              type: 'error',
              message: res.msg
            })
          }
        })
        .finally(() => {
          this.loading = false
        })
    },

    // 会计凭证
    async showFile() {
      try {
        if (JSON.stringify(this.selectList) == '{}') return ElMessage.warning('仅支持单个项目会计凭证查看！')
        let year = new Date().getFullYear()
        let month = new Date().getMonth() + 1 > 9 ? new Date().getMonth() + 1 : `0${new Date().getMonth() + 1}`
        let day = new Date().getDate() > 9 ? new Date().getDate() : '0' + new Date().getDate()
        let date = `${year}${month}${day}`
        let res = await getParamValueMulti(['ERP_TCODE228_URL'])
        if (res.success) {
          this.sapUrl = `${res.data.ERP_TCODE228_URL}&AutoStart=true&DynamicParameter=P_BUKRS=${this.selectList.profit_center.substring(
            2,
            6
          )};S_PSPID-LOW=${this.selectList.gwxmbm};S_BUDAT-HIGH=`
          const type = await VXETable.modal.confirm('过账日期是否默认设置为今日？', '提示', {
            status: 'warning',
            confirmButtonText: '是',
            cancelButtonText: '否'
          })
          if (type === 'close') return ElMessage.info('已取消')
          const url = type === 'confirm' ? this.sapUrl + date : this.sapUrl
          this.openWithSAPGUI(url)
        } else {
          ElMessage.error(res.msg)
        }
      } catch (e) {
        console.log(e, '出错啦')
      }
    },
    //打开SAP
    openWithSAPGUI(fileUrl) {
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
    },
    syncSelectedRows(records = []) {
      this.selectedRows = records
      this.selectList = records.length === 1 ? { ...records[0] } : {}
    },
    handleTableSelection({ records }) {
      this.syncSelectedRows(records)
    },
    xmmcCellStyle({ row }) {
      if (row.sfxqlr) {
        return {
          cursor: 'pointer',
          color: 'var(--color-primary)',
          textDecoration: 'underline'
        }
      }
    },
    handleCellStyle({ row, column }) {
      if (column.title == '项目名称' && row.sfxqlr) {
        return {
          cursor: 'pointer',
          textDecoration: 'underline',
          color: 'var(--color-primary)'
        }
      }
    },
    getFormatterValue(params, cellValue) {
      if (params && typeof params === 'object' && Object.prototype.hasOwnProperty.call(params, 'cellValue')) {
        return params.cellValue
      }
      return cellValue
    },
    formatString(params, column, cellValue) {
      const value = this.getFormatterValue(params, cellValue)
      if (typeof value === 'undefined' || value === null || value === '') return '-'
      return value
    },
    formatBaiFeiBi(params, column, cellValue) {
      const value = this.getFormatterValue(params, cellValue)
      if (typeof value === 'undefined' || value === null || value === '') return '-'
      if (isValidNumber(value)) {
        return new Decimal(value.toString()).toFixed(2) + '%'
      } else {
        return '0.00%'
      }
    },
    formatMoney({ cellValue }) {
      if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
      if (isValidNumber(cellValue)) {
        return formatValue(cellValue.toString(), 6)
      } else {
        return '0.000000'
      }
    },
    getXmlxData() {
      let startDate = new Date().getFullYear()
      if (this.searchData.ND) {
        startDate = this.searchData.ND
      }
      this.loading = true
      const params = {
        parentId: '0',
        startDate: startDate
      }
      this.searchCombo.centerId = []
      this.searchData.XMLXID = [] //置空
      this.searchData.XmlxIDTreeValue = []
      this.searchData.xmlx_id = ''
      this.searchCombo.XMLXID = []
      baseService.post('process40/getProTypeTreeNode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.searchCombo.XMLXID = res.data
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    getCbzxData() {
      this.loading = true
      const params = {
        parentCode: null,
        rootCode: 'childtree:CBZX',
        objId: -1,
        level: 0
      }
      this.searchCombo.centerId = []
      baseService.post('process40/getTreeNodeCbzx/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.searchCombo.centerId = res.data
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    getYjdwOrEjdwData() {
      this.loading = true
      const params = {
        parentCode: null,
        rootCode: 'childtree:DW_COM',
        objId: -1,
        level: 0
      }
      this.searchCombo.DWList = []
      baseService.post('process40/getTreeNode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.searchCombo.DWList = res.data
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    setXmljwclHandler(data) {
      this.searchCombo.XMLJWCL_END_QJ = []
      this.searchData.XMLJWCL_END_QJ = ''
      this.searchData.XMLJWCL_END_NUM = undefined
      if (data === '>' || data === '>=') {
        this.show_Ljwcl = false
        this.searchCombo.XMLJWCL_END_QJ.push(
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
        this.show_Ljwcl = false
        this.searchCombo.XMLJWCL_END_QJ.push(
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
        this.show_Ljwcl = true
      }
    },
    setYswclHandler(data) {
      this.searchCombo.NDYSWCL_END_QJ = []
      this.searchData.NDYSWCL_END_QJ = ''
      this.searchData.NDYSWCL_END_NUM = undefined
      if (data === '>' || data === '>=') {
        this.searchCombo.NDYSWCL_END_QJ.push(
          {
            label: '<',
            value: '<'
          },
          {
            label: '<=',
            value: '<='
          }
        )
        this.show_Yswcl = false
      } else if (data === '<' || data === '<=') {
        this.searchCombo.NDYSWCL_END_QJ.push(
          {
            label: '>',
            value: '>'
          },
          {
            label: '>=',
            value: '>='
          }
        )
        this.show_Yswcl = false
      } else {
        this.show_Yswcl = true
      }
    },
    setXmbmcData() {
      this.searchCombo.XMBMC = []
      this.searchData.XMBMC = []
      this.getXmbmcData()
    },
    getXmbmcData() {
      this.loading = true
      let str = ''
      if (this.searchData.XMXZ && this.searchData.XMXZ.length > 0) {
        str = this.searchData.XMXZ.join(',')
      }
      const params = {
        year: this.searchData.ND,
        xmlx: this.searchData.xmlx_id,
        xmblx: this.searchData.JDDETYPE_TYPE,
        xmxz: str,
        sjfl: this.searchData.SJFL,
        xmbid: ''
      }
      baseService.post('process40/getXmbArr/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.searchCombo.XMBMC = res.data
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    getYjflData() {
      this.loading = true
      const params = {
        rootCode: 'GWXMFL'
      }
      baseService.post('process40/getRootComCode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          res.data.forEach((item) => {
            this.searchCombo.YJFL.push({
              value: item.code,
              label: item.name,
              id: item.id
            })
          })
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    handleCenterClick(data, self, child) {
      let datalist = this.$refs.centerTree.getCheckedNodes()
      this.searchData.centerId = [] //置空
      this.searchData.centerTreeValue = []
      this.searchData.profit_center = ''
      this.searchData.apply_center = ''
      datalist.forEach((item) => {
        if (item.level == '1') {
          this.searchData.profit_center += item.objCode + ','
        } else if (item.level == '2') {
          this.searchData.apply_center += item.objCode + ','
        }
        this.searchData.centerId.push({ id: item.id, label: item.text })
        this.searchData.centerTreeValue.push(item.text)
      })
      this.searchData.profit_center = this.searchData.profit_center.substring(0, this.searchData.profit_center.length - 1)
      this.searchData.apply_center = this.searchData.apply_center.substring(0, this.searchData.apply_center.length - 1)
    },
    // 获取项目类型数据
    handleXmlxClick(data, self, child) {
      let datalist = this.$refs.XmlxTree.getCheckedNodes()
      this.searchData.XMLXID = [] //置空
      this.searchData.XmlxIDTreeValue = []
      this.searchData.xmlx_id = ''
      datalist.forEach((item) => {
        this.searchData.xmlx_id += item.code + ','
        this.searchData.XMLXID.push({ id: item.id, label: item.name })
        this.searchData.XmlxIDTreeValue.push(item.name)
      })
      this.searchData.xmlx_id = this.searchData.xmlx_id.substring(0, this.searchData.xmlx_id.length - 1)
    },
    getSjflData(selectedData) {
      this.searchCombo.SJFL = []
      this.searchData.SJFL = null
      if (selectedData && selectedData.id) {
        this.loading = true
        const params = {
          parentId: selectedData.id
        }
        baseService.post('process40/getComCodeByParent/', params).then((res) => {
          if (res.success) {
            this.loading = false
            res.data.forEach((item) => {
              this.searchCombo.SJFL.push({
                value: item.code,
                label: item.name,
                id: item.id
              })
            })
          } else {
            this.loading = false
            ElMessage({
              type: 'error',
              message: res.msg
            })
          }
        })
      }
    },
    getEjflData(selectedData) {
      this.searchCombo.EJFL = []
      this.searchCombo.SJFL = []
      this.searchData.EJFL = null
      this.searchData.SJFL = null
      if (selectedData && selectedData.id) {
        this.loading = true
        const params = {
          parentId: selectedData.id
        }
        baseService.post('process40/getComCodeByParent/', params).then((res) => {
          if (res.success) {
            this.loading = false
            res.data.forEach((item) => {
              this.searchCombo.EJFL.push({
                value: item.code,
                label: item.name,
                id: item.id
              })
            })
          } else {
            this.loading = false
            ElMessage({
              type: 'error',
              message: res.msg
            })
          }
        })
      }
    },
    handleDwClick(data, self, child) {
      let datalist = this.$refs.DwTree.getCheckedNodes()
      this.searchData.DWID = [] //置空
      this.searchData.DWIDTree = []
      this.searchData.yjdw = ''
      this.searchData.ejdw = ''
      datalist.forEach((item) => {
        if (item.level == '1') {
          this.searchData.yjdw += item.objCode + ','
        } else if (item.level == '2') {
          this.searchData.ejdw += item.objCode + ','
        }
        this.searchData.DWIDTree.push({ id: item.id, label: item.text })
        this.searchData.DWID.push(item.text)
      })
      this.searchData.yjdw = this.searchData.yjdw.substring(0, this.searchData.yjdw.length - 1)
      this.searchData.ejdw = this.searchData.ejdw.substring(0, this.searchData.ejdw.length - 1)
    },
    pageChangeHandle(currentPageNum) {
      this.page.page = currentPageNum
      this.loadData()
    },
    limitChangeHandle(currentLimitNum) {
      this.page.page = 1
      this.page.limit = currentLimitNum
      this.loadData()
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.roleCode = parseInt(this.$refs.userDialog.roleCode)
      this.isQuery = this.$refs.userDialog.isQuery
      let userInfOther = { ...this.$refs.userDialog.userMsg }
      this.userInfo = {
        deptId: userInfOther.specialorgid,
        deptName: userInfOther.specialorgname,
        dwId: userInfOther.org_id,
        dwName: userInfOther.org_name,
        roleId: userInfOther.role_id,
        roleCode: userInfOther.code,
        spRoleId: userInfOther.id,
        specialorgcode: userInfOther.specialorgcode
      }
      if (this.isQuery) {
        const processHtml = document.querySelector('.process_42')
        processHtml.style.display = 'block'
        this.$nextTick(() => {
          if (this.$refs.tableName) this.$refs.tableName.recalculate(true)
        })
      }
    },
    //项目环节
    listShow(value, checked) {
      this.columns.forEach((item) => {
        if (item.columnKey === value) {
          item.checked = checked
        }
      })
    },
    setTableHeight() {
      if (this.searchShow == true) {
        this.$refs.contentTables.style.height = 'calc(100% - 280px)'
      } else {
        this.$refs.contentTables.style.height = 'calc(100% - 17px)'
      }
      this.$nextTick(() => {
        if (this.$refs.tableName) this.$refs.tableName.recalculate(true)
      })
    },
    //处理环节数据
    handleColumn() {
      this.segment.forEach((item) => {
        this.columnObj[item.value] = item.checked
      })
    },
    //搜索按钮
    loadData() {
      this.resetColumnSumValues()
      this.loading = true
      this.selectList = {}
      this.selectedRows = []
      const params = this.buildSearchParams()
      baseService.post('/process40/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.example = res.data.records
          this.page.total = res.data.total
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },

    //重置按钮
    reset() {
      this.page.page = 1
      this.page.limit = 10
      this.page.total = 0
      this.selectList = {}
      this.selectedRows = []
      for (const key in this.searchData) {
        if (key === 'YSQJ_DATE_END') {
          this.searchData[key] = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
        } else if (key === 'YSQJ_DATE_START') {
          this.searchData[key] = new Date().getFullYear() + '-01-01'
        } else if (key === 'centerTreeValue' || key === 'XmlxIDTreeValue' || key === 'DWIDTree') {
          this.searchData[key] = []
        } else if (key === 'centerId' || key === 'XMLXID' || key === 'DWID' || key === 'YSSX_NEW_ID') {
          this.searchData[key] = []
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
          key === 'SFAQSC'
        ) {
          this.searchData[key] = null
        } else if (key === 'ND') {
          this.searchData[key] = new Date().getFullYear()
        } else if (key === 'NDYSWCL_START_NUM' || key === 'NDYSWCL_END_NUM' || key === 'XMLJWCL_START_NUM' || key === 'XMLJWCL_END_NUM') {
          this.searchData[key] = undefined
        } else if (key === 'searchType') {
          this.searchData[key] = this.searchCombo.searchType[0].value
        } else {
          this.searchData[key] = ''
        }
      }
      this.getYjdwOrEjdwData()
      this.$refs.XMMC.clear()
      this.$refs.GWXMBM.clear()
      // 成本中心
      this.getCbzxData()
      this.getXmbmcData()
      this.getXmlxData()
      this.searchData.ZDTX_ID = ''
      this.yssxRemoteQuery = ''
      this.yssxRemoteLoading = false
      this.searchCombo.YSSX_NEW_ID = []
      this.searchCombo.EJFL = []
      this.searchCombo.SJFL = []
      this.resetColumnSumValues()
      this.example = []
    },

    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },
    formatDate(date) {
      let time = new Date(date)
      let zyear = time.getFullYear()
      let zmonth = time.getMonth() + 1
      let zday = time.getDate()
      return JSON.stringify(zyear) + JSON.stringify(zmonth).padStart(2, '0') + JSON.stringify(zday).padStart(2, '0') + '000000'
    },
    handleRowDblclick({ row, column }) {
      if (column.title != '项目名称' || !row.sfxqlr) return
      this.selectData = { ...row, xmlx: row.xmlb }
      this.$refs.editPageRef.isShowModal = true
    },
    // 数据导出
    exportData() {
      // 获取当前用户信息中id
      const user = this.store.getters.getUserMsg
      this.loading = true
      const params = this.buildSearchParams({
        userId: user.id
      })
      const selectedGwxmbm = this.selectedRows.map((item) => item.gwxmbm).filter((item) => item)
      if (selectedGwxmbm.length > 0) {
        params.GWXMBM = selectedGwxmbm.join(',')
      }
      delete params.roleCode
      baseService.export('/process40/export', params).then((res) => {
        this.loading = false
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
  }
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
