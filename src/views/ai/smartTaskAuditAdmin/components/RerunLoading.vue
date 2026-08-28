<template>
  <div class="ai-loading" role="status" aria-live="polite">
    <div class="ai-loading__panel">
      <div class="ai-loading__glow ai-loading__glow--a" aria-hidden="true"></div>
      <div class="ai-loading__glow ai-loading__glow--b" aria-hidden="true"></div>
      <div class="ai-loading__grid" aria-hidden="true"></div>

      <div class="ai-loading__core" aria-hidden="true">
        <span class="ai-loading__ring ai-loading__ring--outer"></span>
        <span class="ai-loading__ring ai-loading__ring--mid"></span>
        <span class="ai-loading__ring ai-loading__ring--inner"></span>
        <span class="ai-loading__orbit">
          <span class="ai-loading__dot"></span>
        </span>
        <span class="ai-loading__pulse"></span>
        <span class="ai-loading__node">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 10c-2.2 0-4 1.8-4 4v3.2c-3.4 1-5.8 4.1-5.8 7.7 0 1.3.3 2.5.9 3.6L12 32.8c-.5.7 0 1.7.9 1.7h22.2c.9 0 1.4-1 .9-1.7l-3.1-4.3c.6-1.1.9-2.3.9-3.6 0-3.6-2.4-6.7-5.8-7.7V14c0-2.2-1.8-4-4-4zm-1.6 7.2V14c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v3.2h-3.2zM16.6 25c0-2.8 1.8-5.2 4.4-6.1h6c2.6.9 4.4 3.3 4.4 6.1 0 1.1-.3 2.1-.8 3H17.4c-.5-.9-.8-1.9-.8-3zM18 32.1h12l1.7 2.4H16.3L18 32.1z"
              fill="currentColor"
            />
            <circle class="ai-loading__node-dot ai-loading__node-dot--a" cx="20.2" cy="24.8" r="1.4" fill="currentColor" />
            <circle class="ai-loading__node-dot ai-loading__node-dot--b" cx="24" cy="24.8" r="1.4" fill="currentColor" />
            <circle class="ai-loading__node-dot ai-loading__node-dot--c" cx="27.8" cy="24.8" r="1.4" fill="currentColor" />
          </svg>
        </span>
      </div>

      <div class="ai-loading__copy">
        <div class="ai-loading__badge">AI 智能评审</div>
        <div class="ai-loading__title">{{ title }}</div>
        <div class="ai-loading__subtitle">
          {{ subtitle }}<span class="ai-loading__dots" aria-hidden="true"><i></i><i></i><i></i></span>
        </div>
      </div>

      <div class="ai-loading__progress" aria-hidden="true">
        <div class="ai-loading__progress-track">
          <div class="ai-loading__progress-bar"></div>
        </div>
        <div class="ai-loading__steps">
          <span>解析规则</span>
          <span>模型推理</span>
          <span>生成结论</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: 'AI 模型推理中'
  },
  subtitle: {
    type: String,
    default: '正在重新分析'
  }
})
</script>

<style scoped lang="less">
.ai-loading {
  --ai-primary: var(--el-color-primary, #00706b);
  --ai-primary-deep: #0e8b8d;
  --ai-cyan: #55cabb;
  --ai-text: #1f2937;
  --ai-muted: #6b7280;
  --ai-ease: cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 0;
  box-sizing: border-box;
}

.ai-loading__panel {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 48px 32px 40px;
  overflow: hidden;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 251, 251, 0.98) 48%, rgba(238, 247, 247, 0.99) 100%);
  border: 0;
  border-radius: 0;
  box-shadow: none;
  animation: ai-panel-enter 280ms var(--ai-ease) both;
}

.ai-loading__glow {
  position: absolute;
  border-radius: 50%;
  /* 缩小 blur 半径与体积，降低离屏光栅成本；动效仍保留 transform/opacity */
  filter: blur(28px);
  pointer-events: none;
  z-index: 0;
}

