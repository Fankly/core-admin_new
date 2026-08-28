<template>
  <vxe-modal
    :loading="loading"
    :destroy-on-close="true"
    @close="closeHandle"
    :title="`联合会审会议${modalProps.title}`"
    v-model="modalVisible"
    position="center"
    width="800"
    height="550"
  >
    <div class="modal-main">
      <el-form
        label-suffix=" : "
        label-position="right"
        ref="ruleFormRef"
        label-width="120px"
        :rules="rules"
        :disabled="modalProps.isView"
        :model="modalProps.row"
        :hide-required-asterisk="modalProps.isView"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="会议编号" prop="meetingCode">
              <el-input :disabled="true" v-model="modalProps.row.meetingCode"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="会议名称" prop="meetingName">
              <el-input maxlength="62" v-model="modalProps.row.meetingName"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="会议地点" prop="meetingAddr">
              <el-input maxlength="126" v-model="modalProps.row.meetingAddr"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创建部门" prop="bmName">
              <el-input :disabled="true" v-model="modalProps.row.bmName"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组织人电话" prop="phone">
              <el-input maxlength="11" v-model="modalProps.row.phone"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会议开始日期" prop="startTime">
              <el-date-picker
                @change="changeStartTime"
                value-format="YYYY-MM-DD"
                v-model="modalProps.row.startTime"
                style="width: 100%"
                type="date"
              ></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会议结束日期" prop="endTime">
              <el-date-picker
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
        </el-row>
      </el-form>
      <div class="operation" style="text-align: center">
        <el-button v-show="!modalProps.isView" plain type="primary" @click="handleSubmit">保 存</el-button>
        <el-button v-show="modalProps.isView" plain type="primary" @click="viewDetailMsg('PROGRAM', '联合会审会议项目明细')">项目明细</el-button>
        <el-button v-show="modalProps.isView" plain type="primary" @click="viewDetailMsg('EXPERT', '联合会审会议专家明细')">专家信息</el-button>
        <el-button plain type="primary" @click="closeHandle">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
  <ReviewExpertModal ref="reviewExpertModalRef" />
  <ReviewProModal ref="reviewProModalRef" />
</template>

<script setup lang="ts" name="TheesMeetingEdit">
import ReviewExpertModal from '@/views/service/approval/cityLhhsMeeting/components/ReViewModal/reviewExpertModal.vue'
import ReviewProModal from '@/views/service/approval/cityLhhsMeeting/components/ReViewModal/reviewProModal.vue'

import { ref, defineExpose, reactive, defineEmits } from 'vue'
import { getPublicCodesList } from '@/api/common'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const reviewExpertModalRef = ref<InstanceType<typeof ReviewExpertModal>>()
const reviewProModalRef = ref<InstanceType<typeof ReviewProModal>>()
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
  startTime: [
    {
      required: true,
      message: '请输入会议开始日期',
      trigger: 'change'
    }
  ],
  endTime: [
    {
      required: true,
      message: '请输入会议结束日期',
      trigger: 'change'
    }
  ],
  major: [
    {
      type: 'array',
      required: true,
      message: '请至少选择一个评审专业',
      trigger: 'change'
    }
  ]
})

const emit = defineEmits(['clearSelect'])

const viewDetailMsg = (pageFlag: 'PROGRAM' | 'EXPERT', title: string) => {
  const row = modalProps.value.row
  const params = {
    pageFlag,
    title,
    isView: row['status'] === '00',
    row: { ...row },
    btnPermissions: ['EXPORT'],
    bmId: modalProps.value.bmId,
    dwId: modalProps.value.dwId,
    roleCode: modalProps.value.roleCode,
    roleId: modalProps.value.roleId
  }
  if (pageFlag === 'PROGRAM') {
    reviewProModalRef.value?.acceptParams(params)
  } else {
    reviewExpertModalRef.value?.acceptParams(params)
  }
}

interface ModalProps {
  title: string
  isView: boolean
  row: Partial<any>
  api?: (params: any) => Promise<any>
  getTableList?: () => void
  bmId?: string
  roleId?: string
  roleCode?: string
  dwId?: string
}

const majorList = ref<
  {
    code: string
    name: string
  }[]
>([])
const modalVisible = ref(false)
const modalProps = ref<ModalProps>({
  isView: false,
  title: '',
  row: {},
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: ''
})

const handleSubmit = () => {
  ruleFormRef.value.validate(async (valid: any) => {
    if (!valid) return
    try {
      loading.value = true
      const row: any = { ...modalProps.value.row }
      row['major'] = Array.isArray(row['major']) ? row['major'].join(',') : row['major']
      const res = await modalProps.value.api!(row)
      if (!res.success) throw new Error(res.msg)
      ElMessage.success(`${modalProps.value.title}成功!`)
      loading.value = false
      modalProps.value.getTableList?.()
      modalVisible.value = false
      emit('clearSelect')
    } catch (e: any) {
      ElMessage.error(e.toString())
      console.error(e)
    } finally {
      loading.value = false
    }
  })
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

const initParams = async () => {
  try {
    const res = await getPublicCodesList({
      codes: ['SJTC_LHHS_PSZY']
    })
    if (!res.success) {
      throw new Error(res.msg)
    }
    majorList.value = res.data?.[0]?.codes || []
    if (modalProps.value.title === '创建') {
      const currentMajor = modalProps.value.row?.['major']
      const shouldInitMajor = !Array.isArray(currentMajor) || currentMajor.length === 0
      if (shouldInitMajor) {
        modalProps.value.row['major'] = majorList.value.map((item: any) => item.code)
      }
    }
  } catch (e: any) {
    ElMessage.error(e.toString())
  }
}

const normalizeDate = (value: unknown) => {
  if (value === undefined || value === null || value === '') return ''
  const dateText = String(value).trim().replace('T', ' ')
  return dateText.slice(0, 10)
}

const normalizeMeetingTimeRow = (row: Partial<any> = {}) => ({
  ...row,
  startTime: normalizeDate(row.startTime),
  endTime: normalizeDate(row.endTime)
})

const acceptParams = (params: ModalProps) => {
  modalProps.value = {
    ...params,
    row: normalizeMeetingTimeRow(params.row)
  }
  initParams()
  modalVisible.value = true
}

const closeHandle = () => {
  modalVisible.value = false
}

const ruleFormRef = ref()

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
