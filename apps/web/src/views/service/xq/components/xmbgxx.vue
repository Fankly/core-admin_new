<template>
  <div class="xmbgxx" v-loading="loading">
    <template v-if="isViewMode">
      <div v-if="historyBudgetChangeData.length" class="xmbgxx__history">
        <div class="xmbgxx__history-heading">
          <div>
            <h3>项目预算变更信息</h3>
            <p>共 {{ historyBudgetChangeData.length }} 条变更记录</p>
          </div>
        </div>

        <details v-for="(record, index) in historyBudgetChangeData" :key="record.bgid || `${record.xmid}-${index}`" class="xmbgxx__record" open>
          <summary class="xmbgxx__record-header">
            <i class="el-icon-arrow-right xmbgxx__record-arrow" aria-hidden="true"></i>
            <span class="xmbgxx__record-title">变更记录 {{ index + 1 }}</span>
            <span class="xmbgxx__record-type">{{ getBglxDisplay(record) }}</span>
          </summary>

          <section class="xmbgxx__section">
            <div class="xmbgxx__section-header">
              <span class="xmbgxx__section-title">变更信息</span>
            </div>
            <el-form class="xmbgxx__form" disabled label-position="right" label-width="260px" label-suffix="：">
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="变更类型">
                    <el-select :model-value="getBglxDisplay(record)" style="width: 100%">
                      <el-option :label="getBglxDisplay(record)" :value="getBglxDisplay(record)"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="变更原因说明">
                    <el-input :model-value="getRecordDisplay(record, ['bgyy', 'BGYY'])" type="textarea" resize="none" :rows="1"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="调整事由">
                    <el-select :model-value="getAdjustmentReasonDisplay(record)" style="width: 100%">
                      <el-option :label="getAdjustmentReasonDisplay(record)" :value="getAdjustmentReasonDisplay(record)"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="是否出具评审意见">
                    <el-select :model-value="getReviewOpinionDisplay(record)" style="width: 100%">
                      <el-option :label="getReviewOpinionDisplay(record)" :value="getReviewOpinionDisplay(record)"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item>
                    <template #label>
                      <span class="xmbgxx__label xmbgxx__label-nowrap">变更后申报金额（万元）（含税）</span>
                    </template>
                    <el-input :model-value="formatAmount(getRecordValue(record, ['bgAllInvestTax', 'BG_ALL_INVEST_TAX']))"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item>
                    <template #label>
                      <span class="xmbgxx__label xmbgxx__label-nowrap">变更后申报金额(万元)(不含税)</span>
                    </template>
                    <el-input :model-value="formatAmount(getRecordValue(record, ['bgAmount', 'BG_AMOUNT']))"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item>
                    <template #label>
                      <span class="xmbgxx__label xmbgxx__label-nowrap">变更后当年预算不含税(万元)</span>
                    </template>
                    <el-input :model-value="formatAmount(getRecordValue(record, ['bgDnys', 'BG_DNYS']))"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="变更后项目实施内容">
                    <el-input :model-value="getRecordDisplay(record, ['ssnr', 'SSNR'])" type="textarea" resize="none" :rows="4"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="变更后必要性">
                    <el-input :model-value="getRecordDisplay(record, ['byx', 'BYX'])" type="textarea" resize="none" :rows="4"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </section>

          <section v-if="historyAttachmentGroups.length" class="xmbgxx__section xmbgxx__section--attach">
            <DynamicUploadGroup
              v-for="group in getHistoryAttachmentGroups()"
              :key="`${record.bgid || index}-${group.key}`"
              class="xmbgxx__attach"
              :title="group.label"
              :columns="group.columns"
              :allData="getHistoryAttachmentData(record)"
              :selectData="uploadSelectData"
              disabled
              :show-delete="false"
              :show-actions="true"
              table-height="200px"
            />
          </section>
        </details>
      </div>
      <el-empty v-else-if="!loading" class="xmbgxx__empty" description="暂无项目预算变更信息" />
    </template>

    <template v-else>
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
              <el-form-item :rules="[{ required: true, message: '请输入变更后申报金额（万元）（含税）' }]">
                <template #label>
                  <span class="xmbgxx__label xmbgxx__label-nowrap">变更后申报金额（万元）（含税）</span>
                </template>
                <ReNumberInput v-model="formData.bgAllInvestTax" :precision="6" placeholder="请输入变更后申报金额（万元）（含税）" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="bgAmount" :rules="[{ required: true, message: '请输入变更后申报金额(万元)(不含税)' }]">
                <template #label>
                  <span class="xmbgxx__label xmbgxx__label-nowrap">变更后申报金额(万元)(不含税)</span>
                </template>
                <ReNumberInput v-model="formData.bgAmount" :precision="6" placeholder="请输入变更后申报金额(万元)(不含税)" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="bgDnys" :rules="[{ required: true, message: '请输入变更后当年预算不含税(万元)' }]">
                <template #label>
                  <span class="xmbgxx__label xmbgxx__label-nowrap">变更后当年预算不含税(万元)</span>
                </template>
                <ReNumberInput v-model="formData.bgDnys" :precision="6" placeholder="请输入变更后当年预算不含税(万元)" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="变更后项目实施内容" prop="ssnr" :rules="[{ required: true, message: '请输入变更后项目实施内容' }]">
                <el-input
                  v-model="formData.ssnr"
                  type="textarea"
                  resize="none"
                  :rows="4"
                  maxlength="1000"
                  show-word-limit
                  placeholder="请输入变更后项目实施内容"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="变更后必要性" prop="byx" :rules="[{ required: true, message: '请输入变更后必要性说明' }]">
                <el-input
                  v-model="formData.byx"
                  type="textarea"
                  resize="none"
                  :rows="4"
                  maxlength="1000"
                  show-word-limit
                  placeholder="请输入变更后必要性说明"
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
          :disabled="group.disabled"
          :show-delete="!group.disabled"
          :show-actions="true"
          :local-remove-only="true"
          local-remove-success-message="已移除，保存后生效"
          :upload-request="handleUploadAttach"
          table-height="200px"
          @remove="handleAttachmentRemove"
          @change="(files: any[]) => handleAttachmentGroupChange(group, files)"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "xmbgxx" })
