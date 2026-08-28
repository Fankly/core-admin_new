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
    <el-radio-group class="role-radio-group" v-model="selectedRoleId">
      <el-radio v-for="item in roleList" :name="item.id" :label="item.name" :key="item.id" @change="handleRoleChange(item)"> </el-radio>
    </el-radio-group>
    <template #footer>
      <div style="text-align: center">
        <el-button plain @click="cancel">取消</el-button>
        <el-button plain type="primary" @click="confirmRole">确定</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="UserRoleSelector">
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { inject, onActivated, ref, Ref } from 'vue'
import { UserInfo, UserRole } from '@/components/UserRoleSelector/interface'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import emits from '@/utils/emits'
import { getMenuMessage } from '@/api/process'

const store = useStore()
const route = useRoute()
const router = useRouter()
const emit = defineEmits(['loadCompany'])

const dialogVisible = ref(false)
const canRender = ref(false)
const selectedRoleId = ref('')
const roleList = ref<UserInfo[]>([])
const loading = ref(false)
const currentMenuId = ref('')
const currentUserRole = inject<Ref<UserRole>>('currentUserRole')!

const permissions = ref<string[]>([])

// 权限没取到时必须连 store 一起清空，否则页面会继续用上一个菜单残留的权限渲染
const resetPermissions = () => {
  permissions.value = []
  canRender.value = false
  store.commit('setPermissions', [])
}

const fetchRoleByBusicode = (userId: string, busicode: string) => {
  return baseService.get(`/getRoleByBusicode?userId=${userId}&busicode=${busicode}`)
}

const fetchButtonList = (menuCode: string, spRoleId: string) => {
  return baseService.get(`/sysMenu/getButtonList?menuCode=${menuCode}&spRoleId=${spRoleId}`)
}

const handleNoPermission = () => {
  resetPermissions()
  ElMessage({
    message: '无权限访问页面',
    iconClass: 'el-icon-user-solid',
    customClass: 'tipsBox'
  })
  if (store.getters.getMenuMsg.url === '/home') {
    emits.emit('isMainPageRole', false)
  }
  store.state.tabs.pop()
  router.replace('/home')
}

const handleNoMenuId = () => {
  resetPermissions()
  ElMessage({
    type: 'error',
    message: '当前菜单未绑定ID'
  })
  store.state.tabs.pop()
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
  const menuUrl = String(route.meta.url || route.path || store.getters.getMenuMsg.url || '')
  if (!menuUrl) return ''

  // 菜单信息在路由守卫里已经从 routeToMeta 提交进 menuMsg，命中缓存就不必再问一次后端
  const routeMenu = store.state.routeToMeta?.[route.path] || route.meta
  const currentMenu = store.getters.getMenuMsg
  const cachedMenuId = routeMenu?.outsideMenu || (currentMenu?.url === menuUrl ? currentMenu.outsideMenu : '')
  if (cachedMenuId) return String(cachedMenuId)

  // 缓存里没有（如直接进外链页、菜单树尚未合并）才回退到接口
  const result = await getMenuMessage(menuUrl)
  if (result.success && result.data?.outsideMenu) {
    store.commit('setMenuMsg', {
      ...result.data,
      url: menuUrl
    })
    return String(result.data.outsideMenu)
  }

  return ''
}

const getUser = async () => {
  // 页面可能在 onMounted 与 onActivated 里各调一次，重入会打出两轮请求并让后到的响应覆盖前一个
  if (loading.value) return
  loading.value = true
  try {
    const userId = store.getters.getUserMsg.id
    currentMenuId.value = await resolveCurrentMenuId()
    if (!currentMenuId.value) {
      handleNoMenuId()
      return
    }
    // 该接口直接返回数组，失败时不是数组，不能拿 length 判空（否则会落到「多角色」分支弹出空选择框）
    const roles = await fetchRoleByBusicode(userId, currentMenuId.value)
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
      roleList.value = roles
      dialogVisible.value = true
    }
  } catch (e) {
    resetPermissions()
    ElMessage.error((e as Error)?.message || '获取角色失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const confirmRole = async () => {
  if (!currentUserRole.value?.bmId) {
    ElMessage({
      message: '请选择角色再确定',
      iconClass: 'el-icon-user-solid',
      customClass: 'tipsBox'
    })
    return
  }

  const isReentry = loading.value
  loading.value = true
  try {
    const res = await fetchButtonList(currentMenuId.value, currentUserRole.value!.spRoleId)
    if (res.success) {
      permissions.value = Array.isArray(res.data) ? res.data : []
      // v-permission 指令读 store.state.permissions，必须同步提交，否则页面读到上一个菜单残留的权限
      store.commit('setPermissions', permissions.value)
      canRender.value = true
      emit('loadCompany')
      dialogVisible.value = false
    } else {
      resetPermissions()
      ElMessage.error(res.msg || '获取按钮权限失败')
    }
  } catch (e) {
    resetPermissions()
    ElMessage.error((e as Error)?.message || '获取按钮权限失败')
  } finally {
    // getUser 内部调用时由 getUser 统一收尾，避免提前解锁
    if (!isReentry) loading.value = false
  }
}

// keep-alive 缓存页返回时组件不会重新 mounted，但 store.state.permissions 可能已被别的页面覆盖，
// 这里把本页已取到的权限重新提交回去，无需再发请求
// 判断依据只能是 canRender（权限已取到），不能用 permissions.length —— 零权限角色也是合法结果
onActivated(() => {
  if (canRender.value) {
    store.commit('setPermissions', [...permissions.value])
  }
})

const cancel = () => {
  store.state.tabs.pop()
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
@import 'css/userRoleSelector';
</style>
