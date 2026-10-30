import { Result } from '@/api/mbz'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { VXETable } from 'vxe-table'
import { IObject } from '@/types/interface'

export const useOperation = (
  pageInfo: any,
  formParams: any,
  searchHandle: () => void,
  proTableRef: any,
  formModalRef: any,
  saveApi: (params: any) => Promise<Result>,
  deleteApi: (params: any) => Promise<Result>
) => {
  const mode = ref<'add' | 'edit' | 'view'>('add')
  const formData = ref<IObject>({})
  //新增,编辑保存功能
  const handleSave = async (data: any) => {
    const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      formModalRef.value.openLoading()
      try {
        const res = await saveApi(data)
        if (!res.success) throw new Error(res.msg)
        ElMessage.success('保存成功!')
        clearSelect()
        // 处理保存逻辑
        formModalRef.value?.close()
      } catch (error) {
        ElMessage.error((error as Error).message || '保存失败!')
      } finally {
        formModalRef.value.closeLoading()
      }
    }
  }

  //删除
  const handleDelete = async (list: any) => {
    const isDel = list.some((item: any) => item.zt !== '1')
    if (isDel) {
      ElMessage.warning('初始状态的版本数据可删除，其它状态不允许删除！')
      return
    }
    const ids = list.map((item: any) => item.id)
    // 处理删除逻辑
    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      pageInfo.loading = true
      try {
        const res = await deleteApi(ids)
        if (!res.success) throw new Error(res.msg)
        ElMessage.success('删除成功!')
      } catch (error) {
        ElMessage.error((error as Error).message || '删除失败!')
      } finally {
        pageInfo.loading = false
        clearSelect()
      }
    }
  }

  // 操作功能新增-编辑-查看
  const openModal = async (modeFlag: 'add' | 'edit' | 'view', row: any[]) => {
    mode.value = modeFlag
    if (modeFlag === 'add') {
      const nd = formParams.nd || ''
      formData.value = {
        nd,
        sfyap: '0'
      }
    } else {
      if (row) {
        formData.value = row[0]
      } else {
        formData.value = {}
      }
    }
    formModalRef.value?.open()
  }
  // 清除表格选择状态
  const clearSelect = () => {
    formModalRef.value.resetForm()
    searchHandle()
  }

  // 关闭功能
  const handleClose = () => {
    formModalRef.value.resetForm()
  }

  return {
    handleSave,
    openModal,
    handleClose,
    formData,
    mode,
    handleDelete
  }
}
