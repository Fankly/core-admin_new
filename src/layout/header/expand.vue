<template>
  <div class="rr-masthead__actions">
    <div class="rr-masthead__support hidden-xs-only">
      <CustomerService :phone="customerMsg.phone" :email="customerMsg.email" />
    </div>
    <button
      class="rr-masthead__btn"
      type="button"
      :aria-label="isFullscreen ? '退出全屏' : '进入全屏'"
      :title="isFullscreen ? '退出全屏' : '进入全屏'"
      @click="toggle"
    >
      <Minimize2 v-if="isFullscreen" :size="16" :stroke-width="1.8" aria-hidden="true" />
      <Maximize2 v-else :size="16" :stroke-width="1.8" aria-hidden="true" />
    </button>
    <setting-sidebar></setting-sidebar>
    <el-dropdown
      v-if="hasSystemMenu"
      :ref="setDropdownRef"
      trigger="click"
      placement="bottom-end"
      class="rr-masthead__user-wrap"
      @visible-change="onDropdownVisibleChange"
    >
      <button
        :class="['rr-masthead__user', { 'is-open': dropdownOpen }]"
        type="button"
        :title="userTitle"
        :aria-label="`${displayName}，${SYSTEM_MENU_TITLE}`"
        aria-haspopup="true"
        :aria-expanded="dropdownOpen"
      >
        <span class="rr-masthead__avatar" aria-hidden="true">{{ initial }}</span>
        <span class="rr-masthead__username">{{ displayName }}</span>
        <ChevronDown class="rr-masthead__chevron" :size="13" :stroke-width="2" aria-hidden="true" />
      </button>
      <template #dropdown>
        <user-menu-panel :items="systemMenus" :visible="dropdownOpen" @close="closeDropdown"></user-menu-panel>
      </template>
    </el-dropdown>
    <div v-else class="rr-masthead__user rr-masthead__user--static" :title="userTitle">
      <span class="rr-masthead__avatar" aria-hidden="true">{{ initial }}</span>
      <span class="rr-masthead__username">{{ displayName }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import CustomerService from '@/layout/header/CustomerService.vue'
import baseService from '@/service/baseService'
import { useFullscreen } from '@vueuse/core'
import { ChevronDown, Maximize2, Minimize2 } from 'lucide-vue-next'
import { computed, defineComponent, ref, reactive, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import SettingSidebar from '../setting/index.vue'
import UserMenuPanel from './user-menu-panel.vue'
import { buildSystemMenuItems, findSystemMenuRoutes, SYSTEM_MENU_TITLE } from '@/utils/menu'
import userLogo from '@/assets/images/user.png'
import '@/assets/css/header.less'
import { ElMessageBox } from 'element-plus'
import { getParamValueMulti } from '@/api/common'

interface IExpand {
  userName?: string
}

/**
 * 顶部右侧扩展区域
 */
export default defineComponent({
  name: 'Expand',
  components: { SettingSidebar, CustomerService, ChevronDown, Maximize2, Minimize2, UserMenuPanel },
  props: {
    userName: String
  },
  setup(props: IExpand) {
    const router = useRouter()
    const store = useStore()
    const { isFullscreen, toggle } = useFullscreen()
    const messageCount = ref(0)
    const customerMsg = reactive({
      phone: '',
      email: ''
    })

    const onClickUserMenus = (path: string) => {
      if (path === '/login') {
        let str = window.location.href
        let index = str.indexOf('?')
        let url = str.substring(0, index)
        ElMessageBox.confirm('确定进行[删除]操作?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            baseService.get(`/sys/logout?redirUrl=${url}`).then((res) => {
              if (res.success) {
                console.log('已清空cookie')
                location.href = res.data
              } else {
                console.log(res.success)
              }
            })
          })
          .catch(() => {
            //
          })
      } else {
        location.href = '/budget-process'
      }
    }
    const onClickMessage = () => {
      router.push('/notice/notice-user')
    }

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

    // 头像取姓名首字；下拉里只放系统管理，账号与域放到悬停提示里，字段缺失时不拼接
    const displayName = computed(() => props.userName || store.state.user.name || '当前用户')
    const initial = computed(() => displayName.value.slice(0, 1).toUpperCase())
    const account = computed(() => [store.state.user.namecode, store.state.user.domainName].filter(Boolean).join(' · '))
    const userTitle = computed(() => [displayName.value, account.value].filter(Boolean).join('\n'))

    // 只有菜单名称匹配「系统管理」时才显示头像下拉，保留服务端的菜单层级。
    const systemMenuRoutes = computed(() => findSystemMenuRoutes(store.state.routes || []))
    const hasSystemMenu = computed(() => systemMenuRoutes.value.length > 0)
    const systemMenus = computed(() => buildSystemMenuItems(systemMenuRoutes.value))

    // el-dropdown（element-plus 1.0.x）在 manual-mode 下不监听外部点击，这里自行补上：点击面板与触发按钮以外的区域即关闭
    let dropdownInstance: any = null
    let listeningOutside = false
    const dropdownOpen = ref(false)

    const setDropdownRef = (instance: any) => {
      dropdownInstance = instance
      if (instance) return
      dropdownOpen.value = false
      stopListeningOutside()
    }

    // 触发按钮在 .rr-masthead__user-wrap 内，面板被 teleport 到 body；按面板所在的浮层判断，滚动条等浮层自身区域也视为内部
    const isInsideDropdown = (target: Node): boolean => {
      if (!(target instanceof Element)) return false
      if (target.closest('.rr-masthead__user-wrap')) return true
      const ownPopper = document.querySelector('.rr-masthead-user-panel')?.closest('.el-dropdown__popper')
      return !!ownPopper?.contains(target)
    }

    // 关闭时优先走 el-dropdown 自身的 hide（内部会复位 tabindex），拿不到时直接改 visible
    const closeDropdown = () => {
      const instance = dropdownInstance
      if (!instance) return
      const internalHide = instance.$?.hide
      if (typeof internalHide === 'function') internalHide.call(instance.$)
      else instance.visible = false
    }

    const onDocumentPointerDown = (event: Event) => {
      const target = event.target as Node | null
      if (!target || isInsideDropdown(target)) return
      closeDropdown()
    }

    // 打开后焦点停在触发按钮上（不在面板里），Esc 也要能收起
    const onDocumentKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDropdown()
    }

    const stopListeningOutside = () => {
      if (!listeningOutside) return
      document.removeEventListener('mousedown', onDocumentPointerDown, true)
      document.removeEventListener('touchstart', onDocumentPointerDown, true)
      document.removeEventListener('keydown', onDocumentKeydown)
      listeningOutside = false
    }

    const onDropdownVisibleChange = (visible: boolean) => {
      dropdownOpen.value = visible
      if (!visible) {
        stopListeningOutside()
        return
      }
      if (listeningOutside) return
      document.addEventListener('mousedown', onDocumentPointerDown, true)
      document.addEventListener('touchstart', onDocumentPointerDown, true)
      document.addEventListener('keydown', onDocumentKeydown)
      listeningOutside = true
    }

    onBeforeUnmount(stopListeningOutside)

    return reactive({
      props,
      customerMsg,
      store,
      isFullscreen,
      messageCount,
      userLogo,
      displayName,
      initial,
      userTitle,
      hasSystemMenu,
      systemMenus,
      dropdownOpen,
      SYSTEM_MENU_TITLE,
      setDropdownRef,
      closeDropdown,
      onDropdownVisibleChange,
      onClickUserMenus,
      onClickMessage,
      toggle
    })
  }
})
</script>
