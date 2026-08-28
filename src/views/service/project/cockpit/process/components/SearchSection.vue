<template>
  <div class="search-section">
    <div class="search-container">
      <input
        type="text"
        class="search-input"
        :placeholder="props.placeholder || '输入项目编码'"
        v-model="searchValue"
        @keyup.enter="handleSearch"
      />
      <button class="search-button" @click="handleSearch">
        {{ props.buttonText || '快速查询' }}
      </button>
      <button class="search-button" @click="handleHelp">
        {{ '帮助手册' }}
      </button>
    </div>
  </div>
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts">
import HelpModal from '@/components/HelpModal/index.vue'
import { defineEmits, defineProps, getCurrentInstance, ref } from 'vue'

// Props定义
const props = defineProps<{
  placeholder?: string
  buttonText?: string
}>()

// Emits定义
const emit = defineEmits(['search'])

const helpModalRef = ref()

// 获取当前实例以访问 $message
const instance = getCurrentInstance()
if (!instance) {
  throw new Error('getCurrentInstance() returned null')
}
const proxy = instance.proxy

// 响应式数据
const searchValue = ref('')

// 处理搜索
const handleSearch = () => {
  emit('search', searchValue.value.trim())
}

const handleHelp = () => {
  helpModalRef.value.showModal = true
}
</script>

<style scoped>
.search-section {
  display: flex;
  justify-content: center;
  padding: 0 5px;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 112, 107, 0.1);
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  width: 100%;
}

.search-container:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.search-input {
  flex: 1;
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(0, 112, 107, 0.15);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: rgba(255, 255, 255, 0.7);
  color: var(--color-primary);
  transition: all 0.3s ease;
  font-weight: 500;
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.search-input::placeholder {
  color: color-mix(in srgb, var(--color-primary) 50%, #999);
}

.search-button {
  height: 44px;
  padding: 0 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 112, 107, 0.2);
  position: relative;
  overflow: hidden;
}

.search-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.search-button:hover::before {
  left: 100%;
}

.search-button:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 112, 107, 0.3);
  background: color-mix(in srgb, var(--color-primary) 90%, #004d4a);
}
</style>
