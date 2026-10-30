import { inject, Ref, ref } from 'vue'
import { DropDownData, RowVO, TableProps } from '../../types'
import type ApprovalBatchEditModal from '@/views/service/approval/batch/components/ApprovalBatchEditModal.vue'
import { ElMessage } from 'element-plus'
import { activeData, cancleData, deleteData } from '@/api/service/IhhsMeeting/approval/batch'
import { VXETable } from 'vxe-table'
import type HelpModal from '@/components/HelpModal/index.vue'

export const useBatchOperation = (props: TableProps) => {
  const selectedData = inject<Ref<RowVO[]>>('selectedData')!
  const approvalBatchEditModalRef = ref<InstanceType<typeof ApprovalBatchEditModal>>()
  const helpModalRef = ref<InstanceType<typeof HelpModal>>()

  const handleApprovalBatchAdd = () => {
    approvalBatchEditModalRef.value?.acceptParams({
      opType: 'ADD',
      title: '评审批次-新增'
    })
  }
  const handleApprovalBatchEdit = () => {
    // 获取选择数据
    if (selectedData.value.length !== 1) {
      ElMessage.warning('请选择一条数据,进行修改操作!')
      return
    }
    if (selectedData.value[0].status === '1') {
      ElMessage.warning('已激活的数据,不能进行编辑操作!')
      return
    }
    approvalBatchEditModalRef.value?.acceptParams({
      opType: 'EDIT',
      title: '评审批次-编辑',
      selectedData: selectedData.value[0]
    })
  }
  const handleApprovalBatchRemove = async () => {
    // 获取选择数据
    if (selectedData.value.length === 0) {
      ElMessage.warning('请选择一条数据,进行删除操作!')
      return
    }
    const isActive = selectedData.value.some((item) => item.status === '1')
    if (isActive) {
      ElMessage.warning('已激活的数据,不能进行删除操作!')
      return
    }
    const type = await VXETable.modal.confirm(`是否确认删除？`, '提示', {
      status: 'warning',
      cancelButtonText: '否',
      confirmButtonText: '是'
    })
    if (type !== 'confirm') return
    try {
      const ids = selectedData.value.map((item) => item.id)
      const res = await deleteData(ids)
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('删除成功!')
      props.search()
    } catch (error) {
      ElMessage.error((error as Error).message)
    }
  }
  const handleApprovalBatchActive = async () => {
    // 获取选择数据
    if (selectedData.value.length === 0) {
      ElMessage.warning('请选择一条数据,进行激活操作!')
      return
    }
    const isActive = selectedData.value.some((item) => item.status === '1')
    if (isActive) {
      ElMessage.warning('已激活的数据,不能再次进行激活操作!')
      return
    }
    const type = await VXETable.modal.confirm(`是否确认激活？`, '提示', {
      status: 'warning',
      cancelButtonText: '否',
      confirmButtonText: '是'
    })
    if (type !== 'confirm') return
    try {
      const ids = selectedData.value.map((item) => item.id)
      const res = await activeData(ids)
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('激活成功!')
      props.search()
    } catch (error) {
      ElMessage.error((error as Error).message)
    }
  }

  const handleApprovalBatchCancel = async () => {
    // 获取选择数据
    if (selectedData.value.length === 0) {
      ElMessage.warning('请选择一条数据,进行激活取消操作!')
      return
    }
    const isActive = selectedData.value.some((item) => item.status === '0')
    if (isActive) {
      ElMessage.warning('未激活的数据,不能再次进行取消激活操作!')
      return
    }
    const type = await VXETable.modal.confirm(`是否确认取消激活？`, '提示', {
      status: 'warning',
      cancelButtonText: '否',
      confirmButtonText: '是'
    })
    if (type !== 'confirm') return
    try {
      const ids = selectedData.value.map((item) => item.id)
      const res = await cancleData(ids)
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('取消激活成功!')
      props.search()
    } catch (error) {
      ElMessage.error((error as Error).message)
    }
  }

  const dropDownMenu = ref<DropDownData[]>([
    {
      label: '评审批次管理',
      permission: 'APPROVAL_BATCH',
      type: 'dropdown',
      children: [
        {
          label: '评审批次新增',
          permission: 'APPROVAL_BATCH_ADD',
          click: handleApprovalBatchAdd
        },
        {
          label: '评审批次编辑',
          permission: 'APPROVAL_BATCH_EDIT',
          click: handleApprovalBatchEdit
        },
        {
          label: '评审批次删除',
          permission: 'APPROVAL_BATCH_DELETE',
          click: handleApprovalBatchRemove
        },
        {
          label: '评审批次激活',
          permission: 'APPROVAL_BATCH_ACTIVE',
          click: handleApprovalBatchActive,
          type: 'button'
        },
        {
          label: '批次激活取消',
          permission: 'APPROVAL_BATCH_CANCEL',
          click: handleApprovalBatchCancel,
          type: 'button'
        }
      ]
    }
  ])

  const getHelpMessageHandle = () => {
    helpModalRef.value.showModal = true
  }

  return {
    helpModalRef,
    approvalBatchEditModalRef,
    getHelpMessageHandle,
    dropDownMenu
  }
}
