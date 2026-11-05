<script lang="ts">
import { cloneVNode, defineComponent, h, ref } from 'vue'
import { ElTooltip } from 'element-plus'

export default defineComponent({
  props: { content: { type: String, required: true } },
  setup(props, { slots }) {
    const isOverflow = ref(false)
    const checkOverflow = (event: Event) => {
      const trigger = event.currentTarget as HTMLElement
      const value = trigger.querySelector('strong') || trigger
      isOverflow.value = value.scrollWidth > value.clientWidth + 1
    }
    // 直接复用原触发节点，避免额外包裹层改变金额的 Flex / Grid 省略布局。
    return () =>
      h(
        ElTooltip,
        { content: props.content, disabled: !isOverflow.value, effect: 'light', placement: 'top', popperClass: 'overview-value-tooltip' },
        { default: () => slots.default?.().map((node) => cloneVNode(node, { onMouseover: checkOverflow, onFocus: checkOverflow }, true)) }
      )
  }
})
</script>

<style lang="less">
.overview-value-tooltip.el-popper {
  box-sizing: border-box;
  max-width: min(480px, calc(100vw - 32px));
  color: #334155;
  white-space: normal;
  overflow-wrap: anywhere;
  border-color: #dfe7eb;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.14);
}
</style>
