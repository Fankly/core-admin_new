<template>
  <div class="zzfile-trigger">
    <el-button class="material-button" size="small" type="primary" plain :aria-label="materialButtonLabel" @click="openMaterialDrawer">
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
              <span class="material-file__main">
                <span class="material-file__name" :title="getReviewMaterialFileName(file)">{{ getReviewMaterialFileName(file) }}</span>
                <span v-if="isAutoGenFile(file)" class="auto-gen-chip" :title="AUTO_GEN_TIP">
                  <i class="el-icon-magic-stick" aria-hidden="true"></i>
                  <span>自动生成</span>
                </span>
              </span>
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

        <!-- 两块同源于一次 getPsydAndfjByYssxId，遮罩挂在外层容器上，避免一次请求转两个 spinner -->
        <div v-if="showFinancialBasis" class="financial-basis-blocks" v-loading="financialBasisLoading">
          <!-- 主要制度依据：与佐证材料同款卡片结构，独立成块 -->
          <section class="material-group-card">
            <header class="material-group-card__header">
              <div>
                <i class="el-icon-collection" aria-hidden="true"></i>
                <span>主要制度依据</span>
              </div>
              <span v-if="financialBasisFiles.length" class="material-group-card__count">{{ financialBasisFiles.length }} 份</span>
            </header>
            <div
              v-for="file in financialBasisFiles"
              :key="getReviewMaterialFileKey(file)"
              class="material-file"
              :class="{ 'is-previewing': isActivePreviewFile(file) }"
            >
              <span class="material-file__icon" aria-hidden="true"><i class="el-icon-document"></i></span>
              <span class="material-file__main">
                <span class="material-file__name" :title="getFinancialBasisFileName(file)">{{ getFinancialBasisFileName(file) }}</span>
                <span class="material-file__type">{{ getFinancialBasisFileType(file) }}</span>
              </span>
              <span class="material-file__actions">
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
            <div v-if="!financialBasisFiles.length" class="material-group-card__empty">暂无主要制度依据</div>
          </section>

          <!-- 财务审核要点：纯文本，独立成块 -->
          <section class="material-group-card">
            <header class="material-group-card__header">
              <div>
                <i class="el-icon-document-checked" aria-hidden="true"></i>
                <span>财务审核要点</span>
              </div>
            </header>
            <div v-if="financialReviewPoint" class="review-point">{{ financialReviewPoint }}</div>
            <div v-else class="material-group-card__empty">暂无财务审核要点</div>
          </section>
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
import { Download, Eye } from '@lucide/vue'
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
    /**
     * 是否在抽屉中展示“主要制度依据”与“财务审核要点”区块。
     * 默认 true，即不传就展示 —— 线下评审（offlineReview）就是走默认，对所有评审人可见。
     * 线上专家评审（expertReview）按 isFinanceMajor 只给财务专业专家；
     * 线下评审回填（offlineReviewReturn）显式传 false 不展示。
     * 新增页面务必显式传值，不要依赖默认。
     */
    showFinancialBasis?: boolean
    /**
     * 是否展示“初审报告由线上预审自动生成”标识（依据 getXmInfoByYsbgfj 返回的每条附件的 sfzdsc === '1'）。
     * 默认 false，即不传就不展示 —— 线下评审（offlineReview）、线下评审回填（offlineReviewReturn）走默认；
     * 线上专家评审（expertReview）显式传 true。
     */
    showAutoGenMark?: boolean
  }>(),
  {
    showFinancialBasis: true,
    showAutoGenMark: false
  }
)

// 联合会审附件下载标识，与“更多详情-附件信息”下载（DynamicUploadGroup）保持一致
const IS_LHHS = '1'

// 附件行 sfzdsc === '1' 表示该附件由线上预审自动生成
const AUTO_GEN_FLAG = '1'
const AUTO_GEN_TIP = '初审报告由线上预审自动生成'

const ReserveApprovalDetail = defineAsyncComponent(() => import('@/views/finance/reserveApprovalDetail/index.vue'))

const loading = ref<boolean>(false)
const materialDrawerVisible = ref<boolean>(false)
const filePreviewVisible = ref<boolean>(false)
const activePreviewFileKey = ref<string>('')
const filePreviewOpenRequest = ref<number>(0)
const reviewMaterialPreviewRef = ref<{ closeAll: () => void } | null>(null)

const xmFileColumns = ref<any[]>([]) //项目附件名称
const xmFileList = ref<Record<string, any[]>>({}) //项目附件内容

// 主要制度依据与财务审核要点（按预算事项id加载）
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

// 按附件行独立判断，避免文件名或同组其他附件导致误标
const isAutoGenFile = (file: ReviewMaterialFile) => props.showAutoGenMark && String(file.sfzdsc ?? '').trim() === AUTO_GEN_FLAG

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
  // 主要制度依据/财务审核要点按预算事项id加载（仅展示开关开启时）
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
      xmid: xmId,
      yssxId: yssxId
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
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 12px;
  overflow-y: auto;
  box-sizing: border-box;
  background-color: #f8fafc;
}

.material-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 附件行自动生成标识 */
.auto-gen-chip {
  flex: 0 0 auto;
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 18px;
  padding: 0 6px;
  color: #00776f;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
  background-color: #f0fdfa;
  border: 1px solid rgba(0, 133, 124, 0.24);
  border-radius: 9px;

  i {
    font-size: 12px;
  }
}

/* 制度依据与审核要点两张卡：外层承载 v-loading 遮罩，间距沿用抽屉的 10px 节奏 */
.financial-basis-blocks {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 财务审核要点正文 */
.review-point {
  padding: 10px 12px;
  color: #334155;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.material-group-card {
  overflow: hidden;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.material-group-card__header {
  min-height: 34px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background-color: #f8fafc;
  border-bottom: 1px solid #eef2f6;

  > div {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: #334155;
    font-size: 12px;
    font-weight: 600;
  }

  i {
    color: var(--color-primary, #00857c);
    font-size: 14px;
  }
}

.material-group-card__count {
  flex: 0 0 auto;
  padding: 0 6px;
  color: #64748b;
  font-size: 11px;
  line-height: 16px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.material-group-card__empty {
  padding: 12px 10px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}

.material-file {
  width: 100%;
  min-height: 36px;
  padding: 6px 10px;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 8px;
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
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00857c;
  font-size: 13px;
  background-color: #ecfdf9;
  border-radius: 6px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

/* 名称与类型同行排布，避免为一个类型标签多占一行高度 */
.material-file__main {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 6px;
}

.material-file__name {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-file__type {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.5;
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
  height: 24px;
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
