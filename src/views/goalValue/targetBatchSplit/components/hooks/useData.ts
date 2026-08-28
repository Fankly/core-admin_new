import { getYearData } from '@/api/common'
import proTable from '@/components/ProTable/index.vue'
import { ElMessage } from 'element-plus'
import { ref, reactive } from 'vue'

export const useData = () => {
  const proTableRef = ref<InstanceType<typeof proTable>>()
  const nd = ref('')
  const modalParams = ref()
  const initParam = ref<Record<string, any>>({})
  const isShowModal = ref(false)
  const loading = ref(false)
  const ndList = ref<
    {
      code: string
      name: string
    }[]
  >([])
  const tableColumns = reactive<any>([
    { type: 'index', width: 80, label: '序号' },
    {
      prop: 'nd',
      label: '年度',
      width: '80',
      search: {
        el: 'select',
        order: 3
      },
      enum: ndList.value,
      fieldNames: { label: 'yearName', value: 'yearCode' }
    },
    {
      prop: 'versionCode',
      label: '版本编码',
      width: '140'
    },
    {
      prop: 'versionName',
      label: '版本名称',
      width: '280',
      search: {
        el: 'input',
        order: 1
      }
    },
    {
      prop: 'protypeName',
      label: '项目类型',
      width: '180',
      search: {
        el: 'input',
        order: 4
      }
    },
    {
      prop: 'dwName',
      label: '单位名称',
      width: '180',
      search: {
        el: 'input',
        order: 2
      }
    },
    {
      prop: 'xgqValue',
      label: '修改前数值',
      width: '120'
    },
    {
      prop: 'xghValue',
      label: '修改后数值',
      width: '120'
    },
    {
      prop: 'jhsj',
      label: '版本激活时间',
      width: '180'
    },
    {
      prop: 'jhr',
      label: '版本激活人',
      width: '120'
    }
  ])

  const initParams = async () => {
    const res = await getYearData()
    if (res.success) {
      ndList.value.push(...res.data)
    } else {
      ElMessage.error(res.msg)
    }
  }

  return {
    modalParams,
    initParams,
    nd,
    ndList,
    tableColumns,
    initParam,
    proTableRef,
    loading,
    isShowModal
  }
}
