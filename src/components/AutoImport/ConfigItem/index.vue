<template>
  <div class="config-item">
    <slot v-if="resolved.slot" :scope="{ ...(scope || {}), row: model }" />
    <component
      :is="resolved.tag"
      v-else
      ref="objectRef"
      v-model="model"
      v-bind="bindAttrs"
      :class="customClass"
      :style="customStyle"
      :placeholder="placeholder"
      v-on="resolved.listeners || {}"
    >
      <template v-if="resolved.itemSlot">
        {{ resolved.itemSlot }}
      </template>
    </component>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, ref, watch } from 'vue'
import BASIC from './BASIC'

export interface ConfigItemOption {
  tag?: string
  label?: string
  slot?: boolean
  itemSlot?: string
  value?: unknown
  attrs?: Record<string, unknown> & { placeholder?: string; props?: Record<string, unknown> }
  listeners?: Record<string, (...args: unknown[]) => unknown>
  getAttrs?: (model: unknown) => Record<string, unknown>
  [key: string]: unknown
}

interface ResolvedOption {
  tag: string
  attrs: Record<string, unknown> & { placeholder?: string }
  listeners?: Record<string, (...args: unknown[]) => unknown>
  slot?: boolean
  itemSlot?: string
  value?: unknown
  label?: string
}

export default defineComponent({
  name: 'ConfigItem',
  inheritAttrs: false,
  props: {
    scope: {
      type: Object,
      default: undefined
    },
    option: {
      type: Object,
      required: true
    },
    modelValue: {
      default: undefined
    },
    customClass: {
      type: String,
      default: undefined
    },
    customStyle: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:modelValue', 'update:objectRef'],
  setup(props, { attrs, emit }) {
    const model = ref<unknown>(undefined)
    const objectRef = ref<unknown>(null)
    const formAttrs = attrs as { disabled?: boolean; readonly?: boolean }

    const computeFormItem = (option: ConfigItemOption, m: unknown): ResolvedOption => {
      const tag = option.tag || 'input'
      const meta = BASIC[tag]
      const { attrs: optAttrs = {}, listeners: optListeners = {}, ...other } = option

      const merged: ResolvedOption = {
        ...other,
        tag: meta?.component || tag,
        attrs: {
          ...(meta?.attrs ?? {}),
          ...optAttrs,
          defaultProps: optAttrs.props
        },
        listeners: {
          ...(meta?.listeners ?? {}),
          ...optListeners
        }
      }

      if (option.getAttrs) {
        merged.attrs = { ...merged.attrs, ...option.getAttrs(m) }
      }
      if (!optAttrs?.placeholder) {
        merged.attrs.placeholder = `${merged.attrs.placeholder ?? ''}${option.label ?? ''}`
      }
      return merged
    }

    const resolved = computed<ResolvedOption>(() => computeFormItem(props.option as ConfigItemOption, props.modelValue))

    const bindAttrs = computed(() => ({ ...resolved.value.attrs }))

    const placeholder = computed<string>(() => {
      if (formAttrs.disabled || formAttrs.readonly) return ''
      return (resolved.value.attrs.placeholder as string) ?? ''
    })

    watch(
      resolved,
      (item) => {
        if (item.slot) return
        let next: unknown = null
        if (props.modelValue != null) next = props.modelValue
        else if (item.value != null) next = item.value
        if (typeof next === 'string') next = next.trim()
        model.value = next
        emit('update:modelValue', model.value)
      },
      { immediate: true }
    )

    watch(
      model,
      (val) => {
        emit('update:modelValue', val)
      },
      { deep: true }
    )

    watch(
      () => props.modelValue,
      (val) => {
        if (val !== model.value) model.value = val
      }
    )

    onMounted(() => {
      nextTick(() => {
        emit('update:objectRef', objectRef.value)
      })
    })

    return {
      bindAttrs,
      model,
      objectRef,
      placeholder,
      resolved
    }
  }
})
</script>

<style lang="less" scoped>
.config-item {
  width: 100%;
}
</style>
