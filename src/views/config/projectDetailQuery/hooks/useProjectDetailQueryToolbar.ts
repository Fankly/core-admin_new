import { ElMessage } from 'element-plus'
import { computed, inject, Ref, ref } from 'vue'
import FormModal, { FormField } from '@/components/FormModal'
import { BaseMethod } from '@/api/base/BaseMethod'
import { integerRules } from '@/utils/rules'
import { RowVO } from '@/views/config/projectDetailQuery/types/projectDetailQuery'
import { VXETable } from 'vxe-table'
import { IObject } from '@/types/interface'
import type projectDetailQueryTable from '@/views/config/projectDetailQuery/modules/projectDetailQueryTable.vue'

export const useProjectDetailQueryToolbar = () => {
  const formModalRef = ref<InstanceType<typeof FormModal>>()
  const checkedData = inject<Ref<RowVO[]>>('checkedData', ref([]))
  const dataType = inject<Ref<string>>('dataType', ref('1'))
  const projectDetailQueryTableRef = inject<Ref<InstanceType<typeof projectDetailQueryTable>>>('projectDetailQueryTableRef', ref(null))
  const isChecked = computed(() => checkedData.value.length !== 0)
  //  表单字段
  const formFields = ref<FormField[]>([
    {
      prop: 'id',
      label: 'id',
      type: 'hidden'
    },
    {
      prop: 'name',
      label: '字段名',
      maxlength: 60,
      type: 'input',
      required: true
    },
    {
      prop: 'code',
      label: '字段编码',
      type: 'input',
      maxlength: 60,
      required: true
    },
    {
      prop: 'isShow',
      label: '是否默认展示',
      type: 'select',
      options: [
        {
          label: '否',
          value: '0'
        },
        {
          label: '是',
          value: '1'
        }
      ],
      required: true
    },
    {
      prop: 'sort',
      label: '排序',
      type: 'input',
      maxlength: 10,
      required: true,
      rules: integerRules()
    }
  ])
  const mode = ref<'add' | 'edit' | 'view'>('add')
  const baseMethod = new BaseMethod()
  const formData = ref({})
  // 操作功能新增-编辑-查看
  const openModal = async (modeFlag: 'add' | 'edit' | 'view') => {
    if (modeFlag !== 'add' && (!checkedData.value || checkedData.value.length !== 1)) {
      ElMessage.warning('请选择一条数据进行操作!')
      return
    }
    mode.value = modeFlag
    const data = {}
    if (modeFlag === 'edit' || modeFlag == 'view') {
      formData.value = checkedData.value[0] || {}
    } else {
      formData.value = {
        isShow: '1'
      }
    }
    Object.assign(formData.value, data)
    formModalRef.value?.open()
  }

  const handleSave = async (data: IObject) => {
    const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      formModalRef.value.openLoading()
      try {
        const res = await baseMethod.post(
          '/xmmxConfig/saveOrUpdate',
          [
            {
              ...data,
              dataType: dataType.value
            }
          ],
          {},
          false
        )
        if (!res.success) throw new Error(res.msg)
        ElMessage.success('保存成功!')
        // 处理保存逻辑
        formModalRef.value?.close()
        await projectDetailQueryTableRef.value?.searchData()
      } catch (error) {
        ElMessage.error((error as Error).message || '保存失败!')
      } finally {
        formModalRef.value.closeLoading()
      }
    }
  }

  const handleClose = () => {
    formModalRef.value.resetForm()
  }

  const deleteData = async () => {
    if (!checkedData.value || checkedData.value.length === 0) {
      ElMessage.warning('请至少选择一条数据进行删除!')
      return
    }
    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      try {
        const ids = checkedData.value.map((item) => item.id)
        const res = await baseMethod.post('/xmmxConfig/delete', {
          ids: ids
        })
        if (!res.success) throw new Error(res.msg)
        ElMessage.success('删除成功!')
        // 处理保存逻辑
        formModalRef.value?.close()
        await projectDetailQueryTableRef.value?.searchData()
      } catch (error) {
        ElMessage.error((error as Error).message || '删除失败!')
      }
    }
  }

  return {
    mode,
    isChecked,
    formData,
    formModalRef,
    formFields,
    handleSave,
    handleClose,
    openModal,
    deleteData
  }
}
