<template>
  <vxe-modal
    @show="showHandle"
    :destroy-on-close="true"
    show-zoom
    resize
    :title="flag === 'VIEW' ? '查看' : '修改'"
    position="center"
    width="80%"
    height="800"
    v-model="isShowModal"
    @close="closeHandle"
    :loading="loading"
    class-name="editPage"
  >
    <div class="container">
      <el-tabs v-if="formConfigs.length" v-model="tabName">
        <el-tab-pane v-for="(formItem, index) in formConfigs" :key="formItem.stepId" :name="formItem.stepId" :label="formItem.stepName">
          <div class="comp" v-if="formItem.path">
            <component :globalParams="globalParams" :opType="opFlag" :selectData="formData" :ref="setFormRef(index)" :is="formItem.path"></component>
          </div>
          <div class="form-panel" v-else>
            <DynamicFormXm
              :selectData="formData"
              :customParam="customParam"
              :isChange="isChange"
              @clearFieldValue="clearFieldValueHandle"
              @setValue="setValueHandle"
              :globalParams="globalParams"
              :op-type="flag"
              :userInfo="userInfo"
              :attach-type="getApi"
              @field-change="(e:any) => handleFieldChange(e, index)"
              :ref="setFormRef(index)"
              :fields="formItem.fields"
              :form-config="formItem.config"
              :initial-data="formItem.data"
              :show-actions="false"
            ></DynamicFormXm>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="aiAuditTaskId" :name="AI_AUDIT_TAB_NAME" label="AI智能审核" lazy>
          <div class="ai-audit-tab-pane">
            <AuditDetailWorkbench :active="isShowModal" :detail-row="aiAuditDetailRow" :project-info-api="getApi" :show-project-more="false" />
          </div>
        </el-tab-pane>
      </el-tabs>
      <el-empty v-else-if="!loading" class="detail-empty" :description="loadError || '暂无项目详情'" />
      <div class="operation" v-if="flag === 'EDIT'">
        <el-button type="primary" size="mini" @click="submitForm">保 存</el-button>
        <el-button type="primary" size="mini" @click="closeHandle">取 消</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
import { getGmb, getSgbm, getTabColumns, getXmbm, getXmInfo, saveXmInfo } from '@/api/service/requirement'
import { pageGetXmInfo } from '@/api/service/jointReview'
import { defineComponent, ref, reactive, computed, defineAsyncComponent } from 'vue'
import { FormItems } from '@/views/service/xq/interface'
import DynamicFormXm from '@/components/DynamicFormXm/index.vue'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import VXETable from 'vxe-table'
import AuditDetailWorkbench from '@/views/ai/smartTaskAudit/components/AuditDetailWorkbench.vue'
import { AI_AUDIT_TAB_NAME, useProjectAiAuditTab } from '@/composables/useProjectAiAuditTab'

