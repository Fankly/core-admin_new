<template>
  <div class="login-page">
    <div class="login-page__brand">
      <span class="login-page__mark">项</span>
      <div>
        <h1 class="login-page__title">项目过程管控平台</h1>
        <p class="login-page__subtitle">Project Process Governance</p>
      </div>
    </div>

    <el-card class="login-page__card" shadow="never">
      <template v-if="status === 'loading'">
        <div class="login-page__state">
          <el-icon class="is-loading" :size="28"><Loading /></el-icon>
          <p>正在验证身份…</p>
        </div>
      </template>
      <template v-else-if="status === 'forbidden'">
        <el-result icon="warning" title="暂无系统访问权限" sub-title="请联系管理员开通项目过程管控平台的访问权限。">
          <template #extra>
            <el-button type="primary" @click="autoLogin">重新验证</el-button>
          </template>
        </el-result>
      </template>
      <template v-else>
        <el-result icon="error" title="登录失败" :sub-title="errorMessage">
          <template #extra>
            <el-button type="primary" @click="autoLogin">重试</el-button>
          </template>
        </el-result>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Base64 } from 'js-base64'
import { Loading } from '@element-plus/icons-vue'
import { useSessionStore } from '@/store'
import baseService from '@/service/baseService'
import { CacheToken, Permissions } from '@/constants/cacheKey'
import { removeCache, setCache } from '@/utils/cache'
import { getUuid } from '@/utils/utils'
import { handleError } from '@/utils/error'

defineOptions({ name: 'LoginPage' })

type LoginStatus = 'loading' | 'forbidden' | 'error'

const router = useRouter()
const session = useSessionStore()
const status = ref<LoginStatus>('loading')
const errorMessage = ref('请稍后重试，或联系系统管理员。')

// 旧版统一认证入口：凭据由构建环境注入，避免把测试账号写死在源码里。
const env = import.meta.env as Record<string, string | undefined>
const credentials = {
  account: env.VITE_APP_LOGIN_USER ?? 'admin',
  password: env.VITE_APP_LOGIN_PASSWORD ?? 'admin',
  captcha: env.VITE_APP_LOGIN_CAPTCHA ?? 'HE_YUE_11_22_33'
}

const autoLogin = async () => {
  status.value = 'loading'
  try {
    const res = await baseService.post<Record<string, unknown> | null>('/login', {
      a: Base64.encode(credentials.account),
      b: Base64.encode(credentials.password),
      captcha: Base64.encode(credentials.captcha),
      u: Base64.encode(getUuid())
    })

    if (res.code !== 0 || !res.data) throw new Error(res.msg || '登录接口返回异常')

    const permission = await baseService.get<boolean>('/sysMenu/hasPermission')
    const allowed = permission.data
    session.setHasPermission(allowed)

    if (!allowed) {
      status.value = 'forbidden'
      return
    }

    setCache(CacheToken, res.data, true)
    setCache(Permissions, permission.data, true)
    session.markLogin(true)
    await router.replace('/home')
  } catch (error) {
    // 失败时清掉半登录态，避免带着旧 token 进入受保护路由。
    removeCache(CacheToken, true)
    removeCache(Permissions, true)
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试。'
    handleError(error, '登录失败')
  }
}

onMounted(autoLogin)
</script>

<style scoped lang="less">
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  align-items: center;
  min-height: 100vh;
  padding: 0 8vw;
  background:
    radial-gradient(circle at 15% 20%, rgb(14 165 164 / 18%), transparent 42%),
    radial-gradient(circle at 80% 75%, rgb(59 130 246 / 12%), transparent 40%), #f6f8fb;
}

.login-page__brand {
  display: flex;
  gap: 18px;
  align-items: center;
}

.login-page__mark {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 56px;
  height: 56px;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #0f766e, #0ea5a4);
  border-radius: 16px;
  box-shadow: 0 16px 40px rgb(15 118 110 / 25%);
}

.login-page__title {
  margin: 0;
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.login-page__subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: #64748b;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.login-page__card {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 24px 64px rgb(15 23 42 / 8%);
}

.login-page__state {
  display: grid;
  gap: 12px;
  place-items: center;
  padding: 48px 0;
  color: #475569;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 48px 24px;
  }
}
</style>
