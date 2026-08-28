<script setup lang="ts">
import { getPublicData } from '@/api/common'
import { ref, defineExpose, defineProps, reactive, defineEmits } from 'vue'
import { getYssxBasicList, linkYssx } from '@/api/service/requirement'
import { ElMessage } from 'element-plus'

const props = defineProps({
  selectDatas: {
    type: Object as any,
    required: true
  }
})
const ndDataList = ref<
  {
    code: string
    name: string
  }[]
>([])
const isShowModal = ref(false)
const loading = ref(false)
const formRef = ref()
const formData = ref({
  yssxId: '',
  nd: ''
})

const emit = defineEmits(['updateTable'])

const yssxList = ref<
  {
    code: string
    name: string
  }[]
>([])

const formRuls = reactive({
  yssxId: {
    required: true,
    message: '请选择预算事项',
    trigger: 'change'
  },
  nd: {
    required: true,
    message: '请选择年度',
    trigger: 'change'
  }
})

const matterHandle = async () => {
  try {
    const result = await formRef.value.validate()
    if (result) {
      loading.value = true
      const xmIds = props.selectDatas.map((item: any) => item.id)
      const res = await linkYssx({
        yssxId: formData.value.yssxId,
        xmIds: xmIds
      })
      if (res.success) {
        loading.value = false
        ElMessage.success('关联成功')
        emit('updateTable')
        closeHandle()
      } else {
        ElMessage.error(res.msg)
      }
    }
  } catch (e: any) {
    console.error(e.toString())
  } finally {
    loading.value = false
  }
}

const getPublicCodeData = async () => {
  try {
    loading.value = true
    const res = await getPublicData('ZLYS_XMJHSSND')
    if (!res.success) {
      throw new Error(res.msg)
    }
    ndDataList.value = res.data
  } catch (e: any) {
    ElMessage.error(e.toString())
  } finally {
    loading.value = false
  }
}

const getMatterDataList = async () => {
  try {
    loading.value = true
    formData.value.yssxId = ''
    yssxList.value = []
    const res = await getYssxBasicList({
      nd: formData.value.nd,
      protypeId: props.selectDatas[0].xmlx
    })
    if (res.success) {
      yssxList.value = res.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const showHandle = async () => {
  formData.value.nd = new Date().getFullYear().toString()
  getPublicCodeData()
  getMatterDataList()
}

const closeHandle = () => {
  formData.value.yssxId = ''
  formData.value.nd = new Date().getFullYear().toString()
  ndDataList.value = []
  yssxList.value = []
  isShowModal.value = false
}

defineExpose({
  isShowModal
})
</script>

<template>
  <vxe-modal
    @close="closeHandle"
    :loading="loading"
    @show="showHandle"
    resize
    title="关联事项"
    v-model="isShowModal"
    width="385"
    height="200"
    position="center"
  >
    <el-form label-width="80px" label-position="right" ref="formRef" :model="formData" :rules="formRuls">
      <el-form-item label="年度" prop="nd">
        <el-select @change="getMatterDataList" filterable style="width: 100%" v-model="formData.nd">
          <el-option v-for="item in ndDataList" :key="item.code" :label="item.name" :value="item.code"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="预算事项" prop="yssxId">
        <el-select filterable style="width: 100%" v-model="formData.yssxId">
          <el-option v-for="item in yssxList" :key="item.code" :label="item.name" :value="item.code"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div style="text-align: center">
      <el-button type="primary" plain size="mini" @click="matterHandle">关联事项</el-button>
      <el-button type="primary" plain size="mini" @click="closeHandle">取消</el-button>
    </div>
  </vxe-modal>
</template>

<style scoped lang="less"></style>
