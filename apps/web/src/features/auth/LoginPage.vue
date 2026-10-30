<template>
  <div class="auth-page">
    <section class="auth-story" aria-label="项目过程管控平台介绍">
      <svg class="auth-story__routes" viewBox="0 0 900 860" fill="none" aria-hidden="true">
        <path d="M-30 690C150 690 210 510 380 510s210 180 470 180" stroke="currentColor" stroke-opacity=".12" />
        <path d="M-40 760C180 760 210 580 400 580s240 180 530 180" stroke="currentColor" stroke-opacity=".07" />
        <circle cx="380" cy="510" r="4" fill="currentColor" fill-opacity=".2" />
        <circle cx="850" cy="690" r="4" fill="currentColor" fill-opacity=".14" />
      </svg>

      <div class="auth-story__top">
        <BrandMark hero />
        <span class="auth-story__env">企业内部系统</span>
      </div>

      <div class="auth-story__message">
        <h1 class="auth-story__headline">
          把复杂的项目过程，<br />
          <span>收束成一条清晰的线。</span>
        </h1>
        <p class="auth-story__copy">从立项到结算，在同一个工作面上理解进度、处理事项、回到上下文。</p>
      </div>

      <ol class="auth-track" aria-label="项目过程阶段">
        <li v-for="(station, index) in stations" :key="station" class="auth-track__item">
          <span class="auth-track__node" aria-hidden="true"></span>
          <span class="auth-track__label">{{ station }}</span>
          <span class="auth-track__index">{{ String(index + 1).padStart(2, '0') }}</span>
        </li>
      </ol>

      <div class="auth-story__foot">
        <span>项目过程管控平台</span>
        <span class="auth-story__foot-code">GOVERNANCE LINE · {{ app.version }}</span>
      </div>
    </section>

    <section class="auth-entry">
      <div class="auth-card">
        <div class="auth-status" :data-state="status" role="status" aria-live="polite">
          <span class="auth-status__icon" aria-hidden="true">
            <LoaderCircle v-if="status === 'loading'" class="auth-status__spin" :size="22" :stroke-width="1.8" />
            <ShieldAlert v-else-if="status === 'forbidden'" :size="22" :stroke-width="1.8" />
            <CircleAlert v-else :size="22" :stroke-width="1.8" />
          </span>
          <h2 class="auth-status__title">{{ stateCopy.title }}</h2>
          <p class="auth-status__copy">{{ stateCopy.description }}</p>
        </div>

        <ol v-if="status !== 'external'" class="auth-steps" aria-label="登录进度">
          <li v-for="(step, index) in phases" :key="step.key" class="auth-step" :data-state="stepState(index)">
            <span class="auth-step__marker" aria-hidden="true">
              <Check v-if="stepState(index) === 'done'" :size="11" :stroke-width="2.4" />
              <span v-else class="auth-step__dot"></span>
            </span>
            <span class="auth-step__label">{{ step.label }}</span>
            <span class="auth-step__hint">{{ step.hint }}</span>
          </li>
        </ol>

        <div v-if="status !== 'loading' && status !== 'external'" class="auth-actions">
          <button class="ds-button ds-button--primary auth-actions__primary" type="button" @click="autoLogin">
            <RefreshCw :size="15" :stroke-width="1.8" aria-hidden="true" />
            {{ status === 'forbidden' ? '重新验证权限' : '重新登录' }}
          </button>
          <p class="auth-actions__hint">
            {{ status === 'forbidden' ? '如需开通权限，请联系系统管理员。' : '如持续失败，请检查企业网络或联系系统管理员。' }}
          </p>
        </div>

        <div class="auth-card__foot">
          <LockKeyhole :size="13" :stroke-width="1.8" aria-hidden="true" />
          <span>请通过企业统一认证访问，本页不收集或展示账号信息。</span>
        </div>
      </div>

      <p class="auth-entry__note">
        仅限授权用户访问
        <span aria-hidden="true">·</span>
        {{ app.version }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, CircleAlert, LoaderCircle, LockKeyhole, RefreshCw, ShieldAlert } from '@lucide/vue'
