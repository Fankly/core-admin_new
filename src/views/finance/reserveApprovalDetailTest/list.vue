<template>
  <div class="reserveApproval pageStyle">
    <table-box
      id="tableBox"
      class="page-table"
      type="card"
      height="100%"
      :data="tableImpl.dataList"
      :size="defaultFormItemSize"
      :loading="tableImpl.loading"
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
      <vxe-column title="是否预安排" :min-width="120" field="preArranged">
        <template v-slot="scope">
          <span>{{ scope.row.preArranged != null ? (scope.row.preArranged == '1' ? '是' : '否') : '' }}</span>
        </template>
      </vxe-column>
      <vxe-column title="储备年份" :min-width="120" field="year" />
      <vxe-column title="储备批次" :min-width="120" field="batchName" />
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
      </template>
    </table-box>

    <!-- 详情弹窗 -->
    <vxe-modal
      v-model="detailModalVisible"
      :title="`项目详情`"
      width="95vw"
      height="95vh"
      :mask-closable="false"
      :esc-closable="true"
      resize
      show-zoom
      fullscreen
      transfer
      destroy-on-close
      @close="handleDetailModalClose"
    >
      <ReserveApprovalDetail
        v-if="detailModalVisible && currentApproveId"
        :id="currentApproveId"
        :listKey="encodedListKey"
        :approvalRole="currentPageRole.detailPath"
        :embedded="true"
        @close="handleDetailModalClose"
      />
    </vxe-modal>
  </div>
</template>
<script>
import { DropdownWidget, TableWidget } from '@/utils/widget.js'

import { uploadMixin, statsDateRangeMixin, cachePageMixin, cachedSinglePageMixin } from '@/core/mixins'

import { CwProjectApprove, CwProjectApply, CwProject } from '@/api/mainController'
import DictionaryController from '@/api/Controller/DictionaryController'
import { treeDataTranslate } from '@/utils/index'

import { categorysMixin } from '../mixin/categorysMixin.js'

import exportDialog from '../reserveApproval/exportDialog.vue'

import similarSetting from '../components/similarSetting.vue'

import ReserveApprovalDetail from './index.vue'

export default {
  components: {
    ReserveApprovalDetail
  },
  name: '/finance/reserveApprovalDetailTest/list',
  mixins: [uploadMixin, statsDateRangeMixin, cachePageMixin, cachedSinglePageMixin, categorysMixin],
  data() {
    return {
      tableImpl: new TableWidget(this.loadTableData, this.loadTableVerify, true, false, 'createTime', 1),
      formFilter: {},
      formFilterCopy: {},
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
      },
      // 详情弹窗相关
      detailModalVisible: false,
      currentApproveId: null,
      encodedListKey: ''
    }
  },
  created() {},
  mounted() {
    this.getReserveStatus()
    this.initFormData()
  },
  activated() {
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
      this.formFilterCopy = {}
      this.refreshTable(bool)
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
    // 修改为打开弹窗而不是跳转
    onDetail(approveId) {
      const jsonStr = JSON.stringify(this.listKey)
      this.encodedListKey = encodeURIComponent(jsonStr)
      this.currentApproveId = approveId
      this.detailModalVisible = true
    },
    // 关闭详情弹窗
    handleDetailModalClose() {
      this.detailModalVisible = false
      this.currentApproveId = null
      this.encodedListKey = ''
      // 刷新列表
      this.refreshTable(false)
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
    }
  },
  watch: {}
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
