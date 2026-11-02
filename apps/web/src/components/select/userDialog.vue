<template>
  <div class="userDiaTem">
    <el-alert v-if="loadError" :title="loadError" type="error" show-icon :closable="false">
      <el-button :loading="loading" @click="getUser">重新加载页面权限</el-button>
    </el-alert>
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
      <el-radio-group class="role-radio-group" v-model="resource">
        <el-radio
          v-for="item in list"
          :key="item.id"
          :name="item.id"
          :value="item.id"
          @change="changeId(item.specialorgid, item.code, item.id, item)"
        >
          {{ item.name }}
        </el-radio>
      </el-radio-group>
      <template #footer>
        <div style="text-align: center">
          <el-button plain @click="cancel">取消</el-button>
          <el-button plain type="primary" @click="determine">确定</el-button>
        </div>
      </template>
    </vxe-modal>
  </div>
</template>

<script setup>
import { UserFilled as EpUserFilled } from '@element-plus/icons-vue'
import { reactive, toRef, onActivated } from 'vue'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import { useStore } from '@/store/business'
import { useTabsStore } from '@/store'
import { getMenuMessage } from '@/api/process'
import emits from '@/utils/emits'
import { useRoute, useRouter } from 'vue-router'
const emit = defineEmits()
const route = useRoute()
const router = useRouter()
const store = useStore()
const tabs = useTabsStore()
const setupState = reactive({
  dialogVisible: false,
  isQuery: false,
  resource: '',
  list: [],
  specialorgid: '',
  roleCode: '',
  store,
  closeCurrentTab: () => tabs.closeCurrent(),
  loading: false,
  loadError: '',
  spRoleId: '',
  menuId: '',
  btnPermissions: [],
  userMsg: {},
  menuInfo: {}
})
const dialogVisible = toRef(setupState, 'dialogVisible')
const isQuery = toRef(setupState, 'isQuery')
const resource = toRef(setupState, 'resource')
const list = toRef(setupState, 'list')
const specialorgid = toRef(setupState, 'specialorgid')
const roleCode = toRef(setupState, 'roleCode')
const closeCurrentTab = toRef(setupState, 'closeCurrentTab')
const loading = toRef(setupState, 'loading')
const loadError = toRef(setupState, 'loadError')
const spRoleId = toRef(setupState, 'spRoleId')
const menuId = toRef(setupState, 'menuId')
const btnPermissions = toRef(setupState, 'btnPermissions')
const userMsg = toRef(setupState, 'userMsg')
const menuInfo = toRef(setupState, 'menuInfo')
// 权限没取到时必须连 store 一起清空，否则页面会继续用上一个菜单残留的权限渲染
function resetPermissions() {
  setupState.btnPermissions = []
  setupState.isQuery = false
  setupState.store.commit('setPermissions', [])
}
async function getUser() {
  // 页面可能在 mounted 与 activated 里各调一次，重入会打出两轮请求并让后到的响应覆盖前一个
  if (setupState.loading) return
  setupState.loading = true
  setupState.loadError = ''
  try {
    await doGetUser()
  } catch (e) {
    resetPermissions()
    setupState.loadError = e?.message || '获取角色失败，请稍后重试'
    ElMessage.error(setupState.loadError)
  } finally {
    setupState.loading = false
  }
}
async function doGetUser() {
  // 请求接口
  const userId = setupState.store.getters.getUserMsg.id
  const url = setupState.store.getters.getMenuMsg.url
  const result = await getMenuMessage(url)
  if (!result.success || !result.data) {
    // 原来这里没有 else 分支：菜单信息取不到时既不提示也不结束 loading，弹窗会一直转
    resetPermissions()
    setupState.loadError = result.msg || '获取菜单信息失败，请稍后重试'
    ElMessage.error(setupState.loadError)
    return
  }
  setupState.menuInfo = {
    ...result.data
  }
  const code = result.data.outsideMenu
  setupState.menuId = code
  if (!code) {
    resetPermissions()
    ElMessage({
      type: 'error',
      message: '当前菜单未绑定ID'
    })
    setupState.closeCurrentTab()
    router.back()
    return
  }
  const res = await baseService.get(`/getRoleByBusicode?userId=${userId}&busicode=${code}`)
  // 该接口直接返回数组，失败时不是数组，不能拿 length 判空（否则会落到「多角色」分支弹出空选择框）
  if (!Array.isArray(res)) {
    resetPermissions()
    setupState.loadError = '获取角色失败，请稍后重试'
    ElMessage.error(setupState.loadError)
    return
  }
  // 携带 spRoleId 跳转时（由 smartTaskAudit / workbenchView 发起）：
  // 在目标菜单的角色列表中比对，命中则直接用该角色进入，不弹选择弹窗
  const pendingSpRoleId = route?.query?.spRoleId
  if (pendingSpRoleId && res.length >= 1) {
    const matched = res.find((r) => String(r.id) === String(pendingSpRoleId))
    if (matched) {
      changeId(matched.specialorgid, matched.code, matched.id, matched)
      await determine()
      return
    }
    // 未命中：继续走原逻辑（1 角色自动确认 / >1 角色弹窗选择）
  }
  if (res.length == 1) {
    changeId(res[0].specialorgid, res[0].code, res[0].id, res[0])
    await determine()
  } else if (res.length == 0) {
    resetPermissions()
    ElMessage({
      message: '无权限访问页面',
      icon: EpUserFilled,
      customClass: 'tipsBox'
    })
    if (setupState.store.getters.getMenuMsg.url === '/home') {
      emits.emit('isMainPageRole', false)
    }
    setupState.closeCurrentTab()
    router.replace('/home')
  } else {
    setupState.list = res
    setupState.dialogVisible = true
  }
}
async function determine() {
  if (setupState.specialorgid === '') {
    ElMessage({
      message: '请选择角色再确定',
      icon: EpUserFilled,
      customClass: 'tipsBox'
    })
    return
  }
  // 弹窗里点确定时 loading 还是 false，异常不会被 getUser 的 catch 接住，所以这里自己兜住
  try {
    const res = await baseService.get(`/sysMenu/getButtonList?menuCode=${setupState.menuId}&spRoleId=${setupState.spRoleId}`)
    if (res.success) {
      setupState.btnPermissions = Array.isArray(res.data) ? res.data : []
      // v-permission 指令读 store.state.permissions，必须同步提交，否则页面读到上一个菜单残留的权限
      setupState.store.commit('setPermissions', setupState.btnPermissions)
      setupState.isQuery = true
      emit('loadCompany')
      setupState.dialogVisible = false
    } else {
      // 原来这里没有 else 分支：取不到按钮权限时页面会拿上一个菜单的权限继续渲染
      resetPermissions()
      setupState.loadError = res.msg || '获取按钮权限失败'
      ElMessage.error(setupState.loadError)
    }
  } catch (e) {
    resetPermissions()
    setupState.loadError = e?.message || '获取按钮权限失败'
    ElMessage.error(setupState.loadError)
  }
}
function cancel() {
  setupState.closeCurrentTab()
  router.back()
}
function changeId(id, code, spRoleId, item) {
  setupState.specialorgid = id
  setupState.roleCode = code
  setupState.spRoleId = spRoleId
  setupState.userMsg = {
    ...item
  }
}
function handleClose() {
  setupState.closeCurrentTab()
  router.back()
}
onActivated(() => {
  if (setupState.isQuery) {
    setupState.store.commit('setPermissions', [...setupState.btnPermissions])
  }
})
defineExpose({
  dialogVisible,
  isQuery,
  resource,
  list,
  specialorgid,
  roleCode,
  store,
  closeCurrentTab,
  loading,
  loadError,
  spRoleId,
  menuId,
  btnPermissions,
  userMsg,
  menuInfo,
  resetPermissions,
  getUser,
  doGetUser,
  determine,
  cancel,
  changeId,
  handleClose
})
</script>

<style scoped lang="less">
// 与 UserRoleSelector 共用同一份角色选择样式，避免两个弹窗各自漂移
@import '../UserRoleSelector/css/userRoleSelector';
</style>