import { getPublicData } from '@/api/common'
import { getBgInfo, getFjGroupByXmlx, getHisBgInfo, uploadYsbgAttach } from '@/api/service/budget'
import DynamicUploadGroup from '@/components/DynamicForm/components/DynamicUploadGroup.vue'
import ReNumberInput from '@/components/ReNumberInput'
import Decimal from 'decimal.js'
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
const historyBudgetChangeData = ref<any[]>([])
const loadedBudgetChangeKey = ref('')
const hasMounted = ref(false)

const formData = reactive({
  bglx: '',
  tzsy: '',
  sfcjpsyj: '',
  bgyy: '',
  bgAllInvestTax: null as number | string | null,
  bgAmount: null as number | string | null,
  bgDnys: null as number | string | null,
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
const getRecordValue = (record: any, keys: string[]) => getObjectValue(record || {}, keys)

const getRecordDisplay = (record: any, keys: string[]) => {
  const value = getRecordValue(record, keys)
  return value === '' ? '-' : String(value)
}

const formatAmount = (value: any) => {
  if (value === '' || value === null || value === undefined) return '-'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return String(value)
  return amount.toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}

const getBglxDisplay = (record: any) => {
  const name = getRecordValue(record, ['bglxName', 'BGLX_NAME'])
  if (name) return String(name)
  const code = getRecordValue(record, ['bglx', 'BGLX'])
  return bglxOptions.value.find((item) => String(item.code) === String(code))?.name || code || '未配置变更类型'
}

const getAdjustmentReasonDisplay = (record: any) => {
  const name = getRecordValue(record, ['tzsyName', 'TZSY_NAME'])
  if (name) return String(name)
  const code = getRecordValue(record, ['tzsy', 'TZSY'])
  return tzsyOptions.value.find((item) => String(item.code) === String(code))?.name || code || '-'
}

const getReviewOpinionDisplay = (record: any) => {
  const name = getRecordValue(record, ['sfcjpsyjName', 'SFCJPSYJ_NAME'])
  if (name) return String(name)
  const value = String(getRecordValue(record, ['sfcjpsyj', 'SFCJPSYJ']))
  return sfcjpsyjOptions.find((item) => item.code === value)?.name || value || '-'
}

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

const getHistoryAttachmentData = (record: any) => {
  const attaches = getRecordValue(record, ['attaches', 'ATTACHES'])
  if (!attaches || typeof attaches !== 'object' || Array.isArray(attaches)) return {}
  return Object.keys(attaches).reduce((result: Record<string, any[]>, fjId) => {
    result[fjId] = toArray(attaches[fjId]).map((item: any) => normalizeAttachItem(item, fjId))
    return result
  }, {})
}

const historyAttachmentGroups = computed(() => {
  if (attachmentGroups.value.length) return attachmentGroups.value
  const fjIds = new Set<string>()
  historyBudgetChangeData.value.forEach((record) => {
    Object.keys(getHistoryAttachmentData(record)).forEach((fjId) => fjIds.add(fjId))
  })
  if (!fjIds.size) return []
  return [
    {
      key: 'history-attachments',
      label: '变更附件',
      columns: Array.from(fjIds).map((fjId) => ({ fjId, label: '附件' }))
    }
  ]
})

const getHistoryAttachmentGroups = () => {
  return historyAttachmentGroups.value
}

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
  formData.bgDnys = getBudgetChangeValue('bgDnys', 'BG_DNYS') || null
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
    budgetChangeData.value = {}
    historyBudgetChangeData.value = []
    const res = isViewMode.value
      ? await getHisBgInfo({ xmid, pageType })
      : await getBgInfo({
          xmid,
          ...(pageType ? { pageType } : {})
        })
    if (!res.success) throw new Error(res.msg)
    if (isViewMode.value) {
      if (!Array.isArray(res.data)) throw new Error('项目预算变更信息返回格式异常')
      historyBudgetChangeData.value = res.data
    } else {
      budgetChangeData.value = res.data || {}
    }
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
    bgDnys: formData.bgDnys,
    ssnr: formData.ssnr,
    byx: formData.byx,
    uuids: getAttachmentUuids()
  }
}