.ai-loading__glow--a {
  top: 8%;
  left: 12%;
  width: min(28vw, 220px);
  height: min(28vw, 220px);
  background: rgba(85, 202, 187, 0.28);
  animation: ai-glow-float 5.5s ease-in-out infinite alternate;
}

.ai-loading__glow--b {
  right: 10%;
  bottom: 10%;
  width: min(26vw, 200px);
  height: min(26vw, 200px);
  background: rgba(14, 139, 141, 0.18);
  animation: ai-glow-float 6.5s ease-in-out infinite alternate-reverse;
}

.ai-loading__grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(14, 139, 141, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 139, 141, 0.045) 1px, transparent 1px);
  background-size: 36px 36px;
  -webkit-mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.55), transparent 82%);
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.55), transparent 82%);
  opacity: 0.8;
  pointer-events: none;
  z-index: 0;
  animation: ai-grid-drift 12s linear infinite;
}

.ai-loading__core,
.ai-loading__copy,
.ai-loading__progress {
  position: relative;
  z-index: 1;
}

.ai-loading__core {
  position: relative;
  width: 148px;
  height: 148px;
  display: flex;
  align-items: center;
  justify-content: center;
  // 强制独立合成层，避免被 modal / filter 影响后动画看起来卡住
  transform: translateZ(0);
}

.ai-loading__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-sizing: border-box;
  pointer-events: none;
}

.ai-loading__ring--outer {
  border: 2px solid rgba(0, 112, 107, 0.08);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(85, 202, 187, 0.15) 20deg,
    #55cabb 70deg,
    rgba(14, 139, 141, 0.85) 110deg,
    transparent 160deg
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  animation: ai-spin 2.4s linear infinite;
}

.ai-loading__ring--mid {
  inset: 14px;
  border: 2px solid rgba(14, 139, 141, 0.08);
  background: conic-gradient(
    from 40deg,
    transparent 0deg,
    rgba(0, 112, 107, 0.12) 30deg,
    #0e8b8d 90deg,
    rgba(85, 202, 187, 0.7) 130deg,
    transparent 180deg
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  animation: ai-spin-reverse 1.8s linear infinite;
}

.ai-loading__ring--inner {
  inset: 30px;
  border: 1.5px dashed rgba(14, 139, 141, 0.28);
  animation: ai-spin 6s linear infinite;
}

.ai-loading__orbit {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  animation: ai-spin 1.6s linear infinite;
}

.ai-loading__dot {
  position: absolute;
  top: 0;
  left: 50%;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  border-radius: 50%;
  background: linear-gradient(180deg, #7ee7d8 0%, var(--ai-primary-deep) 100%);
  box-shadow: 0 0 0 5px rgba(85, 202, 187, 0.18), 0 0 18px rgba(0, 112, 107, 0.4);
}

.ai-loading__pulse {
  position: absolute;
  inset: 38px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(85, 202, 187, 0.34) 0%, rgba(0, 112, 107, 0.1) 55%, transparent 72%);
  animation: ai-pulse 1.8s var(--ai-ease) infinite;
}

.ai-loading__node {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  color: var(--ai-primary);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(236, 250, 249, 0.96)), #fff;
  border: 1px solid rgba(0, 112, 107, 0.14);
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(0, 112, 107, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  animation: ai-node-breathe 2s ease-in-out infinite;

  svg {
    width: 36px;
    height: 36px;
  }
}

.ai-loading__node-dot {
  opacity: 0.35;
  animation: ai-node-dot 1.2s ease-in-out infinite;
}

.ai-loading__node-dot--a {
  animation-delay: 0s;
}

.ai-loading__node-dot--b {
  animation-delay: 0.2s;
}

.ai-loading__node-dot--c {
  animation-delay: 0.4s;
}

.ai-loading__copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: min(720px, 86%);
  text-align: center;
}

