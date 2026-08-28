import { ElMessage } from 'element-plus'

interface Process {
  meetingId: string
  compName: any
  isShowDialog: boolean
}

export const useMeeting = async (selectedList: any[], processData: Process) => {
  const searchMeeting = async () => {
    if (selectedList.length !== 1) {
      ElMessage.warning('请选择一条数据进行查看！')
      return
    }
    processData.meetingId = selectedList[0].meetingId
    processData.isShowDialog = !processData.isShowDialog
    await loadComponent()
  }

  const loadComponent = async () => {
    try {
      const comp = await import('@/views/workflow/components/workflowMeeting.vue')
      processData.compName = comp.default
    } catch (error) {
      console.error('无法读取到组件:', error)
    }
  }

  await searchMeeting()
}
