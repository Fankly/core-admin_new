<template>
  <dialogContainer
    :readOnly="readOnly"
    disabledScroll
    :bodyStyle="{ margin: 0 }"
    :buttonLoading="buttonLoading"
    submitLabel="提交"
    cancelLabel="取消"
    class="projectManagerTransfer"
    ref="dialogContainer"
    :onCancel="() => handleCancel()"
    :onSubmit="() => handleSubmit()"
  >
    <div class="select-people-container">
      <!-- ================= 顶部: 搜索面板 ================= -->
      <div class="top-search-panel">
        <div class="search-form">
          <div class="form-item">
            <label>搜索:</label>
            <el-input v-model="filters.searchString" placeholder="请输入搜索内容" size="small" clearable />
          </div>
          <div class="form-item">
            <label>SAP资产类别描述:</label>
            <el-select
              filterable
              v-model="filters.sapAssetCategoryDesc"
              placeholder="请选择资产类别"
              size="small"
              clearable
              popper-class="project-manager-transfer-select-popper"
            >
              <el-option v-for="item in sapAssetCategoryOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </div>
          <div class="form-item">
            <label>资产细类描述:</label>
            <el-select
              filterable
              v-model="filters.assetSubcategoryDesc"
              placeholder="请选择资产细类"
              size="small"
              clearable
              popper-class="project-manager-transfer-select-popper"
            >
              <el-option v-for="item in assetSubcategoryOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </div>
          <div class="form-item">
            <label>科目描述:</label>
            <el-select
              filterable
              v-model="filters.accountDesc"
              placeholder="请选择科目描述"
              size="small"
              clearable
              popper-class="project-manager-transfer-select-popper"
            >
              <el-option v-for="item in accountDescOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </div>
          <div class="form-actions">
            <el-button type="primary" size="small" @click="fetchLeftPage()">查询</el-button>
            <el-button size="small" @click="resetFilters">重置</el-button>
          </div>
        </div>

        <!-- 预算信息显示框 (位于最后边) -->
        <div v-if="totalAmount.analyseAsset" class="budget-info-box">
          <span>{{ totalAmount.analyseAsset }}</span>
        </div>
      </div>

      <!-- ================= 下部: 左右穿梭区域 ================= -->
      <div class="transfer-main-body">
        <!-- 左侧区域 -->
        <div class="left">
          <div class="title-box">
            <span class="tit">资产卡片库</span>
          </div>

          <div class="table-wrapper">
            <vxe-table auto-resize border :show-overflow="true" :data="leftData" height="100%">
              <vxe-column title="序号" type="seq" width="50px" align="center" />

              <vxe-column title="ERP设备编号" field="equipmentNumber" min-width="160px" />
              <vxe-column title="ERP资产编号" field="assetCode" min-width="120px" />
              <vxe-column title="ERP资产名称" field="assetName" min-width="150px" />

              <vxe-column title="SAP资产类别描述" field="sapAssetCategoryDesc" min-width="150px" />
              <vxe-column title="ERP资产明细类名称" field="assetSubcategoryDesc" min-width="150px" />
              <vxe-column title="资产原值(元)" field="accumulatedPurchaseValue" min-width="130px" />
              <vxe-column title="资产净值(元)" field="bookNetValue" min-width="130px" />
              <vxe-column title="PMS设备编号" field="professionalSystemEquipmentNo" min-width="160px" />
              <vxe-column title="科目描述" field="accountDesc" min-width="150px" />

              <vxe-column title="资本化日期" field="capitalizationDate" min-width="120px" />
              <vxe-column fixed="right" v-if="!readOnly" title="操作" width="80px" align="center">
                <template v-slot="scope">
                  <el-button
                    type="text"
                    :disabled="scope.row.selected"
                    :class="scope.row.selected ? 'txt-info' : 'txt-primary'"
                    @click="addSelected(scope.row)"
                  >
                    {{ scope.row.selected ? '已添加' : '添加' }}
                  </el-button>
                </template>
              </vxe-column>
            </vxe-table>
          </div>

          <!-- 分页器 -->
          <div class="page-box">
            <el-pagination
              @current-change="pageChange"
              layout="total, prev, pager, next"
              :current-page="pageParam.pageNum"
              :page-size="pageParam.pageSize"
              :total="totalItems"
            >
            </el-pagination>
          </div>
        </div>

        <!-- 右侧区域 -->
        <div class="right">
          <div class="title-box">
            <span class="tit">已关联资产 ({{ selectedData.length }})</span>
          </div>

          <div class="table-wrapper">
            <vxe-table auto-resize border :show-overflow="true" :data="selectedData" height="100%">
              <vxe-column title="序号" type="seq" width="50px" align="center" />
              <vxe-column title="ERP资产编号" field="assetCode" min-width="120px" />
              <vxe-column title="ERP资产名称" field="assetName" min-width="150px" />
              <vxe-column title="资产原值(元)" field="accumulatedPurchaseValue" min-width="130px" />
              <vxe-column fixed="right" v-if="!readOnly" title="操作" width="80px" align="center">
                <template v-slot="scope">
                  <el-button type="text" class="txt-danger" @click="removeSelected(scope.row)">删除</el-button>
                </template>
              </vxe-column>
            </vxe-table>
          </div>
        </div>
      </div>
    </div>
  </dialogContainer>
