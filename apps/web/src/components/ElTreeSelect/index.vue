<template>
  <el-select
    style="width: 100%"
    ref="select"
    v-model="innerValue"
    v-bind="selectProps"
    :popper-append-to-body="popperAppendToBody"
    :filter-method="filterMethod"
    :popper-class="[popperClass, 'el-tree-select__popper']"
    @visible-change="visibleChange"
    @clear="clearSelected"
    @remove-tag="removeTag"
  >
    <template v-if="multiple || showCheckbox">
      <el-option v-for="(item, index) in selectedOptions" :key="index" :value="item.value" :label="item.label" style="display: none"></el-option>
    </template>
    <el-option v-else-if="innerValue !== ''" :value="innerValue" :label="label" style="display: none"></el-option>
    <el-option
      key="tree-option"
      :value="undefined"
      class="tree-select-option"
      style="height: auto; padding: 0; overflow: visible"
      @click.stop="() => {}"
    >
      <div ref="treeWrapper" class="el-tree-select__tree-wrapper" role="tree" :aria-label="placeholder" tabindex="-1" :style="colorStyle">
        <div class="el-tree-select__container" ref="container">
          <div v-if="$slots.header" class="el-tree-select__header">
            <slot name="header"></slot>
          </div>
          <el-scrollbar v-if="virtualTree" ref="scrollbar" class="el-tree-select__virtual-list" :style="{ height: height + 'px' }">
            <el-tree
              ref="tree"
              v-bind="treeProps"
              :node-key="nodeKey"
              :data="data"
              :props="props"
              :show-checkbox="showCheckbox"
              :default-expanded-keys="defaultExpandedKeys"
              :default-checked-keys="defaultCheckedKeys"
              :expand-on-click-node="expandOnClickNode"
              :check-on-click-node="checkOnClickNode"
              :highlight-current="!showCheckbox"
              :filter-node-method="filterNode"
              @node-click="handleNodeClick"
              @check="handleCheckChange"
            >
            </el-tree>
          </el-scrollbar>
          <el-tree
            v-else
            ref="tree"
            v-bind="treeProps"
            :node-key="nodeKey"
            :data="data"
            :props="props"
            :show-checkbox="showCheckbox"
            :default-expanded-keys="defaultExpandedKeys"
            :default-checked-keys="defaultCheckedKeys"
            :expand-on-click-node="expandOnClickNode"
            :check-on-click-node="checkOnClickNode"
            :highlight-current="!showCheckbox"
            :filter-node-method="filterNode"
            @node-click="handleNodeClick"
            @check="handleCheckChange"
          >
          </el-tree>
          <div v-if="$slots.footer" class="el-tree-select__footer"><slot name="footer"></slot>/</div>
        </div>
      </div>
    </el-option>
  </el-select>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick, onMounted } from 'vue'
import type { PropType } from 'vue'

type TreeSelectValue = string | number | Record<string, any> | Array<string | number | Record<string, any>>

