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
        <el-form-item :label="`${label}`" prop="reviewOpinion">
          <el-select style="width: 100%" v-model="rmarkData.reviewOpinion" placeholder="请选择" clearable>
            <el-option v-for="item1 in options" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
          </el-select>
        </el-form-item>
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
        <el-button v-if="title == '联合会审终评意见'" size="mini" type="primary" plain @click="getReason('test')"> 汇总组员评审意见 </el-button>
        <el-button size="mini" type="primary" plain @click="pushMsgHandle">保 存</el-button>
        <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, defineProps, defineEmits, defineExpose, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

//接收父组件传参
const props = defineProps({
  title: {
    type: String,
    default: '高级设置'
  },
  label: {
    type: String,
    default: '专家评审意见'
  }
})
// 子组件
const emit = defineEmits(['showModal', 'getReason'])
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
const getReason = (val: any) => {
  emit('getReason', val)
}
//保存
const pushMsgHandle = () => {
  let msg = props.label == '专家评审意见' ? '请确定要保存的内容' : '终评仅一次提交机会且不可更改,请确认无误后提交!'
  if (rmarkData.reviewOpinion == '' || rmarkData.reviewOpinion == null) {
    return ElMessage.warning(`${props.label}不能为空`)
  }
  if (rmarkData.reason == null || rmarkData.reason.trim() == '') {
    return ElMessage.warning('原因说明不能为空')
  }
  ElMessageBox.confirm(msg, '提示', {
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
