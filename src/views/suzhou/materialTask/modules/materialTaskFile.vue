<template>
  <vxe-modal
    v-model="isShowModal"
    :loading="loading"
    destroy-on-close
    resize
    show-zoom
    position="center"
    title="佐证材料"
    width="70%"
    height="600px"
    @close="handleClose"
  >
    <div class="material-task-log">
      <div class="operation">
        <vxe-button size="mini" status="primary" icon="el-icon-upload" @click="uploadHandle" class="upload-btn pulse"> 文件上传 </vxe-button>
      </div>
      <div class="table">
        <vxe-table ref="vxeTableRef" header-align="center" align="center" border stripe resizable show-overflow height="400px" :data="fileList">
          <vxe-column type="seq" width="50" title="序号" />
          <vxe-column field="fileName" title="附件名称" min-width="200">
            <template #default="{ row }">
              <div class="file-name">
                <i class="el-icon-document"></i>
                <span>{{ row.fileName }}</span>
              </div>
            </template>
          </vxe-column>
          <vxe-column field="uploadUserName" title="上传用户名" width="120" />
          <vxe-column field="uploadTime" title="上传时间" width="150" />
          <vxe-column title="操作" width="180">
            <template #default="{ row }">
              <div class="file-actions">
                <el-button type="text" @click="handleDownload(row)"> <i class="el-icon-download"></i> 下载 </el-button>
                <el-button type="text" @click="handleDelete(row)"> <i class="el-icon-delete"></i> 删除 </el-button>
              </div>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="materialTaskFile">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import VXETable from 'vxe-table'
import { apiExporFile } from '@/utils/export'
import { getMaterialTaskFilePage, getMaterialTaskFileUpload, getMaterialTaskFileDownload, getMaterialTaskFileRemove } from '@/api/suzhou/materialTask'
interface OpenParams {
  detailId: string
  onSuccess?: () => void | Promise<void>
}

const isShowModal = ref(false)
const loading = ref(false)
const currentTaskId = ref<string>('')
const onSuccessCallback = ref<(() => void | Promise<void>) | undefined>(undefined)

const fileList = ref<any[]>([])
const vxeTableRef = ref()

const hasTaskId = () => currentTaskId.value !== undefined && currentTaskId.value !== null && currentTaskId.value !== ''

const getTableData = async () => {
  if (!hasTaskId()) return
  loading.value = true
  try {
    const res = await getMaterialTaskFilePage({
      detailId: currentTaskId.value,
      page: 1,
      limit: 1000
    })
    if (!res.success) throw new Error(res.msg || '查询附件失败')
    fileList.value = res.data.records
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

// 下载文件
const handleDownload = async (file: any) => {
  apiExporFile(file.fileId, file.fileName, getMaterialTaskFileDownload)
  // const res = await getMaterialTaskFileDownload(file.fileId)
  // if (!res.success) return ElMessage.error(res.msg || '附件下载失败!')
  // const link = document.createElement('a')
  // link.href = res.data
  // link.download = `${file.fileName}` // 获取文件名
  // document.body.appendChild(link)
  // link.click()
  // link.remove()
}
// 删除文件
const handleDelete = async (file: any) => {
  const type = await VXETable.modal.confirm('是否删除选择的附件？', '提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return ElMessage.info('已取消')
  let res = await getMaterialTaskFileRemove([file.fileId])
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('附件已删除')
  getTableData()
  await onSuccessCallback.value?.()
  return
}

const uploadHandle = async () => {
  try {
    const $table = vxeTableRef.value
    const types = ['gif', 'jpg', 'jpeg', 'png', 'wps', 'et', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'pdf', 'zip', 'tar', 'ofd']
    const { files } = await $table.readFile({ multiple: true })
    const records = Array.from(files).map((file: any) => {
      if (types) {
        const ns = file.name.split('.')
        const type = ns[ns.length - 1].toLowerCase()
        if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
      }
      return {
        name: file.name,
        file: file
      }
    })
    const formData = new FormData()
    for (const record of records) {
      formData.append('files', record.file)
      formData.append('fileNames', record.name)
      formData.append('detailId', currentTaskId.value)
    }
    const attachNames = records.map(({ name }: any) => name)
    loading.value = true
    const res = await getMaterialTaskFileUpload({ excelFormData: formData, detailId: currentTaskId.value })
    if (!res.success) throw new Error(res.msg)
    // 刷新页面,调用查询接口
    ElMessage.success('附件上传成功')
    getTableData()
    await onSuccessCallback.value?.()
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
  return
}

const handleClose = () => {
  isShowModal.value = false
}

const open = async (params: OpenParams) => {
  currentTaskId.value = params.detailId
  onSuccessCallback.value = params.onSuccess
  isShowModal.value = true
  await getTableData()
}

defineExpose({
  open
})
</script>

<style scoped lang="less">
.material-task-log {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  .operation {
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
