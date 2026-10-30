<template>
  <main class="home-dashboard">
    <div class="dash">
      <section class="dash-hero" aria-labelledby="dashWelcome">
        <h1 id="dashWelcome" class="dash-hero-title"> <span>欢迎使用</span><span class="dash-hero-brand">项目过程管控平台</span> </h1>
        <div class="dash-hero-art" aria-hidden="true"><img class="dash-art-svg" :src="welcomeArt" alt="" /></div>
      </section>

      <div class="dash-row">
        <section class="dash-card dash-quick" aria-labelledby="dashQuick" :aria-busy="favLoadPending">
          <header class="dash-head">
            <span class="dash-head-icon is-teal"><DashboardIcon name="grid" /></span><h2 id="dashQuick">快捷入口</h2>
            <button
              v-if="!favLoadPending && !favLoadFailed && allQuickEntries.length > QUICK_LIMIT"
              class="dash-more"
              type="button"
              :aria-label="`查看全部 ${allQuickEntries.length} 个快捷入口`"
              @click="quickAllVisible = true"
            >
              更多<DashboardIcon name="chevron" />
            </button>
          </header>
          <div v-if="favLoadPending" class="dash-empty quick-empty" role="status">正在加载快捷入口…</div>
          <div v-else-if="favLoadFailed" class="dash-empty quick-empty" role="status">
            快捷入口加载失败
            <button class="dash-action" type="button" @click="reloadFavorites">重新加载</button>
          </div>
          <div v-else-if="!quickEntries.length" class="dash-empty quick-empty" role="status">
            暂无收藏菜单
            <span class="quick-hint">在左侧菜单点击星标收藏后，可在这里快速访问</span>
          </div>
          <div v-else class="quick-grid">
            <button
              v-for="entry in quickEntries"
              :key="entry.key"
              class="quick-item"
              type="button"
              :disabled="!entry.target && !entry.url"
              :title="entry.target || entry.url ? entry.name : `${entry.name}：暂无可访问的菜单`"
              @click="openEntry(entry)"
            >
              <span class="quick-icon" :class="`tone-${entry.tone}`"><DashboardIcon :name="entry.icon" /></span>
              <span class="quick-label">{{ entry.name }}</span
              ><span class="quick-go"><DashboardIcon name="chevron" /></span>
            </button>
          </div>
        </section>

        <section class="dash-card dash-manual" aria-labelledby="dashManual" :aria-busy="manualState.loading">
          <header class="dash-head">
            <span class="dash-head-icon is-teal"><DashboardIcon name="book" /></span><h2 id="dashManual">用户手册</h2>
            <button
              v-if="!manualState.loading && !manualState.error && manuals.length > 0"
              class="dash-more"
              type="button"
              :aria-label="`查看全部 ${manuals.length} 个用户手册`"
              @click="openManuals"
            >
              更多<DashboardIcon name="chevron" />
            </button>
          </header>
          <div v-if="manualState.loading || manualState.error || !manuals.length" class="dash-empty" role="status">
            {{ manualState.loading ? '正在加载用户手册…' : manualState.error ? '用户手册加载失败' : '暂无用户手册' }}
            <button v-if="manualState.error" class="dash-action" type="button" @click="loadManuals">重新加载</button>
          </div>
          <ul v-else class="dash-list">
            <li v-for="manual in visibleManuals" :key="manual.uuid">
              <button class="dash-row-btn" type="button" :title="manual.fjmc" :disabled="!!downloading" @click="downloadManual(manual)">
                <span class="doc-tag" :class="manual.fjmc.toLowerCase().endsWith('.pdf') ? 'doc-tag--pdf' : 'doc-tag--doc'">{{
                  fileType(manual.fjmc)
                }}</span>
                <span class="dash-row-text">{{ downloading === manual.uuid ? '正在下载…' : manual.fjmc.replace(/\.[^.]+$/, '') }}</span>
              </button>
            </li>
          </ul>
        </section>

        <section class="dash-card dash-notice" aria-labelledby="dashNotice" :aria-busy="noticeState.loading">
          <header class="dash-head">
            <span class="dash-head-icon is-red"><DashboardIcon name="megaphone" /></span><h2 id="dashNotice">系统公告</h2>
            <button class="dash-more" type="button" @click="openNoticeList">更多<DashboardIcon name="chevron" /></button>
          </header>
          <div v-if="noticeState.loading || noticeState.error || !notices.length" class="dash-empty" role="status">
            {{ noticeState.loading ? '正在加载系统公告…' : noticeState.error ? '系统公告加载失败' : '暂无系统公告' }}
            <button v-if="noticeState.error" class="dash-action" type="button" @click="loadNotices">重新加载</button>
          </div>
          <ul v-else class="dash-list">
            <li v-for="notice in notices" :key="notice.id">
              <button class="dash-row-btn" type="button" :title="notice.versionTitle" @click="selectedNotice = notice">
                <i class="notice-dot" aria-hidden="true"></i><span class="dash-row-text">{{ notice.versionTitle }}</span>
                <time class="notice-date" :datetime="dateText(notice.noticeTime)">{{ dateText(notice.noticeTime) }}</time>
              </button>
            </li>
          </ul>
        </section>
      </div>

      <section class="dash-card dash-todo" aria-labelledby="dashTodo" :aria-busy="todoState.loading">
        <header class="dash-head">
          <span class="dash-head-icon is-teal"><DashboardIcon name="clipboard" /></span><h2 id="dashTodo">待办事项</h2>
          <span v-if="!todoState.loading && !todoState.error" class="dash-badge" :aria-label="`共 ${todoPageable.total} 条待办`">{{
            todoPageable.total
          }}</span>
          <button class="dash-more" type="button" @click="router.push('/workflow/todoTasks')">更多<DashboardIcon name="chevron" /></button>
        </header>
        <div class="todo-vxe-box">
          <vxe-table
            class="todo-vxe"
            border="full"
            :data="todoRows"
            :loading="todoState.loading"
            height="auto"
            auto-resize
            size="small"
            show-overflow
            :column-config="{ resizable: true }"
            :row-config="{ isHover: true, height: 44 }"
            :cell-style="{ color: '#475569' }"
            :header-cell-style="{ height: '36px', backgroundColor: '#f6f8fa', color: '#64748b', fontWeight: 400 }"
          >
            <vxe-column field="workflowName" title="流程名称" width="20%" align="center" />
            <vxe-column field="bizName" title="业务名称" width="26%">
              <template #default="{ row }">
                <span class="todo-biz" :title="plainText(row.bizName)" v-html="row.bizName || '—'"></span>
              </template>
            </vxe-column>
            <vxe-column field="activityDefName" title="操作环节" width="16%" align="center" />
            <vxe-column field="senderName" title="发送人" width="12%" align="center" />
            <vxe-column field="startTime" title="发送时间" width="13%" align="center" />
            <vxe-column title="操作" width="13%" align="center">
              <template #default="{ row }">
                <span class="todo-acts">
                  <button class="dash-action" type="button" @click.stop="openTodo(row)">处理</button>
                  <template v-if="row.workflowName">
                    <i class="act-divider" aria-hidden="true"></i>
                    <button class="dash-action" type="button" @click.stop="openTracking(row)">流转过程</button>
                  </template>
                </span>
              </template>
            </vxe-column>
            <template #empty>
              <div class="dash-empty dash-empty--todo" role="status">
                {{ todoState.loading ? '正在加载待办事项…' : todoState.error ? '待办事项加载失败' : '暂无待办事项' }}
                <button v-if="todoState.error" class="dash-action" type="button" @click="loadTodos()">重新加载</button>
              </div>
            </template>
          </vxe-table>
        </div>
        <footer v-if="todoPageable.total > 0" class="todo-pager">
          <Pagination :pageable="todoPageable" :handle-size-change="handleTodoSizeChange" :handle-current-change="handleTodoCurrentChange" />
        </footer>
      </section>
    </div>

    <NoticeModal v-if="selectedNotice" :is-open="true" :notices="[selectedNotice]" @close="selectedNotice = null" />
    <vxe-modal
      v-model="manualAllVisible"
      width="720"
      height="600"
      show-footer
      esc-closable
      mask-closable
      destroy-on-close
      transfer
      position="center"
      class-name="home-manual-modal"
    >
      <template #title>
        <div class="hnm-head">
          <span class="hnm-head-icon is-teal"><DashboardIcon name="book" /></span>
          <span class="hnm-head-text">
            <span class="hnm-title">用户手册</span>
            <span class="hnm-sub">已发布文件 · 共 {{ manuals.length }} 个</span>
          </span>
        </div>
      </template>
      <div class="hnm-list-wrap">
        <div v-if="manualState.loading || manualState.error || !manuals.length" class="notice-list-status" role="status">
          {{ manualState.loading ? '正在加载用户手册…' : manualState.error ? '用户手册加载失败' : '暂无用户手册' }}
          <button v-if="manualState.error" class="dash-action" type="button" @click="loadManuals">重新加载</button>
        </div>
        <ul v-else class="notice-dialog-list">
          <li v-for="manual in manuals" :key="manual.uuid">
            <button type="button" :title="manual.fjmc" :disabled="!!downloading" @click="downloadManual(manual)">
              <span class="doc-tag" :class="manual.fjmc.toLowerCase().endsWith('.pdf') ? 'doc-tag--pdf' : 'doc-tag--doc'">{{
                fileType(manual.fjmc)
              }}</span>
              <span class="hnm-item-title">{{ downloading === manual.uuid ? '正在下载…' : manual.fjmc }}</span>
              <span class="hnm-item-date">{{ downloading === manual.uuid ? '' : '下载' }}</span>
            </button>
          </li>
        </ul>
      </div>
      <template #footer>
        <div class="hmm-foot">
          <span class="hnm-all-shown">共 {{ manuals.length }} 个文件</span>
          <button class="dash-action" type="button" :disabled="!!downloading" @click="downloadAllManuals">
            {{ downloading ? '正在下载…' : '批量下载' }}
          </button>
        </div>
      </template>
    </vxe-modal>
    <vxe-modal
      v-model="noticeListVisible"
      width="720"
      height="600"
      show-footer
      esc-closable
      mask-closable
      destroy-on-close
      transfer
      position="center"
      class-name="home-notice-modal"
    >
      <template #title>
        <div class="hnm-head">
          <span class="hnm-head-icon"><DashboardIcon name="megaphone" /></span>
          <span class="hnm-head-text">
            <span class="hnm-title">系统公告</span>
            <span class="hnm-sub">已发布通知 · 共 {{ noticeListTotal }} 条</span>
          </span>
        </div>
      </template>
      <div class="hnm-list-wrap">
        <div v-if="noticeListState.loading || noticeListState.error || !noticeList.length" class="notice-list-status" role="status">
          {{ noticeListState.loading ? '正在加载系统公告…' : noticeListState.error ? '系统公告加载失败' : '暂无系统公告' }}
          <button v-if="noticeListState.error" class="dash-action" type="button" @click="loadNoticeList(noticePage)">重新加载</button>
        </div>
        <ul v-else class="notice-dialog-list">
          <li v-for="notice in noticeList" :key="notice.id">
            <button type="button" :title="notice.versionTitle" @click="selectedNotice = notice">
              <i class="notice-dot" aria-hidden="true"></i>
              <span class="hnm-item-title">{{ notice.versionTitle }}</span>
              <time class="hnm-item-date" :datetime="dateText(notice.noticeTime)">{{ dateText(notice.noticeTime) }}</time>
            </button>
          </li>
        </ul>
      </div>
      <template #footer>
        <el-pagination
          v-if="noticeListTotal > 10"
          :current-page="noticePage"
          :page-size="10"
          :total="noticeListTotal"
          layout="prev, pager, next"
          @current-change="loadNoticeList"
        />
        <span v-else class="hnm-all-shown">已显示全部公告</span>
      </template>
    </vxe-modal>
    <vxe-modal
      v-model="quickAllVisible"
      width="760"
      esc-closable
      mask-closable
      destroy-on-close
      transfer
      position="center"
      class-name="home-quick-modal"
    >
      <template #title>
        <div class="hnm-head">
          <span class="hnm-head-icon is-teal"><DashboardIcon name="grid" /></span>
          <span class="hnm-head-text">
            <span class="hnm-title">快捷入口</span>
            <span class="hnm-sub">已收藏菜单 · 共 {{ allQuickEntries.length }} 个</span>
          </span>
        </div>
      </template>
      <!-- 弹窗 transfer 到 body，脱离 .home-dashboard；.quick-all 在 home-glass.css 里补齐同一套变量 -->
      <div class="quick-all">
        <div class="quick-all-grid">
          <button
            v-for="entry in allQuickEntries"
            :key="entry.key"
            class="quick-item"
            type="button"
            :disabled="!entry.target && !entry.url"
            :title="entry.target || entry.url ? entry.name : `${entry.name}：暂无可访问的菜单`"
            @click="openQuickFromAll(entry)"
          >
            <span class="quick-icon" :class="`tone-${entry.tone}`"><DashboardIcon :name="entry.icon" /></span>
            <span class="quick-label">{{ entry.name }}</span
            ><span class="quick-go"><DashboardIcon name="chevron" /></span>
          </button>
        </div>
      </div>
    </vxe-modal>
    <vxe-modal
      v-model="todoVisible"
      title="业务处理"
      width="86%"
      height="800px"
      fullscreen
      show-zoom
      resize
      destroy-on-close
      transfer
      @close="loadTodos()"
    >
      <iframe v-if="todoVisible" ref="todoFrame" class="home-todo-frame" title="待办事项处理" :src="todoUrl"></iframe>
    </vxe-modal>
  </main>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useStore } from '@/store/business'
