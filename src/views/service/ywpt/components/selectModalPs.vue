<!--select弹窗组件 -->
<template>
  <vxe-modal ref="dialogFormRef" show-footer v-model="isShowModel" :destroy-on-close="true" :title="title" resize :width="300" :height="180" :close-on-press-escape="false" @close="closeHandle">
    <div class="modalCss">
      <div class="modal_select">
        <el-radio-group v-model="type">
          <el-radio :label="'1'" size="large">通过</el-radio>
          <el-radio :label="'0'" size="large">不通过</el-radio>
        </el-radio-group>
      </div>
      <div class="modal_btn">
        <el-button size="mini" type="primary" plain @click="pushMsgHandle">确 定</el-button>
        <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
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
  isShowModel.value = false
}
//确定
const pushMsgHandle = () => {
  ElMessageBox.confirm('终评仅一次提交机会且不可更改,请确认无误后提交!', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('showModal', type.value)
    })
    .catch((error: any) => {
      console.log(error)
    })
}
// 子组件暴露方法到父组件
defineExpose({
  isShowModel,
  closeHandle
})
</script>
<style setup lang="less">
.modalCss {
  width: 100%;
  height: 100%;
  position: relative;
  border:1px solid transparent;
  .modal_select {
    display: flex;
    align-items: center;
    justify-content: center;
    // margin: 15px 0 0 0;  
  }
  .modal_btn{
    position: absolute;
    bottom: 5px;
    left:50%;
    transform: translate(-50%,0);
  }
}
</style>
