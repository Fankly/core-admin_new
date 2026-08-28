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
    <div v-if="loading" class="lazy-status-text"> <i class="el-icon-loading"></i> 数据加载中... </div>
    <div v-if="isFinished && options.length > 0" class="lazy-status-text"> 已加载全部数据 </div>
  </el-select>
</template>

<script>
import { CwProject } from '@/api/mainController'

export default {
  name: 'ProjectSelect',
  props: {
    value: {
      type: [String, Number],
      default: ''
    }
  },
  model: {
    prop: 'value',
    event: 'input'
  },
  data() {
    return {
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
    }
  },
  computed: {
    selectedValue: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    isFinished() {
      return this.hasLoaded && this.options.length >= this.total
    }
  },
  mounted() {
    if (this.value) {
      this.loadProjectDetail(this.value)
    }
  },
  watch: {
    value: {
      immediate: false,
      handler(newVal) {
        if (newVal) {
          this.loadProjectDetail(newVal)
        }
      }
    }
  },
  methods: {
    loadProjectDetail(projectId) {
      // 先检查 options 中是否已经有这个项目了
      const existingItem = this.options.find((item) => item.projectId === projectId)
      if (existingItem) return

      CwProject.view(this, { projectId }, {}, { showMask: false })
        .then((res) => {
          if (res.data) {
            this.options = [res.data, ...this.options]
          }
        })
        .catch(() => {})
    },
    handleChange(val) {
      const selectedItem = this.options.find((item) => item.projectId === val) || null
      this.$emit('select-item', selectedItem)
    },

    handleVisibleChange(visible) {
      if (visible) {
        if (!this.hasLoaded) {
          this.resetPagination()
          this.loadData()
        }
        setTimeout(() => {
          this.bindScrollEvent()
        }, 200)
      }
    },

    bindScrollEvent() {
      if (this.scrollBound) return
      const popper = this.$refs.lazySelect?.$refs?.popper
      if (popper && popper.$el) {
        const wrap = popper.$el.querySelector('.el-select-dropdown__wrap')
        if (wrap) {
          wrap.addEventListener('scroll', this.handleScroll)
          this.scrollBound = true
        }
      }
    },

    handleScroll(e) {
      const { scrollHeight, scrollTop, clientHeight } = e.target
      if (scrollHeight - scrollTop <= clientHeight + 5) {
        this.loadMore()
      }
    },

    remoteSearch(query) {
      // 清除之前的定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      // 设置新的定时器，延迟 300ms 执行搜索
      this.searchTimer = setTimeout(() => {
        this.searchKeyword = query
        this.resetPagination()
        this.loadData()
      }, 300)
    },

    loadMore() {
      if (this.loading || this.isFinished) return
      this.pageParam.pageNum += 1
      this.loadData(true)
    },

    resetPagination() {
      this.pageParam.pageNum = 1
      this.total = 0
      this.hasLoaded = false
    },

    loadData(isAppend = false) {
      this.loading = true
      const params = {
        cwProjectDtoFilter: {
          name: this.searchKeyword || undefined
        },
        pageParam: this.pageParam
      }

      CwProject.promptCaseList(
        this,
        params,
        {
          // headers: { MenuId: '1896798431855251456' }
        },
        {},
        { showMask: false }
      )
        .then((res) => {
          const list = res?.data?.dataList || []
          this.total = res?.data?.totalCount || 0

          if (isAppend) {
            // 追加模式：去重后追加
            const existingIds = new Set(this.options.map((item) => item.projectId))
            const filteredList = list.filter((item) => !existingIds.has(item.projectId))
            this.options = [...this.options, ...filteredList]
          } else if (this.searchKeyword) {
            // 搜索模式：只保留已选中的项目和搜索结果
            const selectedItem = this.value ? this.options.find((item) => item.projectId === this.value) : null
            const newList = [...list]
            if (selectedItem && !list.some((l) => l.projectId === selectedItem.projectId)) {
              newList.unshift(selectedItem)
            }
            this.options = newList
          } else {
            // 正常加载模式：保留手动加载的项目，其他用新数据替换
            const manualItems = this.options.filter((item) => !list.some((l) => l.projectId === item.projectId))
            this.options = [...list, ...manualItems]
          }

          this.hasLoaded = true
        })
        .catch(() => {
          if (!isAppend) {
            this.options = []
          }
        })
        .finally(() => {
          this.loading = false

          // 强制 ElementUI 重新计算弹出框位置（保险起见，防止偏移）
          this.$nextTick(() => {
            this.$refs.lazySelect?.broadcast?.('ElSelectDropdown', 'updatePopper')
          })

          setTimeout(() => {
            this.checkFillContainer()
          }, 100)
        })
    },

    checkFillContainer() {
      if (this.loading || this.isFinished) return

      const popper = this.$refs.lazySelect?.$refs?.popper
      if (popper && popper.$el) {
        const wrap = popper.$el.querySelector('.el-select-dropdown__wrap')
        if (wrap && wrap.clientHeight > 0) {
          if (wrap.scrollHeight <= wrap.clientHeight + 5) {
            this.loadMore()
          }
        }
      }
    }
  },
  beforeUnmount() {
    // 清除搜索定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
      this.searchTimer = null
    }
    // 清除滚动事件监听
    const popper = this.$refs.lazySelect?.$refs?.popper
    if (popper && popper.$el) {
      const wrap = popper.$el.querySelector('.el-select-dropdown__wrap')
      if (wrap) {
        wrap.removeEventListener('scroll', this.handleScroll)
      }
    }
  }
}
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
