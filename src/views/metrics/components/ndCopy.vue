<!-- 复制 -->
<template>
  <div>
    <vxe-modal
      v-model="treeModal"
      :destroy-on-close="true"
      :title="title"
      height="200"
      width="24%"
      :close-on-press-escape="false"
      @close="closeModalHandle"
    >
      <el-form label-suffix=":">
        <el-form-item label="当前年度" prop="recState">
          <el-select style="width: 100%" disabled v-model="formData.sourceNd" placeholder="请选择当前年度">
            <el-option v-for="item1 in ndList" :key="item1.yearCode" :label="item1.yearName" :value="item1.yearCode"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="复制年度" prop="isDisplay">
          <el-select style="width: 100%" v-model="formData.targetNd" placeholder="请选择复制年度">
            <el-option v-for="item1 in ndList" :key="item1.yearCode" :label="item1.yearName" :value="item1.yearCode"> </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div style="text-align: center; margin-top: 20px">
        <el-button plain size="mini" type="primary" @click="handleClick">保 存</el-button>
        <el-button plain size="mini" type="primary" @click="closeModalHandle">关 闭</el-button>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: '/metrics/components/ndCopy'
}
</script>
<script setup lang="ts">
import { onMounted, ref, reactive, nextTick, computed, defineExpose, defineEmits, handleError } from 'vue'
import { ElMessageBox, ElMessage, ElInput } from 'element-plus'

const emit = defineEmits(['handlerCopy'])

const ndList = ref<any[]>([])
const formData = reactive({
  sourceNd: '',
  targetNd: ''
})

const treeModal = ref<boolean>(false)
const title = ref<any>('弹窗') //弹窗标题
const treeDataList = ref<any[]>([]) // 单位树结构

//关闭树结构弹窗
const closeModalHandle = () => {
  treeModal.value = false
  formData.targetNd = ''
}
const handleClick = () => {
  if (formData.targetNd == '') {
    return ElMessage.warning('请选择年度')
  }
  emit('handlerCopy', formData)
}
defineExpose({
  treeModal,
  ndList,
  title,
  treeDataList,
  closeModalHandle,
  formData
})
</script>
