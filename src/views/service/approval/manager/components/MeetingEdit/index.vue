<template>
  <vxe-modal
    resize
    show-zoom
    show-close
    fullscreen
    :loading="loading"
    :destroy-on-close="true"
    @close="closeHandle"
    :title="`联合会审会议${modalProps.title}`"
    v-model="modalVisible"
    position="center"
    width="55%"
    height="910"
  >
    <div class="modal-main">
      <div class="modal-main__actions">
        <el-button v-show="!modalProps.isView" plain type="primary" @click="handleSubmit">保 存</el-button>
        <el-button v-show="modalProps.isView" plain type="primary" @click="viewDetailMsg('PROGRAM', '联合会审会议项目明细')">项目明细</el-button>
        <el-button v-show="modalProps.isView" plain type="primary" @click="viewDetailMsg('EXPERT', '联合会审会议专家明细')">专家信息</el-button>
        <el-button plain @click="closeHandle">关 闭</el-button>
      </div>
      <el-form
        label-position="right"
        label-suffix=":"
        label-width="110px"
        ref="ruleFormRef"
        :rules="rules"
        :disabled="modalProps.isView"
        :model="modalProps.row"
        :hide-required-asterisk="modalProps.isView"
      >
        <div class="form-body">
          <div class="form-main">
            <el-row :gutter="24">
              <el-col :span="24">
                <div class="form-section-title">基本信息</div>
              </el-col>
              <el-col :span="12">
                <el-form-item label="会议名称" prop="meetingName">
                  <el-input disabled clearable maxlength="100" v-model="modalProps.row.meetingName"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="预算来源" prop="ysly">
                  <el-select disabled style="width: 100%" v-model="modalProps.row.ysly">
                    <el-option v-for="item in yslyList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="年度" prop="nd">
                  <el-select @change="changeNdData" style="width: 100%" v-model="modalProps.row.nd">
                    <el-option v-for="item in ndList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="评审批次" prop="pspcId">
                  <DropdownTableSelector
                    ref="pspcRef"
                    :label-value="modalProps.row.pspcName"
                    @update:label-value="(val:string)=>{modalProps.row.pspcName = val}"
                    idField="id"
                    labelField="pspcName"
                    placeholder="请选择评审批次"
                    title="选择评审批次"
                    :search-fields="selectorSearchFields"
                    :table-columns="selectorTableColumns"
                    :api="fetchSelectorData"
                    v-model="modalProps.row.pspcId"
                    @change="handlePspcChange"
                    @confirm="getMeetingNameData"
                  ></DropdownTableSelector>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="专业部门" prop="bmId">
                  <el-select :disabled="!modalProps.isProvinceFinanceBudgetSpecialist" style="width: 100%" v-model="modalProps.row.bmId">
                    <el-option v-for="item in deptList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="会议地点" prop="meetingAddr">
                  <el-input clearable maxlength="126" v-model="modalProps.row.meetingAddr"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="组织人姓名" prop="organizer">
                  <el-input maxlength="11" v-model="modalProps.row.organizer"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="组织人电话" prop="phone">
                  <el-input maxlength="11" v-model="modalProps.row.phone"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="需求申请与提报截止日期" prop="lhhsSkTime">
                  <el-date-picker
                    disabled
                    value-format="YYYY-MM-DD"
                    v-model="modalProps.row.lhhsSkTime"
                    style="width: 100%"
                    type="date"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
          <div class="form-main">
            <el-row :gutter="24">
              <el-col :span="24">
                <div class="form-section-title">线上预审</div>
              </el-col>
              <el-col :span="12">
                <el-form-item label="开始时间" prop="startTime">
                  <el-date-picker
                    disabled
                    @change="changeStartTime"
                    value-format="YYYY-MM-DD"
                    v-model="modalProps.row.startTime"
                    style="width: 100%"
                    type="date"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结束时间" prop="lhhsOneEndTime">
                  <el-date-picker
                    disabled
                    @change="changeEndTime"
                    value-format="YYYY-MM-DD"
                    v-model="modalProps.row.lhhsOneEndTime"
                    style="width: 100%"
                    type="date"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
          <div class="form-main">
            <el-row :gutter="24">
              <el-col :span="24">
                <div class="form-section-title">线下会审</div>
              </el-col>
              <el-col :span="12">
                <el-form-item label="开始时间" prop="lhhsTwoStartTime">
                  <el-date-picker
                    disabled
                    @change="changeStartTime"
                    value-format="YYYY-MM-DD"
                    v-model="modalProps.row.lhhsTwoStartTime"
                    style="width: 100%"
                    type="date"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结束时间" prop="endTime">
                  <el-date-picker
                    disabled
                    @change="changeEndTime"
                    value-format="YYYY-MM-DD"
                    v-model="modalProps.row.endTime"
                    style="width: 100%"
                    type="date"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="评审专业" prop="major">
                  <div class="majorMain">
                    <el-checkbox-group v-model="modalProps.row.major" disabled>
                      <template v-for="item in majorList" :key="item.code">
                        <el-checkbox border :label="item.code">{{ item.name }}</el-checkbox>
                      </template>
                    </el-checkbox-group>
                  </div>
                </el-form-item>
              </el-col>

              <el-col v-if="showReviewTemplate" :span="24">
                <div class="template-panel" v-loading="templateLoading">
                  <div class="template-panel__header">
                    <div class="template-panel__title-wrap">
                      <span class="template-panel__title">附件模板</span>
                      <span class="template-panel__subtitle">{{ currentPspcTypeName }}自动匹配</span>
                    </div>
                    <span v-if="reviewTemplateList.length > 0" class="template-panel__count">{{ reviewTemplateList.length }}份</span>
                  </div>
                  <div class="template-panel__body">
                    <button
                      v-for="item in reviewTemplateList"
                      :key="item.uuid"
                      type="button"
                      class="template-item"
                      @click="handleDownloadTemplate(item)"
                    >
                      <span class="template-item__name" :title="item.attachName">{{ item.attachName }}</span>
                      <span class="template-item__action">下载</span>
                    </button>
                    <div v-if="reviewTemplateList.length === 0" class="template-empty">当前批次类型暂未配置附件模板</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
          <div class="form-upload">
            <div class="form-section-title form-section-title--with-tip">
              <span>附件信息</span>
              <span v-if="currentAttachmentTip" class="form-section-tip" :title="currentAttachmentTip">{{ currentAttachmentTip }}</span>
            </div>
            <div v-if="!modalProps.isView" class="upload-main">
              <span class="attach-type-label">附件类型：</span>
              <el-select
                clearable
                v-model="selectedAttachType"
                placeholder="请选择附件类型"
                class="attach-type-select"
                :disabled="attachTypeList.length === 0"
                @change="handleAttachTypeChange"
              >
                <el-option
                  v-for="item in attachTypeList"
                  :key="getCodeValue(item)"
                  :label="getCodeLabel(item)"
                  :value="getCodeValue(item)"
                ></el-option>
              </el-select>
              <vxe-button size="mini" status="primary" icon="el-icon-upload" @click="handleUploadClick" class="upload-btn pulse">
                文件上传
              </vxe-button>
              <input type="file" ref="fileInput" multiple style="display: none" :accept="acceptedFileTypes" @change="handleFileChange" />
              <vxe-button size="mini" status="danger" icon="el-icon-delete" @click="handleDelete" class="delete-btn pulse">文件删除</vxe-button>
            </div>
            <div class="table">
              <vxe-table
                ref="uploadRef"
                show-overflow
                header-align="center"
                border
                stripe
                :column-config="{
                  resizable: true
                }"
                :checkbox-config="{ trigger: 'row', highlight: true }"
                :row-config="{ isCurrent: true, isHover: true, height: 32 }"
                :data="fileList"
                height="100%"
                class="file-table"
                :row-class-name="rowClassName"
                :loading-config="{ icon: 'el-icon-loading', text: '正在加载文件...' }"
                @checkbox-change="handleUploadFileSelection"
                @checkbox-all="handleUploadFileSelection"
              >
                <vxe-column align="center" type="checkbox" width="60"></vxe-column>
                <vxe-column align="center" type="seq" width="60" title="序号"></vxe-column>
                <vxe-column field="id" title="id" :visible="false"></vxe-column>
                <vxe-column field="uuid" title="uuid" :visible="false"></vxe-column>
                <vxe-column field="attachType" title="附件类型" width="160">
                  <template #default="{ row }">
                    {{ formatAttachType(row.attachType) }}
                  </template>
                </vxe-column>
                <vxe-column field="name" title="文件名称">
                  <template #default="{ row }">
                    <div class="file-name">
                      <i class="file-icon" :class="getFileIcon(row['name'])"></i>
                      <span class="file-text" :title="row['name']">
                        <span
                          class="file-download-link"
                          role="button"
                          tabindex="0"
                          @click.stop="handleDownload(row)"
                          @keydown.enter.prevent="handleDownload(row)"
                          @keydown.space.prevent="handleDownload(row)"
                        >
                          {{ row['name'] }}
                        </span>
                      </span>
                    </div>
                  </template>
                </vxe-column>
              </vxe-table>
            </div>
          </div>
        </div>
      </el-form>
    </div>
  </vxe-modal>
  <ReviewExpertModal ref="reviewExpertModalRef" />
  <ReviewProModal ref="reviewProModalRef" />
