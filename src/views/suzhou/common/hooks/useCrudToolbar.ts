import { computed, inject, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import FormModal from '@/components/FormModal'
import { apiExportHandle } from '@/utils/export'
import { CheckedRowsInjectionKey, CrudTableRefInjectionKey, CurrentUserRoleInjectionKey, defaultUserRole } from '@/views/suzhou/common/types/crud'
import type { CrudMode, CrudQueryParams, CrudToolbarConfig } from '@/views/suzhou/common/types/crud'
import { getRoleQueryParams } from '@/views/suzhou/common/utils/params'
import { useStore } from 'vuex'

export const useCrudToolbar = <T extends Record<string, any>>(
  formModalRef: Ref<InstanceType<typeof FormModal> | undefined>,
  config: CrudToolbarConfig<T>
) => {
  const checkedData = inject<Ref<T[]>>(CheckedRowsInjectionKey as InjectionKey<Ref<T[]>>, ref([]) as Ref<T[]>)
  const materialTableRef = inject(CrudTableRefInjectionKey, ref())
  const isChecked = computed(() => checkedData.value.length !== 0)
  const formFields = ref(config.formFields)
  const mode = ref<CrudMode>('add')
  const formData = ref<CrudQueryParams>({})
  const getRowId = config.getRowId || ((row: T) => row.id)
  const store = useStore()
  const materialTaskLogRef = ref()
  const currentUserRole = inject(CurrentUserRoleInjectionKey, ref(defaultUserRole()))

  const openModal = async (modeFlag: CrudMode) => {
    if (modeFlag !== 'add' && (!checkedData.value || checkedData.value.length !== 1)) {
      ElMessage.warning(config.singleSelectMessage || '请选择一条数据进行操作!')
      return
    }
    mode.value = modeFlag
    if (modeFlag === 'edit' || modeFlag === 'view') {
      formData.value = { ...(checkedData.value[0] || {}) }
    } else {
      formData.value = config.getDefaultFormData ? config.getDefaultFormData() : {}
    }
    formModalRef.value?.open()
  }

  const handleSave = async (data: CrudQueryParams) => {
    const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
      status: 'warning'
    })
    if (type !== 'confirm') return

    formModalRef.value?.openLoading()
    try {
      const payload = config.buildSaveData ? config.buildSaveData(data, mode.value) : data
      const saveApi = mode.value == 'add' ? config.addApi : config.editApi
      const res = await saveApi({
        data: { ...payload },
        operator: {
          userId: store.getters.getUserMsg.id,
          userName: store.getters.getUserMsg.name
        }
      })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('保存成功!')
      formModalRef.value?.close()
      await materialTableRef.value?.reloadData()
    } catch (error) {
      ElMessage.error((error as Error).message || '保存失败!')
    } finally {
      formModalRef.value?.closeLoading()
    }
  }

  const handleClose = () => {
    formModalRef.value?.resetForm()
  }

  const deleteData = async () => {
    if (!checkedData.value || checkedData.value.length === 0) {
      ElMessage.warning(config.emptyDeleteMessage || '请至少选择一条数据进行删除!')
      return
    }

    const ids = checkedData.value.map((item) => getRowId(item)).filter((id): id is string | number => id !== '' && id !== null && id !== undefined)

    if (ids.length !== checkedData.value.length) {
      ElMessage.warning('选中数据缺少ID，无法删除!')
      return
    }

    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning'
    })
    if (type !== 'confirm') return

    try {
      const res = await config.deleteApi(ids)
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('删除成功!')
      await materialTableRef.value?.reloadData()
    } catch (error) {
      ElMessage.error((error as Error).message || '删除失败!')
    }
  }

  const deleteByMaterialCode = async () => {
    if (!checkedData.value || checkedData.value.length === 0) {
      ElMessage.warning(config.emptyDeleteMessage || '请至少选择一条数据进行删除!')
      return
    }
    const materialCodeList = checkedData.value.map(({ materialCode }: any) => materialCode)

    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning'
    })
    if (type !== 'confirm') return

    try {
      const params = {
        materialCodeList: materialCodeList,
        operator: {
          userId: store.getters.getUserMsg.id,
          userName: store.getters.getUserMsg.name
        }
      }
      const res = await config.deleteApi({ ...params })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('删除成功!')
      await materialTableRef.value?.reloadData()
    } catch (error) {
      ElMessage.error((error as Error).message || '删除失败!')
    }
  }

  // 导出
  const handleExport = async () => {
    if (!config.exportApi) {
      ElMessage.error('未配置导出接口')
      return
    }

    try {
      const params = {
        ...(materialTableRef.value?.getSearchParams?.() || {}),
        ...getRoleQueryParams(currentUserRole.value)
      }
      await apiExportHandle(params, config.exportFileName || '导出数据', config.exportApi, {
        useResponseFileName: config.useResponseFileName
      })
    } catch (error) {
      ElMessage.error((error as Error).message || '导出失败!')
    }
  }

  // 日志
  const handleLog = () => {
    materialTaskLogRef.value?.open()
  }

  return {
    mode,
    handleExport,
    isChecked,
    formData,
    formModalRef,
    formFields,
    handleSave,
    handleClose,
    openModal,
    deleteData,
    deleteByMaterialCode,
    handleLog,
    materialTaskLogRef
  }
}
