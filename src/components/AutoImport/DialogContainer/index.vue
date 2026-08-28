<template>
  <div class="dialogContainer">
    <div :class="{ ...bodyClass, dialogContainer__body: true, disabledOverflowX: disabledOverflowX }" :style="bodyStyle">
      <base-scrollbar ref="scrollbarRef" v-if="!disabledScroll">
        <div :style="{ ...bodyWapperStyle }" class="dialogContainer__body--wrapper">
          <slot />
        </div>
      </base-scrollbar>
      <slot v-else />
    </div>
    <el-row v-if="!readOnly" type="flex" justify="end" class="dialog-btn-layer dialog--floorStyle">
      <el-button
        v-show="item.show == null || item.show == true"
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
    bodyWapperStyle: {
      type: Object,
      default: () => {}
    },
    onCancel: {
      type: Function,
      default: () => {}
    },
    onSubmit: {
      type: Function,
      default: () => {}
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
    disabledScroll: {
      type: Boolean,
      default: false
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    disabledSubmit: {
      type: Boolean,
      default: false
    },
    bodyClass: {
      type: Object,
      default: () => ({})
    },
    bodyStyle: {
      type: Object,
      default: () => ({})
    },
    disabledOverflowX: {
      type: Boolean,
      default: true
    },
    appendButtons: {
      type: Array,
      default: () => []
    },
    hiddenButton: {
      type: Boolean
    },
    hiddenCancel: {
      type: Boolean
    },
    cancelLoading: {
      type: Boolean
    },
    submitLoading: {
      type: Boolean
    }
  },
  name: 'dialogContainer',
  data() {
    return {}
  },
  created() {},
  mounted() {},
  methods: {
    scrollToBottom() {
      this.$refs.scrollbarRef.scrollToBottom()
    }
  },
  computed: {
    defaultButtons() {
      return [
        {
          key: 'cancel',
          show: !this.hiddenCancel,
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
.dialogContainer {
  :deep(.el-scrollbar__bar.is-horizontal) {
    display: none;
  }
  :deep(.el-scrollbar__view) {
    height: 100%;
  }
  .disabledOverflowX {
    :deep(.el-scrollbar__wrap) {
      overflow-x: hidden;
      margin-bottom: 0 !important;
    }
  }
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  &__body {
    margin-top: 25px;
    margin-bottom: 20px;
    flex: 1;
    overflow: hidden;
    &--wrapper {
      margin: 0 30px 0 10px;
      height: 100%;
    }
  }
  .dialog-btn-layer {
    padding-right: 10px;
  }
  .dialog--floorStyle {
    height: 54px;
    background: #ffffff;
    border-radius: 0px 0px 2px 2px;
    box-shadow: 0px -3px 6px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: 0;
    .dialog--button {
      padding: 8px 37px;
      & + .dialog--button {
        margin-left: 20px;
      }
    }
  }
}
</style>
