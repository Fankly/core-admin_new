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

    <div class="ds-user" :title="displayName">
      <span class="ds-user__avatar" aria-hidden="true">{{ initial }}</span>
      <div>
        <span class="ds-user__name">{{ displayName }}</span>
        <span class="ds-user__role">已登录</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { Maximize2, Minimize2 } from '@lucide/vue'
import { useFullscreen } from '@vueuse/core'
import { getParamValueMulti } from '@/api/common'
import { useSessionStore } from '@/store'
import CustomerService from './CustomerService.vue'
import SettingSidebar from '../settings/index.vue'

defineOptions({ name: 'HeaderActions' })

const session = useSessionStore()
const { isFullscreen, toggle } = useFullscreen()
const customer = reactive({ phone: '', email: '' })

const displayName = computed(() => session.user.fullName || session.userName || '当前用户')
const initial = computed(() => displayName.value.slice(0, 1).toUpperCase())

const toggleFullscreen = () => {
  void toggle()
}

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
