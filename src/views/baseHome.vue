<template>
  <div class="home">
    <p class="rr-header-ctx-logo-text">项目过程管控平台</p>
  </div>
</template>

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

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'

export default defineComponent({
  setup() {
    return reactive({
      sysInfo: {
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
      }
    })
  },
  created() {
    this.getSysInfo()
  },
  methods: {
    getSysInfo() {
      baseService.get('/sys/info').then((res) => {
        if (res.code !== 0) {
          return this.$message.error(res.msg)
        }
        this.sysInfo = res.data
      })
    }
  }
})
</script>