export default defineComponent({
  name: 'ElTreeSelect',
  props: {
    modelValue: {
      type: [String, Number, Array, Object] as PropType<TreeSelectValue>,
      default: ''
    },
    data: {
      type: Array,
      default: () => []
    },
    props: {
      type: Object,
      default: () => ({
        children: 'children',
        label: 'label',
        value: 'value'
      })
    },
    nodeKey: {
      type: String,
      default: 'value'
    },
    multiple: {
      type: Boolean,
      default: false
    },
    showCheckbox: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '请选择'
    },
    filterable: {
      type: Boolean,
      default: false
    },
    allowCreate: {
      type: Boolean,
      default: false
    },
    defaultExpandedKeys: {
      type: Array,
      default: () => []
    },
    defaultCheckedKeys: {
      type: Array,
      default: () => []
    },
    popperClass: {
      type: String,
      default: ''
    },
    height: {
      type: Number,
      default: 300
    },
    virtualTree: {
      type: Boolean,
      default: false
    },
    expandOnClickNode: {
      type: Boolean,
      default: true
    },
    checkOnClickNode: {
      type: Boolean,
      default: true
    },
    collapseTags: {
      type: Boolean,
      default: false
    },
    collapseTagsLimit: {
      type: Number,
      default: 1
    },
    collapseTagsToolTip: {
      type: Boolean,
      default: false
    },
    popperAppendToBody: {
      type: Boolean,
      default: false
    },
    themeColor: {
      type: String,
      default: '#00706b'
    },
    showAllCheckedNodes: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'change', 'clear', 'node-click', 'check'],
  setup(props, { emit, slots, expose }) {
    const select = ref()
    const tree = ref()
    const scrollbar = ref()
    const container = ref()
    const treeWrapper = ref<HTMLElement>()
    const keyword = ref('')

    const preventReopen = ref(false)

    const innerValue = computed<any>({
      get() {
        return props.modelValue
      },
      set(val) {
        emit('update:modelValue', val)
      }
    })

    const label = ref('')

    const selectedOptions = computed(() => {
      if (!Array.isArray(innerValue.value) || innerValue.value.length === 0) {
        return []
      }
      return innerValue.value
        .filter((val) => val !== undefined && val !== null)
        .map((val) => {
          const node = findNodeByValue(props.data, val)
          return {
            value: val,
            label: node ? node[props.props.label] : val
          }
        })
    })

    const selectProps = computed(() => {
      const result = {
        clearable: props.clearable,
        disabled: props.disabled,
        placeholder: props.placeholder,
        filterable: props.filterable,
        'allow-create': props.allowCreate,
        multiple: props.multiple || props.showCheckbox,
        'collapse-tags': props.collapseTags,
        'collapse-tags-tooltip': props.collapseTagsToolTip,
        'collapse-tags-limit': props.collapseTagsLimit,
        'reserve-keyword': true,
        'automatic-dropdown': false,
        'popper-options': {
          modifiers: [
            {
              name: 'computeStyles',
              options: {
                gpuAcceleration: false
              }
            }
          ]
        }
      }
      return result
    })

    const treeProps = computed(() => {
      return {}
    })

    const colorStyle = computed(() => {
      return {
        '--node-selected-color': props.themeColor
      }
    })

    const filterMethod = (val: string) => {
      keyword.value = val
      if (tree.value) {
        tree.value.filter(val)
      }
      return true
    }

    const filterNode = (value: string, data: any) => {
      if (!value) return true
      const label: string = data[props.props.label] || ''
      return label.toString().toLowerCase().includes(value.toLowerCase())
    }

    const visibleChange = (visible: boolean) => {
      if (visible && preventReopen.value) {
        preventReopen.value = false

        if (select.value) {
          select.value.blur()
          select.value.visible = false
        }

        setTimeout(() => {
          preventReopen.value = false
        }, 200)
        return
      }

      if (visible) {
        nextTick(() => {
          setTreeSelected()
          if (select.value && select.value.$el) {
            const selectWidth = select.value.$el.getBoundingClientRect().width
            const dropdownEl = treeWrapper.value?.closest<HTMLElement>('.el-tree-select__popper')
            if (dropdownEl) {
              dropdownEl.style.minWidth = `${selectWidth}px`

              nextTick(() => {
                const selectedItems = dropdownEl.querySelectorAll('.el-tree-dropdown__item.selected')
                selectedItems.forEach((item: any) => {
                  if (!item.classList.contains('tree-select-option')) {
                    item.style.display = 'none'
                  }
                })
              })
            }

            if (treeWrapper.value) {
              treeWrapper.value.setAttribute('tabindex', '0')
              treeWrapper.value.focus()
            }
          }
        })
      } else {
        keyword.value = ''
        if (tree.value) {
          tree.value.filter('')
        }

        nextTick(() => {
          const activeElement = document.activeElement
          if (treeWrapper.value) {
            treeWrapper.value.setAttribute('tabindex', '0')
            const focusableElements = treeWrapper.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
            focusableElements.forEach((el: any) => {
              el.setAttribute('tabindex', '-1')
            })

            if (treeWrapper.value.contains(activeElement)) {
              select.value.$el.querySelector('.el-input__inner').focus()
            }
          }
        })
      }
    }

    const setTreeSelected = () => {
      if (!tree.value) return
      if (props.showCheckbox) {
        if (Array.isArray(innerValue.value) && innerValue.value.length > 0) {
          const filteredValues = innerValue.value.filter((val) => val !== undefined && val !== null)
          tree.value.setCheckedKeys(filteredValues)
        } else {
          tree.value.setCheckedKeys([])
        }
      } else {
        if (innerValue.value) {
          tree.value.setCurrentKey(innerValue.value)
        } else {
          tree.value.setCurrentKey(null)
        }
      }
    }

    const handleNodeClick = (data: any, node: any) => {
      if (props.showCheckbox) return
      if (!node.isLeaf && node.childNodes && node.childNodes.length > 0) return
      const value = data[props.nodeKey]
      innerValue.value = value
      label.value = data[props.props.label]
      emit('change', value, data)
      emit('node-click', data, node)

      const event = window.event || arguments.callee.caller.arguments[0]
      if (event) {
        event.stopPropagation()
        event.preventDefault()
      }
      preventReopen.value = true

      if (props.filterable && select.value) {
        const el = select.value.$el
        if (el) {
          const handle = (e: any) => {
            e.stopPropagation()
            e.preventDefault()
            document.removeEventListener('click', handle, true)
            el.removeEventListener('click', handle, true)
          }

          document.addEventListener('click', handle, true)
          el.addEventListener('click', handle, true)
        }
      }

      if (select.value) {
        if (props.filterable && keyword.value) {
          keyword.value = ''
          if (tree.value) {
            tree.value.filter('')
          }
        }

        setTimeout(() => {
          const inputEl = select.value.$el.querySelector('input')
          if (inputEl) {
            inputEl.blur()
          }

          select.value.visible = false
          select.value.blur()

          setTimeout(() => {
            select.value.visible = false
            select.value.blur()
            setTimeout(() => {
              if (select.value.visible) {
                select.value.visible = false
                select.value.blur()
              }
              setTimeout(() => {
                preventReopen.value = false
              }, 100)
            }, 50)
          }, 50)
        }, 0)
      }
    }

    const handleCheckChange = (data: any, checked: any) => {
      if (!props.showCheckbox) return
      if (tree.value) {
        const checkedNodes = props.showAllCheckedNodes ? tree.value.getCheckedNodes(false) : tree.value.getCheckedNodes(true)

        const values = checkedNodes.map((node: any) => node[props.nodeKey]).filter((value: any) => value !== undefined && value !== null)
        innerValue.value = values

        const labels = checkedNodes
          .filter((node: any) => node[props.nodeKey] !== undefined && node[props.nodeKey] !== null)
          .map((node: any) => node[props.props.label])

        label.value = labels.join(',')

        emit(
          'change',
          values,
          checkedNodes.filter((node: any) => node[props.nodeKey] !== undefined && node[props.nodeKey] !== null)
        )
        emit('check', data, checked)
      }
    }

    const clearSelected = () => {
      innerValue.value = props.multiple || props.showCheckbox ? [] : ''
      label.value = ''

      if (tree.value) {
        if (props.showCheckbox) {
          tree.value.setCurrentKey([])
        } else {
          tree.value.setCurrentKey(null)
        }
      }

      emit('clear')
    }

    const removeTag = (tag: any) => {
      clearSelected()
      emit('change', [], [])
    }

    const findNodeByValue = (data: any, value: any) => {
      if (!data || !data.length) return null
      for (let i = 0; i < data.length; i++) {
        const node = data[i]
        if (node[props.nodeKey].toString() === value.toString()) {
          return node
        }

        if (node[props.props.children] && node[props.props.children].length) {
          const found: any = findNodeByValue(node[props.props.children], value)
          if (found) return found
        }
      }
      return null
    }

    const updateSelected = async () => {
      if (!props.data || !props.data.length) return
      if (props.multiple || props.showCheckbox) {
        if (Array.isArray(innerValue.value) && innerValue.value.length > 0) {
          const validValues = innerValue.value.filter((val) => val !== undefined && val !== null)

          const labels = []
          for (const val of validValues) {
            const node = findNodeByValue(props.data, val)
            if (node) {
              labels.push(node[props.props.label])
            }
          }
          label.value = labels.join(', ')

          if (validValues.length !== innerValue.value.length) {
            innerValue.value = validValues
          }
        } else {
          label.value = ''
        }
      } else {
        if (innerValue.value === undefined || innerValue.value === null) {
          label.value = ''
          innerValue.value = ''
        } else {
          const node = findNodeByValue(props.data, innerValue.value)
          label.value = node ? node[props.props.label] : ''
        }
      }
      await nextTick()
      setTreeSelected()
    }

    watch(keyword, (newValue) => {
      if (newValue === '' && tree.value) {
        tree.value.filter('')
      }
    })

    watch(
      () => props.modelValue,
      () => {
        updateSelected()
      },
      {
        immediate: true
      }
    )

    onMounted(() => {
      updateSelected()

      if (select.value && select.value.$el) {
        const inputEL = select.value.$el.querySelector('input')
        if (inputEL) {
          inputEL.addEventListener(
            'click',
            (e: any) => {
              if (preventReopen.value) {
                e.stopPropagation()
                e.preventDefault()
                setTimeout(() => {
                  preventReopen.value = false
                }, 100)
              }
            },
            true
          )
        }
      }
    })

    expose({
      setCurrentKey: (key: any) => {
        if (tree.value) {
          tree.value.setCurrentKey(key)
          const node = tree.value.getCurrentNode()
          if (node) {
            innerValue.value = node[props.nodeKey]
            label.value = node[props.props.label]
          }
        }
      },
      setCheckedKeys: (keys: any) => {
        if (tree.value && props.showCheckbox) {
          const filteredKeys = Array.isArray(keys) ? keys.filter((key) => key !== undefined && key !== null) : keys
          tree.value.setCheckedKeys(filteredKeys)
          const nodes = props.showAllCheckedNodes ? tree.value.getCheckedNodes(false) : tree.value.getCheckedNodes(true)
          const filteredNodes = nodes.filter((node: any) => node[props.nodeKey] !== undefined && node[props.nodeKey] !== null)
          innerValue.value = filteredNodes.map((node: any) => node[props.nodeKey])
          label.value = filteredNodes.map((node: any) => node[props.props.label]).join(', ')
        }
      },
      getAllCheckedNodes: () => {
        if (tree.value && props.showCheckbox) {
          return tree.value.getCheckedNodes(false)
        }
        return []
      },
      getCheckedKeys: () => {
        if (tree.value && props.showCheckbox) {
          return tree.value.getCheckedKeys()
        }
        return []
      },
      getCheckNodes: () => {
        if (tree.value && props.showCheckbox) {
          return tree.value.getCheckedNodes()
        }
        return []
      },
      getCurrentKey: () => {
        if (tree.value) {
          return tree.value.getCurrentKey()
        }
        return null
      },
      getCurrentNode: () => {
        if (tree.value) {
          return tree.value.getCurrentNode()
        }
        return null
      },
      filter: (val: any) => {
        if (tree.value) {
          return tree.value.filter(val)
        }
      },
      updateKeyChildren: (key: any, val: any) => {
        if (tree.value) {
          tree.value.updateKeyChildren(key, val)
        }
      }
    })

    return {
      select,
      tree,
      scrollbar,
      container,
      treeWrapper,
      innerValue,
      label,
      selectedOptions,
      selectProps,
      treeProps,
      filterMethod,
      filterNode,
      visibleChange,
      handleNodeClick,
      handleCheckChange,
      clearSelected,
      removeTag,
      preventReopen,
      colorStyle
    }
  }
})
</script>