</template>

<script>
import { AssetManagement } from '@/api/mainController'

export default {
  name: 'projectManagerTransfer',
  props: {
    selected: {
      type: Array
    },
    getCheckTotalAmount: {
      type: Function,
      default: () => Promise.resolve({})
    },
    observer: Object,
    readOnly: Boolean
  },
  data() {
    return {
      buttonLoading: false,
      pageParam: {
        pageNum: 1,
        pageSize: 10
      },
      totalItems: 0,
      searchString: '',
      tableData: [],
      selectedData: [],
      filters: {
        searchString: '',
        sapAssetCategoryDesc: '',
        assetSubcategoryDesc: '',
        accountDesc: ''
      },

      // ================== 下拉框预留数据 ==================
      sapAssetCategoryOptions: [], // SAP资产类别描述下拉字典
      assetSubcategoryOptions: [], // 资产细类描述下拉字典
      accountDescOptions: [], // 科目描述下拉字典

      // ================== 展示框文字数据 ==================
      budgetInfo: {
        totalBudget: '40.63',
        currentYearBudget: '0',
        ratio: '8.4300'
      },

      props: {
        key: 'id'
      },
      totalAmount: {}
    }
  },
  computed: {
    leftData() {
      const selectedIds = this.selectedData.map((item) => item[this.props.key])
      return this.tableData.map((item) => ({
        ...item,
        selected: selectedIds.includes(item[this.props.key])
      }))
    }
  },
  mounted() {
    this.getInfo()
    this.fetchLeftPage()
    this.loadSelectOptions() // 组件加载时获取下拉框的字典数据
    this.getAnalyseAsset()
  },
  methods: {
    /**
     * 预留的查询下拉框数据函数
     * 在这里调用后端接口给 options 赋值
     */
    async loadSelectOptions() {
      // TODO: 替换为你实际的接口请求，例如：
      // this.sapAssetCategoryOptions = await dictApi.get('sap_category');
      const searchKeyOption = {
        sap: 'sapAssetCategoryOptions',
        detail: 'assetSubcategoryOptions',
        subject: 'accountDescOptions'
      }
      const searchPull = (searchKey) => {
        AssetManagement.searchPull(this, { search: searchKey }).then((res) => {
          console.log(res)
          if (res.data) {
            this[searchKeyOption[searchKey]] = res.data.map((item) => ({
              label: item,
              value: item
            }))
          }
        })
      }
      Object.keys(searchKeyOption).forEach((searchKey) => {
        searchPull(searchKey)
      })
    },

    pageChange(number) {
      this.fetchLeftPage(number)
    },
    addSelected(row) {
      if (!this.selectedData.some((item) => item.id === row.id)) {
        this.selectedData.push(row)
        this.getAnalyseAsset()
      }
    },
    getAnalyseAsset() {
      const calculationDataAssetList = this.selectedData.map((item) => ({ assetId: item.id }))
      return this.getCheckTotalAmount({ calculationDataAssetList }).then((res) => {
        this.totalAmount = res
      })
    },
    removeSelected(row) {
      this.selectedData = this.selectedData.filter((item) => item.id != row.id)
      this.getAnalyseAsset()
    },
    getInfo() {
      const selectIds = this.selected?.map((item) => item.assetId) || []
      if (selectIds.length > 0) {
        this.getAssetManagements({ assetManagementDtoFilter: { idIn: selectIds } }).then((res) => {
          if (res.data?.dataList.length > 0) {
            this.selectedData = res.data?.dataList
          }
        })
      }
    },
    getList(params) {
      return this.getAssetManagements({
        ...params,
        assetManagementDtoFilter: {
          searchString: this.searchString,
          ...this.filters
        }
      }).then((res) => {
        if (res.data?.dataList) {
          this.tableData = res.data.dataList
          this.totalItems = res.data.totalCount
        }
      })
    },
    getAssetManagements(params) {
      return AssetManagement.list(this, params).then((res) => res)
    },
    async fetchLeftPage(pageNum = 1) {
      this.pageParam.pageNum = pageNum
      await this.getList({
        pageParam: { ...this.pageParam }
      })
    },
    async handleSubmit() {
      this.onCancel(
        true,
        this.selectedData.map((item) => ({ assetId: item.id }))
      )
    },
    handleCancel() {
      this.onCancel(false)
    },
    onCancel(isSuccess = false, data) {
      if (this.observer != null) {
        this.observer.cancel(isSuccess, data)
      }
    },
    resetFilters() {
      this.filters = {
        sapAssetCategoryDesc: '',
        assetSubcategoryDesc: '',
        accountDesc: '',
        searchString: ''
      }
      this.fetchLeftPage()
    }
  }
}
</script>