</template>

<script setup lang="ts" name="TheesMeetingEdit">
import ReviewExpertModal from '@/views/service/approval/manager/components/reviewModal/ReviewExpertModal.vue'
import ReviewProModal from '@/views/service/approval/manager/components/reviewModal/ReviewProjectModal.vue'
import DropdownTableSelector from '@/components/tableSelect/index'

import { ref, defineExpose, reactive, defineEmits, computed, watch } from 'vue'
import { getDataByParent, getPublicCodesList, getPublicData } from '@/api/common'
import { ElMessage } from 'element-plus'
import { getPageData } from '@/api/service/IhhsMeeting/approval/batch'
import {
  deleteRemindAttach,
  downloadAttach as downloadMeetingAttach,
  getMeetingName,
  uploadRemindAttachWhenCreate,
  uploadRemindAttach
} from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { downloadAttach as downloadTemplateAttach, getTemplateManagerFileList } from '@/api/service/approval/config/templateManager'
import type { TemplateManagerFile, TemplatePspcType } from '@/api/service/approval/config/templateManager'
import { VXETable } from 'vxe-table'
import type { VxeTableInstance } from 'vxe-table'

interface Params {
  [key: string]: any
}

interface CodeOption {
  code?: string | number
  name?: string
  value?: string | number
  label?: string
  [key: string]: any
}