export default defineComponent({
  name: 'EditPage',
  components: { DynamicFormXm, AuditDetailWorkbench },
  props: {
    getApi: {
      type: String,
      default: ''
    },
    formData: {
      type: Object as any,
      required: true
    },
    userInfo: {
      type: Object as any,
      required: true
    },
    flag: {
      type: String,
      default: 'EDIT'
    },
    customParam: {
      type: Object as any,
      default: () => ({})
    }
  },
  emits: ['saveAfter'],
  setup(props, { expose, emit }) {
    interface Params {
      [key: string]: string
    }
    const assetGssdbDetailsLoader = () => import('@/views/service/xq/components/AssetgssdbDetails.vue')
    const xmbgxxLoader = () => import('@/views/service/xq/components/xmbgxx.vue')
    const assetDdqdDetailsLoader = () => import('@/views/service/xq/components/AssetDdqdDetails.vue')

    // 映射表
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
    const componentModules = import.meta.glob('/src/views/service/xq/components/*.vue')
    const normalizeComponentName = (name: any = '') => String(name || '').toLowerCase()
    const normalizedComponentMap = Object.fromEntries(Object.entries(componentMap).map(([name, loader]) => [normalizeComponentName(name), loader]))
    const normalizedComponentModules = Object.fromEntries(
      Object.entries(componentModules).map(([path, loader]) => [
        normalizeComponentName(
          path
            .split('/')
            .pop()
            ?.replace(/\.vue$/, '')
        ),
        loader
      ])
    )

    const setFormRef = (index: any) => (el: any) => {
      if (el) {
        formRefs.value[index] = el
      }
    }
    const opFlag = computed(() => props.flag)
    const getComponentLoader = (stepEnname: string) => {
      const normalizedName = normalizeComponentName(stepEnname)
      return componentMap[stepEnname] || normalizedComponentMap[normalizedName] || normalizedComponentModules[normalizedName]
    }

    const isChange = ref(false)

    const globalParams = reactive<Params>({})
    const formRefs = ref<any>([])
    const loading = ref(false)
    const loadError = ref('')
    const isShowModal = ref(false)
    const tabName = ref('')
    const tabs = ref<FormItems[]>([])
    const formConfigs = reactive<any>([])
    let detailLoadSeq = 0

    const getProjectId = () => (props.getApi ? props.formData.id : props.formData.xmid)
    const getProjectType = () => globalParams.xmlx || globalParams.XMLX || props.formData.xmlx || props.formData.XMLX || ''
    const {
      taskId: aiAuditTaskId,
      detailRow: aiAuditDetailRow,
      loadTaskId: loadAiAuditTaskId,
      reset: resetAiAuditState
    } = useProjectAiAuditTab({
      globalParams,
      isVisible: isShowModal,
      getFormData: () => props.formData,
      getProjectId,
      getProjectType,
      getProjectInfoApi: () => props.getApi
    })

    const commonFormConfig = {
      labelWidth: '170px',
      labelPosition: 'right',
      gutter: 20,
      colsPerRow: 2
    }

    const showHandle = async () => {
      const seq = ++detailLoadSeq
      try {
        loading.value = true
        loadError.value = ''
        resetAiAuditState()
        const data = props.getApi ? await pageGetXmInfo(props.formData.id) : await getXmInfo(props.formData.xmid)
        if (seq !== detailLoadSeq || !isShowModal.value) return
        const columns = await getTabColumns({
          protypeId: props.formData.xmlx,
          opType: props.flag,
          xmid: props.getApi ? props.formData.id : props.formData.xmid
        })
        if (seq !== detailLoadSeq || !isShowModal.value) return
        const test: any = {}
        if (columns.success && data.success) {
          const params: any = {}
          for (const key in data.data) {
            const ele = data.data[key]
            for (const key in ele) {
              globalParams[key] = ele[key]
              test[key] = ele[key]
              if (key === 'SJFL' || key === 'IS_DISPATCH') {
                params[key] = ele[key]
              }
            }
          }
          globalParams['id'] = props.formData.id
          const dydjData = await baseService.post('/xmAttributeConfig/getDydj', params)
          if (seq !== detailLoadSeq || !isShowModal.value) return
          for (let index = 0; index < columns.data.length; index++) {
            const item = columns.data[index]
            const params: any = {
              stepId: item.stepId,
              stepName: item.stepName,
              stepType: item.stepType,
              fields: item.columns,
              config: commonFormConfig,
              data: data.data[item.stepId]
            }
            if (item.stepEnname) {
              // params["path"] = defineAsyncComponent(() => import(/* @vite-ignore */ `/src/views/service/xq/components/${item.stepEnname}.vue`));
              const componentLoader = getComponentLoader(item.stepEnname)
              if (componentLoader) {
                params['path'] = defineAsyncComponent(componentLoader)
              }
            } else {
              for (const element of item['columns']) {
                if (element.prop === 'DYDJ') {
                  element.options = dydjData.data
                }
              }
              params.fields = item.columns
            }
            formConfigs.push(params)
          }
          tabName.value = formConfigs[0]?.stepId || ''
          isChange.value = true
          if (!formConfigs.length) loadError.value = '暂无项目详情'
          await loadAiAuditTaskId(formConfigs.some((formItem: any) => Boolean(formItem.path)))
        } else {
          loadError.value = data.msg || columns.msg || '项目详情获取失败'
          ElMessage.error(loadError.value)
        }
      } catch (error) {
        if (seq !== detailLoadSeq || !isShowModal.value) return
        console.error(error)
        loadError.value = error instanceof Error ? error.message : '项目详情加载失败，请稍后重试'
        ElMessage.error(loadError.value)
      } finally {
        if (seq === detailLoadSeq) loading.value = false
      }
    }

    const closeHandle = () => {
      detailLoadSeq += 1
      tabs.value.length = 0
      formConfigs.length = 0
      formRefs.value.length = 0
      Object.keys(globalParams).forEach((key) => delete globalParams[key])
      tabName.value = ''
      loadError.value = ''
      resetAiAuditState()
      loading.value = false
      isShowModal.value = false
      isChange.value = false
    }

    const handleFieldChange = async (event: any, index: any) => {
      const { prop, value, formData } = event
      globalParams[prop] = value
      if (prop === 'EJDW' && value && props.formData.lyxt === '-') {
        const xmbmData = await getXmbm(formData)
        if (xmbmData.success) {
          for (let i = 0; i < formRefs.value.length; i++) {
            const from = formRefs.value[i]
            for (const key in from.getFormData()) {
              if (key === 'XMBM') {
                from.setFieldValue(key, xmbmData.data)
              }
            }
          }
        }
      }
      if (prop === 'YJDW' && value) {
        const gkbmData = await getSgbm(formData)
        const gmbData = await getGmb({
          ...(globalParams.value as any),
          dwId: props.userInfo?.dwId || '',
          bmId: props.userInfo?.deptId || ''
        })
        if (gkbmData.success && gmbData.success) {
          for (let i = 0; i < formRefs.value.length; i++) {
            const from = formRefs.value[i]
            if (from.getFormData) {
              for (const key in from.getFormData()) {
                if (key === 'CTBM') {
                  from.setFieldValue(key, '')
                  from.updateField(key, {
                    options: gkbmData.data
                  })
                }
                if (key === 'GMB_ID') {
                  from.setFieldValue(key, '')
                  from.updateField(key, {
                    options: gmbData.data
                  })
                }
              }
            }
          }
        }
      }
      if ((prop === 'SJFL' && value) || prop === 'IS_DISPATCH') {
        const params: any = {
          SJFL: globalParams['SJFL']
        }

        if (prop === 'IS_DISPATCH' && value) {
          params['IS_DISPATCH'] = value
        }
        const dydjData = await baseService.post('/xmAttributeConfig/getDydj', params)
        for (let i = 0; i < formRefs.value.length; i++) {
          const from = formRefs.value[i]
          for (const key in from.getFormData()) {
            if (key === 'DYDJ') {
              from.updateField(key, {
                options: dydjData.data
              })
            }
          }
        }
      }
    }

    const submitForm = async () => {
      try {
        const type = await VXETable.modal.confirm('确认是否保存?', '提示', {
          confirmButtonText: '是',
          cancelButtonText: '否'
        })
        if (type === 'confirm') {
          loading.value = true
          for (let i = 0; i < formRefs.value.length; i++) {
            const form = formRefs.value[i]
            if (form.getFormData && form.ISCUSTOMCOPONENT) {
              const data = form.getFormData()
              for (const key in data) {
                globalParams[key] = data[key]
              }
            }
          }
          const res = await saveXmInfo({
            id: props.formData.id,
            deptId: props.userInfo?.deptId,
            deptName: props.userInfo?.deptName,
            dwId: props.userInfo?.dwId,
            dwName: props.userInfo?.dwName,
            datas: globalParams
          })
          if (res.success) {
            ElMessage.success('保存成功!')
            emit('saveAfter')
            closeHandle()
            loading.value = false
          } else {
            ElMessage.error(res.msg)
            loading.value = false
          }
        }
      } catch (error) {
        ElMessage.error('表单存在未填写的数据,请检查输入')
        console.error('表单验证失败', error)
      }
    }
    const setValueHandle = (field: any, value: string) => {
      if (value) {
        globalParams[field.prop] = value
      }
    }

    const clearFieldValueHandle = (field: any) => {
      if (field) {
        globalParams[field.prop] = ''
      }
    }

    expose({
      isShowModal
    })

    return {
      setFormRef,
      isChange,
      formRefs,
      loading,
      loadError,
      isShowModal,
      formConfigs,
      tabs,
      tabName,
      aiAuditTaskId,
      aiAuditDetailRow,
      AI_AUDIT_TAB_NAME,
      showHandle,
      closeHandle,
      handleFieldChange,
      submitForm,
      opFlag,
      globalParams,
      setValueHandle,
      clearFieldValueHandle
    }
  }
})
</script>

<style scoped lang="less">
.editPage {
  height: 100%;
  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    :deep(.el-select) {
      width: 100%;
    }

    :deep(.el-select .el-input__inner) {
      height: auto !important;
      min-height: 32px;
    }

    :deep(.el-select__tags) {
      height: auto !important;
      max-height: none !important;
      flex-wrap: wrap;
      padding: 2px 0;
      .el-select__input {
        max-width: 110px !important;
      }
    }

    :deep(.el-input__wrapper) {
      height: auto !important;
    }

    .comp {
      height: 100%;
    }

    .ai-audit-tab-pane {
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .detail-empty {
      flex: 1;
    }

    :deep(.form-panel) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0px 100px;
      height: 100%;
    }

    :deep(.el-form-item__content) {
      width: 100%;
    }
  }

  .container-tab {
    padding: 10px;
    margin: 0 auto;
  }

  .operation {
    text-align: center;
  }
}

.container > :deep(.el-tabs) {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  .el-tabs__content {
    flex: 1;
    min-width: 0;
    min-height: 0;
    max-width: 100%;
    max-height: 100%;
    overflow: auto;
    margin: 10px;
    .el-tab-pane {
      height: 100%;
    }
  }
}
</style>
