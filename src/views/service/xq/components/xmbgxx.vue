<template>
  <div class="xmbgxx" v-loading="loading">
    <section class="xmbgxx__section">
      <div class="xmbgxx__section-header">
        <span class="xmbgxx__section-title">变更信息</span>
      </div>
      <el-form
        ref="formRef"
        class="xmbgxx__form"
        :disabled="isViewMode"
        :model="formData"
        label-position="right"
        label-width="260px"
        label-suffix="："
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="变更类型" prop="bglx" :rules="[{ required: true, message: '请选择变更类型' }]">
              <el-select v-model="formData.bglx" clearable filterable placeholder="请选择变更类型" style="width: 100%">
                <el-option v-for="item in bglxOptions" :key="item.code" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="变更原因说明" prop="bgyy" :rules="[{ required: true, message: '请输入变更原因说明' }]">
              <el-input
                v-model="formData.bgyy"
                type="textarea"
                resize="none"
                :rows="1"
                maxlength="500"
                show-word-limit
                placeholder="请输入变更原因说明"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="调整事由" prop="tzsy" :rules="[{ required: true, message: '请选择调整事由' }]">
              <el-select v-model="formData.tzsy" clearable filterable placeholder="请选择调整事由" style="width: 100%" @change="handleChange">
                <el-option v-for="item in tzsyOptions" :key="item.code" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否出具评审意见" prop="sfcjpsyj" :rules="[{ required: true, message: '请选择是否出具评审意见' }]">
              <el-select disabled v-model="formData.sfcjpsyj" clearable placeholder="请选择是否出具评审意见" style="width: 100%">
                <el-option v-for="item in sfcjpsyjOptions" :key="item.code" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :rules="[{ required: true, message: '请输入申报金额（万元）（含税）变更后' }]">
              <template #label>
                <span class="xmbgxx__label xmbgxx__label-nowrap">申报金额（万元）（含税）变更后</span>
              </template>
              <el-input-number
                v-model="formData.bgAllInvestTax"
                :controls="false"
                placeholder="请输入申报金额（万元）（含税）变更后"
                style="width: 100%"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :rules="[{ required: true, message: '请输入申报金额（万元）（不含税）变更后' }]">
              <template #label>
                <span class="xmbgxx__label xmbgxx__label-nowrap">申报金额（万元）（不含税）变更后</span>
              </template>
              <el-input-number
                v-model="formData.bgAmount"
                :controls="false"
                placeholder="请输入申报金额（万元）（不含税）变更后"
                style="width: 100%"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="项目实施内容（变更项目）" prop="ssnr" :rules="[{ required: true, message: '请输入项目实施内容' }]">
              <el-input
                v-model="formData.ssnr"
                type="textarea"
                resize="none"
                :rows="4"
                maxlength="1000"
                show-word-limit
                placeholder="请输入项目实施内容"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="必要性（变更项目）" prop="byx" :rules="[{ required: true, message: '请输入必要性说明' }]">
              <el-input
                v-model="formData.byx"
                type="textarea"
                resize="none"
                :rows="4"
                maxlength="1000"
                show-word-limit
                placeholder="请输入必要性说明"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </section>

    <section v-if="attachmentGroups.length" class="xmbgxx__section xmbgxx__section--attach">
      <DynamicUploadGroup
        v-for="group in attachmentGroups"
        :key="group.key"
        :model-value="attachmentValue"
        class="xmbgxx__attach"
        :title="group.label"
        :columns="group.columns"
        :allData="attachmentAllData"
        :selectData="uploadSelectData"
        :disabled="isViewMode || group.disabled"
        :show-delete="!isViewMode && !group.disabled"
        :show-actions="true"
        :local-remove-only="true"
        local-remove-success-message="已移除，保存后生效"
        :upload-request="handleUploadAttach"
        table-height="200px"
        @remove="handleAttachmentRemove"
        @change="(files: any[]) => handleAttachmentGroupChange(group, files)"
      />
    </section>
  </div>
</template>

<script setup lang="ts" name="xmbgxx">
import { getPublicData } from '@/api/common'
import { getBgInfo, getFjGroupByXmlx, uploadYsbgAttach } from '@/api/service/budget'
import DynamicUploadGroup from '@/components/DynamicForm/components/DynamicUploadGroup.vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'

interface Props {
  selectData: any
  globalParams: any
  initialData?: Record<string, any>
  opType: string
  projectChangeEditable?: boolean
  pageType?: string
  projectChangeMode?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectData: null,
  globalParams: null,
  initialData: () => ({}),
  opType: 'EDIT',
  projectChangeEditable: false,
  pageType: '',
  projectChangeMode: ''
})

