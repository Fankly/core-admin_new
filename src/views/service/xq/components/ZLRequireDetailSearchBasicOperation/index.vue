<template>
  <vxe-modal
    :loading="loading"
    @close="closeHandle"
    @show="showHandle"
    position="center"
    resize
    :title="matterBasicMsg.title"
    width="900"
    height="210"
    v-model="isShowModal"
  >
    <div class="container">
      <div class="content">
        <el-form
          ref="formRef"
          :model="formData"
          label-position="right"
          label-width="160px"
          :rules="rulesForm"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="项目实施部门：" prop="FZRBH">
                <el-select
                  v-model="formData.FZRBH"
                  placeholder="请选择项目实施部门"
                  clearable
                  filterable
                  style="width: 100%"
                >
                  <el-option
                    v-for="option in xmssbmOpt"
                    :key="option.code"
                    :label="option.name"
                    :value="option.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目所在地：" prop="XMSZD">
                <TreeSelect
                  v-model="formData.XMSZD"
                  style="width: 100%"
                  :data="treeData"
                  :props="{ children: 'children', label: 'name', value: 'id' }"
                  node-key="id"
                  clearable
                  filterable
                  placeholder="请选择项目所在地"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="含税总租金(万元)：" prop="ALL_INVEST_TAX">
                <el-input 
                  v-model="formData.ALL_INVEST_TAX"
                  placeholder="请输入不含税总租金"
                  disabled
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="不含税总租金(万元)：" prop="ALL_INVEST_TAX_FREE">
                <el-input
                  v-model="formData.ALL_INVEST_TAX_FREE"
                  placeholder="请输入不含税总租金"
                  @input="(e: any) => formData.ALL_INVEST_TAX_FREE = checkNumberInput(e, 20)"
                  @change="handleFieldChange('ALL_INVEST_TAX_FREE', formData.ALL_INVEST_TAX_FREE)"
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="operation">
        <el-button plain type="primary" size="mini" @click="saveHandle">保 存</el-button>
        <el-button plain type="primary" size="mini" @click="closeHandle">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
import TreeSelect from '@/components/TreeSelect'
export default {
  name: 'ZLRequireDetailSearchBasicOperation',
  components: {
    TreeSelect
  }
}
</script>
<script setup lang="ts">
import { ref, defineExpose, defineEmits, defineProps, reactive, watch, nextTick } from 'vue'
import { saveZlxmbc, SaveXmxxbcMsg } from '@/api/matter/matterBasic'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'

interface MatterBasicMsg {
  title: string
  opType: string
}

interface userInfo {
  dwId: string
  deptId: string
}

interface Props {
  matterBasicMsg: MatterBasicMsg
  selectedData: any
  userInfo: any
}

const props = defineProps<Props>()
const emit = defineEmits(['saveData'])
const formRef = ref()
const isShowModal = ref(false)
const loading = ref(false)

const formData = reactive<SaveXmxxbcMsg>({
  FZRBH: '',
  XMSZD: '',
  ALL_INVEST_TAX: '',
  ALL_INVEST_TAX_FREE: ''
})

const xmssbmOpt = ref<any>({})
const treeData = ref<any>({})

const loadOptionsData = async () => {
  const xmssbmData = await baseService.post('/commonCode/getCommonCode', {
    bmId: props.userInfo?.deptId || '',
    dwId: props.userInfo?.dwId || '',
    codes: ['GKBM']
  })
  if (xmssbmData.success) {
    if (xmssbmData.data && xmssbmData.data.length > 0) {
      xmssbmOpt.value = xmssbmData.data[0].codes || []
    }
  }

  const xmszdData = await baseService.post('/commonCode/getXmszd', {
    bmId: props.userInfo?.deptId || '',
    dwId: props.userInfo?.dwId || ''
  })
  if (xmszdData.success) {
    treeData.value = xmszdData.data || []
  }
}

const rulesForm = reactive({
  FZRBH: [{ required: true, message: '请选择项目实施部门', trigger: ['blur'] }],
  XMSZD: [{ required: true, message: '请选择项目所在地', trigger: ['blur'] }],
  ALL_INVEST_TAX: [{ required: true, message: '请输入含税总租金', trigger: ['blur'] }],
  ALL_INVEST_TAX_FREE: [{ required: true, message: '请输入不含税总租金', trigger: ['blur'] }]
})

const showHandle = () => {
  if (props.matterBasicMsg.opType == 'xmxxbc') {
    // 项目信息补充
    const paramsData = props.selectedData
    formData.FZRBH = paramsData.fzrbh
    formData.XMSZD = paramsData.xmszd
    formData.ALL_INVEST_TAX = paramsData.all_invest_tax
    formData.ALL_INVEST_TAX_FREE = paramsData.all_invest_tax_free
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
      // 判断不含税总租金(万元)不能大于含税总租金(万元)
      if (Number(formData.ALL_INVEST_TAX_FREE) > Number(formData.ALL_INVEST_TAX)) {
        formData.ALL_INVEST_TAX_FREE = ''
        ElMessage.warning(`不含税总租金输入有误，不能大于含税总租金！`)
        return
      }
      loading.value = true
      const res = await saveZlxmbc({
        ...formData,
        xmId: props.selectedData.id
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

const checkNumberInput = (value: any, maxLen: any) => {
  value = value.replace(/[^\d.]/g, '').replace(/\.{6,}/g, '.').replace('.', '$#$').replace(/\./g, '').replace('$#$', '.').replace(/^(\-)*(\d+)\.(\d\d\d\d\d\d).*$/, '$1$2.$3').replace(/^\./g, '');
  if (maxLen) {
    value = value.substr(0, maxLen)
  }
  return value;
}

const handleFieldChange = (prop: any, value: any) => {
  if (prop === 'ALL_INVEST_TAX_FREE') {
    // 不含税总租金(万元)
    if (formData.ALL_INVEST_TAX && value && Number(value) > Number(formData.ALL_INVEST_TAX)) {
      formData.ALL_INVEST_TAX_FREE = ''
      ElMessage.warning(`不含税总租金输入有误，不能大于含税总租金！`)
    }
  }
}

watch(
  () => isShowModal.value,
  (newVal) => {
    if (newVal) {
      loadOptionsData()
    }
  },
  {
    immediate: true
  }
)

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
