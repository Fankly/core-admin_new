import { reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { getPublicCodeList } from '@/api/common'

export const csqrParams = (userInfo?: any) => {
  const store = useStore()
  const route = useRoute()
  const router = useRouter()
  const searchForm = ref<any>({ dept: '', xmmc: '', zyxf: '', creator: '', zxcsstatus: '', zxcsspstatus: '' })
  const helpModalRef = ref()
  const zxcspsStatusList = ref<any[]>([])
  const zxcsStatusList = ref<any[]>([])
  const lhpsqkList = ref<any[]>([])
  const deptList = ref<any[]>([])
  const zyxfList = ref<any[]>([])
  const pagination = reactive({
    page: 1,
    limit: 100,
    total: 0 as number | string
  })

  const getCodeList = async () => {
    const code: any = await getPublicCodeList({
      codes: ['ZXCSSPSZT_COM', 'ZXCSBM_COM', 'ZXCSZYXF_COM', 'ZXCS_STATUS', 'LHPSQK_COM']
    })
    zxcsStatusList.value = code.data['ZXCS_STATUS']
    zxcspsStatusList.value = code.data['ZXCSSPSZT_COM']
    deptList.value = code.data['ZXCSBM_COM']
    zyxfList.value = code.data['ZXCSZYXF_COM']
    lhpsqkList.value = code.data['LHPSQK_COM']
  }

  const getHelpMessageHandle = () => {
    if (helpModalRef.value) {
      helpModalRef.value.showModal = true
    }
  }

  const cellStyle = ({ row, column }: any) => {
    if (column.field == 'xmmc') {
      return {
        color: 'var(--color-primary, #00857c)',
        cursor: 'pointer'
      }
    }
  }

  const cellClick = async ({ row, column }: any) => {
    if (column.field == 'xmmc') {
      router.push({
        name: '/service/xmcs/index',
        params: {
          xmmc: row.xmmc,
          roleId: userInfo.value.roleId,
          specialorgid: userInfo.value.deptId,
          spRoleId: userInfo.value.spRoleId
        }
      })
    }
  }

  const gridEvent = {
    cellClick: cellClick
  }

  const gridOptions = reactive<any>({
    stripe: true,
    border: true,
    loading: false,
    headerAlign: 'center',
    align: 'center',
    height: '100%',
    rowConfig: {
      height: 32
    },
    columnConfig: {
      resizable: true
    },
    size: 'mini',
    cellStyle: cellStyle,
    data: [],
    columns: [
      { type: 'checkbox', width: 50, fixed: 'left' },
      { field: 'dept', title: '部门', width: 80, fixed: 'left' },
      { field: 'zyxf', title: '专业', width: 80, fixed: 'left' },
      { field: 'yj', title: '一级分类', width: 100, fixed: 'left' },
      { field: 'ej', title: '二级分类', width: 100, fixed: 'left' },
      { field: 'sj', title: '三级分类', width: 100, fixed: 'left' },
      { field: 'xmmc', title: '项目名称', width: 240, fixed: 'left', align: 'left', headerAlign: 'center' },
      { field: 'zxcsstatus', title: '测算状态', width: 120 },
      { field: 'zxcsspstatus', title: '评审状态', width: 120 },
      {
        title: '草稿(编制单位)',
        children: [
          { field: 'cityYwSpOpinion', title: '业务审核说明', width: 430, align: 'left', headerAlign: 'center' },
          { field: 'cityCwSpOpinion', title: '财务审核说明', width: 430, align: 'left', headerAlign: 'center' }
        ]
      },
      {
        title: '初稿(联合会审)',
        children: [
          { field: 'provinceFzSpOpinion', title: '发展专业审核说明', width: 430, align: 'left', headerAlign: 'center' },
          { field: 'provinceSbSpOpinion', title: '业务专业审核说明', width: 430, align: 'left', headerAlign: 'center' },
          { field: 'provinceCwSpOpinion', title: '财务专业审核说明', width: 430, align: 'left', headerAlign: 'center' },
          { field: 'provinceJyySpOpinion', title: '经研院审核说明', width: 430, align: 'left', headerAlign: 'center' }
        ]
      }
    ]
  })

  const gridGcOptions = reactive<any>({
    stripe: true,
    border: true,
    loading: false,
    headerAlign: 'center',
    align: 'center',
    height: '100%',
    rowConfig: {
      height: 32
    },
    columnConfig: {
      resizable: true
    },
    size: 'mini',
    cellStyle: cellStyle,
    data: [],
    columns: [
      { type: 'checkbox', width: 50, fixed: 'left' },
      { field: 'dept', title: '部门', width: 80, fixed: 'left' },
      { field: 'zyxf', title: '专业', width: 80, fixed: 'left' },
      { field: 'yj', title: '一级分类', width: 100, fixed: 'left' },
      { field: 'ej', title: '二级分类', width: 100, fixed: 'left' },
      { field: 'sj', title: '三级分类', width: 100, fixed: 'left' },
      { field: 'xmmc', title: '项目名称', width: 300, fixed: 'left', align: 'left', headerAlign: 'center' },
      { field: 'zxcsstatus', title: '测算状态', width: 120 },
      { field: 'zxcsspstatus', title: '评审状态', width: 120 },
      { field: 'dwType', title: '单位', width: 100 },
      { field: 'cwSpOpinion', title: '审核说明', width: 300, align: 'left', headerAlign: 'center' }
    ]
  })

  const gridSpOptions = reactive<any>({
    stripe: true,
    border: true,
    loading: false,
    headerAlign: 'center',
    align: 'center',
    height: '100%',
    rowConfig: {
      height: 32
    },
    columnConfig: {
      resizable: true
    },
    cellStyle: cellStyle,
    size: 'mini',
    data: [],
    columns: [
      { type: 'checkbox', width: 50 },
      { field: 'deptName', title: '部门', width: 80 },
      { field: 'zyxfName', title: '专业', width: 80 },
      { field: 'yj', title: '一级分类', width: 120 },
      { field: 'ej', title: '二级分类', width: 120 },
      { field: 'sj', title: '三级分类', width: 120 },
      { field: 'xmmc', title: '项目名称', width: 300, align: 'left', headerAlign: 'center' },
      { field: 'zxcsstatusName', title: '测算状态', width: 120 },
      { field: 'zxcsspstatusName', title: '评审状态', width: 120 }
    ]
  })
  return {
    store,
    route,
    router,
    gridOptions,
    gridSpOptions,
    searchForm,
    helpModalRef,
    getHelpMessageHandle,
    zxcsStatusList,
    zxcspsStatusList,
    lhpsqkList,
    deptList,
    zyxfList,
    getCodeList,
    pagination,
    gridGcOptions,
    gridEvent
  }
}
