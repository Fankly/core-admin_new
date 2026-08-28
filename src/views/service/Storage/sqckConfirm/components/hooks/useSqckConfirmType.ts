import { reactive, ref } from 'vue'
import { BaseMethod } from '@/api/base/BaseMethod'
import { ElMessage } from 'element-plus'
import { getPublicCodeList } from '@/api/common'
import { Params, ProtypeData, SelectData, WbsData } from '../types/sqckConfirmType'
import { VXETable } from 'vxe-table'

export const useSqckConfirmType = () => {
  const formRef = ref()
  const baseMethod = new BaseMethod()
  const showModal = ref(false)
  const loading = ref(false)
  const protypeData = ref<ProtypeData[]>([])
  const yssxData = ref<SelectData[]>([])
  const dydjData = ref<SelectData[]>([])
  const xllxData = ref<SelectData[]>([])
  const wbsData = ref<WbsData[]>([])
  const isDispatchData = ref<SelectData[]>([])
  const sjflData = ref<SelectData[]>([])
  const formData = reactive({
    protypeId: '',
    yssxId: '',
    sjfl: '',
    isDispatch: '',
    xllx: '',
    dydj: '',
    wbsId: ''
  })
  const height = ref('280px')
  const isShowWbs = ref(false)
  const modalTitle = '类型修改'
  const publicParams = ref<Params>({
    checkedData: [],
    searchData: null
  })
  const formRules = reactive({
    protypeId: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
    yssxId: [{ required: true, message: '请选择预算事项', trigger: 'change' }],
    sjfl: [{ required: true, message: '请选择三级分类', trigger: 'change' }],
    dydj: [{ required: true, message: '请选择电压等级', trigger: 'change' }],
    wbsId: [{ required: true, message: '请选择WBS', trigger: 'change' }]
  })

  const acceptParams = async (params: Params) => {
    publicParams.value = {
      ...publicParams.value,
      ...params
    }
    const protypeId = params.checkedData[0].xmlx
    await getProtypeData(protypeId)
    showModal.value = true
  }
  // 保存
  const saveHandle = async () => {
    await formRef.value.validate()
    loading.value = true
    try {
      const ids = publicParams.value.checkedData.map((item) => item.id)
      const isConfirm = await VXETable.modal.confirm('是否确认保存?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (isConfirm === 'confirm') {
        const saveDataRes = await baseMethod.post(
          '/sqckConfirm/confirmProType',
          {
            ids: ids,
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
    wbsData.value.length = 0
    sjflData.value.length = 0
    dydjData.value.length = 0
    // 清空wbs数据
    wbsData.value.length = 0
    height.value = '280px'
    isShowWbs.value = false
    showModal.value = false
  }

  const getProtypeData = async (protypeId: string) => {
    formData.protypeId = ''
    try {
      loading.value = true
      const nd = publicParams.value.checkedData[0].nd
      const protypeDataRes = await baseMethod.get(
        '/sqckConfirm/getToBeConfirmProtypeLists',
        {
          protypeId: protypeId,
          nd: nd
        },
        {},
        false
      )
      if (!protypeDataRes.success) throw new Error(protypeDataRes.msg)
      protypeData.value = protypeDataRes.data
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
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

  const changeProTypeData = (val: string) => {
    if (!val) {
      height.value = '280px'
      isShowWbs.value = false
      return
    }
    const proType = protypeData.value.find((item) => item.id === val)
    if (proType) {
      getYssxData()
      if (proType.ysbzCode === 'BZDWBS') {
        height.value = '320px'
        isShowWbs.value = true
        getWbsTreeData()
      } else {
        height.value = '280px'
        isShowWbs.value = false
      }
    } else {
      height.value = '280px'
      isShowWbs.value = false
    }
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
    if (!formData.protypeId) return
    const nd = publicParams.value.checkedData[0].nd
    try {
      loading.value = true
      const yssxDataRes = await baseMethod.post(
        '/yssxBasic/getYssxBasicList',
        {
          protypeId: formData.protypeId,
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
    if (!formData.protypeId) return
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

  const getWbsTreeData = async (): Promise<void> => {
    formData.wbsId = ''
    if (!formData.protypeId) return
    try {
      loading.value = true
      const wbsDataRes = await baseMethod.post(
        '/wbsTree/getWbsTreeByProtype',
        {
          PRO_TYPE: formData.protypeId
        },
        {},
        false
      )
      if (!wbsDataRes.success) throw new Error(wbsDataRes.msg)
      wbsData.value = wbsDataRes.data
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
    wbsData,
    isDispatchData,
    dydjData,
    sjflData,
    isShowWbs,
    formRules,
    protypeData,
    changeYssxData,
    changeProTypeData,
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
