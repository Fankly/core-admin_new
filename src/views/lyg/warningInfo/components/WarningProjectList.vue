<template>
  <div class="warning-list-card">
    <!-- Header -->
    <cardTitle :title="`预警项目明细`" />

    <div class="list-container">
      <div class="table-header">
        <div class="col">项目编码</div>
        <div class="col">责任人</div>
        <div class="col">责任主任</div>
        <div class="col">预警节点</div>
      </div>
      <div class="scroll-wrapper">
        <div class="scroll-track">
          <div v-for="(item, i) in projectList" :key="i" class="table-row" :class="{ 'row-even': i % 2 === 0, 'row-odd': i % 2 !== 0 }">
            <div class="col font-mono">{{ item.pspid }}</div>
            <div class="col text-slate-700">{{ item.projectManagerName }}</div>
            <div class="col text-slate-600">{{ item.directorName }}</div>
            <div class="col flex-center">
              <span
                class="status-tag"
                :class="{
                  'tag-remind': item.yjlx === 'TX',
                  'tag-alert': item.yjlx === 'YJ',
                  'tag-warning': item.yjlx === 'JG'
                }"
              >
                <span
                  class="dot-indicator"
                  :class="{
                    'dot-remind': item.yjlx === 'TX',
                    'dot-alert': item.yjlx === 'YJ',
                    'dot-warning': item.yjlx === 'JG'
                  }"
                ></span>
                <span>{{ item.yjhjName }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import cardTitle from '@/views/lyg/components/cardTitle.vue'
const props = defineProps<{
  projectList?: any[]
}>()
</script>

<style scoped>
.warning-list-card {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  height: 100%;
  border-radius: 12px;
  box-sizing: border-box;
}

.list-container {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  border-radius: 8px;
  background-color: rgba(248, 250, 252, 0.5);
  display: flex;
  flex-direction: column;
}

.table-header {
  background-color: rgba(241, 245, 249, 0.95);
  font-size: 16px;
  color: #475569;
  font-weight: 700;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px 12px;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.scroll-wrapper {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  overflow-y: auto;
  position: relative;
}

.scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.scroll-track {
  width: 100%;
  display: inline-block;
  position: absolute;
  padding-top: 0%;
  animation-name: scrollContinuous;
  animation-duration: 20s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.scroll-track:hover {
  animation-play-state: paused;
}

@keyframes scrollContinuous {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(-50%);
  }
}

.table-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px 12px;
  font-size: 16px;
  color: #334155;
  transition: background-color 0.2s ease;
  align-items: center;
}

.row-even {
  background-color: rgba(255, 255, 255, 0.7);
}

.row-odd {
  background-color: rgba(248, 250, 252, 0.7);
}

.table-row:hover {
  background-color: rgba(204, 251, 241, 0.6);
}

.col {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.font-mono {
  font-family: monospace;
  font-weight: 600;
  color: #1e293b;
}

.text-slate-700 {
  color: #334155;
}

.text-slate-600 {
  color: #475569;
}

.flex-center {
  display: flex;
  align-items: center;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
}

.tag-remind {
  background-color: rgba(254, 252, 232, 0.9);
  color: #78350f;
}

.tag-alert {
  background-color: rgba(255, 237, 213, 0.9);
  color: #7c2d12;
}

.tag-warning {
  background-color: rgba(255, 228, 230, 0.9);
  color: #881337;
}

/* 8px Color Dot */
.dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-remind {
  background-color: #fafd0c;
  border: 1px solid rgba(251, 191, 36, 0.8);
  box-shadow: 0 0 4px #fafd0c;
}

.dot-alert {
  background-color: #fc9907;
  border: 1px solid rgba(251, 146, 60, 0.8);
  box-shadow: 0 0 4px #fc9907;
}

.dot-warning {
  background-color: #db2f2b;
  border: 1px solid rgba(248, 113, 113, 0.8);
  box-shadow: 0 0 4px #db2f2b;
}
</style>
