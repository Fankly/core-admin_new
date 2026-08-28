<template>
  <vxe-modal
    :loading="loading"
    @close="closeHandle"
    @show="showHandle"
    position="center"
    resize
    :title="matterBasicMsg.title"
    width="950"
    height="410"
    v-model="isShowModal"
  >
    <div class="container">
      <!-- <div class="title">
        <span>事项基本信息</span>
      </div> -->
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
              <el-form-item label="单位编码：" prop="code">
                <el-input maxlength="120" placeholder="请输入单位编码" v-model="formData.code" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位名称：" prop="name">
                <el-input maxlength="120" placeholder="请输入单位名称" v-model="formData.name" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位属性：" prop="sx">
                <el-input maxlength="1" placeholder="请输入单位属性" v-model="formData.sx" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="市级产业单位编码：" prop="sgscydwCode">
                <el-input maxlength="30" placeholder="请输入市级产业单位编码" v-model="formData.sgscydwCode" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="市级产业单位名称：" prop="sgscydwName">
                <el-input maxlength="120" placeholder="请输入市级产业单位名称" v-model="formData.sgscydwName" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="县级供电单位编码：" prop="xgsgddwCode">
                <el-input maxlength="30" placeholder="请输入县级供电单位编码" v-model="formData.xgsgddwCode" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="县级供电单位名称：" prop="xgsgddwName">
                <el-input maxlength="120" placeholder="请输入县级供电单位名称" v-model="formData.xgsgddwName" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="市级供电单位编码：" prop="sgsgddwCode">
                <el-input maxlength="30" placeholder="请输入市级供电单位编码" v-model="formData.sgsgddwCode" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="市级供电单位名称：" prop="sgsgddwName">
                <el-input maxlength="120" placeholder="请输入市级供电单位名称" v-model="formData.sgsgddwName" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否县级供电单位审核：" prop="xgsgddwAudit">
                <el-select style="width: 100%" v-model="formData.xgsgddwAudit" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'">
                  <el-option
                    v-for="(item, index) in searchList.xgsgddwAuditOpt"
                    :key="index"
                    :label="item.name"
                    :value="item.code"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否市级供电单位审核：" prop="sgsgddwAudit">
                <el-select style="width: 100%" v-model="formData.sgsgddwAudit" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'">
                  <el-option
                    v-for="(item, index) in searchList.sgsgddwAuditOpt"
                    :key="index"
                    :label="item.name"
                    :value="item.code"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否市级产业单位审核：" prop="sgscydwAudit">
                <el-select style="width: 100%" v-model="formData.sgscydwAudit" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'">
                  <el-option
                    v-for="(item, index) in searchList.sgscydwAuditOpt"
                    :key="index"
                    :label="item.name"
                    :value="item.code"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="财务中台单位编码：" prop="bukrs">
                <el-input maxlength="120" placeholder="请输入财务中台单位编码" v-model="formData.bukrs" clearable :disabled="props.matterBasicMsg.opType == 'VIEW'"></el-input>
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
  name: 'YegddwpzBasicOperation'
}
</script>
<script setup lang="ts">
import { ref, defineExpose, defineEmits, defineProps, reactive, watch, nextTick } from 'vue'
import { saveMatterDwpzData, SaveYsdwMsg } from '@/api/matter/matterBasic'
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

const formData = reactive<SaveYsdwMsg>({
  code: '',
  name: '',
  sx: '',
  sgscydwCode: '',
  sgscydwName: '',
  xgsgddwCode: '',
  xgsgddwName: '',
  sgsgddwCode: '',
  sgsgddwName: '',
  xgsgddwAudit: '',
  sgsgddwAudit: '',
  sgscydwAudit: '',
  bukrs: ''
})

const searchList = reactive({
  xgsgddwAuditOpt: [
    {name: '是', code: 'Y'},
    {name: '否', code: 'N'}
  ],
  sgsgddwAuditOpt: [
    {name: '是', code: 'Y'},
    {name: '否', code: 'N'}
  ],
  sgscydwAuditOpt: [
    {name: '是', code: 'Y'},
    {name: '否', code: 'N'}
  ]
})

const rulesForm = reactive({
  code: [{ required: true, message: '请输入单位编码', trigger: ['blur'] }],
  name: [{ required: true, message: '请输入单位名称', trigger: ['blur'] }],
  sx: [{ required: false, message: '请输入单位属性', trigger: ['blur'] }],
  sgscydwCode: [{ required: false, message: '请输入市级产业单位编码', trigger: ['blur'] }],
  sgscydwName: [{ required: false, message: '请输入市级产业单位名称', trigger: ['blur'] }],
  xgsgddwCode: [{ required: false, message: '请输入县级供电单位编码', trigger: ['blur'] }],
  xgsgddwName: [{ required: false, message: '请输入县级供电单位名称', trigger: ['blur'] }],
  sgsgddwCode: [{ required: false, message: '请输入市级供电单位编码', trigger: ['blur'] }],
  sgsgddwName: [{ required: false, message: '请输入市级供电单位名称', trigger: ['blur'] }],
  xgsgddwAudit: [{ required: false, message: '请选择是否县级供电单位审核', trigger: ['change'] }],
  sgsgddwAudit: [{ required: false, message: '请选择是否市级供电单位审核', trigger: ['change'] }],
  sgscydwAudit: [{ required: false, message: '请选择是否市级产业单位审核', trigger: ['change'] }]
})

const showHandle = () => {
  if (['EDIT', 'VIEW'].includes(props.matterBasicMsg.opType)) {
    // 修改
    const paramsData = props.selectedData
    formData.code = paramsData.code
    formData.name = paramsData.name
    formData.sx = paramsData.sx
    formData.sgscydwCode = paramsData.sgscydwCode
    formData.sgscydwName = paramsData.sgscydwName
    formData.xgsgddwCode = paramsData.xgsgddwCode
    formData.xgsgddwName = paramsData.xgsgddwName
    formData.sgsgddwCode = paramsData.sgsgddwCode
    formData.sgsgddwName = paramsData.sgsgddwName
    formData.xgsgddwAudit = paramsData.xgsgddwAudit
    formData.sgsgddwAudit = paramsData.sgsgddwAudit
    formData.sgscydwAudit = paramsData.sgscydwAudit
    formData.bukrs = paramsData.bukrs
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
      const res = await saveMatterDwpzData({
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
    padding-bottom: 20px;
    text-align: center;
  }
}
</style>