import { ElMessage } from 'element-plus'
import { downloadFj, getConfigByMenuId, listFj } from '@/api/metrics'
import { getMenuMessage } from '@/api/process'
import { versionNoticePage } from '@/api/sys/versionNotice'
import { getWfTracking, queryWorkItemsByEmployee } from '@/api/workflow'
import NoticeModal from '@/components/NoticeModal/index.vue'
import Pagination from '@/components/ProTable/components/Pagination.vue'
import DashboardIcon from './DashboardIcon.vue'
import { useFavoritesStore } from '@/store'
import { storeToRefs } from 'pinia'
import welcomeArt from '@/assets/images/home/welcome-glass.svg'

interface Manual {
  uuid: string
  fjmc: string
}
interface Notice {
  id: string
  versionTitle: string
  noticeTime: string
  versionContent: string
  versionNo: string
  releaseDate: string
}
interface Todo {
  id: string
  bizName: string
  workflowName: string
  activityDefName: string
  senderName: string
  startTime: string
  urgency: string
  wfInstId: string
  url: string
}

const store = useStore()
const router = useRouter()
// 快捷入口图标/配色按收藏顺序循环取用
const quickIcons = ['database', 'users', 'folder', 'doc', 'chart', 'cube', 'trend', 'layers', 'gear']
const quickTones = ['mint', 'blue', 'orange', 'purple', 'green', 'red', 'amber']
interface QuickEntry {
  key: string
  name: string
  icon: string
  tone: string
  target?: RouteRecordRaw
  url: string
}

