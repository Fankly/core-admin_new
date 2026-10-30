<script setup lang="ts">
defineOptions({ name: "/statistics/components/FormDialog" })
import MultipleProType from '@/views/statistics/components/MultipleProType.vue'
import type { InitParams } from '@/views/statistics/budgetStatisticsConfig.vue'
import TypeDialog from '@/views/statistics/components/TypeDialog.vue'
import TreeDialog from '@/views/statistics/components/TreeDialog.vue'
import { ElMessage } from 'element-plus'
import {
  deleteDataDetail,
  deleteSumDetail,
  getConfigInfo,
  getDataDetail,
  getSumDetail,
  saveConfig,
  SaveData
} from '@/api/statistics/budgetStatisticsConfig'
import { getAllProtypeTreeNew, getPublicCodeList } from '@/api/common'
import { cloneDeep } from 'lodash'
import { VXETable } from 'vxe-table'
import { computed, defineProps, ref, toRef, defineExpose, reactive, defineEmits, watch, nextTick } from 'vue'
import { useWindowSize } from '@vueuse/core'

interface DialogData {
  title: string
}

interface Props {
  dialogData: DialogData
  initParams: InitParams
  treeParams: any
  editData: any
  operationFlag: string
  showExecutionFields?: boolean
  showBoldField?: boolean
}

const props = defineProps<Props>()

// 分析报告节点类型、普通分析节点：预算统计配置 / 预算执行分析配置两个页面展示
const showJdFields = computed(() => Boolean(props.showBoldField || props.showExecutionFields))

const emit = defineEmits(['updateTable', 'clearData'])

const typeDialogRef = ref()
const treeDialogRef = ref()
const protypeRef = ref()

const title = toRef(props.dialogData, 'title')
const showModal = ref(false)

const isShowTable = ref(false)
const formDialogRef = ref()
const typeTableRef = ref()
const treeTableRef = ref()
const formRef = ref()

const dataDetails = ref<any[]>([])
const dataSum = ref<any[]>([])

const formData = reactive<{
  configName: string
  statMethod: string
  statType: string
  isleaf: string
  recState: string
  dispOrder: string
  subName: string
  gkbm: string
  ysly: string
  cnxm: string
  cnxmms: string
  sfjc: string
  proType: string
  isDisplay: string
  bgjdType: string
  bgjdValue: string
}>({
  configName: '',
  statMethod: '',
  statType: '1',
  isleaf: '0',
  recState: '1',
  isDisplay: '1',
  dispOrder: '',
  subName: '',
  gkbm: '',
  ysly: '',
  cnxm: '',
  cnxmms: '',
  sfjc: '0',
  proType: '',
  bgjdType: '',
  bgjdValue: ''
})

const proTypeData = ref([])

const validateStatMethod = (rules: any, value: string, callback: any) => {
  if (formData.isleaf === '0') {
    callback()
  } else {
    if (!value) {
      callback(new Error('请选择统计方式'))
    } else {
      callback()
    }
  }
}

const validateStatTypeMethod = (rules: any, value: string, callback: any) => {
  if (formData.isleaf === '0') {
    callback()
  } else {
    if (!value) {
      callback(new Error('请选择统计类型'))
    } else {
      callback()
    }
  }
}

const validateProTypes = (rules: any, value: string, callback: any) => {
  if (formData.statMethod === '2') {
    callback()
  } else {
    if (!value) {
      const tipText = formData.statType === '1' ? '请选择项目类型' : '请输入承诺项'
      callback(new Error(tipText))
    } else {
      callback()
    }
  }
}

// 普通分析节点：分析报告节点类型为 1 时必填，其余情况不校验（值会被清空）
const validateBgjdValue = (rules: any, value: string, callback: any) => {
  if (formData.bgjdType !== '1') {
    callback()
  } else if (!value) {
    callback(new Error('请选择普通分析节点'))
  } else {
    callback()
  }
}

const rules = {
  configName: [{ required: true, message: '请输入名称', trigger: 'input' }],
  statMethod: [{ validator: validateStatMethod, trigger: 'change' }],
  statType: [{ validator: validateStatTypeMethod, trigger: 'change' }],
  isleaf: [{ required: true, message: '请选择是否末级节点', trigger: 'change' }],
  recState: [{ required: true, message: '请选择是否启用', trigger: 'change' }],
  isDisplay: [{ required: true, message: '请选择是否显示', trigger: 'change' }],
  dispOrder: [{ required: true, message: '请输入序号', trigger: 'input' }],
  bgjdValue: [{ validator: validateBgjdValue, trigger: 'change' }]
}