.ai-loading__badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  color: var(--ai-primary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: rgba(0, 112, 107, 0.08);
  border: 1px solid rgba(0, 112, 107, 0.1);
  border-radius: 999px;
  animation: ai-badge-pulse 2s ease-in-out infinite;
}

.ai-loading__title {
  max-width: 100%;
  color: var(--ai-text);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-loading__subtitle {
  display: inline-flex;
  align-items: center;
  color: var(--ai-muted);
  font-size: 14px;
  line-height: 1.5;
}

.ai-loading__dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 4px;
  min-width: 18px;

  i {
    display: block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.25;
    font-style: normal;
    animation: ai-dot-bounce 1.1s ease-in-out infinite;
  }

  i:nth-child(2) {
    animation-delay: 0.15s;
  }

  i:nth-child(3) {
    animation-delay: 0.3s;
  }
}

.ai-loading__progress {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(100%, 360px);
}

.ai-loading__progress-track {
  position: relative;
  height: 5px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.05);
  border-radius: 999px;
}

.ai-loading__progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 42%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(14, 139, 141, 0.15) 0%, #0e8b8d 45%, #55cabb 100%);
  box-shadow: 0 0 12px rgba(85, 202, 187, 0.35);
  // 用 transform，比改 left 更稳、更不容易被合成层卡住
  animation: ai-progress 1.4s ease-in-out infinite;
}

.ai-loading__steps {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.2;

  span {
    position: relative;
    padding-left: 10px;
  }

  span::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(148, 163, 184, 0.7);
    transform: translateY(-50%);
  }

  span:nth-child(1)::before {
    background: #0e8b8d;
    box-shadow: 0 0 0 3px rgba(14, 139, 141, 0.12);
    animation: ai-step-pulse 1.5s ease-in-out infinite;
  }

  span:nth-child(2)::before {
    animation: ai-step-pulse 1.5s ease-in-out 0.25s infinite;
  }

  span:nth-child(3)::before {
    animation: ai-step-pulse 1.5s ease-in-out 0.5s infinite;
  }
}

@keyframes ai-panel-enter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes ai-glow-float {
  0% {
    opacity: 0.7;
    transform: translate3d(0, 0, 0) scale(1);
  }

  100% {
    opacity: 1;
    transform: translate3d(22px, 16px, 0) scale(1.1);
  }
}

@keyframes ai-grid-drift {
  0% {
    background-position: 0 0, 0 0;
  }

  100% {
    background-position: 36px 36px, 36px 36px;
  }
}

@keyframes ai-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes ai-spin-reverse {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(-360deg);
  }
}

@keyframes ai-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1.12);
  }
}

@keyframes ai-node-breathe {
  0%,
  100% {
    transform: scale(0.96);
    box-shadow: 0 10px 22px rgba(0, 112, 107, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 16px 30px rgba(0, 112, 107, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.95);
  }
}

@keyframes ai-node-dot {
  0%,
  100% {
    opacity: 0.28;
  }

  50% {
    opacity: 1;
  }
}

@keyframes ai-badge-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(0, 112, 107, 0);
  }

  50% {
    box-shadow: 0 0 0 6px rgba(0, 112, 107, 0.06);
  }
}

@keyframes ai-progress {
  0% {
    transform: translate3d(-100%, 0, 0);
  }

  100% {
    transform: translate3d(280%, 0, 0);
  }
}

@keyframes ai-dot-bounce {
  0%,
  80%,
  100% {
    opacity: 0.2;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@keyframes ai-step-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: translateY(-50%) scale(0.9);
  }

  50% {
    opacity: 1;
    transform: translateY(-50%) scale(1.2);
    background: #0e8b8d;
    box-shadow: 0 0 0 3px rgba(14, 139, 141, 0.12);
  }
}

// 加载态是业务状态反馈，不跟随系统「减少动态效果 / 动画效果」关闭。
// 浏览器不会自动停掉 CSS animation；只有我们写了 prefers-reduced-motion 才会停。
</style>
