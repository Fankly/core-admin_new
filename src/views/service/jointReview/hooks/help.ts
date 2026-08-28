import { ref } from 'vue'

export const helpModalMeun = () => {
  const helpModalRef = ref()
  const getHelpMessageHandle = () => {
    if (helpModalRef.value) {
      helpModalRef.value.showModal = true
    }
  }

  return {
    helpModalRef,
    getHelpMessageHandle
  }
}
