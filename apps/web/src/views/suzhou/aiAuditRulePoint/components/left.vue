<!-- 审核要点 - 左侧面板 -->
<template>
  <div class="point-left">
    <!-- 顶部：标题 + 数量 -->
    <div class="point-left__header">
      <span class="point-left__title">
        <i class="point-left__title-bar" />
        智能审核规则
      </span>
      <span class="point-left__count">共 {{ total }} 条</span>
    </div>

    <!-- 中间：搜索框 + 新增按钮 -->
    <div class="point-left__toolbar">
      <el-input
        v-model="keyword"
        class="point-left__search"
        size="small"
        clearable
        placeholder="搜索规则编码或名称"
        @keyup.enter="fetchList"
        @input="fetchList"
      >
        <template #prefix>
          <Search class="point-left__search-icon" />
        </template>
      </el-input>
      <el-button v-permission="'ADD'" class="point-left__add" size="small" type="primary" @click="handleAdd">
        <span>+ 新 增</span>
      </el-button>
    </div>

    <!-- 底部：卡片列表 -->
    <div class="point-left__body">
      <div
        v-for="item in list"
        :key="item.id"
        class="point-left__card"
        :class="{ 'point-left__card--active': activeId === item.categoryRuleId }"
        @click="handleSelect(item)"
      >
        <div class="point-left__card-row point-left__card-row--head">
          <span class="point-left__card-code">{{ item.ruleCode }}</span>
          <span class="point-left__card-status" :class="item.ruleStatus === '1' ? 'point-left__card-status--on' : 'point-left__card-status--off'">
            {{ item.ruleStatusName }}
          </span>
        </div>
        <div class="point-left__card-row point-left__card-row--name">{{ item.ruleName }}</div>
        <div class="point-left__card-tags">
          <span class="point-left__card-tag point-left__card-tag__color1">
            {{ item.ruleClassifyName }}
          </span>
          <span class="point-left__card-tag point-left__card-tag__color2">
            {{ item.ruleLevelName }}
          </span>
          <span class="point-left__card-tag point-left__card-tag__color3">
            {{ item.execStageName }}
          </span>
        </div>
      </div>
      <div v-if="!list.length" class="point-left__empty">暂无数据</div>
    </div>
    <rangeModal ref="rangeModalRef" @search-handle="searchHandle" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search } from '@lucide/vue'
import rangeModal from './manageModal/index.vue'
import { getRulePage } from '@/api/suzhou/aiAuditRulePoint'

interface PointItem {
  categoryRuleId: string
  ruleCode: string
  ruleName: string
  ruleClassifyName: string
  ruleLevelName: string
  ruleStatusName: string
  ruleStatus: '0' | '1'
  [key: string]: any
}

const emit = defineEmits<{
  (e: 'select', item: PointItem | null): void
}>()

const keyword = ref('')
const list = ref<PointItem[]>([])
const total = ref(0)
const activeId = ref('')
const rangeModalRef = ref()

const fetchList = async () => {
  const res = await getRulePage({ keyWord: keyword.value })
  if (res.success) {
    const records = res.data?.records || res.data || []
    list.value = Array.isArray(records) ? records : []
    total.value = res.data?.total ?? list.value.length
  }
}

const handleSelect = (item: PointItem) => {
  // 二次点击同一规则 → 取消选中
  if (activeId.value === item.categoryRuleId) {
    activeId.value = ''
    emit('select', null)
  } else {
    activeId.value = item.categoryRuleId
    emit('select', item)
  }
}

const handleAdd = () => {
  rangeModalRef.value?.acceptParams({ searchParams: {}, type: '新增' })
}

