<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-rule-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="50%"
    @close="handleClose"
    :loading="loading"
  >
    <el-form class="ai-audit-rule-form" ref="ruleFormRef" label-suffix=":" label-width="120px" label-position="right" :model="searchParams">
      <el-row :gutter="0">
        <el-col :span="12">
          <el-form-item label="审核规则" prop="categoryRuleId" :rules="[{ required: true, message: '请选择审核规则', trigger: 'change' }]">
            <el-select v-model="searchParams.categoryRuleId" clearable filterable placeholder="请选择审核规则" style="width: 100%">
              <el-option v-for="item in ruleOptions" :key="item.categoryRuleId" :label="item.ruleName" :value="item.categoryRuleId">
                <span class="rule-select-option">
                  <span>{{ item.ruleName }}</span>
                  <span class="rule-select-option__code">{{ item.ruleCode }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="要点编码" prop="auditPointCode" :rules="[{ required: true, message: '请输入要点编码' }]">
            <el-input clearable :maxlength="32" show-word-limit v-model.trim="searchParams.auditPointCode" placeholder="请输入要点编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="要点名称" prop="auditPointName" :rules="[{ required: true, message: '请输入要点名称' }]">
            <el-input clearable :maxlength="64" show-word-limit v-model.trim="searchParams.auditPointName" placeholder="请输入要点名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="处理器" prop="handler">
            <el-select v-model="searchParams.handler" clearable filterable placeholder="请选择处理器" style="width: 100%">
              <el-option v-for="item in handlers" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="要点状态" prop="ruleStatus">
            <el-select v-model="searchParams.ruleStatus" clearable filterable placeholder="请选择要点状态" style="width: 100%">
              <el-option v-for="item in ruleStatus" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col> 
        <el-col :span="12">
          <el-form-item label="要点来源" prop="pointSource">
            <el-select v-model="searchParams.pointSource" clearable filterable placeholder="请选择要点来源" style="width: 100%">
              <el-option v-for="item in pointSourceOptions" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <!-- 是否实现（需求 2026-10-14）：字段 isImplemented，选项取字典 AI_AUDIT_IS_IMPLEMENTED_COM -->
        <el-col :span="12">
          <el-form-item label="是否实现" prop="isImplemented">
            <el-select v-model="searchParams.isImplemented" clearable filterable placeholder="请选择是否实现" style="width: 100%">
              <el-option v-for="item in implementedOptions" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sort">
            <el-input-number
              v-model="searchParams.sort"
              :min="0"
              :max="9999"
              controls-position="right"
              placeholder="请输入排序"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="数据来源" prop="dataSource" :rules="[{ required: true, message: '请输入数据来源' }]">
            <el-input
              clearable
              :maxlength="2000"
              show-word-limit
              resize="none"
              type="textarea"
              :rows="6"
              v-model.trim="searchParams.dataSource"
              placeholder="请输入数据来源"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="判断规则" prop="judgementRuleDesc" :rules="[{ required: true, message: '请输入判断规则' }]">
            <el-input
              clearable
              :maxlength="2000"
              show-word-limit
              resize="none"
              type="textarea"
              :rows="6"
              v-model.trim="searchParams.judgementRuleDesc"
              placeholder="请输入判断规则"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="要点描述" prop="ruleDesc">
            <el-input
              clearable
              :maxlength="2000"
              show-word-limit
              resize="none"
              type="textarea"
              :rows="6"
              v-model.trim="searchParams.ruleDesc"
              placeholder="请输入要点描述"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <div class="ai-audit-rule-form__footer">
            <el-button size="small" v-debounce="[handleSave, `click`, 300]" type="primary"> 保 存 </el-button>
            <el-button size="small" v-debounce="[handleClose, `click`, 300]" plain> 关 闭 </el-button>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'pointModel'
}
</script>

<style lang="less">
@import '../../css/modal.less';
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { rulManageSaveRule } from '@/api/suzhou/aiAuditRuleManage'
import { getRulePage } from '@/api/suzhou/aiAuditRulePoint'
import { VXETable } from 'vxe-table'
import { getPublicData } from '@/api/common'

