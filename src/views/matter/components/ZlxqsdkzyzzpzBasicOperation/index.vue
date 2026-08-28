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
          label-width="200px"
          :rules="rulesForm"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="主键ID：" prop="id">
                <el-input maxlength="120" placeholder="请选择主键ID" v-model="formData.id" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="省对口专业部门编码：" prop="code">
                <el-input maxlength="120" placeholder="请输入省对口专业部门编码" v-model="formData.code" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="省对口专业部门名称：" prop="name">
                <el-input maxlength="120" placeholder="省对口专业部门名称" v-model="formData.name" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位性质：" prop="dwxz">
                <el-input maxlength="120" placeholder="请输入单位性质" v-model="formData.dwxz" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="租赁资产类型：" prop="zlzclx">
                <el-input maxlength="120" placeholder="请输入租赁资产类型" v-model="formData.zlzclx" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
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
  name: 'ZlxqsdkzyzzpzBasicOperation'
}
</script>
<script setup lang="ts">
import { ref, defineExpose, defineEmits, defineProps, reactive, watch, nextTick } from 'vue'
import { saveZlsdkzybmclbpz, SaveSdkzybmbzMsg } from '@/api/matter/matterBasic'
import { ElMessage } from 'element-plus'
import proTable from '@/components/ProTable/index.vue' //表格组件

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

const xmlxRef = ref()
const formRef = ref()

const isShowModal = ref(false)
const loading = ref(false)

const checkCodes = ref<any>([])

const isShowTable = ref<boolean>(false)
const proTableRef = ref()

const formData = reactive<SaveSdkzybmbzMsg>({
  id: '',
  code: '',
  name: '',
  dwxz: '',
  zlzclx: ''
})

const rulesForm = reactive({
  id: [{ required: true, message: '请输入主键ID', trigger: ['blur'] }],
  code: [{ required: true, message: '请输入省对口专业部门编码', trigger: ['blur'] }],
  name: [{ required: true, message: '请输入省对口专业部门名称', trigger: ['blur'] }],
  dwxz: [{ required: true, message: '请输入单位性质', trigger: ['blur'] }],
  zlzclx: [{ required: true, message: '请输入租赁资产类型', trigger: ['blur'] }]
})

const showHandle = () => {
  if (props.matterBasicMsg.opType == 'EDIT') {
    // 修改
    const paramsData = props.selectedData
    formData.id = paramsData.id
    formData.code = paramsData.code
    formData.name = paramsData.name
    formData.dwxz = paramsData.dwxz
    formData.zlzclx = paramsData.zlzclx
  }
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
      const res = await saveZlsdkzybmclbpz({
        ...formData
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
