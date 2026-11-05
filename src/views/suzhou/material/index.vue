<template>
  <div class="material-page-wrapper">
    <!-- 动效美观标题 -->
    <div v-if="isPageReady" class="title-container">
      <h1 class="elegant-title">
        <span class="title-glow-text">{{ pageTitle }}</span>
      </h1>
      <div class="title-line">
        <span class="glow-dot animate-dot"></span>
      </div>
    </div>

    <!-- 页面核心内容 -->
    <div class="page-content">
      <MaterialPage :toolbar="MaterialToolbar" :search="MaterialSearch" :config="MATERIAL_PAGE_CONFIG" show-help @page-visible="handlePageVisible" />
    </div>
  </div>
</template>

<script setup lang="ts" name="/suzhou/material/index">
import { ref, onMounted } from 'vue'
import MaterialPage from '@/views/suzhou/common/components/MaterialPage.vue'
import MaterialToolbar from '@/views/suzhou/material/modules/materialToolbar.vue'
import MaterialSearch from '@/views/suzhou/material/modules/materialSearch.vue'
import { MATERIAL_PAGE_CONFIG } from '@/views/suzhou/material/config'
import { getPublicCodesList } from '@/api/common'
import { DEFAULT_MATERIAL_TITLE, MATERIAL_JUDGMENT_RESULT_NAME_CODE, resolveMaterialTitleConfig } from '@/views/suzhou/material/utils/titleConfig'

const pageTitle = ref(DEFAULT_MATERIAL_TITLE)
const isPageReady = ref(false)

const getPageTitle = async () => {
  try {
    const res = await getPublicCodesList({ codes: [MATERIAL_JUDGMENT_RESULT_NAME_CODE] })
    if (res && res.success) {
      const config = resolveMaterialTitleConfig(res.data?.[0]?.codes)
      pageTitle.value = config.title
    }
  } catch (err) {
    console.error('Failed to load material page title:', err)
    pageTitle.value = DEFAULT_MATERIAL_TITLE
  }
}

const handlePageVisible = () => {
  isPageReady.value = true
}

onMounted(() => {
  getPageTitle()
})
</script>

<style scoped lang="less">
.material-page-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fff;
}

.page-content {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 0 6px 0;
  user-select: none;
  position: relative;
  background: radial-gradient(circle at center, rgba(14, 139, 141, 0.04) 0%, rgba(255, 255, 255, 0) 70%);

  .elegant-title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 2px;
    position: relative;
    display: inline-block;
    animation: titleEntry 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  .title-glow-text {
    background: linear-gradient(135deg, #0e8b8d 0%, #1fb5ac 50%, #0d9488 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-size: 200% auto;
    animation: shineText 4s linear infinite;
    color: #0e8b8d;
    filter: drop-shadow(0px 2px 4px rgba(14, 139, 141, 0.15));
  }

  .title-line {
    width: 0px;
    height: 3px;
    background: linear-gradient(90deg, transparent 0%, #0e8b8d 50%, transparent 100%);
    position: relative;
    margin-top: 8px;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: lineExpand 1s cubic-bezier(0.65, 0, 0.35, 1) 0.5s forwards;

    .glow-dot {
      width: 6px;
      height: 6px;
      background-color: #1fb5ac;
      border-radius: 50%;
      box-shadow: 0 0 10px #1fb5ac, 0 0 20px #1fb5ac;
      opacity: 0;
      animation: dotFadeIn 0.5s ease 1.5s forwards, dotPulse 2s infinite ease-in-out 1.5s;
    }
  }

  &:hover {
    .elegant-title {
      transform: scale(1.02);
      transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    }

    .title-line {
      background: linear-gradient(90deg, transparent 0%, #1fb5ac 50%, transparent 100%);
      transition: background 0.4s ease;

      .glow-dot {
        transform: scale(1.5);
        box-shadow: 0 0 15px #1fb5ac, 0 0 30px #1fb5ac;
        transition: transform 0.4s ease, box-shadow 0.4s ease;
      }
    }
  }
}

@keyframes titleEntry {
  0% {
    opacity: 0;
    transform: translateY(-15px);
    letter-spacing: -2px;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    letter-spacing: 2px;
  }
}

@keyframes lineExpand {
  0% {
    width: 0;
  }
  100% {
    width: 160px;
  }
}

@keyframes dotFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes dotPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 8px #1fb5ac, 0 0 15px #1fb5ac;
  }
  50% {
    transform: scale(1.3);
    box-shadow: 0 0 12px #1fb5ac, 0 0 25px #1fb5ac;
  }
}

@keyframes shineText {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
