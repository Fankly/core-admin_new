<template>
  <div class="container" v-loading="loading">
    <vxe-modal
      destroy-on-close
      :title="modalTitle"
      show-zoom
      fullscreen
      resize
      width="1200"
      height="800"
      v-model="isShowModal"
      @show="clearSelect"
      @close="colseHandle"
    >
      <ProTable
        @row-click="rowClick"
        @search="clearSelect"
        @reset="clearSelect"
        :data-callback="callBackHandle"
        :request-api="getPageList"
        :request-auto="false"
        :search-col="4"
        :columns="tableColumns"
        :tool-button="['search']"
        ref="proTableRef"
      >
        <template #tableHeader="scope">
          <div class="btn_header">
            <el-button
              v-if="userType == 'VIEW'"
              size="mini"
              type="primary"
              plain
              :disabled="!scope['isSelected']"
              @click="approval(scope['selectedList'])"
              >审 核</el-button
            >
            <!-- <el-button v-if="userType == 'VIEW'" size="mini" type="primary" plain @click="archive">归 档</el-button> -->
            <el-button v-if="userType == 'SUBMIT'" size="mini" type="primary" plain @click="openModal('add')">新 增</el-button>
            <el-button
              v-if="userType == 'SUBMIT'"
              size="mini"
              type="primary"
              plain
              :disabled="scope['selectedListIds'].length !== 1"
              @click="openModal('edit', scope['selectedList'])"
              >编 辑</el-button
            >
            <el-button
              size="mini"
              type="primary"
              plain
              :disabled="scope['selectedListIds'].length !== 1"
              @click="openModal('view', scope['selectedList'])"
              >查 看</el-button
            >
            <el-button
              v-if="userType == 'SUBMIT'"
              size="mini"
              type="primary"
              plain
              :disabled="!scope['isSelected']"
              @click="handleDelete(scope['selectedList'])"
              >删 除</el-button
            >
            <el-button
              v-if="userType == 'SUBMIT'"
              size="mini"
              type="primary"
              plain
              :disabled="!scope['isSelected']"
              @click="handleSubmit(scope['selectedListIds'])"
              >提 交</el-button
            >
            <el-button v-if="userType == 'SUBMIT'" size="mini" type="primary" plain @click="handleImport">导 入</el-button>
            <el-button size="mini" type="primary" plain @click="handleExport">导 出</el-button>
            <div class="highlight">
              <dt> 年度:</dt>
              <dd>{{ nd }}</dd>
            </div>
          </div>
        </template>
      </ProTable>
    </vxe-modal>
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
  name: 'ProtableCurdModal'
}
</script>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import ProTable from '@/components/ProTable/index.vue'
import ImportExcel from '@/components/ImportExcel/indexZx.vue'
import FormModal, { FormField } from '@/components/FormModal'
import { ElMessage } from 'element-plus'
import VXETable from 'vxe-table'
import { commonSave, commonGetInfo, commonSubmit, commonRemove, commonApprove, commonReject, commonFiled } from '@/api/deptDataVersion/index'

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
  submitApi: (params: any) => Promise<any> // 提交
  saveApi: (params: any) => Promise<any> // 保存
  infoApi: (params: any) => Promise<any> // 根据id查询数据
  importTitle: string
  modalTitle: string
  labelWidth: string
  versionId: string //版本ID
  nd: string //年度
  busiType: string //报表类型
}

const props = defineProps<Props>()

const proTableRef = ref<any>()
const formModalRef = ref<InstanceType<typeof FormModal>>()
const importRef = ref<any>()
const mode = ref<'add' | 'edit' | 'view'>('add')
const formData = ref({})
const isShowModal = ref<boolean>(false)

