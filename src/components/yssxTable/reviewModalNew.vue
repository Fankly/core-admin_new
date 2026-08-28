<!--评审意见弹窗组件 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      resize
      show-zoom
      :title="title"
      :width="1200"
      :close-on-press-escape="false"
      @close="closeHandle"
    >
      <el-form label-suffix=" : " ref="rmarkDataRef" label-width="160px" label-position="right" :model="rmarkData">
        <el-form-item :label="`${label}说明`" prop="reason">
          <el-input
            :maxlength="2000"
            show-word-limit
            resize="none"
            type="textarea"
            :rows="20"
            v-model="rmarkData.reason"
            placeholder="请输入"
          ></el-input>
        </el-form-item>
      </el-form>
      <div style="text-align: center">
        <el-button size="mini" type="primary" plain @click="pushMsgHandle">保 存</el-button>
        <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'reviewModal'
}
</script>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface propsVo {
  title: string
  label: string
  text: string
}
//接收父组件传参
const props = defineProps<propsVo>()
// 子组件
const emit = defineEmits(['showModal'])
const rmarkDataRef = ref()
const dialogFormRef = ref()
const isShowModel = ref(false)
// 弹框参数
const rmarkData = reactive({
  reviewOpinion: '',
  reason: ''
})
const options = ref([
  { code: '1', name: '通过' },
  { code: '0', name: '不通过' }
])

// 关闭
const closeHandle = () => {
  rmarkDataRef.value.resetFields()
  isShowModel.value = false
}
//保存
const pushMsgHandle = () => {
  if (rmarkData.reason == null || rmarkData.reason.trim() == '') {
    return ElMessage.warning('原因说明不能为空')
  }
  ElMessageBox.confirm(props.text, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('showModal', rmarkData)
    })
    .catch((error: any) => {
      console.log(error)
    })
}
// 子组件暴露方法到父组件
defineExpose({
  dialogFormRef,
  isShowModel,
  closeHandle,
  rmarkData
})
</script>
