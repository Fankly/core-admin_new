import { getById, getTabColumns } from '@/api/service/requirement'
import { ElMessage } from 'element-plus'
import { defineAsyncComponent, ref, shallowRef } from 'vue'

const assetGssdbDetailsLoader = () => import('@/views/service/xq/components/AssetgssdbDetails.vue')
const assetDdqdDetailsLoader = () => import('@/views/service/xq/components/AssetDdqdDetails.vue')
const xmbgxxLoader = () => import('@/views/service/xq/components/xmbgxx.vue')
// 映射表
const componentMap: Record<string, () => Promise<any>> = {
  ProjectScale: () => import('@/views/service/xq/components/ProjectScale.vue'),
  AssetDetails: () => import('@/views/service/xq/components/AssetDetails.vue'),
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

export type BusinessType = 'sfxqlr' | 'sfgmblr' | 'sfzl'

interface FormConfig {
  stepId: string
  fields: any[]
  config: any
  data?: any
  path?: any
}

interface UserInfo {
  dwId: string
  deptId: string
}

export function useRequirementForm(businessType: BusinessType) {
  const formConfigs = shallowRef<FormConfig[]>([])
  const globalParams = ref<Record<string, any>>({})
  const stepIds = ref<string[]>([])
  const isChange = ref(false)

  const steps = ref([
    { stepId: '1', stepName: '选择事项', stepType: '1' },
    { stepId: '2', stepName: '基本信息', stepType: '2' },
    { stepId: '3', stepName: '申报信息', stepType: '3' },
    { stepId: '4', stepName: '附件信息', stepType: '4' }
  ])

  const commonFormConfig = {
    labelPosition: 'right',
    labelWidth: '168px',
    gutter: 24,
    colsPerRow: 2
  }

  const getFormDatas = async (id: string, xmlx: string, userInfo: UserInfo) => {
    try {
      globalParams.value = {}
      globalParams.value['yssxId'] = id
      globalParams.value['protypeId'] = xmlx
      formConfigs.value = []

      const tabColumnsData = await getTabColumns(globalParams.value)
      if (!tabColumnsData.success) {
        console.error(tabColumnsData.msg)
        throw new Error(tabColumnsData.msg)
      }

      steps.value = [steps.value[0], ...tabColumnsData.data]
      stepIds.value = []

      tabColumnsData.data.forEach((item: any) => {
        if (item.columns) {
          stepIds.value.push(item.stepId)
          const pathName = item.stepEnname
          const formConfigParams: FormConfig = {
            stepId: item.stepId,
            fields: item.columns,
            config: commonFormConfig,
            ...(pathName &&
              componentMap[pathName] && {
                path: defineAsyncComponent(componentMap[pathName])
              })
          }
          formConfigs.value.push(formConfigParams)
          item.columns.forEach((column: any) => {
            globalParams.value[column.prop] = ''
          })
        }
      })

      const requestParams = {
        ...globalParams.value,
        [businessType]: '1',
        dwId: userInfo.dwId,
        bmId: userInfo.deptId || ''
      }

      const formData = await getById(requestParams)
      if (!formData.success) {
        throw new Error(formData.msg)
      }

      const formDataList = Array.isArray(formData.data) ? formData.data : []
      formDataList.forEach((item: any) => {
        const datas = item?.datas || {}
        if (formConfigs.value && Array.isArray(formConfigs.value)) {
          const data = formConfigs.value.find((formConfig) => formConfig.stepId === item.stepId)
          if (data) {
            data.data = datas
          }
        }
        for (const key in datas) {
          globalParams.value[key] = datas[key]
        }
      })

      isChange.value = true
      return true
    } catch (e: any) {
      ElMessage.error(e.message)
      console.error(e.message)
      return false
    }
  }

  const resetFormConfigs = () => {
    formConfigs.value = []
    steps.value = [
      { stepId: '1', stepName: '选择事项', stepType: '1' },
      { stepId: '2', stepName: '基本信息', stepType: '2' },
      { stepId: '3', stepName: '申报信息', stepType: '3' },
      { stepId: '4', stepName: '附件信息', stepType: '4' }
    ]
  }

  const clearFieldValue = (field: any) => {
    if (field) {
      globalParams.value[field.prop] = ''
    }
  }

  const setValue = (field: any, value: any) => {
    const prop = typeof field === 'string' ? field : field?.prop
    if (prop) globalParams.value[prop] = value
  }
  return {
    formConfigs,
    globalParams,
    stepIds,
    steps,
    isChange,
    getFormDatas,
    resetFormConfigs,
    clearFieldValue,
    setValue
  }
}
