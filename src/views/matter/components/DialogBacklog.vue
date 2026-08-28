<template>
  <div class="container">
    <div class="upload-table">
      <el-button class="title-button" @click="isShowSearch = !isShowSearch" type="text"
        ><h3 class="sub-title">
          可研报告及支撑材料
          <span> <i :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i> </span></h3
      ></el-button>
      <div v-show="!isShowSearch" class="table-box" v-loading="loading">
        <proTable
          :data-callback="dataCallBackHandle"
          :tool-button="[]"
          :pagination="false"
          :request-api="getFjTableHandle"
          :requestAuto="true"
          :columns="fjColumns"
          ref="backLogRef"
        >
          <template>
            <el-upload name="" v-if="!isDisabled" accept=".pdf" :auto-upload="false" :on-change="uploadHandle" :show-file-list="false">
              <el-button size="mini" type="primary" plain>上传附件</el-button>
              <template #tip>
                <div class="el-upload__tip">只能上传pdf文件,且不超过{{ fileSize }}M</div>
              </template>
            </el-upload>
          </template>
          <template #opreation="scope">
            <el-button size="mini" type="primary" plain @click="previewHandle(scope.row)">预览</el-button>
            <el-button v-if="!isDisabled" size="mini" type="primary" plain @click="delUploadFileHandle(scope.row)"> 删除 </el-button>
          </template>
        </proTable>
      </div>
    </div>
    <div class="preview-layout">
      <el-button class="title-button" @click="isShowTable = !isShowTable" type="text"
        ><h3 class="sub-title">
          附件预览
          <span> <i :class="isShowTable ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i> </span></h3
      ></el-button>
      <div class="perview" v-show="!isShowTable">
        <iframe frameborder="0" scrolling="auto" style="border: none" :src="previewUrl" width="100%" height="100%"></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="tsx" name="BackLog">
import proTable from '@/components/ProTable/index.vue'
import { ColumnProps } from '@/components/ProTable/interface'
import { computed, onMounted, reactive, ref, toRefs } from 'vue'
import { BaseMsgData } from '../types/matterDecl'
import { deleteAttach, downloadAttach, getAttach, uploadAttach } from '@/api/matter/yssxMatter'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteAttachList, downloadAttachList, getAttachList, uploadAttachList } from '@/api/matter/matterAdjust'
import emits from '@/utils/emits'
import { getParamValue } from '@/api/common'

interface Props {
  baseMsgData: BaseMsgData
  flag?: string
}

const props = defineProps<Props>()

const backLogRef = ref()

const loading = ref(false)
const isShowSearch = ref(false)
const isShowTable = ref(false)

const previewUrl = ref('')

const isDisabled = computed(() => props.baseMsgData.operationFlag === 'VIEW' || props.baseMsgData.jd === '2')

const selectedData = reactive(toRefs(props.baseMsgData.selectedData))

const uploadId = ref('')

const fileSize = ref('50')

emits.on('getMatterChangeMsg', (val) => {
  uploadId.value = val.matterBaseMsg.id
  backLogRef.value?.search()
})

onMounted(async () => {
  const res = await getParamValue('QMYS_GROUP', 'YSSX_WJDX')
  if (res.success && res.data) {
    fileSize.value = res.data
  }
})

const getFjTableHandle = (params: any) => {
  loading.value = true
  if (props.flag) {
    if (props.baseMsgData.operationFlag === 'EDIT' || props.baseMsgData.operationFlag === 'VIEW') {
      uploadId.value = props.baseMsgData.selectedData.id
    }
    return getAttachList(uploadId.value)
  } else {
    let yssxbm = props.baseMsgData.operationFlag === 'ADD' ? props.baseMsgData.yssxbm : selectedData.yssxbm
    uploadId.value = yssxbm
    return getAttach(yssxbm, props.baseMsgData.jd as string)
  }
}

const uploadTableData = ref()

const dataCallBackHandle = (data: any[]) => {
  if (data.length !== 0) {
    previewHandle(data[0])
  } else {
    previewUrl.value = ''
  }
  uploadTableData.value = data
  loading.value = false
  return data
}

const downloadUploadHandle = async (params: any) => {
  loading.value = true
  let res
  if (props.flag) {
    res = await downloadAttachList(params.uuid)
  } else {
    res = await downloadAttach(params.uuid)
  }
  const blob: any = res
  let dom = document.createElement('a')
  let url = window.URL.createObjectURL(blob)
  dom.href = url
  // 获取文件名
  let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
  dom.download = `${decodeURI(decodeURI(filename))}`
  document.body.appendChild(dom)
  dom.click()
  document.body.removeChild(dom)
  window.URL.revokeObjectURL(url)
  loading.value = false
}

const fjColumns = reactive<ColumnProps<any>[]>([
  { type: 'index', label: '序号' },
  {
    prop: 'fjmc',
    label: '附件名称',
    render: (scope) => {
      return (
        <el-button type="text" onClick={() => downloadUploadHandle(scope.row)}>
          {scope.row.fjmc}
        </el-button>
      )
    }
  },
  { prop: 'filesize', label: '附件大小' },
  { prop: 'opreation', label: '操作' }
])

const uploadHandle = async (file: any) => {
  if (props.flag && !uploadId.value) {
    ElMessage.error('请保存后,再进行上传!')
    return
  }
  const isPdf = file.raw.type === 'application/pdf'
  const isLt20M = file.size / 1024 / 1024 < parseFloat(fileSize.value)
  if (!isPdf) {
    ElMessage.error('上传文件只能传输PDF文件')
    return
  }
  if (!isLt20M) {
    ElMessage.error(`上传文件大小不能超过${fileSize.value}MB!`)
    return
  }
  const formData = new FormData()
  formData.append('file', file.raw)
  let res
  if (props.flag) {
    res = await uploadAttachList({
      id: uploadId.value,
      formData: formData,
      name: file.name
    })
  } else {
    res = await uploadAttach({
      yssxbm: uploadId.value,
      jd: props.baseMsgData.jd,
      formData: formData,
      name: file.name
    })
  }
  if (res.success) {
    backLogRef.value?.search()
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const previewHandle = async (params: any) => {
  let res: any
  if (props.flag) {
    res = await downloadAttachList(params.uuid)
  } else {
    res = await downloadAttach(params.uuid)
  }
  let url = window.URL.createObjectURL(new Blob([res], { type: 'application/pdf' }))
  previewUrl.value = url + '#toolbar=0'
}

const delUploadFileHandle = (params: any) => {
  ElMessageBox.confirm('是否删除文档', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      let res
      if (props.flag) {
        res = await deleteAttachList(params.id)
      } else {
        res = await deleteAttach({
          ids: [params.id],
          jd: props.baseMsgData.jd
        })
      }
      if (res.success) {
        loading.value = false
        ElMessage.success('删除成功')
        backLogRef.value?.search()
      } else {
        loading.value = false
        ElMessage.error(res.msg)
      }
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<style lang="less" scoped>
.container {
  height: 820px;
  display: flex;
  flex-direction: column;
  padding: 10px 34px;

  .upload-table {
    display: flex;
    flex-direction: column;
  }

  .preview-layout {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .perview {
      flex: 1;
      min-width: 0;
      min-height: 0;
      border: 1px solid black;
    }
  }
}

.el-upload__tip {
  margin-top: 10px;
  color: red;
}

:deep(.operate) {
  height: auto !important;
}

.sub-title {
  font-size: 18px;
  text-align: left;
}

.title-button {
  margin: 0 0 10px 0;
  padding: 0;
  height: 40px;
}
</style>
