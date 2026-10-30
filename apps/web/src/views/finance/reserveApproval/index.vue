<template>
  <div class="reserveApproval pageStyle">
    <filter-config-box class="reserveApproval__filter" type="card" :options="filterOptions" v-model="formFilter" @search="refreshTable(true)" />
    <table-box
      id="tableBox"
      class="page-table"
      type="card"
      height="100%"
      :data="tableImpl.dataList"
      :size="defaultFormItemSize"
      @sort-change="onTableSortChange"
      @refresh="refreshTable(true)"
      @input="(value) => (checkboxValues = value)"
      :seq-config="{ startIndex: (tableImpl.currentPage - 1) * tableImpl.pageSize }"
    >
      <template #operator>
        <!-- <el-button icon="el-icon-download" :size="defaultFormItemSize" @click="handleExport()">导出</el-button>
        <el-button icon="el-icon-circle-check" :size="defaultFormItemSize" @click="handleConfirm()">全部通过</el-button>
        <el-button
          type="primary"
          v-if="['financeApproval'].includes($route.name)"
          icon="el-icon-setting"
          :size="defaultFormItemSize"
          @click="handleSetting()"
          >配置</el-button
        > -->
      </template>
      <vxe-column title="序号" type="seq" width="50px" />
      <vxe-column title="项目类型" :min-width="120" field="categoryName" />
      <vxe-column title="重点投向" :min-width="120" field="keyInvestName" />
      <vxe-column title="预算事项" :min-width="220" field="courseTitleName" />
      <vxe-column title="项目名称" :min-width="440" field="name" />
      <vxe-column title="申请总额(万元)" :min-width="120" field="applyTaxExclusive" />
      <vxe-column title="归口部门" :min-width="120" field="affiliateDeptName" />
      <vxe-column title="二级单位" :min-width="120" field="secondDeptName" />
      <vxe-column title="实施部门" :min-width="120" field="implDept" />
      <!--  <vxe-column title="招标方式" :min-width="120" field="biddingMethod">
        <template v-slot="scope">
          <span>{{ scope.row.biddingMethod != null ? (scope.row.biddingMethod == '1' ? '框架招标' : '单项招标') : '' }}</span>
        </template>
      </vxe-column> -->
      <vxe-column title="是否预安排" :min-width="120" field="preArranged">
        <template v-slot="scope">
          <span>{{ scope.row.preArranged != null ? (scope.row.preArranged == '1' ? '是' : '否') : '' }}</span>
        </template>
      </vxe-column>
      <!-- <vxe-column title="项目负责人" :min-width="120" field="projectLead" />
      <vxe-column title="分管主任" :min-width="120" field="sectionLead" />
      <vxe-column title="创建时间" :min-width="120">
        <template v-slot="scope">
          <span>{{ formatDateByStatsType(scope.row.createTime, 'day') }}</span>
        </template>
      </vxe-column>
       -->
      <vxe-column title="储备年份" :min-width="120" field="year" />
      <vxe-column title="储备批次" :min-width="120" field="batchName" />
      <!--   <vxe-column title="储备状态" fixed="right" :min-width="120" field="reserveStatus">
        <template v-slot="scope">
          <base-tag class="status--tag" :type="getType(scope.row.reserveStatus)" :size="defaultFormItemSize">{{
            reserveStatus.filter((item) => item.key == scope.row.reserveStatus)?.[0]?.value
          }}</base-tag>
        </template>
      </vxe-column> -->
      <!--   <vxe-column title="人工复审结论" fixed="right" :min-width="120" field="approveStatus">
        <template v-slot="scope">
          <base-tag :type="ApprovedTypeDict.getValue(+scope.row.approveStatus, 'type')" :size="defaultFormItemSize">{{
            ApprovedTypeDict.getValue(+scope.row.approveStatus)
          }}</base-tag>
        </template>
      </vxe-column> -->
      <vxe-column title="AI初评结论" fixed="right" :min-width="120" field="aiRiskLevel">
        <template v-slot="scope">
          <base-tag :type="AIRiskLevelDict.getList().filter((item) => item.id == scope.row.aiRiskLevel)?.[0]?.type" :size="defaultFormItemSize">{{
            AIRiskLevelDict.getList().filter((item) => item.id == scope.row.aiRiskLevel)?.[0]?.name
          }}</base-tag>
        </template>
      </vxe-column>
      <vxe-column title="操作" width="150px" fixed="right">
        <template v-slot="scope">
          <el-button type="text" :size="defaultFormItemSize" @click="onDetail(scope.row.approveId)"> 详情 </el-button>
        </template>
      </vxe-column>

      <template #pagination>
        <el-row type="flex" justify="space-between" style="margin-top: 16px">
          <span class="custom-total-extra" style="">列表金额总计（万元）：{{ amount }}</span>
          <el-pagination
            :total="tableImpl.totalCount"
            :current-page="tableImpl.currentPage"
            :page-size="tableImpl.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, prev, pager, next, sizes"
            @current-change="onTableCurrentPageChange"
            @size-change="onTablePageSizeChange"
          >
          </el-pagination>
        </el-row>
      </template>
    </table-box>
  </div>
