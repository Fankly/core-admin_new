<!--更新406号文金额弹窗组件 -->
<template>
  <div>
    <vxe-modal v-model="isShowModel" :destroy-on-close="true" resize show-zoom :title="`更新406号文金额`" :width="800" @close="closeHandle">
      <el-form label-suffix=" : " ref="rmarkDataRef" label-width="150px" label-position="right" :model="rmarkData">
        <el-form-item :label="`项目名称`" prop="xmmc" :rules="[{ required: true, message: '请输入项目名称' }]">
          <el-input disabled :maxlength="100" v-model.trim="rmarkData.xmmc" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item :label="`动因名称`" prop="sheetname" :rules="[{ required: true, message: '请输入动因名称' }]">
          <el-input :maxlength="100" v-model.trim="rmarkData.sheetname" placeholder="请输入动因名称" />
        </el-form-item>
        <el-form-item v-if="isDecs" :label="`定额金额`" prop="decsjg" :rules="[{ required: true, message: '请输入定额金额' }]">
          <el-input :maxlength="100" v-model.trim="rmarkData.decsjg" placeholder="请输入定额金额" />
        </el-form-item>
        <el-form-item v-else :label="`406金额`" prop="fourzerosixwcsjg" :rules="[{ required: true, message: '请输入406金额' }]">
          <el-input :maxlength="100" v-model.trim="rmarkData.fourzerosixwcsjg" placeholder="请输入406金额" />
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
  name: 'modalAmount'
}
</script>
<script setup lang="ts">
import { ref, reactive } from 'vue'
interface rmarkDataVo {
  xmmc: string
  sheetname: string
  fourzerosixwcsjg: string | undefined
  decsjg: string | undefined
}

// 子组件
const emit = defineEmits(['showModal'])
const rmarkDataRef = ref()
const isShowModel = ref(false)
const isDecs = ref<any>(false)
const ids = ref<any[]>([])
// 弹框参数
const rmarkData = reactive({
  xmmc: '',
  sheetname: '',
  fourzerosixwcsjg: undefined,
  decsjg: undefined
})

// 关闭
const closeHandle = () => {
  rmarkDataRef.value.resetFields()
  isShowModel.value = false
}
const open = async (params: any) => {
  rmarkData.xmmc = params.xmmc
  isShowModel.value = true
}
//保存
const pushMsgHandle = async () => {
  rmarkDataRef.value.validate(async (valid: any) => {
    if (!valid) return
    if (isDecs.value) {
      rmarkData.fourzerosixwcsjg = undefined
    } else {
      rmarkData.decsjg = undefined
    }
    emit('showModal', { ...rmarkData })
  })
}
// 子组件暴露方法到父组件
defineExpose({
  open,
  closeHandle,
  isDecs
})
</script>