// 变更前金额取自项目行数据（项目总预算不含税 amount / 当年预算不含税 dnys）
const getOriginalAmount = (...keys: string[]) => new Decimal(getObjectValue(props.selectData, keys) || getBudgetChangeValue(...keys) || 0)

// 本年续建项目：项目性质为续建
const isContinuationProject = () => String(getObjectValue(props.selectData, ['xmxzName', 'xmxz', 'XMXZ']) || '').includes('续建')

// 保存前金额校验，返回错误信息，通过时返回空串
const validateBudgetAmount = (): string => {
  if (isViewMode.value) return ''
  const bgAmount = new Decimal(formData.bgAmount ?? 0)
  const bgDnys = new Decimal(formData.bgDnys ?? 0)
  const amount = getOriginalAmount('amount', 'AMOUNT')
  const dnys = getOriginalAmount('dnys', 'DNYS')
  if (bgAmount.lessThan(amount) || bgDnys.lessThan(dnys)) {
    return '项目规模、年度预算调减，请通过年度预算调整功能处理!'
  }
  if (isContinuationProject()) {
    return ''
  }
  if (!bgAmount.equals(bgDnys)) {
    return '需满足：变更后申报金额(万元)(不含税) = 变更后当年预算不含税(万元)!'
  }
  return ''
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

watch([() => getBudgetChangeXmid(), () => props.pageType, isViewMode], async () => {
  if (!hasMounted.value) return
  const refreshed = await initBudgetChangeData()
  if (refreshed) initData()
})

defineExpose({
  getFormData,
  validateBudgetAmount,
  ISCUSTOMCOPONENT,
  formEl: formRef
})
</script>

<style scoped lang="less">
.xmbgxx {
  min-height: 100%;
  padding: 20px 32px 32px;
  box-sizing: border-box;
  background: #fff;
  color: #475569;

  &__history-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;

    h3,
    p {
      margin: 0;
    }

    h3 {
      color: #1e293b;
      font-size: 14px;
      font-weight: 600;
      line-height: 22px;
    }

    p {
      margin-top: 2px;
      color: #64748b;
      font-size: 12px;
      line-height: 18px;
    }
  }

  &__record {
    margin-top: 16px;
    padding: 16px 20px 20px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__record-header {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 32px;
    border-radius: 6px;
    list-style: none;
    cursor: pointer;

    &::-webkit-details-marker {
      display: none;
    }

    &:hover {
      background: #f2f9f8;
    }

    &:focus-visible {
      outline: 2px solid #00706b;
      outline-offset: 2px;
    }
  }

  &__record[open] > &__record-header {
    margin-bottom: 20px;
  }

  &__record-arrow {
    flex-shrink: 0;
    color: #00706b;
    font-size: 14px;
  }

  &__record[open] > &__record-header &__record-arrow {
    transform: rotate(90deg);
  }

  &__record-title {
    color: #1e293b;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
  }

  &__record-type {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 2px 8px;
    border: 1px solid #b8ddd9;
    border-radius: 6px;
    background: #f2f9f8;
    color: #00706b;
    font-size: 12px;
    line-height: 18px;
  }

  &__empty {
    min-height: 360px;
  }

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
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    line-height: 16px;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 15px;
      border-radius: 6px;
      background: #00706b;
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

  :deep(.el-textarea__inner) {
    resize: none;
  }

  :deep(.xmbgxx__attach .empty-files) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.xmbgxx__attach + .xmbgxx__attach) {
    margin-top: 12px;
  }
}

@media (max-width: 1280px) {
  .xmbgxx {
    padding-right: 20px;
    padding-left: 20px;
  }
}
</style>
