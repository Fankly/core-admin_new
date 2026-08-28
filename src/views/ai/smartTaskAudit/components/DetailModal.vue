<template>
  <vxe-modal
    :model-value="modal.visible"
    :destroy-on-close="true"
    :loading="modal.loading"
    :show-footer="false"
    show-zoom
    fullscreen
    resize
    position="center"
    width="90%"
    height="760"
    title="项目详情"
    class-name="smart-task-audit-detail-modal"
    @close="$emit('close')"
  >
    <AuditDetailWorkbench
      :key="initialDetailId"
      :active="modal.visible"
      :detail-row="detailRow"
      :review-opinions="reviewOpinions"
      :project-info-api="projectInfoApi"
      :can-rerun="canRerun"
      :initial-detail-id="initialDetailId"
      @show-project-more="showProjectInfo"
    />
  </vxe-modal>
  <CentralizedModification
    ref="projectDetailRef"
    transfer
    :get-api="projectInfoApi"
    :user-info="resolvedProjectUserInfo"
    :form-data="projectDetailData"
    flag="VIEW"
  />
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { PropType, Ref } from 'vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import AuditDetailWorkbench from './AuditDetailWorkbench.vue'
import type { ModalState, SmartTaskAuditRow } from '../types'

const props = defineProps({
  modal: {
    type: Object as PropType<ModalState>,
    required: true
  },
  detailRow: {
    type: Object as PropType<SmartTaskAuditRow>,
    default: () => ({})
  },
  reviewOpinions: {
    type: String,
    default: ''
  },
  projectInfoApi: {
    type: String,
    default: ''
  },
  userInfo: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  },
  /** 规则详情是否展示「重新分析」，默认开启 */
  canRerun: {
    type: Boolean,
    default: true
  },
  /** 单规则详情入口：传入后工作台只展示并选中该规则，空字符串表示展示全部规则 */
  initialDetailId: {
    type: String,
    default: ''
  }
})

defineEmits(['close'])

const currentUserRole = inject<Ref<UserRole>>('currentUserRole')
const projectDetailRef = ref<InstanceType<typeof CentralizedModification> | null>(null)
const projectDetailData = ref({ id: '', xmlx: '' })

const resolvedProjectUserInfo = computed(() => {
  if (Object.keys(props.userInfo || {}).length) return props.userInfo
  return {
    bmId: currentUserRole?.value?.bmId || '',
    deptId: currentUserRole?.value?.bmId || '',
    deptName: currentUserRole?.value?.bmName || '',
    dwId: currentUserRole?.value?.dwId || '',
    dwName: currentUserRole?.value?.dwName || '',
    roleId: currentUserRole?.value?.roleId || '',
    roleCode: currentUserRole?.value?.roleCode || '',
    spRoleId: currentUserRole?.value?.spRoleId || '',
    specialorgcode: currentUserRole?.value?.specialOrgCode || ''
  }
})

const getDetailRowValue = (...keys: string[]) => {
  for (const key of keys) {
    const value = props.detailRow?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return ''
}

const showProjectInfo = async () => {
  const id = String(getDetailRowValue('proId', 'xmId', 'xmid', 'id', 'ID')).trim()
  const xmlx = String(getDetailRowValue('proType', 'pro_type_id', 'proTypeId', 'xmlx', 'XMLX', 'PRO_TYPE')).trim()
  if (!id) return ElMessage.warning('当前任务缺少项目ID，无法查看详情')
  if (!xmlx) return ElMessage.warning('当前任务缺少项目类型，无法查看详情')

  projectDetailData.value = { id, xmlx }
  await nextTick()
  if (projectDetailRef.value) projectDetailRef.value.isShowModal = true
}
</script>

<style scoped lang="less">
:global(.smart-task-audit-detail-modal .vxe-modal--body),
:global(.smart-task-audit-detail-modal .vxe-modal--content) {
  height: 100%;
  padding: 0;
  overflow: hidden;
  background: #f5fbfb;
}
</style>
