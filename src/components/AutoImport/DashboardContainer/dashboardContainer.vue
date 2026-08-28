<template>
  <div :class="['dashboardContainer', { close: !itemShow, circleIcon }]">
    <div class="dashboardContainer__header" v-if="$slots.header">
      <slot name="header" />
    </div>
    <div
      v-if="title || $slots.extra || extraTitle"
      :class="`${type ? 'dashboardContainer__header dashboardContainer__bottom' : 'dashboardContainer__header'}`"
      :style="{ ...headerStyle }"
    >
      <div v-if="icon" class="icon">
        <i v-if="!isSvgIcon" :class="icon"></i>
        <svg-icon v-else :icon="`svg-${icon}`" />
      </div>
      <div v-if="rectangularIcon" class="rectangularIcon"></div>
      <div class="dashboardContainer__title">
        {{ title }}
        <span class="subTitle" v-if="subTitle">{{ subTitle }}</span>
        <slot name="nameExtra" />
      </div>
      <slot name="extra" />
      <el-button
        v-if="switchIcon"
        @click="itemShow = !itemShow"
        type="text"
        :icon="itemShow ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"
        style="font-size: 20px"
      ></el-button>
      <span v-if="!$slots.extra" class="titleExtra">{{ extraTitle }}</span>
    </div>
    <div class="dashboardContainer__body" :style="{ flex: auto ? '' : 'unset', ...bodyStyle }">
      <slot name="body-extra" />
      <div
        v-loading="loading"
        :class="['dashboardContainer__body-main', { 'dashboardContainer__body-main--auto': auto }]"
        :style="'position: relative;' + (overflowAuto == true ? 'overflow: auto;' : '')"
      >
        <el-empty v-show="$slots.default == null || empty" :style="emptyStyle" class="small-empty empty"></el-empty>
        <slot v-if="$slots.default != null" />
      </div>
    </div>
  </div>
</template>
<script>
export default {
  components: {},
  props: {
    overflowAuto: {
      type: Boolean,
      default: false
    },
    switchIcon: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    subTitle: {
      type: String,
      default: ''
    },
    bodyStyle: {
      type: Object,
      default: () => {}
    },
    headerStyle: {
      type: Object,
      default: () => {}
    },
    icon: {
      type: String,
      default: undefined
    },
    rectangularIcon: {
      type: Boolean,
      default: false
    },
    circleIcon: {
      type: Boolean,
      default: false
    },
    isSvgIcon: {
      type: Boolean
    },
    extraTitle: {
      type: String,
      default: undefined
    },
    loading: {
      type: Boolean,
      default: false
    },
    emptyStyle: {
      type: [String, Object],
      default: undefined
    },
    empty: {
      type: Boolean,
      default: false
    },
    auto: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      default: null
    }
  },
  name: 'DashboardContainer',
  data() {
    return {
      itemShow: true
    }
  },
  created() {},
  mounted() {},
  methods: {},
  computed: {},
  watch: {}
}
</script>
<style lang="scss" scoped>
.dashboardContainer {
  overflow: hidden;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  // border-radius: 24px;
  // &:not(:last-of-type) {
  // margin-bottom: 19px;
  // }
  &.close {
    height: 70px !important;
  }
  &__header {
    position: relative;
    // padding: 38px 16px 12px 36px;
    padding: 16px 26px 16px 26px;
    font-size: 18px;
    display: flex;
    align-items: center;
    line-height: 1;
    height: auto;
    color: #0e8b8d;
    // font-size: 24px;
    font-weight: 500;
    text-align: left;
    .icon {
      width: 22px;
      height: 22px;
      margin-right: 5px;
    }
  }
  &__bottom {
    border-bottom: 1px solid;
    padding: 10px !important;
    font-size: 14px;
  }
  &__body {
    flex: 1;
    overflow: hidden;
    padding: 0 22px;
    display: flex;
    flex-direction: column;
  }
  &__body-main {
    min-height: 0;
  }
  &__body-main--auto {
    flex: 1;
  }
  &__title {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }
  .titleExtra {
    color: rgba(127, 127, 127);
    font-size: 12px;
  }
  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
    margin-bottom: 0px !important;
  }
  .rectangularIcon {
    border-width: 0px;
    width: 8px;
    height: 25px;
    background: inherit;
    background-color: rgba(14, 139, 141, 1);
    border: none;
    border-radius: 150px;
    -moz-box-shadow: none;
    -webkit-box-shadow: none;
    box-shadow: none;
    margin-right: 10px;
  }
  &.circleIcon {
    .dashboardContainer__header {
      font-size: 15px;
      padding: 0px 16px 15px;
      .rectangularIcon {
        height: 8px;
        margin-right: 6px;
      }
    }
    .dashboardContainer__body {
      padding: 0px 0px 0px 25px;
    }
  }
  .subTitle {
    color: $--color-text-secondary;
    font-size: 12px;
  }
  :deep(.full--item) {
    .el-form-item__content {
      width: 100%;
    }
  }
}
</style>
