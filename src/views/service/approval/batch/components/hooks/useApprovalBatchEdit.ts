import { ElForm, ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { VXETable } from 'vxe-table'
import { getPublicCodeList } from '@/api/common'
import { saveOrUpdateData } from '@/api/service/IhhsMeeting/approval/batch'
import { SaveData } from '@/api/service/IhhsMeeting/approval/batch/types'
import { downloadAttach, getTemplateManagerFileList, TemplateManagerFile, TemplatePspcType } from '@/api/service/approval/config/templateManager'
import { TableProps } from '@/views/service/approval/batch/types'
import { Params } from '../types'

export const useApprovalBatchEdit = (props: TableProps) => {
  const curYear = new Date().getFullYear().toString()
  const supportedTemplateTypes: TemplatePspcType[] = ['1', '2']
  const formRef = ref<InstanceType<typeof ElForm>>()
  const isShowModal = ref(false)
  const loading = ref(false)
  const templateLoading = ref(false)
  const parameter = ref<Params>({
    opType: 'ADD',
    title: '评审批次-新增'
  })
  const pspcList = ref<{ code: string; name: string }[]>([])
  const ndList = ref<{ code: string; name: string }[]>([])
  const reviewTemplateList = ref<TemplateManagerFile[]>([])
  const templateCache = reactive<Record<string, TemplateManagerFile[]>>({})
  const templateRequestId = ref(0)

  const formData = reactive<SaveData>({
    id: '',
    nd: curYear,
    pspcCode: '',
    pspcType: '1',
    pspcName: '',
    lhhsSkTime: '',
    lhhsOneStartTime: '',
    lhhsOneEndTime: '',
    lhhsTwoStartTime: '',
    lhhsTwoEndTime: '',
    lhhsThreeStartTime: '',
    lhhsThreeEndTime: '',
    lhhsFourStartTime: '',
    lhhsFourEndTime: ''
  })

  const formRules = reactive({
    pspcCode: [
      { required: true, message: '请输入批次编号', trigger: 'blur' },
      {
        pattern: /^[\w-]+$/,
        trigger: 'blur',
        message: '只能输入数字、字母、横杠(-)或下划线(_)'
      }
    ],
    pspcName: [{ required: true, message: '请输入批次名称', trigger: 'blur' }],
    lhhsSkTime: [{ required: true, message: '请选择需求申报截止时间', trigger: 'change' }],
    nd: [{ required: true, message: '请选择年度', trigger: 'change' }],
    lhhsOneStartTime: [{ required: true, message: '请选择线上预审开始时间', trigger: 'change' }],
    lhhsOneEndTime: [{ required: true, message: '请选择线上预审结束时间', trigger: 'change' }],
    lhhsTwoStartTime: [{ required: true, message: '请选择线下会审开始时间', trigger: 'change' }],
    lhhsTwoEndTime: [{ required: true, message: '请选择线下会审结束时间', trigger: 'change' }],
    lhhsThreeStartTime: [{ required: true, message: '请选择出具可研评审意见开始时间', trigger: 'change' }],
    lhhsThreeEndTime: [{ required: true, message: '请选择出具可研评审意见结束时间', trigger: 'change' }],
    lhhsFourStartTime: [{ required: true, message: '请选择专业批复合规性审查开始时间', trigger: 'change' }],
    lhhsFourEndTime: [{ required: true, message: '请选择专业批复合规性审查结束时间', trigger: 'change' }],
    pspcType: [{ required: true, message: '请选择批次类型', trigger: 'change' }]
  })

  const showReviewTemplate = computed(() => supportedTemplateTypes.includes(formData.pspcType))

  const currentPspcTypeName = computed(() => {
    return pspcList.value.find((item) => item.code === formData.pspcType)?.name || '当前批次类型'
  })

  const initParams = async () => {
    const codes = ['LHHS_PSPC_TYPE', 'ZLYS_XMJHSSND']
    try {
      const res = await getPublicCodeList({
        codes
      })
      if (!res.success) throw new Error(res.msg)
      pspcList.value = res.data[codes[0]] || []
      ndList.value = res.data[codes[1]] || []
    } catch (_error) {
      pspcList.value = []
      ndList.value = []
    }
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

      if (currentRequestId === templateRequestId.value && formData.pspcType === pspcType) {
        reviewTemplateList.value = templateList
      }
    } catch (error) {
      templateCache[pspcType] = []
      if (currentRequestId === templateRequestId.value && formData.pspcType === pspcType) {
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
    loading.value = true
    try {
      const res = await downloadAttach({
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
    } finally {
      loading.value = false
    }
  }

  const acceptParams = (params: Params) => {
    void initParams()

    const keys = Object.keys(formData) as Array<keyof SaveData>
    keys.forEach((key) => {
      if (key === 'pspcType') {
        formData[key] = '1'
      } else if (key === 'nd') {
        formData[key] = curYear
      } else {
        formData[key] = ''
      }
    })

    if (params.opType !== 'ADD' && params.selectedData) {
      Object.assign(formData, params.selectedData)
    }

    parameter.value = {
      ...parameter.value,
      ...params
    }
    isShowModal.value = true
  }

  watch([() => formData.pspcType, isShowModal], ([pspcType, visible]) => {
    if (!visible) {
      reviewTemplateList.value = []
      templateLoading.value = false
      return
    }
    void loadReviewTemplateList(pspcType)
  })

  const handleDateSync = (
    val: string,
    targetField:
      | 'lhhsOneStartTime'
      | 'lhhsOneEndTime'
      | 'lhhsTwoStartTime'
      | 'lhhsTwoEndTime'
      | 'lhhsThreeStartTime'
      | 'lhhsThreeEndTime'
      | 'lhhsFourStartTime'
      | 'lhhsFourEndTime',
    type: 'after' | 'before'
  ) => {
    const targetVal = formData[targetField]
    if (!val || !targetVal) return

    const currentTime = new Date(val).getTime()
    const targetTime = new Date(targetVal).getTime()

    if (type === 'after' && currentTime >= targetTime) {
      formData[targetField] = val
      return
    }

    if (type === 'before' && currentTime <= targetTime) {
      formData[targetField] = val
    }
  }

  const handleClose = () => {
    isShowModal.value = false
    const keys = Object.keys(formData) as Array<keyof SaveData>
    keys.forEach((key) => {
      if (key === 'pspcType') {
        formData[key] = '1'
      } else if (key === 'nd') {
        formData[key] = curYear
      } else {
        formData[key] = ''
      }
    })
    reviewTemplateList.value = []
    templateLoading.value = false
  }

  const handleSave = async () => {
    await formRef.value?.validate()

    const type = await VXETable.modal.confirm('是否确认保存？', '提示', {
      status: 'warning',
      cancelButtonText: '否',
      confirmButtonText: '是'
    })
    if (type !== 'confirm') return

    loading.value = true
    try {
      const res = await saveOrUpdateData({
        ...formData
      })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('保存成功')
      handleClose()
      props.search()
    } catch (error) {
      ElMessage.error((error as Error).message)
    } finally {
      loading.value = false
    }
  }

  return {
    formRef,
    acceptParams,
    parameter,
    formRules,
    loading,
    templateLoading,
    formData,
    ndList,
    pspcList,
    showReviewTemplate,
    currentPspcTypeName,
    reviewTemplateList,
    isShowModal,
    handleClose,
    handleSave,
    handleDateSync,
    handleDownloadTemplate
  }
}
