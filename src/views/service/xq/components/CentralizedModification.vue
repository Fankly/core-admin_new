<template>
  <vxe-modal
    @show="showHandle"
    :destroy-on-close="true"
    :transfer="transfer"
    show-zoom
    fullscreen
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
            <component
              :globalParams="globalParams"
              :opType="getFormItemOpType(formItem)"
              :selectData="formData"
              :initialData="formItem.data"
              v-bind="getComponentExtraProps(formItem)"
              :ref="setFormRef(index)"
              :is="formItem.path"
            ></component>
          </div>
          <div class="form-panel" v-else>
            <DynamicForm
              :selectData="formData"
              :customParam="customParam"
              :isChange="isChange"
              @clearFieldValue="clearFieldValueHandle"
              @setValue="setValueHandle"
              :globalParams="globalParams"
              :op-type="getFormItemOpType(formItem)"
              :userInfo="userInfo"
              :attach-type="getApi"
              @field-change="(e:any) => handleFieldChange(e, index)"
              :ref="setFormRef(index)"
              :fields="formItem.fields"
              :form-config="formItem.config"
              :initial-data="formItem.data"
              :show-actions="false"
            ></DynamicForm>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="aiAuditTaskId" :name="AI_AUDIT_TAB_NAME" label="AI智能审核" lazy>
          <div class="ai-audit-tab-pane">
            <AuditDetailWorkbench
              :active="isShowModal"
              :detail-row="aiAuditDetailRow"
              :project-info-api="getApi"
              :show-project-more="false"
              :show-project-info="false"
            />
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
import { saveYsbg } from '@/api/service/budget'
import { pageGetXmInfo } from '@/api/service/jointReview'
import { getAuditTaskIdByLHHSProId, getAuditTaskIdByProId } from '@/api/ai/smartTaskAudit'
import { defineComponent, ref, reactive, computed, defineAsyncComponent, PropType, watch } from 'vue'
import { FormItems } from '../interface'
import DynamicForm from '@/components/DynamicForm/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import baseService from '@/service/baseService'
import VXETable, { VxeTable } from 'vxe-table'
import AuditDetailWorkbench from '@/views/ai/smartTaskAudit/components/AuditDetailWorkbench.vue'
import type { SmartTaskAuditRow } from '@/views/ai/smartTaskAudit/types'

const AI_AUDIT_TAB_NAME = '__ai_smart_audit__'

