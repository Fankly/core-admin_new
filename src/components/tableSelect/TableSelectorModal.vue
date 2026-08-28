<template>
  <vxe-modal
    resize
    :loading="loading"
    position="center"
    showZoom
    show-footer
    v-model="modalVisible"
    :title="title"
    :width="width"
    :height="height"
    @close="handleClose"
  >
    <div class="table-selector-modal">
      <div class="search-area" v-if="searchFields && searchFields.length > 0">
        <div class="search-form">
          <template v-for="field in searchFields" :key="field.field">
            <div class="search-item">
              <span>{{ field.label }}:</span>
              <el-input
                v-if="!field.type || field.type === 'input'"
                v-model="searchParams[field.field]"
                :placeholder="`请输入${field.label}`"
                :disabled="field.disabled"
              ></el-input>
              <el-select
                v-else-if="field.type === 'select'"
                v-model="searchParams[field.field]"
                :placeholder="`请选择${field.label}`"
                :disabled="field.disabled"
                clearable
              >
                <el-option v-for="option in field.options" :key="option.value" :label="option.label" :value="option.value"></el-option>
              </el-select>
            </div>
          </template>
          <div class="search-buttons">
            <el-button type="primary" @click="handleSearch">查 询</el-button>
            <el-button @click="resetSearch">重 置</el-button>
          </div>
        </div>
      </div>

      <div class="table-area">
        <vxe-table
          resizable
          showHeaderOverflow
          showOverflow
          ref="xTable"
          :data="tableData"
          border
          align="center"
          header-align="center"
          height="100%"
          :row-config="{ keyField: idField, height: 32, isHover: true }"
          :radio-config="{}"
          @radio-change="handleRadioChange"
          @cell-click="handleRowClick"
        >
          <vxe-column type="radio" width="50" align="center"></vxe-column>
          <vxe-column v-for="col in tableColumns" :key="col.field" :field="col.field" :title="col.title" :width="col.width"></vxe-column>
        </vxe-table>
      </div>

      <div class="pagination-area" v-if="pagination.total > 0">
        <el-pagination
          :current-page="pagination.page"
          background
          align="center"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.limit"
          :total="parseInt(pagination.total + '')"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="limitChangeHandle"
          @current-change="pageChangeHandle"
        ></el-pagination>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
        <el-button @click="handleClose">取 消</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="TableSelectorModal">
import { ref, reactive, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { VxeTableInstance } from 'vxe-table'

interface SearchField {
  field: string
  label: string
  type?: 'input' | 'select'
  options?: Array<{ label: string; value: any }>
  disabled?: boolean
  defaultValue?: any
}

interface TableColumn {
  field: string
  title: string
  width?: number
}

interface TableData {
  [key: string]: any
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '选择数据'
  },
  width: {
    type: [String, Number],
    default: '70%'
  },
  height: {
    type: [String, Number],
    default: '600px'
  },
  idField: {
    type: String,
    required: true
  },
  labelField: {
    type: String,
    required: true
  },
  searchFields: {
    type: Array as () => SearchField[],
    default: () => []
  },
  tableColumns: {
    type: Array as () => TableColumn[],
    required: true
  },
  api: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'close'])

const modalVisible = ref(false)
const loading = ref(false)
const xTable = ref<VxeTableInstance<any>>()
const tableData = ref<TableData[]>([])
const selectedRow = ref<TableData | null>(null)

const searchParams = reactive<Record<string, any>>({})
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const initSearchParams = () => {
  props.searchFields.forEach((field: SearchField) => {
    searchParams[field.field] = field.defaultValue !== undefined ? field.defaultValue : ''
  })
}

const fetchTableData = async () => {
  try {
    loading.value = true
    const params = {
      ...searchParams,
      pageNum: pagination.page,
      pageSize: pagination.limit
    }
    const res = await props.api(params)
    if (res.success) {
      tableData.value = res.data?.records || res.data || []
      pagination.total = res.data?.total || res.total || 0
    } else {
      ElMessage.error(res.msg || '获取数据失败')
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchTableData()
}

const resetSearch = () => {
  initSearchParams()
  pagination.page = 1
  fetchTableData()
}

const pageChangeHandle = (currentPage: number) => {
  pagination.page = currentPage
  fetchTableData()
}

const limitChangeHandle = (pageSize: number) => {
  pagination.page = 1
  pagination.limit = pageSize
  fetchTableData()
}

const handleRadioChange = ({ row }: any) => {
  selectedRow.value = row
}

const handleRowClick = ({ row }: any) => {
  selectedRow.value = row
  xTable.value?.setRadioRow(row)
}

const handleConfirm = () => {
  if (!selectedRow.value) {
    ElMessage.warning('请选择一条数据')
    return
  }
  const data = {
    id: selectedRow.value[props.idField],
    label: selectedRow.value[props.labelField],
    ...selectedRow.value
  }
  emit('confirm', data)
  handleClose()
}

const handleClose = () => {
  modalVisible.value = false
  emit('update:modelValue', false)
  emit('close')
  selectedRow.value = null
  xTable.value?.clearRadioRow()
  resetSearch()
}

const open = async () => {
  modalVisible.value = true
  initSearchParams()
  selectedRow.value = null
  xTable.value?.clearRadioRow()
  await fetchTableData()
}

defineExpose({
  open,
  modalVisible
})
</script>

<style scoped lang="less">
.table-selector-modal {
  display: flex;
  flex-direction: column;
  height: 100%;

  .search-area {
    margin-bottom: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 15px;

    .search-form {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 15px;

      .search-item {
        display: flex;
        align-items: center;
        gap: 8px;

        span {
          white-space: nowrap;
          font-weight: 500;
          color: #606266;
          font-size: 14px;
        }

        :deep(.el-input),
        :deep(.el-select) {
          width: 180px;
        }
      }

      .search-buttons {
        margin-left: auto;
        display: flex;
        gap: 10px;
      }
    }
  }

  .table-area {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    border: 1px solid #ebeef5;
    border-radius: 4px;

    :deep(.vxe-table) {
      .vxe-header--column {
        background-color: #f5f7fa;
        font-weight: 500;
      }

      .vxe-body--row {
        &.row--hover {
          background-color: #f5f7fa;
        }

        &.row--radio-checked {
          background-color: #ecf5ff;
        }
      }
    }
  }

  .pagination-area {
    display: flex;
    justify-content: flex-end;
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 10px;

  .el-button {
    padding: 9px 20px;
  }
}
</style>
