<template>
  <div class="singleContainer tw-flex tw-flex-column">
    <div class="singleContainer__body tw-flex-1" :style="readOnly ? '' : 'margin-bottom:0'">
      <BaseScrollbar v-if="scrollbar">
        <div style="margin: 16px 0">
          <slot />
        </div>
      </BaseScrollbar>
      <div v-else style="overflow: hidden; height: 100%; margin: 0">
        <slot />
      </div>
    </div>
    <el-row v-if="!readOnly" type="flex" justify="end" class="singleContainer__floor">
      <el-button
        class="dialog--button flat--button"
        :loading="buttonLoading || item.attrs.loading"
        :disabled="item.key == 'submit' && disabledSubmit"
        v-for="(item, index) in defaultButtons"
        :key="index"
        :size="defaultFormItemSize"
        v-bind="item.attrs"
        v-on="item.events"
        >{{ item.label }}</el-button
      >
    </el-row>
  </div>
</template>
<script>
export default {
  components: {},
  props: {
    appendButtons: {
      type: Array,
      default: () => []
    },
    hiddenButton: {
      type: Boolean
    },
    cancelLoading: {
      type: Boolean
    },
    submitLoading: {
      type: Boolean
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    disabledSubmit: {
      type: Boolean,
      default: false
    },
    submitLabel: {
      type: String,
      default: '提交'
    },
    cancelLabel: {
      type: String,
      default: '取消'
    },
    buttonLoading: {
      type: Boolean,
      default: false
    },
    onCancel: {
      type: Function,
      default: () => {}
    },
    onSubmit: {
      type: Function,
      default: () => {}
    },
    scrollbar: {
      type: Boolean,
      default: false
    }
  },
  name: 'singleContainer',
  data() {
    return {}
  },
  created() {},
  mounted() {},
  methods: {},
  computed: {
    defaultButtons() {
      return [
        {
          key: 'cancel',
          label: this.cancelLabel || '取消',
          attrs: {
            plain: true,
            loading: this.cancelLoading
          },
          events: {
            click: () => {
              this.onCancel(false)
            }
          }
        },
        {
          key: 'submit',
          label: this.submitLabel || '确定',
          attrs: {
            disabled: this.disabledSubmit,
            type: 'primary',
            loading: this.submitLoading
          },
          events: {
            click: () => {
              this.onSubmit()
            }
          }
        },
        ...this.appendButtons
      ]
    }
  },
  watch: {}
}
</script>
<style lang="less" scoped>
.singleContainer {
  width: 100%;
  height: 100%;
  padding: 0 !important;
  overflow: hidden;
  &__body {
    overflow: hidden;
    display: flex;
    flex-direction: column;

    :deep(.el-scrollbar__bar.is-horizontal) {
      display: none;
    }
    :deep(.el-scrollbar__wrap) {
      overflow-x: hidden;
      margin-bottom: 0 !important;
    }
  }
  &__floor {
    height: 70px;
    background: #ffffff;
    border-radius: 0 0 5px 5px;
    box-shadow: 0 -3px 6px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: 0;
    margin-left: 16px;
    margin-right: 16px;
    padding: 0 26px;
    .dialog--button {
      padding: 8px 37px;
      & + .dialog--button {
        margin-left: 20px;
      }
    }
  }
}
</style>
