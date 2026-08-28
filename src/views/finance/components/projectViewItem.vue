<template>
  <div class="projectViewItem">
    <div :id="item.value" :key="item.value" v-for="item in keyValues.filter((item) => item)" :class="`title-group ${itemRateColor[item.value]}`">
      <div class="main-title">
        {{ item.name }}
        <span v-if="diffData && diffData?.[item.rateProp] != null && diffData?.[item.rateProp] != 0" class="neglect__text color__tip context"
          >{{ diffData?.[item.rateProp] }}分</span
        >
        <slot :name="`${item.value}LabelSlot`" />
      </div>
      <div class="subtitle">
        <!-- danger--color -->
        <template v-if="!item.slot">
          {{ dataValue?.[item.value] || '无' }}
        </template>
        <template v-else>
          <slot :name="item.value" :scope="{ row: dataValue?.[item.value] }" />
        </template>
      </div>
      <div v-if="showSec && item.showSec" :class="['secondary-text', getSecTextClass(item, diffData)]">
        <!-- 左侧文本 -->
        <span class="sec-content" v-html="diffData?.[item.secTextProp] || '无数据'"></span>
        <!-- 右侧半透明操作按钮，通过 emit 抛出事件给父级 -->
        <span v-if="showRerunBtn" class="sec-rerun-btn" @click="$emit('onRerun', item)"> <i class="el-icon-refresh-right"></i> 重新分析 </span>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  components: {},
  props: {
    keyValues: {
      type: Array
    },
    dataValue: {
      type: Object
    },
    diffData: {
      type: Object
    },
    showSec: {
      type: Boolean
    }
  },
  name: 'projectViewItem',
  data() {
    return {}
  },
  created() {},
  mounted() {},
  methods: {
    getColor(number) {
      // let colorString = 'success--text--color';
      // if (+number >= 90) {
      //   colorString = 'danger--text--color'
      // } else if (+number >= 70) {
      //   colorString = 'warning--text--color'
      // }
      let colorString = 'danger--text--color'
      return colorString
    },
    getSecTextClass(item, diffData) {
      const typeMap = {
        danger: 'sec-text--danger',
        warning: 'sec-text--warning',
        success: 'sec-text--success',
        info: 'sec-text--info',
        default: 'sec-text--default'
      }

      let colorType = item.secColorType

      // 如果 secColorType 是函数，调用函数获取颜色类型
      if (typeof colorType === 'function') {
        colorType = colorType(diffData)
      }

      // 如果 secColorType 是对象，根据条件判断
      if (typeof colorType === 'object' && colorType !== null) {
        // 可以扩展对象格式的判断逻辑
        colorType = colorType.default || 'default'
      }

      return typeMap[colorType] || typeMap['info']
    }
  },
  computed: {
    showRerunBtn() {
      return this.getUserInfo?.loginName === 'yunwei' || this.getUserInfo?.isAdmin || this.showRerunBtnTest
    },
    itemRateColor() {
      if (this.diffData) {
        return this.keyValues
          .filter((item) => item)
          .filter((item) => item.rateProp)
          .reduce((obj, next) => {
            obj[next.value] = this.getColor(this.diffData?.[next.rateProp])
            return obj
          }, {})
      }
      return {}
    },
    ...mapGetters(['getCurrentMenuId', 'getUserInfo'])
  },
  watch: {}
}
</script>
<style lang="less" scoped>
.title-group {
  &:not(:last-child) {
    margin-bottom: 14px;
  }
}

.main-title {
  font-size: 16px;
  font-weight: 700;
  color: @color-primary;
  margin-bottom: 8px;
  line-height: 1.2;
  position: relative;
}

.subtitle {
  font-size: 14px;
  font-weight: 400;
  color: #666;
  line-height: 1.6;
  opacity: 0.9;
  white-space: pre-wrap;
}

:deep(.text--item) {
  display: flex;
  align-items: flex-start;
  flex: 1;
  label {
    white-space: nowrap;
  }
  span {
    flex: 1; /* 让 span 自动换行 */
    word-break: break-word; /* 允许长单词换行 */
  }
  &:not(:first-child) {
    margin-top: 5px;
  }
}

.color__tip {
  margin-left: 0px;
}

.projectViewItem {
  .primary--text--color {
    :deep(.context) {
      color: @color-primary !important;
    }
  }
  .danger--text--color {
    :deep(.context) {
      color: @color-danger !important;
    }
  }
  .success--text--color {
    :deep(.context) {
      color: @color-success !important;
    }
  }
  .warning--text--color {
    :deep(.context) {
      color: @color-warning !important;
    }
  }
}

.secondary-text {
  font-size: 0.875rem;
  line-height: 1.6;
  padding: 0.75rem 1rem;
  margin: 0.75rem 0;
  border-radius: 6px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  border-left: 3px solid transparent;
  transition: background-color 0.2s ease;

  /* === 新增：让文本和按钮左右排布 === */
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* 顶部对齐，防止长文本撑开时按钮垂直居中显得怪异 */
  gap: 16px;
}

/* === 新增：左侧内容区域，占据剩余空间 === */
.sec-content {
  flex: 1;
  margin: auto;
}

/* === 新增：右侧常态半透明按钮样式 === */
.sec-rerun-btn {
  flex-shrink: 0; /* 防止被左侧长文本挤压变形 */
  font-size: 12px;
  padding: 3px 12px;
  border-radius: 4px;
  border: 1px solid currentColor; /* 利用currentColor自动继承当前提示框的文字颜色 */
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  opacity: 0.4; /* 常态半透明 */
  transition: opacity 0.3s ease, background-color 0.2s ease;
  margin-top: 2px; /* 微调与首行文字的对齐 */

  &:hover {
    opacity: 1; /* 鼠标悬浮完全显示 */
    background-color: rgba(0, 0, 0, 0.04); /* 增加极微弱的遮罩反馈 */
  }
}

/* 风险/警告类 - 红色系 */
.secondary-text.sec-text--danger {
  color: #991b1b;
  background-color: #fef2f2;
  border-left-color: #fecaca;
}
.secondary-text.sec-text--danger:hover {
  background-color: #fee2e2;
}

/* 提示/注意类 - 橙色系 */
.secondary-text.sec-text--warning {
  color: #92400e;
  background-color: #fffbeb;
  border-left-color: #fde68a;
}
.secondary-text.sec-text--warning:hover {
  background-color: #fef3c7;
}

/* 成功/正常类 - 绿色系 */
.secondary-text.sec-text--success {
  color: #166534;
  background-color: #f0fdf4;
  border-left-color: #bbf7d0;
}
.secondary-text.sec-text--success:hover {
  background-color: #dcfce7;
}

/* 信息/说明类 - 蓝色系 */
.secondary-text.sec-text--info {
  color: #1e40af;
  background-color: #eff6ff;
  border-left-color: #bfdbfe;
}
.secondary-text.sec-text--info:hover {
  background-color: #dbeafe;
}

/* 默认 - 灰色系 */
.secondary-text.sec-text--default {
  color: #4b5563;
  background-color: #f9fafb;
  border-left-color: #e5e7eb;
}
.secondary-text.sec-text--default:hover {
  background-color: #f3f4f6;
}

/* 强调副文本中的关键词 */
.secondary-text strong {
  font-weight: 600;
}

/* 结合图标使用的样式 */
.secondary-text.with-icon {
  display: flex;
  align-items: flex-start;
}

.secondary-text.with-icon i {
  margin-right: 0.6rem;
  margin-top: 0.1rem;
  color: inherit;
  opacity: 0.7;
}
</style>
