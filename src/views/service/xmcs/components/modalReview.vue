<!--评审意见弹窗组件 -->
<template>
  <div>
    <vxe-modal v-model="isShowModel" :destroy-on-close="true" resize show-zoom :title="`审批意见维护`" :width="1400" @close="closeHandle">
      <el-form label-suffix=" : " ref="rmarkDataRef" label-width="150px" label-position="right" :model="rmarkData">
        <el-form-item :label="`审核`" prop="opinion" :rules="[{ required: true, message: '请选择审核' }]">
          <el-select style="width: 100%" v-model="rmarkData.opinion" placeholder="请选择审核" clearable>
            <el-option v-for="item1 in options" :key="item1.code" :label="item1.name" :value="item1.code" />
          </el-select>
        </el-form-item>
        <el-form-item :label="`工作量及内容`" prop="reason" :rules="[{ required: true, message: '请输入工作量及内容审核说明' }]">
          <el-input
            :maxlength="2000"
            show-word-limit
            resize="none"
            type="textarea"
            :rows="5"
            v-model="rmarkData.reason"
            placeholder="请输入工作量及内容审核说明"
          />
        </el-form-item>
        <el-form-item :label="`单价`" prop="djReason" :rules="[{ required: true, message: '请输入单价审核说明' }]">
          <el-input
            :maxlength="2000"
            show-word-limit
            resize="none"
            type="textarea"
            :rows="5"
            v-model="rmarkData.djReason"
            placeholder="请输入单价审核说明"
          />
        </el-form-item>
        <el-form-item :label="`实施周期`" prop="sszqReason" :rules="[{ required: true, message: '请输入实施周期审核说明' }]">
          <el-input
            :maxlength="2000"
            show-word-limit
            resize="none"
            type="textarea"
            :rows="5"
            v-model="rmarkData.sszqReason"
            placeholder="请输入实施周期审核说明"
          />
        </el-form-item>
        <el-form-item v-if="isCity" :label="`业务界面`" prop="ywjm" :rules="[{ required: true, message: '请输入业务界面' }]">
          <el-input :maxlength="2000" show-word-limit resize="none" type="textarea" :rows="5" v-model="rmarkData.ywjm" placeholder="请输入业务界面" />
        </el-form-item>
        <el-form-item v-if="isShow" :label="`是否涉及核心业务`" prop="sfsjhxyw" :rules="[{ required: true, message: '请选择是否涉及核心业务' }]">
          <el-select style="width: 100%" v-model="rmarkData.sfsjhxyw" placeholder="请选择是否涉及核心业务" clearable>
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
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
  name: 'modalReview'
}
</script>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { getPublicCodeList } from '@/api/common'

// 子组件
const emit = defineEmits(['showModal', 'getReason'])
const rmarkDataRef = ref()
const isShowModel = ref(false)
const ids = ref<any[]>([])
const isShow = ref<boolean>(false)
const isCity = ref<boolean>(false)
// 弹框参数
const rmarkData = reactive({
  opinion: '',
  reason: '',
  djReason: '',
  sszqReason: '',
  ywjm: '',
  sfsjhxyw: ''
})
const options = ref<any>([])

// 关闭
const closeHandle = () => {
  rmarkDataRef.value.resetFields()
  isShowModel.value = false
}
const open = async (params: any) => {
  ids.value = params.ids
  isShow.value = params.userCount
  isCity.value = params.isCity
  // rmarkData.reason = params.reason
  // rmarkData.djReason = params.djReason
  // rmarkData.sszqReason = params.sszqReason
  console.log(params, 'params')
  const code: any = await getPublicCodeList({
    codes: ['ZXCS_SP_OPINION_COM']
  })
  options.value = code.data['ZXCS_SP_OPINION_COM']
  isShowModel.value = true
}
//保存
const pushMsgHandle = async () => {
  rmarkDataRef.value.validate(async (valid: any) => {
    if (!valid) return
    emit('showModal', { ...rmarkData, xmIds: ids.value })
  })
}
// 子组件暴露方法到父组件
defineExpose({
  open,
  closeHandle
})
</script>