const ISCUSTOMCOPONENT = true
const formRef = ref()
const loading = ref(false)
const isViewMode = computed(() => props.opType === 'VIEW' || !props.projectChangeEditable)
const attachmentGroups = ref<any[]>([])
const attachmentColumns = computed(() => attachmentGroups.value.flatMap((group) => group.columns || []))
const attachmentValue = ref<any[]>([])
const removedAttachmentUuids = ref<string[]>([])
const bglxOptions = ref<any[]>([])
const tzsyOptions = ref<any[]>([])
const sfcjpsyjOptions = [
  { code: '0', name: '否' },
  { code: '1', name: '是' }
]
const budgetChangeData = ref<Record<string, any>>({})
const loadedBudgetChangeKey = ref('')
const hasMounted = ref(false)

const formData = reactive({
  bglx: '',
  tzsy: '',
  sfcjpsyj: '',
  bgyy: '',
  bgAllInvestTax: null as number | null,
  bgAmount: null as number | null,
  ssnr: '',
  byx: ''
})

const getObjectValue = (source: any, keys: string[]) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) return source[key]
  }
  return ''
}

const getBudgetChangeValue = (...keys: string[]) => getObjectValue(budgetChangeData.value || {}, keys)

const getProjectType = () => {
  return (
    props.selectData?.xmlx ||
    props.selectData?.proType ||
    props.selectData?.protypeId ||
    props.globalParams?.XMLX ||
    props.globalParams?.xmlx ||
    props.globalParams?.PROTYPE_ID ||
    ''
  )
}

const getBgId = () => String(getBudgetChangeValue('bgid', 'BGID') || '')

const getBudgetChangeXmid = () =>
  String(
    props.selectData?.xmid ||
      props.selectData?.XMID ||
      props.globalParams?.xmid ||
      props.globalParams?.XMID ||
      props.selectData?.proId ||
      props.selectData?.PRO_ID ||
      props.selectData?.id ||
      props.selectData?.ID ||
      props.globalParams?.proId ||
      props.globalParams?.PRO_ID ||
      props.globalParams?.id ||
      props.globalParams?.ID ||
      ''
  )

const toArray = (value: any) => {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

const normalizeFjTypes = (fjTypes: any) => {
  if (Array.isArray(fjTypes)) return fjTypes
  if (typeof fjTypes === 'string') {
    return fjTypes
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const getAttachmentConfigList = (data: any) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.columns) || data?.fjId || data?.fjType) return [data]
  if (data && typeof data === 'object') return Object.values(data)
  return []
}

const getAttachmentGroupColumns = (group: any) => {
  if (Array.isArray(group?.columns)) return group.columns
  if (Array.isArray(group?.children)) return group.children
  if (Array.isArray(group?.value?.columns)) return group.value.columns
  return toArray(group)
}

const normalizeAttachmentColumns = (columns: any[] = [], parentDisabled = false): any[] => {
  return columns
    .flatMap((column) => {
      const value = column?.value && typeof column.value === 'object' ? column.value : {}
      const children = Array.isArray(column?.children)
        ? column.children
        : Array.isArray(value?.children)
        ? value.children
        : Array.isArray(value?.columns)
        ? value.columns
        : []
      const fjId =
        getObjectValue(column, ['fjId', 'FJ_ID', 'fjid', 'fj_id', 'attachType', 'ATTACH_TYPE']) ||
        getObjectValue(value, ['fjId', 'FJ_ID', 'fjid', 'fj_id', 'attachType', 'ATTACH_TYPE'])
      if (!fjId) {
        return normalizeAttachmentColumns(children, parentDisabled || column.disabled)
      }
      const item = {
        ...column,
        fjId: String(fjId),
        label:
          getObjectValue(column, ['label', 'fjName', 'FJ_NAME', 'name', 'fjTypeName', 'FJ_TYPE_NAME', 'fjType', 'message', 'prop']) ||
          getObjectValue(value, ['label', 'fjName', 'FJ_NAME', 'name', 'fjTypeName', 'FJ_TYPE_NAME', 'fjType', 'message', 'prop']) ||
          fjId,
        fjTypes: normalizeFjTypes(
          getObjectValue(column, ['fjTypes', 'FJ_TYPES', 'fileTypes', 'FILE_TYPES', 'fjType', 'FJ_TYPE']) ||
            getObjectValue(value, ['fjTypes', 'FJ_TYPES', 'fileTypes', 'FILE_TYPES', 'fjType', 'FJ_TYPE'])
        ),
        disabled: isViewMode.value || parentDisabled || column.disabled
      }
      return [item, ...normalizeAttachmentColumns(children, item.disabled)]
    })
    .filter(Boolean) as any[]
}

