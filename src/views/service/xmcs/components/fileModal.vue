<template>
  <div class="modalFile">
    <div class="operation" v-loading="loading" v-if="xmid">
      <span>{{ `附件类型:` }}</span>
      <el-select v-model="fileType" placeholder="请选择附件类型" style="width: 200px" @change="getClickfileType">
        <el-option v-for="(value, index) in fileTypeList" :key="index" :label="value.name" :value="value.code" />
      </el-select>
      <vxe-button v-if="!isDisabled" size="mini" status="primary" icon="el-icon-upload" @click="uploadHandle" class="upload-btn pulse">
        文件上传
      </vxe-button>
    </div>
    <div class="table">
      <vxe-table
        ref="vxeTableRef"
        header-align="center"
        align="center"
        border
        stripe
        resizable
        show-overflow
        height="400px"
        :data="fileList"
        :row-config="{ height: 32 }"
      >
        <vxe-column type="seq" width="50" title="序号" />
        <vxe-column field="attachTypeName" title="附件类型" width="160" />
        <vxe-column field="attachName" title="附件名称" min-width="200">
          <template #default="{ row }">
            <div class="file-name">
              <i class="el-icon-document" />
              <span>{{ row.attachName }}</span>
            </div>
          </template>
        </vxe-column>
        <vxe-column title="操作" width="180">
          <template #default="{ row }">
            <div class="file-actions">
              <el-button type="text" @click="handleDownload(row)"> <i class="el-icon-download"></i> 下载 </el-button>
              <el-button v-if="!isDisabled" type="text" @click="handleDelete(row)"> <i class="el-icon-delete"></i> 删除 </el-button>
            </div>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'dytable'
}
</script>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadZxcsAttach, deleteZxcsAttach } from '@/api/service/xmcs/index'
import VXETable from 'vxe-table'
import { downloadAttach } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'

interface Props {
  fileList: any[]
  xmid: string
  fileTypeList: any[]
  isDisabled: boolean
}
const props = defineProps<Props>()
const emit = defineEmits(['saveFile', 'updateFile'])
const vxeTableRef = ref()
const fileType = ref<string>('')
const loading = ref<boolean>(false)

// 下载文件
const handleDownload = async (file: any) => {
  const res = await downloadAttach({
    uuid: file.uuid
  })
  if (!res.success) {
    ElMessage.error(res.msg || '附件下载失败!')
    return
  }
  const link = document.createElement('a')
  link.href = res.data
  link.download = `${file.attachName}` // 获取文件名
  document.body.appendChild(link)
  link.click()
  link.remove()
}
// 删除文件
const handleDelete = async (file: any) => {
  const type = await VXETable.modal.confirm('是否删除选择的附件？', '提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return ElMessage.info('已取消')
  const params = {
    ids: [file.id],
    uuid: file.uuid
  }
  let res = await deleteZxcsAttach({ ...params })
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('附件已删除')
  emit('saveFile', fileType.value)
  return
}
const getClickfileType = () => {
  emit('saveFile', fileType.value)
}
const uploadHandle = async () => {
  if (!props.xmid) return ElMessage.warning('请先维护项目基本信息并保存后进行附件维护！')
  if (!fileType.value) return ElMessage.warning('请选择附件类型！')
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
    }
    const attachNames = records.map(({ name }: any) => name)
    loading.value = true
    const res = await uploadZxcsAttach({ excelFormData: formData, xmIds: props.xmid, attachNames: attachNames, attachType: fileType.value })
    if (!res.success) throw new Error(res.msg)
    // 刷新页面,调用查询接口
    ElMessage.success('附件上传成功')
    emit('saveFile', fileType.value)
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
  return
}
</script>
<style scoped lang="less">
.modalFile {
  width: 100%;
  height: 80%;
  display: flex;
  flex-direction: column;
}
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
</style>