<style lang="less" scoped>
/* 覆盖 dialog 的 padding */
:deep(.projectManagerTransfer .el-dialog__body) {
  padding: 0 !important;
}

.select-people-container {
  height: 100%;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  padding: 16px;
  box-sizing: border-box;

  /* ================= 顶部搜索栏 ================= */
  .top-search-panel {
    background: #fff;
    padding: 12px 16px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    margin-bottom: 16px;
    flex-shrink: 0;

    /* 改用Flex让左边表单和右边显示框分离两边 */
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap; /* 适配小屏幕宽度防挤压 */
    gap: 16px;

    .search-form {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;

      .form-item {
        display: flex;
        align-items: center;
        gap: 8px;
        label {
          font-size: 14px;
          color: #606266;
          white-space: nowrap;
        }
        .el-select {
          width: 180px; /* 原生el-input宽度延续给select */
        }
      }
      .form-actions {
        display: flex;
        gap: 10px;
      }
    }

    /* 按照截图增加的右侧展示信息框的样式 */
    .budget-info-box {
      background-color: #eaf3ef; /* 浅灰绿背景 */
      border-left: 4px solid #2b8c85; /* 深绿色左边框 */
      color: #2b8c85; /* 字体深绿 */
      padding: 6px 12px;
      border-radius: 2px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      gap: 16px;
      white-space: nowrap; /* 不换行 */
      border-radius: 4px;
    }
  }

  /* ================= 底部：左右穿梭主体 ================= */
  .transfer-main-body {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 16px;
    overflow: hidden;

    .left,
    .right {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #fff;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      overflow: hidden;
      min-height: 0;
    }

    .title-box {
      height: 44px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      background-color: #f8f9fc;
      border-bottom: 1px solid #e4e7ed;
      flex-shrink: 0;

      .tit {
        font-size: 14px;
        font-weight: bold;
        color: #303133;
      }
    }

    .table-wrapper {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .page-box {
      height: 48px;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding: 0 16px;
      border-top: 1px solid #e4e7ed;
      flex-shrink: 0;
      background: #fff;
    }
  }

  .txt-info {
    color: #c0c4cc;
    cursor: not-allowed;
  }
  .txt-danger {
    color: #f56c6c;
  }
  .txt-primary {
    color: #409eff;
  }
}
</style>
