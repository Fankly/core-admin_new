import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

interface ClassificationItem {
  value: string
  label: string
  id: string
}

export const useClassification = (resetFormParams: (key: string) => void, setFormParams: (key: string, value: any) => void, getFormParams: (key: string) => any) => {
  const classificationOne = ref<ClassificationItem[]>([])
  const classificationTwo = ref<ClassificationItem[]>([])
  const classificationThree = ref<ClassificationItem[]>([])
  const getClassificationOne = () => {
    classificationOne.value = []
    const params = {
      rootCode: 'GWXMFL'
    }
    baseService.post('process40/getRootComCode/', params).then((res) => {
      if (res.success) {
        res.data.forEach((item: any) => {
          classificationOne.value.push({
            value: item.code,
            label: item.name,
            id: item.id
          })
        })
      } else {
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
  }
  const getClassificationTwo = (yjflData: ClassificationItem) => {
    if (!yjflData) {
      resetFormParams('yjfl')
    }
    classificationTwo.value = []
    classificationThree.value = []
    resetFormParams('ejfl')
    resetFormParams('ejflObj')
    resetFormParams('sjfl')
    if (yjflData && yjflData.id) {
      const params = {
        parentId: yjflData.id
      }
      baseService.post('process40/getComCodeByParent/', params).then((res) => {
        if (res.success) {
          res.data.forEach((item: any) => {
            classificationTwo.value.push({
              value: item.code,
              label: item.name,
              id: item.id
            })
          })
          setFormParams('yjfl', yjflData.value)
        } else {
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    }
  }

  const getClassificationThree = (ejflData: ClassificationItem) => {
    if (!ejflData) {
      resetFormParams('ejfl')
    }
    classificationThree.value = []
    resetFormParams('sjfl')
    if (ejflData && ejflData.id) {
      const params = {
        parentId: ejflData.id
      }
      baseService.post('process40/getComCodeByParent/', params).then((res) => {
        if (res.success) {
          res.data.forEach((item: any) => {
            classificationThree.value.push({
              value: item.code,
              label: item.name,
              id: item.id
            })
          })
          setFormParams('ejfl', ejflData.value)
        } else {
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    }
  }

  const clearAllClassification = () => {
    classificationTwo.value = []
    classificationThree.value = []
  }

  return {
    classificationOne,
    classificationTwo,
    classificationThree,
    getClassificationOne,
    getClassificationTwo,
    clearAllClassification,
    getClassificationThree
  }
}
