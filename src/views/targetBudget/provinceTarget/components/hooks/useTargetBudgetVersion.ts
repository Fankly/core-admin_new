import { provinceTargetCreateOrEdit } from '@/api/targetBudget/provinceTarget'
import { ElForm, ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { VXETable } from 'vxe-table'
import { TargetBudgetVersionProps, VersionAcceptParams, VersionForm } from '../../types/provinceTarget'

export const useTargetBudgetVersion = (props: TargetBudgetVersionProps) => {
  const loading = ref(false)
  const isShowModal = ref(false)
  const modalTitle = ref('版本创建')
  const modalHeight = ref('330')
  const modalWidth = ref('700')

  const versionFormRef = ref<InstanceType<typeof ElForm>>()
  // 父组件传过来的参数
  const parameter = ref<VersionAcceptParams>()
  const versionForm = reactive<VersionForm>({
    versionName: '',
    bmName: '',
    gkbmId: '',
    nd: '',
    remark: ''
  })

  const versionFormRules = reactive({
    versionName: [
      {
        required: true,
        message: '版本名称不能为空',
        trigger: 'blur'
      }
    ],
    remark: [
      {
        required: true,
        message: '备注不能为空',
        trigger: 'blur'
      }
    ]
  })

  const handleCancel = () => {
    // 重置表单数据,关闭窗口
    parameter.value = undefined
    versionFormRef.value?.resetFields()
    isShowModal.value = false
  }

  // 保存数据
  const handleSaveData = async () => {
    loading.value = true
    try {
      // 校验是否填入数据
      await versionFormRef.value?.validate()
      // 确认框
      const type = await VXETable.modal.confirm('确认是否保存?', '提示', {
        status: 'question',
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type === 'confirm') {
        const params = {
          ...versionForm
        }
        params['id'] = parameter.value?.id
        const res = await provinceTargetCreateOrEdit(params)
        if (!res.success) throw new Error(res.msg)
        ElMessage({
          type: 'success',
          duration: 1500,
          message: '保存成功!'
        })
        props.search()
        // 查询页面接口
        handleCancel()
      }
    } catch (error) {
      ElMessage.error((error as Error).message)
    } finally {
      loading.value = false
    }
  }

  // 设置默认值
  const setVersionFormData = (params: VersionAcceptParams) => {
    versionForm.bmName = params.bmName
    versionForm.gkbmId = params.bmId
    versionForm.nd = params.nd
    if (params.operationFlag !== 'CREATE') {
      versionForm.id = params.id
      versionForm.versionName = params.versionName
      versionForm.remark = params.remark
    } else {
      versionForm.id = ''
      versionForm.versionName = ''
      versionForm.remark = ''
    }
  }

  // 接收父组件参数
  const acceptParams = (params: VersionAcceptParams) => {
    modalTitle.value = params.operationFlag === 'CREATE' ? '版本创建' : '版本编辑'
    parameter.value = { ...parameter.value, ...params }
    setVersionFormData(params)
    isShowModal.value = true
  }

  return {
    versionFormRef,
    loading,
    isShowModal,
    modalTitle,
    modalWidth,
    modalHeight,
    acceptParams,
    versionForm,
    versionFormRules,
    handleSaveData,
    handleCancel
  }
}
