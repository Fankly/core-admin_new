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
          :label="item.id"
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

<script>
import { defineComponent, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import { useStore } from '@/store/business'
import { useTabsStore } from '@/store'
import { getMenuMessage } from '@/api/process'
import emits from '@/utils/emits'

export default defineComponent({
  setup() {
    const store = useStore()
    const tabs = useTabsStore()
    return reactive({
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
  },
  // keep-alive 缓存页返回时不会重新 mounted，但 store.state.permissions 可能已被别的页面覆盖，
  // 这里把本页已取到的权限重新提交回去，无需再发请求。
  // 判断依据是 isQuery（权限已取到），不能用 btnPermissions.length —— 零权限角色也是合法结果
  activated() {
    if (this.isQuery) {
      this.store.commit('setPermissions', [...this.btnPermissions])
    }
  },
  methods: {
    // 权限没取到时必须连 store 一起清空，否则页面会继续用上一个菜单残留的权限渲染
    resetPermissions() {
      this.btnPermissions = []
      this.isQuery = false
      this.store.commit('setPermissions', [])
    },
    async getUser() {
      // 页面可能在 mounted 与 activated 里各调一次，重入会打出两轮请求并让后到的响应覆盖前一个
      if (this.loading) return
      this.loading = true
      this.loadError = ''
      try {
        await this.doGetUser()
      } catch (e) {
        this.resetPermissions()
        this.loadError = e?.message || '获取角色失败，请稍后重试'
        ElMessage.error(this.loadError)
      } finally {
        this.loading = false
      }
    },
    async doGetUser() {
      // 请求接口
      const userId = this.store.getters.getUserMsg.id
      const url = this.store.getters.getMenuMsg.url
      const result = await getMenuMessage(url)
      if (!result.success || !result.data) {
        // 原来这里没有 else 分支：菜单信息取不到时既不提示也不结束 loading，弹窗会一直转
        this.resetPermissions()
        this.loadError = result.msg || '获取菜单信息失败，请稍后重试'
        ElMessage.error(this.loadError)
        return
      }
      this.menuInfo = { ...result.data }
      const code = result.data.outsideMenu
      this.menuId = code
      if (!code) {
        this.resetPermissions()
        ElMessage({
          type: 'error',
          message: '当前菜单未绑定ID'
        })
        this.closeCurrentTab()
        this.$router.back()
        return
      }

      const res = await baseService.get(`/getRoleByBusicode?userId=${userId}&busicode=${code}`)
      // 该接口直接返回数组，失败时不是数组，不能拿 length 判空（否则会落到「多角色」分支弹出空选择框）
      if (!Array.isArray(res)) {
        this.resetPermissions()
        this.loadError = '获取角色失败，请稍后重试'
        ElMessage.error(this.loadError)
        return
      }
      // 携带 spRoleId 跳转时（由 smartTaskAudit / workbenchView 发起）：
      // 在目标菜单的角色列表中比对，命中则直接用该角色进入，不弹选择弹窗
      const pendingSpRoleId = this.$route?.query?.spRoleId
      if (pendingSpRoleId && res.length >= 1) {
        const matched = res.find((r) => String(r.id) === String(pendingSpRoleId))
        if (matched) {
          this.changeId(matched.specialorgid, matched.code, matched.id, matched)
          await this.determine()
          return
        }
        // 未命中：继续走原逻辑（1 角色自动确认 / >1 角色弹窗选择）
      }
      if (res.length == 1) {
        this.changeId(res[0].specialorgid, res[0].code, res[0].id, res[0])
        await this.determine()
      } else if (res.length == 0) {
        this.resetPermissions()
        ElMessage({
          message: '无权限访问页面',
          iconClass: 'el-icon-user-solid',
          customClass: 'tipsBox'
        })
        if (this.store.getters.getMenuMsg.url === '/home') {
          emits.emit('isMainPageRole', false)
        }
        this.closeCurrentTab()
        this.$router.replace('/home')
      } else {
        this.list = res
        this.dialogVisible = true
      }
    },
    async determine() {
      if (this.specialorgid === '') {
        ElMessage({
          message: '请选择角色再确定',
          iconClass: 'el-icon-user-solid',
          customClass: 'tipsBox'
        })
        return
      }
      // 弹窗里点确定时 loading 还是 false，异常不会被 getUser 的 catch 接住，所以这里自己兜住
      try {
        const res = await baseService.get(`/sysMenu/getButtonList?menuCode=${this.menuId}&spRoleId=${this.spRoleId}`)
        if (res.success) {
          this.btnPermissions = Array.isArray(res.data) ? res.data : []
          // v-permission 指令读 store.state.permissions，必须同步提交，否则页面读到上一个菜单残留的权限
          this.store.commit('setPermissions', this.btnPermissions)
          this.isQuery = true
          this.$emit('loadCompany')
          this.dialogVisible = false
        } else {
          // 原来这里没有 else 分支：取不到按钮权限时页面会拿上一个菜单的权限继续渲染
          this.resetPermissions()
          this.loadError = res.msg || '获取按钮权限失败'
          ElMessage.error(this.loadError)
        }
      } catch (e) {
        this.resetPermissions()
        this.loadError = e?.message || '获取按钮权限失败'
        ElMessage.error(this.loadError)
      }
    },
    cancel() {
      this.closeCurrentTab()
      this.$router.back()
    },
    changeId(id, code, spRoleId, item) {
      this.specialorgid = id
      this.roleCode = code
      this.spRoleId = spRoleId
      this.userMsg = { ...item }
    },
    handleClose() {
      this.closeCurrentTab()
      this.$router.back()
    }
  }
})
</script>

<style scoped lang="less">
// 与 UserRoleSelector 共用同一份角色选择样式，避免两个弹窗各自漂移
@import '../UserRoleSelector/css/userRoleSelector';
</style>