const fileList = ref<any[]>([])
const uploadRef = ref<VxeTableInstance>()
const uploadFileSelection = ref<any[]>([])
const maxFileSize = 104857600
const allowedFileTypes: any[] = []
const fileInput = ref<any>(null)
const loading = ref(false)
const templateLoading = ref(false)
const supportedTemplateTypes: TemplatePspcType[] = ['1', '2']
const ATTACH_TIP_CODE = 'LHHS_PSPC_ATTACH_TIP'
const ATTACH_TYPE_CODE = 'LHHS_ATTACH_TYPE'
const EMERGENCY_PSPC_TYPE = '2'
const APPLICATION_FORM_ATTACH_TYPE = '1'
const defaultAttachmentTipList = [
  {
    code: '1',
    name: '请上传会议通知、专家名单等附件'
  },
  {
    code: '2',
    name: '请上传会议通知、专家名单、年度应急评审批次申请表等附件'
  },
  {
    code: 'DEFAULT',
    name: '请按批次要求上传相关附件'
  }
]
const reviewTemplateList = ref<TemplateManagerFile[]>([])
const templateCache = reactive<Record<string, TemplateManagerFile[]>>({})
const templateRequestId = ref(0)
const selectedPspcType = ref<TemplatePspcType>('')
const selectedPspcTypeName = ref('')
const reviewExpertModalRef = ref<InstanceType<typeof ReviewExpertModal>>()
const pspcRef = ref<InstanceType<typeof DropdownTableSelector>>()
const reviewProModalRef = ref<InstanceType<typeof ReviewProModal>>()
const yslyList = ref<any[]>([])
const deptList = ref<any[]>([])
const ndList = ref<any[]>([])
const attachmentTipList = ref<{ code: string; name: string }[]>([...defaultAttachmentTipList])
const attachTypeList = ref<CodeOption[]>([])
const selectedAttachType = ref('')
const majorList = ref<
  {
    code: string
    name: string
  }[]
