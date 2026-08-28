<template>
  <div v-loading="projectLoading" class="audit-panel audit-panel--scroll">
    <div v-if="formConfigs.length" class="project-tabs">
      <button
        v-for="formItem in formConfigs"
        :key="formItem.stepId"
        type="button"
        :class="{ active: tabName === formItem.stepId }"
        @click="tabName = formItem.stepId"
      >
        {{ formItem.stepName }}
      </button>
    </div>

    <div class="project-form">
      <template v-if="activeForm">
        <div v-if="activeForm.path" class="project-comp">
          <component
            :key="activeForm.stepId"
            :is="activeForm.path"
            :globalParams="globalParams"
            :opType="'VIEW'"
            :selectData="projectSelectData"
          ></component>
        </div>
        <DynamicForm
          v-else
          :key="activeForm.stepId"
          :selectData="projectSelectData"
          :customParam="{}"
          :isChange="isChange"
          :globalParams="globalParams"
          op-type="VIEW"
          :userInfo="{}"
          :fields="activeForm.fields"
          :form-config="activeForm.config"
          :initial-data="activeForm.data"
          :show-actions="false"
        ></DynamicForm>
      </template>
      <div v-else class="project-empty">{{ projectEmptyText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { PropType } from 'vue'
import { getTabColumns } from '@/api/service/requirement'
import { pageGetXmInfo } from '@/api/service/jointReview'
import DynamicForm from '@/components/DynamicForm/index.vue'
import type { ModalState, SmartTaskAuditRow } from '../types'

interface ProjectFormConfig {
  stepId: string | number
  stepName: string
  stepType: string
  fields: any[]
  config: {
    labelWidth: string
    labelPosition: string
    gutter: number
    colsPerRow: number
  }
  data: Record<string, any>
  path?: any
}

const props = defineProps({
  modal: {
    type: Object as any,
    required: true
  },
  detailRow: {
    type: Object as any,
    default: () => ({})
  }
})

const assetGssdbDetailsLoader = () => import('@/views/service/xq/components/AssetgssdbDetails.vue')
const xmbgxxLoader = () => import('@/views/service/xq/components/xmbgxx.vue')
const assetDdqdDetailsLoader = () => import('@/views/service/xq/components/AssetDdqdDetails.vue')

const componentMap: Record<string, () => Promise<any>> = {
  AssetDetails: () => import('@/views/service/xq/components/AssetDetails.vue'),
  ProjectScale: () => import('@/views/service/xq/components/ProjectScale.vue'),
  AssetYfDetails: () => import('@/views/service/xq/components/AssetYfDetails.vue'),
  AssetZwyfDetails: () => import('@/views/service/xq/components/AssetZwyfDetails.vue'),
  AssetZyfcDetails: () => import('@/views/service/xq/components/AssetZyfcDetails.vue'),
  AssetYfZwjxDetails: () => import('@/views/service/xq/components/AssetYfZwjxDetails.vue'),
  AssetGssdbDetails: assetGssdbDetailsLoader,
  AssetgssdbDetails: assetGssdbDetailsLoader,
  xmbgxx: xmbgxxLoader,
  XMBGXX: xmbgxxLoader,
  Xmbgxx: xmbgxxLoader,
  AssetDdqdDetails: assetDdqdDetailsLoader,
  AssetddqdDetails: assetDdqdDetailsLoader
}

const commonFormConfig = {
  labelWidth: '170px',
  labelPosition: 'right',
  gutter: 20,
  colsPerRow: 2
}

const projectLoading = ref(false)
const projectEmptyText = ref('请选择任务查看项目基本信息')
const tabName = ref<string | number>('')
const isChange = ref(false)
const formConfigs = ref<ProjectFormConfig[]>([])
const globalParams = reactive<Record<string, any>>({})
let loadSeq = 0

const projectSelectData = computed(() => ({
  ...props.detailRow,
  id: props.detailRow?.proId,
  xmlx: globalParams.xmlx || globalParams.XMLX || ''
}))

const activeForm = computed(() => formConfigs.value.find((item) => item.stepId === tabName.value))

const resetProjectState = () => {
  tabName.value = ''
  isChange.value = false
  formConfigs.value = []
  projectEmptyText.value = '请选择任务查看项目基本信息'
  Object.keys(globalParams).forEach((key) => {
    delete globalParams[key]
  })
}

const loadProjectInfo = async () => {
  const seq = ++loadSeq
  const proId = props.detailRow?.proId
  const protypeId = props.detailRow?.proType
  resetProjectState()
  if (!proId) {
    projectEmptyText.value = '当前任务缺少项目ID'
    return
  }
  if (!protypeId) {
    projectEmptyText.value = '当前任务缺少项目类型'
    return
  }

  projectLoading.value = true
  try {
    const [data, columns] = await Promise.all([
      pageGetXmInfo(proId),
      getTabColumns({
        protypeId,
        opType: 'VIEW',
        xmid: proId
      })
    ])
    if (seq !== loadSeq) return

    if (!data.success || !columns.success) {
      projectEmptyText.value = '项目基本信息获取失败'
      ElMessage.error(data.msg || columns.msg || '项目基本信息获取失败')
      return
    }

    for (const key in data.data) {
      const item = data.data[key]
      for (const itemKey in item) {
        globalParams[itemKey] = item[itemKey]
      }
    }
    globalParams.id = proId
    globalParams.xmlx = globalParams.xmlx || globalParams.XMLX || protypeId
    console.log(globalParams, 'globalParams')

    const columnData = Array.isArray(columns.data) ? columns.data : []
    formConfigs.value = columnData.map((item: any) => {
      const formItem: ProjectFormConfig = {
        stepId: item.stepId,
        stepName: item.stepName,
        stepType: item.stepType,
        fields: item.columns || [],
        config: commonFormConfig,
        data: data.data?.[item.stepId] || {}
      }
      if (item.stepEnname && componentMap[item.stepEnname]) {
        formItem.path = defineAsyncComponent(componentMap[item.stepEnname])
      }
      return formItem
    })

    tabName.value = formConfigs.value[0]?.stepId || ''
    isChange.value = true
    projectEmptyText.value = formConfigs.value.length ? '' : '暂无项目基本信息'
  } catch (e: any) {
    if (seq !== loadSeq) return
    projectEmptyText.value = '项目基本信息获取失败'
    ElMessage.error(e.message || '项目基本信息获取失败')
  } finally {
    if (seq === loadSeq) {
      projectLoading.value = false
    }
  }
}

watch(
  () => [props.modal.visible, props.detailRow?.proId, props.detailRow?.proType],
  () => {
    if (props.modal.visible) {
      loadProjectInfo()
    } else {
      loadSeq += 1
      projectLoading.value = false
      resetProjectState()
    }
  },
  {
    immediate: true
  }
)
</script>

<style scoped lang="less">
:deep(.smart-task-audit-detail-modal .vxe-modal--body),
:deep(.smart-task-audit-detail-modal .vxe-modal--content) {
  padding: 0;
  overflow: hidden;
}

.audit-panel {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  // border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.audit-panel--scroll {
  overflow-y: auto;
}

.project-tabs {
  display: flex;
  flex: 0 0 auto;
  padding-left: 25px;
  border-bottom: 1px solid #e5e7eb;

  button {
    height: 48px;
    padding: 0 15px;
    border: 0;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    line-height: 48px;
    white-space: nowrap;
    transition: color 160ms ease, border-color 160ms ease;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.project-tabs {
  button {
    &.active {
      color: var(--el-color-primary);
      border-bottom: 2px solid var(--el-color-primary);
    }
  }
}

.project-form {
  flex: 1;
  min-height: 0;
  padding: 24px;
}

.project-comp {
  height: 100%;
}

.project-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: #6b7280;
  font-size: 14px;
}

@media (prefers-reduced-motion: reduce) {
  .audit-panel,
  .project-tabs button {
    transition: none;
  }
}
</style>
