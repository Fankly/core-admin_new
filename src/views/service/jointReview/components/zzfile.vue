<template>
  <div class="zzfile-trigger">
    <el-button class="material-button" size="mini" type="primary" plain :aria-label="materialButtonLabel" @click="openMaterialDrawer">
      <i class="el-icon-paperclip" aria-hidden="true"></i>
      <span>评审佐证材料</span>
      <span v-if="materialCount" class="material-button__count">{{ materialCount }}</span>
    </el-button>

    <el-drawer
      v-model="materialDrawerVisible"
      title="评审佐证材料"
      direction="rtl"
      size="560px"
      destroy-on-close
      append-to-body
      custom-class="review-material-drawer"
      @close="resetFilePreview"
    >
      <div class="material-drawer" v-loading="loading">
        <div v-if="materialGroups.length" class="material-groups">
          <section v-for="group in materialGroups" :key="group.prop" class="material-group-card">
            <header class="material-group-card__header">
              <div>
                <i class="el-icon-folder-opened" aria-hidden="true"></i>
                <span>{{ group.label }}</span>
              </div>
              <span class="material-group-card__count">{{ group.files.length }} 份</span>
            </header>
            <div
              v-for="(file, fileIndex) in group.files"
              :key="file.uuid || `${file.name}-${fileIndex}`"
              class="material-file"
              :class="{ 'is-previewing': isActivePreviewFile(file) }"
            >
              <span class="material-file__icon" aria-hidden="true"><i class="el-icon-document"></i></span>
              <span class="material-file__name" :title="getReviewMaterialFileName(file)">{{ getReviewMaterialFileName(file) }}</span>
              <span class="material-file__actions">
                <el-tooltip
                  :content="isReviewMaterialPreviewable(file) ? `预览 ${getReviewMaterialFileName(file)}` : REVIEW_MATERIAL_PREVIEW_TIP"
                  placement="top"
                >
                  <span class="material-file__action-wrap">
                    <button
                      type="button"
                      class="material-file__action"
                      :disabled="!isReviewMaterialPreviewable(file)"
                      :aria-label="`预览 ${getReviewMaterialFileName(file)}`"
                      @click="openFilePreview(file)"
                    >
                      <Eye :size="14" :stroke-width="1.8" aria-hidden="true" />
                      <span>预览</span>
                    </button>
                  </span>
                </el-tooltip>
                <el-tooltip :content="`下载 ${getReviewMaterialFileName(file)}`" placement="top">
                  <button
                    type="button"
                    class="material-file__action"
                    :aria-label="`下载 ${getReviewMaterialFileName(file)}`"
                    @click="downLoadFile(file)"
                  >
                    <Download :size="14" :stroke-width="1.8" aria-hidden="true" />
                    <span>下载</span>
                  </button>
                </el-tooltip>
              </span>
            </div>
          </section>
        </div>
        <el-empty v-else :image-size="96" description="当前项目暂无评审佐证材料"></el-empty>

        <div v-if="showFinancialBasis" class="financial-review-section" v-loading="financialBasisLoading">
          <header class="financial-review-section__header">
            <div>
              <i class="el-icon-document-checked" aria-hidden="true"></i>
              <span>财务审核要求</span>
            </div>
          </header>
          <div class="financial-review-section__body">
            <div class="financial-review-basis">
              <div class="financial-review-basis__label">审核依据</div>
              <div v-if="financialBasisFiles.length" class="financial-basis-list">
                <div
                  v-for="file in financialBasisFiles"
                  :key="getReviewMaterialFileKey(file)"
                  class="financial-basis-file"
                  :class="{ 'is-previewing': isActivePreviewFile(file) }"
                >
                  <span class="financial-basis-file__icon" aria-hidden="true"><i class="el-icon-document"></i></span>
                  <div class="financial-basis-file__content">
                    <span class="financial-basis-file__name" :title="getFinancialBasisFileName(file)">
                      {{ getFinancialBasisFileName(file) }}
                    </span>
                    <span class="financial-basis-file__type">{{ getFinancialBasisFileType(file) }}</span>
                  </div>
                  <span class="financial-basis-file__actions">
                    <el-tooltip
                      :content="isReviewMaterialPreviewable(file) ? `预览 ${getFinancialBasisFileName(file)}` : REVIEW_MATERIAL_PREVIEW_TIP"
                      placement="top"
                    >
                      <span class="material-file__action-wrap">
                        <button
                          type="button"
                          class="material-file__action"
                          :disabled="!isReviewMaterialPreviewable(file)"
                          :aria-label="`预览 ${getFinancialBasisFileName(file)}`"
                          @click="openFilePreview(file)"
                        >
                          <Eye :size="14" :stroke-width="1.8" aria-hidden="true" />
                          <span>预览</span>
                        </button>
                      </span>
                    </el-tooltip>
                    <el-tooltip :content="`下载 ${getFinancialBasisFileName(file)}`" placement="top">
                      <button
                        type="button"
                        class="material-file__action"
                        :aria-label="`下载 ${getFinancialBasisFileName(file)}`"
                        @click="downLoadFile(file)"
                      >
                        <Download :size="14" :stroke-width="1.8" aria-hidden="true" />
                        <span>下载</span>
                      </button>
                    </el-tooltip>
                  </span>
                </div>
              </div>
              <div v-else class="financial-basis-empty">暂无审核依据</div>
            </div>
            <div class="financial-review-point">
              <div class="financial-review-point__label">财务审核要点</div>
              <div class="financial-review-point__content">
                <template v-if="financialReviewPoint">{{ financialReviewPoint }}</template>
                <span v-else class="financial-review-empty">暂无审核要点</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <ReviewMaterialPreviewModal
      ref="reviewMaterialPreviewRef"
      :visible="filePreviewVisible"
      :files="previewableFiles"
      :active-key="activePreviewFileKey"
      :open-request="filePreviewOpenRequest"
      :is-lhhs="IS_LHHS"
      @close="closeFilePreview"
      @active-change="activePreviewFileKey = $event"
    />

    <!-- AI智能审核 抽屉 -->
    <el-drawer
      v-model="aiDrawerVisible"
      title="AI智能审核"
      direction="rtl"
      size="100%"
      destroy-on-close
      append-to-body
      custom-class="ai-audit-drawer"
      @closed="approveId = ''"
    >
      <ReserveApprovalDetail v-if="approveId" :id="approveId" approval-role="jysApprovalDetail" list-key="[]" :embedded="true" />
    </el-drawer>
  </div>
