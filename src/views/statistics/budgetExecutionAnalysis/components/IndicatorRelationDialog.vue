<template>
  <vxe-modal
    v-bind="$attrs"
    :destroy-on-close="true"
    :loading="loading"
    @show="showHandle"
    @close="closeHandle"
    v-model="showModal"
    title="指标项关联"
    width="520"
    height="420"
    position="center"
    show-zoom
    resize
  >
    <div class="indicator-relation">
      <div class="toolbar">
        <span class="summary">已选 {{ selectedCodes.length }}/{{ indicatorList.length }}</span>
        <div class="actions">
          <el-button type="text" @click="selectAllHandle">全选</el-button>
          <el-button type="text" @click="clearSelectedHandle">清空</el-button>
        </div>
      </div>
      <div v-if="indicatorList.length" class="indicator-list">
        <el-checkbox-group v-model="selectedCodes" class="indicator-group">
          <el-checkbox v-for="item in indicatorList" :key="item.code" :label="item.code" class="indicator-item">
            {{ item.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <div v-else class="empty-text">暂无可关联的指标项</div>
      <div class="footer">
        <el-button plain size="mini" type="primary" @click="saveHandle">确 定</el-button>
        <el-button plain size="mini" type="primary" @click="closeHandle">取 消</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: '/statistics/budgetExecutionAnalysis/components/IndicatorRelationDialog'
}
</script>

<script setup lang="ts">
import { getPublicCodeList } from '@/api/common'
import { getIndicatorCodeByBusiType, updateIndicator } from '@/api/statistics/budgetStatisticsConfig'
import { ElMessage } from 'element-plus'
import { defineExpose, defineProps, ref } from 'vue'

interface Props {
  busiType: string
}

interface IndicatorItem {
  code: string
  name: string
  id?: string
  note?: string
  sort?: string
  unicode?: string
  [key: string]: any
}

const props = defineProps<Props>()

const showModal = ref(false)
const loading = ref(false)
const indicatorList = ref<IndicatorItem[]>([])
const selectedCodes = ref<string[]>([])
const selectedIndicators = ref<IndicatorItem[]>([])

const normalizeIndicatorCodes = (data: any): string[] => {
  if (Array.isArray(data)) {
    return Array.from(
      new Set(
        data
          .map((item) => {
            if (typeof item === 'string') return item
            if (item && typeof item === 'object') return item.code
            return ''
          })
          .filter(Boolean)
      )
    )
  }
  if (typeof data === 'string') {
    return Array.from(
      new Set(
        data
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    )
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data.indicators)) {
      return normalizeIndicatorCodes(data.indicators)
    }
    if (Array.isArray(data.data)) {
      return normalizeIndicatorCodes(data.data)
    }
  }
  return []
}

const normalizeIndicatorItems = (data: any): IndicatorItem[] => {
  if (Array.isArray(data)) {
    return data.filter((item): item is IndicatorItem => !!item && typeof item === 'object' && !!item.code)
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data.indicators)) {
      return normalizeIndicatorItems(data.indicators)
    }
    if (Array.isArray(data.data)) {
      return normalizeIndicatorItems(data.data)
    }
  }
  return []
}

const resetState = () => {
  indicatorList.value = []
  selectedCodes.value = []
  selectedIndicators.value = []
}

const loadIndicatorData = async () => {
  if (!props.busiType) {
    resetState()
    return
  }
  loading.value = true
  try {
    const [codeRes, selectedRes] = await Promise.all([
      getPublicCodeList({
        codes: ['ALL_INDICATOR_CODE']
      }),
      getIndicatorCodeByBusiType(props.busiType)
    ])
    if (codeRes.success && codeRes.data) {
      indicatorList.value = codeRes.data['ALL_INDICATOR_CODE'] || []
    } else {
      indicatorList.value = []
      ElMessage.error(codeRes.msg)
    }
    if (selectedRes.success) {
      selectedIndicators.value = normalizeIndicatorItems(selectedRes.data)
      selectedCodes.value = normalizeIndicatorCodes(selectedRes.data)
    } else {
      selectedIndicators.value = []
      selectedCodes.value = []
      ElMessage.error(selectedRes.msg)
    }
  } catch {
    resetState()
    ElMessage.error('指标项加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const showHandle = async () => {
  if (!props.busiType) {
    showModal.value = false
    ElMessage.warning('请先选择展示维度！')
    return
  }
  await loadIndicatorData()
}

const closeHandle = () => {
  showModal.value = false
}

const selectAllHandle = () => {
  selectedCodes.value = indicatorList.value.map((item) => item.code)
}

const clearSelectedHandle = () => {
  selectedCodes.value = []
}

const saveHandle = async () => {
  if (!props.busiType) {
    ElMessage.warning('请先选择展示维度！')
    return
  }
  loading.value = true
  try {
    const indicatorMap = new Map<string, IndicatorItem>()
    indicatorList.value.forEach((item) => {
      indicatorMap.set(item.code, item)
    })
    selectedIndicators.value.forEach((item) => {
      if (item?.code && !indicatorMap.has(item.code)) {
        indicatorMap.set(item.code, item)
      }
    })
    const indicators = selectedCodes.value.map((code) => {
      return (
        indicatorMap.get(code) || {
          code,
          name: code,
          id: '',
          note: '',
          sort: '',
          unicode: ''
        }
      )
    })
    const res = await updateIndicator({
      busiType: props.busiType,
      indicators
    })
    if (res.success) {
      ElMessage.success('保存成功！')
      closeHandle()
      return
    }
    ElMessage.error(res.msg)
  } catch {
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

defineExpose({
  showModal
})
</script>

<style scoped lang="less">
.indicator-relation {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  .summary {
    color: #909399;
    font-size: 12px;
  }
}

.indicator-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.indicator-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.indicator-item {
  min-width: 0;
  margin-right: 0;
}

.empty-text {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.footer {
  padding-top: 16px;
  text-align: center;
}
</style>
