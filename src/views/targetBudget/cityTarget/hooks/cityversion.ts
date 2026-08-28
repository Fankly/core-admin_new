import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProcessMessage, getPublicData } from '@/api/common' //公共代码
import { getPage, add, edit, remove, getRealDwId } from '@/api/targetBudget/cityTarget'
import { formatNumValue } from '@/utils/utils'
import { useProcess } from '@/hooks/useProcess'

export const useVersion = () => {
  const userDialogRef = ref()
  const isShowPage = ref<boolean>(false)
  const tableRef = ref()
  const modalRef = ref()
  const title = ref<any>('')
  const nd = ref<any>(0)
  const formData = ref<any>()
  const reportTable = ref()
  const matchTable = ref()
  const gkjbList = ref<any[]>([])
  const statusList = ref<any[]>([])
  const userInfo = ref<any>()
  const realDwId = ref<number>(0)
  const processData = reactive({
    isShowLog: false,
    isShowDialog: false,
    searchApi: getProcessMessage,
    compName: null,
    id: ''
  })
  const btnList = ref<any[]>([
    {
      label: 'VERSION',
      value: '版本管理',
      isSelected: false,
      type: 'children',
      children: [
        {
          label: 'ADD',
          value: '版本创建',
          isSelected: false,
          type: 'normal'
        },
        {
          label: 'EDIT',
          value: '版本编辑',
          isSelected: true,
          type: 'normal'
        },
        {
          label: 'MATCHING',
          value: '版本比对',
          isSelected: true,
          type: 'normal'
        },
        {
          label: 'DELETE',
          value: '版本删除',
          isSelected: true,
          type: 'normal'
        }
      ]
    },
    {
      label: 'ALLOCATION',
      value: '目标值平衡调整',
      isSelected: false,
      type: 'children',
      children: [
        {
          label: 'MBZEDIT',
          value: '目标值调整',
          isSelected: false,
          type: 'normal'
        },
        {
          label: 'MBZVIEW',
          value: '目标值查看',
          isSelected: false,
          type: 'normal'
        }
      ]
    },
    {
      label: 'PROCESS',
      value: '流程履历',
      isSelected: false,
      type: 'normal'
    }
  ])

  //新增编辑回调
  const showModal = async (val: any) => {
    const api: any = val.title == '版本创建' ? add : edit
    const res: any = await api({ ...val.rmarkData, remark: val.rmarkData?.remake })
    if (res.success) {
      ElMessage.success(`${val.title}成功`)
      closeAll()
    } else {
      ElMessage.error(res.msg)
    }
  }

  // 回调
  const pageType = (val: any) => {
    if (val.success) {
      isShowPage.value = true
    } else {
      ElMessage.error('仅限一级单位访问！')
      isShowPage.value = false
    }
  }
  // 按钮点击事件
  const clickBtn = async (val: any) => {
    try {
      title.value = val.value
      const selectedItem = val.selectedList?.[0]
      nd.value = val.nd
      if (!['ADD'].includes(val.label)) {
        if (val.selectedList.length != 1 && val.label != 'MATCHING') {
          return ElMessage.warning('请选择一条数据')
        }

        if (val.selectedList.length != 2 && val.label == 'MATCHING') {
          return ElMessage.warning('请选择两条数据进行比对')
        }
        if (['MBZEDIT', 'EDIT', 'DELETE'].includes(val.label) && !['1', '4'].includes(selectedItem.status)) {
          return ElMessage.warning(`状态为：【${selectedItem.statusName}】，无法【${val.value}】`)
        }
      }
      if (['DELETE'].includes(val.label)) {
        ElMessageBox.confirm(`是否确定${val.value}？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(async () => {
            const res = await remove(selectedItem.versionId)
            if (res.success) {
              ElMessage.success(`${val.value}成功`)
              closeAll()
            } else {
              ElMessage.error(res.msg)
            }
          })
          .catch((error: any) => {
            ElMessage.info('已取消')
          })
      } else if (['MBZEDIT', 'MBZVIEW'].includes(val.label)) {
        if (realDwId.value == null) return ElMessage.warning('仅限一级单位访问！')
        formData.value = {
          versionId: val.selectedList[0].versionId,
          versionName: val.selectedList[0].versionName,
          versionNo: val.selectedList[0].versionNo,
          nd: val.nd,
          title: val.value,
          dwId: realDwId.value,
          isShow: val.label == 'MBZEDIT'
        }
        reportTable.value.userInfo = userInfo.value
        reportTable.value.isShowModal = true
        reportTable.value.getHeaderData(formData.value)
      } else if (val.label == 'MATCHING') {
        const versionIdList = val.selectedList.map(({ versionId }: any) => versionId)
        formData.value = {
          versionIdList: versionIdList,
          nd: val.nd,
          dwId: realDwId.value
        }
        matchTable.value.userInfo = userInfo.value
        matchTable.value.isShowModal = true
        matchTable.value.getHeaderData(formData.value)
      } else if (val.label == 'PROCESS') {
        const selectedData = val.selectedList.map((item: any) => ({
          ...item,
          id: item.versionId
        }))
        useProcess(selectedData, processData)
      } else {
        const btnTitle = '版本创建'
        const addParams = { dwId: realDwId.value }
        const editParams = {
          versionId: selectedItem?.versionId,
          versionName: selectedItem?.versionName,
          remake: selectedItem?.remark,
          dwId: selectedItem?.dwId
        }
        modalRef.value.rmarkData = val.value == btnTitle ? addParams : editParams
        modalRef.value.isShowModel = true
      }
    } catch (error) {
      const e = error as Error
      ElMessage.error(e.message)
    }
  }

  const getPass = (val: any) => {
    if (val) {
      tableRef.value.proTableRef.getTableList()
      tableRef.value.proTableRef.clearSelection()
    }
  }

  // 获取单位id
  const getDwId = async (val: number) => {
    const res: any = await getRealDwId(val)
    if (res.success && res.data && res.data != null) {
      realDwId.value = res.data
      await isPass(userInfo.value.org_id)
    } else {
      ElMessage.error('仅限一级单位访问！')
    }
  }
  const isPass = async (val: any) => {
    try {
      if (val) {
        const typeLits = ['primary', 'warning', 'success', 'danger', 'info']
        const status = await getPublicData('SYTC_MBZ_VER_STATUS')
        if (status.success && status.data) {
          status.data.forEach((item: any, index: any) => {
            item.tagType = typeLits[index]
          })
          statusList.value.push(...status.data)
        }
        const gkjb = await getPublicData('MBZ_GKJB')
        if (gkjb.success) {
          gkjbList.value = gkjb.data
        }
        const root: any = await getPublicData('NDCX')
        if (root.success && root.data.length !== 0) {
          tableRef.value.formData = {
            nd: new Date().getFullYear().toString(),
            dwId: realDwId.value
          }
          tableRef.value.ndList = root.data
          closeAll()
        }
      }
    } catch (error: any) {
      const e = error as Error
      ElMessage.error(e.message)
    }
  }
  // 关闭
  const closeAll = () => {
    modalRef.value?.closeHandle()
    tableRef.value.proTableRef?.getTableList()
    tableRef.value.proTableRef?.clearSelection()
  }

  // 权限获取
  const getRoleHandle = async () => {
    userInfo.value = { ...userDialogRef.value.userMsg }
    const isQuery = userDialogRef.value.isQuery
    if (isQuery) {
      await getDwId(Number(userInfo.value.org_id))
    }
  }

  const tableColumns = reactive([
    { type: 'selection', width: 50 },
    { type: 'index', width: 50, label: '序号' },
    { prop: 'nd', label: '年度', width: '80' },
    {
      prop: 'status',
      label: '版本状态',
      search: { el: 'select', order: 2 },
      enum: statusList.value,
      tag: true,
      fieldNames: { label: 'name', value: 'code' },
      width: '100'
      // render: ({ row }: any) => {
      //   return row.statusName
      // }
    },
    { prop: 'dwName', label: '单位名称', width: '180' },
    { prop: 'versionNo', label: '版本编号', width: '130' },
    {
      prop: 'versionName',
      label: '版本名称',
      width: '300',
      search: {
        el: 'input',
        order: 1,
        props: {
          maxlength: 60
        }
      }
    },
    {
      prop: 'currentMbzSum',
      label: '当前目标值',
      width: '180',
      align: 'right',
      headerAlign: 'center',
      render: ({ row }: any) => {
        const value = row.currentMbzSum
        if (value === undefined || value === null) return '-'
        return formatNumValue(value, 6)
      }
    },
    {
      prop: 'adjustedMbzSum',
      label: '调整后目标值',
      width: '180',
      align: 'right',
      headerAlign: 'center',
      render: ({ row }: any) => {
        const value = row.adjustedMbzSum
        if (value === undefined || value === null) return '-'
        return formatNumValue(value, 6)
      }
    },
    { prop: 'activateTime', label: '激活时间', width: '180' },
    { prop: 'createTime', label: '创建日期', width: '180' },
    { prop: 'createUserName', label: '创建人', width: '80' },
    { prop: 'remark', label: '备注', width: '300' }
  ])
  return {
    isShowPage,
    tableRef,
    userDialogRef,
    btnList,
    tableColumns,
    clickBtn,
    pageType,
    getRoleHandle,
    showModal,
    getPage,
    modalRef,
    reportTable,
    title,
    processData,
    nd,
    getPass,
    formData,
    matchTable,
    gkjbList
  }
}
