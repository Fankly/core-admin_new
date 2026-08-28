<template>
  <div class="configSteps">
    <el-steps :active="value" align-center>
      <el-step
        :class="`${status == 'error' ? (index + 1 == value - 1 ? 'errorStatus--color' : '') : index + 1 > value - 1 ? 'is-wait--color' : ''}`"
        :status="item.status"
        :key="index"
        v-for="(item, index) of _options"
        :title="item.title"
        :description="item.description"
      >
        <template v-slot:description>
          <span>{{ item.description || '' }}<br v-if="item.description && item.subDescription" />{{ item.subDescription || '' }}</span>
        </template>
      </el-step>
    </el-steps>
  </div>
</template>
<script>
export default {
  components: {},
  props: {
    options: {
      type: Array,
      default: () => []
    },
    value: {
      type: Number,
      default: 0
    },
    status: {
      type: String
    }
  },
  name: 'configSteps',
  data() {
    return {}
  },
  created() {},
  mounted() {},
  methods: {},
  computed: {
    _options() {
      return this.options.map((item, index) => {
        let status = ''
        if (this.value > index + 1) {
          status = 'success'
        }
        if (this.value == index + 1) {
          status = this.status
        }
        return {
          ...item,
          status
        }
      })
    }
  },
  watch: {}
}
</script>
<style lang="less" scoped>
.configSteps {
  :deep(.el-step__line) {
    top: 25px !important;
  }
  :deep(.is-process) {
    &.el-step__title {
      font-weight: 400;
      color: #999999;
    }
    .is-text {
      color: @color-primary-light-7;
      border-color: @color-primary-light-7;
    }
  }
  :deep(.el-step__icon) {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
  :deep(.is-success) {
    color: @color-primary;
    border-color: @color-primary;
    .el-step__icon-inner {
      color: #fff;
    }
    .el-step__icon {
      background: @color-primary;
    }
  }
  :deep(.el-step__title) {
    color: #000000;
  }
  :deep(.el-step__description) {
    color: #999999;
  }
  :deep(.el-step__line) {
    background-color: @color-primary-light-7;
  }
  :deep(.is-wait) {
    color: @color-primary-light-7;
    border-color: @color-primary-light-7;
    &.el-step__title {
      color: #999999;
    }
    .el-step__line {
      background-color: @color-primary-light-7;
    }
  }
  .is-wait--color {
    :deep(.el-step__line) {
      border-color: @color-primary-light-7;
      background-color: @color-primary-light-7;
    }
    :deep(.is-process) {
      color: #999999;
      .el-step__icon {
        color: @color-primary-light-7;
        border-color: @color-primary-light-7;
      }
      .el-step__description {
        color: #999999;
      }
    }
  }
  .errorStatus--color {
    :deep(.el-step__line) {
      border-color: #f86163;
      background-color: transparent;
      .el-step__line-inner {
        border-style: dashed;
      }
    }
  }
}
</style>
