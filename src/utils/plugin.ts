/**
 * 定义一些通用性的自定义指令
 * 在标签名添加 v-** 即可使用
 */
import AutoImport from '@/components/AutoImport'
import httpUtil from '@/core/http'
import globalMixin from '@/core/mixins/global.js'
import * as staticDict from '@/staticDict'
import * as utilsCompat from '@/utils'
import { checkPermission } from '@/utils/utils'
import store from '@/store'

export default (app: any) => {
  app.use(AutoImport)

  app.config.globalProperties.$utils = utilsCompat
  app.config.globalProperties.doUrl = httpUtil.doUrl
  app.config.globalProperties.upload = httpUtil.fetchUpload
  app.config.globalProperties.download = httpUtil.fetchDownload
  app.config.globalProperties.downloadFileName = httpUtil.fetchDownloadFileName
  app.config.globalProperties.loadingManager = httpUtil.loadingManager

  Object.entries(staticDict).forEach(([key, value]) => {
    if (key !== 'DictionaryBase') {
      app.config.globalProperties[key] = value
    }
  })

  app.mixin(globalMixin)

  /***
   * 防抖 单位时间只触发最后一次
   *  @param {?Number|300} time - 间隔时间
   *  @param {Function} fn - 执行事件
   *  @param {?String|"click"} event - 事件类型 例："click"
   *  @param {Array} binding.value - [fn,event,time]
   *  例：<el-button v-debounce="[reset,`click`,300]">刷新</el-button>
   *  也可简写成：<el-button v-debounce="[reset]">刷新</el-button>
   */
  app.directive('debounce', {
    created(el: any, binding: any) {
      const [fn, event = 'click', time = 300] = binding.value
      let timer: any
      el.addEventListener(event, () => {
        timer && clearTimeout(timer)
        timer = setTimeout(() => fn(), time)
      })
    }
  })

  /**
   * 按钮权限指令
   *
   * 权限来源是 store.state.permissions，而它会在切换菜单、返回 keep-alive 缓存页时被重新提交。
   * 所以这里不能只在 mounted 判一次：指令要跟着 store 和绑定值的变化重新求值，
   * 否则缓存页里后挂载的元素（懒加载弹窗、v-if 切出来的内容）会拿上一个页面的权限。
   * 无权限时除了隐藏，还要挡住 pointer-events 与捕获阶段的 click，避免元素仍能被程序化点击。
   */
  const permissionElements = new Set<any>()

  const applyPermission = (el: any) => {
    const state = el.__permissionState
    if (!state) return
    const allowed = checkPermission(store.state.permissions || [], state.value)
    state.allowed = allowed
    el.style.display = allowed ? state.originalDisplay : 'none'
    el.style.pointerEvents = allowed ? state.originalPointerEvents : 'none'
    if (allowed) {
      el.removeAttribute('aria-hidden')
    } else {
      el.setAttribute('aria-hidden', 'true')
    }
  }

  // 全局只订阅一次，避免每个 v-permission 元素都建一个 watcher
  store.watch(
    (state: any) => state.permissions,
    () => permissionElements.forEach(applyPermission)
  )

  app.directive('permission', {
    mounted(el: any, binding: any) {
      if (!binding.value) {
        throw new Error('v-permission 需要指定权限标识')
      }
      const blockEvent = (e: Event) => {
        if (!el.__permissionState?.allowed) {
          e.stopImmediatePropagation()
          e.preventDefault()
        }
      }
      el.__permissionState = {
        value: binding.value,
        allowed: true,
        originalDisplay: el.style.display,
        originalPointerEvents: el.style.pointerEvents,
        blockEvent
      }
      el.addEventListener('click', blockEvent, true)
      permissionElements.add(el)
      applyPermission(el)
    },
    updated(el: any, binding: any) {
      if (!binding.value) {
        throw new Error('v-permission 需要指定权限标识')
      }
      if (!el.__permissionState) return
      el.__permissionState.value = binding.value
      applyPermission(el)
    },
    unmounted(el: any) {
      const state = el.__permissionState
      if (state) el.removeEventListener('click', state.blockEvent, true)
      permissionElements.delete(el)
      delete el.__permissionState
    }
  })

  // 设置选中样式
  app.directive('tableRowSelect', {
    mounted(el: HTMLElement) {
      const initRowSelectHighlight = () => {
        handleElementTable()
        handleVxeTable()
      }

      const handleElementTable = () => {
        const elCheckboxes = el.querySelectorAll('.el-checkbox__input')
        if (elCheckboxes && elCheckboxes.length > 0) {
          elCheckboxes.forEach((checkbox) => {
            checkbox.addEventListener('click', () => {
              setTimeout(() => {
                updateElTableBackgrond()
              }, 0)
            })
          })
          updateElTableBackgrond()
        }
      }

      const handleVxeTable = () => {
        const vxeCheckboxes = el.querySelectorAll('.vxe-cell--checkbox')
        if (vxeCheckboxes && vxeCheckboxes.length > 0) {
          vxeCheckboxes.forEach((checkbox) => {
            checkbox.addEventListener('click', () => {
              setTimeout(() => {
                updateVxeTableBackgrond()
              }, 0)
            })
          })
          updateVxeTableBackgrond()
        }
      }

      const updateElTableBackgrond = () => {
        const rows = el.querySelectorAll('.el-table__row')
        rows.forEach((row) => {
          const checkbox = row.querySelector('.el-checkbox__input')
          if (checkbox) {
            if (checkbox.classList.contains('is-checked')) {
              row.classList.add('row-selected')
            } else {
              row.classList.remove('row-selected')
            }
          }
        })
      }

      const updateVxeTableBackgrond = () => {
        const rows = el.querySelectorAll('.vxe-body--row')
        rows.forEach((row) => {
          const checkbox = row.querySelector('.vxe-cell--checkbox')
          if (checkbox) {
            if (checkbox.classList.contains('is--checked')) {
              row.classList.add('row-selected')
            } else {
              row.classList.remove('row-selected')
            }
          }
        })
      }

      initRowSelectHighlight()

      const observer = new MutationObserver(() => {
        initRowSelectHighlight()
      })

      observer.observe(el, {
        childList: true,
        subtree: true
      })
    }
  })

  /***
   *  节流 每单位时间可触发一次
   *  第一次瞬间触发，最后一次不管是否达到间隔时间依然触发
   * 【考虑到input的change事件】
   *  @param {?Number|300} time - 间隔时间
   *  @param {Function} fn - 执行事件
   *  @param {?String|"click"} event - 事件类型 例："click"
   *  @param {Array} binding.value - [fn,event,time]
   *  例：<el-button v-throttle="[reset,`click`,300]">刷新</el-button>
   *  传递参数则：<el-button v-throttle="[()=>reset(param),`click`,300]">刷新</el-button>
   */
  app.directive('throttle', {
    created(el: any, binding: any) {
      const [fn, event = 'click', time = 1000] = binding.value
      let timer: any, timer_end: any
      el.addEventListener(event, () => {
        if (timer) {
          clearTimeout(timer_end)
          return (timer_end = setTimeout(() => fn(), time))
        }
        fn()
        timer = setTimeout(() => (timer = null), time)
      })
    }
  })

  /**
   * 禁止用户多次点击按钮
   * @param el 获取当前元素对象
   * @param {?Number|2000} timer 可选参数 不传则默认2秒
   * 例：<el-button v-dbClick> </el-button>
   */
  app.directive('dbClick', {
    mounted(el: any, binding: any) {
      el.addEventListener('click', (e: any) => {
        const timer = binding.value || 2000
        el.disabled = true
        el.style.cursor = 'pointer'
        setTimeout(() => {
          el.disabled = false
          el.style.cursor = 'pointer'
        }, timer) // 禁用两秒
      })
    }
  })

  /**
   * 给传入的值添加千分号并且保留两位小数
   * @param el 为携带自定义指令的dom节点
   * @param binding 为指令后携带的参数通过.value取出
   * 例：<span v-comdify="123456"> </span>
   */
  app.directive('comdify', {
    mounted(el: any, binding: any) {
      el.innerText = binding.value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
    }
  })

  app.directive('limit-number', {
    beforeMount(el: HTMLInputElement) {
      let isComposing = false
      el.addEventListener('compositionstart', () => {
        isComposing = true
      })
      el.addEventListener('compositionend', () => {
        isComposing = false
        validateInput()
      })
      el.addEventListener('input', () => {
        if (!isComposing) {
          validateInput()
        }
      })

      function validateInput() {
        let value = el.value
        value = value.replace(/[^0-9.-]/g, '')
        if (value.indexOf('-') > 0) {
          value = value.replace(/-/g, '')
        }
        const decimalCount = (value.match(/\./g) || []).length
        if (decimalCount > 1) {
          value = value.replace(/\.+$/, '')
        }

        const decimalIndex = value.indexOf('.')
        if (decimalIndex !== -1) {
          const integerPart = value.slice(0, decimalIndex)
          const decimalPart = value.slice(decimalIndex + 1)
          value = integerPart.slice(0, 12)
          if (decimalPart.length > 6) {
            value += '.' + decimalPart.slice(0, 6)
          } else {
            value += '.' + decimalPart
          }
        } else {
          value = value.slice(0, 12)
        }
        if (el.value !== value) {
          el.value = value
          el.dispatchEvent(new Event('input'))
        }
      }
    },
    unmounted(el: HTMLInputElement) {
      el.removeEventListener('compositionstart', () => {})
      el.removeEventListener('compositionend', () => {})
      el.removeEventListener('input', () => {})
    }
  })

  app.directive('limit-input', {
    beforeMount(el: HTMLInputElement) {
      let isComposing = false
      el.addEventListener('compositionstart', () => {
        isComposing = true
      })
      el.addEventListener('compositionend', () => {
        isComposing = false
        validateInput()
      })
      el.addEventListener('input', () => {
        if (!isComposing) {
          validateInput()
        }
      })

      function validateInput() {
        let value = el.value
        value = value.replace(/[^0-9.-]/g, '')
        if (value.indexOf('-') > 0) {
          value = value.replace(/-/g, '')
        }
        const decimalCount = (value.match(/\./g) || []).length
        if (decimalCount > 1) {
          value = value.replace(/\.+$/, '')
        }

        const decimalIndex = value.indexOf('.')
        if (decimalIndex !== -1) {
          const integerPart = value.slice(0, decimalIndex)
          const decimalPart = value.slice(decimalIndex + 1)
          value = integerPart.slice(0, 10)
          if (decimalPart.length > 4) {
            value += '.' + decimalPart.slice(0, 4)
          } else {
            value += '.' + decimalPart
          }
        } else {
          value = value.slice(0, 10)
        }
        if (el.value !== value) {
          el.value = value
          el.dispatchEvent(new Event('input'))
        }
      }
    },
    unmounted(el: HTMLInputElement) {
      el.removeEventListener('compositionstart', () => {})
      el.removeEventListener('compositionend', () => {})
      el.removeEventListener('input', () => {})
    }
  })

  app.directive('number-input', {
    beforeMount(el: HTMLInputElement, binding: any) {
      let isComposing = false
      const decimalPlaces = binding.value || 2
      el.addEventListener('compositionstart', () => {
        isComposing = true
      })
      el.addEventListener('compositionend', () => {
        isComposing = false
        validateInput()
      })
      el.addEventListener('input', () => {
        if (!isComposing) {
          validateInput()
        }
      })

      function validateInput() {
        let value = el.value
        value = value.replace(/[^0-9.-]/g, '')
        if (value.indexOf('-') > 0) {
          value = value.replace(/-/g, '')
        }
        const decimalCount = (value.match(/\./g) || []).length
        if (decimalCount > 1) {
          value = value.replace(/\.+$/, '')
        }

        const decimalIndex = value.indexOf('.')
        if (decimalIndex !== -1) {
          const integerPart = value.slice(0, decimalIndex)
          const decimalPart = value.slice(decimalIndex + 1)
          value = integerPart.slice(0, 12)
          if (decimalPart.length > decimalPlaces) {
            value += '.' + decimalPart.slice(0, decimalPlaces)
          } else {
            value += '.' + decimalPart
          }
        } else {
          value = value.slice(0, 12)
        }
        if (el.value !== value) {
          el.value = value
          el.dispatchEvent(new Event('input'))
        }
      }
    },
    unmounted(el: HTMLInputElement) {
      el.removeEventListener('compositionstart', () => {})
      el.removeEventListener('compositionend', () => {})
      el.removeEventListener('input', () => {})
    }
  })
}
