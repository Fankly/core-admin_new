<template>
  <div ref="scrollbar-wrapper" class="base-scrollbar">
    <el-scrollbar ref="scrollbar">
      <div class="scrollbarRows" ref="scrollbarRows">
        <slot />
      </div>
    </el-scrollbar>
  </div>
</template>
<script setup>
import _ from 'lodash'
import { nextTick, reactive, toRef, toRefs, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
defineOptions({
  name: 'BaseScrollbar'
})
const scrollbarWrapperRef = useTemplateRef('scrollbar-wrapper')
const scrollbarRowsRef = useTemplateRef('scrollbarRows')
const scrollbarRef = useTemplateRef('scrollbar')
const componentData = reactive({
  resizeObserver: undefined
})
const resizeObserver = toRef(componentData, 'resizeObserver')
componentData.throttleUpDate = undefined
const throttleUpDate = toRef(componentData, 'throttleUpDate')
componentData.mutationObserver = undefined
const mutationObserver = toRef(componentData, 'mutationObserver')
function onChildNodesChange() {
  componentData.throttleUpDate()
}
function initMutationObserver() {
  componentData.mutationObserver = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      if (mutation.type === 'childList') {
        onChildNodesChange(mutation)
      }
    }
  })
  const config = {
    childList: true,
    subtree: true
  }
  componentData.mutationObserver.observe(scrollbarRowsRef.value, config)
}
function listenUpdate() {
  nextTick(() => {
    componentData.resizeObserver = new ResizeObserver(onChildNodesChange)
    if (scrollbarWrapperRef.value) componentData.resizeObserver.observe(scrollbarWrapperRef.value)
  })
}
function update() {
  nextTick(() => {
    if (scrollbarRef.value) {
      scrollbarRef.value.update()
    }
  })
}
function scrollToBottom() {
  const scrollbar = scrollbarRef.value
  scrollbar.$el.querySelector('.el-scrollbar__wrap').scrollTop = scrollbar.$el.querySelector('.el-scrollbar__wrap').scrollHeight
}
onMounted(() => {
  listenUpdate()
  update()
  initMutationObserver()
})
onBeforeUnmount(() => {
  componentData.resizeObserver?.disconnect()
  componentData.mutationObserver?.disconnect()
  componentData.throttleUpDate?.cancel()
})
;(() => {
  componentData.throttleUpDate = _.throttle(update, 100)
})()
defineExpose({
  onChildNodesChange,
  initMutationObserver,
  listenUpdate,
  update,
  scrollToBottom,
  ...toRefs(componentData)
})
</script>
<style lang="less" scoped>
.base-scrollbar {
  width: 100%;
  height: 100%;
  overflow: hidden;

  .scrollbarRows {
    // height: 100%;
    // position: relative;
  }
  :deep(.el-scrollbar__view) {
    height: auto;
  }

  //  .child {
  //     position: absolute;
  //     top: 0;
  //     left: 0;
  //     right: 0;
  //     bottom: 0;
  //   }

  .el-scrollbar {
    width: 100%;
    height: 100%;
  }
}
</style>