>([])
const modalVisible = ref(false)
const modalProps = ref<ModalProps>({
  userInfo: {
    deptId: '',
    deptName: '',
    dwId: '',
    dwName: '',
    roleCode: '',
    spRoleId: '',
    specialorgcode: '',
    roleId: ''
  },
  isProvinceFinanceBudgetSpecialist: false,
  flag: 'ADD',
  isView: false,
  title: '',
  row: {}
})
const rules = reactive({
  meetingCode: [
    {
      required: true,
      message: '请输入会议编号',
      trigger: 'blur'
    }
  ],
  meetingName: [
    {
      required: true,
      message: '请输入会议名称',
      trigger: 'blur'
    }
  ],
  meetingAddr: [
    {
      required: true,
      message: '请输入会议地点',
      trigger: 'blur'
    }
  ],
  organizer: [
    {
      required: true,
      message: '请输入姓名',
      trigger: 'blur'
    }
  ],
  phone: [
    {
      required: true,
      message: '请输入电话',
      trigger: 'blur'
    },
    {
      pattern: /^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-79])|(?:5[0-35-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[1589]))\d{8}$/,
      message: '请输入正确的电话号码'
    }
  ],
  ysly: [
    {
      required: true,
      message: '请选择预算来源',
      trigger: 'change'
    }
  ],
  pspcId: [
    {
      required: true,
      message: '请选择评审批次',
      trigger: 'change'
    }
  ],
  startTime: [
    {
      required: true,
      message: '请输入会议开始时间',
      trigger: 'change'
    }
  ],
  endTime: [
    {
      required: true,
      message: '请输入会议结束时间',
      trigger: 'change'
    }
  ],
  major: [
    {
      required: true,
      message: '请输入专家专业',
      trigger: 'change'
    }
  ]
})

const emit = defineEmits(['clearSelect'])

const getCodeValue = (item: CodeOption) => {
  const value = item?.code ?? item?.value ?? ''
  return value === undefined || value === null ? '' : String(value)
}

const getCodeLabel = (item: CodeOption) => {
  const label = item?.name ?? item?.label ?? getCodeValue(item)
  return label === undefined || label === null ? '' : String(label)
}

const showReviewTemplate = computed(() => supportedTemplateTypes.includes(selectedPspcType.value))
const currentPspcTypeName = computed(() => selectedPspcTypeName.value || '当前批次类型')
const attachmentTipMap = computed(() => {
  const map: Record<string, string> = {}
  attachmentTipList.value.forEach((item) => {
    if (!item) return
    const code = item.code ?? (item as any).value
    if (code === undefined || code === null) return
    const name = item.name ?? (item as any).label ?? ''
    if (name) {
      map[String(code)] = name
    }
  })
  return map
})
const currentAttachmentTip = computed(() => {
  const type = selectedPspcType.value
  if (!type) return ''
  return attachmentTipMap.value[String(type)] || attachmentTipMap.value.DEFAULT || ''
})
const attachTypeMap = computed(() => {
  const map: Record<string, string> = {}
  attachTypeList.value.forEach((item) => {
    const value = getCodeValue(item)
    if (!value) return
    map[value] = getCodeLabel(item)
  })
  return map
})
const formatAttachType = (attachType: string | number | undefined | null) => {
  if (attachType === undefined || attachType === null || attachType === '') return '-'
  const value = String(attachType)
  return attachTypeMap.value[value] || value
}
const getUploadTableData = () => {
  if (!uploadRef.value) return []
  const { fullData } = uploadRef.value.getTableData()
  return Array.isArray(fullData) ? fullData : []
}
const hasApplicationFormAttach = (records: any[]) => {
  return records.some((item) => String(item.attachType ?? item.fjType ?? '') === APPLICATION_FORM_ATTACH_TYPE)
}

const curYear = new Date().getFullYear().toString()