const publicList = ref<
  {
    code: string
    name: string
  }[]
>([])

const statTypeList = ref<
  {
    code: string
    name: string
  }[]
>([])

const bgjdTypeList = ref<
  {
    code: string
    name: string
  }[]
>([])

const bgjdValueList = ref<
  {
    code: string
    name: string
  }[]
>([])

const getCollapsedHeight = () => String(props.showExecutionFields ? 470 : props.showBoldField ? 330 : 240)
const getTextModeHeight = () => String(props.showExecutionFields ? 590 : props.showBoldField ? 450 : 360)
const getTableModeHeight = () => String(props.showExecutionFields ? 830 : props.showBoldField ? 690 : 600)

const height = ref(getCollapsedHeight())
const { width: windowWidth, height: windowHeight } = useWindowSize()
const dialogWidth = computed(() => (props.showBoldField ? Math.min(860, windowWidth.value - 32) : '50%'))
const dialogHeight = computed(() => {
  if (!props.showBoldField) return height.value
  const contentHeight = Number(height.value) + (windowWidth.value <= 640 ? 180 : 0)
  return Math.min(contentHeight, windowHeight.value - 48)
})
const formDialogLoading = ref(false)

const updateDialogLayout = () => {
  const isLeaf = formData.isleaf === '1'
  const isTextMode = isLeaf && formData.statMethod === '1' && formData.statType === '2'

  isShowTable.value = isLeaf && !isTextMode

  if (!isLeaf) {
    height.value = getCollapsedHeight()
    return
  }

  height.value = isShowTable.value ? getTableModeHeight() : getTextModeHeight()
}

const getDialogTop = (preferredHeight: string) => {
  if (props.showBoldField) {
    return Math.max(24, (windowHeight.value - Number(dialogHeight.value)) / 2)
  }
  const heightValue = Number(preferredHeight)
  if (heightValue >= Number(getTableModeHeight())) {
    return props.showExecutionFields ? 140 : 240
  }
  if (heightValue >= Number(getTextModeHeight())) {
    return props.showExecutionFields ? 240 : 300
  }
  return props.showExecutionFields ? 300 : 400
}

const addDialogHandle = () => {
  if (formData.statMethod === '1') typeDialogRef.value.showModal = true
  if (formData.statMethod === '2') treeDialogRef.value.showModal = true
}

const delDataHandle = async () => {
  const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    let $table = formData.statMethod === '1' ? typeTableRef.value : treeTableRef.value
    if ($table) {
      let tableData: any[] = formData.statMethod === '1' ? cloneDeep(dataDetails.value) : cloneDeep(dataSum.value)
      const records = $table.getCheckboxRecords()
      if (records.length === 0) {
        ElMessage.warning('请选择一条或多条数据进行删除!')
        return
      }
      if (formData.statMethod === '1') {
        const map = new Map(records.map((item: any) => [item.proType, item]))
        dataDetails.value = tableData.filter((item) => !map.has(item.proType))
        let deleteData = tableData.filter((item) => map.has(item.proType))
        let detailIds = deleteData
          .filter((item) => item.detailId)
          .map((item) => item.detailId)
          .join(',')
        if (detailIds) {
          let res = await deleteDataDetail(detailIds)
          if (res.success) {
            ElMessage.success('删除成功!')
          } else {
            ElMessage.error(res.msg)
          }
        } else {
          ElMessage.success('删除成功!')
        }
      } else {
        const map = new Map(records.map((item: any) => [item.tarConfigId, item]))
        dataSum.value = tableData.filter((item) => !map.has(item.tarConfigId))
        let deleteData = tableData.filter((item) => map.has(item.tarConfigId))
        let detailIds = deleteData
          .filter((item) => item.detailId)
          .map((item) => item.detailId)
          .join(',')
        if (detailIds) {
          let res = await deleteSumDetail(detailIds)
          if (res.success) {
            ElMessage.success('删除成功!')
          } else {
            ElMessage.error(res.msg)
          }
        } else {
          ElMessage.success('删除成功!')
        }
      }
    }
  }
}

