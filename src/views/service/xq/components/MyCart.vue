<template>
  <vxe-modal
    @show="showHandle"
    :destroy-on-close="true"
    show-zoom
    resize
    fullscreen
    title="集中修改及提报"
    position="center"
    width="80%"
    height="800"
    v-model="isShowModal"
    class-name="myCart"
  >
    <RequirementCartWorkbench ref="workbenchRef" :userInfo="userInfo" />
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'MyCart'
}
</script>
<script setup lang="ts">
import RequirementCartWorkbench from '@/views/service/xq/components/RequirementCartWorkbench.vue'
import { nextTick, ref } from 'vue'

const props = defineProps({
  userInfo: {
    type: Object as any,
    required: true
  }
})

const isShowModal = ref(false)
const workbenchRef = ref<InstanceType<typeof RequirementCartWorkbench>>()

const showHandle = async () => {
  await nextTick()
  await workbenchRef.value?.reload()
}

defineExpose({
  isShowModal
})
</script>

<style scoped lang="less">
:deep(.requirement-cart-workbench) {
  .opeartion {
    padding: 10px;
    margin-bottom: 0;
  }
}
</style>
