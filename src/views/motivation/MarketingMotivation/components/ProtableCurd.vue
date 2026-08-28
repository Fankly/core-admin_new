<template>
  <div class="container" v-loading="loading">
    <ProTable
      @row-click="rowClick"
      @search="clearSelect"
      @reset="clearSelect"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      ref="proTableRef"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button size="mini" type="primary" plain @click="openModal('add')">新 增</el-button>
        <el-button
          size="mini"
          type="primary"
          plain
          :disabled="!scope['isSelected'] || scope['selectedListIds'].length !== 1"
          @click="openModal('view', scope['selectedList'])"
          >查 看</el-button
        >
        <el-button
          size="mini"
          type="primary"
          plain
          :disabled="!scope['isSelected'] || scope['selectedListIds'].length !== 1 || scope['selectedList'][0].status == '1'"
          @click="openModal('edit', scope['selectedList'])"
          >编 辑</el-button
        >
        <el-button
          size="mini"
          type="primary"
          plain
          :disabled="!scope['isSelected'] || scope['selectedList'][0].status == '1'"
          @click="handleDelete(scope['selectedList'])"
          >删 除</el-button
        >
        <!-- <el-button
          size="mini"
          type="primary"
          plain
          :disabled="!scope['isSelected'] || scope['selectedList'][0].status == '1'"
          @click="handleSubmit(scope['selectedListIds'])"
          >提 交</el-button
        > -->
        <el-button size="mini" type="primary" plain @click="handleImport">导 入</el-button>
        <el-button size="mini" type="primary" plain @click="handleExport">导 出</el-button>
      </template>
    </ProTable>
  </div>
  <ImportExcel ref="importRef" />
  <FormModal
    ref="formModalRef"
    :title="modalTitle"
    :mode="mode"
    :fields="formFields"
    :data="formData"
    @save="handleSave"
    @close="handleClose"
    :label-width="labelWidth"
  />
</template>
<script lang="ts">
export default {
  name: 'ProtableCurd'
}
</script>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import ProTable from '@/components/ProTable/index.vue'
import ImportExcel from '@/components/ImportExcel/indexZx.vue'
import FormModal, { FormField } from '@/components/FormModal'
import { ElMessage } from 'element-plus'
import VXETable from 'vxe-table'

interface UserInfo {
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  roleId: string
}

interface Props {
  userInfo: UserInfo
  formFields: FormField[]
  tableColumns: any[]
  tempApi: (params: any) => Promise<any> // 下载模板的Api
  importApi: (params: any) => Promise<any> // 导入的Api
  exportApi: (params: any) => Promise<any> // 导出
  getTableList: (params: any) => Promise<any> // 查询
  deleteApi: (params: any) => Promise<any> // 删除
  // submitApi: (params: any) => Promise<any> // 提交
  saveApi: (params: any) => Promise<any> // 保存
  infoApi: (params: any) => Promise<any> // 保存
  importTitle: string
  modalTitle: string
  labelWidth: string
  cjr?: string
}

const props = defineProps<Props>()

const proTableRef = ref<InstanceType<typeof ProTable>>()
const formModalRef = ref<InstanceType<typeof FormModal>>()
const importRef = ref<InstanceType<typeof ImportExcel>>()
const mode = ref<'add' | 'edit' | 'view'>('add')
const formData = ref({})

// loading状态
const loading = ref(false)

// 清除表格选择状态
const clearSelect = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

// 操作功能新增-编辑-查看
const openModal = async (modeFlag: 'add' | 'edit' | 'view', row?: any[]) => {
  mode.value = modeFlag
  if (modeFlag === 'add') {
    formData.value = {}
  } else {
    if (row) {
      if (props.infoApi) {
        let res = await props.infoApi({ id: row[0].id })
        if (res.success) {
          formData.value = res.data.records[0]
        } else {
          ElMessage.error(res.msg)
        }
      } else {
        formData.value = row[0]
      }
    } else {
      formData.value = {}
    }
  }
  formModalRef.value?.open()
}

//新增,编辑保存功能
const handleSave = async (data: any) => {
  const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
    status: 'warning'
  })
  data.cjr = props?.cjr || ''
  if (type === 'confirm') {
    loading.value = true
    try {
      const res = await props.saveApi([data])
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('保存成功!')
      clearSelect()
    } catch (error) {
      ElMessage.error((error as Error).message || '保存失败!')
    } finally {
      loading.value = false
    }
  }
  // 处理保存逻辑
  formModalRef.value?.close()
}

//删除
const handleDelete = async (list: any) => {
  // const isDel = list.some((item: any) => item.status == '1')
  // if (isDel) {
  //   return ElMessage.warning('包含已提交数据无法删除！')
  // }
  // const ids = list.map((item: any) => item.id)
  // 处理删除逻辑
  const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    loading.value = true
    try {
      const res = await props.deleteApi(list)
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('删除成功!')
      clearSelect()
    } catch (error) {
      ElMessage.error((error as Error).message || '删除失败!')
    } finally {
      loading.value = false
    }
  }
}

// //提交
// const handleSubmit = async (ids: string) => {
//   // 处理保存逻辑
//   const type = await VXETable.modal.confirm('是否确定提交？', '提示', {
//     status: 'warning'
//   })
//   if (type === 'confirm') {
//     loading.value = true
//     try {
//       const res = await props.submitApi(ids)
//       if (!res.success) throw new Error(res.msg)
//       ElMessage.success('提交成功!')
//       clearSelect()
//     } catch (error) {
//       ElMessage.error((error as Error).message || '提交失败!')
//     } finally {
//       loading.value = false
//     }
//   }
// }

// 关闭功能
const handleClose = () => {
  console.log('弹窗关闭')
}

// 导入
const handleImport = () => {
  let newParmas = { cjr: props?.cjr || '' }
  let tempApi: any = props.tempApi
  let importApi: any = props.importApi
  if (importRef.value) importRef.value.fromData = { ...newParmas }
  if (!tempApi && !importApi) return
  let params = {
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    title: props.importTitle,
    specialorgid: props.userInfo.dwId,
    getTableList: proTableRef.value?.getTableList
  }
  if (importRef.value) importRef.value.acceptParams(params)
}

const handleExport = async () => {
  loading.value = true
  try {
    if (proTableRef.value) {
      const params = proTableRef.value.searchParam
      if (!props.exportApi) return
      const res = await props.exportApi(params)
      const blob = new Blob([res])
      const blobUrl = window.URL.createObjectURL(blob)
      const exportFile = document.createElement('a')
      exportFile.style.display = 'none'
      exportFile.download = `${props.importTitle}.xlsx`
      exportFile.href = blobUrl
      document.body.appendChild(exportFile)
      exportFile.click()
      // 去除下载对 url 的影响
      document.body.removeChild(exportFile)
      window.URL.revokeObjectURL(blobUrl)
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

// 行点击
const rowClick = (row: any) => {
  clearSelect()
  if (proTableRef.value && proTableRef.value.element) proTableRef.value.element.toggleRowSelection(row, true)
}

// 查询列表
const getPageList = (params: any) => {
  params['current'] = params['page']
  params['size'] = params['limit']
  return props.getTableList(params)
}

// 列表查询回调函数
const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

const getParams = () => {
  return proTableRef.value?.searchParam
}

defineExpose({
  getParams: getParams
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  padding: 10px;
}
</style>
