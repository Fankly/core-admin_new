import { reactive, ref } from 'vue'
import { BaseMethod } from '@/api/base/BaseMethod'
import { ElMessage } from 'element-plus'
import { getPublicCodeList } from '@/api/common'
import { Params, SelectData } from '../types/LinkMatterType'
import { VXETable } from 'vxe-table'

export const useLinkMatter = () => {
  const formRef = ref()
  const baseMethod = new BaseMethod()
  const showModal = ref(false)
  const loading = ref(false)
  const yssxData = ref<SelectData[]>([])
  const dydjData = ref<SelectData[]>([])
  const xllxData = ref<SelectData[]>([])
  const isDispatchData = ref<SelectData[]>([])
  const sjflData = ref<SelectData[]>([])
  const formData = reactive({
    yssxId: '',
    sjfl: '',
    isDispatch: '',
    xllx: '',
    dydj: ''
  })
  const height = ref('280px')
  const modalTitle = '事项关联'
  const publicParams = ref<Params>({
    checkedData: [],
    searchData: null,
    proTypeId: ''
  })
  const formRules = reactive({
    yssxId: [{ required: true, message: '请选择预算事项', trigger: 'change' }],
    sjfl: [{ required: true, message: '请选择三级分类', trigger: 'change' }],
    dydj: [{ required: true, message: '请选择电压等级', trigger: 'change' }]
  })

  const acceptParams = async (params: Params) => {
    publicParams.value = {
      ...publicParams.value,
      ...params
    }
    getYssxData()
    showModal.value = true
  }
  // 保存
  const saveHandle = async () => {
    await formRef.value.validate()
    loading.value = true
    try {
      const ids = publicParams.value.checkedData.map((item) => item.xmId)
      const isConfirm = await VXETable.modal.confirm('是否确认保存?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (isConfirm === 'confirm') {
        const saveDataRes = await baseMethod.post(
          '/xjjz/linkYssx',
          {
            xmIds: ids,
            ...formData
          },
          {},
          false
        )
        if (!saveDataRes.success) throw new Error(saveDataRes.msg)
        ElMessage.success('保存成功!')
        if (publicParams.value.searchData) publicParams.value.searchData()
        closeHandle()
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  }

  const closeHandle = () => {
    formRef.value?.resetFields()
    yssxData.value.length = 0
    sjflData.value.length = 0
    dydjData.value.length = 0
    height.value = '280px'
    showModal.value = false
  }

  const changeYssxData = (val: string) => {
    if (!val) return
    getSjflData()
  }

  const changeIsDispatchData = () => {
    if (formData.sjfl) {
      getDydjData()
    }
  }

  const changeSjflData = (val: string) => {
    if (!val) return
    getDydjData()
  }

  const getPulicCodeData = async (): Promise<void> => {
    formData.isDispatch = ''
    formData.xllx = ''
    try {
      const pulicCodeDataRes = await getPublicCodeList({
        codes: ['GY_SF', 'XLLX_COM']
      })
      if (!pulicCodeDataRes.success) throw new Error(pulicCodeDataRes.msg)
      isDispatchData.value = pulicCodeDataRes.data['GY_SF']
      xllxData.value = pulicCodeDataRes.data['XLLX_COM']
    } catch (e) {
      ElMessage.error((e as Error).message)
    }
  }

  const getYssxData = async (): Promise<void> => {
    formData.yssxId = ''
    formData.sjfl = ''
    formData.dydj = ''
    sjflData.value.length = 0
    dydjData.value.length = 0
    if (!publicParams.value.proTypeId) return
    const nd = publicParams.value.checkedData[0].nd
    try {
      loading.value = true
      const yssxDataRes = await baseMethod.post(
        '/yssxBasic/getYssxBasicList',
        {
          protypeId: publicParams.value.proTypeId,
          nd: nd
        },
        {},
        false
      )

      if (!yssxDataRes.success) throw new Error(yssxDataRes.msg)
      yssxData.value = yssxDataRes.data
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  }

  const getDydjData = async (): Promise<void> => {
    formData.dydj = ''
    if (!publicParams.value.proTypeId) return
    try {
      loading.value = true
      const dydjDataRes = await baseMethod.post(
        '/xmAttributeConfig/getDydj',
        {
          SJFL: formData.sjfl,
          IS_DISPATCH: formData.isDispatch
        },
        {},
        false
      )

      if (!dydjDataRes.success) throw new Error(dydjDataRes.msg)
      dydjData.value = dydjDataRes.data
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  }

  const getSjflData = async (): Promise<void> => {
    formData.sjfl = ''
    if (!formData.yssxId) return
    try {
      loading.value = true
      const sjflDataRes = await baseMethod.get(
        '/sqckConfirm/getSjfl',
        {
          yssxId: formData.yssxId
        },
        {},
        false
      )

      if (!sjflDataRes.success) throw new Error(sjflDataRes.msg)
      sjflData.value = sjflDataRes.data
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  }

  getPulicCodeData()

  return {
    formRef,
    xllxData,
    yssxData,
    isDispatchData,
    dydjData,
    sjflData,
    formRules,
    changeYssxData,
    changeIsDispatchData,
    changeSjflData,
    height,
    formData,
    showModal,
    modalTitle,
    closeHandle,
    saveHandle,
    acceptParams,
    loading
  }
}
