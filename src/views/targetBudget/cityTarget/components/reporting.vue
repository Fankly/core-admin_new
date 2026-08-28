<!-- 目标值填写组件 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModal"
      :destroy-on-close="true"
      resize
      show-zoom
      fullscreen
      :title="formData?.title"
      :width="1200"
      :close-on-press-escape="true"
      @close="closeHandle"
      :loading="tableInfo.loading"
    >
      <div class="modal_content" ref="fromTableRef">
        <div class="toolButtoon">
          <div class="left">
            <el-button size="mini" type="primary" plain v-debounce="[expandHandle, `click`, 300]">一键展开</el-button>
            <el-button v-if="formData?.isShow" size="mini" :disabled="disabled" type="primary" plain v-debounce="[saveHandle, `click`, 300]"
              >保 存</el-button
            >
            <el-button v-if="formData?.isShow" size="mini" :disabled="disabled" type="primary" plain v-debounce="[handlePass, `click`, 300]"
              >提 交</el-button
            >
            <el-button v-if="formData?.isShow" size="mini" :disabled="disabled" type="primary" plain v-debounce="[unitDescImportHandle, `click`, 300]"
              >导 入</el-button
            >
            <el-button size="mini" type="primary" plain v-debounce="[exportHandle1, `click`, 300]">页面导出</el-button>
            <el-button size="mini" type="primary" plain v-debounce="[exportHandle, `click`, 300]">全量导出</el-button>
            <el-button v-if="formData?.isShow" size="mini" type="primary" plain v-debounce="[getSync, `click`, 300]">目标值重置</el-button>
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
          <el-form label-suffix=" : " ref="ruleFormRef" label-position="right" :model="rmarkData" :hide-required-asterisk="false">
            <el-row :gutter="20">
              <el-form-item label="展示方式" prop="viewMethod" label-width="94px">
                <el-select style="width: 150px" v-model="rmarkData.viewMethod" placeholder="请选择展示方式" @change="getViewMethod">
                  <el-option v-for="item in showTypeList" :key="item.value" :label="item.label" :value="item.value"> </el-option>
                </el-select>
              </el-form-item>
              <template v-for="(item, index) in heightLimitTop" :key="index">
                <el-form-item :label="`${item.name}上限额`" :prop="`${item.ysje}`" label-width="auto" style="margin-left: 5px">
                  <input class="my-input" v-limit-input disabled v-model="item.ysje" />
                </el-form-item>
              </template>
              <el-dropdown style="height: 30px; line-height: 30px" v-if="heightLimitOther.length > 0" trigger="click">
                <div class="left_item">更多<i class="el-icon-d-arrow-right"></i></div>
                <template #dropdown>
                  <el-dropdown-menu v-for="(item, index) in heightLimitOther" :key="index">
                    <el-dropdown-item>
                      <el-form-item :label="`${item.name}上限额`" :prop="`${item.ysje}`" label-width="auto" style="margin-left: 5px">
                        <input class="my-input" v-limit-input disabled v-model="item.ysje" />
                      </el-form-item>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-row>
          </el-form>
          <div class="formClassTl">
            <div v-for="(item, index) in gkjbList" :key="index">
              <el-tooltip class="box-item" effect="dark" :content="item.note" placement="top">
                <div style="cursor: pointer">{{ item.name }}</div>
              </el-tooltip>
            </div>
          </div>
        </div>
        <div class="table">
          <!-- <vxe-toolbar ref="toolbarRef" custom /> -->
          <vxe-table
            :cell-style="tableInfo.cellStyle"
            :row-style="tableInfo.rowStyle"
            :row-config="{ keyField: 'id', height: 32 }"
            :column-config="{ resizable: true }"
            :border="true"
            align="center"
            show-overflow
            keep-source
            headerAlign="center"
            id="table_toolbar_customEx"
            :custom-config="{ storage: true }"
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
                align="left"
                tree-node
                width="280"
                :title="item.title"
                :field="item.field"
              />
              <vxe-colgroup v-else :title="item.title" header-align="center">
                <template v-for="grop in item.children" :key="grop.id">
                  <vxe-column
                    v-if="grop.edit && formData?.isShow"
                    :formatter="formatterData"
                    :title="grop.title"
                    :field="grop.field"
                    header-align="center"
                    align="right"
                    :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
                  >
                    <template #edit="{ row }">
                      <input
                        v-limit-number
                        :disabled="!['3', '2'].includes(row.mbzGkjb)"
                        class="my-input"
                        @change="sumhandle(row, grop.field)"
                        v-model="row[grop.field]"
                      />
                    </template>
                  </vxe-column>
                  <vxe-column v-else :formatter="formatterData" header-align="center" :title="grop.title" :field="grop.field" align="right" />
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
  name: 'reporting'
}
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { summaryValue } from '@/utils/utils' //合计项目类型值
import {
  submitWf,
  syncCurrentMbz,
  getZkys,
  getDynamicColumn,
  getTableData,
  getImportTemplate,
  saveData,
  exportData,
  importData,
  getProtypeNameListWithCurrentMbzChange
} from '@/api/targetBudget/cityTarget'