/** 弹窗参数 */
interface ModalParams {
  type: 'ADD' | 'EDIT'
  searchParams: Record<string, any>
}

interface PointItem {
  categoryRuleId: string
  ruleCode: string
  ruleName: string
  ruleStatus: '0' | '1'
  [key: string]: any
}

/** 公共代码项 */
interface CodeItem {
  code: string
  name: string
}

/** 审核规则下拉项（数据源与左面板规则列表同一个接口） */
interface RuleOption {
  categoryRuleId: string
  ruleCode: string
  ruleName: string
}

const props = defineProps<{ item?: PointItem | null }>()

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('')
const modalType = ref<'ADD' | 'EDIT'>('ADD')
const handlers = ref<CodeItem[]>([])
const ruleStatus = ref<CodeItem[]>([])
/** 「是否实现」下拉（字典 AI_AUDIT_IS_IMPLEMENTED_COM，字段 isImplemented） */
const implementedOptions = ref<CodeItem[]>([])
const pointSourceOptions = ref<CodeItem[]>([])
const ruleOptions = ref<RuleOption[]>([])

const searchParams = ref<any>({})

/** 重置表单数据与校验状态 */
const resetForm = () => {
  ruleFormRef.value?.resetFields()
  isShowModal.value = false
}

/** 关闭弹窗 */
const handleClose = () => {
  resetForm()
}

/** 获取下拉选项数据 */
const fetchOptions = async () => {
  try {
    const [code6, code7, codeImplemented, pointSourceData, ruleRes] = await Promise.all([
      getPublicData('ZLYS_SFQY'),
      getPublicData('AI_HANDLER_COM'),
      // 是否实现（需求 2026-10-14）：字典只给 code，页面按码值存取值
      getPublicData('AI_AUDIT_IS_IMPLEMENTED_COM'),
      getPublicData('AI_AUDIT_POINT_SOURCE_COM'),
      getRulePage({})
    ])

    ruleStatus.value = code6.data
    handlers.value = code7.data
    implementedOptions.value = codeImplemented.data
    pointSourceOptions.value = pointSourceData.data
    // 审核规则下拉与左面板同源，返回可能是分页信封也可能是裸数组
    const records = ruleRes.data?.records || ruleRes.data || []
    ruleOptions.value = Array.isArray(records) ? records : []
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

/** 保存 */
const handleSave = () => {
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      const type = await VXETable.modal.confirm('是否保存，请确定！', '提示', {
        status: 'warning'
      })
      if (type !== 'confirm') {
        ElMessage.info('已取消')
        return
      }
    } catch {
      return
    }

    loading.value = true
    try {
      // 规则编码/名称跟着下拉选中的规则走（右侧列表要展示这两列）；选不到时保留行上的原值
      const chosenRule = ruleOptions.value.find((item) => item.categoryRuleId === searchParams.value.categoryRuleId)
      const res = await rulManageSaveRule({
        ...searchParams.value,
        ruleCode: chosenRule?.ruleCode ?? searchParams.value.ruleCode ?? props.item?.ruleCode,
        ruleName: chosenRule?.ruleName ?? searchParams.value.ruleName ?? props.item?.ruleName,
        categoryRuleId: searchParams.value.categoryRuleId
      })
      if (res.success) {
        ElMessage.success('保存成功！')
        emit('searchHandle', { param: 'success' })
        handleClose()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  })
}

/** 打开弹窗 */
const acceptParams = (params: ModalParams) => {
  console.log(params)
  modalType.value = params.type
  modalTitle.value = params.type === 'ADD' ? '新增' : '编辑'
  searchParams.value = params.searchParams
  // 新增默认落在左面板当前选中的规则上；编辑行上没带 categoryRuleId 时同样回落到它
  if (!searchParams.value.categoryRuleId) searchParams.value.categoryRuleId = props.item?.categoryRuleId || ''
  isShowModal.value = true
  fetchOptions()
}

defineExpose({ acceptParams })
</script>
