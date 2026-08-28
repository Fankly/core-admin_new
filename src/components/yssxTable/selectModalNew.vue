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
      show-footer
      :width="500"
      :height="200"
      :close-on-press-escape="false"
      @close="closeHandle"
    >
      <div class="modal_select">
        <span style="width: 150px">{{ `${label}` }}</span>
        <el-select v-if="options.length" v-model="type" clearable filterable placeholder="请选择" style="width: 100%">
          <el-option v-for="item in options" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </div>
      <template #footer>
        <div style="text-align: center">
          <el-button size="mini" type="primary" plain @click="pushMsgHandle">确 定</el-button>
          <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
        </div>
      </template>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'selectModalNew'
}
</script>
<script setup lang="ts">
import { ref, defineProps, defineEmits, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'

interface ReviewModeOption {
  code: string
  name: string
}

interface propsVo {
  title: string
  label: string
  options?: ReviewModeOption[]
}
//接收父组件传参
const props = withDefaults(defineProps<propsVo>(), {
  options: () => []
})
// 子组件
const emit = defineEmits(['showModal'])
const isShowModel = ref(false)
const type = ref<string>('')

// 关闭
const closeHandle = () => {
  isShowModel.value = false
}
// 打开
const open = () => {
  isShowModel.value = true
  type.value = ''
}
//确定
const pushMsgHandle = async () => {
  if (!type.value) return ElMessage.warning(`请选择${props.label}!`)
  const key = await VXETable.modal.confirm(`确认当前选择？`, '提示', {
    status: 'warning'
  })
  if (key != 'confirm') return ElMessage.info('已取消')
  emit('showModal', type.value)
  closeHandle()
}
// 子组件暴露方法到父组件
defineExpose({
  open
})
</script>
<style setup lang="less">
.modal_select {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