const selectorTableColumns = [
  {
    field: 'statusName',
    width: 120,
    title: '状态',
    slots: { default: 'statusSlot' }
  },
  {
    field: 'pspcCode',
    width: 160,
    title: '批次编号'
  },
  {
    field: 'pspcName',
    width: 220,
    title: '批次名称'
  },
  {
    field: 'pspcTypeName',
    width: 140,
    title: '批次类型'
  },
  {
    field: 'nd',
    width: 140,
    title: '年度'
  },
  {
    field: 'lhhsSkTime',
    width: 180,
    title: '需求申请与提报阶段截止时间'
  },
  {
    field: 'lhhsOneStartTime',
    title: '线上预审开始日期',
    width: 160
  },
  {
    field: 'lhhsOneEndTime',
    width: 160,
    title: '线上预审结束日期'
  },
  {
    field: 'lhhsTwoStartTime',
    width: 160,
    title: '线下会审开始日期'
  },
  {
    field: 'lhhsTwoEndTime',
    width: 160,
    title: '线下会审结束日期'
  },
  {
    field: 'lhhsThreeStartTime',
    width: 180,
    title: '出具可研评审意见开始日期'
  },
  {
    field: 'lhhsThreeEndTime',
    width: 180,
    title: '出具可研评审意见结束日期'
  },
  {
    field: 'lhhsFourStartTime',
    width: 180,
    title: '专业批复合规性审查开始日期'
  },
  {
    field: 'lhhsFourEndTime',
    width: 180,
    title: '专业批复合规性审查结束日期'
  }
]

const selectorSearchFields = [
  {
    field: 'pspcCode',
    label: '批次编号'
  },
  {
    field: 'pspcName',
    label: '批次名称'
  },
  {
    field: 'nd',
    label: '年度',
    options: [],
    disabled: true,
    type: 'select',
    defaultValue: modalProps.value.row.nd || curYear
  }
]

const resetTemplateState = () => {
  selectedPspcType.value = ''
  selectedPspcTypeName.value = ''
  reviewTemplateList.value = []
  templateLoading.value = false
}

const setTemplateContext = (row: Record<string, any>) => {
  const pspcType = row?.pspcType ?? row?.pspcTypeCode ?? ''
  selectedPspcType.value = pspcType ? String(pspcType) : ''
  selectedPspcTypeName.value = row?.pspcTypeName || ''
}

const loadReviewTemplateList = async (pspcType: TemplatePspcType) => {
  if (!supportedTemplateTypes.includes(pspcType)) {
    reviewTemplateList.value = []
    return
  }

  if (templateCache[pspcType]) {
    reviewTemplateList.value = templateCache[pspcType]
    return
  }

  const currentRequestId = ++templateRequestId.value
  templateLoading.value = true
  try {
    const res = await getTemplateManagerFileList({
      pspcType
    })
    if (!res.success) throw new Error(res.msg)

    const templateList = Array.isArray(res.data) ? res.data : []
    templateCache[pspcType] = templateList

    if (currentRequestId === templateRequestId.value && selectedPspcType.value === pspcType) {
      reviewTemplateList.value = templateList
    }
  } catch (error) {
    templateCache[pspcType] = []
    if (currentRequestId === templateRequestId.value && selectedPspcType.value === pspcType) {
      reviewTemplateList.value = []
    }
    ElMessage.error((error as Error).message)
  } finally {
    if (currentRequestId === templateRequestId.value) {
      templateLoading.value = false
    }
  }
}

