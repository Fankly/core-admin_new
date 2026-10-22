<template>
  <div class="error-page">
    <svg class="error-page__route" viewBox="0 0 460 280" fill="none" aria-hidden="true">
      <path d="M4 214h94c26 0 42-15 42-40V88c0-24 18-40 42-40h86" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      <path d="M268 48h76" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 8" opacity=".45" />
      <circle cx="4" cy="214" r="4" fill="currentColor" />
      <circle cx="140" cy="174" r="4" fill="currentColor" opacity=".55" />
      <circle cx="268" cy="48" r="5" fill="currentColor" />
      <circle cx="344" cy="48" r="2.5" fill="currentColor" opacity=".28" />
    </svg>

    <div class="error-page__body">
      <span class="error-page__code">{{ code }}</span>
      <h1 class="error-page__title">{{ title }}</h1>
      <p class="error-page__copy">{{ description }}</p>
      <div class="error-page__actions">
        <button class="ds-button ds-button--primary" type="button" @click="goHome">{{ reload ? '重新加载' : '返回工作台' }}</button>
        <button class="ds-button" type="button" @click="goBack">返回上一页</button>
      </div>
      <p class="error-page__hint">如果问题持续出现，请联系系统管理员，并提供当前页面地址。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineOptions({ name: 'ErrorPage' })

interface Props {
  code: string
  title: string
  description: string
  reload?: boolean
}

withDefaults(defineProps<Props>(), {
  description: '这条路径暂时无法抵达。',
  reload: false
})

const router = useRouter()

const goHome = () => {
  // /error 不触发菜单初始化，重试必须返回工作区入口才能重新请求。
  void router.replace('/home')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="less">
.error-page {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(320px, 1fr);
  gap: clamp(32px, 7vw, 96px);
  align-content: center;
  align-items: center;
  min-height: 100%;
  padding: clamp(24px, 6vh, 72px);
  color: var(--ds-jade-600);
}

.error-page__route {
  width: 100%;
  max-width: 460px;
  color: var(--ds-jade-500);
}

.error-page__body {
  max-width: 520px;
}

.error-page__code {
  color: var(--ds-jade-500);
  font-family: var(--ds-font-numeric);
  font-size: 64px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.04em;
}

.error-page__title {
  margin-top: 18px;
  color: var(--ds-ink);
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.025em;
}

.error-page__copy {
  max-width: 44ch;
  margin-top: 12px;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-base);
  line-height: 1.75;
}

.error-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 28px;
}

.error-page__hint {
  margin-top: 20px;
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-xs);
  line-height: 1.6;
}

@media (max-width: 760px) {
  .error-page {
    grid-template-columns: 1fr;
    gap: 24px;
    align-content: start;
    padding: 24px;
  }

  .error-page__route {
    max-width: 240px;
  }

  .error-page__code {
    font-size: 48px;
  }

  .error-page__title {
    font-size: 23px;
  }
}
</style>
