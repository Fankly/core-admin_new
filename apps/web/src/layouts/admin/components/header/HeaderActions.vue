<template>
  <div class="ds-header__actions">
    <div class="ds-header__support">
      <CustomerService :phone="customer.phone" :email="customer.email" />
    </div>

    <button
      class="ds-icon-button"
      type="button"
      :aria-label="isFullscreen ? '退出全屏' : '进入全屏'"
      :title="isFullscreen ? '退出全屏' : '进入全屏'"
      @click="toggleFullscreen"
    >
      <Minimize2 v-if="isFullscreen" :size="16" :stroke-width="1.8" aria-hidden="true" />
      <Maximize2 v-else :size="16" :stroke-width="1.8" aria-hidden="true" />
    </button>

    <SettingSidebar />

    <div ref="userWrap" class="ds-user-wrap">
      <button
        v-if="hasSystemMenu"
        ref="userTrigger"
        class="ds-user"
        :class="{ 'is-open': userMenuOpen }"
        type="button"
        :title="userTitle"
        :aria-label="`${displayName}，${SYSTEM_MENU_TITLE}`"
        aria-controls="ds-user-menu"
        :aria-expanded="userMenuOpen"
        @click="toggleUserMenu"
      >
        <span class="ds-user__avatar" aria-hidden="true">{{ initial }}</span>
        <span class="ds-user__name">{{ displayName }}</span>
        <ChevronDown class="ds-user__chevron" :size="13" :stroke-width="2" aria-hidden="true" />
      </button>

      <!-- 没有「系统管理」菜单时退化为静态信息，不显示展开箭头和下拉 -->
      <div v-else class="ds-user ds-user--static" :title="userTitle">
        <span class="ds-user__avatar" aria-hidden="true">{{ initial }}</span>
        <span class="ds-user__name">{{ displayName }}</span>
      </div>

      <Transition name="ds-user-menu">
        <UserMenuPanel v-if="userMenuOpen" id="ds-user-menu" :items="systemMenus" @close="closeUserMenu" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventListener, useFullscreen } from '@vueuse/core'
import { ChevronDown, Maximize2, Minimize2 } from '@lucide/vue'
import { getParamValueMulti } from '@/api/common'
import { useMenuStore, useSessionStore } from '@/store'
import { SYSTEM_MENU_TITLE, buildSystemMenuItems } from '@/utils/menu'
import CustomerService from './CustomerService.vue'
import SettingSidebar from '../settings/index.vue'
import UserMenuPanel from './UserMenuPanel.vue'

defineOptions({ name: 'HeaderActions' })

const route = useRoute()
const session = useSessionStore()
const menuStore = useMenuStore()
const { isFullscreen, toggle } = useFullscreen()
const customer = reactive({ phone: '', email: '' })
const userMenuOpen = ref(false)
const userWrap = ref<HTMLElement | null>(null)
const userTrigger = ref<HTMLButtonElement | null>(null)

// 名称取会话里的 user.name，与参考实现一致；fullName 只用于工作台等页面的展示。
const displayName = computed(() => session.userName || '当前用户')
const initial = computed(() => displayName.value.slice(0, 1).toUpperCase())
const namecode = computed(() => {
  const value = session.user.namecode
  return typeof value === 'string' ? value : ''
})
const account = computed(() => [namecode.value, session.user.domainName].filter(Boolean).join(' · '))
// 账号与域只进悬停提示，字段缺失时不拼接
const userTitle = computed(() => [displayName.value, account.value].filter(Boolean).join('\n'))

// 只有菜单名称匹配「系统管理」时才显示头像下拉，保留服务端的菜单层级。
const systemMenus = computed(() => buildSystemMenuItems(menuStore.routes))
const hasSystemMenu = computed(() => systemMenus.value.length > 0)

const toggleFullscreen = () => {
  void toggle()
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

// 点击面板与触发按钮以外的区域收起；面板是导航链接，点链接由面板自己先发 close
useEventListener(document, 'pointerdown', (event: PointerEvent) => {
  if (!userMenuOpen.value) return
  const target = event.target
  if (target instanceof Node && userWrap.value?.contains(target)) return
  closeUserMenu()
})

// 焦点停在触发按钮时（打开后未进入面板），Esc 也要能收起并回到按钮
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !userMenuOpen.value) return
  closeUserMenu()
  userTrigger.value?.focus()
})

// 路由变化（页签、面包屑等）时收起，避免浮层停留在旧页面的上下文里
watch(
  () => route.path,
  () => {
    closeUserMenu()
  }
)

const loadSupportContact = async () => {
  try {
    const res = await getParamValueMulti(['SYS_TEL', 'SYS_MAIL'])
    const data = res.data as Record<string, string> | null
    if (res.success && data) {
      customer.phone = data['SYS_TEL'] || ''
      customer.email = data['SYS_MAIL'] || ''
    }
  } catch {
    customer.phone = ''
    customer.email = ''
  }
}

onMounted(() => {
  void loadSupportContact()
})
</script>