import { useSessionStore } from '@/store'
import baseService from '@/service/baseService'
import { CacheToken, Permissions } from '@/constants/cacheKey'
import { removeCache, setCache } from '@/utils/cache'
import app from '@/constants/app'
import { BrandMark } from '@/design-system'

defineOptions({ name: 'LoginPage' })

type LoginStatus = 'loading' | 'forbidden' | 'error' | 'external'
type LoginPhase = 'identity' | 'permission' | 'workspace'

const router = useRouter()
const session = useSessionStore()

const status = ref<LoginStatus>(import.meta.env.DEV ? 'loading' : 'external')
const loginPending = ref(false)
const phase = ref<LoginPhase>('identity')
const failedPhase = ref<LoginPhase | null>(null)
const errorMessage = ref('请稍后重试，或联系系统管理员。')

const stations = ['立项', '计划', '执行', '结算', '归档']

const phases = [
  { key: 'identity', label: '身份校验', hint: '企业身份' },
  { key: 'permission', label: '权限确认', hint: '角色范围' },
  { key: 'workspace', label: '载入工作台', hint: '导航与数据' }
] as const

const phaseIndex = computed(() => phases.findIndex((item) => item.key === phase.value))

const failedIndex = computed(() => {
  if (!failedPhase.value) return -1
  return phases.findIndex((item) => item.key === failedPhase.value)
})

const stepState = (index: number): 'done' | 'active' | 'error' | 'pending' => {
  if (status.value !== 'loading' && failedIndex.value === index) return 'error'
  if (status.value !== 'loading' && failedIndex.value > index) return 'done'
  if (status.value !== 'loading') return 'pending'
  if (index < phaseIndex.value) return 'done'
  if (index === phaseIndex.value) return 'active'
  return 'pending'
}

const stateCopy = computed(() => {
  if (status.value === 'external') {
    return {
      title: '请从企业统一入口访问',
      description: '本系统由外部统一认证提供登录身份。请返回企业统一入口重新进入，如仍无法访问，请联系系统管理员。'
    }
  }
  if (status.value === 'forbidden') {
    return {
      title: '暂无系统访问权限',
      description: '当前身份已通过校验，但尚未开通项目过程管控平台的访问范围。'
    }
  }
  if (status.value === 'error') {
    return {
      title: '登录未完成',
      description: errorMessage.value
    }
  }
  const descriptions: Record<LoginPhase, string> = {
    identity: '正在验证企业身份，请稍候。',
    permission: '身份已确认，正在核对当前角色的访问范围。',
    workspace: '权限已确认，正在准备你的工作区。'
  }
  return { title: '正在进入工作台', description: descriptions[phase.value] }
})

const autoLogin = async () => {
  // 正式身份由外部系统提供；构建时会移除整个开发联调分支及凭据模块。
  if (!import.meta.env.DEV) return
  if (loginPending.value) return
  loginPending.value = true
  status.value = 'loading'
  phase.value = 'identity'
  failedPhase.value = null

  try {
    const { loginForDevelopment } = await import('./development-login')
    const res = await loginForDevelopment()

    if (res.code !== 0 || !res.data) throw new Error(res.msg || '登录接口返回异常')

    phase.value = 'permission'
    const permission = await baseService.get<boolean>('/sysMenu/hasPermission')
    if (permission.code !== 0) throw new Error(permission.msg || '访问权限校验失败')
    const allowed = permission.data
    session.setHasPermission(allowed)

    if (!allowed) {
      failedPhase.value = 'permission'
      status.value = 'forbidden'
      return
    }

    phase.value = 'workspace'
    setCache(CacheToken, res.data, true)
    setCache(Permissions, permission.data, true)
    session.markLogin(true)
    await router.replace('/home')
  } catch (error) {
    // 失败时清掉半登录态，避免带着旧 token 进入受保护路由。
    removeCache(CacheToken, true)
    removeCache(Permissions, true)
    failedPhase.value = phase.value
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试。'
    console.error('[auth] auto login failed', error)
  } finally {
    loginPending.value = false
  }
}

