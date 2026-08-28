import { reactive, ref } from 'vue'
import { Project, PublicCode, PublicParams } from '@/views/service/continueCarryOver/interface'
import { getPublicCodeList } from '@/api/common'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'

export function common() {
  const searchForm = reactive<Project>({})
  const searchList = reactive<{
    yjdwList: PublicCode[]
    ejdwList: PublicCode[]
    yjflList: PublicCode[]
    ejflList: PublicCode[]
    sjflList: PublicCode[]
    bmList: PublicCode[]
  }>({
    yjdwList: [],
    ejdwList: [],
    yjflList: [],
    ejflList: [],
    sjflList: [],
    bmList: []
  })
  const publicParams = ref<PublicParams>({
    bmId: '',
    nd: '',
    protypeId: '',
    dwId: '',
    userId: '',
    specialorgcode: '',
    fqzz: '',
    spRoleId: ''
  })
  const circulStatusArray = [
    {
      code: '1',
      name: '项目资金编制'
    },
    {
      code: '2',
      name: '项目资金审批中'
    },
    {
      code: '3',
      name: '项目资金审批未通过'
    },
    {
      code: '4',
      name: '项目资金审批通过'
    },
    {
      code: '6',
      name: '已立项'
    },
    {
      code: '7',
      name: '立项失败'
    },
    {
      code: '8',
      name: '项目关闭'
    }
  ]
  const publicCodeList = reactive<{
    XMXZ: PublicCode[]
    ['XM_FLOW_STATUS']: PublicCode[]
    ['GWXMFL']: PublicCode[]
    [key: string]: any[]
  }>({
    ['XMXZ']: [],
    ['XM_FLOW_STATUS']: [],
    ['GWXMFL']: []
  })
  const handleError = (error: Error, message = '操作失败'): void => {
    ElMessage({
      message: `${message}:${error.message}`,
      type: 'error',
      duration: 5000
    })
  }

  const getPublicParamsList = async () => {
    try {
      const res = await getPublicCodeList({
        codes: ['XMXZ', 'GWXMFL']
      })
      if (res.success) {
        for (const key in res.data) {
          publicCodeList[key] = res.data[key]
        }
        publicCodeList['XM_FLOW_STATUS'] = circulStatusArray
      } else {
        throw new Error(res.msg)
      }
    } catch (e) {
      handleError(e as Error, '获取数据失败')
    }
  }

  const initParamsData = async (method: any, params: any): Promise<any[]> => {
    const res = await baseService.post(method, params)
    if (res.success) {
      return res.data
    } else {
      ElMessage.error(res.msg)
      return []
    }
  }

  const handleFieldChange = async (value: string, prop: string) => {
    if (prop === 'yjdw') {
      searchList.ejdwList = []
      searchForm['ejdw'] = ''
      searchList.bmList = []
      searchForm['bmId'] = ''
      if (value) {
        const ejdwData = await baseService.post('/bizOrgTree/getEjdw', {
          YJDW: value,
          ...publicParams.value,
          parentCode: value
        })
        searchList.ejdwList = ejdwData.data || []
      }
    }

    if (prop === 'ejdw') {
      searchList.bmList = []
      searchForm['bmId'] = ''
      if (value) {
        const bmData = await baseService.post('/bizOrgTree/getCbzx', {
          EJDW: value,
          ...publicParams.value,
          parentCode: value
        })
        searchList.bmList = bmData.data || []
      }
    }

    if (prop === 'yjfl') {
      searchList.ejflList = []
      searchList.sjflList = []
      searchForm['ejfl'] = ''
      searchForm['sjfl'] = ''
      if (value) {
        const ejflData = await baseService.post('/commonCode/getCommonCodeByParentCode', {
          code: 'GWXMFL',
          ...publicParams.value,
          parentCode: value
        })
        searchList.ejflList = ejflData.data || []
      }
    }

    if (prop === 'ejfl') {
      searchList.sjflList = []
      searchForm['sjfl'] = ''
      if (value) {
        const sjflData = await baseService.post('/commonCode/getCommonCodeByParentCode', {
          code: 'GWXMFL',
          ...publicParams.value,
          parentCode: value
        })
        searchList.sjflList = sjflData.data || []
      }
    }
  }

  return {
    getPublicParamsList,
    initParamsData,
    publicCodeList,
    publicParams,
    searchForm,
    searchList,
    handleError,
    handleFieldChange
  }
}
