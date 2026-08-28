<template>
  <div class="ai-audit-rule-list">
    <template v-if="items.length">
      <div class="ai-audit-rule-list__table">
        <div class="ai-audit-rule-list__header" role="row">
          <span class="ai-audit-rule-list__col ai-audit-rule-list__col--name">审核项</span>
          <span class="ai-audit-rule-list__col ai-audit-rule-list__col--result">审核结果</span>
        </div>
        <div class="ai-audit-rule-list__body">
          <div v-for="(item, index) in items" :key="item.detailId || item.ruleId || index" class="ai-audit-rule-list__row" role="row">
            <div class="ai-audit-rule-list__col ai-audit-rule-list__col--name">
              <FileCheck2 class="ai-audit-rule-list__name-icon" :stroke-width="1.8" aria-hidden="true" />
              <ReText>{{ item.ruleName }}</ReText>
            </div>
            <div class="ai-audit-rule-list__col ai-audit-rule-list__col--result">
              <div class="ai-audit-rule-list__result-text">
                <ReText class="ai-audit-rule-list__summary" :line-clamp="2">
                  <TypewriterText :text="item.reviewConclude" :animate="false" />
                </ReText>
              </div>
              <div class="ai-audit-rule-list__result-actions">
                <button
                  type="button"
                  class="ai-audit-rule-list__detail"
                  :aria-label="`查看${item.ruleName || '当前规则'}的评审详情`"
                  @click="emit('detail', item, index)"
                >
                  <span>详情</span>
                </button>
                <button
                  v-if="showManualReview && (getAuditStatus(item) || item.reviewOpinionName)"
                  type="button"
                  class="ai-audit-rule-list__manual-review"
                  :aria-label="`对${item.ruleName || '当前规则'}进行人工复核`"
                  @click.stop="emit('manual-review', item, index)"
                >
                  人工复核
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="ai-audit-rule-list__empty">{{ emptyText }}</div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { FileCheck2 } from 'lucide-vue-next'
import ReText from '@/components/ReText/src/index.vue'
import TypewriterText from '@/views/ai/smartTaskAudit/components/TypewriterText.vue'
import type { RuleReviewDetailItem } from '@/views/ai/smartTaskAudit/components/auditDetailHelpers'

