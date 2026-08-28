<template>
  <div class="chart-card">
    <cardTitle :title="`本市各专业排行榜`" />

    <div class="chart-container">
      <div class="bar-list">
        <div v-for="(item, index) in chartData" :key="index" class="bar-row">
          <div class="bar-label" :title="item.deptName">{{ item.deptName }}</div>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: item.wcl + '%' }" @mouseenter="showTooltip($event, item)" @mouseleave="hideTooltip"></div>
            <div class="bar-pec">{{ item.wcl }}%</div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        ref="tooltipRef"
        class="bar-tooltip-floating"
        :class="{ 'is-below': tooltip.below }"
        :style="{ top: tooltip.top + 'px', left: tooltip.left + 'px' }"
      >
        <div class="tooltip-title">{{ tooltip.data?.deptName }}</div>
        <div class="tooltip-row"
          >排名：<span>{{ tooltip.data?.pm }}</span></div
        >
        <div class="tooltip-row"
          >完成率：<span>{{ tooltip.data?.wcl }}%</span></div
        >
        <div class="tooltip-row"
          >目标值：<span>{{ tooltip.data?.mbz }} 万元</span></div
        >
        <div class="tooltip-row"
          >完成值：<span>{{ tooltip.data?.wcz }} 万元</span></div
        >
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, nextTick } from 'vue'
import { formatNumValue } from '@/utils/utils'
import cardTitle from '@/views/lyg/components/cardTitle.vue'

interface DataVo {
  MUNICIPAL_DEPTS_COMPLETION: any[]
}
const props = defineProps<DataVo>()

const chartData = computed(() => {
  if (!props.MUNICIPAL_DEPTS_COMPLETION) return []
  return props.MUNICIPAL_DEPTS_COMPLETION.map((d: any) => ({
    deptName: d.deptName ?? '',
    wcl: typeof d.wcl === 'number' ? d.wcl : Number(d.wcl) || 0,
    pm: d.pm ?? '--',
    mbz: formatNumValue(String(d.mbz ?? 0), 2),
    wcz: formatNumValue(String(d.wcz ?? 0), 2)
  }))
})

const tooltipRef = ref<HTMLElement | null>(null)
const tooltip = reactive<{
  visible: boolean
  top: number
  left: number
  below: boolean
  data: any
}>({
  visible: false,
  top: 0,
  left: 0,
  below: false,
  data: null
})

const showTooltip = async (e: MouseEvent, item: any) => {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  tooltip.data = item
  tooltip.visible = true
  await nextTick()
  const tipEl = tooltipRef.value
  const tipH = tipEl?.offsetHeight ?? 0
  const tipW = tipEl?.offsetWidth ?? 0
  const gap = 8
  const flip = rect.top - tipH - gap < 0
  tooltip.below = flip
  tooltip.top = flip ? rect.bottom + gap : rect.top - tipH - gap
  const centerX = rect.left + rect.width / 2
  const halfW = tipW / 2
  tooltip.left = Math.min(Math.max(centerX, halfW + gap), window.innerWidth - halfW - gap)
}

const hideTooltip = () => {
  tooltip.visible = false
}
</script>

<style scoped>
.chart-card {
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 10px;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.chart-container {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.bar-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  overflow: hidden;
  overflow-y: auto;
}
.bar-list::-webkit-scrollbar {
  display: none;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.bar-label {
  width: 80px;
  flex-shrink: 0;
  color: #334155;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
}

.bar-track {
  flex: 1;
  height: 12px;
  position: relative;
  display: flex;
  align-items: center;
}

.bar-fill {
  height: 12px;
  border-radius: 0 4px 4px 0;
  background: linear-gradient(90deg, #0d9488, #2dd4bf);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 2px;
  transition: width 0.4s ease;
  position: relative;
  cursor: pointer;
}

.bar-fill:hover {
  filter: brightness(1.08);
}
.bar-pec {
  padding-left: 8px;
  color: #1e293b;
  font-size: 14px;
  font-weight: bold;
}
</style>

<style>
.bar-tooltip-floating {
  position: fixed;
  transform: translate(-50%, 0);
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(45, 212, 191, 0.4);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  line-height: 1.6;
  white-space: nowrap;
  z-index: 99999;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.bar-tooltip-floating.is-below {
  transform: translate(-50%, 0);
}

.bar-tooltip-floating::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(15, 23, 42, 0.95);
}

.bar-tooltip-floating.is-below::after {
  top: auto;
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: rgba(15, 23, 42, 0.95);
}

.bar-tooltip-floating .tooltip-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #5eead4;
}

.bar-tooltip-floating .tooltip-row span {
  font-weight: bold;
  color: #34d399;
}
</style>