</template>
<script lang="ts">
export default {
  name: 'zzfile'
}
</script>
<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Eye } from 'lucide-vue-next'
import { getTabColumns, downloadAttach } from '@/api/service/requirement'
import { getXmInfoByYsbgfj, findAiAuditViewId } from '@/api/service/jointReview'
import ReviewMaterialPreviewModal from './ReviewMaterialPreviewModal.vue'
import {
  getReviewMaterialFileKey,
  getReviewMaterialFileName,
  isReviewMaterialPreviewable,
  REVIEW_MATERIAL_PREVIEW_TIP
} from './reviewMaterialPreview'
import type { ReviewMaterialFile } from './reviewMaterialPreview'
import {
  useFinancialReviewBasis,
  getFinancialBasisFileName,
  getFinancialBasisFileType
} from '@/views/service/jointReview/hooks/useFinancialReviewBasis'

const props = withDefaults(
  defineProps<{
    /** 是否在抽屉中展示“财务审核要点”与“审核依据”区块（线上会审仅财务专业专家传 true） */
    showFinancialBasis?: boolean
  }>(),
  {
    showFinancialBasis: true
  }
)

// 联合会审附件下载标识，与“更多详情-附件信息”下载（DynamicUploadGroup）保持一致
const IS_LHHS = '1'