import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import { Decimal } from 'decimal.js'
import { formatValue } from '@/utils/utils'
import ImportExcel from '@/components/ImportExcel/indexNew.vue' //导入组件
import { apiExportHandle, vxeExportStyle } from '@/utils/export'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'

//接收父组件传参
const props = defineProps({
  formData: {
    type: Object,
    require: true
  },
  gkjbList: {
    type: Array,
    require: true
  }
})
const wfParam = ref<WFParam>({
  XMIDS: '',
  FQZZ: '',
  FQBM: ''
})
const store = useStore()

const emits = defineEmits(['getPass'])
const tableRef = ref()
const toolbarRef = ref()
const ruleFormRef = ref()
const dialogFormRef = ref()
const importRef = ref<any>()
const userInfo = ref()
const columnsList = ref<any[]>([])
const heightLimitTop = ref<any[]>([])
const heightLimitOther = ref<any[]>([])
const disabled = ref<boolean>(false)
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
  yxsytcgm: any
  yxsjtcgm: any
  viewMethod: any
}>({
  yxsytcgm: 0.0,
  yxsjtcgm: 0.0,
  viewMethod: '1'
})
const pageInfo = reactive<{
  loading: boolean
  isShowPage: boolean
}>({
  loading: true,
  isShowPage: false
})

const updateParams = reactive<any[]>([])

const count = ref(0)
const isShowModal = ref(false)
const closeHandle = () => {
  updateParams.length = 0
  emits('getPass', true)
  rmarkData.viewMethod = '1'
  isShowModal.value = false
  disabled.value = false
}

