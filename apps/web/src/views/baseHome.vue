<template>
  <div class="home">
    <p class="rr-header-ctx-logo-text">项目过程管控平台</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'

interface SysInfo {
  osName: string
  osVersion: string
  osArch: string
  processors: number
  totalPhysical: number
  freePhysical: number
  memoryRate: number
  userLanguage: string
  jvmName: string
  javaVersion: string
  javaHome: string
  userDir: string
  javaTotalMemory: number
  javaFreeMemory: number
  javaMaxMemory: number
  userName: string
  systemCpuLoad: number
  userTimezone: string
}

const sysInfo = ref<SysInfo>({
  osName: '',
  osVersion: '',
  osArch: '',
  processors: 0,
  totalPhysical: 0,
  freePhysical: 0,
  memoryRate: 0,
  userLanguage: '',
  jvmName: '',
  javaVersion: '',
  javaHome: '',
  userDir: '',
  javaTotalMemory: 0,
  javaFreeMemory: 0,
  javaMaxMemory: 0,
  userName: '',
  systemCpuLoad: 0,
  userTimezone: ''
})

const getSysInfo = () => {
  baseService.get('/sys/info').then((res) => {
    if (res.code !== 0) {
      return ElMessage.error(res.msg)
    }
    sysInfo.value = res.data
  })
}

// 原选项式的 created 逻辑，同步发起即可
getSysInfo()
</script>

<style lang="less" scoped>
.home {
  p {
    text-align: center;
    line-height: 67vh;
    font-size: 2.5rem;
  }
}

.mod-home {
  table {
    width: 100%;
    border: 1px solid #ebeef5;
    border-collapse: collapse;

    th,
    td {
      padding: 12px 10px;
      border: 1px solid #ebeef5;
    }

    th {
      width: 30%;
    }
  }
}
</style>