const firstPage = (route?: RouteRecordRaw): RouteRecordRaw | undefined => {
  if (!route || route.meta?.isNavigationMenu === false) return
  if (route.children?.length) {
    for (const child of route.children) {
      const page = firstPage(child)
      if (page) return page
    }
    return
  }
  if (route.path && (route.component || route.meta?.isNewPage || route.meta?.isIframe)) return route
}
// 收藏项按 menuId 反查路由树（与侧边栏一致），取不到时退回收藏记录自带的 url
const findMenuById = (routes: RouteRecordRaw[], menuId: string): RouteRecordRaw | undefined => {
  if (!menuId) return
  for (const route of routes) {
    if (String(route.meta?.id ?? '') === menuId) return route
    const hit = findMenuById(route.children || [], menuId)
    if (hit) return hit
  }
}
const favoritesStore = useFavoritesStore()
const { favorites: favList, loadPending: favLoadPending, loadFailed: favLoadFailed } = storeToRefs(favoritesStore)
const reloadFavoritesRaw = favoritesStore.reload
const reloadFavorites = () => reloadFavoritesRaw(true)
// 卡片内固定 2 列 × 3 行，超出部分收进「更多」弹窗
const QUICK_LIMIT = 6
const allQuickEntries = computed<QuickEntry[]>(() =>
  [...favList.value]
    .sort((a, b) => a.sort - b.sort)
    .map((fav, index) => {
      const route = findMenuById(store.state.routes || [], fav.menuId)
      const target = route?.children?.length ? firstPage(route) : route
      return {
        key: fav.favoriteId || fav.menuId || `fav-${index}`,
        name: String(route?.meta?.title || fav.name || '未命名菜单'),
        icon: quickIcons[index % quickIcons.length],
        tone: quickTones[index % quickTones.length],
        target,
        url: fav.url
      }
    })
)
const quickEntries = computed(() => allQuickEntries.value.slice(0, QUICK_LIMIT))
const quickAllVisible = ref(false)
const openEntry = (entry: QuickEntry) => {
  if (entry.target) {
    if (entry.target.meta?.isNewPage && entry.target.meta.url) window.open(String(entry.target.meta.url), '_blank', 'noopener,noreferrer')
    else router.push(entry.target.path)
    return
  }
  if (!entry.url) return
  if (/^https?:/i.test(entry.url)) window.open(entry.url, '_blank', 'noopener,noreferrer')
  else router.push(entry.url).catch(() => ElMessage.warning(`${entry.name}：菜单暂未开放`))
}
const openQuickFromAll = (entry: QuickEntry) => {
  quickAllVisible.value = false
  openEntry(entry)
}