const normalizeAttachmentGroups = (data: any) => {
  const groups: any[] = []
  getAttachmentConfigList(data).forEach((step: any, stepIndex: number) => {
    getAttachmentGroupColumns(step).forEach((column: any, columnIndex: number) => {
      const columns = normalizeAttachmentColumns(getAttachmentGroupColumns(column), column.disabled)
      if (!columns.length) return
      groups.push({
        key: `${step.stepId || stepIndex}-${column.prop || column.label || columnIndex}`,
        label: column.uploadTitle || column.label || step.stepName || '附件',
        disabled: isViewMode.value || column.disabled,
        columns
      })
    })
  })
  return groups
}

const normalizeAttachItem = (item: any, fjId: string) => ({
  ...item,
  fjId: String(getObjectValue(item, ['fjId', 'FJ_ID', 'fjType', 'FJ_TYPE']) || fjId),
  name: getObjectValue(item, ['name', 'attachName', 'ATTACH_NAME', 'fileName', 'FILE_NAME']) || '',
  uuid: getAttachmentUuid(item)
})

const getAttachmentUuid = (item: any) => {
  const uuid = getObjectValue(item, ['uuid', 'UUID', 'uid'])
  return uuid ? String(uuid) : ''
}

const isRemovedAttachment = (item: any) => {
  const uuid = getAttachmentUuid(item)
  return Boolean(uuid && removedAttachmentUuids.value.includes(uuid))
}

const attachmentAllData = computed(() => {
  const result: Record<string, any[]> = {}

  const appendAttachItems = (key: string, attachItems: any[]) => {
    if (!key || !Array.isArray(attachItems)) return
    const target = result[key] || []
    attachItems
      .map((item: any) => normalizeAttachItem(item, key))
      .filter((item: any) => !isRemovedAttachment(item))
      .forEach((item: any) => {
        if (!item.uuid || !target.some((targetItem: any) => targetItem.uuid === item.uuid)) {
          target.push(item)
        }
      })
    if (target.length) result[key] = target
  }

  const appendAttachSource = (source: any) => {
    if (!source || typeof source !== 'object') return
    const attaches = getObjectValue(source, ['attaches', 'ATTACHES'])
    if (attaches && typeof attaches === 'object') {
      Object.keys(attaches).forEach((key) => appendAttachItems(key, attaches[key]))
    }
    Object.keys(source).forEach((key) => {
      const attachItems = source[key]
      appendAttachItems(key, attachItems)
    })
  }

  ;[budgetChangeData.value].forEach(appendAttachSource)

  const uuid = getBudgetChangeValue('uuid', 'UUID')
  const normalizedUuid = uuid ? String(uuid) : ''
  const attachName = getBudgetChangeValue('attachName', 'ATTACH_NAME')
  const firstFjId = attachmentColumns.value[0]?.fjId
  if (
    normalizedUuid &&
    attachName &&
    firstFjId &&
    !removedAttachmentUuids.value.includes(normalizedUuid) &&
    !Object.values(result)
      .flat()
      .some((item: any) => item.uuid === normalizedUuid)
  ) {
    result[firstFjId] = [
      ...(result[firstFjId] || []),
      normalizeAttachItem(
        {
          uuid: normalizedUuid,
          attachName
        },
        firstFjId
      )
    ]
  }
  return result
})

const uploadSelectData = computed(() => ({
  ...(props.selectData || {}),
  id: props.selectData?.id || props.selectData?.xmid || props.globalParams?.id || props.globalParams?.ID,
  bgid: getBgId(),
  xmlx: getProjectType()
}))

const getBglxValue = () => {
  const code = getBudgetChangeValue('bglx', 'BGLX')
  if (code) return code
  const name = getBudgetChangeValue('bglxName', 'BGLX_NAME')
  const option = bglxOptions.value.find((item) => item.name === name || item.code === name)
  return option?.code || name || ''
}

const initData = () => {
  formData.bglx = getBglxValue()
  formData.tzsy = getBudgetChangeValue('tzsy', 'TZSY') || ''
  formData.sfcjpsyj = getBudgetChangeValue('sfcjpsyj', 'SFCJPSYJ') || ''
  formData.bgyy = getBudgetChangeValue('bgyy', 'BGYY') || ''
  formData.bgAllInvestTax = getBudgetChangeValue('bgAllInvestTax', 'BG_ALL_INVEST_TAX') || null
  formData.bgAmount = getBudgetChangeValue('bgAmount', 'BG_AMOUNT') || null
  formData.ssnr = getBudgetChangeValue('ssnr', 'SSNR') || ''
  formData.byx = getBudgetChangeValue('byx', 'BYX') || ''
}

