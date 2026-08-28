import { ref, reactive } from 'vue'

export const reviewHandle = (userInfo: any, selectedProject: any) => {
  const otherOpinionRef = ref()
  //展示更多信息
  const showMoreOpinion = () => {
    const params = {
      meetingId: userInfo.value.meetingId,
      originXmId: selectedProject.value.originXmId,
      isPack: selectedProject.value.isPack
    }
    otherOpinionRef.value.getPageList(params)
  }
  return {
    otherOpinionRef,
    showMoreOpinion
  }
}
