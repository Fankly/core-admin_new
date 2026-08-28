import { getMaintenanceByXmid } from '@/api/service/requirement'
import { formatSingleValue, getPublicCodeMap } from '@/utils/tableFormatter'
import { ElMessage } from 'element-plus'
import { reactive, toRef } from 'vue'
import { onMounted, ref } from 'vue'
import { Props, TabName } from '../types/MainnetOps'

export const useMainnetOps = (props: Props) => {
  const tabLabel = reactive({
    projectDevices: '运维项目挂接设备表',
    quotaInfo: '运维定额信息表',
    quotaTeams: '运维定额挂接班组表',
    quotaStationLines: '运维定额挂接站线表'
  })
  const selectData = toRef(props, 'selectData')
  const globalParams = toRef(props, 'globalParams')

  const tabName = ref<TabName>('projectDevices')
  const loading = ref(false)
  const gjsbLists = ref([])
  const dexxLists = ref([])
  const gjbzLists = ref([])
  const gjzxLists = ref([])

  const handleChangeTab = ({ prop }: { prop: { name: string } }) => {}

  // 调用接口
  const getTableData = async () => {
    loading.value = true
    try {
      if (globalParams.value) {
        await getPublicCodeMap([
          'PMS_SF_COM',
          'ASTNATURE_COM',
          'EQUIPSTATUS_COM',
          'EQUIPTYPE_COM',
          'PRJLIBRARY_COM',
          'PROCLASSIFICATION_COM',
          'VOLTAGELEVEL_COM',
          'PROFESSIONALKIND_COM',
          'QUOTAEQUIPTYPE_COM',
          'QUOTAFILLMETHOD_COM'
        ])
        const res = await getMaintenanceByXmid(globalParams.value.ID)
        if (res.success) {
          if (res.data) {
            gjsbLists.value = res.data['gjsbLists'] || []
            dexxLists.value = res.data['dexxLists'] || []
            gjbzLists.value = res.data['gjbzLists'] || []
            gjzxLists.value = res.data['gjzxLists'] || []
            tabLabel.projectDevices = `运维项目挂接设备表(${gjsbLists.value.length})`
            tabLabel.quotaInfo = `运维定额信息表(${dexxLists.value.length})`
            tabLabel.quotaTeams = `运维定额挂接班组表(${gjbzLists.value.length})`
            tabLabel.quotaStationLines = `运维定额挂接站线表(${gjzxLists.value.length})`
          }
        } else {
          throw new Error(res.msg)
        }
      }
    } catch (error) {
      const e = error as Error
      ElMessage.error(e.message)
    } finally {
      loading.value = false
    }
  }

  const initData = () => {
    getTableData()
  }

  onMounted(() => {
    initData()
  })

  const getFormattedValue = (value: any, codeKey: string, defaultValue = '') => {
    return formatSingleValue(value, codeKey, defaultValue)
  }

  return {
    tabLabel,
    gjsbLists,
    dexxLists,
    gjbzLists,
    gjzxLists,
    loading,
    tabName,
    getFormattedValue,
    handleChangeTab
  }
}
