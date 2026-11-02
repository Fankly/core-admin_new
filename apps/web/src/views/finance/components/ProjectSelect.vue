<template>
  <el-select
    ref="lazySelect"
    v-model="selectedValue"
    filterable
    :filter-method="remoteSearch"
    placeholder="请输入项目名称或直接下拉查找"
    @visible-change="handleVisibleChange"
    @change="handleChange"
    v-bind="$attrs"
  >
    <!-- 删除了 :loading="loading"，防止 ElementUI 原生机制导致高度塌缩和闪烁 -->

    <el-option v-for="item in options" :key="item.projectId" :label="item.name" :value="item.projectId"> </el-option>

    <!-- 状态提示 (作为选项的一部分，不会引发重绘闪烁) -->
    <div v-if="loading" class="lazy-status-text"> <el-icon class="ep-icon-loading is-loading"><EpLoading /></el-icon> 数据加载中... </div>
    <div v-if="isFinished && options.length > 0" class="lazy-status-text"> 已加载全部数据 </div>
  </el-select>
</template>

<script setup>
import { Loading as EpLoading } from '@element-plus/icons-vue'
import { CwProject } from '@/api/mainController'
import { nextTick, reactive, toRef, toRefs, computed, watch, onMounted, onBeforeUnmount, getCurrentInstance, useTemplateRef } from 'vue'
defineOptions({
  name: 'ProjectSelect'
})
const componentProps = defineProps({
  value: {
    type: [String, Number],
    default: ''
  }
})
const emit = defineEmits()
const componentInstance = getCurrentInstance().proxy
const lazySelectRef = useTemplateRef('lazySelect')
const componentData = reactive({
  options: [],
  loading: false,
  hasLoaded: false,
  searchKeyword: '',
  pageParam: {
    pageNum: 1,
    pageSize: 20
  },
  total: 0,
  scrollBound: false,
  searchTimer: null
})
const options = toRef(componentData, 'options')
const loading = toRef(componentData, 'loading')
const hasLoaded = toRef(componentData, 'hasLoaded')
const searchKeyword = toRef(componentData, 'searchKeyword')
const pageParam = toRef(componentData, 'pageParam')
const total = toRef(componentData, 'total')
const scrollBound = toRef(componentData, 'scrollBound')
const searchTimer = toRef(componentData, 'searchTimer')
function loadProjectDetail(projectId) {
  // 先检查 options 中是否已经有这个项目了
  const existingItem = componentData.options.find((item) => item.projectId === projectId)
  if (existingItem) return
  CwProject.view(
    componentInstance,
    {
      projectId
    },
    {},
    {
      showMask: false
    }
  )
    .then((res) => {
      if (res.data) {
        componentData.options = [res.data, ...componentData.options]
      }
    })
    .catch(() => {})
}
function handleChange(val) {
  const selectedItem = componentData.options.find((item) => item.projectId === val) || null
  emit('select-item', selectedItem)
}
function handleVisibleChange(visible) {
  if (visible) {
    if (!componentData.hasLoaded) {
      resetPagination()
      loadData()
    }
    setTimeout(() => {
      bindScrollEvent()
    }, 200)
  }
}
function bindScrollEvent() {
  if (componentData.scrollBound) return
  const popper = lazySelectRef.value?.$refs?.popper
  if (popper && popper.$el) {
    const wrap = popper.$el.querySelector('.el-select-dropdown__wrap')
    if (wrap) {
      wrap.addEventListener('scroll', handleScroll)
      componentData.scrollBound = true
    }
  }
}
function handleScroll(e) {
  const { scrollHeight, scrollTop, clientHeight } = e.target
  if (scrollHeight - scrollTop <= clientHeight + 5) {
    loadMore()
  }
}
function remoteSearch(query) {
  // 清除之前的定时器
  if (componentData.searchTimer) {
    clearTimeout(componentData.searchTimer)
  }
  // 设置新的定时器，延迟 300ms 执行搜索
  componentData.searchTimer = setTimeout(() => {
    componentData.searchKeyword = query
    resetPagination()
    loadData()
  }, 300)
}
function loadMore() {
  if (componentData.loading || isFinished.value) return
  componentData.pageParam.pageNum += 1
  loadData(true)
}
function resetPagination() {
  componentData.pageParam.pageNum = 1
  componentData.total = 0
  componentData.hasLoaded = false
}
function loadData(isAppend = false) {
  componentData.loading = true
  const params = {
    cwProjectDtoFilter: {
      name: componentData.searchKeyword || undefined
    },
    pageParam: componentData.pageParam
  }
  CwProject.promptCaseList(
    componentInstance,
    params,
    {
      // headers: { MenuId: '1896798431855251456' }
    },
    {},
    {
      showMask: false
    }
  )
    .then((res) => {
      const list = res?.data?.dataList || []
      componentData.total = res?.data?.totalCount || 0
      if (isAppend) {
        // 追加模式：去重后追加
        const existingIds = new Set(componentData.options.map((item) => item.projectId))
        const filteredList = list.filter((item) => !existingIds.has(item.projectId))
        componentData.options = [...componentData.options, ...filteredList]
      } else if (componentData.searchKeyword) {
        // 搜索模式：只保留已选中的项目和搜索结果
        const selectedItem = componentProps.value ? componentData.options.find((item) => item.projectId === componentProps.value) : null
        const newList = [...list]
        if (selectedItem && !list.some((l) => l.projectId === selectedItem.projectId)) {
          newList.unshift(selectedItem)
        }
        componentData.options = newList
      } else {
        // 正常加载模式：保留手动加载的项目，其他用新数据替换
        const manualItems = componentData.options.filter((item) => !list.some((l) => l.projectId === item.projectId))
        componentData.options = [...list, ...manualItems]
      }
      componentData.hasLoaded = true
    })
    .catch(() => {
      if (!isAppend) {
        componentData.options = []
      }
    })
    .finally(() => {
      componentData.loading = false

      // 强制 ElementUI 重新计算弹出框位置（保险起见，防止偏移）
      nextTick(() => {
        lazySelectRef.value?.broadcast?.('ElSelectDropdown', 'updatePopper')
      })
      setTimeout(() => {
        checkFillContainer()
      }, 100)
    })
}
function checkFillContainer() {
  if (componentData.loading || isFinished.value) return
  const popper = lazySelectRef.value?.$refs?.popper
  if (popper && popper.$el) {
    const wrap = popper.$el.querySelector('.el-select-dropdown__wrap')
    if (wrap && wrap.clientHeight > 0) {
      if (wrap.scrollHeight <= wrap.clientHeight + 5) {
        loadMore()
      }
    }
  }
}
const selectedValue = computed({
  get() {
    return componentProps.value
  },
  set(val) {
    emit('input', val)
  }
})
const isFinished = computed(() => {
  return componentData.hasLoaded && componentData.options.length >= componentData.total
})
watch(
  () => componentProps.value,
  function (newVal) {
    if (newVal) {
      loadProjectDetail(newVal)
    }
  },
  {
    immediate: false
  }
)
onMounted(() => {
  if (componentProps.value) {
    loadProjectDetail(componentProps.value)
  }
})
onBeforeUnmount(() => {
  // 清除搜索定时器
  if (componentData.searchTimer) {
    clearTimeout(componentData.searchTimer)
    componentData.searchTimer = null
  }
  // 清除滚动事件监听
  const popper = lazySelectRef.value?.$refs?.popper
  if (popper && popper.$el) {
    const wrap = popper.$el.querySelector('.el-select-dropdown__wrap')
    if (wrap) {
      wrap.removeEventListener('scroll', handleScroll)
    }
  }
})
defineExpose({
  EpLoading,
  loadProjectDetail,
  handleChange,
  handleVisibleChange,
  bindScrollEvent,
  handleScroll,
  remoteSearch,
  loadMore,
  resetPagination,
  loadData,
  checkFillContainer,
  ...toRefs(componentData),
  selectedValue,
  isFinished
})
</script>

<style scoped>
.lazy-status-text {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 10px 0;
  line-height: 1;
}
/* 给下拉框加一个最小高度，防止第一次打开且数据还没回来时过小 */
:deep(.el-select-dropdown__wrap) {
  min-height: 50px;
}
</style>
