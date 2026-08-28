import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPublicData, getYjdw } from '@/api/common' //公共代码
import { remove, add, edit, issue, getPage, commonFiled } from '@/api/deptDataVersion/index'

// busiType: string //报表编码

export const handleTable = (busiType: string) => {
  const userDialogRef = ref()
  const pageInfo = reactive<any>({
    loading: false,
    isShowPage: false
  })
  const tableRef = ref()
  const modalRef = ref()
  const title = ref<any>('')
  const nd = ref<any>(0)
  const userInfo = ref<any>()
  const versionId = ref<string>('')

  const protableCurdRef = ref() //数据填报
  const yjdwList = ref<any[]>([])

  const btnList = ref<any[]>([
    {
      label: 'ADD',
      value: '版本创建',
      isSelected: false,
      type: 'normal'
    },
    {
      label: 'EDIT',
      value: '版本修改',
      isSelected: true,
      type: 'normal'
    },
    {
      label: 'DELETE',
      value: '版本删除',
      isSelected: true,
      type: 'normal'
    },
    {
      label: 'ALLOTSDW',
      value: '版本下达',
      isSelected: true,
      type: 'normal'
    },
    {
      label: 'VIEW',
      value: '填报处理/查看',
      isSelected: true,
      type: 'normal'
    },
    {
      label: 'APPROVAL',
      value: '版本归档',
      isSelected: true,
      type: 'normal'
    }
  ])

  const submitbtn = ref<any[]>([
    {
      label: 'SUBMIT',
      value: '版本填报/查看',
      isSelected: false,
      type: 'normal'
    }
  ])

  //新增编辑回调
  const showModal = async (val: any) => {
    pageInfo.loading = true
    const versionParams = {
      ...val.rmarkData,
      remark: val.rmarkData.remake,
      busiType: busiType
    }
    const api: any = val.title == '版本创建' ? add : edit
    let res: any = await api(versionParams)
    if (res.success) {
      ElMessage.success(`${val.title}成功`)
      closeAll()
    } else {
      pageInfo.loading = false
      ElMessage.error(res.msg)
    }
  }
  // 回调
  const pageType = (val: any) => {
    if (val.success) {
      pageInfo.isShowPage = true
    } else {
      ElMessage.error('仅限省公司访问')
      pageInfo.isShowPage = false
    }
  }
  // 按钮点击事件
  const clickBtn = async (val: any) => {
    try {
      title.value = val.value
      nd.value = val.nd
      if (!['ADD'].includes(val.label)) {
        if (val.selectedList.length != 1) {
          return ElMessage.warning('请选择一条数据')
        }
      }
      const isDraft = val.selectedList.every((item: any) => item.status == '1')
      const isIssue = val.selectedList.every((item: any) => item.status == '2')

      if (['DELETE', 'ALLOTSDW'].includes(val.label)) {
        if (!isDraft) return ElMessage.warning(`非【草稿】状态无法${val.value}`)
        ElMessageBox.confirm(`是否确定${val.value}？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(async () => {
            pageInfo.loading = true
            const params: any = {
              versionId: val.selectedList[0].versionId
            }
            const api: any = val.label == 'DELETE' ? remove : issue
            let res = await api(params)
            if (res.success) {
              ElMessage.success(`${val.value}成功`)
              closeAll()
            } else {
              pageInfo.loading = false
              ElMessage.error(res.msg)
            }
          })
          .catch((error: any) => {
            console.log(error)
          })
      } else if (['SUBMIT', 'VIEW'].includes(val.label)) {
        if (isDraft) return ElMessage.warning(`【草稿】状态无法${val.value}`)
        const label = val.selectedList[0].status == '3' ? 'SHOW' : val.label
        versionId.value = val.selectedList[0].versionId
        console.log(label,'label');
        protableCurdRef.value.userType = label
        protableCurdRef.value.clearSelect()
        protableCurdRef.value.isShowModal = true
      }else if(val.label=="APPROVAL"){
        if (!isIssue) return ElMessage.warning(`非【已下发】状态无法${val.value}`)
        ElMessageBox.confirm(`是否确定${val.value}？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(async () => {
            pageInfo.loading = true
            const params: any = {
              versionId: val.selectedList[0].versionId
            }
            let resT = await commonFiled(params)
            if (resT.success) {
              ElMessage.success(`${val.value}成功`)
              closeAll()
            } else {
              pageInfo.loading = false
              ElMessage.error(resT.msg)
            }
          })
          .catch((error: any) => {
            console.log(error)
          })
      }  else {
        if (val.label == 'EDIT' && !isDraft) return ElMessage.warning(`非【草稿】状态无法${val.value}`)
        modalRef.value.rmarkData =
          val.label == 'ADD'
            ? {}
            : {
                versionId: val.selectedList[0]?.versionId,
                versionName: val.selectedList[0]?.versionName,
                remake: val.selectedList[0]?.remark
              }
        modalRef.value.isShowModel = true
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
    }
  }

  const isPass = async () => {
    try {
      pageInfo.isShowPage = false
      const root: any = await getPublicData('NDCX')
      if (root.success && root.data.length !== 0) {
        tableRef.value.formData = {
          nd: new Date().getFullYear().toString(),
          busiType: busiType
        }
        tableRef.value.ndList = root.data
        closeAll()
      }
    } catch (error: any) {
      ElMessage.error((error as Error).message)
    }
  }
  // 关闭
  const closeAll = () => {
    modalRef.value?.closeHandle()
    tableRef.value.proTableRef?.getTableList()
    tableRef.value.proTableRef?.clearSelection()
    pageInfo.loading = false
  }

  // 获取一级单位
  const getYjdwData = async () => {
    const yjdwRes = await getYjdw({
      dwId: userInfo.value.dwId,
      bmId: userInfo.value.deptId
    })
    if (yjdwRes.success) {
      yjdwList.value.push(...yjdwRes.data)
    }
  }

  // 权限获取
  const getRoleHandle = async () => {
    const isQuery = userDialogRef.value.isQuery
    const userInfOther = userDialogRef.value.userMsg
    if (isQuery) {
      userInfo.value = {
        deptId: userInfOther.specialorgid,
        deptName: userInfOther.specialorgname,
        dwId: userInfOther.org_id,
        dwName: userInfOther.org_name,
        roleId: userInfOther.role_id,
        roleCode: userInfOther.code,
        spRoleId: userInfOther.id,
        specialorgcode: userInfOther.specialorgcode
      }
      await isPass()
      await getYjdwData()
    }
  }

  const tableColumns = reactive([
    { type: 'selection', width: 50 },
    { type: 'index', width: 50, label: '序号' },
    { prop: 'nd', label: '年度', width: '80' },
    { prop: 'versionNo', label: '版本编号', width: '100' },
    {
      prop: 'versionName',
      label: '版本名称',
      width: '300',
      search: { el: 'input', order: 1 }
    },
    {
      prop: 'status',
      label: '版本状态',
      search: { el: 'select', order: 2 },
      enum: () => getPublicData('DY_VER_STATUS_COM'),
      fieldNames: { label: 'name', value: 'code' },
      width: '100'
    },
    { prop: 'createTime', label: '创建日期', width: '180' },
    { prop: 'createUserName', label: '创建人', width: '80' },
    { prop: 'remark', label: '备注' }
  ])

  return {
    userDialogRef,
    tableRef,
    modalRef,
    pageInfo,
    btnList,
    submitbtn,
    tableColumns,
    clickBtn,
    pageType,
    getPage,
    getRoleHandle,
    showModal,
    title,
    nd,
    userInfo,
    protableCurdRef,
    yjdwList,
    versionId
  }
}
