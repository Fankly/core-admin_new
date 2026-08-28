<!-- 二上上报组件 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      resize
      show-zoom
      :title="formData?.title"
      :width="1200"
      fullscreen
      :close-on-press-escape="true"
      @close="closeHandle"
    >
      <div class="content">
        <div class="toolButtoon">
          <div class="left">
            <el-button
              :disabled="pageInfo.loading"
              size="mini"
              type="primary"
              plain
              @click="expandHandle"
              >一键展开</el-button
            >
            <el-button
              v-if="formData?.title == '二上预算编制'"
              :disabled="pageInfo.loading"
              size="mini"
              type="primary"
              plain
              @click="saveHandle"
              >保 存</el-button
            >
            <el-button
              v-if="formData?.title == '二上预算编制'"
              :disabled="pageInfo.loading"
              size="mini"
              type="primary"
              plain
              @click="unitDescImportHandle"
              >导 入</el-button
            >
            <el-button
              v-if="formData?.title == '二上预算编制'"
              :disabled="pageInfo.loading"
              size="mini"
              type="primary"
              plain
              @click="flowTj"
            >
              提交审核
            </el-button>
            <el-button
              :disabled="pageInfo.loading"
              size="mini"
              type="primary"
              plain
              @click="exportHandle1"
              >页面导出</el-button
            >
            <el-button
              :disabled="pageInfo.loading"
              size="mini"
              type="primary"
              plain
              @click="exportHandle"
              >全量导出</el-button
            >
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
              <span class="highlight">
                单位:<span>{{ `万元` }}</span>
              </span>
            </div>
          </div>
        </div>
        <div class="formClass">
          <el-form
            label-suffix=" : "
            ref="ruleFormRef"
            label-width="90px"
            label-position="right"
            :model="rmarkData"
            :hide-required-asterisk="false"
          >
            <el-row :gutter="20">
              <el-form-item label="展示方式" prop="aaa">
                <el-select
                  style="width: 200px"
                  v-model="rmarkData.viewMethod"
                  placeholder="请选择展示方式"
                  @change="getViewMethod"
                >
                  <el-option
                    v-for="item in showTypeList"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  >
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="二上限额" prop="yxsjtcgm">
                <input
                  v-limit-input
                  class="my-input"
                  disabled
                  v-model.trim="rmarkData.esLimit"
                  style="width: 200px"
                />
              </el-form-item>
            </el-row>
          </el-form>
          <div class="formClassTl">
            <div>省级统筹</div>
            <div>市域统筹</div>
          </div>
        </div>
        <div class="table">
          <vxe-table
            :cell-style="tableInfo.cellStyle"
            :row-style="tableInfo.rowStyle"
            :loading="pageInfo.loading"
            :row-config="{ keyField: 'id', height: 32 }"
            :column-config="{ resizable: true }"
            :border="true"
            align="center"
            show-overflow
            keep-source
            headerAlign="center"
            :editConfig="tableInfo.editConfig"
            :treeConfig="tableInfo.treeConfig"
            :data="tableInfo.tableData"
            height="100%"
            ref="tableRef"
            @edit-closed="getEditDataHandle"
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
                    v-if="grop.edit && formData?.title == '二上预算编制'"
                    :formatter="formatterData"
                    :title="grop.title"
                    :field="grop.field"
                    header-align="center"
                    align="right"
                    border
                    :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
                  >
                    <template #edit="{ row }">
                      <input
                        v-limit-input
                        class="my-input"
                        @change="sumhandle(row, grop.field)"
                        v-model="row[grop.field]"
                        maxlength="20"
                      />
                    </template>
                  </vxe-column>
                  <vxe-column
                    v-else
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
  name: '/lslxJsc/components/reporting'
}
</script>

<script setup lang="ts">
import { reactive, ref, defineProps, defineExpose, defineEmits } from 'vue'
import { summaryValue } from '@/utils/utils' //合计项目类型值
import {
  getTableDataForEs,
  getDynamicColumnForEs,
  saveSytcje,
  getImportTemplateForEs,
  importSytcje,
  getEsLimit,
  exportForEs,
  mbzesSubmitWf
} from '@/api/lslxJsc/index'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import { Decimal } from 'decimal.js'
import { formatValue } from '@/utils/utils'
import ImportExcel from '@/components/ImportExcel/indexNew.vue' //导入组件
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { apiExportHandle, vxeExportHandle } from '@/utils/export'

const wfParam = ref<WFParam>({
  XMIDS: '',
  FQZZ: '',
  FQBM: ''
})
const store = useStore()
const emits = defineEmits(['pushPage'])

