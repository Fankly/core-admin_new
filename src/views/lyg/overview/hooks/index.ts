import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'
import baseService from '@/service/baseService'
import { getPublicData } from '@/api/common' //公共代码
import { getCropLimitInfo } from '@/api/lkyptzl/index'

export const overviewParam = () => {
  const isShowPage = ref<boolean>(false)
  const loading = ref<boolean>(false)
  const xmjdLoading = ref<boolean>(false)
  const userDialogRef = ref()
  const store = useStore()
  const ndList = ref<any[]>([])
  const cropFlag = ref<string>('')
  const userInfo = ref<any>()
  const dataParams = reactive<any>({
    mbz: 0,
    wcz: 0,
    wcl: 0,
    dspm: 0,
    sgspjwcl: 0,
    sndtqsgspjwcl: 0,
    gsjlcmbz: 0
  })
  // 获取公共代码
  const getPublicCode = async () => {
    const res: any = await getPublicData('NDCX')
    if (res.success) {
      ndList.value = res.data
    } else {
      ElMessage.error(res.msg)
    }
  }

  const getTryCounty = async (val: any) => {
    const cropInfo: any = await getCropLimitInfo({ dwId: val, isUpLimit: true })
    if (!cropInfo.success) ElMessage.error(cropInfo.msg)
    cropFlag.value = cropInfo.data.cropFlag
  }
  return {
    isShowPage,
    loading,
    xmjdLoading,
    userDialogRef,
    ndList,
    cropFlag,
    userInfo,
    dataParams,
    getTryCounty,
    getPublicCode
  }
}