onMounted(autoLogin)
</script>

<style scoped lang="less">
.auth-page {
  --ds-brand-text: #f3fbf8;
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(380px, 0.88fr);
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden auto;
  background: var(--ds-paper);
}

.auth-story {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 38px clamp(36px, 5vw, 76px) 34px;
  overflow: hidden;
  color: #f3fbf8;
  background:
    radial-gradient(circle at 78% 16%, rgb(44 168 152 / 16%), transparent 34%),
    radial-gradient(circle at 10% 90%, rgb(19 143 130 / 12%), transparent 32%), var(--ds-jade-950);
}

.auth-story::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  background-image: linear-gradient(90deg, rgb(255 255 255 / 3%) 1px, transparent 1px);
  background-size: 20% 100%;
  mask-image: linear-gradient(180deg, transparent, #000 36%, #000 70%, transparent);
}

.auth-story__routes {
  position: absolute;
  right: -8%;
  bottom: -4%;
  width: 110%;
  height: 70%;
  color: #f3fbf8;
  pointer-events: none;
}

.auth-story__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.auth-story__env {
  padding: 5px 9px;
  color: rgb(243 251 248 / 55%);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.13em;
  border: 1px solid rgb(255 255 255 / 13%);
  border-radius: var(--ds-radius-pill);
}

.auth-story__message {
  position: relative;
  z-index: 1;
  max-width: 650px;
  margin: 80px 0 auto;
}

.auth-story__headline {
  color: #f3fbf8;
  font-size: 46px;
  font-weight: 600;
  line-height: 1.32;
  letter-spacing: -0.035em;
}

.auth-story__headline span {
  color: var(--ds-jade-300);
}

.auth-story__copy {
  max-width: 42ch;
  margin-top: 22px;
  color: rgb(243 251 248 / 52%);
  font-size: 14px;
  line-height: 1.8;
}

.auth-track {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  width: min(100%, 620px);
  margin-top: 70px;
}

.auth-track::before {
  position: absolute;
  top: 4px;
  right: 6px;
  left: 6px;
  height: 1px;
  content: '';
  background: rgb(255 255 255 / 13%);
}

.auth-track__item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.auth-track__node {
  position: relative;
  z-index: 1;
  width: 9px;
  height: 9px;
  background: #0b3b33;
  border: 1px solid var(--ds-jade-400);
  border-radius: 50%;
  box-shadow: 0 0 0 4px #082a25;
}

.auth-track__item:first-child .auth-track__node {
  background: var(--ds-jade-300);
  border-color: var(--ds-jade-300);
}

.auth-track__label {
  color: rgb(243 251 248 / 72%);
  font-size: 12px;
  letter-spacing: 0.04em;
}

.auth-track__index {
  color: rgb(243 251 248 / 30%);
  font-family: var(--ds-font-mono);
  font-size: 8px;
  letter-spacing: 0.08em;
}

.auth-story__foot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 28px;
  margin-top: 40px;
  color: rgb(243 251 248 / 34%);
  font-size: 10px;
  border-top: 1px solid rgb(255 255 255 / 8%);
}

.auth-story__foot-code {
  font-family: var(--ds-font-mono);
  letter-spacing: 0.08em;
}

.auth-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 44px clamp(26px, 4vw, 64px);
  background: radial-gradient(circle at 100% 0, rgb(11 107 98 / 5%), transparent 28%), var(--ds-paper);
}

.auth-card {
  width: min(100%, 408px);
  padding: 32px 30px 24px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-line);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-panel);
}

