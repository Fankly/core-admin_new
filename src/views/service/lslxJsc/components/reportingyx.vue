<!-- 上报组件 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
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
            <el-button size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
            <el-button
              v-if="formData?.title == '一下数据编制'"
              size="mini"
              type="primary"
              plain
              @click="nckReview"
              >拟出库核定</el-button
            >
            <el-button
              v-if="formData?.title == '一下数据编制'"
              size="mini"
              type="primary"
              plain
              @click="saveHandle"
              >保 存</el-button
            >
            <el-button
              v-if="formData?.title == '一下数据编制'"
              size="mini"
              type="primary"
              plain
              @click="handlePass"
              >一下核定</el-button
            >
            <el-button
              v-if="formData?.title == '一下数据编制'"
              size="mini"
              type="primary"
              plain
              @click="unitDescImportHandle"
              >导 入</el-button
            >
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
            label-width="150px"
            label-position="right"
            :model="rmarkData"
            :rules="rules"
            :hide-required-asterisk="false"
          >
            <el-row :gutter="20">
              <el-form-item label="展示方式" prop="viewMethod" label-width="94px">
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
              <el-form-item label="一下全省总规模" prop="yxqszgm">
                <input
                  v-limit-input
                  class="my-input"
                  :disabled="formData?.title != '一下数据编制'"
                  v-model.trim="rmarkData.yxqszgm"
                  placeholder="请输入一下全省总规模"
                  style="width: 200px"
                  @blur="handleEnter"
                />
              </el-form-item>
              <el-form-item label="一下省级统筹规模" prop="yxsjtcgm">
                <input
                  v-limit-input
                  class="my-input"
                  disabled
                  v-model.trim="rmarkData.yxsjtcgm"
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item label="一下市域统筹规模" prop="yxsytcgm">
                <input
                  v-limit-input
                  class="my-input"
                  disabled
                  v-model.trim="rmarkData.yxsytcgm"
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
          <vxe-toolbar ref="toolbarRef" custom />
          <vxe-table
            :cell-style="tableInfo.cellStyle"
            :row-style="tableInfo.rowStyle"
            :row-config="{ keyField: 'id', height: 32 }"
            :column-config="{ resizable: true }"
            border
            align="center"
            show-overflow
            keep-source
            headerAlign="center"
            id="table_toolbar_customYx"
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
                tree-node
                width="280"
                :title="item.title"
                :field="item.field"
                align="left"
              />
              <vxe-colgroup v-else :title="item.title" header-align="center">
                <template v-for="grop in item.children" :key="grop.id">
                  <vxe-column
                    v-if="grop.edit && formData?.title == '一下数据编制'"
                    :width="grop.width"
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
                      />
                    </template>
                  </vxe-column>
                  <vxe-column
                    v-else
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
  <ImportExcel ref="importRef" />
</template>
<script lang="ts">
export default {
  name: '/lslxJsc/components/reportingyx'
}
</script>

<script setup lang="ts">
import { reactive, ref, defineProps, defineExpose, defineEmits } from 'vue'
import { summaryValue } from '@/utils/utils' //合计项目类型值
import {
  getTableDataForYx,
  getDynamicColumnForYx,
  getImportTemplateForYx,
  importYxgm,
  exportForYx,
  getYxGmSumData,
  saveDataForYx,
  yxhd
} from '@/api/lslxJsc/index'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import { Decimal } from 'decimal.js'
import { formatValue } from '@/utils/utils'
import ImportExcel from '@/components/ImportExcel/indexNew.vue' //导入组件
import { useRouter } from 'vue-router'
import { apiExportHandle, vxeExportHandle } from '@/utils/export'

