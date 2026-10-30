<template>
  <vxe-modal
    v-model="showModal"
    class-name="overview-config-modal"
    :title="title"
    width="min(760px, 92vw)"
    :loading="saving"
    position="center"
    destroy-on-close
    show-zoom
    resize
    esc-closable
  >
    <div class="config-form">
      <el-form ref="formRef" label-position="right" label-width="110px" :model="form" :rules="rules">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="阶段编码：" prop="jdbm">
              <el-input v-model="form.jdbm" placeholder="请输入阶段编码"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="阶段名称：" prop="jdmc">
              <el-input v-model="form.jdmc" placeholder="请输入阶段名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="子阶段编码：" prop="zjdbm">
              <el-input v-model="form.zjdbm"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="子阶段名称：" prop="zjdmc">
              <el-input v-model="form.zjdmc"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="阶段排序：" prop="jdpx">
              <el-input v-model="form.jdpx" maxlength="8" @input="(value: string) => (form.jdpx = digitsOnly(value))"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="子阶段排序：" prop="zjdpx">
              <el-input v-model="form.zjdpx" maxlength="8" @input="(value: string) => (form.zjdpx = digitsOnly(value))"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算类型：" prop="yslx">
              <el-input v-model="form.yslx"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="流程状态：" prop="flowStatus">
              <el-input v-model="form.flowStatus"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="省级联合核算：" prop="sjlhhs">
              <el-input v-model="form.sjlhhs"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="说明：" prop="dec">
              <el-input v-model="form.dec" type="textarea" :rows="2" resize="none"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述：" prop="des">
              <el-input v-model="form.des" type="textarea" :rows="2" resize="none"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div class="config-form-footer">
        <el-button plain size="small" type="primary" :loading="saving" @click="handleSave">保 存</el-button>
        <el-button plain size="small" type="primary" @click="showModal = false">取 消</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { saveOrUpdateConfig } from '@/api/overview'
import type { StatisticValue, XmzlConfig } from '@/api/overview'
import { createConfigForm, hasValue, toConfigPayload } from '../data/config'
import type { ConfigForm } from '../data/config'

type Mode = 'ADD' | 'EDIT'
type FieldCallback = (error?: Error) => void

const emit = defineEmits<{ (event: 'saved'): void }>()

const formRef = ref()
const showModal = ref(false)
const saving = ref(false)
const mode = ref<Mode>('ADD')
const editingId = ref<StatisticValue>()
const form = ref<ConfigForm>(createConfigForm())

const title = computed(() => (mode.value === 'ADD' ? '新增-总览阶段配置' : '修改-总览阶段配置'))

const digitsOnly = (value: string) => value.replace(/\D/g, '')

// 子阶段编码与名称须同时填写，只填一项时提示补全另一项。
const validateSubStage = (rule: { field: string }, value: string, callback: FieldCallback) => {
  const filledCode = hasValue(form.value.zjdbm)
  const filledName = hasValue(form.value.zjdmc)
  if (rule.field === 'zjdbm' && !filledCode && filledName) callback(new Error('已填写子阶段名称，请补充子阶段编码'))
  else if (rule.field === 'zjdmc' && !filledName && filledCode) callback(new Error('已填写子阶段编码，请补充子阶段名称'))
  else callback()
}

const rules = {
  jdbm: [{ required: true, whitespace: true, message: '请输入阶段编码', trigger: 'blur' }],
  jdmc: [{ required: true, whitespace: true, message: '请输入阶段名称', trigger: 'blur' }],
  zjdbm: [{ validator: validateSubStage, trigger: 'blur' }],
  zjdmc: [{ validator: validateSubStage, trigger: 'blur' }]
}

// 两个子阶段字段互相关联，任一项变化都清掉旧提示，保存时再整体校验。
watch(
  () => [form.value.zjdbm, form.value.zjdmc],
  () => formRef.value?.clearValidate(['zjdbm', 'zjdmc'])
)

const open = async (nextMode: Mode, row: XmzlConfig = {}) => {
  mode.value = nextMode
  editingId.value = nextMode === 'EDIT' ? row.id : undefined
  form.value = createConfigForm(row)
  showModal.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

const handleSave = async () => {
  if (saving.value || !formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const result = await saveOrUpdateConfig([toConfigPayload(form.value, editingId.value)])
    if (!result.success) throw new Error(result.msg || '保存失败')
    ElMessage.success('保存成功！')
    showModal.value = false
    emit('saved')
  } catch (error) {
    ElMessage.error((error as Error).message || '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="less">
.config-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 12px;
}
.config-form-footer {
  text-align: center;
}
</style>