const getTypeDataHandle = (typeData: any) => {
  if (typeData) {
    let res = dataDetails.value.findIndex((item) => Number(item.proType) === Number(typeData.proType.id))
    if (res !== -1) {
      ElMessage.warning('相同项目类型不能重复添加！')
      return
    }
    dataDetails.value.push({
      packType: typeData.packType?.code,
      packTypeName: typeData.packType?.name,
      proType: typeData.proType?.id,
      proTypeName: typeData.proType?.name
    })
  }
}

// 判断是否重复
const compareIds = (arr1: any[], arr2: any[]) => {
  const ids1 = new Set(arr1.map((item) => item.tarConfigId))
  return arr2.some((item) => ids1.has(item.tarConfigId))
}

const getTreeDataHandle = (treeData: any[]) => {
  if (treeData) {
    let treeDataList = treeData.map((item) => ({
      tarConfigId: item.id
    }))
    let res = compareIds(treeDataList, dataSum.value)
    if (res) {
      ElMessage.warning('相同目标名称不能重复添加！')
      return
    }
  }
  let treeList = treeData.map((item) => ({
    ...item,
    tarConfigId: item.id
  }))
  dataSum.value = dataSum.value.concat(treeList)
}

const getPublicDataList = async (code: string[]) => {
  const codes = showJdFields.value ? [...code, 'YSZXFXBG_JDTYPE', 'YSZXFX_PTJDTYPE'] : code
  let res = await getPublicCodeList({
    codes: codes
  })
  if (res.success && res.data) {
    publicList.value = res.data['YSTJPZ_TJFS'] || []
    statTypeList.value = res.data['YSTJPZ_TJLX'] || []
    bgjdTypeList.value = res.data['YSZXFXBG_JDTYPE'] || []
    bgjdValueList.value = res.data['YSZXFX_PTJDTYPE'] || []
  } else {
    ElMessage.error(res.msg)
  }
}

const getFormInfo = async () => {
  formDialogLoading.value = true
  const configId = props.editData?.configId
  if (configId) {
    let res = await getConfigInfo(configId)
    if (res.success && res.data) {
      formData.isleaf = res.data.isleaf
      formData.dispOrder = res.data.dispOrder
      formData.recState = res.data.recState
      formData.statMethod = res.data.statMethod
      formData.statType = res.data.statType
      formData.configName = res.data.configName
      formData.proType = res.data.proType
      formData.isDisplay = res.data.isDisplay
      formData.subName = res.data.subName || ''
      formData.gkbm = res.data.gkbm || ''
      formData.ysly = res.data.ysly || ''
      formData.cnxm = res.data.cnxm || ''
      formData.cnxmms = res.data.cnxmms || ''
      formData.sfjc = res.data.sfjc || '0'
      formData.bgjdType = res.data.bgjdType ? String(res.data.bgjdType) : ''
      // 非分析报告节点类型不保留普通分析节点
      formData.bgjdValue = formData.bgjdType === '1' && res.data.bgjdValue ? String(res.data.bgjdValue) : ''
      updateDialogLayout()
      formDialogLoading.value = false
    } else {
      ElMessage.error(res.msg)
      formDialogLoading.value = false
    }
  }
}

const showModalHandle = () => {
  if (protypeRef.value) protypeRef.value.clearHandle()
  getPublicDataList(['YSTJPZ_TJFS', 'YSTJPZ_TJLX'])
  if (props.operationFlag === 'ADD') {
    formData.statMethod = '1'
    updateDialogLayout()
  } else {
    getFormInfo()
  }
}