//接收父组件传参
const props = defineProps({
  formData: {
    type: Object,
    require: true
  }
})
const router = useRouter()
const emits = defineEmits(['getPass'])
const tableRef = ref()
const toolbarRef = ref()
const ruleFormRef = ref()
const dialogFormRef = ref()
const importRef = ref<any>()
const userInfo = ref()
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
  yxsytcgm: any
  yxsjtcgm: any
  yxqszgm: any
  viewMethod: any
}>({
  yxsytcgm: 0.0,
  yxsjtcgm: 0.0,
  yxqszgm: 0.0,
  viewMethod: '1'
})
//表格规则
const rules = reactive({
  yxqszgm: [
    {
      required: true,
      message: '一下全省总规模不能为空',
      trigger: 'change'
    }
  ]
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
const isShowModel = ref(false)
const closeHandle = () => {
  rmarkData.viewMethod = '1'
  isShowModel.value = false
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
  data: [],
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
        parentId: row.id,
        specialorgid: props.formData?.specialorgid,
        versionId: props.formData?.versionId
      }
      return new Promise((resolve: any) => {
        let Api = getTableDataForYx
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
      return (
        (row.id &&
          !row.leaf &&
          row.ysly == '1' &&
          column.field != 'name' &&
          column.title != '市域自主(万元)') ||
        (row.parentId == '0' && column.title == '市域自主(万元)')
      )
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
    if (props.formData?.title != '一下数据编制') {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    } else {
      if (!isClickHeader(columnsList.value, column.field)) {
        return {
          cursor: 'auto',
          backgroundColor: 'rgba(232, 234, 236,0.5)'
        }
      }
      if (
        !(
          (row.id &&
            !row.leaf &&
            row.ysly == '1' &&
            column.field != 'name' &&
            column.title != '市域自主(万元)') ||
          (row.parentId == '0' && column.title == '市域自主(万元)')
        )
      ) {
        return {
          cursor: 'auto',
          backgroundColor: 'rgba(232, 234, 236,0.5)'
        }
      }
    }
  }
})
//跳转到省级统筹项目拟出库核定
const nckReview = () => {
  router.push({
    name: '/service/lslxJsc/sjtcxmnckhdys'
  })
}

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
  if (!key.includes('_syzz')) {
    row['hj_yxgm'] = 0
    for (const code in row) {
      if (code.includes('yxgm') && code != 'hj_yxgm') {
        row['hj_yxgm'] = Number(row['hj_yxgm']) + Number(row[code] != null ? row[code] : 0)
      }
    }
    row[key] = row[key] ? new Decimal(row[key]).toFixed(6) : '0.000000'
    const config: any = tableInfo.treeConfig
    const tableData = tableInfo.tableData
    summaryValue(tableData, config, key, 6, 'id')
    summaryValue(tableData, config, 'hj_yxgm', 6, 'id')
    getYxSjtcgm()
  } else {
    row['hj_syzz'] = 0
    for (const code in row) {
      if (code.includes('syzz') && code != 'hj_syzz') {
        row['hj_syzz'] = Number(row['hj_syzz']) + Number(row[code] != null ? row[code] : 0)
      }
    }
  }
}
// 计算一下省级统筹规模
const getYxSjtcgm = () => {
  rmarkData.yxsjtcgm = 0
  let gmSum = tableInfo.tableData.reduce(
    (gmSum: number, item: any) => gmSum + Number(item['hj_yxgm']),
    0
  )
  rmarkData.yxsjtcgm = Number(gmSum).toFixed(6)
  handleEnter()
}
// 获取编辑数据表格
const getEditDataHandle = ({ column, row }: any) => {
  if (
    typeof row[column.field] == 'undefined' ||
    row[column.field] == null ||
    row[column.field] == ''
  )
    return
  const id: string = row['id']
  const outIndex = updateParams.findIndex((item: any) => item.protypeId === id)
  if (column.title == '一下核定规模(万元)') {
    if (outIndex > -1) {
      const index = updateParams[outIndex].dwValueList.findIndex(
        (item: any) => item.field == column.field
      )
      if (index > -1) {
        updateParams[outIndex].dwValueList[index].value = row[column.field]
      } else {
        updateParams[outIndex].dwValueList.push({
          dwId: column.field.split('_')[0],
          field: column.field,
          value: row[column.field]
        })
      }
    } else {
      updateParams.push({
        protypeId: id,
        dwValueList: [
          {
            dwId: column.field.split('_')[0],
            field: column.field,
            value: parseFloat(row[column.field])
          }
        ]
      })
    }
  }
}
// 自定义导出
const exportHandle1 = () => {
  const $table = tableRef.value
  vxeExportHandle($table, '一下预算核定数据表', tableInfo.tableData)
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
    const fileName = '一下预算核定数据表'
    apiExportHandle(params, fileName, exportForYx)
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
    nd: props.formData?.nd,
    versionId: props.formData?.versionId
  }
  importRef.value.fromData = newParmas
  let tempApi: any = getImportTemplateForYx
  let importApi: any = importYxgm
  if (!importApi) return
  let params = {
    title: '一下数据编制',
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
  try {
    ruleFormRef.value.validate((valid: any) => {
      if (!valid) return
      const hj_syzz = tableInfo.tableData[0].hj_syzz
      if (Number(rmarkData.yxsytcgm) < Number(hj_syzz))
        return ElMessage.warning('市域自主合计值不能大于一下市域统筹规模')
      const text =
        updateParams.length === 0 ? '检测到没有编辑一下规模，是否确定保存？' : '请确定要保存的内容'
      ElMessageBox.confirm(text, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          const syzzMap: any = {
            protypeId: '',
            dwValueList: []
          }
          if (tableInfo.tableData && tableInfo.tableData.length > 0) {
            const syzzData = tableInfo.tableData[0]
            syzzMap.protypeId = syzzData.id
            syzzMap.dwValueList.length = 0
            for (const key in syzzData) {
              if (key.includes('_syzz') && key != 'hj_syzz') {
                syzzMap.dwValueList.push({
                  dwId: key.split('_')[0],
                  value: syzzData[key]
                })
              }
            }
          }
          const params = {
            saveYxqszgm: {
              versionId: props.formData?.versionId,
              value: rmarkData.yxqszgm
            },
            saveYxgm: {
              versionId: props.formData?.versionId,
              protypeValueList: updateParams
            },
            saveSyzz: {
              versionId: props.formData?.versionId,
              protypeValueList: [syzzMap]
            }
          }
          let res = await saveDataForYx(params)
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
const sum = ref<number>(0)
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
  const $table = tableRef.value
  threeLevel()
  gmSumData({ versionId: props.formData?.versionId, nd: props.formData?.nd })
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
// 获取数据
const getDataList = async () => {
  const api: any = getTableDataForYx
  tableInfo.loading = true
  tableInfo.tableData.length = 0
  let params = {
    nd: props.formData?.nd,
    // parentId: '',
    specialorgid: props.formData?.specialorgid,
    versionId: props.formData?.versionId,
    viewMethod: rmarkData.viewMethod
  }
  let res = await api(params)
  if (res.success) {
    tableInfo.data = tableInfo.tableData = res.data
    tableInfo.loading = false
  } else {
    tableInfo.loading = false
    ElMessage.error(res.msg)
  }
}
//获取表头
const getHeaderData = async (params: any) => {
  const api: any = getDynamicColumnForYx
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
// 获取统筹数据
const gmSumData = async (val: any) => {
  let res: any = await getYxGmSumData(val)
  if (res.success && res.data) {
    for (const key in res.data) {
      rmarkData[key] = Number(res.data[key]).toFixed(6)
    }
  } else {
    ElMessage.error(res.msg)
  }
}
// 全省总规模
const handleEnter = () => {
  rmarkData.yxqszgm = rmarkData.yxqszgm ? Number(rmarkData.yxqszgm).toFixed(6) : ''
  rmarkData.yxsytcgm = Number(rmarkData.yxqszgm - rmarkData.yxsjtcgm).toFixed(6)
}

// 一下核定
const handlePass = async () => {
  ElMessageBox.confirm('此操作将导致一下核定规模无法编辑，请确认', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      let res = await yxhd(props.formData?.versionId)
      if (res.success) {
        ElMessage.success('保存成功！')
        emits('getPass', true)
        newData()
      } else {
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
.modal_content {
  width: 100%;
  height: 100%;
  padding: 10px;
  position: relative;
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
    width: 96%;
    display: flex;
    justify-content: space-between;
    // align-items: center;
    position: absolute;
    top: 50px;
    left: 0px;
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
    margin: -10px auto;
    height: calc(100% - 100px);
  }
}
</style>
