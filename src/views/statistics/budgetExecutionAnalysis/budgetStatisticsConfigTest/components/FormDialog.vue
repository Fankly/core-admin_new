<script setup lang="ts">
import { computed, defineEmits, defineExpose, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { useWindowSize } from '@vueuse/core'
import { useStore } from 'vuex'
import { getAllProtypeTreeNew, getPublicCodeList, getPublicData } from '@/api/common'
import { saveConfig } from '@/api/statistics/budgetStatisticsConfig'
import type { SaveData } from '@/api/statistics/budgetStatisticsConfig'
import { loadRecord, loadSnapshot, resultData } from '../api'
import { buildPayload, emptyForm, fieldError, fingerprint, flatten, key, sameId, saveError } from '../rules'
import type { InitParams, Row, Snapshot } from '../rules'

interface OpenOptions {
  mode: 'ADD' | 'EDIT'
  context: InitParams
  parent: Row
  record: Row | null
}
const emit = defineEmits(['saved', 'busyChange'])
const store = useStore()
const showModal = ref(false)
const loading = ref(false)
const saving = ref(false)
const removing = ref(false)
const ready = ref(false)
const initError = ref('')
const options = ref<OpenOptions | null>(null)
const formData = reactive(emptyForm())
const formRef = ref()
const formDialogRef = ref()
const typeTableRef = ref()
const treeTableRef = ref()
const dataDetails = ref<Row[]>([])
const dataSum = ref<Row[]>([])
const publicList = ref<Row[]>([])
const statTypeList = ref<Row[]>([])
const bgjdTypeList = ref<Row[]>([])
const bgjdValueList = ref<Row[]>([])
const projectOptions = ref<Row[]>([])
const packTypes = ref<Row[]>([])
const snapshot = ref<Snapshot>({ tree: [], rows: [], targets: {} })
const original = ref<AwaitedRecord | null>(null)
type AwaitedRecord = { row: Row; data: Row[]; sums: Row[] }
let initialFingerprint = ''
let generation = 0
const parentName = computed(() => {
  const id = original.value?.row.parentId ?? options.value?.parent?.id
  return snapshot.value.rows.find((row) => sameId(row.configId, id))?.configName || `${options.value?.context.nd || ''}年度`
})
const title = computed(() => `${options.value?.mode === 'EDIT' ? '修改' : '新增'}-预算执行分析配置`)
const { width, height } = useWindowSize()
const dialogWidth = computed(() => Math.max(300, Math.min(960, width.value - 32)))
const isShowTable = computed(() => formData.isleaf === '1' && (formData.statMethod === '2' || formData.statType === '1'))
const dialogHeight = computed(() => Math.min(isShowTable.value ? 830 : 640, height.value - 48))
const selectedProTypes = computed({
  get: () => formData.proType.split(',').map(key).filter(Boolean),
  set: (values: string[]) => {
    formData.proType = values.join(',')
  }
})
const rules = Object.fromEntries(
  [...Object.keys(emptyForm())].map((field) => [
    field,
    [
      {
        validator: (_rule: any, value: unknown, callback: (error?: Error) => void) => {
          const message = fieldError(field, value, formData)
          callback(message ? new Error(message) : undefined)
        },
        trigger: ['blur', 'change']
      }
    ]
  ])
)

async function open(value: OpenOptions) {
  if (showModal.value || saving.value) return
  const token = ++generation
  options.value = value
  Object.assign(formData, emptyForm())
  original.value = null
  initialFingerprint = ''
  dataDetails.value = []
  dataSum.value = []
  projectOptions.value = []
  snapshot.value = { tree: [], rows: [], targets: {} }
  initError.value = ''
  ready.value = false
  loading.value = true
  showModal.value = true
  emit('busyChange', true)
  try {
    const [codes, projects, packs, fresh, record] = await Promise.all([
      getPublicCodeList({ codes: ['YSTJPZ_TJFS', 'YSTJPZ_TJLX', 'YSZXFXBG_JDTYPE', 'YSZXFX_PTJDTYPE'] }),
      getAllProtypeTreeNew(),
      getPublicData('XMBTYPE_COM'),
      loadSnapshot(value.context, true),
      value.mode === 'EDIT' ? loadRecord(value.record?.configId) : Promise.resolve(null)
    ])
    if (token !== generation) return
    const dictionaries = resultData(codes, '公共代码加载失败')
    for (const code of ['YSTJPZ_TJFS', 'YSTJPZ_TJLX', 'YSZXFXBG_JDTYPE', 'YSZXFX_PTJDTYPE']) {
      if (!Array.isArray(dictionaries[code])) throw new Error('公共代码格式异常，请重新打开')
    }
    publicList.value = dictionaries.YSTJPZ_TJFS
    statTypeList.value = dictionaries.YSTJPZ_TJLX
    bgjdTypeList.value = dictionaries.YSZXFXBG_JDTYPE
    bgjdValueList.value = dictionaries.YSZXFX_PTJDTYPE
    const projectTree = resultData(projects, '项目类型加载失败')
    const packList = resultData(packs, '包类型加载失败')
    if (!Array.isArray(projectTree) || !Array.isArray(packList)) throw new Error('项目类型或包类型数据异常')
    projectOptions.value = flatten(projectTree).filter((row) => !row.children?.length)
    packTypes.value = packList
    snapshot.value = fresh
    original.value = record
    if (record) {
      if (!sameId(record.row.nd, value.context.nd) || !sameId(record.row.busiType, value.context.busiType))
        throw new Error('配置所属年度或维度已变化')
      initialFingerprint = fingerprint(record.row, record.data, record.sums)
      for (const field of Object.keys(emptyForm())) (formData as Row)[field] = key(record.row[field] ?? (emptyForm() as Row)[field])
      dataDetails.value = record.data.map((item) => ({
        ...item,
        proTypeName: item.proTypeName || projectOptions.value.find((project) => sameId(project.id, item.proType))?.name || key(item.proType),
        packTypeName: item.packTypeName || packTypes.value.find((pack) => sameId(pack.code, item.packType))?.name || '全部包类型'
      }))
      dataSum.value = record.sums.map((item) => ({
        ...item,
        name: item.tarConfigName || fresh.rows.find((row) => sameId(row.configId, item.tarConfigId))?.configName || key(item.tarConfigId)
      }))
    }
    ready.value = true
    await nextTick()
    formRef.value?.clearValidate()
  } catch (error) {
    if (token !== generation) return
    initError.value = error instanceof Error ? error.message : '配置加载失败'
    ElMessage.error(initError.value)
  } finally {
    if (token === generation) loading.value = false
  }
}

function localError(): string {
  for (const field of Object.keys(emptyForm())) {
    const error = fieldError(field, (formData as Row)[field], formData)
    if (error) return error
  }
  const known = (items: Row[], value: string) => items.some((item) => sameId(item.code, value))
  if (formData.bgjdType && !known(bgjdTypeList.value, formData.bgjdType)) return '分析报告节点类型已失效，请重新选择'
  if (formData.bgjdType === '1' && !known(bgjdValueList.value, formData.bgjdValue)) return '普通分析节点已失效，请重新选择'
  if (formData.isleaf === '1' && formData.statMethod === '1' && formData.statType === '1') {
    const ids = [...selectedProTypes.value, ...dataDetails.value.map((item) => key(item.proType))]
    if (ids.some((id) => !projectOptions.value.some((project) => sameId(project.id, id)))) return '存在无效项目类型，请重新选择'
    if (dataDetails.value.some((item) => key(item.packType) && !known(packTypes.value, key(item.packType)))) return '存在无效包类型，请重新选择'
  }
  return ''
}
function payload() {
  const value = options.value!
  return buildPayload(
    formData,
    value.context,
    original.value?.row.parentId ?? value.parent.id ?? value.context.nd,
    original.value?.row.configId,
    dataDetails.value,
    dataSum.value
  )
}
async function saveDataHandle() {
  if (saving.value || loading.value || !ready.value || removing.value || !options.value) return
  saving.value = true
  try {
    const action = options.value.mode
    if (!store.state.permissions?.includes(action)) throw new Error('没有此操作权限')
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    const validation = localError()
    if (validation) {
      ElMessage.warning(validation)
      return
    }
    const params = payload()
    const fresh = await loadSnapshot(options.value.context, true)
    if (original.value) {
      const record = await loadRecord(original.value.row.configId)
      if (fingerprint(record.row, record.data, record.sums) !== initialFingerprint)
        throw new Error('配置已被其他操作修改，请取消后重新打开，避免覆盖最新数据')
    }
    const error = saveError(params, fresh)
    if (error) {
      ElMessage.warning(error)
      return
    }
    const result = await saveConfig(params as SaveData)
    if (!result.success) throw new Error(result.msg || '保存失败')
    ElMessage.success('保存成功')
    saving.value = false
    closeModalHandle()
    emit('saved')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}
function clearBindings() {
  dataDetails.value = []
  dataSum.value = []
  formData.proType = ''
  nextTick(() => formRef.value?.clearValidate())
}
function changeLeafDataHandle() {
  clearBindings()
  formData.statMethod = '1'
  formData.statType = '1'
}
function changeStatMethodHandle() {
  clearBindings()
  formData.statType = '1'
}
function changeStatTypeHandle() {
  clearBindings()
}
function changeBgjdTypeHandle(value: string) {
  if (value !== '1') formData.bgjdValue = ''
  nextTick(() => formRef.value?.clearValidate('bgjdValue'))
}
async function delDataHandle() {
  if (removing.value || saving.value || !ready.value) return
  const table = formData.statMethod === '1' ? typeTableRef.value : treeTableRef.value
  const rows: Row[] = table?.getCheckboxRecords() || []
  if (!rows.length) {
    ElMessage.warning('请选择需要删除的明细')
    return
  }
  const token = generation
  removing.value = true
  try {
    const result = await VXETable.modal.confirm(`确定从表单移除 ${rows.length} 条明细？保存后生效。`, '提示', { status: 'warning' })
    if (result !== 'confirm' || token !== generation) return
    if (formData.statMethod === '1') dataDetails.value = dataDetails.value.filter((item) => !rows.some((row) => sameId(row.proType, item.proType)))
    else dataSum.value = dataSum.value.filter((item) => !rows.some((row) => sameId(row.tarConfigId, item.tarConfigId)))
    await table?.clearCheckboxRow()
  } finally {
    removing.value = false
  }
}
const bindingOpen = ref(false)
const summaryOpen = ref(false)
const binding = reactive({ proType: '', packType: '' })
const summaryTreeRef = ref()
const summaryTree = computed(() => {
  const decorate = (rows: Row[]): Row[] =>
    rows.map((row) => ({
      ...row,
      id: key(row.id),
      disabled: sameId(row.id, original.value?.row.configId) || dataSum.value.some((item) => sameId(item.tarConfigId, row.id)),
      children: decorate(row.children || [])
    }))
  return decorate(snapshot.value.tree)
})
function addDialogHandle() {
  if (loading.value || saving.value || !ready.value) return
  if (formData.statMethod === '1') {
    binding.proType = ''
    binding.packType = ''
    bindingOpen.value = true
  } else summaryOpen.value = true
}
function addBinding() {
  const project = projectOptions.value.find((item) => sameId(item.id, binding.proType))
  if (!project) {
    ElMessage.warning('请选择项目类型')
    return
  }
  if (dataDetails.value.some((item) => sameId(item.proType, binding.proType))) {
    ElMessage.warning('相同项目类型不能重复添加')
    return
  }
  const pack = packTypes.value.find((item) => sameId(item.code, binding.packType))
  dataDetails.value.push({
    proType: binding.proType,
    proTypeName: project.name,
    packType: binding.packType,
    packTypeName: pack?.name || '全部包类型'
  })
  bindingOpen.value = false
}
function resetSummarySelection() {
  summaryTreeRef.value?.setCheckedKeys([])
}
function addSummary() {
  const rows: Row[] = summaryTreeRef.value?.getCheckedNodes() || []
  if (!rows.length) {
    ElMessage.warning('请至少选择一个汇总目标')
    return
  }
  const additions = rows.map((row) => ({ tarConfigId: row.id, name: row.name }))
  const params = payload()
  params.sumDetails = [...dataSum.value, ...additions]
  const error = saveError(params, snapshot.value)
  if (error) {
    ElMessage.warning(error)
    return
  }
  dataSum.value.push(...additions)
  summaryOpen.value = false
}
function closeModalHandle() {
  if (!saving.value) showModal.value = false
}
watch(showModal, (value) => {
  if (value) return
  generation++
  bindingOpen.value = false
  summaryOpen.value = false
  ready.value = false
  loading.value = false
  removing.value = false
  dataDetails.value = []
  dataSum.value = []
  emit('busyChange', false)
})
onBeforeUnmount(() => {
  generation++
})
defineExpose({ open })
</script>

<template>
  <vxe-modal
    :destroy-on-close="true"
    ref="formDialogRef"
    :loading="loading || saving"
    :show-close="!saving"
    :esc-closable="!saving"
    :mask-closable="false"
    class-name="modal"
    :height="dialogHeight"
    position="center"
    v-model="showModal"
    :width="dialogWidth"
    :title="title"
    show-zoom
    resize
  >
    <div class="modal budget-config-dialog">
      <div class="main">
        <div class="bottom-box">
          <div class="bottom-form">
            <p class="parent-label">父节点：{{ parentName }}</p>
            <p v-if="initError" class="init-error" role="alert">{{ initError }}；请取消后重新打开。</p>
            <el-form
              ref="formRef"
              label-position="right"
              label-width="140px"
              :model="formData"
              :rules="rules"
              :disabled="loading || saving || !ready"
            >
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="名称：" prop="configName">
                    <el-input maxlength="31" v-model="formData.configName"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="序号：" prop="dispOrder">
                    <el-input v-model="formData.dispOrder" maxlength="8" placeholder="1～99999999"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="前台显示序号：" prop="subName">
                    <el-input v-model="formData.subName" maxlength="31"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="归口部门：" prop="gkbm">
                    <el-input v-model="formData.gkbm" maxlength="120"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="预算来源：" prop="ysly">
                    <el-input v-model="formData.ysly" maxlength="120"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="承诺项：" prop="cnxm">
                    <el-input v-model="formData.cnxm" maxlength="120"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="备注：" prop="cnxmms">
                    <el-input v-model="formData.cnxmms" maxlength="120"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="是否加粗：" prop="sfjc">
                    <el-select v-model="formData.sfjc" style="width: 100%">
                      <el-option value="1" label="是"></el-option>
                      <el-option value="0" label="否"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="是否启用：" prop="recState">
                    <el-select v-model="formData.recState" style="width: 100%">
                      <el-option value="1" label="启用"></el-option>
                      <el-option value="0" label="停用"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="是否显示：" prop="isDisplay">
                    <el-select v-model="formData.isDisplay" style="width: 100%">
                      <el-option value="1" label="是"></el-option>
                      <el-option value="0" label="否"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="分析报告节点类型：" prop="bgjdType">
                    <el-select
                      v-model="formData.bgjdType"
                      clearable
                      placeholder="请选择"
                      style="width: 100%"
                      @change="changeBgjdTypeHandle"
                      @clear="changeBgjdTypeHandle('')"
                    >
                      <el-option v-for="item in bgjdTypeList" :value="String(item.code)" :label="item.name" :key="item.code"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="普通分析节点：" prop="bgjdValue">
                    <el-select
                      v-model="formData.bgjdValue"
                      :disabled="formData.bgjdType !== '1'"
                      clearable
                      :placeholder="formData.bgjdType === '1' ? '请选择' : '请先选择分析报告节点类型'"
                      style="width: 100%"
                    >
                      <el-option v-for="item in bgjdValueList" :value="String(item.code)" :label="item.name" :key="item.code"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="是否末级节点：" prop="isleaf">
                    <el-select @change="changeLeafDataHandle" v-model="formData.isleaf" style="width: 100%">
                      <el-option value="1" label="是"></el-option>
                      <el-option value="0" label="否"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-show="formData.isleaf === '1'">
                  <el-form-item label="统计方式：" prop="statMethod">
                    <el-select @change="changeStatMethodHandle" v-model="formData.statMethod" style="width: 100%">
                      <el-option v-for="item in publicList" :value="String(item.code)" :label="item.name" :key="item.code"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col v-if="formData.isleaf === '1' && formData.statMethod === '1'" :span="12">
                  <el-form-item label="统计类型：" prop="statType">
                    <el-select @change="changeStatTypeHandle" v-model="formData.statType" style="width: 100%">
                      <el-option v-for="item in statTypeList" :value="String(item.code)" :label="item.name" :key="item.code"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col v-if="formData.isleaf === '1' && formData.statMethod === '1'" :span="12" class="pro-type-field">
                  <el-form-item :label="formData.statType === '1' ? '项目类型：' : '承诺项：'" prop="proType">
                    <el-select
                      v-if="formData.statType === '1'"
                      v-model="selectedProTypes"
                      multiple
                      filterable
                      clearable
                      collapse-tags
                      style="width: 100%"
                      placeholder="请选择项目类型"
                    >
                      <el-option v-for="item in projectOptions" :key="String(item.id)" :value="String(item.id)" :label="item.name" />
                    </el-select>
                    <el-input
                      maxlength="2000"
                      resize="none"
                      :rows="2"
                      type="textarea"
                      v-else
                      v-model="formData.proType"
                      placeholder="请输入承诺项"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
          <div class="bottom-box" v-show="isShowTable">
            <div class="top-box">
              <el-button :disabled="loading || saving || !ready" plain size="mini" type="primary" @click="addDialogHandle">新 增</el-button>
              <el-button :disabled="loading || saving || !ready || removing" plain size="mini" type="primary" @click="delDataHandle">删 除</el-button>
            </div>
            <div class="bottom-table">
              <vxe-table
                ref="typeTableRef"
                show-overflow
                :row-config="{ height: 32 }"
                :data="dataDetails"
                v-show="formData.statMethod === '1'"
                resizable
                align="center"
                border
                class="table"
                height="100%"
              >
                <vxe-column type="checkbox" width="60"></vxe-column>
                <vxe-column :show-overflow="true" field="proTypeName" width="240" title="项目类型"></vxe-column>
                <vxe-column :show-overflow="true" field="packTypeName" width="240" title="包类型"></vxe-column>
              </vxe-table>
              <vxe-table
                ref="treeTableRef"
                show-overflow
                :row-config="{ height: 32 }"
                :data="dataSum"
                v-show="formData.statMethod === '2'"
                resizable
                align="center"
                border
                class="table"
                height="100%"
              >
                <vxe-column type="checkbox" width="60"></vxe-column>
                <vxe-column field="name" :show-overflow="true" width="240" title="目标名称"></vxe-column>
              </vxe-table>
            </div>
          </div>
        </div>
      </div>
      <div class="footer">
        <el-button :loading="saving" :disabled="loading || !ready || removing" plain size="mini" type="primary" @click="saveDataHandle"
          >保 存</el-button
        >
        <el-button :disabled="saving" plain size="mini" type="primary" @click="closeModalHandle">取 消</el-button>
      </div>
    </div>
  </vxe-modal>
  <vxe-modal v-model="bindingOpen" title="新增-数据绑定" width="460" height="240" position="center" :mask-closable="false" :destroy-on-close="true">
    <el-form label-width="110px">
      <el-form-item label="项目类型：" required>
        <el-select v-model="binding.proType" filterable clearable style="width: 100%" placeholder="请选择项目类型">
          <el-option v-for="item in projectOptions" :key="String(item.id)" :value="String(item.id)" :label="item.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="包类型：">
        <el-select v-model="binding.packType" clearable style="width: 100%" placeholder="全部包类型">
          <el-option v-for="item in packTypes" :key="String(item.code)" :value="String(item.code)" :label="item.name" />
        </el-select>
      </el-form-item>
    </el-form>
    <div class="footer"
      ><el-button size="mini" type="primary" @click="addBinding">确 定</el-button
      ><el-button size="mini" @click="bindingOpen = false">取 消</el-button></div
    >
  </vxe-modal>
  <vxe-modal
    v-model="summaryOpen"
    title="新增-明细汇总"
    width="520"
    height="420"
    position="center"
    :mask-closable="false"
    :destroy-on-close="true"
    @show="resetSummarySelection"
  >
    <div class="summary-dialog">
      <el-tree
        ref="summaryTreeRef"
        :data="summaryTree"
        node-key="id"
        show-checkbox
        :check-strictly="true"
        :props="{ label: 'name', children: 'children' }"
      />
      <div class="footer"
        ><el-button size="mini" type="primary" @click="addSummary">确 定</el-button
        ><el-button size="mini" @click="summaryOpen = false">取 消</el-button></div
      >
    </div>
  </vxe-modal>
</template>

<style lang="less" scoped>
.parent-label {
  color: #606266;
  margin: 0 0 14px;
}
.init-error {
  color: #c45656;
}
.summary-dialog {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.summary-dialog > .el-tree {
  flex: 1;
  overflow: auto;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  .bottom-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;

    .top-box {
      line-height: 28px;
    }

    .bottom-table {
      padding-top: 10px;
      padding-bottom: 10px;
      min-width: 0;
      min-height: 0;
      flex: 1;
    }
  }
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

.budget-config-dialog {
  .main {
    overflow: auto;
    padding-right: 4px;
  }

  .bottom-form {
    flex-shrink: 0;
  }

  :deep(.el-form) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 24px;
  }

  :deep(.el-form > .el-row) {
    display: contents;
  }

  :deep(.el-form > .el-row > .el-col) {
    width: 100%;
    max-width: 100%;
    padding: 0 !important;
  }

  .pro-type-field {
    grid-column: 1 / -1;
  }

  .bottom-box > .bottom-box {
    flex-shrink: 0;
    min-height: 200px;
  }

  .footer {
    flex-shrink: 0;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
  }

  @media (max-width: 640px) {
    :deep(.el-form) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