const ReserveApprovalDetail = defineAsyncComponent(() => import('@/views/finance/reserveApprovalDetail/index.vue'))

const loading = ref<boolean>(false)
const materialDrawerVisible = ref<boolean>(false)
const filePreviewVisible = ref<boolean>(false)
const activePreviewFileKey = ref<string>('')
const filePreviewOpenRequest = ref<number>(0)
const reviewMaterialPreviewRef = ref<{ closeAll: () => void } | null>(null)

const xmFileColumns = ref<any[]>([]) //项目附件名称
const xmFileList = ref<Record<string, any[]>>({}) //项目附件内容

// 财务审核要点与审核依据（按预算事项id加载）
const { financialBasisLoading, financialReviewPoint, financialBasisFiles, loadFinancialBasis, resetFinancialBasis } = useFinancialReviewBasis()

// AI智能审核相关
const currentXmmc = ref<string>('') //当前项目名称
const aiLoading = ref<boolean>(false) //查询审核详情id中
const aiDrawerVisible = ref<boolean>(false) //抽屉显隐
const approveId = ref<string>('') //审核详情id

const materialGroups = computed(() => {
  const groupColumns = xmFileColumns.value.reduce<any[]>((result, column) => {
    if (Array.isArray(column?.children)) result.push(...column.children)
    return result
  }, [])

  return groupColumns
    .map((column) => ({
      prop: column.prop,
      label: column.label,
      files: Array.isArray(xmFileList.value[column.prop]) ? xmFileList.value[column.prop] : []
    }))
    .filter((group) => group.files.length > 0)
})

const materialCount = computed(() => materialGroups.value.reduce((count, group) => count + group.files.length, 0))
const materialButtonLabel = computed(() => `查看评审佐证材料${materialCount.value ? `，共 ${materialCount.value} 份` : ''}`)
const previewableFiles = computed<ReviewMaterialFile[]>(() => {
  const files: ReviewMaterialFile[] = []
  const seenKeys = new Set<string>()

  const appendFile = (file: ReviewMaterialFile) => {
    const key = getReviewMaterialFileKey(file)
    if (!key || seenKeys.has(key) || !isReviewMaterialPreviewable(file)) return
    seenKeys.add(key)
    files.push(file)
  }

  materialGroups.value.forEach((group) => {
    group.files.forEach(appendFile)
  })
  financialBasisFiles.value.forEach(appendFile)

  return files
})

const openMaterialDrawer = () => {
  if (!currentXmmc.value) {
    ElMessage.warning('暂无项目信息，无法查看评审佐证材料')
    return
  }
  materialDrawerVisible.value = true
}

const openFilePreview = (file: ReviewMaterialFile) => {
  if (!isReviewMaterialPreviewable(file)) {
    ElMessage.warning(REVIEW_MATERIAL_PREVIEW_TIP)
    return
  }
  activePreviewFileKey.value = getReviewMaterialFileKey(file)
  filePreviewVisible.value = true
  filePreviewOpenRequest.value += 1
}

const closeFilePreview = () => {
  filePreviewVisible.value = false
}

const resetFilePreview = () => {
  reviewMaterialPreviewRef.value?.closeAll()
  closeFilePreview()
  activePreviewFileKey.value = ''
}

const isActivePreviewFile = (file: ReviewMaterialFile) => getReviewMaterialFileKey(file) === activePreviewFileKey.value