const tableInfo = reactive<any>({
  toolbarConfig: {
    custom: true
  },
  loading: false,
  headerAlign: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
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
      tableInfo.loading = true
      let params = {
        nd: props.formData?.nd,
        dwId: props.formData?.dwId,
        parentId: row.id,
        versionId: props.formData?.versionId,
        viewMethod: rmarkData.viewMethod
      }
      return new Promise((resolve: any) => {
        let Api = getTableData
        Api(params).then((res: any) => {
          if (res.success) {
            count.value--
            resolve(res.data)
          } else {
            count.value = 0
            ElMessage.error(res.msg)
            resolve([])
          }
          if (!count.value) tableInfo.loading = false
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
      return row.id && !row.leaf && row.ysly == '2' && column.field !== 'name' && ['3', '2'].includes(row.mbzGkjb)
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
    if (column.title == '项目类型' && !row.leaf) {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(232, 234, 236,0.5)',
        color:
          row.mbzGkjb == '1'
            ? 'rgba(255, 76, 82, 1)'
            : row.mbzGkjb == '2'
            ? 'rgba(252, 185, 0, 1)'
            : row.mbzGkjb == '3'
            ? 'rgba(17, 194, 109, 1)'
            : ''
      }
    }
    if (!props.formData?.isShow) {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    } else {
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
      if (row.leaf || (!row.leaf && row.ysly != '2') || !['3', '2'].includes(row.mbzGkjb)) {
        return {
          cursor: 'auto',
          backgroundColor: 'rgba(232, 234, 236,0.5)'
        }
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
  const dwId = props.formData?.dwId
  const currentMbz = row[`${dwId}_currentMbz`]
  row[key] = row[key] ? new Decimal(row[key]).toFixed(6) : '0.000000'
  if (row[`mbzGkjb`] == '2' && Number(currentMbz) < Number(row[key])) {
    row[key] = '-'
    row[`${dwId}_adjustAmount`] = '-'
    return ElMessage.warning(`项目类型：【${row.name}】仅能调减目标值!`)
  }
  row[`${dwId}_adjustAmount`] = row[key] - currentMbz
  const config: any = tableInfo.treeConfig
  const tableData = tableInfo.tableData
  summaryValue(tableData, config, key, 6, 'id')
  summaryValue(tableData, config, `${dwId}_adjustAmount`, 6, 'id')
}
// 获取编辑数据表格
const getEditDataHandle = ({ column, row }: any) => {
  if (typeof row[column.field] == 'undefined' || row[column.field] == null || row[column.field] == '' || row[column.field] == '-') return
  const id: string = row['id']
  const outIndex = updateParams.findIndex((item: any) => item.id === id)
  if (outIndex > -1) {
    const index = updateParams[outIndex].dwValues.findIndex((item: any) => item.field === column.field)
    if (index > -1) {
      updateParams[outIndex].dwValues[index].ysje = row[column.field]
    } else {
      updateParams[outIndex].dwValues.push({
        dwId: props.formData?.dwId,
        field: column.field,
        ysje: parseFloat(row[column.field])
      })
    }
  } else {
    updateParams.push({
      id: id,
      code: row['code'],
      dwValues: [
        {
          dwId: props.formData?.dwId,
          field: column.field,
          ysje: parseFloat(row[column.field])
        }
      ]
    })
  }
}

// 自定义导出
const exportHandle1 = () => {
  const $table = tableRef.value
  vxeExportStyle($table, '市域统筹目标值平衡调整表', tableInfo.tableData)
}
// 导出
const exportHandle = async () => {
  try {
    tableInfo.loading = true
    const params = {
      nd: props.formData?.nd,
      dwId: props.formData?.dwId,
      versionId: props.formData?.versionId,
      viewMethod: rmarkData.viewMethod
    }
    const fileName = '市域统筹目标值平衡调整表'
    apiExportHandle(params, fileName, exportData)
    tableInfo.loading = false
  } catch (e) {
    tableInfo.loading = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}
// 导入  批量维护
const unitDescImportHandle = async () => {
  let newParmas = {
    versionId: props.formData?.versionId,
    dwId: props.formData?.dwId
  }
  importRef.value.fromData = newParmas
  let tempApi: any = getImportTemplate
  let importApi: any = importData
  if (!importApi) return
  let params = {
    title: '目标值调整',
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
    getTableList: newData
  }
  importRef.value.acceptParams(params)
}

// 保存
const saveHandle = async () => {
  try {
    if (updateParams.length === 0) {
      ElMessage.warning('请调整目标值后再进行保存！')
      return
    }
    const text = updateParams.length === 0 ? '检测到没有调整目标值，是否确定保存？' : '请确定要保存的内容'
    ElMessageBox.confirm(text, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        let res = await saveData({
          versionId: props.formData?.versionId,
          dataList: updateParams
        })
        if (res.success) {
          updateParams.length = 0
          ElMessage.success('保存成功！')
          newData()
        } else {
          ElMessage.error(res.msg)
        }
      })
      .catch((error: any) => {
        if (error == 'cancel') {
          ElMessage.info('已取消')
        } else {
          console.log(error)
        }
      })
  } catch (error) {
    console.log(error, 'error')
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
            // if (row1.children) {
            //   for (const row2 of row1.children) {
            //     if (row2.leaf) {
            //       await $table.setTreeExpand(row2, true)
            //     }
            //   }
            // }
          }
        }
      }
    }
  }
}
// 初始化表格数据
const newData = async () => {
  // await gmSumData({ versionId: props.formData?.versionId, nd: props.formData?.nd })
  await getDataList()
  await threeLevel()
}

const isClickHeader = (columns: any, field: string) => {
  let columnsData = columns.filter((item: any) => item.edit)
  let column = columnsData.find((item: any) => item.field === field)
  if (column) return true
  return false
}
// 切换查看模式
const getViewMethod = () => {
  newData()
}

// 获取上限值
const getTop = async () => {
  const params = {
    nd: props.formData?.nd,
    dwId: props.formData?.dwId
  }
  const res: any = await getZkys(params)
  if (res.success && res.data.length != 0) {
    heightLimitTop.value = res.data.filter((item1: any, index: any) => index <= 2)
    heightLimitOther.value = res.data.filter((item1: any, index: any) => index > 2)
  } else {
    ElMessage.warning('未查询到上限额')
  }
}

// 同步目标值
const getSync = async () => {
  const res: any = await syncCurrentMbz(props.formData?.versionId)
  if (res.success) {
    ElMessage.success('同步成功！')
    disabled.value = false
    await newData()
    await getTop()
  } else {
    ElMessage.error(res.msg)
  }
}

// 获取数据
const getDataList = async () => {
  const api: any = getTableData
  tableInfo.loading = true
  tableInfo.tableData.length = 0
  let params = {
    nd: props.formData?.nd,
    dwId: props.formData?.dwId,
    versionId: props.formData?.versionId,
    viewMethod: rmarkData.viewMethod
  }
  let res = await api(params)
  if (res.success) {
    tableInfo.tableData = res.data
    tableInfo.loading = false
  } else {
    tableInfo.loading = false
    ElMessage.error(res.msg)
  }
}
//获取表头
const getHeaderData = async (params: any) => {
  if (params?.isShow) {
    const isCheck = await getProtypeNameListWithCurrentMbzChange(params.versionId)
    if (isCheck.success) {
      if (isCheck.data.length != 0) {
        const dataToShow = isCheck.data.length <= 2 ? isCheck.data : isCheck.data.slice(0, 2)
        const suffix = isCheck.data.length <= 2 ? '' : '等'
        ElMessage.warning(`项目类型：【${dataToShow}】${suffix}目标值已发生变更，请点击【同步目标值】更新`)
        disabled.value = true
      }
    } else {
      ElMessage.error(isCheck.msg)
    }
  }
  const api: any = getDynamicColumn
  let res = await api(params)
  if (res.success) {
    tableInfo.columns = res.data.filter((item: any) => item.visible)
    columnsList.value.length = 0
    tableInfo.columns.forEach((item: any) => {
      if (item.children.length != 0) {
        columnsList.value.push(...item.children)
      }
    })
    custom()
    pageInfo.isShowPage = true
    tableInfo.loading = false
    newData()
    getTop()
    return true
  } else {
    pageInfo.isShowPage = false
    ElMessage.error(res.msg)
    return false
  }
}
// 工具栏
const custom = () => {
  const $toolbar = toolbarRef.value
  const $table = tableRef.value
  if ($toolbar && $table) {
    $table.connect($toolbar)
  }
}

// 提交
const handlePass = async () => {
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
  submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_SYTC_MBZ_PHTZ', '', wfUserInfo, wfParam.value, {}, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.specialorgid || '',
    spRoleId: userInfo.value.id || '',
    wfCode: 'WF_SYTC_MBZ_PHTZ',
    wfData: wfParam.value,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await submitWf({
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
  isShowModal,
  getHeaderData,
  closeHandle,
  userInfo
})
</script>

<style scoped lang="less">
.modal_content {
  width: 100%;
  height: 100%;
  padding: 10px;
  .toolButtoon {
    height: 30px;
    align-items: center;
    display: flex;
    margin-bottom: 10px;

    .left {
      display: flex;
      justify-content: space-between;
      max-width: 600px;
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
        width: 80px;
        height: 26px;
        line-height: 26px;
        margin-right: 5px;
        text-align: center;
        border: 1px solid #f6f6f6;
      }
      > div:first-child {
        color: rgba(255, 76, 82, 1);
        border: 1px solid rgba(255, 76, 82, 1);
      }
      > div:nth-child(2) {
        color: rgba(252, 185, 0, 1);
        border: 1px solid rgba(252, 185, 0, 1);
      }
      > div:last-child {
        color: rgba(17, 194, 109, 1);
        border: 1px solid rgba(17, 194, 109, 1);
      }
    }
  }
  .table {
    margin: -10px auto;
    height: calc(100% - 100px);
  }
}
.left_item {
  margin-left: 10px;
  color: var(--color-primary, #00857c);
  cursor: pointer;
}
</style>
