<template>
  <vxe-modal
    :model-value="modal.visible"
    :loading="modal.loading"
    :destroy-on-close="true"
    show-footer
    show-close
    resize
    position="center"
    width="880"
    height="620"
    title="查看章节"
    @close="$emit('close')"
  >
    <div class="chapter-modal">
      <div class="chapter-modal__hd">
        <span class="chapter-modal__title" :title="modal.attachName">{{ modal.attachName || '—' }}</span>
        <span class="chapter-modal__meta">共 {{ rows.length }} 个章节</span>
        <el-button
          class="chapter-modal__export"
          type="primary"
          size="small"
          plain
          :loading="exporting"
          :disabled="modal.loading || !canExport"
          @click="handleExport"
        >
          导 出
        </el-button>
      </div>
      <div class="chapter-modal__body">
        <div class="chapter-modal__tree">
          <el-tree
            v-if="tree.length"
            ref="treeRef"
            :data="tree"
            node-key="chapterUuid"
            :props="TREE_PROPS"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
          />
          <div v-else class="chapter-modal__empty">{{ modal.loading ? '加载中…' : '暂无章节切片' }}</div>
        </div>
        <div class="chapter-modal__content">
          <template v-if="selected">
            <div class="chapter-modal__content-title">{{ selected.title }}</div>
            <div class="chapter-modal__content-body">{{ selected.content || '（本章节暂无内容）' }}</div>
          </template>
          <div v-else class="chapter-modal__empty">选择左侧章节查看内容</div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <el-button size="small" plain @click="$emit('close')">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { ElMessage } from 'element-plus'
import type { AttachChapterRow } from '@/api/ai/document/xmAttachChapter'
import { exportAttachChapters } from '@/api/ai/document/xmAttachChapter'
import { apiExportHandle } from '@/utils/export'
import type { ChapterModalState } from '../hooks/useAiDocumentPage'

interface ChapterTreeNode extends AttachChapterRow {
  children?: ChapterTreeNode[]
}

const TREE_PROPS = { label: 'title', children: 'children' }

const props = defineProps({
  modal: {
    type: Object as PropType<ChapterModalState>,
    required: true
  }
})

defineEmits(['close'])

const treeRef = ref()
const selected = ref<AttachChapterRow | null>(null)
const exporting = ref(false)
const rows = computed<AttachChapterRow[]>(() => props.modal.rows || [])

/** 有附件ID且确实加载到章节时才允许导出 */
const canExport = computed(() => Boolean(String(props.modal.attachId || '').trim()) && rows.value.length > 0)

/** 导出当前附件的章节切片（POST xm-attach-chapter/export，入参 attachId） */
const handleExport = async () => {
  if (exporting.value) return
  const attachId = String(props.modal.attachId || '').trim()
  if (!attachId) {
    ElMessage.warning('当前数据缺少附件ID')
    return
  }
  if (!rows.value.length) {
    ElMessage.warning('暂无可导出的章节')
    return
  }

  exporting.value = true
  try {
    await apiExportHandle(attachId, '附件章节切片', exportAttachChapters)
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败，请稍后重试')
  } finally {
    exporting.value = false
  }
}

/** 接口返回的是树序扁平列表（parentId 指父章节 UUID），这里按 parent 重建树并按 sequence 排同级 */
const tree = computed<ChapterTreeNode[]>(() => {
  const map = new Map<string, ChapterTreeNode>()
  rows.value.forEach((row) => map.set(String(row.chapterUuid), { ...row, children: [] }))
  const roots: ChapterTreeNode[] = []
  rows.value.forEach((row) => {
    const node = map.get(String(row.chapterUuid))
    if (!node) return
    const parent = row.parentId ? map.get(String(row.parentId)) : undefined
    if (parent) parent.children!.push(node)
    else roots.push(node)
  })
  const sortBySequence = (nodes: ChapterTreeNode[]) => {
    nodes.sort((a, b) => Number(a.sequence ?? 0) - Number(b.sequence ?? 0))
    nodes.forEach((node) => sortBySequence(node.children || []))
  }
  sortBySequence(roots)
  return roots
})

const handleNodeClick = (node: ChapterTreeNode) => {
  selected.value = node
}

/** 每次打开（或数据到达）默认选中第一个章节，并把树的高亮同步过去 */
watch(
  () => [props.modal.visible, props.modal.loading, rows.value.length] as const,
  () => {
    if (!props.modal.visible || props.modal.loading) return
    selected.value = rows.value[0] || null
    void nextTick(() => {
      if (selected.value?.chapterUuid) treeRef.value?.setCurrentKey?.(selected.value.chapterUuid)
    })
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
.chapter-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.chapter-modal__hd {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid #b8ddd9;
  border-radius: 8px;
  background: #f2f9f8;
}

.chapter-modal__export {
  flex: none;
  margin-left: auto;
}

.chapter-modal__title {
  min-width: 0;
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-modal__meta {
  flex-shrink: 0;
  color: #00706b;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.chapter-modal__body {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  gap: 12px;
}

.chapter-modal__tree,
.chapter-modal__content {
  min-height: 0;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  box-sizing: border-box;
}

.chapter-modal__tree {
  flex: 0 0 44%;
  padding: 6px 4px;
}

.chapter-modal__content {
  flex: 1 1 0;
  padding: 12px 14px;
}

.chapter-modal__content-title {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  font-size: 13px;
  font-weight: 600;
}

.chapter-modal__content-body {
  color: #475569;
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.chapter-modal__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 120px;
  color: #64748b;
  font-size: 12.5px;
}

/* 章节树：字号与列表一致，选中态走主色雾面 */
.chapter-modal__tree :deep(.el-tree-node__content) {
  height: 30px;
  border-radius: 6px;
}

.chapter-modal__tree :deep(.el-tree-node__label) {
  font-size: 12.5px;
  color: #475569;
}

/* 选中态：主题包把 highlight-current 的底色刷成了主色实心（深青绿），深底 + 主色字会糊成一片，
   这里强制改成浅底 + 主色字（!important 压过主题的实心底） */
.chapter-modal__tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: #00706b !important;
  background-color: #f2f9f8 !important;
}

.chapter-modal__tree :deep(.el-tree-node.is-current > .el-tree-node__content .el-tree-node__label) {
  color: #00706b !important;
  font-weight: 600;
}

.chapter-modal__tree :deep(.el-tree-node.is-current > .el-tree-node__content:hover) {
  background-color: #e6f4f3 !important;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