const handleDownloadTemplate = async (file: TemplateManagerFile) => {
  try {
    const res = await downloadTemplateAttach({
      uuid: file.uuid
    })
    if (!res.success) throw new Error(res.msg || '附件下载失败')
    if (!res.data) throw new Error('附件下载地址为空')

    const link = document.createElement('a')
    link.href = res.data
    link.download = file.attachName
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const handlePspcChange = (payload: Event | { id?: string | number }) => {
  const id = payload && 'id' in payload ? payload.id : ''
  if (!id) {
    resetTemplateState()
  }
}

const getMeetingNameData = async ({ id, ...reset }: { id: string; [key: string]: any }) => {
  loading.value = true
  try {
    // 暂时取消
    modalProps.value.row.lhhsSkTime = reset['lhhsSkTime'] || ''
    modalProps.value.row.startTime = reset['lhhsOneStartTime'] || ''
    modalProps.value.row.lhhsOneEndTime = reset['lhhsOneEndTime'] || ''
    modalProps.value.row.lhhsTwoStartTime = reset['lhhsTwoStartTime'] || ''
    modalProps.value.row.endTime = reset['lhhsTwoEndTime'] || ''
    setTemplateContext(reset)
    const res = await getMeetingName({
      bmId: modalProps.value.userInfo.deptId || '',
      pspcId: id,
      meetingId: modalProps.value.row['meetingId'] || ''
    })
    if (!res.success) throw new Error(res.msg)
    modalProps.value.row['meetingName'] = res.data['meetingName'] || ''
    modalProps.value.row['pch'] = res.data['pch'] || ''
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

watch([selectedPspcType, modalVisible], ([pspcType, visible]) => {
  if (!visible) {
    reviewTemplateList.value = []
    templateLoading.value = false
    return
  }
  if (!pspcType) {
    reviewTemplateList.value = []
    templateLoading.value = false
    return
  }
  void loadReviewTemplateList(pspcType)
})

const viewDetailMsg = (pageFlag: string, title: string) => {
  const btnPermissions = ['EXPORT']
  const row = modalProps.value.row
  const params = {
    pageFlag: pageFlag,
    title,
    isView: row['status'] === '00',
    row: { ...row },
    btnPermissions: btnPermissions
  }
  if (pageFlag === 'PROGRAM') {
    reviewProModalRef.value?.acceptParams(params)
  } else {
    reviewExpertModalRef.value?.acceptParams(params)
  }
}

const getDepteData = async () => {
  try {
    const res = await getDataByParent('QMYS_ZZJG')
    if (!res.success) throw new Error(res.msg)
    if (res.data) {
      deptList.value = res.data
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
    deptList.value = []
  }
}

interface ModalProps {
  userInfo: {
    deptId: string
    deptName: string
    dwId: string
    dwName: string
    roleCode: string
    spRoleId: string
    specialorgcode: string
    roleId: string
  }
  flag: 'EDIT' | 'VIEW' | 'ADD'
  title: string
  isView: boolean
  row: Partial<any>
  api?: (params: any) => Promise<any>
  searchAttachData?: (params: any) => Promise<any>
  getTableList?: () => void
  isProvinceFinanceBudgetSpecialist: boolean
}

const handleSubmit = async () => {
  await ruleFormRef.value.validate()
  try {
    const fullData = getUploadTableData()
    if (selectedPspcType.value === EMERGENCY_PSPC_TYPE && !hasApplicationFormAttach(fullData)) {
      ElMessage.warning('应急批次请上传申请表')
      return
    }

    loading.value = true
    const uuids = fullData.map((item) => item.uuid)
    const row: any = { ...modalProps.value.row }
    const major = row['major']
    row['major'] = Array.isArray(major) ? major.join(',') : major ? String(major) : ''
    const res = await modalProps.value.api!({
      uuids: uuids,
      ...row
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success(`${modalProps.value.title}成功!`)
    loading.value = false
    modalProps.value.getTableList?.()
    closeHandle()
    emit('clearSelect')
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const changeStartTime = (val: string) => {
  if (val && modalProps.value.row?.endTime) {
    const startTime = new Date(val).getTime()
    const endTime = new Date(modalProps.value.row?.endTime).getTime()
    if (startTime > endTime) {
      modalProps.value.row!.endTime = val
    }
  }
}
const changeEndTime = (val: string) => {
  if (!val) {
    modalProps.value.row!.startTime = ''
    return
  }
  if (val && modalProps.value.row?.startTime) {
    const startTime = new Date(modalProps.value.row?.startTime).getTime()
    const endTime = new Date(val).getTime()
    if (startTime > endTime) {
      modalProps.value.row!.startTime = val
    }
  }
}

const fetchSelectorData = (_params: any) => {
  return getPageData({
    ..._params,
    bmId: modalProps.value.userInfo.deptId,
    dwId: modalProps.value.userInfo.dwId,
    roleCode: modalProps.value.userInfo.roleCode,
    roleId: modalProps.value.userInfo.roleId
  })
}

const initParams = async () => {
  try {
    const baseCodes = ['SJTC_LHHS_PSZY', 'LHHS_COM', 'ZLYS_XMJHSSND']
    const res = await getPublicCodesList({
      codes: [...baseCodes, ATTACH_TIP_CODE]
    })
    const dataRes = !res.success
      ? await getPublicCodesList({
          codes: baseCodes
        })
      : res
    if (!dataRes.success) {
      throw new Error(dataRes.msg || res.msg)
    }
    majorList.value = dataRes.data?.[0]?.codes || []
    if (modalProps.value.flag === 'ADD') {
      const currentMajor = modalProps.value.row?.['major']
      const shouldInitMajor = !Array.isArray(currentMajor) || currentMajor.length === 0
      if (shouldInitMajor) {
        modalProps.value.row['major'] = majorList.value.map((item: any) => item.code)
      }
    }
    yslyList.value = dataRes.data?.[1]?.codes || []
    const ndCodes = dataRes.data?.[2]?.codes || []
    ndList.value = ndCodes
    selectorSearchFields[2].options = ndCodes.map((item: any) => ({
      value: item.code,
      label: item.name
    }))
    const tipCodes = res.success ? res.data?.[3]?.codes || [] : []
    attachmentTipList.value = tipCodes.length > 0 ? tipCodes : [...defaultAttachmentTipList]

    const attachTypeRes = await getPublicData(ATTACH_TYPE_CODE)
    if (!attachTypeRes.success) {
      throw new Error(attachTypeRes.msg)
    }
    attachTypeList.value = Array.isArray(attachTypeRes.data) ? attachTypeRes.data : []
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

const acceptedFileTypes = computed(() => {
  return allowedFileTypes.length > 0 ? allowedFileTypes.join(',') : undefined
})

const handleUploadClick = () => {
  if (!selectedAttachType.value) {
    ElMessage.warning('请选择附件类型')
    return
  }
  if (fileInput.value) fileInput.value.click()
}

const handleAttachTypeChange = () => {
  if (modalProps.value.row['meetingId']) {
    searchData()
  }
}

const acceptParams = (params: ModalProps) => {
  getDepteData()
  modalProps.value = {
    ...modalProps.value,
    ...params
  }
  setTemplateContext(modalProps.value.row || {})
  selectorSearchFields[2].defaultValue = modalProps.value.row?.nd || curYear
  initParams()
  searchData()
  modalVisible.value = true
}

const searchData = async () => {
  const search = modalProps.value?.searchAttachData
  if (!search) return
  loading.value = true
  try {
    const meetingId = modalProps.value.row['meetingId']
    if (!meetingId) return
    uploadFileSelection.value.length = 0
    const searchDataRes = await search({
      meetingId: meetingId,
      attachType: selectedAttachType.value
    })
    if (!searchDataRes.success) throw new Error(searchDataRes.msg)
    fileList.value = searchDataRes.data.map((attachList: any) => {
      return {
        name: attachList.attachName,
        meetingId: attachList.meetingId,
        id: attachList.id,
        uuid: attachList.uuid,
        fjType: attachList.fjType,
        attachType: attachList.attachType ?? attachList.fjType ?? '',
        isNew: false
      }
    })
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const changeNdData = (nd: string) => {
  selectorSearchFields[2].defaultValue = nd
  pspcRef.value?.handleClear()
  modalProps.value.row.meetingName = ''
  resetTemplateState()
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const rawFiles = input?.files ? Array.from(input.files) : []
  if (!rawFiles.length) return

  loading.value = true
  try {
    const rejectedFiles = {
      type: [] as string[],
      size: [] as string[]
    }

    const createTime = new Date().toLocaleTimeString()
    const newFiles = rawFiles
      .map((file) => {
        const fileExtension = '.' + (file.name.split('.').pop() || '').toLowerCase()
        const isValidType =
          allowedFileTypes.length === 0 || allowedFileTypes.includes(fileExtension) || allowedFileTypes.includes(fileExtension.substring(1))
        const isValidSize = file.size <= maxFileSize
        if (!isValidType) {
          rejectedFiles.type.push(file.name)
          return null
        }
        if (!isValidSize) {
          rejectedFiles.size.push(file.name)
          return null
        }
        return {
          name: file.name,
          size: file.size,
          file,
          createTime,
          isNew: true
        }
      })
      .filter(Boolean) as Array<{ name: string; size: number; file: File; createTime: string; isNew: true }>

    if (rejectedFiles.type.length > 0) {
      VXETable.modal.message({
        content: `文件类型不符合要求:${rejectedFiles.type.join(', ')}`,
        status: 'warning'
      })
    }
    if (rejectedFiles.size.length > 0) {
      VXETable.modal.message({
        content: `文件大小超过限制:${rejectedFiles.size.join(', ')}`,
        status: 'warning'
      })
    }
    if (newFiles.length === 0) return

    const attachNames = newFiles.map((item) => item.name)
    const data = new FormData()
    newFiles.forEach((item) => data.append('files', item.file))

    const meetingId = modalProps.value.row['meetingId']
    const res = meetingId
      ? await uploadRemindAttach({
          excelFormData: data,
          attachNames,
          attachType: selectedAttachType.value,
          meetingIds: meetingId
        })
      : await uploadRemindAttachWhenCreate({
          excelFormData: data,
          attachNames,
          attachType: selectedAttachType.value
        })
    if (!res.success) throw new Error(res.msg)

    const uuids = Array.isArray(res.data) ? res.data : []
    const records = newFiles.map((file, index) => ({
      name: file.name,
      size: file.size,
      file: file.file,
      createTime: file.createTime,
      uuid: uuids[index],
      attachType: selectedAttachType.value,
      isNew: true
    }))

    uploadRef.value?.insert(records)
    ElMessage.success('上传成功!')
  } catch (error) {
    ElMessage.error((error as Error).message || '上传失败!')
  } finally {
    loading.value = false
    if (input) input.value = ''
  }
}

const handleUploadFileSelection = ({ records }: any) => {
  uploadFileSelection.value = records
}

const getFileIcon = (fileName: any) => {
  const extension = fileName.split('.').pop().toLowerCase()
  const iconMap: any = {
    pdf: 'el-icon-document-copy',
    doc: 'el-icon-document',
    docx: 'el-icon-document',
    xls: 'el-icon-tickets',
    xlsx: 'el-icon-tickets',
    txt: 'el-icon-document',
    jpg: 'el-icon-picture',
    jpeg: 'el-icon-picture',
    png: 'el-icon-picture',
    gif: 'el-icon-picture'
  }
  return iconMap[extension] || 'el-icon-document'
}
const rowClassName = ({ row }: any) => {
  return row.isNew ? 'row-new' : ''
}

const handleDelete = async () => {
  if (uploadFileSelection.value && uploadFileSelection.value.length === 0) {
    VXETable.modal.message({
      content: `请至少选择一条数据进行删除操作!`,
      status: 'warning'
    })
    return
  }
  const type = await VXETable.modal.confirm('确认是否删除?', '提示', {
    confirmButtonText: '是',
    cancelButtonText: '否'
  })
  if (type !== 'confirm') return
  const $table = uploadRef.value
  if (!$table) return
  loading.value = true
  try {
    const { rows } = await $table.removeCheckboxRow()
    const result = rows.filter((item) => item.id)
    if (result.length > 0) {
      const ids = result.map((item) => item.id)
      const uuids = result
        .map((item) => item.uuid)
        .filter(Boolean)
        .join(',')
      const res = await deleteRemindAttach({
        ids,
        uuid: uuids
      })
      if (!res.success) throw new Error(res.msg)
    }
    VXETable.modal.message({ content: '文件已删除', status: 'success', duration: 1500 })
  } catch (error) {
    ElMessage.error((error as Error).message || '删除失败!')
  } finally {
    loading.value = false
  }
}

const handleDownload = async (row: any) => {
  loading.value = true
  try {
    const res = await downloadMeetingAttach({
      uuid: row.uuid
    })
    if (!res.success) throw new Error(res.msg || '附件下载失败!')
    if (!res.data) throw new Error('附件下载地址为空!')

    const link = document.createElement('a')
    link.href = res.data
    link.download = row.name || '附件下载'
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const closeHandle = () => {
  fileList.value = []
  uploadFileSelection.value = []
  selectedAttachType.value = ''
  resetTemplateState()
  modalVisible.value = false
}

const ruleFormRef = ref()

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.modal-main__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  margin-bottom: 10px;
}
</style>