const saveDataHandle = async () => {
  if (!formRef.value) return
  try {
    let validateRes = await formRef.value.validate()
    if (validateRes) {
      formDialogLoading.value = true
      let params: SaveData = {
        busiType: props.initParams.busiType,
        configName: formData.configName,
        nd: Number(props.initParams.nd),
        isleaf: Number(formData.isleaf),
        statMethod: formData.statMethod,
        parentId: Number(props.initParams.nd),
        dispOrder: Number(formData.dispOrder),
        recState: Number(formData.recState),
        isDisplay: formData.isDisplay
      }
      if (props.showExecutionFields) {
        params.subName = formData.subName
      }
      if (props.showExecutionFields) {
        params.gkbm = formData.gkbm
        params.ysly = formData.ysly
        params.cnxm = formData.cnxm
        params.cnxmms = formData.cnxmms
      }
      if (props.showExecutionFields || props.showBoldField) {
        params.sfjc = formData.sfjc
      }
      if (showJdFields.value) {
        params.bgjdType = formData.bgjdType || ''
        params.bgjdValue = formData.bgjdType === '1' ? formData.bgjdValue || '' : ''
      }
      if (Number(formData.isleaf) === 1 && formData.statMethod === '1') {
        if (Array.isArray(formData.proType)) {
          formData.proType = ''
        } else {
          params.proType = formData.proType
        }
        params.statType = Number(formData.statType)
      }
      if (Number(formData.isleaf) === 0) {
        params.statMethod = ''
      }
      if (props.operationFlag === 'EDIT') {
        params.configId = props.editData.configId
      }
      if (props.treeParams && Number(props.treeParams.id) !== Number(props.initParams.nd)) {
        params.parentId = props.treeParams?.id
      }
      params.dataDetails = dataDetails.value.map((item) => ({
        ...item
      }))
      params.sumDetails = dataSum.value.map((item) => ({
        ...item
      }))
      let res = await saveConfig(params)
      if (res.success) {
        ElMessage.success('保存成功！')
        formDialogLoading.value = false
        emit('updateTable')
        closeModalHandle()
      } else {
        ElMessage.error(res.msg)
        formDialogLoading.value = false
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const getProTypeData = async () => {
  let res = await getAllProtypeTreeNew()
  if (res.success) {
    proTypeData.value = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

watch(
  () => formData.isleaf,
  (newVal) => {
    updateDialogLayout()
    dataDetails.value.length = 0
    dataSum.value.length = 0
    if (newVal === '1' && (dataSum.value.length === 0 || dataDetails.value.length === 0)) {
      getDetailData(formData.statMethod)
    }
    if (newVal === '1') {
      getProTypeData()
    }
  }
)

const getDetailData = async (flag: string) => {
  if (!flag && formData.isleaf === '1') {
    flag = '1'
    formData.statMethod = '1'
  }
  formDialogLoading.value = true
  let obj: any = {
    1: getDataDetail,
    2: getSumDetail
  }
  const configId: string = props.editData?.configId
  if (configId) {
    const res = await obj[flag](configId)
    if (res.success && res.data) {
      if (flag === '1') {
        dataDetails.value = res.data
      } else {
        dataSum.value = res.data.map((item: any) => ({
          name: item.tarConfigName,
          ...item
        }))
      }
    }
  }
  formDialogLoading.value = false
}

const changeStatMethodHandle = (val: string) => {
  if (val && val === '2') {
    formData.proType = ''
  }
  updateDialogLayout()
}

const changeLeafDataHandle = (val: string) => {
  formData.proType = ''
}

const changeStatTypeHandle = (val: string) => {
  formData.proType = ''
  dataDetails.value = []
  updateDialogLayout()
}

// 分析报告节点类型变化：不为 1 时清空普通分析节点
const changeBgjdTypeHandle = (val: string) => {
  if (val !== '1') {
    formData.bgjdValue = ''
  }
  nextTick(() => formRef.value?.clearValidate?.('bgjdValue'))
}

watch(
  () => formData.statMethod,
  (newVal) => {
    if (newVal === '1') {
      dataSum.value.length = 0
      // 获取请求
    }
    if (newVal === '2') {
      dataDetails.value.length = 0
    }
    if (formData.isleaf === '1') getDetailData(newVal)
  }
)

watch([height, windowHeight, windowWidth], ([newVal]) => {
  nextTick(() => {
    if (!showModal.value) return
    const left = props.showBoldField ? (windowWidth.value - Number(dialogWidth.value)) / 2 : 'center'
    formDialogRef.value?.setPosition(getDialogTop(String(newVal)), left)
  })
})

const resetMethod = () => {
  formData.configName = ''
  formData.statMethod = ''
  formData.isleaf = '0'
  formData.recState = '1'
  formData.dispOrder = ''
  formData.subName = ''
  formData.gkbm = ''
  formData.ysly = ''
  formData.cnxm = ''
  formData.cnxmms = ''
  formData.sfjc = '0'
  formData.proType = ''
  formData.statType = '1'
  formData.isDisplay = '1'
  formData.bgjdType = ''
  formData.bgjdValue = ''
}

const closeModalHandle = () => {
  showModal.value = false
  resetMethod()
  emit('clearData')
}

defineExpose({
  title,
  showModal
})
</script>

<template>
  <vxe-modal
    :destroy-on-close="true"
    ref="formDialogRef"
    :loading="formDialogLoading"
    @show="showModalHandle"
    @close="closeModalHandle"
    class-name="modal"
    :height="dialogHeight"
    :position="props.showBoldField ? 'center' : undefined"
    v-model="showModal"
    :width="dialogWidth"
    :title="title"
    show-zoom
    resize
  >
    <div class="modal" :class="{ 'budget-config-dialog': props.showBoldField }">
      <div class="main">
        <div class="bottom-box">
          <div class="bottom-form">
            <el-form ref="formRef" label-position="right" label-width="140px" :model="formData" :rules="rules">
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="名称：" prop="configName">
                    <el-input maxlength="31" v-model="formData.configName"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="序号：" prop="dispOrder">
                    <el-input
                      v-model="formData.dispOrder"
                      maxlength="8"
                      @input="(v:string) => (formData.dispOrder = v.replace(/[^\d]/g, ''))"
                      :controls="false"
                      placeholder=""
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-if="props.showExecutionFields" :gutter="24">
                <el-col :span="12">
                  <el-form-item label="前台显示序号：" prop="subName">
                    <el-input v-model="formData.subName" maxlength="31"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="归口部门：">
                    <el-input v-model="formData.gkbm" maxlength="120"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="预算来源：">
                    <el-input v-model="formData.ysly" maxlength="120"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="承诺项：">
                    <el-input v-model="formData.cnxm" maxlength="120"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-if="props.showExecutionFields" :gutter="24">
                <el-col v-if="props.showExecutionFields" :span="12">
                  <el-form-item label="备注：">
                    <el-input v-model="formData.cnxmms" maxlength="120"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="是否加粗：" prop="sfjc">
                    <el-select v-model="formData.sfjc" style="width: 100%">
                      <el-option value="1" label="是"></el-option>
                      <el-option value="0" label="否"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="是否启用：" prop="recState">
                    <el-select v-model="formData.recState" style="width: 100%">
                      <el-option value="1" label="启用"></el-option>
                      <el-option value="0" label="停用"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="是否显示：" prop="isDisplay">
                    <el-select v-model="formData.isDisplay" style="width: 100%">
                      <el-option value="1" label="是"></el-option>
                      <el-option value="0" label="否"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-if="showJdFields" :gutter="24">
                <el-col :span="12">
                  <el-form-item label="分析报告节点类型：" prop="bgjdType">
                    <el-select
                      v-model="formData.bgjdType"
                      clearable
                      placeholder="请选择"
                      style="width: 100%"
                      @change="changeBgjdTypeHandle"
                      @clear="changeBgjdTypeHandle('')"
                    >
                      <el-option v-for="item in bgjdTypeList" :value="String(item.code)" :label="item.name" :key="item.code"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="普通分析节点：" prop="bgjdValue">
                    <el-select
                      v-model="formData.bgjdValue"
                      :disabled="formData.bgjdType !== '1'"
                      clearable
                      :placeholder="formData.bgjdType === '1' ? '请选择' : '请先选择分析报告节点类型'"
                      style="width: 100%"
                    >
                      <el-option v-for="item in bgjdValueList" :value="String(item.code)" :label="item.name" :key="item.code"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="是否末级节点：" prop="isleaf">
                    <el-select @change="changeLeafDataHandle" v-model="formData.isleaf" style="width: 100%">
                      <el-option value="1" label="是"></el-option>
                      <el-option value="0" label="否"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col v-if="props.showBoldField && !props.showExecutionFields" :span="12">
                  <el-form-item label="是否加粗：" prop="sfjc">
                    <el-select v-model="formData.sfjc" style="width: 100%">
                      <el-option value="1" label="是"></el-option>
                      <el-option value="0" label="否"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-show="formData.isleaf === '1'">
                  <el-form-item label="统计方式：" prop="statMethod">
                    <el-select @change="changeStatMethodHandle" v-model="formData.statMethod" style="width: 100%">
                      <el-option v-for="item in publicList" :value="item.code" :label="item.name" :key="item.code"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col v-if="formData.isleaf === '1' && formData.statMethod === '1'" :span="12">
                  <el-form-item label="统计类型：" prop="statType">
                    <el-select @change="changeStatTypeHandle" v-model="formData.statType" style="width: 100%">
                      <el-option v-for="item in statTypeList" :value="item.code" :label="item.name" :key="item.code"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col v-if="formData.isleaf === '1' && formData.statMethod === '1'" :span="12" class="pro-type-field">
                  <el-form-item :label="formData.statType === '1' ? '项目类型：' : '承诺项：'" prop="proType">
                    <MultipleProType
                      v-if="formData.statType === '1'"
                      ref="protypeRef"
                      style="width: 100%"
                      :leaf-only="true"
                      v-model="formData.proType"
                      :props="{
                        children: 'children',
                        label: 'name'
                      }"
                      :value-key-type="true"
                      :tree-data="proTypeData"
                      placeholder="请选择项目类型"
                    ></MultipleProType>
                    <el-input resize="none" :rows="2" type="textarea" v-else v-model="formData.proType" placeholder="请输入承诺项"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
          <div class="bottom-box" v-show="isShowTable">
            <div class="top-box">
              <el-button plain size="small" type="primary" @click="addDialogHandle">新 增</el-button>
              <el-button plain size="small" type="primary" @click="delDataHandle">删 除</el-button>
            </div>
            <div class="bottom-table">
              <vxe-table
                ref="typeTableRef"
                show-overflow
                :row-config="{ height: 32 }"
                :data="dataDetails"
                v-show="formData.statMethod === '1'"
                resizable
                align="center"
                border
                class="table"
                height="100%"
              >
                <vxe-column type="checkbox" width="60"></vxe-column>
                <vxe-column :show-overflow="true" field="proTypeName" width="240" title="项目类型"></vxe-column>
                <vxe-column :show-overflow="true" field="packTypeName" width="240" title="包类型"></vxe-column>
              </vxe-table>
              <vxe-table
                ref="treeTableRef"
                show-overflow
                :row-config="{ height: 32 }"
                :data="dataSum"
                v-show="formData.statMethod === '2'"
                resizable
                align="center"
                border
                class="table"
                height="100%"
              >
                <vxe-column type="checkbox" width="60"></vxe-column>
                <vxe-column field="name" :show-overflow="true" width="240" title="目标名称"></vxe-column>
              </vxe-table>
            </div>
          </div>
        </div>
      </div>
      <div class="footer">
        <el-button plain size="small" type="primary" @click="saveDataHandle">保 存</el-button>
        <el-button plain size="small" type="primary" @click="closeModalHandle">取 消</el-button>
      </div>
    </div>
    <TypeDialog @getTypeData="getTypeDataHandle" ref="typeDialogRef" :initParams="props.initParams"></TypeDialog>
    <TreeDialog @getTreeData="getTreeDataHandle" ref="treeDialogRef" :initParams="props.initParams"></TreeDialog>
  </vxe-modal>
</template>

<style lang="less" scoped>
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  .bottom-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;

    .top-box {
      line-height: 28px;
    }

    .bottom-table {
      padding-top: 10px;
      padding-bottom: 10px;
      min-width: 0;
      min-height: 0;
      flex: 1;
    }
  }
}

.footer {
  text-align: center;
}

.modal {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.budget-config-dialog {
  .main {
    overflow: auto;
    padding-right: 4px;
  }

  .bottom-form {
    flex-shrink: 0;
  }

  :deep(.el-form) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 24px;
  }

  :deep(.el-form > .el-row) {
    display: contents;
  }

  :deep(.el-form > .el-row > .el-col) {
    width: 100%;
    max-width: 100%;
    padding: 0 !important;
  }

  .pro-type-field {
    grid-column: 1 / -1;
  }

  .bottom-box > .bottom-box {
    flex-shrink: 0;
    min-height: 200px;
  }

  .footer {
    flex-shrink: 0;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
  }

  @media (max-width: 640px) {
    :deep(.el-form) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
