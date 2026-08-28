<script setup lang="ts" name="/goalValue/customGoalValue/components/FormDialog">
import MultipleProType from '@/views/statistics/components/MultipleProType.vue'
import type { InitParams } from '@/views/goalValue/customGoalValue/config.vue'
import { ElMessage } from 'element-plus'
import type { CustomConfigSaveData } from '@/api/goalValue/customGoalValue'
import { saveConfig } from '@/api/goalValue/customGoalValue'
import { getAllProtypeTreeNew } from '@/api/common'
import { defineProps, ref, toRef, defineExpose, reactive, defineEmits, watch } from 'vue'

interface DialogData {
  title: string
}

interface Props {
  dialogData: DialogData
  initParams: InitParams
  treeParams: any
  editData: any
  operationFlag: string
}

const props = defineProps<Props>()

const emit = defineEmits(['updateTable', 'clearData'])

const formRef = ref()
const protypeRef = ref()

const title = toRef(props.dialogData, 'title')
const showModal = ref(false)
const formDialogLoading = ref(false)
const ROOT_PARENT_ID = '0'

const formData = reactive<{
  name: string
  sort: string
  sfqy: string
  sfzgs: string
  leaf: string
  protypeIds: string
}>({
  name: '',
  sort: '',
  sfqy: '1',
  sfzgs: '0',
  leaf: '0',
  protypeIds: ''
})

const proTypeData = ref([])

const validateProType = (rules: any, value: string, callback: any) => {
  if (formData.leaf === '0') {
    callback()
    return
  }
  if (!value) {
    callback(new Error('请选择项目类型'))
    return
  }
  callback()
}

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'input' }],
  sort: [{ required: true, message: '请输入序号', trigger: 'input' }],
  sfqy: [{ required: true, message: '请选择是否启用', trigger: 'change' }],
  sfzgs: [{ required: true, message: '请选择是否子公司', trigger: 'change' }],
  leaf: [{ required: true, message: '请选择是否末级节点', trigger: 'change' }],
  protypeIds: [{ validator: validateProType, trigger: 'change' }]
}

const toStringOrDefault = (value: any, defaultValue: string) => {
  return value === undefined || value === null || value === '' ? defaultValue : String(value)
}

const toLeafValue = (value: any) => {
  if (typeof value === 'boolean') return value ? '1' : '0'
  return toStringOrDefault(value, '0')
}

const getProTypeData = async () => {
  let res = await getAllProtypeTreeNew()
  if (res.success) {
    proTypeData.value = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

const showModalHandle = () => {
  if (protypeRef.value) protypeRef.value.clearHandle()
  getProTypeData()
  if (props.operationFlag === 'EDIT') {
    formData.name = props.editData?.name || ''
    formData.sort = toStringOrDefault(props.editData?.sort, '')
    formData.sfqy = toStringOrDefault(props.editData?.sfqy, '1')
    formData.sfzgs = toStringOrDefault(props.editData?.sfzgs, '0')
    formData.leaf = toLeafValue(props.editData?.leaf)
    formData.protypeIds = props.editData?.protypeIds || props.editData?.proType || ''
    return
  }
  resetMethod()
}

const getParentId = () => {
  if (props.operationFlag === 'EDIT') {
    return String(props.editData?.parentId || ROOT_PARENT_ID)
  }
  const treeNodeId = props.treeParams?.id ? String(props.treeParams.id) : ROOT_PARENT_ID
  return treeNodeId === props.initParams.nd ? ROOT_PARENT_ID : treeNodeId
}

const saveDataHandle = async () => {
  if (!formRef.value) return
  try {
    let validateRes = await formRef.value.validate()
    if (validateRes) {
      formDialogLoading.value = true
      let params: CustomConfigSaveData = {
        name: formData.name,
        nd: props.initParams.nd,
        parentId: getParentId(),
        protypeIds: formData.leaf === '1' ? formData.protypeIds : '',
        sfqy: formData.sfqy,
        sfzgs: formData.sfzgs,
        leaf: formData.leaf,
        sort: formData.sort
      }
      if (props.operationFlag === 'EDIT') {
        params.id = props.editData.id
      }
      let res = await saveConfig(params)
      if (res.success) {
        ElMessage.success('保存成功！')
        formDialogLoading.value = false
        emit('updateTable')
        closeModalHandle()
      } else {
        ElMessage.error(res.msg)
        formDialogLoading.value = false
      }
    }
  } catch {
    ElMessage.error('保存失败，请稍后重试')
    formDialogLoading.value = false
  }
}

watch(
  () => formData.leaf,
  (newVal) => {
    if (newVal === '0') {
      formData.protypeIds = ''
      formRef.value?.clearValidate?.('protypeIds')
    }
  }
)

const resetMethod = () => {
  formData.name = ''
  formData.sort = ''
  formData.sfqy = '1'
  formData.sfzgs = '0'
  formData.leaf = '0'
  formData.protypeIds = ''
}

const closeModalHandle = () => {
  showModal.value = false
  resetMethod()
  emit('clearData')
}

defineExpose({
  title,
  showModal
})
</script>

<template>
  <vxe-modal
    :destroy-on-close="true"
    :loading="formDialogLoading"
    @show="showModalHandle"
    @close="closeModalHandle"
    class-name="modal"
    height="250"
    v-model="showModal"
    width="40%"
    :title="title"
    show-zoom
    resize
  >
    <div class="modal">
      <div class="main">
        <el-form ref="formRef" label-position="right" label-width="120px" :model="formData" :rules="rules">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="名称：" prop="name">
                <el-input maxlength="31" v-model="formData.name"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="序号：" prop="sort">
                <el-input
                  v-model="formData.sort"
                  maxlength="8"
                  @input="(v:string) => (formData.sort = v.replace(/[^\d]/g, ''))"
                  :controls="false"
                  placeholder=""
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="是否启用：" prop="sfqy">
                <el-select v-model="formData.sfqy" style="width: 100%">
                  <el-option value="1" label="启用"></el-option>
                  <el-option value="0" label="停用"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否子公司：" prop="sfzgs">
                <el-select v-model="formData.sfzgs" style="width: 100%">
                  <el-option value="1" label="是"></el-option>
                  <el-option value="0" label="否"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="是否末级节点：" prop="leaf">
                <el-select v-model="formData.leaf" style="width: 100%">
                  <el-option value="1" label="是"></el-option>
                  <el-option value="0" label="否"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="formData.leaf === '1'" :span="12">
              <el-form-item label="项目类型：" prop="protypeIds">
                <MultipleProType
                  ref="protypeRef"
                  style="width: 100%"
                  :leaf-only="true"
                  v-model="formData.protypeIds"
                  :props="{
                    children: 'children',
                    label: 'name'
                  }"
                  :value-key-type="true"
                  :tree-data="proTypeData"
                  placeholder="请选择项目类型"
                ></MultipleProType>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="footer">
        <el-button plain size="mini" type="primary" @click="saveDataHandle">保 存</el-button>
        <el-button plain size="mini" type="primary" @click="closeModalHandle">取 消</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<style lang="less" scoped>
.main {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.footer {
  text-align: center;
}

.modal {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