const initBglxOptions = async () => {
  try {
    loading.value = true
    const res = await getPublicData('XMYSBG_BGLX')
    if (!res.success) throw new Error(res.msg)
    bglxOptions.value = res.data || []
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const initTzsyOptions = async () => {
  try {
    loading.value = true
    const res = await getPublicData('YSBG_TZSY')
    if (!res.success) throw new Error(res.msg)
    tzsyOptions.value = res.data || []
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const initBudgetChangeData = async () => {
  const xmid = getBudgetChangeXmid()
  const pageType = props.pageType || ''
  const requestKey = `${xmid}_${pageType}_${props.projectChangeMode || ''}`
  if (!xmid || loadedBudgetChangeKey.value === requestKey) return false
  // 创建变更申请单时尚无变更单，不调用任何接口拉取变更信息
  if (props.projectChangeMode === 'create') return false
  try {
    loading.value = true
    const res = await getBgInfo({
      xmid,
      ...(pageType ? { pageType } : {})
    })
    if (!res.success) throw new Error(res.msg)
    budgetChangeData.value = res.data || {}
    loadedBudgetChangeKey.value = requestKey
    return true
  } catch (error) {
    ElMessage.error((error as Error).message)
    return false
  } finally {
    loading.value = false
  }
}

const initAttachmentTypes = async () => {
  const xmlx = getProjectType()
  if (!xmlx) return
  try {
    loading.value = true
    const res = await getFjGroupByXmlx({
      xmlx,
      opType: props.opType
    })
    if (!res.success) throw new Error(res.msg)
    attachmentGroups.value = normalizeAttachmentGroups(res.data || [])
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleUploadAttach = async ({ records, fjId }: any) => {
  const bgid = getBgId()
  if (!bgid) {
    throw new Error('请先保存变更单后再上传附件')
  }
  return uploadYsbgAttach({
    bgid,
    fjId,
    files: records.map((record: any) => record.file).filter(Boolean),
    fileNames: records.map((record: any) => record.name).filter(Boolean)
  })
}

const handleAttachmentGroupChange = (group: any, files: any[] = []) => {
  const groupFjIds = new Set((group.columns || []).map((column: any) => column.fjId).filter(Boolean))
  const otherFiles = attachmentValue.value.filter((item: any) => !groupFjIds.has(item.fjId))
  const currentFiles = files.map((item: any) => normalizeAttachItem(item, item.fjId))
  attachmentValue.value = [...otherFiles, ...currentFiles]
}

const handleAttachmentRemove = (file: any) => {
  const uuid = getAttachmentUuid(file)
  if (uuid && !removedAttachmentUuids.value.includes(uuid)) {
    removedAttachmentUuids.value.push(uuid)
  }
}

const getAttachmentUuids = () => {
  const fileList = [...Object.values(attachmentAllData.value).flat(), ...attachmentValue.value]
  return Array.from(
    new Set(fileList.map((item: any) => getAttachmentUuid(item)).filter((uuid) => uuid && !removedAttachmentUuids.value.includes(uuid)))
  )
}

const getFormData = () => {
  const bgid = getBgId()
  return {
    // 变更id来源于 getBgInfo，创建场景下为空，由后端新建变更单
    ...(bgid ? { bgid } : {}),
    bglx: formData.bglx,
    tzsy: formData.tzsy,
    sfcjpsyj: formData.sfcjpsyj,
    bgyy: formData.bgyy,
    bgAllInvestTax: formData.bgAllInvestTax,
    bgAmount: formData.bgAmount,
    ssnr: formData.ssnr,
    byx: formData.byx,
    uuids: getAttachmentUuids()
  }
}

const handleChange = (val: any) => {
  const { note } = tzsyOptions.value.filter((item: any) => item.code == val)[0]
  formData.sfcjpsyj = note
}

onMounted(async () => {
  await initBglxOptions()
  await initTzsyOptions()
  await initBudgetChangeData()
  initData()
  await initAttachmentTypes()
  hasMounted.value = true
  const refreshed = await initBudgetChangeData()
  if (refreshed) initData()
})

watch([() => getBudgetChangeXmid(), () => props.pageType], async () => {
  if (!hasMounted.value) return
  const refreshed = await initBudgetChangeData()
  if (refreshed) initData()
})

defineExpose({
  getFormData,
  ISCUSTOMCOPONENT,
  formEl: formRef
})
</script>

<style scoped lang="less">
.xmbgxx {
  min-height: 100%;
  padding: 24px 48px;
  box-sizing: border-box;
  background: #fff;

  &__section {
    & + & {
      margin-top: 24px;
    }
  }

  &__section-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f2f5;
  }

  &__section-title {
    position: relative;
    padding-left: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    line-height: 16px;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 15px;
      border-radius: 2px;
      background: var(--el-color-primary, #409eff);
    }
  }

  &__label {
    display: inline-block;
    line-height: 18px;
    vertical-align: middle;
  }

  &__label-nowrap {
    white-space: nowrap;
  }

  :deep(.el-input-number .el-input__inner) {
    text-align: left;
  }

  :deep(.el-textarea__inner) {
    resize: none;
  }

  :deep(.xmbgxx__attach .empty-files) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