// 获取项目附件信息
const getXmFileList = async (xmId: any, pro_type_id: any, xmmc?: any, yssxId?: any) => {
  resetFilePreview()
  currentXmmc.value = xmmc ?? ''
  xmFileColumns.value = []
  xmFileList.value = {}
  resetFinancialBasis()
  // 财务审核要点/依据按预算事项id加载（仅展示开关开启时）
  const basisPromise =
    props.showFinancialBasis && yssxId !== undefined && yssxId !== null && String(yssxId).trim() !== ''
      ? loadFinancialBasis(yssxId)
      : Promise.resolve()
  try {
    loading.value = true
    const data = await getXmInfoByYsbgfj(xmId)
    const columns = await getTabColumns({
      protypeId: pro_type_id,
      opType: 'VIEW',
      xmid: xmId
    })
    if (!data.success || !columns.success) {
      ElMessage.error(data.msg || columns.msg || '获取评审佐证材料失败')
      return
    }

    const attachmentStep = (columns.data ?? []).find((item: any) => item.stepName == '附件信息')
    const xmColumns: any[] = attachmentStep?.columns ?? []
    xmFileColumns.value = xmColumns.filter((item: any) => item.label.includes('佐证'))
    xmFileList.value = attachmentStep ? data.data?.[attachmentStep.stepId] ?? {} : {}
    await basisPromise
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

// 发起AI智能审核：根据项目名称查询审核详情id，命中则在右侧抽屉中打开详情
const openAiAudit = async () => {
  if (aiLoading.value) return
  if (!currentXmmc.value) {
    ElMessage.warning('暂无项目信息，无法发起智能审核')
    return
  }
  try {
    aiLoading.value = true
    const res: any = await findAiAuditViewId(currentXmmc.value)
    if (res && res.success === false) {
      ElMessage.error(res.errorMessage || res.msg || '智能审核查询失败')
      return
    }
    const id = res?.data
    approveId.value = String(id)
    aiDrawerVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.message || '未查询到该项目的智能审核详情')
  } finally {
    aiLoading.value = false
  }
}

// 下载附件
const downLoadFile = async (file: any) => {
  if (!file.uuid) return
  try {
    loading.value = true
    const blob: any = await downloadAttach(file.uuid, IS_LHHS)
    const dom = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    const filename = getReviewMaterialFileName(file)
    dom.href = url
    dom.download = filename
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    ElMessage.error(error?.message || '材料下载失败')
  } finally {
    loading.value = false
  }
}

defineExpose({ getXmFileList, openAiAudit })
</script>

<style lang="less" scoped>
.zzfile-trigger {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
}

.material-button {
  height: 28px;
  margin: 0;
  padding: 0 10px;
  color: #00776f;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background-color: #f0fdfa;
  border-color: rgba(0, 133, 124, 0.24);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(15, 118, 110, 0.06);
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  i {
    margin-right: 5px;
    font-size: 13px;
  }

  &:hover,
  &:focus {
    color: #ffffff;
    background-color: var(--color-primary, #00857c);
    border-color: var(--color-primary, #00857c);
    box-shadow: 0 5px 12px rgba(0, 133, 124, 0.18);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 133, 124, 0.32);
    outline-offset: 2px;
  }
}

.material-button__count {
  min-width: 18px;
  height: 18px;
  margin-left: 7px;
  padding: 0 5px;
  color: #ffffff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  background-color: var(--color-primary, #00857c);
  border-radius: 9px;

  .material-button:hover &,
  .material-button:focus & {
    color: var(--color-primary, #00857c);
    background-color: #ffffff;
  }
}

.material-drawer {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 18px;
  overflow-y: auto;
  box-sizing: border-box;
  background-color: #f8fafc;
}

.material-groups {
  margin-top: 0;
}

.financial-review-section {
  margin-top: 16px;
  overflow: hidden;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.025);
}

.financial-review-section__header {
  min-height: 42px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #f8fafc;
  border-bottom: 1px solid #eef2f6;

  > div {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: #334155;
    font-size: 13px;
    font-weight: 600;
  }

  i {
    color: var(--color-primary, #00857c);
    font-size: 15px;
  }
}

.financial-review-section__body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.financial-review-point__label,
.financial-review-basis__label {
  margin-bottom: 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.financial-review-point__content {
  color: #334155;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.financial-basis-list {
  overflow: hidden;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.financial-basis-file {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 50px;
  padding: 10px 12px;
  color: #475569;
  background-color: #ffffff;
  border-bottom: 1px solid #eef2f6;
  transition: color 0.2s ease, background-color 0.2s ease;

  &:last-child {
    border-bottom: 0;
  }

  &:hover,
  &.is-previewing {
    color: #00706b;
    background-color: #e6f4f3;
  }
}

.financial-basis-file__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #00857c;
  font-size: 14px;
  background-color: #ecfdf9;
  border-radius: 6px;
}

.financial-basis-file__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.financial-basis-file__name {
  min-width: 0;
  overflow: hidden;
  color: #334155;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.financial-basis-file__type {
  color: #64748b;
  font-size: 11px;
  line-height: 1.3;
}

.financial-basis-file__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.financial-basis-empty {
  padding: 14px 12px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}

.financial-review-empty {
  color: #94a3b8;
  font-size: 13px;
}

.material-group-card {
  margin-bottom: 14px;
  overflow: hidden;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.025);

  &:last-child {
    margin-bottom: 0;
  }
}

.material-group-card__header {
  min-height: 42px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background-color: #f8fafc;
  border-bottom: 1px solid #eef2f6;

  > div {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: #334155;
    font-size: 13px;
    font-weight: 600;
  }

  i {
    color: var(--color-primary, #00857c);
    font-size: 15px;
  }
}

.material-group-card__count {
  flex: 0 0 auto;
  padding: 2px 7px;
  color: #64748b;
  font-size: 11px;
  line-height: 18px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.material-file {
  width: 100%;
  min-height: 50px;
  padding: 10px 14px;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  color: #475569;
  font-family: inherit;
  text-align: left;
  background-color: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  transition: color 0.2s ease, background-color 0.2s ease;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    color: #006f68;
    background-color: #f0fdfa;

    .material-file__icon {
      color: #ffffff;
      background-color: var(--color-primary, #00857c);
    }
  }

  &.is-previewing {
    color: #00706b;
    background-color: #e6f4f3;

    .material-file__name {
      font-weight: 600;
    }
  }
}

.material-file__icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00857c;
  font-size: 14px;
  background-color: #ecfdf9;
  border-radius: 7px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.material-file__name {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-file__actions {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.material-file__action-wrap {
  display: inline-flex;
}

.material-file__action {
  height: 28px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--color-primary, #00857c);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
  transition: color 0.12s ease, background-color 0.12s ease;

  &:hover,
  &:focus {
    color: #005f5a;
    background-color: #e6f4f3;
  }

  &:focus-visible {
    outline: 2px solid #00706b;
    outline-offset: 1px;
  }

  &:disabled {
    color: #94a3b8;
    cursor: not-allowed;
    background: transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .material-button,
  .material-file,
  .material-file__icon,
  .material-file__action {
    transition: none;
  }

  .material-button:hover,
  .material-button:focus {
    transform: none;
  }
}
</style>

<!-- 抽屉使用 append-to-body，DOM 被传送到 body 外层，需用非 scoped 样式（以唯一类名约束作用域） -->
<style lang="less">
.review-material-drawer {
  box-shadow: -12px 0 32px rgba(15, 23, 42, 0.12);

  .el-drawer__header {
    display: flex;
    align-items: center;
    height: 48px;
    min-height: 48px;
    margin-bottom: 0;
    padding: 0 12px 0 16px;
    box-sizing: border-box;
    color: #1e293b;
    font-size: 13px;
    font-weight: 600;
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
  }

  .el-drawer__close-btn {
    width: 30px;
    height: 30px;
    color: #64748b;
    border-radius: 6px;

    &:hover,
    &:focus {
      color: var(--color-primary, #00857c);
      background-color: #f0fdfa;
    }
  }

  .el-drawer__body {
    height: 100%;
    padding: 0;
    overflow: hidden;
    background-color: #f8fafc;
  }
}

.ai-audit-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 14px 20px;
    border-bottom: 1px solid #f2f6fc;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
  .el-drawer__body {
    padding: 0;
    height: 100%;
    overflow: hidden;
    background-color: #f5f7fa;
  }
}
</style>
