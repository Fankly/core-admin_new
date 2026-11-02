<template>
  <dialogContainer
    :bodyStyle="{ marginTop: '10px' }"
    :bodyWapperStyle="{ margin: '0 30px' }"
    :buttonLoading="uploadLoading"
    class="uploadView"
    ref="dialogContainer"
    :onCancel="() => onCancel(false)"
    :onSubmit="() => onSubmit()"
  >
    <DashboardContainer rectangularIcon circleIcon title="选择文件" :headerStyle="{ padding: '0', height: '32px' }" :bodyStyle="{ padding: 0 }">
      <template v-slot:extra>
        <el-button v-if="handleTemplate" @click="handleExportTemplate" type="primary" link>点击下载模版文件</el-button>
      </template>
      <FormConfigBox
        style="margin-top: 5px"
        v-if="formOptions && formOptions.length > 0"
        :config="{ labelWidth: '95px' }"
        ref="formOptions"
        :options="formOptions"
        v-model="dataValue"
      />
      <el-upload
        ref="uploadFile"
        drag
        multiple
        :auto-upload="false"
        :on-preview="handlePreview"
        :file-list="dataValue.importFile"
        :http-request="handleUpload"
        class="upload-view"
        :accept="accept || '.xls,.xlsx,.et'"
        :action="''"
        :on-remove="onRemove"
        :on-success="onUploadSuccess"
        :on-error="onUploadError"
        :on-exceed="onUploadLimit"
        :on-change="handleChange"
        :before-upload="onBeforeUpload"
      >
        <el-icon class="ep-icon-upload"><EpUpload /></el-icon>
        <div class="el-upload__text">将文件拖到此处</div>
        <template #tip>
          <div class="el-upload__tip">支持拓展名: {{ accept || '.xls,.xlsx,.et' }}</div>
        </template>
      </el-upload>
    </DashboardContainer>
  </dialogContainer>
</template>