<style scoped>
.el-tree-select__popper {
  max-height: 400px;
}

.el-tree-select__container {
  max-height: 300px;
  overflow-y: auto;
  padding: 6px 0;
}

.el-tree-select__virtual-list {
  height: 300px;
}

.el-tree-select__header,
.el-tree-select__footer {
  padding: 6px 12px;
  box-sizing: border-box;
}

.el-tree-select__header {
  border-bottom: 1px solid #ebeef5;
}

.el-tree-select__footer {
  border-top: 1px solid #ebeef5;
}

.el-select-dropdown__item.is-selected {
  font-weight: normal;
}

.el-select-dropdown__item:hover {
  background-color: transparent;
}

.el-tree-node__content {
  height: 26px;
  line-height: 26px;
}

.el-select-dropdown__wrap {
  max-width: none !important;
}

.el-select-dropdown__item {
  height: auto !important;
  line-height: normal;
  padding: 0 !important;
}

.tree-select-option {
  padding: 0;
  margin: 0;
  display: block;
}

.el-tree-select__popper .el-select-dropdown__list {
  width: 100%;
}

.el-tree-select__popper .el-tree {
  border: none;
  background: transparent;
}

.el-tree-select__popper .el-select-dropdown__item.selected {
  display: none !important;
}

.el-tree-select__popper .el-select-dropdown__item:not(.tree-select-option) {
  display: none !important;
}

.el-tree-select__tree-wrapper {
  width: 100%;
}

.el-tree-select__tree-wrapper .el-tree-node.is-current > .el-tree-node__content {
  color: var(--node-selected-color, #00706b);
  font-weight: bold;
  background-color: rgba(0, 112, 107, 0.05) !important;
  border-radius: 4px;
}

.el-tree-select__tree-wrapper .el-tree-node.is-current > .el-tree-node__content .el-tree-node__label {
  color: var(--node-selected-color, #00706b);
}

.el-tree-select__tree-wrapper .el-tree-node__content:hover {
  background-color: var(--el-select-option-hover-backgroud, #f5f7fa) !important;
}

.el-tree-select__tree-wrapper .el-tree-node.is-checked > .el-tree-node__content {
  background-color: transparent !important;
}

.el-tree-select__tree-wrapper .el-tree-node.is-checked > .el-tree-node__content .el-tree-node__label {
  color: var(--el-text-color-regular, #606266);
}

.el-tree-select__tree-wrapper:focus {
  outline: 2px solid var(--node-selected-color, #00706b);
  outline-offset: -2px;
  border-radius: 4px;
}

.el-tree-select__tree-wrapper:focus:not(:focus-visible) {
  outline: none;
}
</style>
