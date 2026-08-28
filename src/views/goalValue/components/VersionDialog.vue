<template>
  <vxe-modal
    @show="showHandle"
    :width="700"
    v-model="versionDialogInfo.isShowVersionDialog"
    :loading="versionDialogInfo.loading"
    position="center"
    resize
    :title="title"
    ref="versionDialogRef"
  >
    <el-form :disabled="isDisabled" ref="dialogFormRef" label-position="right" :label-width="120" :model="formData">
      <el-form-item label="版本名称：" prop="versionName">
        <el-input show-word-limit maxlength="40" v-model.trim="formData.versionName"></el-input>
      </el-form-item>
      <el-form-item label="是否预安排：" prop="sfyap">
        <el-select style="width: 100%" v-model="formData.sfyap">
          <el-option value="0" label="否"> </el-option>
          <el-option value="1" label="是"> </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="备注：" prop="remake">
        <el-input resize="none" :maxlength="256" show-word-limit :rows="7" type="textarea" v-model.trim="formData.remake"></el-input>
      </el-form-item>
    </el-form>
    <div class="operation">
      <el-button v-show="!isDisabled" type="primary" plain size="mini" @click="saveHandle">保 存</el-button>
      <el-button type="primary" plain size="mini" @click="cancelHandle">关 闭</el-button>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { reactive, ref, defineEmits, defineExpose, defineProps, toRef, computed, Ref } from 'vue'
import { addVersion, editVersion, FormParams } from '@/api/goalValue/version'
import { ElMessage } from 'element-plus'
import { IObject } from '@/types/interface'
import { VXETable } from 'vxe-table'

const emit = defineEmits(['closeDialog', 'searchData'])

const isDisabled = computed(() => props.flag === 'VIEW')

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  nd: {
    type: String,
    required: true
  },
  flag: {
    type: String,
    required: true
  },
  selectedData: {
    type: Object
  }
})

const nd = toRef(props, 'nd')

const selectData: Ref<any> = toRef(props, 'selectedData')

const versionDialogInfo = reactive({
  isShowVersionDialog: false,
  loading: false,
  title: ''
})

const formData = reactive<FormParams>({
  remake: '',
  sfyap: '0',
  versionName: ''
})
const versionDialogRef = ref()
const dialogFormRef = ref()

const cancelHandle = () => {
  dialogFormRef.value.resetFields()
  emit('closeDialog', false)
}

const saveHandle = async () => {
  const api: IObject = {
    ADD: addVersion,
    EDIT: editVersion
  }
  const params: IObject = {
    ...formData,
    nd: Number(nd.value)
  }
  if (props.flag === 'EDIT') {
    params['versionId'] = selectData.value.versionId
  }
  const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    const res = await api[props.flag](params)
    if (res.success) {
      ElMessage.success('保存成功')
      emit('searchData')
      cancelHandle()
    } else {
      ElMessage.error(res.msg)
    }
  }
}

const showHandle = () => {
  if (!props.nd) nd.value = new Date().getFullYear().toString()
  if (props.flag !== 'ADD') {
    formData.remake = selectData.value.remake
    formData.versionName = selectData.value.versionName
    formData.sfyap = selectData.value.sfyap
  }
}

defineExpose({
  versionDialogInfo
})
</script>

<style scoped lang="less">
.operation {
  text-align: center;
}
</style>