</template>
<script>
import { DropdownWidget, TableWidget } from '@/utils/widget.js'

import { uploadMixin, statsDateRangeMixin, cachePageMixin, cachedSinglePageMixin } from '@/core/mixins'

import { CwProjectApprove, CwProjectApply, CwProject } from '@/api/mainController'
import DictionaryController from '@/api/Controller/DictionaryController'
import { treeDataTranslate } from '@/utils/index'

import { categorysMixin } from '../mixin/categorysMixin.js'

import exportDialog from './exportDialog.vue'

import similarSetting from '../components/similarSetting.vue'
import { saveReserveApprovalReturnFilter, takeReserveApprovalReturnFilter } from './routeFilterState.mjs'

export default {
  components: {},
  props: {},
  name: '/finance/reserveApproval/index',
  mixins: [uploadMixin, statsDateRangeMixin, cachePageMixin, cachedSinglePageMixin, categorysMixin],
  data() {
    return {
      tableImpl: new TableWidget(this.loadTableData, this.loadTableVerify, true, false, 'createTime', 1),
      formFilter: {},
      formFilterCopy: {},
      routeAiRiskLevelFilterKey: '',
      listKey: '',
      reserveStatus: [],
      amount: '',
      deptId: {
        impl: new DropdownWidget(this.loadDeptIdDropdownList)
      },
      pageRoleMap: {
        deptApproval: {
          apiSuffix: 'dept',
          detailPath: 'deptApprovalDetail',
          vtSource: 1
        },
        financeApproval: {
          apiSuffix: 'finance',
          detailPath: 'financeApprovalDetail',
          vtSource: 2
        },
        jysApproval: {
          apiSuffix: 'jys',
          detailPath: 'jysApprovalDetail',
          vtSource: 4
        },
        fzbApproval: {
          apiSuffix: 'fzb',
          detailPath: 'fzbApprovalDetail',
          vtSource: 3
        }
      }
    }
  },
  created() {},
  mounted() {
    this.getReserveStatus()
    this.initFormData()
  },
  activated() {
    if (!this.restoreDetailReturnFilter()) {
      this.applyRouteAiRiskLevelFilter()
    }
    this.refreshTable(true)
  },
  methods: {
    getReserveStatus() {
      CwProject.reserveStatus(this, {}).then((res) => {
        this.reserveStatus = res.data
      })
    },
    getType(type) {
      let _type = 'primary'
      switch (+type) {
        case this.StatusReserveDict.PENDING_SUBMIT:
          _type = 'info'
          break
        case this.StatusReserveDict.REJECTED || this.StatusReserveDict.DELAYED:
          _type = 'warning'
          break
        case this.StatusReserveDict.PRE_REVIEW_COMPLETED:
          _type = 'success'
          break
      }
      return _type
    },
    async handleApprove(projectId, approveId) {
      await this.$confirm('确认审核通过?')
      CwProjectApprove[`${this.currentPageRole.apiSuffix}Approve`](this, {
        cwApproveDto: {
          projectId: projectId,
          id: approveId
        }
      }).then(() => {
        this.$message.success('操作成功')
        this.refreshTable(true)
      })
    },
    async handleConfirm() {
      await this.$confirm('确认全部审核通过?')
      const { batchId, ...options } = this.formFilterCopy
      CwProjectApprove[`${this.currentPageRole.apiSuffix}ApproveBatch`](this, {
        cwProjectDtoFilter: {
          ...options,
          batchIds: batchId?.join(',')
        }
      }).then(() => {
        this.$message.success('操作成功')
        this.refreshTable(true)
      })
    },
    async initFormData(bool = true) {
      await this.onDeptIdVisibleChange(true)
      this.formFilter = {}
      const restoredFilter = this.takeDetailReturnFilter()
      if (restoredFilter) {
        this.formFilter = restoredFilter
        this.formFilterCopy = {
          ...restoredFilter
        }
        this.markRouteAiRiskLevelFilterConsumed()
        await this.getDefaultCategory(this.formFilter)
      } else {
        this.getDefaultCategory()
        this.applyRouteAiRiskLevelFilter()
      }
      this.refreshTable(bool)
    },
    getRouteAiRiskLevel() {
      const rawValue = this.$route.query?.aiRiskLevel
      const value = Array.isArray(rawValue) ? rawValue[0] : rawValue
      if (value == null || value === '') return null

      const aiRiskLevel = Number(value)
      const validRiskLevels = [this.AIRiskLevelDict.RISK_HIGH, this.AIRiskLevelDict.RISK_MEDIUM, this.AIRiskLevelDict.RISK_LOW]
      return validRiskLevels.includes(aiRiskLevel) ? aiRiskLevel : null
    },
    applyRouteAiRiskLevelFilter() {
      // 看板跳转带入的 aiRiskLevel 在当前页面实例上只消费一次，避免从详情页返回、
      // 切换页签后 activated() 再次用旧 query 覆盖用户手动修改后的查询条件。
      // 注意：不能用 router.replace 把 query 从 URL 移除——页签和 keep-alive 都以
      // fullPath 为 key，改 URL 会被框架当成新页面，产生第二个页签/实例
      const aiRiskLevel = this.getRouteAiRiskLevel()
      if (aiRiskLevel == null) return false

      const filterKey = this.getRouteAiRiskLevelFilterKey(aiRiskLevel)
      if (this.routeAiRiskLevelFilterKey === filterKey) return false

      this.routeAiRiskLevelFilterKey = filterKey
      this.formFilter = { aiRiskLevel }
      return true
    },
    getRouteAiRiskLevelFilterKey(aiRiskLevel = this.getRouteAiRiskLevel()) {
      if (aiRiskLevel == null) return ''
      return `${this.$route.path}|${this.$route.query?._origin || ''}|${aiRiskLevel}`
    },
    markRouteAiRiskLevelFilterConsumed() {
      const filterKey = this.getRouteAiRiskLevelFilterKey()
      if (filterKey) this.routeAiRiskLevelFilterKey = filterKey
    },
    getReturnFilterStorage() {
      try {
        return typeof window === 'undefined' ? null : window.sessionStorage
      } catch (e) {
        return null
      }
    },
    takeDetailReturnFilter() {
      return takeReserveApprovalReturnFilter(this.getReturnFilterStorage(), this.$route.fullPath)
    },
    restoreDetailReturnFilter() {
      const restoredFilter = this.takeDetailReturnFilter()
      if (!restoredFilter) return false

      this.formFilter = restoredFilter
      this.formFilterCopy = {
        ...restoredFilter
      }
      this.markRouteAiRiskLevelFilterConsumed()
      return true
    },
    saveDetailReturnFilter() {
      saveReserveApprovalReturnFilter(this.getReturnFilterStorage(), this.$route.fullPath, this.formFilter)
    },
    handleSetting() {
      this.$dialog
        .show(
          '配置',
          similarSetting,
          {
            area: ['800px']
          },
          {}
        )
        .then((res) => {
          this.refreshTable(true)
        })
        .catch(() => {})
    },
    handleExport() {
      this.$dialog
        .show(
          '导出',
          exportDialog,
          {
            area: ['450px', 'auto']
          },
          {
            vtSource: this.currentPageRole.vtSource,
            exportOptions: ['financeApproval', 'deptApproval'].includes(this.$route.name) ? [1, 5] : [1]
          }
        )
        .then((res) => {})
        .catch((e) => {})
    },
    refreshTable(reloadData = false) {
      if (reloadData) {
        this.tableImpl.refreshTable(true, 1)
      } else {
        this.tableImpl.refreshTable()
      }
    },
    // Call TableWidget methods with the reactive proxy so pagination state updates render.
    onTableSortChange(sortInfo) {
      return TableWidget.prototype.onSortChange.call(this.tableImpl, sortInfo)
    },
    onTableCurrentPageChange(newCurrentPage) {
      return TableWidget.prototype.onCurrentPageChange.call(this.tableImpl, newCurrentPage)
    },
    onTablePageSizeChange(newPageSize) {
      return TableWidget.prototype.onPageSizeChange.call(this.tableImpl, newPageSize)
    },
    loadTableData(params) {
      const { batchId, ...options } = this.formFilterCopy
      params.cwProjectApproveDtoFilter = {
        ...options,
        batchIds: batchId?.join(',')
      }
      return new Promise((resolve, reject) => {
        CwProjectApprove[`${this.currentPageRole.apiSuffix}List`](this, params)
          .then((res) => {
            this.amount = res.data.amount
            this.listKey = res.data.listKey
            resolve({
              dataList: res.data.dataList,
              totalCount: res.data.totalCount
            })
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    loadTableVerify() {
      this.formFilterCopy = {
        ...this.formFilter
      }
      return true
    },
    onDetail(approveId) {
      const jsonStr = JSON.stringify(this.listKey)
      const encodedStr = encodeURIComponent(jsonStr)

      this.saveDetailReturnFilter()
      this.$router.push({
        name: '/finance/reserveApprovalDetail',
        query: {
          id: approveId,
          listKey: encodedStr,
          approvalRole: this.currentPageRole.detailPath
        }
      })
    },
    loadDeptIdDropdownList() {
      return new Promise((resolve, reject) => {
        DictionaryController.dictSysDept(this, {})
          .then((res) => {
            const treeData = treeDataTranslate(res.getList(), 'id')
            const secondLevelData = []
            treeData.forEach((topNode) => {
              if (topNode.children && topNode.children.length > 0) {
                secondLevelData.push(...topNode.children)
              }
            })
            resolve(secondLevelData)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    onDeptIdVisibleChange() {
      return this.deptId?.impl?.onVisibleChange(true).catch((e) => {})
    }
  },
  computed: {
    currentPageRole() {
      const routeName = this.$route.name
      return this.pageRoleMap[routeName] || this.pageRoleMap.deptApproval
    },
    isFinance() {
      return this.$route.name === 'financeApproval'
    },
    filterOptions() {
      return [
        {
          prop: 'name',
          label: '搜索',
          // labelPrompt: '可搜索项目名称、项目责任人、实施部门、归口部门、二级单位',
          labelPrompt: '可搜索项目名称、二级单位',
          attrs: {
            placeholder: '请输入搜索'
          }
        },
        /*  {
          tag: 'cascader',
          prop: 'affiliateDeptIdList',
          label: '归口部门',
          attrs: {
            props: { value: 'id', label: 'name', checkStrictly: true, multiple: true },
            filterable: true,
            'collapse-tags': true,
            loading: this.deptId?.impl?.loading,
            options: this.deptId?.impl?.dropdownList || [],
            placeholder: '请选择归口部门'
          }
        }, */
        ...this.getCategoryFilter(this.formFilter, (data) => (this.formFilter = data), null, { multiple: true, 'collapse-tags': true }),
        {
          tag: 'select',
          prop: 'preArranged',
          label: '预安排',
          attrs: {
            options: [
              {
                value: '0',
                label: '否'
              },
              {
                value: '1',
                label: '是'
              }
            ]
          }
        },
        /* {
          tag: 'select',
          prop: 'reserveStatuses',
          label: '储备状态',
          attrs: {
            multiple: true,
            'collapse-tags': true,
            options: this.reserveStatus
              .map((item) => ({
                value: item.key,
                label: item.value
              }))
              .filter((item) => item.value != this.StatusReserveDict.PENDING_SUBMIT)
          }
        },
        {
          tag: 'select',
          prop: 'status',
          label: '人工复审结论',
          attrs: {
            options: this.ApprovedTypeDict.getList()
              .filter((item) => item.id != this.ApprovedTypeDict.UNSUBMIT)
              .map((item) => ({
                value: item.id,
                label: item.name
              }))
          }
        }, */
        {
          tag: 'select',
          prop: 'aiRiskLevel',
          label: 'AI初评结论',
          attrs: {
            options: this.AIRiskLevelDict.getList()
              .filter((item) => item.id != this.AIRiskLevelDict.UNANALYZED)
              .map((item) => ({
                value: item.id,
                label: item.name
              }))
          }
        }
      ]
    }
  },
  watch: {
    '$route.query.aiRiskLevel'() {
      if (!this.restoreDetailReturnFilter() && this.applyRouteAiRiskLevelFilter()) {
        this.refreshTable(true)
      }
    }
  }
}
</script>
<style lang="scss">
.rr-view-ctx:has(.reserveApproval) {
  background-color: rgba(0, 168, 150, 0.08);
}

.rr-view-ctx-card:has(.reserveApproval) {
  background: transparent;
}

.reserveApproval {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.reserveApproval__filter {
  flex-shrink: 0;
}

.reserveApproval .page-table {
  min-width: 0;
  min-height: 0;
}

.reserveApproval .page-table .vxe-table-box {
  min-width: 0;
  min-height: 0;
}

.reserveApproval .page-table .table-card-style .vxe-table--body-wrapper {
  overflow-x: auto !important;
}
</style>