export default defineComponent({
  name: 'EditPage',
  components: { DynamicForm, AuditDetailWorkbench },
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
    },
    editableComponentNames: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    budgetChangesProjectChange: {
      type: Boolean,
      default: false
    },
    // 变更申请单操作类型：create/edit/view，仅项目调整变更页签使用
    projectChangeMode: {
      type: String,
      default: ''
    },
    transfer: {
      type: Boolean,
      default: false
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

    const setFormRef = (index: any) => (el: any) => {
      if (el) {
        formRefs.value[index] = el
      }
    }
    const opFlag = computed(() => props.flag)
    const editableComponentNameSet = computed(() => new Set(props.editableComponentNames.map((name: string) => name.toLowerCase())))
    const isLimitedEditMode = computed(() => props.flag === 'EDIT' && editableComponentNameSet.value.size > 0)
    const normalizeComponentName = (name: any = '') => String(name || '').toLowerCase()
    const isProjectChangeComponent = (stepEnname = '') => normalizeComponentName(stepEnname) === 'xmbgxx'
    const isDispatchListComponent = (stepEnname = '') => normalizeComponentName(stepEnname) === 'assetddqddetails'
    const isProjectChangeEditMode = computed(
      () => props.budgetChangesProjectChange && isLimitedEditMode.value && editableComponentNameSet.value.has('xmbgxx')
    )
    const isProjectChangeComponentEditable = (formItem: any) => isProjectChangeEditMode.value && isProjectChangeComponent(formItem?.stepEnname)
    const getPageType = () => {
      if (props.getApi) return '2'
      if (props.budgetChangesProjectChange) return '1'
      return ''
    }
    const getStepOpType = (stepEnname = '') => {
      if (props.flag !== 'EDIT') return props.flag
      if (isProjectChangeComponent(stepEnname)) return isProjectChangeEditMode.value ? 'EDIT' : 'VIEW'
      if (!isLimitedEditMode.value) return props.flag
      return editableComponentNameSet.value.has(normalizeComponentName(stepEnname)) ? 'EDIT' : 'VIEW'
    }
    const getFormItemOpType = (formItem: any) => getStepOpType(formItem?.stepEnname)
    const getComponentExtraProps = (formItem: any) => {
      const stepEnname = formItem?.stepEnname
      const pageType = getPageType()
      if (isDispatchListComponent(stepEnname)) {
        return {
          ...(pageType ? { pageType } : {})
        }
      }
      if (!isProjectChangeComponent(stepEnname)) return {}
      return {
        projectChangeEditable: isProjectChangeComponentEditable(formItem),
        ...(props.projectChangeMode ? { projectChangeMode: props.projectChangeMode } : {}),
        ...(pageType ? { pageType } : {})
      }
    }
    const cloneFields = (fields: any[] = []) => {
      return fields.map((field) => ({
        ...field,
        children: Array.isArray(field.children) ? field.children.map((child: any) => ({ ...child })) : field.children
      }))
    }
    const lockProjectCodeFields = (fields: any[] = []): any[] => {
      if (props.flag !== 'EDIT') return fields
      return fields.map((field) => ({
        ...field,
        ...(String(field.prop || '').toUpperCase() === 'XMBM' ? { disabled: true, dependencies: [] } : {}),
        children: Array.isArray(field.children) ? lockProjectCodeFields(field.children) : field.children
      }))
    }
    const setFieldsReadonly = (fields: any[] = [], readonly: boolean) => {
      if (!readonly) return fields
      return fields.map((field) => ({
        ...field,
        disabled: true,
        uploadDisabled: true,
        children: Array.isArray(field.children)
          ? field.children.map((child: any) => ({
              ...child,
              disabled: true,
              uploadDisabled: true
            }))
          : field.children
      }))
    }
    const getComponentLoader = (stepEnname: string) => {
      return (
        componentMap[stepEnname] ||
        componentMap[normalizeComponentName(stepEnname)] ||
        (componentModules[`/src/views/service/xq/components/${stepEnname}.vue`] as () => Promise<any>) ||
        (componentModules[`/src/views/service/xq/components/${normalizeComponentName(stepEnname)}.vue`] as () => Promise<any>)
      )
    }
    const getValue = (...keys: string[]) => {
      const sources = [globalParams, props.formData || {}]
      for (const source of sources) {
        for (const key of keys) {
          if (source[key] !== undefined && source[key] !== null) return source[key]
        }
      }
      return ''
    }
    const saveProjectChangeInfo = () => {
      return saveYsbg({
        bgid: String(getValue('bgid') || ''),
        xmid: String(getValue('xmid', 'id') || ''),
        gwxmbm: String(getValue('gwxmbm', 'GWXMBM') || ''),
        bglx: String(getValue('bglx', 'BGLX') || ''),
        tzsy: String(getValue('tzsy', 'TZSY') || ''),
        sfcjpsyj: String(getValue('sfcjpsyj', 'SFCJPSYJ') || ''),
        byx: String(getValue('byx', 'BYX') || ''),
        ssnr: String(getValue('ssnr', 'SSNR') || ''),
        bgAllInvestTax: Number(getValue('bgAllInvestTax', 'BG_ALL_INVEST_TAX') || 0),
        bgAmout: Number(getValue('bgAmount', 'BG_AMOUNT') || 0),
        bgyy: String(getValue('bgyy', 'BGYY') || ''),
        uuids: Array.isArray(globalParams.uuids) ? globalParams.uuids : []
      })
    }

    const isChange = ref(false)

    const globalParams = reactive<Params>({})
    const formRefs = ref<any>([])
    const loading = ref(false)
    const loadError = ref('')
    const isShowModal = ref(false)
    const tabName = ref('')
    const aiAuditTaskId = ref('')
    const aiAuditActivated = ref(false)
    const tabs = ref<FormItems[]>([])
    const formConfigs = reactive<any>([])
    let detailLoadSeq = 0

    const commonFormConfig = {
      labelWidth: '170px',
      labelPosition: 'right',
      gutter: 20,
      colsPerRow: 2
    }

    const normalizeTaskId = (data: any) => {
      const payload = data?.data ?? data
      if (payload && typeof payload === 'object') return String(payload.taskId ?? '').trim()
      return String(payload ?? '').trim()
    }

    const resetAiAuditState = () => {
      aiAuditTaskId.value = ''
      aiAuditActivated.value = false
    }

    const isDetailLoadActive = (seq: number) => seq === detailLoadSeq && isShowModal.value
    const getAiAuditProjectId = () => String(getValue('id', 'xmid', 'xmId', 'proId', 'ID') || '').trim()

    const loadAiAuditTaskId = async (seq: number, hasCustomComponent: boolean) => {
      if (!hasCustomComponent) return
      const projectId = getAiAuditProjectId()
      if (!projectId) return

      try {
        const response = props.getApi ? await getAuditTaskIdByLHHSProId(projectId) : await getAuditTaskIdByProId(projectId)
        if (!isDetailLoadActive(seq) || response?.success === false) return
        aiAuditTaskId.value = normalizeTaskId(response)
      } catch {
        // 审核任务不存在或暂时不可用时不打扰项目详情页。
      }
    }

    const showHandle = async () => {
      const seq = ++detailLoadSeq
      try {
        loading.value = true
        loadError.value = ''
        resetAiAuditState()
        const pageType = getPageType()
        const data = props.getApi ? await pageGetXmInfo(props.formData.id) : await getXmInfo(props.formData.id)
        if (!isDetailLoadActive(seq)) return
        const columns = await getTabColumns({
          protypeId: props.formData.xmlx,
          opType: props.flag,
          xmid: props.formData.id,
          ...(pageType ? { pageType } : {})
        })
        if (!isDetailLoadActive(seq)) return
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
          if (!isDetailLoadActive(seq)) return
          for (let index = 0; index < columns.data.length; index++) {
            const item = columns.data[index]
            const stepOpType = getStepOpType(item.stepEnname)
            const fields = lockProjectCodeFields(cloneFields(item.columns || []))
            const params: any = {
              stepId: item.stepId,
              stepName: item.stepName,
              stepType: item.stepType,
              stepEnname: item.stepEnname || '',
              fields: setFieldsReadonly(fields, stepOpType === 'VIEW'),
              config: commonFormConfig,
              data: data.data[item.stepId]
            }
            if (item.stepEnname) {
              const componentLoader = getComponentLoader(item.stepEnname)
              if (componentLoader) {
                params['path'] = defineAsyncComponent(componentLoader)
              }
            } else {
              for (const element of fields) {
                if (element.prop === 'DYDJ') {
                  element.options = dydjData.data
                }
              }
              params.fields = setFieldsReadonly(fields, stepOpType === 'VIEW')
            }
            formConfigs.push(params)
          }
          const defaultFormItem = isProjectChangeEditMode.value
            ? formConfigs.find((formItem: any) => isProjectChangeComponent(formItem.stepEnname)) || formConfigs[0]
            : formConfigs[0]
          tabName.value = defaultFormItem?.stepId || ''
          isChange.value = true
          if (!formConfigs.length) loadError.value = '暂无项目详情'
          await loadAiAuditTaskId(
            seq,
            formConfigs.some((formItem: any) => Boolean(formItem.path))
          )
        } else {
          loadError.value = data.msg || columns.msg || '项目详情获取失败'
          ElMessage.error(loadError.value)
        }
      } catch (error) {
        if (!isDetailLoadActive(seq)) return
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

    const aiAuditDetailRow = computed<SmartTaskAuditRow>(() => {
      const getDetailValue = (...keys: string[]) => getValue(...keys)
      const projectId = getAiAuditProjectId()
      const projectType = String(getDetailValue('xmlx', 'XMLX', 'proType', 'pro_type_id', 'proTypeId', 'PRO_TYPE') || '').trim()
      return {
        ...(props.formData || {}),
        ...globalParams,
        id: projectId,
        proId: projectId,
        xmId: projectId,
        xmid: projectId,
        proType: projectType,
        pro_type_id: projectType,
        proTypeId: projectType,
        xmmc: getDetailValue('xmmc', 'XMMC', 'taskName', 'name'),
        xmbm: getDetailValue('xmbm', 'XMBM'),
        proTypeName: getDetailValue('proTypeName', 'xmlxName', 'XMLX_NAME', 'PRO_TYPE_NAME'),
        jhssnd: getDetailValue('jhssnd', 'JHSSND'),
        yjdw: getDetailValue('yjdw', 'YJDW', 'yjdwName', 'YJDW_NAME'),
        ejdw: getDetailValue('ejdw', 'EJDW', 'ejdwName', 'EJDW_NAME'),
        yssxName: getDetailValue('yssxName', 'YSSX_NAME'),
        allInvestTax: getDetailValue('allInvestTax', 'ALL_INVEST_TAX'),
        amount: getDetailValue('amount', 'AMOUNT'),
        taskId: aiAuditTaskId.value
      }
    })

    watch(tabName, (value) => {
      if (value === AI_AUDIT_TAB_NAME && aiAuditTaskId.value) aiAuditActivated.value = true
    })

    const handleFieldChange = async (event: any, index: any) => {
      const { prop, value, formData } = event
      globalParams[prop] = value
      if (props.flag !== 'EDIT' && prop === 'EJDW' && value && props.formData.lyxt === '-') {
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
            if (getFormItemOpType(formConfigs[i]) !== 'EDIT') {
              continue
            }
            if (form.getFormData && form.ISCUSTOMCOPONENT) {
              const data = form.getFormData()
              for (const key in data) {
                globalParams[key] = data[key]
              }
            }
          }
          const saveParams: any = {
            id: props.formData.id,
            deptId: props.userInfo?.deptId,
            deptName: props.userInfo?.deptName,
            dwId: props.userInfo?.dwId,
            dwName: props.userInfo?.dwName,
            datas: globalParams
          }
          if (props.formData.bgid) {
            saveParams.bgid = props.formData.bgid
          }
          const res = isProjectChangeEditMode.value ? await saveProjectChangeInfo() : await saveXmInfo(saveParams)
          if (res.success) {
            ElMessage.success('保存成功!')
            emit('saveAfter')
            closeHandle()
            loading.value = false
          } else {
            if (res.msg.includes('请维护对比问题说明')) {
              const choose = await VXETable.modal.confirm(`${res.msg}`, '错误提示', {
                status: 'error',
                confirmButtonText: '立即上传',
                cancelButtonText: '稍后上传'
              })
              if (choose === 'confirm') {
                for (let i = 0; i < formRefs.value.length; i++) {
                  const form = formRefs.value[i]
                  if (form.uploadHandle) {
                    await form.uploadHandle()
                    closeHandle()
                    break
                  }
                }
              }
            } else {
              ElMessage.error(res.msg)
            }

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
      aiAuditActivated,
      aiAuditDetailRow,
      AI_AUDIT_TAB_NAME,
      showHandle,
      closeHandle,
      handleFieldChange,
      submitForm,
      opFlag,
      getFormItemOpType,
      getComponentExtraProps,
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
