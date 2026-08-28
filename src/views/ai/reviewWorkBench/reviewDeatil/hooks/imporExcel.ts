import { ref, reactive } from 'vue'
import { apiExportHandle } from '@/utils/export'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'

export const exportFun = (
  userInfo: any, //参数
  templateApi: (params: any) => Promise<any>, //模板下载API
  importForApi: (params: any) => Promise<any>, //导出API
  getPageList: () => void //刷新数据
) => {
  const store = useStore()
  const importRef = ref()
  // 导入  批量维护
  const unitDescImportHandle = () => {
    const newParmas = {
      expertId: userInfo.value.expertId,
      meetingId: userInfo.value.meetingId,
      spOrgId: userInfo.value.deptId,
      spRoleId: userInfo.value.spRoleId
    }
    const tempApi: any = templateApi
    const importApi: any = importForApi
    if (!importApi) return
    const params = {
      title: '评审意见',
      topName: '预审意见下载',
      bottomName: '评审意见上传',
      tempApi: (importParams: any) => {
        const newImportParams = {
          ...newParmas,
          excelFormData: importParams.excelFormData
        }
        return tempApi(newImportParams)
      },
      importApi: (importParams: any) => {
        const newImportParams = {
          ...newParmas,
          excelFormData: importParams.excelFormData
        }
        return importApi(newImportParams)
      },
      getTableList: getPageList,
      specialorgid: userInfo.value.deptId
    }
    importRef.value.acceptParams(params)
  }

  //下载评审意见汇总表
  const exportStage = async () => {
    try {
      const params = {
        expertId: userInfo.value.expertId,
        meetingId: userInfo.value.meetingId,
        dwId: userInfo.value.dwId,
        bmId: userInfo.value.deptId || userInfo.value.bmId,
        roleId: userInfo.value.roleId
      }
      const fileName = '评审项目清单表'
      apiExportHandle(params, fileName, templateApi)
    } catch (e) {
      const error = e as Error
      ElMessage.error(error.message)
    }
  }

  return {
    importRef,
    unitDescImportHandle,
    exportStage
  }
}
