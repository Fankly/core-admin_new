<template>
  <div class="rr-header-right-items">
    <CustomerService :phone="customerMsg.phone" :email="customerMsg.email" />
    <div @click="toggle">
      <span>
        <svg-icon :name="isFullscreen ? 'tuichuquanping' : 'fullscreen2'"></svg-icon>
      </span>
    </div>
    <div class="logout-name">
      <span>
        {{ userName }}
      </span>
    </div>
    <setting-sidebar></setting-sidebar>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useFullscreen } from '@vueuse/core'
import { getParamValueMulti } from '@/api/common'
import CustomerService from '@/layout/header/CustomerService.vue'
import SettingSidebar from '../setting/index.vue'
import SvgIcon from '@/components/base/svg-icon'
import '@/assets/css/header.less'

/**
 * 顶部右侧扩展区域
 */
defineOptions({ name: 'Expand' })

interface Props {
  userName?: string
}
defineProps<Props>()

const { isFullscreen, toggle } = useFullscreen()
const customerMsg = reactive({
  phone: '',
  email: ''
})

const initParams = async () => {
  try {
    const res = await getParamValueMulti(['SYS_TEL', 'SYS_MAIL'])
    if (res.success && res.data) {
      customerMsg.phone = res.data['SYS_TEL'] || ''
      customerMsg.email = res.data['SYS_MAIL'] || ''
    }
  } catch (error) {
    customerMsg.phone = ''
    customerMsg.email = ''
  }
}

onMounted(() => {
  initParams()
})
</script>
<style scoped>
.logout-name {
  line-height: 50px !important;
}

:deep(.iconfont) {
  vertical-align: baseline;
}
</style>
