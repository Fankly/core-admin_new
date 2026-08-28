<!-- 外包负面清单 - 选择弹窗（vxe-grid） -->
<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="85%"
    height="85%"
    @close="handleClose"
    :loading="loading"
  >
    <div class="air-modal-body air-modal-body--table">
      <div v-if="echoCount > 0" class="air-modal-tip" role="status">
        <i class="el-icon-info air-modal-tip__icon" aria-hidden="true"></i>
        <span class="air-modal-tip__text"
          >已回显关联清单 <em class="air-modal-tip__count">{{ echoCount }}</em> 项，翻页将自动勾选；未出现在当前页的项保存时仍会保留。</span
        >
        <span v-if="selectedNames" class="air-modal-tip__names" :title="selectedNames"> 已选中的知识库业务小类：{{ selectedNames }} </span>
      </div>
      <div v-else-if="isBatchEdit" class="air-modal-tip" role="status">
        <i class="el-icon-warning-outline air-modal-tip__icon" aria-hidden="true"></i>
        <span class="air-modal-tip__text">批量编辑不回显已有关联，保存后将覆盖所选项目类型的清单配置。</span>
      </div>
      <div class="air-modal-table">
        <RangeVxeTable
          ref="proTableRef"
          row-key="id"
          stripe
          :border="false"
          :columns="tableColumns"
          :search-columns="searchColumns"
          :data-callback="callBackHandle"
          :loading="tableLoading"
          :pagination="true"
          :request-api="getPageList"
          :request-error="handleRequestError"
          :request-auto="false"
          :search-col="4"
          :tool-button="false"
          row-click-mode="toggle"
          reserve-selection
          @reset="handleSearchReset"
        />
      </div>

      <div class="air-modal-footer">
        <el-button :loading="loading" :disabled="loading" size="mini" v-debounce="[handleSave, `click`, 300]" type="primary">保 存</el-button>
        <el-button :disabled="loading" size="mini" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'knowledgeModal'
}
</script>

<script setup lang="ts">
import { markRaw, nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import { getOutsourceAdaptListPage } from '@/api/ai/outsourceAdaptList'
import { aiAuditKnowledgeEdit } from '@/api/suzhou/aiAuditInuseRange'
import { getCommonDict } from '@/api/common'
import type { ColumnProps } from '@/components/ProTablePage/interface'

/** 业务大类 / 小类公共代码（级联：大类 getCommonDict(code)，小类 getCommonDict(code, pCode)） */
const BIZ_CAT_CODE = 'OUTSOURCE_RULE_KB_BIZ_CAT'

interface CodeItem {
  code: string
  name: string
}

interface ModalParams {
  type: string
  searchParams: {
    proTypeList: string[]
    selectedIds?: string[]
    /** 已关联知识库业务小类名称（编辑回显） */
    selectedNames?: string
  }
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const tableLoading = ref(false)
const modalTitle = ref('选择外包负面清单')
const proTableRef = ref<any>(null)
const proTypeList = ref<string[]>([])
/** 尚未在分页列表中完成回显的关联 ID；命中后即移除，避免用户取消勾选后被再次选中。 */
const pendingSelectedIds = ref<string[]>([])
const echoCount = ref(0)
const isBatchEdit = ref(false)
/** 编辑回显的已关联知识库业务小类名称 */
const selectedNames = ref('')
/** 搜索区业务小类（随大类变化，原地改数组以适配 SearchForm enumMap） */
const bizSubCatList = ref<CodeItem[]>([])

/** 大类变更：清空小类并按 parentCode 加载小类 */
const handleMajorCatChange = async (val: string) => {
  if (proTableRef.value?.searchParam) {
    proTableRef.value.searchParam.bizSubCat = ''
  }
  bizSubCatList.value.length = 0
  if (!val) return
  try {
    const res = await getCommonDict(BIZ_CAT_CODE, val)
    if (res.success && res.data?.length) {
      bizSubCatList.value.push(...res.data)
    } else if (!res.success) {
      ElMessage.error(res.msg || '加载业务小类失败')
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

const tableColumns = markRaw<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'seqNo', title: '清单序号', width: 100 },
  { field: 'bizMajorCatName', title: '业务大类', width: 140 },
  { field: 'bizSubCatName', title: '业务小类', width: 140 },
  { field: 'prohibitedBiz', title: '禁止外包的整项业务', minWidth: 200 },
  { field: 'allowedAuxBiz', title: '整项业务中外包的辅助性业务', minWidth: 220 }
])

const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'bizMajorCat',
    label: '业务大类',
    enum: () => getCommonDict(BIZ_CAT_CODE),
    fieldNames: { label: 'name', value: 'code' },
    search: {
      el: 'select',
      order: 1,
      props: {
        filterable: true,
        clearable: true,
        placeholder: '请选择业务大类',
        onChange: handleMajorCatChange
      }
    }
  },
  {
    prop: 'bizSubCat',
    label: '业务小类',
    enum: bizSubCatList.value,
    fieldNames: { label: 'name', value: 'code' },
    search: {
      el: 'select',
      order: 2,
      props: {
        filterable: true,
        clearable: true,
        placeholder: '请选择业务小类'
      }
    }
  }
])

