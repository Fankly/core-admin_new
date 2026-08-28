<!--select弹窗组件 -->
<template>
  <vxe-modal
    ref="dialogFormRef"
    v-model="isShowModel"
    :destroy-on-close="true"
    :title="title"
    resize
    show-footer
    show-zoom
    :width="420"
    :height="180"
    :close-on-press-escape="false"
    @close="closeHandle"
  >
    <div class="modal_select">
      <el-radio-group v-if="options.length" v-model="type" :disabled="disabled || loading">
        <el-radio v-for="item in options" :key="item.code" :label="item.code" size="large">{{ item.name }}</el-radio>
      </el-radio-group>
      <div v-else class="empty-option">{{ loading ? '评审模式加载中...' : '评审模式加载失败，请稍后重试' }}</div>
    </div>
    <template #footer>
      <div style="text-align: center">
        <el-button size="mini" type="primary" plain :disabled="disabled || loading || !options.length" @click="pushMsgHandle">确 定</el-button>
        <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="selectModal">
import { ref, defineProps, defineEmits, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'

interface PublicCodeOption {
  code: string
  name: string
}

interface propsVo {
  title: string
  label: string
  options?: PublicCodeOption[]
  loading?: boolean
  disabled?: boolean
}
//接收父组件传参
const props = withDefaults(defineProps<propsVo>(), {
  options: () => [],
  loading: false,
  disabled: false
})
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
  if (props.disabled || props.loading || !props.options.length) return ElMessage.warning('评审模式加载失败，请稍后重试')
  if (!type.value) return ElMessage.warning('请选择评审模式！')
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
  min-height: 48px;
  .el-radio-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    row-gap: 8px;
  }
}
.empty-option {
  color: var(--color-primary, #00857c);
  line-height: 48px;
}
</style>
