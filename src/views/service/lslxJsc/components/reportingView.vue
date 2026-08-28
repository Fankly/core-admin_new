<!-- 上报查看组件 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      resize
      show-zoom
      :title="formData?.title"
      :fullscreen="true"
      :width="1200"
      :close-on-press-escape="true"
      @close="closeHandle"
      :loading="pageInfo.loading"
    >
      <div class="content">
        <div class="toolButtoon">
          <div class="left">
            <el-button size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
            <el-button size="mini" type="primary" plain @click="exportHandle1">页面导出</el-button>
            <el-button size="mini" type="primary" plain @click="exportHandle">全量导出</el-button>
          </div>
          <div class="right">
            <div class="info">
              <span class="highlight">
                版本编号: <span>{{ formData?.versionNo }}</span>
              </span>
              <span class="highlight">
                版本名称: <span>{{ formData?.versionName }}</span>
              </span>
              <span class="highlight">
                年度:<span>{{ formData?.nd }}</span>
              </span>
            </div>
          </div>
        </div>
        <middleCont @change-view="changeView" />
        <div class="table">
          <!-- <vxe-toolbar ref="toolbarRef" custom /> -->
          <vxe-table
            :row-style="tableInfo.rowStyle"
            :cell-style="tableInfo.cellStyle"
            :row-config="{ keyField: 'id', height: 32 }"
            :column-config="{ resizable: true }"
            :border="true"
            align="center"
            show-overflow
            keep-source
            headerAlign="center"
            id="table_toolbar_customEx"
            :treeConfig="tableInfo.treeConfig"
            :data="tableInfo.tableData"
            height="100%"
            ref="tableRef"
          >
            <template v-for="item in tableInfo.columns" :key="item.id">
              <vxe-column
                header-align="center"
                show-overflow="tooltip"
                fixed="left"
                v-if="item.children.length == 0"
                border
                tree-node
                width="280"
                :title="item.title"
                :field="item.field"
                align="left"
              />
              <vxe-colgroup v-else :title="item.title" header-align="center">
                <template v-for="grop in item.children" :key="grop.id">
                  <vxe-column
                    :formatter="formatterData"
                    :width="'200'"
                    header-align="center"
                    border
                    :title="grop.title"
                    :field="grop.field"
                    align="right"
                  />
                </template>
              </vxe-colgroup>
            </template>
          </vxe-table>
        </div>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: '/lslxJsc/components/reportingView'
}
</script>

<script setup lang="ts">
import { reactive, ref, defineProps, defineExpose, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { formatValue } from '@/utils/utils'
import { apiExportHandle, vxeExportHandle } from '@/utils/export'
import { formDataVo } from '@/views/service/lslxJsc/interface/index'
import middleCont from '@/components/modalTitle/middleCont.vue' //表格组件

//接收父组件传参
const props = defineProps<{
  formData: formDataVo
  getTable: (params: any) => Promise<any>
  getColumn: (params: any) => Promise<any>
  getExport: (params: any) => Promise<any>
}>()
const emits = defineEmits(['pushPage'])
const tableRef = ref()
const dialogFormRef = ref()
const toolbarRef = ref()


const pageInfo = reactive<{
  loading: boolean
  isShowPage: boolean
}>({
  loading: true,
  isShowPage: false
})

const count = ref(0)
const viewMethod = ref<string>('1')
const isShowModel = ref(false)
const closeHandle = () => {
  emits('pushPage', true)
}

const tableInfo = reactive<any>({
  border: true,
  tableData: [],
  columns: [],
  treeConfig: {
    rowField: 'id',
    parentField: 'parentId',
    childrenField: 'children',
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      count.value++
      pageInfo.loading = true
      let params = {
        nd: props.formData?.nd,
        parentId: row.id,
        specialorgid: props.formData?.specialorgid,
        versionId: props.formData?.versionId,
        viewMethod: viewMethod.value
      }
      return new Promise((resolve: any) => {
        props.getTable(params).then((res: any) => {
          if (res.success) {
            count.value--
            resolve(res.data)
          } else {
            count.value = 0
            ElMessage.error(res.msg)
            resolve([])
          }
          if (!count.value) pageInfo.loading = false
        })
      })
    }
  },
  rowStyle: ({ row }: any) => {
    if (row.leaf) {
      return {
        fontWeight: 'bold'
      }
    }
  },
  cellStyle: ({ row, column }: any) => {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
})

const getExportData = (newArr: any[], data: any[], cj: number) => {
  const $table = tableRef.value
  data.forEach((item) => {
    let flag = $table.isTreeExpandByRow(item)
    newArr.push({
      name: item.name,
      cj: cj,
      leaf: item.leaf
    })
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children, cj + 1)
    }
  })
  return newArr
}
const formatterData = ({ cellValue, column }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (column.title.includes('%')) return formatValue(cellValue.toString(), 6)
  return formatValue(cellValue.toString(), 6)
}

