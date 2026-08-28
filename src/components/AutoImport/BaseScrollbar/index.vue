<template>
  <div ref="scrollbar-wrapper" class="base-scrollbar">
    <el-scrollbar ref="scrollbar">
      <div class="scrollbarRows" ref="scrollbarRows">
        <slot />
      </div>
    </el-scrollbar>
  </div>
</template>
<script>
import _ from 'lodash'

export default {
  components: {},
  props: {},
  name: 'BaseScrollbar',
  data() {
    return {
      resizeObserver: undefined
    }
  },
  created() {
    this.throttleUpDate = _.throttle(this.update, 100)
  },
  mounted() {
    this.listenUpdate()
    this.update()
    this.initMutationObserver()
  },
  methods: {
    onChildNodesChange() {
      this.throttleUpDate()
    },
    initMutationObserver() {
      this.mutationObserver = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
          if (mutation.type === 'childList') {
            this.onChildNodesChange(mutation)
          }
        }
      })
      const config = { childList: true, subtree: true }
      this.mutationObserver.observe(this.$refs.scrollbarRows, config)
    },
    listenUpdate() {
      this.$nextTick(() => {
        this.resizeObserver = new ResizeObserver(this.onChildNodesChange)
        this.resizeObserver.observe(this.$refs['scrollbar-wrapper'])
      })
    },
    update() {
      this.$nextTick(() => {
        if (this.$refs.scrollbar) {
          this.$refs.scrollbar.update()
        }
      })
    },
    scrollToBottom() {
      const scrollbar = this.$refs.scrollbar
      scrollbar.$el.querySelector('.el-scrollbar__wrap').scrollTop = scrollbar.$el.querySelector('.el-scrollbar__wrap').scrollHeight
    }
  },
  beforeUnmount() {
    this.resizeObserver.disconnect()
  },
  computed: {},
  watch: {}
}
</script>
<style lang="scss" scoped>
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
