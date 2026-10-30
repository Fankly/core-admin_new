<template>
  <vxe-modal
    position="center"
    :loading="loading"
    v-model="dialogVisible"
    :title="`文件上传${parameter.title}`"
    :destroy-on-close="true"
    width="580px"
  >
    <div class="import-excel">
      <el-form class="drawer-multiColumn-form" label-width="100px">
        <el-form-item label="模板下载 :">
          <el-button type="primary" @click="downloadTemp">点击下载</el-button>
        </el-form-item>
        <el-form-item label="文件上传 :">
          <el-upload
            ref="uploadRef"
            action="#"
            class="upload"
            :drag="true"
            :limit="excelLimit"
            :multiple="false"
            :show-file-list="true"
            :http-request="uploadExcel"
            :before-upload="beforeExcelUpload"
            :on-exceed="handleExceed"
            accept=".xls,.xlsx"
          >
            <slot name="empty">
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            </slot>
            <template #tip>
              <slot name="tip">
                <div class="el-upload__tip">请上传 .xls , .xlsx 标准格式文件，文件最大为 {{ parameter.fileSize }}M</div>
              </slot>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'ImportExcel'
}
</script>
<script setup lang="ts">
import { ref, defineExpose } from 'vue'
import { useDownload } from '@/hooks/useDownload'
import { ElMessage } from 'element-plus'

export interface ExcelParameterProps {
  title: string // 标题
  specialorgid: string // 特殊组织id
  fileSize?: number // 上传文件的大小
  tempApi?: (params: any) => Promise<any> // 下载模板的Api
  importApi?: (params: any) => Promise<any> // 导入的Api
  getTableList?: () => void // 获取表格数据的Api
}

const uploadRef = ref()

// 是否覆盖数据
const isCover = ref(false)
const loading = ref(false)
// 最大文件上传数
const excelLimit = ref(1)
// dialog状态
const dialogVisible = ref(false)
// 父组件传过来的参数
const parameter = ref<ExcelParameterProps>({
  title: '',
  fileSize: 50,
  specialorgid: ''
})

// 接收父组件参数
const acceptParams = (params: ExcelParameterProps) => {
  parameter.value = { ...parameter.value, ...params }
  dialogVisible.value = true
}

// Excel 导入模板下载
const downloadTemp = () => {
  if (!parameter.value.tempApi) return
  useDownload(parameter.value.tempApi, `${parameter.value.title}模板`)
}

// 文件上传
const uploadExcel = async (param: any) => {
  loading.value = true
  try {
    let excelFormData = new FormData()
    excelFormData.append('file', param.file)
    excelFormData.append('isCover', isCover.value as unknown as Blob)
    const res = await parameter.value.importApi!({
      specialorgid: parameter.value.specialorgid,
      excelFormData
    })
    if (!res.success) throw new Error(res.msg)
    let msg = res.data.replace(/\n/g, '<br/>')
    ElMessage({
      type: 'success',
      dangerouslyUseHTMLString: true,
      message: msg
    })
    parameter.value.getTableList && parameter.value.getTableList()
    dialogVisible.value = false
  } catch (error) {
    ElMessage({
      type: 'error',
      message: `${(error as Error).message}，请您重新上传！`
    })
    // 清空上传失败的文件
    if (uploadRef.value && uploadRef.value.clearFiles) {
      uploadRef.value.clearFiles()
    }
  } finally {
    loading.value = false
  }
}

/**
 * @description 文件上传之前判断
 * @param file 上传的文件
 * */
const beforeExcelUpload = (file: any) => {
  const allowExt = ['xls', 'xlsx']
  const ext = file.name.split('.').pop().toLowerCase()
  const isExcel = allowExt.includes(ext)
  const fileSize = file.size / 1024 / 1024 < parameter.value.fileSize!
  if (!isExcel)
    ElMessage({
      message: '上传文件只能是 xls / xlsx /et 格式！',
      type: 'warning'
    })
  if (!fileSize)
    setTimeout(() => {
      ElMessage({
        message: `上传文件大小不能超过 ${parameter.value.fileSize}MB！`,
        type: 'warning'
      })
    }, 0)
  return isExcel && fileSize
}

// 文件数超出提示
const handleExceed = () => {
  ElMessage({
    message: '最多只能上传一个文件！',
    type: 'warning'
  })
}

// 上传错误提示
const excelUploadError = () => {
  ElMessage({
    message: `上传${parameter.value.title}失败，请您重新上传！`,
    type: 'error'
  })
}

// 上传成功提示
const excelUploadSuccess = () => {
  ElMessage({
    message: `上传${parameter.value.title}成功！`,
    type: 'success'
  })
}

defineExpose({
  acceptParams
})
</script>
<style lang="less" scoped>
@import './index.less';
</style>