const userType = ref<string>('')

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
      if (commonGetInfo) {
        let res = await commonGetInfo({ id: row[0].id, versionId: props.versionId })
        if (res.success) {
          formData.value = res.data
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
  const params = {
    ...data,
    versionId: props.versionId,
    busiType: props.busiType
  }
  if (type === 'confirm') {
    loading.value = true
    try {
      const res = await commonSave({ ...params })
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

// 审批
const approval = async (list: any) => {
  const isDel = list.some((item: any) => item.status != '1' )
  if (isDel) {
    return ElMessage.warning('存在草稿/审核通过/审核驳回状态数据，无法审核')
  }
  const ids = list.map((item: any) => item.id)
  const type = await VXETable.modal.confirm('请审核', '提示', {
    status: 'warning',
    confirmButtonText: '审核通过',
    cancelButtonText: '审核驳回'
  })
  if (type === 'close') return ElMessage.info('已取消')
  loading.value = true
  const api = type === 'confirm' ? commonApprove : commonReject
  const params = {
    versionId: props.versionId,
    dataIdList: ids,
    busiType: props.busiType
  }
  const res: any = await api(params)
  if (res.success) {
    loading.value = false
    ElMessage.success('已审核')
    clearSelect()
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

//删除
const handleDelete = async (list: any) => {
  const isDel = list.some((item: any) => item.status == '1')
  if (isDel) {
    return ElMessage.warning('包含已提交数据无法删除！')
  }
  const ids = list.map((item: any) => item.id)
  // 处理删除逻辑
  const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    loading.value = true
    try {
      const params = {
        versionId: props.versionId,
        dataIdList: ids,
        busiType: props.busiType
      }
      const res = await commonRemove(params)
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

//提交
const handleSubmit = async (ids: string) => {
  // 处理保存逻辑
  const type = await VXETable.modal.confirm('是否确定提交？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    loading.value = true
    try {
      const params = {
        versionId: props.versionId,
        dataIdList: ids,
        busiType: props.busiType
      }
      const res = await commonSubmit(params)
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('提交成功!')
      clearSelect()
    } catch (error) {
      ElMessage.error((error as Error).message || '提交失败!')
    } finally {
      loading.value = false
    }
  }
}

// 关闭功能
const handleClose = () => {
  console.log('弹窗关闭')
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
  params['versionId'] = props.versionId
  params['busiType'] = props.busiType
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

// 导入
const handleImport = () => {
  let newParmas = {
    versionId: props.versionId,
    busiType: props.busiType
  }
  let tempApi: any = props.tempApi
  let importApi: any = props.importApi
  importRef.value.fromData = newParmas
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

// 导出
const handleExport = async () => {
  loading.value = true
  try {
    if (proTableRef.value) {
      const params = { ...proTableRef.value.searchParam, versionId: props.versionId, busiType: props.busiType }
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

// // 归档
// const archive = async () => {
//   const type = await VXETable.modal.confirm('是否归档？', '提示', {
//     status: 'warning'
//   })
//   if (type === 'confirm') {
//     const res: any = await commonFiled({ versionId: props.versionId })
//     if (res.success) {
//       ElMessage.success('归档成功')
//     } else {
//       ElMessage.error(res.msg)
//     }
//   }
// }

const colseHandle = () => {
  isShowModal.value = false
}

defineExpose({
  getParams: getParams,
  isShowModal,
  userType,
  clearSelect,
  proTableRef
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  padding: 10px;
  position: relative;
}

.btn_header {
  width: 100%;
  display: flex;
}

.highlight {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  padding: 4px 12px;
  background-color: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-light, #dcdfe6);
  border-radius: 4px;
  white-space: nowrap;
  transition: background-color 0.2s;
  margin-left: auto;

  &:hover {
    background-color: var(--el-fill-color, #e6e8eb);
  }

  dt {
    color: var(--el-text-color-regular, #606266);
    font-weight: normal;
    margin: 0;
  }

  dd {
    font-weight: 600;
    color: var(--el-text-color-primary, #303133);
    margin: 0 0 0 6px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
