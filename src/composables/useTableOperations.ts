import { getProtypeTreeByGkbmId, getFromXqlr } from '@/api/service/requirement'
import { ElMessage } from 'element-plus'
import { markRaw, reactive, ref, shallowRef, toRaw, nextTick } from 'vue'
import { BusinessType } from './useRequirementForm'

interface UserInfo {
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  roleId: string
}

export function useTableOperations(businessType: BusinessType) {
  const loading = ref(false)
  const yskmTableRef = ref()
  const yssxTableRef = ref()

  const page = reactive({
    total: 0,
    limit: 20,
    page: 1
  })

  const searchData = reactive({
    zyssxmc: '',
    zyssxbm: ''
  })

  const provinceData = ref('')
  const ysly = ref('')
  const provinceDataList = shallowRef<Array<{ code: string; name: string }>>([])
  const protypeTreeDataList = shallowRef<Array<{ id: string; name: string; children?: any[] }>>([])
  const yssxDataList = shallowRef<Array<{ id: string; zyssxbm: string; zyssxmc: string; xmlx: string }>>([])

  const cellStyle = markRaw({
    cursor: 'pointer'
  })

  let treeRequestSequence = 0
  let listRequestSequence = 0

  const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
    let timeoutId: ReturnType<typeof setTimeout>
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }) as T
  }

  const getProTypeData = async (gkbmId = '', userInfo: UserInfo) => {
    const requestSequence = ++treeRequestSequence
    try {
      protypeTreeDataList.value = []
      yssxDataList.value = []
      page.total = 0
      listRequestSequence++
      setUserInfo(userInfo)

      const requestParams = {
        gkbmId: gkbmId,
        [businessType]: '1',
        dwId: userInfo.dwId,
        bmId: userInfo.deptId || '',
        nd: '',
        parentId: '-1',
        ysly: ysly.value
      }

      const res = await getProtypeTreeByGkbmId(requestParams)
      if (requestSequence !== treeRequestSequence) return
      if (!res.success) {
        throw new Error(res.msg)
      }

      const processData = res.data.map((item: any) => ({
        ...item,
        hasChildren: item.hasChildren,
        children: []
      }))
      protypeTreeDataList.value = processData
      const $table = yskmTableRef.value
      if ($table && processData.length > 0) {
        await nextTick()
        if (requestSequence !== treeRequestSequence) return
        const currentYear = new Date().getFullYear().toString()
        const currentYearNode = processData.find((item: any) => item.name === currentYear || item.id === currentYear)
        if (currentYearNode) {
          $table.setCurrentRow(currentYearNode)
          if (currentYearNode.hasChildren) {
            nextTick(() => {
              $table.setTreeExpand(currentYearNode, true)
            })
          }
        } else {
          $table.setCurrentRow(processData[0])
          if (processData[0].hasChildren) {
            nextTick(() => {
              $table.setTreeExpand(processData[0], true)
            })
          }
        }
        handleCurrentChange(userInfo)
      }
    } catch (error: any) {
      if (requestSequence === treeRequestSequence) {
        ElMessage.error(error.message)
      }
    }
  }

  const handleCurrentChangeCore = async (userInfo?: UserInfo) => {
    const requestSequence = ++listRequestSequence
    try {
      loading.value = true
      yssxDataList.value = []
      const $table = yskmTableRef.value
      if ($table) {
        const selectData = $table.getCurrentRecord()
        if (selectData) {
          const res = await getFromXqlr({
            zgkbmId: provinceData.value,
            bmId: userInfo?.deptId || '',
            dwId: userInfo?.dwId || '',
            [businessType]: '1',
            nd: selectData.nd || '',
            parentId: selectData.id || '',
            limit: page.limit,
            page: page.page,
            ysly: ysly.value,
            ...toRaw(searchData)
          })
          if (!res.success) {
            throw new Error(res.msg)
          }
          if (requestSequence !== listRequestSequence) return
          yssxDataList.value = res.data.records
          page.total = res.data.total
        } else {
          throw new Error('请在项目类型树中选择一条数据!')
        }
      }
    } catch (error: any) {
      if (requestSequence === listRequestSequence) {
        const errorMessage = error.message.replace(/^Error:\s*/i, '')
        ElMessage.error(errorMessage)
      }
    } finally {
      if (requestSequence === listRequestSequence) {
        loading.value = false
      }
    }
  }

  const handleCurrentChange = debounce(handleCurrentChangeCore, 300)

  const handleChangeProvinceData = async (val: string, userInfo: UserInfo) => {
    provinceData.value = val || ''
    page.page = 1
    try {
      loading.value = true
      yssxDataList.value = []
      await getProTypeData(provinceData.value, userInfo)
    } catch (error: any) {
      ElMessage.error(error.toString())
    } finally {
      loading.value = false
    }
  }

  const handleChangeYsly = async (val: string, userInfo: UserInfo) => {
    ysly.value = val || ''
    page.page = 1
    try {
      loading.value = true
      yssxDataList.value = []
      await getProTypeData(provinceData.value, userInfo)
    } catch (error: any) {
      ElMessage.error(error.toString())
    } finally {
      loading.value = false
    }
  }

  const pageChangeHandle = (currentPageNum: number, userInfo?: UserInfo) => {
    page.page = currentPageNum
    handleCurrentChangeCore(userInfo)
  }

  const limitChangeHandle = (currentLimitNum: number, userInfo?: UserInfo) => {
    page.page = 1
    page.limit = currentLimitNum
    handleCurrentChangeCore(userInfo)
  }

  const searchYssxHandle = (userInfo?: UserInfo) => {
    page.page = 1
    handleCurrentChangeCore(userInfo)
  }

  const resetHandle = (userInfo?: UserInfo) => {
    Object.assign(searchData, {
      zyssxmc: '',
      zyssxbm: ''
    })
    Object.assign(page, {
      total: 0,
      limit: 20,
      page: 1
    })
    handleCurrentChangeCore(userInfo)
  }

  let currentUserInfo: UserInfo | null = null

  const setUserInfo = (userInfo: UserInfo) => {
    currentUserInfo = userInfo
  }

  const loadTreeData = async ({ row }: { row: any }) => {
    try {
      if (!currentUserInfo) {
        throw new Error('用户信息不可用')
      }
      const requestParams = {
        gkbmId: provinceData.value,
        [businessType]: '1',
        dwId: currentUserInfo.dwId,
        bmId: currentUserInfo.deptId || '',
        nd: row.nd,
        parentId: row.id,
        ysly: ysly.value
      }

      const res = await getProtypeTreeByGkbmId(requestParams)
      if (!res.success) {
        throw new Error(res.msg)
      }
      const processDataChildren = res.data.map((child: any) => ({
        ...child,
        hasChildren: child.hasChildren,
        children: []
      }))
      return processDataChildren
    } catch (error: any) {
      ElMessage.error(error.message)
      return []
    }
  }

  return {
    loading,
    yskmTableRef,
    yssxTableRef,
    page,
    searchData,
    provinceData,
    ysly,
    provinceDataList,
    protypeTreeDataList,
    yssxDataList,
    cellStyle,
    getProTypeData,
    handleCurrentChange,
    handleChangeProvinceData,
    handleChangeYsly,
    pageChangeHandle,
    limitChangeHandle,
    searchYssxHandle,
    resetHandle,
    loadTreeData,
    setUserInfo
  }
}