// 切换查看模式
const changeView = (val: any) => {
  viewMethod.value = val
  newData()
}

// 自定义导出
const exportHandle1 = () => {
  const $table = tableRef.value
  vxeExportHandle($table, props.formData?.fileName, tableInfo.tableData)
}
// 导出
const exportHandle = async () => {
  try {
    pageInfo.loading = true
    const params = {
      nd: props.formData?.nd,
      versionId: props.formData?.versionId,
      viewMethod: viewMethod.value
    }
    const fileName = props.formData?.fileName
    apiExportHandle(params, fileName, props.getExport)
    pageInfo.loading = false
  } catch (e) {
    pageInfo.loading = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}

// 展开
const expandHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    await expandAllTree(tableInfo.tableData, $table)
  }
}
const expandAllTree = async (data: any[], $table: any) => {
  for (const row of data) {
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      if (row.children) {
        await expandAllTree(row.children, $table)
      }
    }
  }
}
const threeLevel = async () => {
  const $table = tableRef.value
  for (const row of tableInfo.tableData) {
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      if (row.children) {
        for (const row1 of row.children) {
          if (row1.leaf) {
            await $table.setTreeExpand(row1, true)
          }
        }
      }
    }
  }
}
// 初始化表格数据
const newData = async () => {
  await getDataList()
  await threeLevel()
}

const getDataList = async () => {
  pageInfo.loading = true
  tableInfo.tableData.length = 0
  let params = {
    nd: props.formData?.nd,
    // parentId: '',
    specialorgid: props.formData?.specialorgid,
    versionId: props.formData?.versionId,
    viewMethod: viewMethod.value
  }
  let res = await props.getTable(params)
  if (res.success) {
    tableInfo.tableData = res.data
    pageInfo.loading = false
  } else {
    pageInfo.loading = false
    ElMessage.error(res.msg)
  }
}
//获取表头
const getHeaderData = async (params: any) => {
  let res = await props.getColumn(params)
  if (res.success) {
    tableInfo.columns = res.data.filter((item: any) => item.visible)
    pageInfo.isShowPage = true
    pageInfo.loading = false
    newData()
    return true
  } else {
    pageInfo.isShowPage = false
    ElMessage.error(res.msg)
    return false
  }
}

defineExpose({
  isShowModel,
  getHeaderData,
  closeHandle,
  viewMethod
})
</script>

<style scoped lang="less">
.content {
  width: 100%;
  height: calc(100vh - 110px);
  padding: 10px;
}

.header-group-cell {
  background-color: #212529 !important;
  text-align: center !important;
  font-weight: bold !important;
}

.vxe-table--render-default .vxe-header--column {
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
}

.vxe-table--render-default .vxe-header--column .vex-cell {
  white-space: normal !important;
  line-height: 1.5 !important;
}

.toolButtoon {
  height: 30px;
  align-items: center;
  display: flex;
  margin-bottom: 10px;

  .left {
    display: flex;
    justify-content: space-between;
    max-width: 490px;
  }

  .right {
    flex: 1;
    text-align: right;
    font-weight: bold;
    color: #212529;

    span {
      display: inline-block;
      font-size: 14px;
      color: #555;
      padding: 5px;
      background-color: #e9ecef;
      border-radius: 5px;
      min-height: 0;
      min-width: 0;
      margin-right: 5px;
    }
  }
}

.table {
  margin: 0 auto;
  height: calc(100% - 40px);
}
</style>
