import { inject, Ref, ref } from 'vue'
import { ElMessage, ElTree } from 'element-plus'
import type Node from 'element-plus/es/el-tree/src/model/node'
import { getProtypeYearTreeB } from '@/api/common'
import { UserRole } from '@/components/UserRoleSelector/interface'
import { RowVO, Tree } from '@/views/service/budget/budgeting/types/budgeting'
import { BaseMethod } from '@/api/base/BaseMethod'
import { useBudgetingTable } from '@/views/service/budget/budgeting/hooks/useBudgetingTable'

export const useBudgetingTree = () => {
  const baseMethod = new BaseMethod()
  const { searchData } = useBudgetingTable()
  const treeRef = ref<InstanceType<typeof ElTree>>()
  const currentKey = ref<string>(new Date().getFullYear().toString())
  const yearTreeProp = {
    children: 'children',
    label: 'name',
    isLeaf: 'leaf',
    id: 'id'
  }
  const proTypeId = ref<string>('')
  const checkedData = ref<RowVO[]>([])
  const currentUserRole = inject<Ref<UserRole>>('currentUserRole')!
  const year = inject<Ref<string>>('year')!

  const handleNodeClick = async (node: Node & { nd: string }) => {
    checkedData.value = []
    proTypeId.value = String(node.id)
    currentKey.value = String(node.id)
    year.value = node.nd
    await searchData()
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
      const res = await getProtypeYearTreeB({
        nd: nd || year.value,
        bmId: currentUserRole.value.bmId,
        parentId
      })
      if (!res.success || !res.data) {
        throw new Error(res.msg || '请求的数据为空!')
      }
      resolve(res.data)
    } catch (e) {
      handleError('加载项目数据失败')
    }
  }
  const handleError = (message = '操作失败'): void => {
    ElMessage({
      message: `${message}`,
      type: 'error',
      duration: 5000
    })
  }
  return {
    treeRef,
    currentKey,
    yearTreeProp,
    loadTreeData,
    handleNodeClick
  }
}
