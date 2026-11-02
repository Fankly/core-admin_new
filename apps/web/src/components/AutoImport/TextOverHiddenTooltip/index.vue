<template>
  <!-- <div class="text-container__wrapper" @mouseenter="() => checkOverflow()" @mouseleave="() => checkOverflow()"> -->
  <!-- <div ref="container" class="text-container" > -->
  <div :style="varCss" ref="contentRefWrapper" class="text-container__wrapper" @mouseover="isShowTooltip">
    <el-tooltip :popper-class="`base-overflow-tooltip ${appendClass}`" placement="top" :content="text + ''" :disabled="!isShow && !alwaysShow">
      <div :class="`${wrapNumber == 1 ? 'simple-content' : 'multiline-content'} ${link ? 'is-link' : ''}`" :style="{ width: width, height: height }">
        <span v-if="$slots.default" ref="contentRef"><slot></slot></span>
        <span @click="() => link?.()" v-else ref="contentRef">{{ text }}</span>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup>
import { nextTick, reactive, toRef, toRefs, computed, watch, useTemplateRef } from 'vue'
defineOptions({
  name: 'TextOverHiddenTooltip'
})
const componentProps = defineProps({
  // 允许跨几行
  wrapNumber: {
    type: Number,
    default: 1
  },
  text: {
    type: [String, Number],
    default: ''
  },
  alwaysShow: {
    type: Boolean
  },
  appendClass: {
    type: String
  },
  link: {
    type: Function,
    default: null
  }
})
const contentRefWrapperRef = useTemplateRef('contentRefWrapper')
const contentRefRef = useTemplateRef('contentRef')
const componentData = reactive({
  isShow: false,
  width: undefined,
  height: undefined
})
const isShow = toRef(componentData, 'isShow')
const width = toRef(componentData, 'width')
const height = toRef(componentData, 'height')
function isShowTooltip() {
  componentData.width = contentRefWrapperRef.value?.offsetWidth
  componentData.height = contentRefWrapperRef.value?.offsetWidth
  nextTick(() => {
    if (componentProps.wrapNumber == 1) {
      const contentWidth = contentRefRef.value.offsetWidth
      const containerWidth = contentRefRef.value.parentElement.offsetWidth
      componentData.isShow = contentWidth > containerWidth
    } else {
      const contentHeight = contentRefRef.value.offsetHeight
      const containerHeight = contentRefRef.value.parentElement.offsetHeight
      componentData.isShow = contentHeight > containerHeight
    }
  })
}
const varCss = computed(() => {
  return {
    '--wrapNumber': componentProps.wrapNumber ? componentProps.wrapNumber * 1 : 1
  }
})
watch(
  () => componentProps.text,
  function () {
    // this.checkOverflow()
  }
)
defineExpose({
  isShowTooltip,
  ...toRefs(componentData),
  varCss
})
</script>

<style scoped lang="less">
.text-container__wrapper {
  flex: 1;
  overflow: hidden;
  word-break: break-all;
}
.simple-content {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.is-link {
  color: @--color-primary;
  text-decoration: underline;
  cursor: pointer;
}
.multiline-content {
  .textoverflow(var(--wrapNumber));
}
</style>
