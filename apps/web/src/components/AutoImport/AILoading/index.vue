<template>
  <!-- 外层容器：直接承载流光背景 -->
  <div class="diffuse-card-wrapper">
    <div class="diffuse-card-inner">
      <!-- 柔和的背景弥散色块 -->
      <div class="diffuse-blob blob-1"></div>
      <div class="diffuse-blob blob-2"></div>

      <!-- 顶层内容 -->
      <div class="diffuse-content">
        <!-- 莫比乌斯动画容器 -->
        <div class="infinity-icon">
          <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#55cabb" />
                <stop offset="50%" stop-color="#b48cf7" />
                <stop offset="100%" stop-color="#7bd2e0" />
              </linearGradient>
            </defs>

            <path
              class="infinity-back flow-back"
              :stroke="`url(#${gradientId})`"
              stroke-width="6"
              d="M20,30 C20,8 40,8 60,30 C80,52 100,52 100,30 C100,8 80,8 60,30 C40,52 20,52 20,30"
            />

            <path
              class="infinity-front flow-front"
              :stroke="`url(#${gradientId})`"
              stroke-width="6"
              d="M20,30 C20,8 40,8 60,30 C80,52 100,52 100,30 C100,8 80,8 60,30 C40,52 20,52 20,30"
            />
          </svg>
        </div>

        <span class="loader-title">{{ title }}</span>
        <span class="loader-subtitle"> {{ subtitle }}<span class="thinking-dots"></span> </span>

        <div class="loader-progress">
          <div class="loader-progress-bar"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AILoading',
  props: {
    title: {
      type: String,
      default: 'AI 模型推理中'
    },
    subtitle: {
      type: String,
      default: '请稍后查看'
    }
  },
  data() {
    return {
      gradientId: 'grad-' + Math.random().toString(36).substr(2, 9)
    }
  }
}
</script>

<style scoped lang="less">
/* ========================
   🌿 背景与边缘流光核心修改
======================== */
.diffuse-card-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
  padding: 0px; /* 边缘流光厚度 */
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  /* 还原 HTML 版的 conic-gradient */
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(137, 226, 245, 0.4) 25%,
    rgba(212, 165, 255, 0.4) 50%,
    rgba(156, 230, 235, 0.4) 75%,
    transparent 100%
  );
  /* 关键动画：通过 hue-rotate 实现全色谱变色 */
  animation: spinGlow 5s linear infinite;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.06);
}

/* 还原 HTML 版的 ::after 外发光效果 */
.diffuse-card-wrapper::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 26px;
  background: inherit;
  filter: blur(14px);
  opacity: 0.6;
  z-index: -1;
}

@keyframes spinGlow {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}

/* ========================
   🌿 内部卡片与弥散球（保持原样）
======================== */
.diffuse-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 1;
}

.diffuse-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(50px);
  z-index: 0;
  animation: floatBlob 10s ease-in-out infinite alternate;
}

.blob-1 {
  width: 260px;
  height: 260px;
  background: #aae8f5;
  opacity: 0.45;
  top: -60px;
  left: -60px;
}

.blob-2 {
  width: 220px;
  height: 220px;
  background: #dec0ff;
  opacity: 0.4;
  bottom: -40px;
  right: -40px;
  animation-delay: -5s;
  animation-duration: 12s;
}

@keyframes floatBlob {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(40px, 30px) scale(1.15);
  }
  100% {
    transform: translate(-30px, 50px) scale(0.9);
  }
}

/* 内容、SVG 和进度条部分均未变动 */
.diffuse-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loader-title {
  font-size: 17px;
  font-weight: 600;
  color: #344356;
  letter-spacing: 1.5px;
}

.loader-subtitle {
  font-size: 13px;
  color: #8392a5;
  margin-top: -8px;
}

.thinking-dots::after {
  content: '';
  animation: dots 1.5s steps(4) infinite;
}

@keyframes dots {
  0% {
    content: '';
  }
  25% {
    content: '.';
  }
  50% {
    content: '..';
  }
  75% {
    content: '...';
  }
}

.infinity-icon {
  width: 100px;
  height: 50px;
  animation: breatheRotate 4s ease-in-out infinite;
}

.infinity-icon svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.infinity-front,
.infinity-back {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.flow-front {
  stroke-dasharray: 280;
  stroke-dashoffset: 280;
  animation: drawFront 2.5s ease-in-out infinite;
}

.flow-back {
  stroke-dasharray: 280;
  stroke-dashoffset: 280;
  opacity: 0.15;
  animation: drawBack 2.5s ease-in-out 0.3s infinite;
}

@keyframes drawFront {
  0% {
    stroke-dashoffset: 280;
    opacity: 0.5;
  }
  50% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: -280;
    opacity: 0.5;
  }
}

@keyframes drawBack {
  0% {
    stroke-dashoffset: 280;
    opacity: 0.15;
  }
  50% {
    stroke-dashoffset: 0;
    opacity: 0.4;
  }
  100% {
    stroke-dashoffset: -280;
    opacity: 0.15;
  }
}

@keyframes breatheRotate {
  0%,
  100% {
    transform: scale(0.96) rotate(-2deg);
  }
  50% {
    transform: scale(1.02) rotate(2deg);
  }
}

.loader-progress {
  width: 220px;
  height: 4px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  overflow: hidden;
}

.loader-progress-bar {
  height: 100%;
  width: 60%;
  background: linear-gradient(90deg, #55cabb, #b48cf7, #7bd2e0);
  background-size: 200% 100%;
  animation: progressFloat 2.5s ease-in-out infinite;
}

@keyframes progressFloat {
  0% {
    transform: translateX(-100%);
    background-position: 100% 0;
  }
  50% {
    transform: translateX(30%);
    background-position: 0% 0;
  }
  100% {
    transform: translateX(180%);
    background-position: -100% 0;
  }
}
</style>
