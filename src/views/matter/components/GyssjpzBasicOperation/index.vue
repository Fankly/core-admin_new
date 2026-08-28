<template>
  <vxe-modal
    :loading="loading"
    @close="closeHandle"
    @show="showHandle"
    position="center"
    resize
    :title="matterBasicMsg.title"
    width="950"
    height="250"
    v-model="isShowModal"
  >
    <div class="container">
      <div class="content">
        <el-form
          ref="formRef"
          :model="formData"
          label-position="right"
          label-width="100px"
          :rules="rulesForm"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="统驭科目：" prop="akont">
                <el-input maxlength="120" placeholder="请输入统驭科目" v-model="formData.akont" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="公司代码：" prop="bukrs">
                <el-input maxlength="120" placeholder="请输入公司代码" v-model="formData.bukrs" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="编号：" prop="lifnr">
                <el-input maxlength="120" placeholder="请输入编号" v-model="formData.lifnr" clearable :disabled="props.matterBasicMsg.opType !== 'ADD'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="名称：" prop="name1">
                <el-input maxlength="120" placeholder="请输入名称" v-model="formData.name1" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="operation">
        <el-button v-if="['ADD', 'EDIT'].includes(props.matterBasicMsg.opType)" plain type="primary" size="mini" @click="saveHandle">保 存</el-button>
        <el-button plain type="primary" size="mini" @click="closeHandle">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'GyssjpzBasicOperation'
}
</script>
<script setup lang="ts">
import { ref, defineExpose, defineEmits, defineProps, reactive, watch, nextTick } from 'vue'
import { saveOrUpdate } from '@/api/matter/matterBasic'
import { ElMessage } from 'element-plus'

interface MatterBasicMsg {
  title: string
  opType: string
}

interface Props {
  matterBasicMsg: MatterBasicMsg
  selectedData: any
}

interface RowVO {
  code: string
  name: string
  id: any
  note: any
  unicode: any
  [key: string]: number | string
}

const props = defineProps<Props>()
const emit = defineEmits(['saveData'])

const formRef = ref()
const isShowModal = ref(false)
const loading = ref(false)
const formData = ref<any>({
  akont: '',
  bukrs: '',
  lifnr: '',
  name1: ''
})

const rulesForm = reactive({
  akont: [{ required: true, message: '请输入统驭科目', trigger: ['blur'] }],
  bukrs: [{ required: true, message: '请输入公司代码', trigger: ['blur'] }],
  lifnr: [{ required: true, message: '请输入编码', trigger: ['blur'] }],
  name1: [{ required: true, message: '请输入名称', trigger: ['blur'] }]
})

const showHandle = () => {
  if (props.matterBasicMsg.opType == 'EDIT') {
    // 修改
    const paramsData = props.selectedData
    formData.value.akont = paramsData.akont
    formData.value.bukrs = paramsData.bukrs
    formData.value.lifnr = paramsData.lifnr
    formData.value.name1 = paramsData.name1
  }
  console.log(1111, formData.value) 
}

// 关闭
const closeHandle = () => {
  formRef.value.resetFields()
  isShowModal.value = false
}

// 保存
const saveHandle = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      loading.value = true
      const res = await saveOrUpdate({
        ...formData.value
      })
      if (res.success) {
        ElMessage.success('保存成功!')
        emit('saveData')
        loading.value = false
        closeHandle()
      } else {
        ElMessage({
          type: 'error',
          message: res.msg
        })
        loading.value = false
      }
    }
  })
}

defineExpose({
  isShowModal
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  .title {
    padding-bottom: 10px;
    color: #0c6f67;
    text-align: center;
    span {
      font-size: 18px;
      font-weight: bold;
    }
  }
  .operation {
    text-align: center;
  }
}
</style>