const handleSearchReset = () => {
  bizSubCatList.value.length = 0
}

const callBackHandle = (data: any) => {
  tableLoading.value = false
  const selectedIdSet = new Set(pendingSelectedIds.value)
  const restoredIds = new Set<string>()
  nextTick(() => {
    data?.records?.forEach((row: any) => {
      if (selectedIdSet.has(String(row.id))) {
        proTableRef.value?.setCheckboxRow?.(row, true)
        restoredIds.add(String(row.id))
      }
    })
    pendingSelectedIds.value = pendingSelectedIds.value.filter((id) => !restoredIds.has(id))
  })
  return data
}

const handleRequestError = (error: unknown) => {
  tableLoading.value = false
  if ((error as Error)?.message === 'STALE_TABLE_REQUEST') return
  ElMessage.error((error as Error)?.message || '外包负面清单加载失败，请重试')
}

const getPageList = (params: any) => {
  tableLoading.value = true
  return getOutsourceAdaptListPage({
    ...params,
    bizMajorCat: params.bizMajorCat || '',
    bizSubCat: params.bizSubCat || '',
    bmId: params.bmId || '',
    dwId: params.dwId || '',
    roleId: params.roleId || '',
    roleCode: params.roleCode || '',
    userId: params.userId || '',
    page: String(params.page ?? ''),
    limit: String(params.limit ?? '')
  })
}

const getSelectedKbIds = (): string[] => {
  const selected = proTableRef.value?.selectedList || []
  const fromTable = selected.map((item: any) => String(item.id)).filter(Boolean)
  // 未加载到当前分页的回显 ID 仍参与保存，避免跨页丢关联
  return Array.from(new Set([...fromTable, ...pendingSelectedIds.value]))
}

const handleClose = () => {
  proTypeList.value = []
  pendingSelectedIds.value = []
  echoCount.value = 0
  isBatchEdit.value = false
  selectedNames.value = ''
  bizSubCatList.value.length = 0
  isShowModal.value = false
}

const handleSave = async () => {
  if (loading.value) return
  if (!proTypeList.value.length) return ElMessage.warning('缺少项目类型！')
  const kbIdList = getSelectedKbIds()
  if (kbIdList.length === 0) return ElMessage.warning('请选择外包负面清单！')

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
    const res = await aiAuditKnowledgeEdit({
      kbIdList,
      proTypeList: proTypeList.value
    })
    if (res.success) {
      ElMessage.success('保存成功！')
      emit('searchHandle', { param: 'success' })
      handleClose()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const acceptParams = (params: ModalParams) => {
  modalTitle.value = params.type || '选择外包负面清单'
  proTypeList.value = params.searchParams.proTypeList || []
  const selectedIds = [...(params.searchParams.selectedIds || [])]
  pendingSelectedIds.value = selectedIds
  echoCount.value = selectedIds.length
  selectedNames.value = String(params.searchParams.selectedNames || '').trim()
  isBatchEdit.value = params.type === '批量编辑'
  bizSubCatList.value.length = 0
  isShowModal.value = true
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.reset()
  })
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
