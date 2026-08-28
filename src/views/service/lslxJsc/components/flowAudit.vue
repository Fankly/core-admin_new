<!-- 一上(二上)上报审核 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      resize
      show-zoom
      :title="formData?.modelTitle"
      :width="1200"
      :close-on-press-escape="true"
      @close="closeHandle"
      :loading="pageInfo.loading"
    >
      <div class="content" ref="fromTableRef">
        <div class="toolButtoon">
          <div class="left">
            <el-button size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
            <el-button
              v-if="formData?.isShow"
              size="mini"
              type="primary"
              plain
              @click="handlerClickBtn('pass')"
            >
              通 过
            </el-button>
            <el-button
              v-if="formData?.isShow"
              size="mini"
              type="primary"
              plain
              @click="handlerClickBtn('reject')"
            >
              驳 回
            </el-button>
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
          <vxe-table
            ref="tableRef"
            border
            height="100%"
            :cell-style="tableInfo.cellStyle"
            :row-style="tableInfo.rowStyle"
            :editConfig="tableInfo.editConfig"
            :treeConfig="tableInfo.treeConfig"
            :data="tableInfo.tableData"
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
  <ImportExcel ref="importRef" />
</template>
<script lang="ts">
export default {
  name: '/service/lslxJsc/components/flowAudit'
}
</script>

<script setup lang="ts">
import { reactive, ref, defineProps, defineExpose, defineEmits } from 'vue'
import {
  getTableDataForYs,
  getDynamicColumnForYs,
  passForYs,
  rejectForYs,
  exportForYs,
  getTableDataForEs,
  getDynamicColumnForEs,
  passForEs,
  rejectForEs,
  exportForEs
} from '@/api/lslxJsc/index'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import { formatValue } from '@/utils/utils'
import ImportExcel from '@/components/ImportExcel/indexNew.vue' //导入组件
import { apiExportHandle, vxeExportHandle } from '@/utils/export'
import middleCont from '@/components/modalTitle/middleCont.vue' //表格组件

//接收父组件传参
const props = defineProps({
  formData: {
    type: Object,
    require: true
  }
})
const emits = defineEmits(['getPass'])
const tableRef = ref()
const dialogFormRef = ref()
const importRef = ref<any>()
const userInfo = ref()
const viewMethod = ref<string>('1')

const pageInfo = reactive<{
  loading: boolean
  isShowPage: boolean
}>({
  loading: false,
  isShowPage: false
})

const count = ref(0)
const isShowModel = ref(false)
const closeHandle = () => {
  viewMethod.value = '1'
  isShowModel.value = false
}

const tableInfo = reactive<any>({
  tableData: [],
  columns: [],
  treeConfig: {
    rowField: 'id',
    parentField: 'parentId',
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
        dwId: props.formData?.dwId
      }
      return new Promise((resolve: any) => {
        let Api =
          props.formData?.modelTitle == '一上上报审核' ? getTableDataForYs : getTableDataForEs
        Api(params).then((res: any) => {
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
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    enabled: true,
    beforeEditMethod: function ({ column, row }: any) {
      return row.id && !row.leaf && column.field !== 'name'
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
    if (column.title == '项目类型' && !row.leaf && row.ysly == '1') {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(17, 194, 109, 1)'
      }
    } else if (column.title == '项目类型' && !row.leaf && row.ysly == '2') {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(252, 185, 0, 1)'
      }
    } else {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
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
const formatterData = ({ cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
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
  const fileName = `${props.formData?.modelTitle}明细表`
  vxeExportHandle($table, fileName, tableInfo.tableData)
}
// 导出
const exportHandle = async () => {
  try {
    pageInfo.loading = true
    const params = {
      nd: props.formData?.nd,
      dwId: props.formData?.dwId,
      versionId: props.formData?.versionId,
      viewMethod: viewMethod.value
    }
    const fileName = `${props.formData?.modelTitle}明细表`
    const api = props.formData?.modelTitle == '一上上报审核' ? exportForYs : exportForEs
    apiExportHandle(params, fileName, api)
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
  const api: any =
    props.formData?.modelTitle == '一上上报审核' ? getTableDataForYs : getTableDataForEs
  pageInfo.loading = true
  tableInfo.tableData.length = 0
  let res = await api({ ...props.formData, viewMethod: viewMethod.value })
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
  const api: any =
    props.formData?.modelTitle == '一上上报审核' ? getDynamicColumnForYs : getDynamicColumnForEs
  let res = await api(params)
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
// 提交审核
const handlerClickBtn = (val: any) => {
  const params = {
    dwId: props.formData?.dwId,
    versionId: props.formData?.versionId
  }
  const text = val == 'pass' ? '通过' : '驳回'
  const passApi = props.formData?.modelTitle == '一上上报审核' ? passForYs : passForEs
  const rejectApi = props.formData?.modelTitle == '一上上报审核' ? rejectForYs : rejectForEs
  const api: any = val == 'pass' ? passApi : rejectApi
  ElMessageBox.confirm(`操作不可逆，是否${text}？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      pageInfo.loading = true
      const res: any = await api(params)
      if (res.success) {
        pageInfo.loading = false
        emits('getPass', true)
        ElMessage.success(`${props.formData?.dwName}的一上预算上报已${text}`)
      } else {
        pageInfo.loading = false
        ElMessage.error(res.msg)
      }
    })
    .catch((error: any) => {
      console.log(error)
    })
}

defineExpose({
  isShowModel,
  getHeaderData,
  closeHandle,
  userInfo
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
    max-width: 450px;
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
      padding: 5px 10px;
      background-color: #e9ecef;
      border-radius: 5px;
      min-height: 0;
      min-width: 0;
      margin-right: 10px;
    }
  }
}

.table {
  margin: 0 auto;
  height: calc(100% - 40px);
}
</style>