.auth-status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.auth-status__icon {
  display: grid;
  width: 44px;
  height: 44px;
  margin-bottom: 20px;
  place-items: center;
  color: var(--ds-jade-700);
  background: var(--ds-jade-50);
  border: 1px solid var(--ds-jade-100);
  border-radius: 50%;
}

.auth-status[data-state='forbidden'] .auth-status__icon {
  color: var(--ds-warning);
  background: var(--ds-warning-soft);
  border-color: #eedcc1;
}

.auth-status[data-state='error'] .auth-status__icon {
  color: var(--ds-danger);
  background: var(--ds-danger-soft);
  border-color: #efd4d0;
}

.auth-status__spin {
  animation: auth-spin 1s linear infinite;
}

@keyframes auth-spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-status__title {
  color: var(--ds-ink);
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.auth-status__copy {
  min-height: 42px;
  margin-top: 9px;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-md);
  line-height: 1.7;
}

.auth-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 18px 0 0;
  margin-top: 24px;
  border-top: 1px solid var(--ds-line);
}

.auth-step {
  position: relative;
  display: grid;
  grid-template-columns: 18px 1fr auto;
  gap: 10px;
  align-items: center;
  min-height: 42px;
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-sm);
}

.auth-step + .auth-step::before {
  position: absolute;
  top: -8px;
  left: 8px;
  width: 1px;
  height: 16px;
  content: '';
  background: var(--ds-line);
}

.auth-step__marker {
  display: grid;
  width: 17px;
  height: 17px;
  place-items: center;
  color: var(--ds-surface);
  background: var(--ds-surface);
  border: 1px solid var(--ds-line-strong);
  border-radius: 50%;
}

.auth-step__dot {
  width: 5px;
  height: 5px;
  background: var(--ds-line-strong);
  border-radius: 50%;
}

.auth-step__label {
  font-weight: 500;
}

.auth-step__hint {
  color: var(--ds-ink-tertiary);
  font-size: 10px;
  letter-spacing: 0.03em;
}

.auth-step[data-state='done'] {
  color: var(--ds-ink-secondary);

  .auth-step__marker {
    color: var(--ds-surface);
    background: var(--ds-jade-600);
    border-color: var(--ds-jade-600);
  }
}

.auth-step[data-state='active'] {
  color: var(--ds-ink);

  .auth-step__marker {
    border-color: var(--ds-jade-500);
    box-shadow: 0 0 0 3px var(--ds-jade-50);
  }

  .auth-step__dot {
    background: var(--ds-jade-500);
    animation: auth-pulse 1.6s ease-in-out infinite;
  }
}

.auth-step[data-state='error'] {
  color: var(--ds-danger);

  .auth-step__marker {
    border-color: var(--ds-danger);
    background: var(--ds-danger-soft);
  }

  .auth-step__dot {
    background: var(--ds-danger);
  }
}

@keyframes auth-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.8);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.auth-actions {
  padding-top: 18px;
  margin-top: 20px;
  border-top: 1px solid var(--ds-line);
}

.auth-actions__primary {
  width: 100%;
  height: 40px;
}

.auth-actions__hint {
  margin-top: 10px;
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-xs);
  line-height: 1.6;
  text-align: center;
}

.auth-card__foot {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  padding-top: 18px;
  margin-top: 26px;
  color: var(--ds-ink-tertiary);
  font-size: 10px;
  line-height: 1.65;
  border-top: 1px solid var(--ds-line);
}

.auth-card__foot svg {
  flex: 0 0 auto;
  margin-top: 2px;
}

.auth-entry__note {
  margin-top: 20px;
  color: var(--ds-ink-tertiary);
  font-size: 10px;
  letter-spacing: 0.03em;
}

@media (max-width: 1100px) {
  .auth-page {
    grid-template-columns: minmax(0, 1fr) 420px;
  }

  .auth-story {
    padding: 32px;
  }

  .auth-story__headline {
    font-size: 38px;
  }
}
</style>
