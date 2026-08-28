<!-- 版本新增编辑弹窗 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      :title="props.title"
      :width="700"
      :close-on-press-escape="false"
      @close="closeHandle"
    >
      <el-form
        label-suffix=" : "
        ref="ruleFormRef"
        label-width="100px"
        label-position="right"
        :model="rmarkData"
        :rules="rules"
        :hide-required-asterisk="false"
      >
        <el-form-item label="版本名称" prop="versionName">
          <el-input :maxlength="60" show-word-limit resize="none" type="input" v-model.trim="rmarkData.versionName" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="remake">
          <el-input
            resize="none"
            type="textarea"
            :maxlength="256"
            show-word-limit
            :rows="7"
            v-model.trim="rmarkData.remake"
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
export default {}
</script>
<script setup lang="ts">
import { ref, defineProps, defineEmits, defineExpose, reactive } from 'vue'
import { ElMessageBox } from 'element-plus'

//接收父组件传参
const props = defineProps({
  title: {
    type: String,
    default: '版本创建'
  },
  nd: {
    type: Number,
    default: 0
  }
})
// 子组件
const emit = defineEmits(['showModal'])
const ruleFormRef = ref()
const dialogFormRef = ref()
const isShowModel = ref(false)
//表格规则
const rules = reactive({
  versionName: [
    {
      required: true,
      message: '版本名称不能为空',
      trigger: 'change'
    }
  ]
})
// 弹框参数
const rmarkData = ref<any>({})
// 关闭
const closeHandle = () => {
  ruleFormRef.value?.resetFields()
  isShowModel.value = false
}
//保存
const pushMsgHandle = () => {
  ruleFormRef.value.validate((valid: any) => {
    if (!valid) return
    rmarkData.value.nd = props.nd
    emit('showModal', { title: props.title, rmarkData: rmarkData.value })
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
