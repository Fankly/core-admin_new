<!--评审意见弹窗组件 -->
<template>
  <div>
    <vxe-modal v-model="isShowModel" :destroy-on-close="true" resize show-zoom :title="`审批意见维护`" :width="800" @close="closeHandle">
      <el-form label-suffix=" : " ref="rmarkDataRef" label-width="150px" label-position="right" :model="rmarkData">
        <el-form-item :label="`创建人`" prop="creator" :rules="[{ required: true, message: '请输入创建人' }]">
          <el-input :maxlength="100" v-model="rmarkData.creator" placeholder="请输入创建人" />
        </el-form-item>
        <el-form-item :label="`创建账号`" prop="creatorAccount" :rules="[{ required: true, message: '请输入创建账号' }]">
          <el-input :maxlength="100" v-model="rmarkData.creatorAccount" placeholder="请输入创建账号" />
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
  name: 'modalCount'
}
</script>
<script setup lang="ts">
import { ref, reactive } from 'vue'

// 子组件
const emit = defineEmits(['showModal'])
const rmarkDataRef = ref()
const isShowModel = ref(false)
const ids = ref<any[]>([])
// 弹框参数
const rmarkData = reactive({
  creator: '',
  creatorAccount: ''
})

// 关闭
const closeHandle = () => {
  rmarkDataRef.value.resetFields()
  isShowModel.value = false
}
const open = async (params: any) => {
  ids.value = params.ids || []
  isShowModel.value = true
}
//保存
const pushMsgHandle = async () => {
  rmarkDataRef.value.validate(async (valid: any) => {
    if (!valid) return
    emit('showModal', { ...rmarkData, xmid: ids.value })
  })
}
// 子组件暴露方法到父组件
defineExpose({
  open,
  closeHandle
})
</script>