//接收父组件传参
const props = defineProps({
  formData: {
    type: Object,
    require: true
  }
})
const tableRef = ref()
const dialogFormRef = ref()
const importRef = ref<any>()
const userInfo = ref()

const pageInfo = reactive<{
  loading: boolean
  isShowPage: boolean
}>({
  loading: true,
  isShowPage: false
})

const updateParams = reactive<any[]>([])

const count = ref(0)
const isShowModel = ref(false)
const closeHandle = () => {
  rmarkData.viewMethod = '1'
  emits('pushPage', true)
}
const columnsList = ref<any[]>([])
const showTypeList = ref<any[]>([
  {
    value: '1',
    label: '层级结构查看'
  },
  {
    value: '2',
    label: '极简查看'
  }
])
// 弹框参数
const rmarkData = reactive<{
  esLimit: any
  viewMethod: any
}>({
  esLimit: 0.0,
  viewMethod: '1'
})
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
        dwId: props.formData?.dwId
      }
      return new Promise((resolve: any) => {
        let Api = getTableDataForEs
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
      return row.id && !row.leaf && row.ysly == '2' && column.field !== 'name'
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
    }
    if (column.title == '项目类型' && !row.leaf && row.ysly == '2') {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(252, 185, 0, 1)'
      }
    }
    if (props.formData?.title != '二上预算编制') return
    if (tableInfo.editConfig && !tableInfo.editConfig.enabled) {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    }
    if (!isClickHeader(columnsList.value, column.field)) {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    }
    if (row.leaf || (!row.leaf && row.ysly != '2')) {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    }
    if (column.title != '项目类型') {
      return {
        textAlign: 'right'
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
const formatterData = ({ cellValue, column }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (column.title.includes('%')) return formatValue(cellValue.toString(), 6)
  return formatValue(cellValue.toString(), 6)
}

const sumhandle = (row: any, key: string) => {
  row[key] = row[key] ? new Decimal(row[key]).toFixed(6) : '0.000000'
  row[`${props.formData?.dwId}_sytc_nckqr`] = row[`${props.formData?.dwId}_sytc_nckqr`]
    ? new Decimal(row[`${props.formData?.dwId}_sytc_nckqr`]).toFixed(6)
    : '0.000000'
  const yl = row[key] - row[`${props.formData?.dwId}_sytc_nckqr`]
  row[`${props.formData?.dwId}_yl`] = yl < 0 ? '0.000000' : yl
  const config: any = tableInfo.treeConfig
  const tableData = tableInfo.tableData
  summaryValue(tableData, config, key, 6, 'id')
  summaryValue(tableData, config, `${props.formData?.dwId}_sytc_nckqr`, 6, 'id')
  summaryValue(tableData, config, `${props.formData?.dwId}_yl`, 6, 'id')
  // getEssytcje()
}
// 计算市域统筹金额
const getEssytcje = () => {
  let gmSum = tableInfo.tableData.reduce(
    (gmSum: number, item: any) => gmSum + Number(item[`${props.formData?.dwId}_sytcje`]),
    0
  )
  const isMessage = Number(rmarkData.esLimit) < Number(gmSum)
  return isMessage
}
// 切换查看模式
const getViewMethod = () => {
  newData()
}

// 获取编辑数据表格
const getEditDataHandle = ({ column, row }: any) => {
  if (
    typeof row[column.field] == 'undefined' ||
    row[column.field] == null ||
    row[column.field] == ''
  )
    return
  const code: string = row['code']
  const id: string = row['id']
  const outIndex = updateParams.findIndex((item: any) => item.id === id)

  if (outIndex > -1) {
    const index = updateParams[outIndex].dwValueList.findIndex(
      (item: any) => item.field === column.field
    )
    if (index > -1) {
      updateParams[outIndex].dwValueList[index].value = row[column.field]
    } else {
      updateParams[outIndex].dwValueList.push({
        dwId: props.formData?.specialorgid,
        field: column.field,
        value: row[column.field]
      })
    }
  } else {
    updateParams.push({
      id: id,
      protypeId: id,
      dwValueList: [
        {
          dwId: props.formData?.dwId,
          value: parseFloat(row[column.field]),
          field: column.field
        }
      ]
    })
  }
}
// 自定义导出
const exportHandle1 = () => {
  const $table = tableRef.value
  vxeExportHandle($table, '二上预算上报数据表', tableInfo.tableData)
}
// 导出
const exportHandle = async () => {
  try {
    pageInfo.loading = true
    const params = {
      nd: props.formData?.nd,
      dwId: props.formData?.dwId,
      versionId: props.formData?.versionId,
      viewMethod: rmarkData.viewMethod
    }
    const fileName = '二上预算上报数据表'
    apiExportHandle(params, fileName, exportForEs)
    pageInfo.loading = false
  } catch (e) {
    pageInfo.loading = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}
// 导入  批量维护
const unitDescImportHandle = async () => {
  let newParmas = {
    nd: props.formData?.nd,
    dwId: props.formData?.dwId,
    versionId: props.formData?.versionId,
    dwName: props.formData?.dwName
  }
  importRef.value.fromData = newParmas
  let tempApi: any = getImportTemplateForEs
  let importApi: any = importSytcje //   xmlbysjyDetailImport
  if (!importApi) return
  let params = {
    title: '二上预算编制',
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    getTableList: newData,
    specialorgid: props.formData?.specialorgid
  }
  importRef.value.acceptParams(params)
}

// 保存
const saveHandle = async () => {
  const isShow = getEssytcje()
  if (isShow) return ElMessage.error(`“市域统筹金额合计”需小于等于“一下市域统筹金额合计”（二上限额）。`)
  if (updateParams.length === 0) return ElMessage.warning('请编辑后再进行保存！')
  ElMessageBox.confirm('请确定要保存的内容', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      let res = await saveSytcje({
        versionId: props.formData?.versionId,
        protypeValueList: updateParams,
        dwId: props.formData?.dwId
      })
      if (res.success) {
        ElMessage.success('保存成功！')
        newData()
        updateParams.length = 0
      } else {
        ElMessage.error(res.msg)
      }
    })
    .catch((error: any) => {
      console.log(error)
    })
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
  await gmSumData()
}

const isClickHeader = (columns: any, field: string) => {
  let columnsData = columns.filter((item: any) => item.edit)
  let column = columnsData.find((item: any) => item.field === field)
  return !!column
}

const getDataList = async () => {
  pageInfo.loading = true
  const api: any = getTableDataForEs
  tableInfo.tableData.length = 0
  let params = {
    nd: props.formData?.nd,
    // parentId: '',
    specialorgid: props.formData?.specialorgid,
    versionId: props.formData?.versionId,
    dwId: props.formData?.dwId,
    viewMethod: rmarkData.viewMethod
  }
  let res = await api(params)
  if (res.success) {
    tableInfo.tableData = res.data
    pageInfo.loading = false
  } else {
    pageInfo.loading = false
    ElMessage.error(res.msg)
  }
}

// 获取二上限额
const gmSumData = async () => {
  let params = {
    versionId: props.formData?.versionId,
    dwId: props.formData?.dwId
  }
  let res: any = await getEsLimit(params)
  if (res.success) {
    rmarkData['esLimit'] = Number(res.data).toFixed(6)
  } else {
    ElMessage.error(res.msg)
  }
}

//获取表头
const getHeaderData = async (params: any) => {
  const api: any = getDynamicColumnForEs
  let res = await api(params)
  if (res.success) {
    tableInfo.columns = res.data.filter((item: any) => item.visible)
    columnsList.value.length = 0
    tableInfo.columns.forEach((item: any) => {
      if (item.children.length != 0) {
        columnsList.value.push(...item.children)
      }
    })
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
const flowTj = () => {
  ElMessageBox.confirm('提交前请确认填写数据已保存。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      submitCbxqshWorkflowHandle()
    })
    .catch((error: any) => {
      console.log(error)
    })
}

// 提交工作流
const submitCbxqshWorkflowHandle = () => {
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.specialorgid || '',
    spRoleId: userInfo.value.id || ''
  }
  wfParam.value.VERSION_ID = props.formData?.versionId
  wfParam.value.DW_ID = props.formData?.dwId
  submitWorkflow(
    store.getters.getUserMsg.systemCode,
    'ESSHLC',
    '',
    wfUserInfo,
    wfParam.value,
    {},
    submitWFCallback
  )
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.specialorgid || '',
    spRoleId: userInfo.value.id || '',
    wfCode: 'ESSHLC',
    wfData: wfParam.value,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await mbzesSubmitWf({
    ...spfrom
  })
  if (res.success) {
    pageInfo.loading = false
    ElMessage.success('提交成功')
    closeHandle()
  } else {
    pageInfo.loading = false
    let msg = res.msg.split('|').join('<br/>')
    ElMessage.error({
      type: 'error',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }
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
.formClass {
  width: 100%;
  display: flex;
  justify-content: space-between;
  z-index: 1;
  .formClassTl {
    display: flex;
    > div {
      width: 100px;
      height: 30px;
      line-height: 30px;
      text-align: center;
      border: 1px solid #f6f6f6;
    }
    > div:first-child {
      background: rgba(17, 194, 109);
    }
    > div:last-child {
      background: rgba(252, 185, 0, 1);
    }
  }
}
.table {
  margin: 0 auto;
  height: calc(100% - 40px);
}
</style>