defineProps({
  items: {
    type: Array as PropType<RuleReviewDetailItem[]>,
    default: () => []
  },
  emptyText: {
    type: String,
    default: '暂无评审信息'
  },
  /** 仅专家预审等指定场景展示人工复核入口，默认隐藏 */
  showManualReview: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (event: 'detail', item: RuleReviewDetailItem, index: number): void
  (event: 'manual-review', item: RuleReviewDetailItem, index: number): void
}>()

const getAuditStatus = (item: RuleReviewDetailItem) => {
  const opinion = String(item.reviewOpinion ?? '')
  if (opinion === '0' || opinion === '2') return 'pending'
  return ''
}
</script>

<style scoped lang="less">
.ai-audit-rule-list {
  --name-column: minmax(140px, 32%);
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
  box-sizing: border-box;
  color: #253b3e;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(41, 171, 166, 0.38) transparent;
}

.ai-audit-rule-list::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.ai-audit-rule-list::-webkit-scrollbar-track {
  background: transparent;
}

.ai-audit-rule-list::-webkit-scrollbar-thumb {
  background: rgba(41, 171, 166, 0.38);
  border-radius: 7px;
}

.ai-audit-rule-list__table {
  min-width: 480px;
  overflow: hidden;
  box-sizing: border-box;
  background: linear-gradient(180deg, rgba(252, 255, 255, 0.98) 0%, rgba(244, 251, 250, 0.96) 100%);
  border: 1px solid #9fded9;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(31, 151, 145, 0.12), inset 0 0 18px rgba(69, 192, 185, 0.08), inset 0 1px 0 #fff;
}

.ai-audit-rule-list__header {
  display: grid;
  grid-template-columns: var(--name-column) minmax(0, 1fr);
  min-height: 36px;
  color: #173c40;
  font-size: 14px;
  font-weight: 700;
  background: linear-gradient(100deg, #fbfefe 0%, #e8f6f5 48%, #f1faf9 100%);
  border-bottom: 1px solid #c5e5e2;
  box-shadow: inset 0 1px 0 #fff, 0 2px 5px rgba(40, 158, 151, 0.08);
}

.ai-audit-rule-list__body {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
}

.ai-audit-rule-list__row {
  display: grid;
  grid-template-columns: var(--name-column) minmax(0, 1fr);
  min-height: 48px;
  background: linear-gradient(100deg, #fff 0%, #f8fcfb 43%, #e7f5f2 100%);
  border-bottom: 1px solid #d5e9e7;
  transition: background-color 0.18s ease, box-shadow 0.18s ease;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: linear-gradient(100deg, #fff 0%, #f2faf9 45%, #def1ee 100%);
    box-shadow: inset 0 0 0 1px rgba(185, 222, 219, 0.55);
  }
}

.ai-audit-rule-list__col {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 5px 10px;
  box-sizing: border-box;
}

.ai-audit-rule-list__col--name {
  gap: 6px;
  justify-content: flex-start;
  color: #26393c;
  font-size: 12px;
  font-weight: 400;
  border-right: 1px solid #d3e8e6;

  :deep(.re-text) {
    flex: 0 1 auto;
    width: auto;
    max-width: calc(100% - 20px);
    min-width: 0;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.ai-audit-rule-list__name-icon {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  color: #00a6a0;
  filter: drop-shadow(0 2px 2px rgba(0, 145, 138, 0.12));
}

.ai-audit-rule-list__col--result {
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.ai-audit-rule-list__result-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: #445b60;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.45;
}

.ai-audit-rule-list__summary {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  max-height: calc(1.45em * 2);
  overflow: hidden;
  line-height: 1.45;
  text-align: left;
  text-overflow: ellipsis;
  word-break: break-word;
  /* 与 ReText line-clamp=2 一致，避免内部 HTML 把省略撑破 */
  display: -webkit-box !important;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  :deep(.typewriter),
  :deep(p),
  :deep(span),
  :deep(div) {
    display: inline;
    margin: 0;
    padding: 0;
    line-height: inherit;
  }
}

.ai-audit-rule-list__result-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.ai-audit-rule-list__header .ai-audit-rule-list__col--name,
.ai-audit-rule-list__header .ai-audit-rule-list__col--result {
  justify-content: center;
  color: #173c40;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.ai-audit-rule-list__detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 24px;
  padding: 0;
  color: #008d8b;
  font-family: inherit;
  font-size: 12px;
  font-weight: 400;
  line-height: 22px;
  white-space: nowrap;
  background: transparent;
  border: 0;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    color: #006f6d;
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 141, 139, 0.35);
    outline-offset: 2px;
  }
}

/* 对齐页内 primary plain：浅主色底 + 描边，比纯白底更易扫到，又不抢戏 */
.ai-audit-rule-list__manual-review {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 68px;
  height: 22px;
  padding: 0 8px;
  box-sizing: border-box;
  color: var(--color-primary, #00857c);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
  background: rgba(0, 133, 124, 0.08);
  border: 1px solid rgba(0, 133, 124, 0.45);
  border-radius: 3px;
  cursor: pointer;
  appearance: none;
  transition: color 0.18s ease, background-color 0.18s ease, border-color 0.18s ease;

  &:hover {
    color: #fff;
    background: var(--color-primary, #00857c);
    border-color: var(--color-primary, #00857c);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 133, 124, 0.35);
    outline-offset: 2px;
  }

  &:active {
    color: #fff;
    background: #006f68;
    border-color: #006f68;
  }
}

.ai-audit-rule-list__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  color: #6f8588;
  font-size: 12px;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
}
</style>
