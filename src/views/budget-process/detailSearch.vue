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
              <el-icon class="el-icon-s-operation">
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
            <i class="el-icon-arrow-down"></i>
          </span>
          <span class="searchShow" @click="showSearch(false)" v-else>
            <i class="el-icon-arrow-up"></i>
          </span>
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
            <el-col :span="6">
              <el-form-item label="辞条名称：">
                <copyTextBox ref="CTMC"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="查询类型：">
                <el-radio-group v-model="searchData.searchType">
                  <template v-for="item in searchCombo.searchType" :key="item.value">
                    <el-radio size="mini" :label="item.value">{{ item.label }}</el-radio>
                  </template>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="6" style="text-align: right; font-size: 12px">
              <el-button size="mini" v-debounce="[loadData]" type="primary" icon="el-icon-search" style="margin-left: 90px"> 查询 </el-button>
              <el-button size="mini" icon="el-icon-refresh-right" @click="reset">重 置</el-button>
              <el-button size="mini" v-debounce="[exportData]" type="warning" icon="el-icon-download">导 出</el-button>
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

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: '/budget-process/process-42',
  components: {
    copyTextBox,
    userDialog
  },
  setup() {
    const store = useStore()
    return reactive({
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
  },
  mounted() {
    this.loading = true
    this.$refs.userDialog.getUser(this.userId, this.userCode)

    this.getDynamicColumn()
    this.handleColumn()
    this.getYjflData()
    this.getXmbmcData()
    this.getYjdwOrEjdwData()
    this.getCbzxData()
    this.getXmlxData()
    this.getComboData(
      [
        this.searchCombo.searchType,
        this.searchCombo.NDYSWCL_START_QJ,
        this.searchCombo.XMLJWCL_START_QJ,
        this.searchCombo.IMPORTANTITEMS,
        this.searchCombo.ZYQCGBM,
        this.searchCombo.ZYFJFTRTJFW,
        this.searchCombo.SFAQSC,
        this.searchCombo.PRE_ARR_STATUS,
        this.searchCombo.XMXZ,
        this.searchCombo.JDDETYPE_TYPE,
        this.searchCombo.ZDXM
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
      }
    }
  },
  methods: {
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
    getComboData(combo, values) {
      const params = {
        codes: values
      }
      baseService.post('process40/getComCodeByCode/', params).then((res) => {
        if (res.success) {
          this.loading = false
          const data = res.data
          for (let key in res.data) {
            switch (key) {
              case 'QUERYTYPE':
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
              case 'DETAIL_IMPORTANTITEMS':
                this.searchCombo.IMPORTANTITEMS = data[key].map((item) => {
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
              case 'DYDJ':
                this.searchCombo.DYDJ = data[key].map((item) => {
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
      const id = this.store.getters.getUserMsg.id
      this.loading = true
      baseService.get(`process40/getDynamicColumn?userId=${id}`).then((res) => {
        if (res.success) {
          this.loading = false
          this.columns = res.data.map((item) => {
            return {
              columnKey: item.columnKey,
              columnName: item.columnName,
              checked: true
            }
          })
          // 重新按照上面el-table-column的顺序排序
          this.$nextTick(() => {
            this.$refs.tableName.doLayout()
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
    isMoneyColumn(item) {
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
    },
    formatString(row, column, cellValue, index) {
      if (cellValue) {
        return cellValue
      } else {
        return '-'
      }
    },
    formatBaiFeiBi(row, column, cellValue, index) {
      if (cellValue) {
        return cellValue.toFixed(2) + '%'
      } else {
        return '0.00%'
      }
    },
    formatMoney(row, column, cellValue, index) {
      if (cellValue) {
        return cellValue.toFixed(4)
      } else {
        return '0.0000'
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
      if (this.isQuery) {
        const processHtml = document.querySelector('.process_42')
        processHtml.style.display = 'block'
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
    },
    //处理环节数据
    handleColumn() {
      this.segment.forEach((item) => {
        this.columnObj[item.value] = item.checked
      })
    },
    //搜索按钮
    loadData() {
      this.loading = true
      if (this.$refs.XMMC.array.length > 0) {
        this.searchData.XMMC = this.$refs.XMMC.array.join(',')
      } else {
        this.searchData.XMMC = ''
      }
      let yjfl = ''
      if (this.searchData.YJFL && this.searchData.YJFL.value) {
        yjfl = this.searchData.YJFL.value
      }
      let importantitems = ''
      if (this.searchData.IMPORTANTITEMS) {
        importantitems = this.searchData.IMPORTANTITEMS.join(',')
      }
      if (this.$refs.GWXMBM.array.length > 0) {
        this.searchData.GWXMBM = this.$refs.GWXMBM.array.join(',')
      } else {
        this.searchData.GWXMBM = ''
      }
      let ejfl = ''
      if (this.searchData.EJFL && this.searchData.EJFL.value) {
        ejfl = this.searchData.EJFL.value
      }
      let zcxz = ''
      if (this.searchData.ZCXZ && this.searchData.ZCXZ.value) {
        zcxz = this.searchData.ZCXZ.value
      }
      if (this.$refs.CTMC.array.length > 0) {
        this.searchData.CTMC = this.$refs.CTMC.array.join(',')
      } else {
        this.searchData.CTMC = ''
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
      if (!this.searchData.searchType) {
        this.searchData.searchType = this.searchCombo.searchType[0].value
      }
      const params = {
        specialorgid: this.specialorgid,
        roleCode: this.roleCode,
        page: this.page.page,
        limit: this.page.limit,
        XMMC: this.searchData.XMMC,
        YJFL: yjfl,
        IMPORTANTITEMS: importantitems,
        DYDJ: this.searchData.DYDJ,
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
        /* YSQJ_START_DATE: YSQJ_START_DATE,
        YSQJ_END_DATE: YSQJ_END_DATE, */
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
        CTMC: this.searchData.CTMC,
        ND: this.searchData.ND,
        YD_START: startMonth,
        YD_END: endMonth,
        QUERYTYPE: this.searchData.searchType,
        ZDXM: this.searchData.ZDXM
      }
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
      for (const key in this.searchData) {
        if (key === 'YSQJ_DATE_END') {
          this.searchData[key] = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
        } else if (key === 'YSQJ_DATE_START') {
          this.searchData[key] = new Date().getFullYear() + '-01-01'
        } else if (key === 'centerTreeValue' || key === 'XmlxIDTreeValue' || key === 'DWIDTree') {
          this.searchData[key] = []
        } else if (key === 'centerId' || key === 'XMLXID' || key === 'DWID') {
          this.searchData[key] = []
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
      this.$refs.CTMC.clear()
      // 成本中心
      this.getCbzxData()
      this.getXmbmcData()
      this.getXmlxData()
      this.searchCombo.EJFL = []
      this.searchCombo.SJFL = []
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
    // 数据导出
    exportData() {
      // 获取当前用户信息中id
      const user = this.store.getters.getUserMsg
      this.loading = true
      if (this.$refs.XMMC.array.length > 0) {
        this.searchData.XMMC = this.$refs.XMMC.array.join(',')
      } else {
        this.searchData.XMMC = ''
      }
      let yjfl = ''
      if (this.searchData.YJFL && this.searchData.YJFL.value) {
        yjfl = this.searchData.YJFL.value
      }
      let importantitems = ''
      if (this.searchData.IMPORTANTITEMS) {
        importantitems = this.searchData.IMPORTANTITEMS.join(',')
      }
      if (this.$refs.GWXMBM.array.length > 0) {
        this.searchData.GWXMBM = this.$refs.GWXMBM.array.join(',')
      } else {
        this.searchData.GWXMBM = ''
      }
      let ejfl = ''
      if (this.searchData.EJFL && this.searchData.EJFL.value) {
        ejfl = this.searchData.EJFL.value
      }
      let zcxz = ''
      if (this.searchData.ZCXZ && this.searchData.ZCXZ.value) {
        zcxz = this.searchData.ZCXZ.value
      }
      if (this.$refs.CTMC.array.length > 0) {
        this.searchData.CTMC = this.$refs.CTMC.array.join(',')
      } else {
        this.searchData.CTMC = ''
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
        // this.searchData.YSQJ_DATE_START为string类型，转换为date类型，获取月份
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
      if (!this.searchData.searchType) {
        this.searchData.searchType = this.searchCombo.searchType[0].value
      }
      const params = {
        userId: user.id,
        specialorgid: this.specialorgid,
        page: this.page.page,
        limit: this.page.limit,
        XMMC: this.searchData.XMMC,
        YJFL: yjfl,
        IMPORTANTITEMS: importantitems,
        DYDJ: this.searchData.DYDJ,
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
        /* YSQJ_START_DATE: YSQJ_START_DATE,
        YSQJ_END_DATE: YSQJ_END_DATE, */
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
        CTMC: this.searchData.CTMC,
        ND: this.searchData.ND,
        YD_START: startMonth,
        YD_END: endMonth,
        QUERYTYPE: this.searchData.searchType,
        ZDXM: this.searchData.ZDXM
      }
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
          cursor: pointer;
          color: #00706b;
        }
      }
    }
  }
}
</style>