const searchHandle = (val: any) => {
  if (val) fetchList()
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="less">
@primary: #00706b;
@primary-hover: #2a9a92;
@primary-active: #005f5a;
@primary-soft: #f2f9f8;
@primary-hover-soft: #e6f4f3;
@primary-border: #b8ddd9;
@text-main: #1e293b;
@text-body: #475569;
@text-muted: #64748b;
@surface: #ffffff;
@border: #e2e8f0;
@border-light: #eef2f6;

.point-left {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding: 12px 14px;
    border-bottom: 1px solid @border-light;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: @text-main;
    font-size: 17px;
    font-weight: 600;
  }

  &__title-bar {
    display: inline-block;
    width: 10px;
    height: 1.5em;
    background: @primary;
    border-radius: 5px;
  }

  &__count {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 12px;
    color: @primary;
    font-size: 12px;
    background-color: @primary-hover-soft;
    border-radius: 10px;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding: 10px 14px;
    border-bottom: 1px solid @border-light;
  }

  &__search {
    flex: 1 1 0;
    min-width: 0;

    :deep(.el-input__inner) {
      height: 32px;
      line-height: 32px;
      color: @text-body;
      font-size: 12px;
      border-color: @border;
      border-radius: 6px;
      padding-left: 30px;

      &:hover {
        border-color: @primary-border;
      }

      &:focus {
        border-color: @primary;
      }
    }

    :deep(.el-input__prefix) {
      left: 8px;
      display: flex;
      align-items: center;
      color: @text-muted;
    }
  }

  &__search-icon {
    width: 14px;
    height: 14px;
    color: @text-muted;
  }

  &__add {
    flex-shrink: 0;
  }

  &__body {
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__card {
    flex-shrink: 0;
    min-height: 100px;
    padding: 12px;
    background: @surface;
    border: 1px solid @border;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.12s ease, background-color 0.12s ease;

    &:hover {
      border-color: @primary-border;
      background-color: @primary-soft;
    }

    &--active {
      border-color: @primary;
      background-color: @primary-soft;
    }
  }

  &__card-tags {
    margin-top: 12px;
    display: flex;
    justify-content: flex-start;
    gap: 10px;
  }

  &__card-row {
    color: @text-body;
    font-size: 13px;
    line-height: 20px;

    & + & {
      margin-top: 6px;
    }

    &--head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &--name {
      color: @text-main;
      font-size: 15px;
      font-weight: 600;

      .point-left__card--active & {
        color: @primary;
      }
    }
  }

  &__card-code {
    color: @primary;
    font-size: 13px;
    font-weight: 600;
  }

  &__card-status {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 8px;
    font-size: 12px;
    border-radius: 10px;

    &--on {
      color: @primary;
      background-color: @primary-soft;
      border: 1px solid @primary-border;
    }

    &--off {
      color: #e07a12;
      background-color: fade(#e07a12, 8%);
      border: 1px solid #e07a12;
    }
  }

  &__card-tag {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 10px;
    font-size: 12px;
    border-radius: 11px;
    color: @text-body;
    background-color: #f1f5f9;
    border: 1px solid @border;

    &__color1 {
      color: @primary;
      background-color: @primary-soft;
      border-color: @primary-border;
    }

    &__color2 {
      color: #b35e0a;
      background-color: #fdf3e6;
      border-color: #f3d3a6;
    }

    &__color3 {
      color: #475569;
      background-color: #f1f5f9;
      border-color: #cbd5e1;
    }
  }

  &__empty {
    padding: 24px 0;
    color: @text-muted;
    font-size: 12px;
    text-align: center;
  }
}

:deep(.el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  height: 32px;
  min-height: 32px;
  padding: 6px 12px;
  line-height: 1;
}

:deep(.el-button--primary) {
  color: @primary !important;
  background-color: @primary-soft !important;
  border-color: @primary-border !important;
  background-image: none !important;

  &:hover,
  &:focus {
    color: @primary !important;
    background-color: @primary-hover-soft !important;
    border-color: @primary !important;
  }
}

.point-left :deep(.el-button.point-left__add) {
  color: #ffffff !important;
  background-color: @primary !important;
  border-color: @primary !important;
  background-image: none !important;

  &:hover,
  &:focus {
    color: #ffffff !important;
    background-color: @primary-hover !important;
    border-color: @primary-hover !important;
  }

  &:active {
    color: #ffffff !important;
    background-color: @primary-active !important;
    border-color: @primary-active !important;
  }
}
</style>
