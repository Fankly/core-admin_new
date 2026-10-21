<template>
  <vxe-modal
    :loading="loading"
    position="center"
    show-footer
    v-model="dialogVisible"
    :show-close="false"
    title="发现有多个角色，请选择一个进入"
    width="600"
    height="400"
    @close="handleClose"
  >
    <el-radio-group class="role-radio-group" v-model="selectedRoleId" :disabled="loading">
      <el-radio v-for="item in roleList" :value="item.id" :label="item.name" :key="item.id" @change="handleRoleChange(item)"> </el-radio>
    </el-radio-group>
    <template #footer>
      <div style="text-align: center">
        <el-button plain @click="cancel">取消</el-button>
        <el-button plain type="primary" :loading="loading" @click="confirmRole">确定</el-button>
      </div>
    </template>
  </vxe-modal>
  <slot v-if="canRender" />
</template>

<script setup lang="ts">
import { useMenuStore, useSessionStore, useShellStore, useTabsStore } from '@/store'
import { useRoute, useRouter } from 'vue-router'
import { inject, onActivated, onDeactivated, onUnmounted, provide, reactive, ref } from 'vue'
import type { UserInfo } from '@/components/UserRoleSelector/interface'
import { CurrentUserRoleInjectionKey, PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import { getButtonList, getRoleByBusicode } from '@/api/permission'
import { ElMessage } from 'element-plus'
import { getMenuMessage } from '@/api/process'
import { handleError } from '@/utils/error'

defineOptions({ name: 'UserRoleSelector' })

const menu = useMenuStore()
const session = useSessionStore()
const shell = useShellStore()
const tabs = useTabsStore()
const route = useRoute()
const router = useRouter()
const emit = defineEmits<{ (e: 'loadCompany'): void }>()

const dialogVisible = ref(false)
const canRender = ref(false)
const selectedRoleId = ref('')
const roleList = ref<UserInfo[]>([])
const loading = ref(false)
const currentMenuId = ref('')
const injectedRole = inject(CurrentUserRoleInjectionKey)
if (!injectedRole) throw new Error('UserRoleSelector 需要通过 CurrentUserRoleInjectionKey 提供当前角色')
const currentUserRole = injectedRole
let isActive = true
let isDisposed = false

const permissions = ref<string[]>([])
provide(PermissionInjectionKey, reactive({ permissions, isLoading: loading }))

onDeactivated(() => {
  isActive = false
})
onUnmounted(() => {
  isActive = false
  isDisposed = true
})

// 权限没取到时必须连 store 一起清空，否则页面会继续用上一个菜单残留的权限渲染
const resetPermissions = () => {
  permissions.value = []
  canRender.value = false
  if (isActive) session.setPermissions([])
}

const handleNoPermission = () => {
  resetPermissions()
  if (!isActive) return
  ElMessage({
    message: '无权限访问页面',
    customClass: 'tipsBox'
  })
  if (menu.menuMsg.url === '/home') {
    shell.setMainPageRole(false)
  }
  tabs.closeTab(tabs.activePath)
  router.replace('/home')
}

const handleNoMenuId = () => {
  resetPermissions()
  if (!isActive) return
  ElMessage({
    type: 'error',
    message: '当前菜单未绑定ID'
  })
  const target = tabs.tabs.find((tab) => tab.path === route.path)
  if (target) tabs.closeTab(target.path)
  router.back()
}

const setCurrentUserRole = (roleData: UserInfo) => {
  currentUserRole.value.bmId = roleData.specialorgid
  currentUserRole.value.bmName = roleData.specialorgname
  currentUserRole.value.dwId = roleData.org_id
  currentUserRole.value.dwName = roleData.org_name
  currentUserRole.value.specialOrgCode = roleData.specialorgcode
  currentUserRole.value.roleId = roleData.role_id
  currentUserRole.value.roleCode = roleData.code
  currentUserRole.value.spRoleId = roleData.id
}

const resolveCurrentMenuId = async () => {
  const menuUrl = String(route.meta.url || route.path || menu.menuMsg.url || '')
  if (!menuUrl) return ''

  // 菜单信息在路由守卫里已经从 routeToMeta 提交进 menuMsg，命中缓存就不必再问一次后端
  const routeMenu = menu.routeToMeta[route.path] || route.meta
  const currentMenu = menu.menuMsg
  const cachedMenuId = routeMenu?.outsideMenu || (currentMenu?.url === menuUrl ? currentMenu.outsideMenu : '')
  if (cachedMenuId) return String(cachedMenuId)

  // 缓存里没有（如直接进外链页、菜单树尚未合并）才回退到接口
  const result = await getMenuMessage(menuUrl)
  if (result.success && result.data?.outsideMenu) {
    if (isActive && !isDisposed) menu.setMenuMessage({ ...result.data, url: menuUrl })
    return String(result.data.outsideMenu)
  }

  return ''
}

const getUser = async () => {
  // 页面可能在 onMounted 与 onActivated 里各调一次，重入会打出两轮请求并让后到的响应覆盖前一个
  if (loading.value || isDisposed) return
  loading.value = true
  resetPermissions()
  try {
    const userId = session.user.id
    currentMenuId.value = await resolveCurrentMenuId()
    if (isDisposed) return
    if (!currentMenuId.value) {
      handleNoMenuId()
      return
    }
    // 该接口直接返回数组，失败时不是数组，不能拿 length 判空（否则会落到「多角色」分支弹出空选择框）
    const roles = await getRoleByBusicode(userId, currentMenuId.value)
    if (isDisposed) return
    if (!Array.isArray(roles)) {
      resetPermissions()
      ElMessage.error('获取角色失败，请稍后重试')
      return
    }

    if (roles.length === 1) {
      setCurrentUserRole(roles[0])
      await confirmRole()
    } else if (roles.length === 0) {
      handleNoPermission()
    } else {
      selectedRoleId.value = ''
      roleList.value = roles
      dialogVisible.value = true
    }
  } catch (e) {
    if (isDisposed) return
    resetPermissions()
    if (isActive) handleError(e, '获取角色失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const confirmRole = async () => {
  if (isDisposed) return
  if (!currentUserRole.value?.bmId || (dialogVisible.value && !selectedRoleId.value)) {
    ElMessage({
      message: '请选择角色再确定',
      customClass: 'tipsBox'
    })
    return
  }

  const isReentry = loading.value
  loading.value = true
  try {
    const res = await getButtonList(currentMenuId.value, currentUserRole.value.spRoleId)
    if (isDisposed) return
    if (res.success && Array.isArray(res.data)) {
      permissions.value = res.data
      // v-permission 指令读 session.permissions，必须同步提交，否则页面读到上一个菜单残留的权限
      if (isActive) session.setPermissions(permissions.value)
      canRender.value = true
      emit('loadCompany')
      dialogVisible.value = false
    } else {
      resetPermissions()
      if (isActive) handleError(new Error(res.msg || '权限响应格式错误'), '获取按钮权限失败')
    }
  } catch (e) {
    if (isDisposed) return
    resetPermissions()
    if (isActive) handleError(e, '获取按钮权限失败')
  } finally {
    // getUser 内部调用时由 getUser 统一收尾，避免提前解锁
    if (!isReentry) loading.value = false
  }
}

// keep-alive 缓存页返回时组件不会重新 mounted，但 session.permissions 可能已被别的页面覆盖，
// 这里把本页已取到的权限重新提交回去，无需再发请求
// 判断依据只能是 canRender（权限已取到），不能用 permissions.length —— 零权限角色也是合法结果
onActivated(() => {
  isActive = true
  if (canRender.value) {
    session.setPermissions([...permissions.value])
  }
})

const cancel = () => {
  tabs.closeTab(tabs.activePath)
  router.back()
}

const handleClose = cancel

const handleRoleChange = setCurrentUserRole

// confirmRole 已取过按钮权限，这里直接返回缓存结果，不再重复请求
const getButtonPermissions = (): string[] => [...permissions.value]

defineExpose({
  loading,
  getUser,
  getButtonPermissions,
  currentUserRole,
  canRender,
  permissions
})
</script>

<style scoped lang="less">
.role-radio-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
