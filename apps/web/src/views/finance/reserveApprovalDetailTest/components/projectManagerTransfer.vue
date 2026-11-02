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
                    type="primary" link
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
                  <el-button type="primary" link class="txt-danger" @click="removeSelected(scope.row)">删除</el-button>
                </template>
              </vxe-column>
            </vxe-table>
          </div>
        </div>
      </div>
    </div>
  </dialogContainer>
</template>

<script setup>
import { AssetManagement } from '@/api/mainController'
import { reactive, toRef, toRefs, computed, onMounted, getCurrentInstance } from 'vue'
defineOptions({
  name: 'projectManagerTransfer'
})
const componentProps = defineProps({
  selected: {
    type: Array
  },
  getCheckTotalAmount: {
    type: Function,
    default: () => Promise.resolve({})
  },
  observer: Object,
  readOnly: Boolean
})
const componentInstance = getCurrentInstance().proxy
const componentData = reactive({
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
  sapAssetCategoryOptions: [],
  // SAP资产类别描述下拉字典
  assetSubcategoryOptions: [],
  // 资产细类描述下拉字典
  accountDescOptions: [],
  // 科目描述下拉字典

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
})
const buttonLoading = toRef(componentData, 'buttonLoading')
const pageParam = toRef(componentData, 'pageParam')
const totalItems = toRef(componentData, 'totalItems')
const searchString = toRef(componentData, 'searchString')
const tableData = toRef(componentData, 'tableData')
const selectedData = toRef(componentData, 'selectedData')
const filters = toRef(componentData, 'filters')
const sapAssetCategoryOptions = toRef(componentData, 'sapAssetCategoryOptions')
const assetSubcategoryOptions = toRef(componentData, 'assetSubcategoryOptions')
const accountDescOptions = toRef(componentData, 'accountDescOptions')
const budgetInfo = toRef(componentData, 'budgetInfo')
const props = toRef(componentData, 'props')
const totalAmount = toRef(componentData, 'totalAmount')
/**
 * 预留的查询下拉框数据函数
 * 在这里调用后端接口给 options 赋值
 */
async function loadSelectOptions() {
  // TODO: 替换为你实际的接口请求，例如：
  // this.sapAssetCategoryOptions = await dictApi.get('sap_category');
  const searchKeyOption = {
    sap: 'sapAssetCategoryOptions',
    detail: 'assetSubcategoryOptions',
    subject: 'accountDescOptions'
  }
  const searchPull = (searchKey) => {
    AssetManagement.searchPull(componentInstance, {
      search: searchKey
    }).then((res) => {
      console.log(res)
      if (res.data) {
        componentData[searchKeyOption[searchKey]] = res.data.map((item) => ({
          label: item,
          value: item
        }))
      }
    })
  }
  Object.keys(searchKeyOption).forEach((searchKey) => {
    searchPull(searchKey)
  })
}
function pageChange(number) {
  fetchLeftPage(number)
}
function addSelected(row) {
  if (!componentData.selectedData.some((item) => item.id === row.id)) {
    componentData.selectedData.push(row)
    getAnalyseAsset()
  }
}
function getAnalyseAsset() {
  const calculationDataAssetList = componentData.selectedData.map((item) => ({
    assetId: item.id
  }))
  return componentProps
    .getCheckTotalAmount({
      calculationDataAssetList
    })
    .then((res) => {
      componentData.totalAmount = res
    })
}
function removeSelected(row) {
  componentData.selectedData = componentData.selectedData.filter((item) => item.id != row.id)
  getAnalyseAsset()
}
function getInfo() {
  const selectIds = componentProps.selected?.map((item) => item.assetId) || []
  if (selectIds.length > 0) {
    getAssetManagements({
      assetManagementDtoFilter: {
        idIn: selectIds
      }
    }).then((res) => {
      if (res.data?.dataList.length > 0) {
        componentData.selectedData = res.data?.dataList
      }
    })
  }
}
function getList(params) {
  return getAssetManagements({
    ...params,
    assetManagementDtoFilter: {
      searchString: componentData.searchString,
      ...componentData.filters
    }
  }).then((res) => {
    if (res.data?.dataList) {
      componentData.tableData = res.data.dataList
      componentData.totalItems = res.data.totalCount
    }
  })
}
function getAssetManagements(params) {
  return AssetManagement.list(componentInstance, params).then((res) => res)
}
async function fetchLeftPage(pageNum = 1) {
  componentData.pageParam.pageNum = pageNum
  await getList({
    pageParam: {
      ...componentData.pageParam
    }
  })
}
async function handleSubmit() {
  onCancel(
    true,
    componentData.selectedData.map((item) => ({
      assetId: item.id
    }))
  )
}
function handleCancel() {
  onCancel(false)
}
function onCancel(isSuccess = false, data) {
  if (componentProps.observer != null) {
    componentProps.observer.cancel(isSuccess, data)
  }
}
function resetFilters() {
  componentData.filters = {
    sapAssetCategoryDesc: '',
    assetSubcategoryDesc: '',
    accountDesc: '',
    searchString: ''
  }
  fetchLeftPage()
}
const leftData = computed(() => {
  const selectedIds = componentData.selectedData.map((item) => item[componentData.props.key])
  return componentData.tableData.map((item) => ({
    ...item,
    selected: selectedIds.includes(item[componentData.props.key])
  }))
})
onMounted(() => {
  getInfo()
  fetchLeftPage()
  loadSelectOptions() // 组件加载时获取下拉框的字典数据
  getAnalyseAsset()
})
defineExpose({
  loadSelectOptions,
  pageChange,
  addSelected,
  getAnalyseAsset,
  removeSelected,
  getInfo,
  getList,
  getAssetManagements,
  fetchLeftPage,
  handleSubmit,
  handleCancel,
  onCancel,
  resetFilters,
  ...toRefs(componentData),
  leftData
})
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
