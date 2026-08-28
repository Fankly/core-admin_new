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

<script>
export default {
  name: 'TextOverHiddenTooltip',
  props: {
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
  },
  data() {
    return {
      isShow: false,
      width: undefined,
      height: undefined
    }
  },
  watch: {
    text() {
      // this.checkOverflow()
    }
  },
  mounted() {},
  computed: {
    varCss() {
      return {
        '--wrapNumber': this.wrapNumber ? this.wrapNumber * 1 : 1
      }
    }
  },
  methods: {
    isShowTooltip() {
      this.width = this.$refs.contentRefWrapper?.offsetWidth
      this.height = this.$refs.contentRefWrapper?.offsetWidth
      this.$nextTick(() => {
        if (this.wrapNumber == 1) {
          const contentWidth = this.$refs.contentRef.offsetWidth
          const containerWidth = this.$refs.contentRef.parentElement.offsetWidth
          this.isShow = contentWidth > containerWidth
        } else {
          const contentHeight = this.$refs.contentRef.offsetHeight
          const containerHeight = this.$refs.contentRef.parentElement.offsetHeight
          this.isShow = contentHeight > containerHeight
        }
      })
    }
  }
}
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
  color: @color-primary;
  text-decoration: underline;
  cursor: pointer;
}
.multiline-content {
  .textoverflow(var(--wrapNumber));
}
</style>
