import { ElMessage } from 'element-plus'

interface Process {
  id: string
  compName: any
  isShowDialog: boolean
}

export const useProcess = async (selectedList: any[], processData: Process) => {
  const searchProcess = async () => {
    if (selectedList.length !== 1) {
      ElMessage.warning('请选择一条数据进行查看！')
      return
    }
    processData.id = selectedList[0].id
    processData.isShowDialog = !processData.isShowDialog
    await loadComponent()
  }

  const loadComponent = async () => {
    try {
      const comp = await import('@/views/workflow/components/workflowProcess.vue')
      processData.compName = comp.default
    } catch (error) {
      console.error('无法读取到组件:', error)
    }
  }

  await searchProcess()
}
