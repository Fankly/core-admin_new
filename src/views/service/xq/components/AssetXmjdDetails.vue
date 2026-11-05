<!-- 项目进度一览 -->
<template>
  <div ref="rootRef" class="asset-xmjd-details">
    <!-- 加载中 -->
    <div v-if="loading" class="xmjd-state-wrap">
      <div class="xmjd-spinner"></div>
      <p class="xmjd-state-text">流程信息加载中…</p>
    </div>

    <!-- 空状态：暂无流程信息 + 动画 -->
    <div v-else-if="empty" class="xmjd-empty-wrap">
      <div class="xmjd-empty-icon">
        <svg class="empty-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9-9 0 00-9-9z"
          />
        </svg>
      </div>
      <p class="xmjd-empty-text">暂无流程信息</p>
    </div>

    <!-- 正常流程视图 -->
    <WorkflowTreeView v-else :project-name="projectName" :stages="stages" :steps="steps" @time-sort-change="handleTimeSortChange" />
  </div>
</template>

<script lang="ts">
export default {
  name: '/xmInfo/xmysConfig/index'
}
</script>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import WorkflowTreeView from '@/views/service/xq/components/WorkflowTreeView.vue'
import { getDataByXmid, getDataByXmidOrderByTime } from '@/api/xmInfo/stageConfig'
import { ElMessage } from 'element-plus'

interface Props {
  selectData: any
  globalParams: any
  opType: string
  pageType: string
}

// 默认值
const props = withDefaults(defineProps<Props>(), {
  selectData: null,
  globalParams: null,
  opType: 'EDIT'
})

const projectName = ref<string | undefined>(undefined)
const stages = ref<any[] | undefined>(undefined)
const steps = ref<any[] | undefined>(undefined)
const loading = ref(false)
const empty = ref(false)
// 时间排序方向：1=升序 2=降序，默认降序（与 WorkflowTreeView 的 timeSortOrder 默认 desc 一致）
const timeOrderType = ref(2)

const rootRef = ref<HTMLElement | null>(null)
// 是否已触发过首次加载，避免 IntersectionObserver 重复触发
const loadTriggered = ref(false)
let observer: IntersectionObserver | null = null

// 点击「时间排序」按钮时重新调接口刷新 steps
const handleTimeSortChange = async (orderType: number) => {
  timeOrderType.value = orderType
  const params: any = {
    xmid: props.globalParams.ID,
    pageType: props.pageType ?? 'null',
    orderType
  }
  try {
    const con: any = await getDataByXmidOrderByTime(params)
    if (con.success) {
      steps.value = con.data?.processLists ?? []
    } else {
      ElMessage.error(con.msg)
    }
  } catch {
    // 静默失败，保留现有数据
  }
}

const initData = async () => {
  loading.value = true
  empty.value = false
  projectName.value = props.selectData?.xmmc ?? undefined
  const params: any = {
    xmid: props.globalParams.ID,
    pageType: props.pageType ?? 'null'
  }
  try {
    const res: any = await getDataByXmid({ ...params })
    if (res.success) {
      const list = res.data?.processLists ?? []
      stages.value = list
      empty.value = list.length === 0
    } else {
      ElMessage.error(res.msg)
      empty.value = true
    }
    const con: any = await getDataByXmidOrderByTime({ ...params, orderType: timeOrderType.value })
    if (con.success) {
      const data = con.data?.processLists ?? []
      steps.value = data
      // empty.value = data.length === 0
    } else {
      ElMessage.error(con.msg)
      // empty.value = true
    }
  } catch {
    empty.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 等 tab 页被点击切换进来、组件真正可见后再调接口，
  // 避免一打开弹窗就并发拉取所有 tab 的流程数据。
  const el = rootRef.value
  if (!el || typeof IntersectionObserver === 'undefined') {
    // 兜底：没有可观察节点或不支持 IO，直接加载
    initData()
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !loadTriggered.value) {
          loadTriggered.value = true
          initData()
          // 首次加载完成后即可停止观察
          observer?.disconnect()
          observer = null
          break
        }
      }
    },
    { threshold: 0 }
  )
  observer.observe(el)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style scoped lang="less">
.asset-xmjd-details {
  width: 100%;
  height: 100%;
}

.xmjd-state-wrap,
.xmjd-empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 1rem;
  width: 100%;
  height: 100%;
  min-height: 320px;
}

.xmjd-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  border: 3px solid rgba(0, 112, 107, 0.15);
  border-top-color: #00706b;
  animation: xmjdSpin 0.8s linear infinite;
}

@keyframes xmjdSpin {
  to {
    transform: rotate(360deg);
  }
}

.xmjd-state-text {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
}

.xmjd-empty-icon {
  width: 5rem;
  height: 5rem;
  border-radius: 9999px;
  background-color: rgba(0, 112, 107, 0.08);
  color: #00706b;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: xmjdFloat 3s ease-in-out infinite;
}

.empty-svg {
  width: 2.5rem;
  height: 2.5rem;
}

@keyframes xmjdFloat {
  0%,
  100% {
    transform: translateY(0);
    box-shadow: 0 0 0 0 rgba(0, 112, 107, 0.12);
  }
  50% {
    transform: translateY(-8px);
    box-shadow: 0 0 0 12px rgba(0, 112, 107, 0);
  }
}

.xmjd-empty-text {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.02em;
}
</style>
