<!-- 穿透 -->
<template>
  <vxe-modal
    ref="dialogFormRef"
    v-model="isShowModal"
    :destroy-on-close="true"
    resize
    show-zoom
    :title="`超包明细`"
    width="970"
    height="820"
    :close-on-press-escape="true"
    @close="closeHandle"
  >
    <div class="modal_content" ref="fromTableRef">
      <div class="toolButtoon">
        <div class="left">
          <el-button size="mini" type="primary" plain v-debounce="[exportHandle, `click`, 300]">页面导出</el-button>
          <el-button size="mini" type="primary" plain v-debounce="[closeHandle, `click`, 300]">关 闭</el-button>
        </div>
        <div class="right">
          <div class="info">
            <span class="highlight">
              <dt>年度:</dt>
              <dd>{{ formData?.nd }}</dd>
            </span>
            <span class="highlight">
              <dt> 单位:</dt>
              <dd>{{ `万元` }}</dd>
            </span>
          </div>
        </div>
      </div>
      <div class="table">
        <vxe-grid ref="tableRef" v-bind="tableInfo" />
      </div>
    </div>
  </vxe-modal>
</template>
<script lang="ts">
export default {
  name: 'matchModal'
}
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { getDynamicColumnForCt, getDataForCt } from '@/api/xmInfo/mbz'
import { ElMessage } from 'element-plus'
import { vxeExportHandle } from '@/utils/export'
import { getDataByCt, getDynamicColumnByCt } from '@/api/xmInfo/cityTargetValue'
import { formatNumValue } from '@/utils/utils'

//接收父组件传参
const props = defineProps({
  formData: {
    type: Object,
    require: true
  },
  flag: {
    type: Boolean,
    default: false
  }
})
const tableRef = ref()
const dialogFormRef = ref()
const isShowModal = ref(false)
const closeHandle = () => {
  isShowModal.value = false
}

const tableInfo = reactive<any>({
  loading: false,
  headerAlign: 'center',
  align: 'right',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32,
    keyField: 'id'
  },
  border: true,
  columnConfig: {
    resizable: true
  }
})

// 自定义导出
const exportHandle = () => {
  const $table = tableRef.value
  vxeExportHandle($table, '超包明细', tableInfo.data)
}

// 初始化表格数据
const newData = async () => {
  await getDataList()
}

// 获取数据
const getDataList = async () => {
  const api: any = props.flag ? getDataByCt : getDataForCt
  tableInfo.loading = true
  let res = await api({ ...props.formData })
  if (res.success) {
    tableInfo.data = res.data
    tableInfo.loading = false
  } else {
    tableInfo.loading = false
    ElMessage.error(res.msg)
  }
}

const getFlatColumns = (columns: any[]) => {
  if (!columns || columns.length === 0) {
    return []
  }
  columns.forEach((column: any) => {
    if (column.children && column.children.length > 0) {
      getFlatColumns(column.children)
    } else {
      if (column.visible && column['field'] !== 'name') {
        column.align = 'center'
        column.headerAlign = 'center'
        if (column.needFormat) {
          column.align = 'right'
          column.headerAlign = 'center'
          column.formatter = ({ cellValue }: { cellValue: string }) => {
            if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
            if (cellValue === '-') return cellValue
            return formatNumValue(cellValue.toString(), 6)
          }
        } else {
          column.formatter = ({ cellValue }: { cellValue: string }) => {
            if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
            if (cellValue === '-') return cellValue
            return cellValue
          }
        }
      }
    }
  })
}

//获取表头
const getHeaderData = async (params: any) => {
  const api: any = props.flag ? getDynamicColumnByCt : getDynamicColumnForCt
  let res = await api(params)
  if (res.success) {
    tableInfo.columns = res.data.map((item: any) => {
      if (item.field === 'name') {
        item.width = 'auto'
        item.align = 'left'
        item.headerAlign = 'center'
      }
      return {
        ...item
      }
    })
    getFlatColumns(tableInfo.columns)
    tableInfo.loading = false
    newData()
    return true
  } else {
    ElMessage.error(res.msg)
    return false
  }
}

defineExpose({
  isShowModal,
  getHeaderData,
  closeHandle
})
</script>

<style scoped lang="less">
.modal_content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .toolButtoon {
    align-items: center;
    display: flex;
    margin-bottom: 10px;

    .left {
      min-width: 200px;
    }

    .right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex: 1 1 auto;

      .info {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0;

        .highlight {
          display: inline-flex;
          align-items: center;
          font-size: 14px;
          padding: 4px 12px;
          background-color: var(--el-fill-color-light, #f5f7fa);
          border: 1px solid var(--el-border-color-light, #dcdfe6);
          border-radius: 4px;
          white-space: nowrap;
          transition: background-color 0.2s;
          max-width: 240px;

          &:hover {
            background-color: var(--el-fill-color, #e6e8eb);
          }

          dt {
            color: var(--el-text-color-regular, #606266);
            font-weight: normal;
            margin: 0;
          }

          dd {
            font-weight: 600;
            color: var(--el-text-color-primary, #303133);
            margin: 0 0 0 6px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }
  .table {
    min-height: 500px;
    flex: 1 1 auto;
  }
}
</style>
