<!--select弹窗组件 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      :title="title"
      resize
      show-zoom
      :width="500"
      :height="240"
      :close-on-press-escape="false"
      @close="closeHandle"
    >
      <div class="modal_select">
        <el-radio-group v-model="type">
          <el-radio :label="'1'" size="large">增量导入</el-radio>
          <el-radio :label="'2'" size="large">覆盖导入</el-radio>
        </el-radio-group>
      </div>
      <div class="remark">
        <div>注：</div>
         <div>
          增量导入：保留已评审的意见；<br/>
          覆盖导入：覆盖已评审的意见。
         </div>
        </div>
      <div style="text-align: center;">
        <el-button size="mini" type="primary" plain @click="pushMsgHandle">确 定</el-button>
        <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'selectModal'
}
</script>
<script setup lang="ts">
import { ref, defineProps, defineEmits, defineExpose, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface propsVo {
  title: string
}
//接收父组件传参
const props = defineProps<propsVo>()
// 子组件
const emit = defineEmits(['showModal'])
const isShowModel = ref(false)
const type = ref<string>('')

// 关闭
const closeHandle = () => {
  type.value = ''
  isShowModel.value = false
}
//确定
const pushMsgHandle = () => {
  if (type.value == '') return ElMessage.warning('请选择评审模式！')
  emit('showModal', type.value)
}
// 子组件暴露方法到父组件
defineExpose({
  isShowModel,
  closeHandle,
  type
})
</script>
<style setup lang="less">
.modal_select {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 15px auto 0 auto;
}
.remark{
  color: var(--color-primary, #00857c);
  margin: 15px 0;
  display: flex;
  justify-content: center;
  :first-child{
    font-weight: bold;
  }
}
</style>
