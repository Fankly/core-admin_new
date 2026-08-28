import baseService from '@/service/baseService'
import { computed, ref, watch } from 'vue'
import { RowVo, Tree } from '@/views/service/continueCarryOver/interface'
import { getProtypeYearTreeCb } from '@/api/common'
import { ElMessage } from 'element-plus'
import { formatValue } from '@/utils/utils'
import type Node from 'element-plus/es/el-tree/src/model/node'
import { common } from '@/views/service/continueCarryOver/common'
import { queryXjjzPage, exportData } from '@/api/service/continueCarryOver'

export function formData() {
  const checkedData = ref<RowVo[]>([])
  const loading = ref<boolean>(false)
  const tableData = ref<RowVo[]>([])
  const { getPublicParamsList, publicCodeList, publicParams, searchForm, searchList, handleFieldChange } = common()

  const handleError = (error: Error, message = '操作失败'): void => {
    ElMessage({
      message: `${message}:${error.message}`,
      type: 'error',
      duration: 5000
    })
  }
  const totalProjectsCount = ref<number>(0)
  const error = ref<string | null>(null)
  const childrenCurrentPage = ref<number>(1)
  const childrenPageSize = ref<number>(20)

  const totalProjects = computed<number>(() => {
    return totalProjectsCount.value
  })

  const handleChildrenSizeChange = (val: number): void => {
    try {
      if (val > 0) {
        childrenPageSize.value = val
        childrenCurrentPage.value = 1
        loadData()
      } else {
        throw new Error('页面大小必须大于0')
      }
    } catch (e) {
      handleError(e as Error, '更改子项目页面大小失败')
    }
  }

  const handleChildrenCurrentChange = (val: number): void => {
    try {
      if (val > 0) {
        childrenCurrentPage.value = val
        loadData()
      } else {
        throw new Error('页码必须大于0')
      }
    } catch (e) {
      handleError(e as Error, '更改子项目页码失败')
    }
  }

  const loadData = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      checkedData.value = []
      const { data, total } = await apiService.getProjectsWithGroups(childrenCurrentPage.value, childrenPageSize.value)
      tableData.value = data
      totalProjectsCount.value = total
    } catch (e) {
      handleError(e as Error, '加载项目数据失败')
    } finally {
      loading.value = false
    }
  }

  watch([childrenCurrentPage, childrenPageSize], () => {
    error.value = null
  })

  const apiService = {
    async getProjectsWithGroups(page: number, pageSize: number): Promise<{ data: RowVo[]; total: number }> {
      try {
        let gwxmbms = []
        let xmbms = []
        if (searchForm.gwxmbms) gwxmbms = searchForm.gwxmbms.split(',')
        if (searchForm.xmbms) xmbms = searchForm.xmbms.split(',')
        const groupsRes = await queryXjjzPage({
          ...searchForm,
          gwxmbms: gwxmbms,
          xmbms: xmbms,
          page: page,
          limit: pageSize,
          ...publicParams.value
        } as any)
        const totalProjects = groupsRes.data.total || 0
        return {
          data: groupsRes.data.records,
          total: totalProjects
        }
      } catch (error) {
        console.error('获取项目分组及子项目数据失败', error)
        throw new Error('获取项目分组及子项目数据失败')
      }
    },
    async exportDataPages(): Promise<boolean> {
      try {
        let gwxmbms = []
        let xmbms = []
        if (searchForm.gwxmbms) gwxmbms = searchForm.gwxmbms.split(',')
        if (searchForm.xmbms) xmbms = searchForm.xmbms.split(',')
        const res = await exportData({
          ...searchForm,
          xmbms: xmbms,
          gwxmbms: gwxmbms,
          ...publicParams.value
        } as any)
        const blob = res
        const dom = document.createElement('a')
        const url = window.URL.createObjectURL(blob)
        dom.href = url
        // 获取文件名
        let fileName = '项目续建结转项目.xlsx'
        if (res.headers) {
          fileName = res.headers['content-disposition'].split(';')[1].split('=')[1]
        }
        dom.download = `${decodeURI(decodeURI(fileName))}`
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
        return true
      } catch (error) {
        throw new Error((error as Error).message)
      }
    }
  }
  const formatterHandle = ({ cellValue }: any) => {
    if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
    return formatValue(cellValue, 6)
  }

  const loadTreeData = async (node: Node, resolve: (data: Tree[]) => void) => {
    try {
      let parentId: number
      let nd: string
      if (node.level === 0) {
        nd = ''
        parentId = -1
      } else {
        parentId = node.data.id
        nd = node.data.nd
      }
      const res = await getProtypeYearTreeCb({
        nd: nd || publicParams.value.nd,
        bmId: publicParams.value.bmId,
        parentId
      })
      if (!res.success || !res.data) {
        throw new Error(res.msg || '请求的数据为空!')
      }
      resolve(res.data)
    } catch (e) {
      handleError(e as Error, '加载项目数据失败')
    }
  }
  return {
    formatterHandle,
    loadTreeData,
    apiService,
    loading,
    totalProjects,
    error,
    loadData,
    tableData,
    checkedData,
    childrenCurrentPage,
    childrenPageSize,
    handleError,
    handleChildrenSizeChange,
    handleChildrenCurrentChange,
    publicParams,
    getPublicParamsList,
    publicCodeList,
    searchForm,
    searchList,
    handleFieldChange
  }
}
