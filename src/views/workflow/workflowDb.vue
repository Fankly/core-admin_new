<template>
  <div class="operation">
    <el-button type="primary" plain size="mini" @click="notifyHandle">知道了</el-button>
    <el-button type="primary" plain size="mini" @click="closeHandle">关闭</el-button>
  </div>
  <div class="msg" v-html="message"></div>
</template>

<script lang="ts">
export default {
  name: 'workflowDb'
}
</script>
<script setup lang="ts">
import { notify } from '@/api/workflow'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const message = ref('')
const workItemId = ref('')

onMounted(() => {
  document.querySelector('body')?.setAttribute('style', 'height: 100vh;background-color: white;}')
  document.querySelector('html')?.setAttribute('style', 'height: 100vh;background-color: white;}')
  document.querySelector('#app')?.setAttribute('style', 'height: 100vh;background-color: white;}')
  document.querySelector('.rr-fullscreen')?.setAttribute('style', 'height: 100vh;background-color: white;}')
  if (route.query) {
    message.value = route.query.message as string
    workItemId.value = route.query.workItemId as string
  }
})

const closeHandle = () => {
  try {
    window.parent.Appframe.closePopWindow(window)
  } catch (e) {
    window.parent.postMessage('close', '*')
  }
}

const notifyHandle = async () => {
  let res = await notify(workItemId.value)
  if (res.success) {
    closeHandle()
  } else {
    ElMessage.error(res.msg)
  }
}
</script>

<style scoped lang="less">
.msg {
  font-size: 16px;
  margin-top: 20px;
}
</style>