const manuals = ref<Manual[]>([])
const notices = ref<Notice[]>([])
const todos = ref<Todo[]>([])
// 分页状态与待办事宜页一致（ProTable/Pagination）：服务端分页，每页条数可切换
const todoPageable = reactive({ current: 1, size: 20, total: 0 })
const manualState = reactive({ loading: false, error: false })
const noticeState = reactive({ loading: false, error: false })
const todoState = reactive({ loading: false, error: false })
// 卡片内固定展示 5 条，超出部分收进「更多」弹窗（与快捷入口一致）
const MANUAL_LIMIT = 5
const visibleManuals = computed(() => manuals.value.slice(0, MANUAL_LIMIT))
const manualAllVisible = ref(false)
const downloading = ref('')
const selectedNotice = ref<Notice | null>(null)
const noticeListVisible = ref(false)
const noticeList = ref<Notice[]>([])
const noticeListTotal = ref(0)
const noticePage = ref(1)
const noticeListState = reactive({ loading: false, error: false })
const todoVisible = ref(false)
const todoUrl = ref('')
const todoFrame = ref<HTMLIFrameElement>()

const loadManuals = async () => {
  manualState.loading = true
  manualState.error = false
  try {
    const menu = await getMenuMessage('/mainPage')
    if (!menu.success) throw new Error(menu.msg)
    if (!menu.data?.id) {
      manuals.value = []
      return
    }
    // 附件状态与系统公告一致，固定取 1、3（数字数组）
    const [config, files] = await Promise.all([getConfigByMenuId(menu.data.id), listFj(menu.data.id, { statusList: [1, 3] })])
    if (!config.success || !files.success) throw new Error('用户手册加载失败')
    manuals.value = config.data?.status === '1' && Array.isArray(files.data) ? files.data : []
  } catch {
    manualState.error = true
  } finally {
    manualState.loading = false
  }
}
const openManuals = () => {
  manualAllVisible.value = true
}
const fileType = (name: string) => (name.split('.').pop() || 'FILE').toUpperCase().slice(0, 4)
const downloadManual = async (manual: Manual) => {
  if (downloading.value) return
  downloading.value = manual.uuid
  try {
    const blob = (await downloadFj({ fileName: encodeURIComponent(manual.fjmc), uuid: encodeURIComponent(manual.uuid) })) as unknown as Blob
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = manual.fjmc
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch {
    ElMessage.error('用户手册下载失败，请重试')
  } finally {
    downloading.value = ''
  }
}
// 批量下载：逐个触发，避免并发下载过多文件（与帮助中心弹窗一致）
const downloadAllManuals = async () => {
  if (downloading.value || !manuals.value.length) return
  for (const manual of manuals.value) {
    await downloadManual(manual)
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
}
const loadNotices = async () => {
  noticeState.loading = true
  noticeState.error = false
  try {
    const res = await versionNoticePage({ page: 1, limit: 5, statusList: [1, 3] })
    if (!res.success) throw new Error(res.msg)
    notices.value = res.data?.records || []
  } catch {
    noticeState.error = true
  } finally {
    noticeState.loading = false
  }
}
let noticeListRequest = 0
const loadNoticeList = async (page = 1) => {
  const request = ++noticeListRequest
  noticePage.value = page
  noticeListState.loading = true
  noticeListState.error = false
  try {
    const res = await versionNoticePage({ page, limit: 10, statusList: [1, 3] })
    if (request !== noticeListRequest) return
    if (!res.success) throw new Error(res.msg)
    noticeList.value = res.data?.records || []
    noticeListTotal.value = Number(res.data?.total || 0)
  } catch {
    if (request === noticeListRequest) noticeListState.error = true
  } finally {
    if (request === noticeListRequest) noticeListState.loading = false
  }
}
const openNoticeList = () => {
  noticeListVisible.value = true
  loadNoticeList()
}
let todoRequest = 0
const loadTodos = async (page: number = todoPageable.current, size: number = todoPageable.size) => {
  const request = ++todoRequest
  todoPageable.current = page
  todoPageable.size = size
  todoState.loading = true
  todoState.error = false
  try {
    const res = await queryWorkItemsByEmployee({ type: 0, workFlowCode: '', state: 1, page, limit: size })
    if (request !== todoRequest) return
    if (!res.success) throw new Error(res.msg)
    const records = res.data?.records || []
    const total = Number(res.data?.total ?? records.length)
    // 处理完末页待办后总数变少时，回退到有效页码
    const maxPage = Math.max(1, Math.ceil(total / size))
    if (!records.length && page > maxPage) {
      loadTodos(maxPage, size)
      return
    }
    todos.value = records
    todoPageable.total = total
  } catch {
    if (request === todoRequest) todoState.error = true
  } finally {
    if (request === todoRequest) todoState.loading = false
  }
}
const handleTodoSizeChange = (size: number) => loadTodos(1, size)
const handleTodoCurrentChange = (page: number) => loadTodos(page)
const dateText = (value?: string) => value?.slice(0, 10) || ''
const plainText = (value?: string) => {
  const doc = new DOMParser().parseFromString(value || '', 'text/html')
  return doc.body.textContent || '—'
}
const todoRows = computed(() => (todoState.loading || todoState.error ? [] : todos.value))
// 查看流转过程：入口显隐与待办事宜页（todoTasks）一致（无 workflowName 不展示按钮），按流程实例ID打开跟踪窗口
const openTracking = (todo: Todo) => {
  if (!Reflect.has(todo, 'wfInstId')) {
    ElMessage.warning('暂无流转过程信息')
    return
  }
  const width = 1200
  const height = 800
  const left = (screen.width - width) / 2
  const top = (screen.height - height) / 2
  getWfTracking(todo.wfInstId).then((res: any) => {
    if (res.success) window.open(res.data, '_blank', `width=${width},height=${height},top=${top},left=${left}`)
    else ElMessage.error(res.msg)
  })
}
// 处理待办：行内按钮无选中态，缺 id 视为待办数据不完整
const openTodo = (todo: Todo) => {
  if (!Reflect.has(todo, 'id')) {
    ElMessage.warning('该待办数据不完整，请刷新后重试')
    return
  }
  // 无有效处理地址时给出提示（mock 数据 url 为空），避免打开空 iframe
  if (!todo.url) {
    ElMessage.warning('暂无可用的处理地址')
    return
  }
  try {
    const url = new URL(todo.url, window.location.href)
    if (!['http:', 'https:'].includes(url.protocol)) {
      ElMessage.warning('暂无可用的处理地址')
      return
    }
    todoUrl.value = url.href
    todoVisible.value = true
  } catch {
    ElMessage.warning('暂无可用的处理地址')
  }
}
const onTodoMessage = (event: MessageEvent) => {
  if (!todoVisible.value || event.source !== todoFrame.value?.contentWindow || event.origin !== new URL(todoUrl.value).origin) return
  if (typeof event.data !== 'string' || !event.data) return
  todoVisible.value = false
  loadTodos()
}

onMounted(() => {
  loadManuals()
  loadNotices()
  loadTodos()
  window.addEventListener('message', onTodoMessage)
})
onActivated(() => loadTodos())
onBeforeUnmount(() => {
  noticeListRequest++
  todoRequest++
  window.removeEventListener('message', onTodoMessage)
})
</script>

<style scoped src="../styles/home-glass.css"></style>

<style>
/* 系统公告弹窗（vxe-modal）：与首页玻璃风卡片同一套设计语言
   transfer 到 body 后 vxe/el 内部结构拿不到 scoped 属性，整体放全局块 */
.home-notice-modal,
.home-manual-modal {
  max-width: 94vw;
}
.home-notice-modal .vxe-modal--box,
.home-quick-modal .vxe-modal--box,
.home-manual-modal .vxe-modal--box {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid #e3efec;
  border-radius: 12px;
  box-shadow: 0 30px 70px -32px rgba(11, 94, 89, 0.45);
}
/* 快捷入口弹窗不设固定高度：高度随收藏数量，超出时 .quick-all 内部滚动 */
.home-quick-modal .vxe-modal--box {
  height: auto;
  max-width: 94vw;
}
.home-quick-modal .vxe-modal--content {
  padding: 0;
}
/* 固定高度：列表区弹性填充并内部滚动，底部始终贴底 */
.home-notice-modal .vxe-modal--body,
.home-manual-modal .vxe-modal--body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
/* 头部：图标徽章 + 标题 + 数量副标，右侧保留 vxe 关闭按钮 */
.home-notice-modal .vxe-modal--header,
.home-quick-modal .vxe-modal--header,
.home-manual-modal .vxe-modal--header {
  display: flex;
  align-items: center;
  padding: 14px 16px 13px 20px;
  background: linear-gradient(180deg, #ffffff, #f7fcfb);
  border-bottom: 1px solid #eef2f4;
}
.home-notice-modal .vxe-modal--header-title,
.home-quick-modal .vxe-modal--header-title,
.home-manual-modal .vxe-modal--header-title {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
}
.hnm-head {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}
.hnm-head-icon {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  color: #f2545b;
  background: #fdeceb;
  border-radius: 9px;
}
.hnm-head-icon.is-teal {
  color: #0f9d8f;
  background: #ddf8f2;
}
.hnm-head-icon .d-ico {
  width: 19px;
  height: 19px;
}
.hnm-head-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.hnm-title {
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.3px;
  line-height: 1.25;
}
.hnm-sub {
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.3;
}
.home-notice-modal .vxe-modal--close-btn,
.home-quick-modal .vxe-modal--close-btn,
.home-manual-modal .vxe-modal--close-btn {
  color: #94a3b8;
}
.home-notice-modal .vxe-modal--close-btn:hover {
  color: #f2545b;
}
.home-quick-modal .vxe-modal--close-btn:hover,
.home-manual-modal .vxe-modal--close-btn:hover {
  color: #0f9d8f;
}
/* 列表区：填满固定高度内的剩余空间，内部滚动 */
.hnm-list-wrap {
  flex: 1;
  min-height: 0;
  padding: 6px 10px 8px;
  overflow-y: auto;
}
.notice-list-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  color: #94a3b8;
  font-size: 13px;
}
.notice-dialog-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.notice-dialog-list li + li {
  margin-top: 2px;
}
.notice-dialog-list button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 12px;
  color: #334155;
  font: inherit;
  text-align: left;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.16s, border-color 0.16s;
}
.notice-dialog-list button:hover {
  background: #f6fbfa;
  border-color: #d8efe9;
}
.notice-dialog-list button:hover .hnm-item-title {
  color: #0f9d8f;
}
.notice-dialog-list button:hover .hnm-item-date {
  color: #0f9d8f;
}
.notice-dialog-list button:focus-visible {
  outline: 2px solid #0f9d8f;
  outline-offset: 2px;
}
.notice-dialog-list .notice-dot {
  flex: 0 0 6px;
  width: 6px;
  height: 6px;
}
.hnm-item-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.16s;
}
.hnm-item-date {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
/* 底部：分页居中，选中页用首页青绿主色 */
.home-notice-modal .vxe-modal--footer {
  display: flex;
  justify-content: center;
  padding: 10px 16px 14px;
  background: #fbfdfd;
  border-top: 1px solid #eef2f4;
}
.home-notice-modal .el-pager li.active {
  color: #fff;
  background: #0f9d8f;
}
.hnm-all-shown {
  color: #94a3b8;
  font-size: 12px;
}
/* 用户手册弹窗：底部左侧数量、右侧批量下载 */
.home-manual-modal .vxe-modal--footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px 14px;
  background: #fbfdfd;
  border-top: 1px solid #eef2f4;
}
.home-manual-modal .hmm-foot {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.home-manual-modal .dash-action {
  display: inline-flex;
  align-items: center;
  padding: 0;
  color: #0f9d8f;
  font-size: 12.5px;
  font-weight: 500;
  background: none;
  border: 0;
  cursor: pointer;
}
.home-manual-modal .dash-action:hover {
  color: #0b857a;
}
.home-manual-modal .dash-action:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}
/* 弹窗内的文件类型标签沿用卡片配色，需在全局块补齐 */
.home-manual-modal .doc-tag {
  display: grid;
  place-items: center;
  flex: 0 0 30px;
  width: 30px;
  height: 32px;
  color: #fff;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.2px;
  border-radius: 5px;
}
.home-manual-modal .doc-tag--pdf {
  background: linear-gradient(180deg, #f4666a, #e94b4b);
}
.home-manual-modal .doc-tag--doc {
  background: linear-gradient(180deg, #5a9cf8, #3b82f6);
}
/* 首页待办表格：沿用 vxe-table，但按首页卡片视觉微调 */
.home-dashboard .todo-vxe {
  --vxe-table-border-color: #ebeef5;
  --vxe-table-row-hover-background-color: #fafdfc;
  --vxe-table-row-hover-current-background-color: #fafdfc;
  font-size: 12.5px;
}
.home-dashboard .todo-vxe .vxe-table--main-wrapper,
.home-dashboard .todo-vxe .vxe-table--header-wrapper {
  border-radius: 6px;
}
.home-dashboard .todo-vxe th {
  text-align: center;
}
.home-dashboard .todo-vxe td:first-child {
  padding-left: 16px;
}
</style>