<script setup>
import { Upload as EpUpload } from '@element-plus/icons-vue'
import httpUtil from '@/core/http/index.js'
// const isImage = (fileName) => {
//   return /\.(png|jpe?g|gif|bmp|webp)$/i.test(fileName);
// };
import { useUploadCustom, useUpload } from '@/core/composables/useWorkspace'
import { proxyRefs, toRef, reactive, toRefs, getCurrentInstance, useTemplateRef } from 'vue'
defineOptions({
  name: 'uploadView'
})
const componentProps = defineProps({
  accept: String,
  uploadUrl: String,
  fieldName: String,
  param: Object,
  formOptions: {
    type: Array
  },
  handleTemplate: {
    type: Function
  }
})
const componentInstance = getCurrentInstance().proxy
const uploadFileRef = useTemplateRef('uploadFile')
const formOptionsRef = useTemplateRef('formOptions')
const UploadCustomState = proxyRefs(useUploadCustom())
const handleUploadList = toRef(UploadCustomState, 'handleUploadList')
const onUploadLimit = toRef(UploadCustomState, 'onUploadLimit')
const onRemove = toRef(UploadCustomState, 'onRemove')
const customUpload = toRef(UploadCustomState, 'customUpload')
const onUploadSuccess = toRef(UploadCustomState, 'onUploadSuccess')
const onUploadError = toRef(UploadCustomState, 'onUploadError')
const getFileExtension = toRef(UploadCustomState, 'getFileExtension')
const getMimeTypeByExtension = toRef(UploadCustomState, 'getMimeTypeByExtension')
const onBeforeUpload = toRef(UploadCustomState, 'onBeforeUpload')
const uploadLoading = toRef(UploadCustomState, 'uploadLoading')
const uploadList = toRef(UploadCustomState, 'uploadList')
const extToMimeType = toRef(UploadCustomState, 'extToMimeType')
const UploadState = proxyRefs(useUpload())
const parseUploadData = toRef(UploadState, 'parseUploadData')
const getPictureList = toRef(UploadState, 'getPictureList')
const fileListToJson = toRef(UploadState, 'fileListToJson')
const getUploadFileUrl = toRef(UploadState, 'getUploadFileUrl')
const filterEmptyValues = toRef(UploadState, 'filterEmptyValues')
const getUploadFileUrlByFetch = toRef(UploadState, 'getUploadFileUrlByFetch')
const getUploadActionUrl = toRef(UploadState, 'getUploadActionUrl')
const pictureFile = toRef(UploadState, 'pictureFile')
const getUploadHeaders = toRef(UploadState, 'getUploadHeaders')
const componentData = reactive({
  buttonLoading: false,
  dataValue: {
    importFile: []
  },
  maxSizeMap: {
    // 'application/zip': 200 * 1024 * 1024, // .zip 最大 1GB
    // 'application/x-rar-compressed': 200 * 1024 * 1024, // .rar 最大 1GB
    // 'application/msword': 20 * 1024 * 1024, // .doc 最大 2MB
    // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 20 * 1024 * 1024, // .docx 最大 2MB
    // 'application/pdf': 2 * 1024 * 1024, // .pdf 最大 2MB
    // 'image/png': 2 * 1024 * 1024, // .png 最大 2MB
    // 'image/jpeg': 2 * 1024 * 1024, // .jpg 最大 2MB
    'application/vnd.ms-excel': 1024 * 1024 * 1024,
    // .xls 最大 1GB
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 1024 * 1024 * 1024,
    // .xlsx 最大 1GB
    // WPS表格格式
    'application/vnd.ms-excel.et': 1024 * 1024 * 1024 // .et 最大 1GB
  }
})
const buttonLoading = toRef(componentData, 'buttonLoading')
const dataValue = toRef(componentData, 'dataValue')
const maxSizeMap = toRef(componentData, 'maxSizeMap')
componentData.uploadCallback = undefined
const uploadCallback = toRef(componentData, 'uploadCallback')
function handleChange(file, fileList) {
  componentData.dataValue.importFile = [fileList[fileList.length - 1]] // 只保留最新文件
}
function addApi(callback) {
  // this.handleUpload(callback);
  // this.$refs.uploadFile.submit();
  // callback();
  return new Promise((resolve, reject) => {
    const submit = () => {
      componentData.uploadCallback = (res) => {
        resolve(res)
      }
      uploadFileRef.value.submit()
    }
    if (formOptionsRef.value) {
      formOptionsRef.value.validate((valid) => {
        if (valid) {
          // 保存回调函数，以便在上传成功后调用
          submit()
        } else {
          reject()
        }
      })
    } else {
      submit()
    }
  })
}
function onCancel(isSuccess = false, data) {
  if (componentInstance.observer != null) {
    componentInstance.observer.cancel(isSuccess, data)
  }
}
function onSubmit() {
  componentData.buttonLoading = true
  addApi()
    .then((res) => {
      onCancel(true, res)
    })
    .catch((error) => {
      console.error('上传失败:', error)
      // this.buttonLoading = false;
    })
    .finally(() => {
      // this.buttonLoading = false;
    })
}
function handleUpload({ file }) {
  const url = componentProps.uploadUrl
  const fieldName = componentProps.fieldName
  const { importFile, ...other } = componentData.dataValue
  UploadCustomState.customUpload(
    {
      file,
      url,
      fieldName,
      params: {
        ...other,
        ...componentProps.param
      }
    },
    componentData.uploadCallback
  )
}
function handleExportTemplate() {
  componentProps.handleTemplate?.(componentData.dataValue)
}
function handlePreview(file) {}
defineExpose({
  EpUpload,
  handleUploadList,
  onUploadLimit,
  onRemove,
  customUpload,
  onUploadSuccess,
  onUploadError,
  getFileExtension,
  getMimeTypeByExtension,
  onBeforeUpload,
  uploadLoading,
  uploadList,
  extToMimeType,
  parseUploadData,
  getPictureList,
  fileListToJson,
  getUploadFileUrl,
  filterEmptyValues,
  getUploadFileUrlByFetch,
  getUploadActionUrl,
  pictureFile,
  getUploadHeaders,
  handleChange,
  addApi,
  onCancel,
  onSubmit,
  handleUpload,
  handleExportTemplate,
  handlePreview,
  ...toRefs(componentData)
})
</script>
<style lang="less" scoped></style>
