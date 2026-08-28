<template>
  <vxe-modal
    height="200"
    width="20%"
    v-bind="$attrs"
    :destroy-on-close="true"
    :loading="loading"
    @show="showHandle"
    @close="closeHandle"
    :title="`${title}-复制`"
    v-model="showModal"
    show-zoom
    resize
    position="center"
  >
    <el-form>
      <el-form-item label="当前年度：">
        <el-input :disabled="true" v-model="formData.targetNd" placeholder=""></el-input>
      </el-form-item>
      <el-form-item label="复制年度：">
        <el-select class="nd-select" v-model="formData.sourceNd" placeholder="请选择" style="width: 100%">
          <template v-for="item in props.ndList" :key="item.code">
            <el-option :label="item.name" :value="item.code"></el-option>
          </template>
        </el-select>
      </el-form-item>
    </el-form>
    <div class="btn">
      <el-button plain size="mini" type="primary" @click="saveHandle">确 定</el-button>
      <el-button plain size="mini" type="primary" @click="cancelHandle">取 消</el-button>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'handleCopy'
}
</script>
<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, reactive } from 'vue'

interface NdList {
  name: string
  code: string
}

interface Props {
  title: string
  nd: string
  ndList: NdList[]
  getApi: (params: any) => Promise<any>
}

const props = defineProps<Props>()
const showModal = ref(false)
const loading = ref(false)
const formData = reactive({
  sourceNd: '',
  targetNd: ''
})

const saveHandle = async () => {
  ElMessageBox.confirm('请确认', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      let res = await props.getApi(formData)
      if (res.success) {
        ElMessage.success('复制成功！')
        cancelHandle()
      } else {
        ElMessage.error(res.msg)
      }
    })
    .catch((error: any) => {
      if (error == 'cancel') {
        ElMessage.info('已取消')
      } else {
        console.log(error)
      }
    })
}

const cancelHandle = () => {
  formData.sourceNd = ''
  formData.targetNd = ''
  closeHandle()
}

const showHandle = async () => {
  formData.targetNd = props.nd
}
const closeHandle = () => {
  showModal.value = false
}

defineExpose({
  showModal
})
</script>

<style scoped>
.btn {
  text-align: center;
}
</style>
