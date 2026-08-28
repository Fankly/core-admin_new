import { nextTick, ref } from 'vue'
import { driver, Driver, DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import '@/assets/css/driver.less'
import { checkGuideStatus, recordGuideCompletion, updateGuideStatus } from '@/api/guide'
import { IObject } from '@/types/interface'

interface UseGuideOptions {
  moduleKey: string
  title?: string
  message?: string
  tragetSelector?: string
  onKnow?: () => void
  onNoMoreRemind?: () => void
  delay?: number
  enableAnimation?: boolean
}

export function useGuide(options: UseGuideOptions): IObject {
  const {
    moduleKey,
    title = '功能帮助',
    message = '这里是功能帮助图标,帮助您更好的使用本功能',
    tragetSelector = '',
    onKnow,
    onNoMoreRemind,
    delay = 1000,
    enableAnimation = true
  } = options

  const driverInstance = ref<Driver | null>(null)
  const isGuideActive = ref(false)

  const handleKnowClick = async () => {
    try {
      await recordGuideCompletion({ moduleKey })
    } catch (error) {
      console.warn('记录引导完成失败:', error)
    }
    hideGuide()
    onKnow?.()
  }

  const handleNoMoreRemindClick = async () => {
    try {
      await updateGuideStatus({
        moduleKey,
        isCompleted: true
      })
    } catch (error) {
      console.warn('更新引导状态失败:', error)
    }
    hideGuide()
    onNoMoreRemind?.()
  }

  const initDriver = () => {
    if (driverInstance.value) {
      driverInstance.value.destroy()
    }

    driverInstance.value = driver({
      showProgress: false,
      allowClose: false,
      allowKeyboardControl: false,
      showButtons: [],
      popoverClass: `driverjs-theme guide-popover${enableAnimation ? ' animate' : ''}`,
      animate: enableAnimation,
      popoverOffset: 130,
      stagePadding: 8,
      stageRadius: 8,
      smoothScroll: true,
      steps: [
        {
          element: tragetSelector,
          popover: {
            title: title,
            description: message,
            side: 'left',
            align: 'start',
            showButtons: []
          }
        }
      ] as DriveStep[],
      onPopoverRender: (popover, { config, state }) => {
        const descriptionElement = popover.description

        const buttonContainer = document.createElement('div')
        buttonContainer.className = `guide-buttons${enableAnimation ? ' animate-buttons' : ''}`

        const knowButton = document.createElement('button')
        knowButton.className = 'guide-btn'
        knowButton.textContent = '知道了'
        knowButton.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          handleKnowClick()
        }

        const noRemindButton = document.createElement('button')
        noRemindButton.className = 'guide-btn guide-btn-primary'
        noRemindButton.textContent = '不再提醒'
        noRemindButton.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          handleNoMoreRemindClick()
        }

        buttonContainer.appendChild(knowButton)
        buttonContainer.appendChild(noRemindButton)

        if (descriptionElement && descriptionElement.parentElement) {
          descriptionElement.parentNode?.appendChild(buttonContainer)
        }

        if (enableAnimation) {
          setTimeout(() => {
            buttonContainer.classList.add('fade-in')
          }, 100)
        }
      },
      onDestroyed: () => {
        isGuideActive.value = false
      }
    })
  }

  const checkNeedGuide = async (): Promise<boolean> => {
    try {
      const response = await checkGuideStatus({ moduleKey })
      if (response.success && response.data) {
        return response.data
      }
      return false
    } catch (error) {
      console.warn('检查引导状态失败', error)
      return false
    }
  }

  const delayedExecute = (fn: () => void | Promise<void>, delayTime = delay) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        await fn()
        resolve()
      }, delayTime)
    })
  }

  const startGuide = async () => {
    const needShow = await checkNeedGuide()
    if (needShow) {
      await delayedExecute(async () => {
        await showGuideManual()
      })
      return true
    }
    return false
  }

  const showGuideManual = async () => {
    if (isGuideActive.value) return

    await delayedExecute(async () => {
      await nextTick()
      const targetElement = document.querySelector(tragetSelector)
      if (!targetElement) {
        console.warn('引导目标元素未找到:', tragetSelector)
        return
      }

      initDriver()
      if (driverInstance.value) {
        isGuideActive.value = true

        if (enableAnimation) {
          const popover = document.querySelector('.driverjs-theme.guide-popover')
          if (popover) {
            popover.classList.add('fade-in-animation')
          }
        }
        driverInstance.value.drive()
      }
    })
  }

  const hideGuide = () => {
    if (enableAnimation) {
      const popover = document.querySelector('.driverjs-theme.guide-popover')
      if (popover) {
        popover.classList.add('fade-out-animation')
        setTimeout(() => {
          if (driverInstance.value) {
            driverInstance.value.destroy()
          }
          isGuideActive.value = false
        }, 300)
        return
      }
    }

    if (driverInstance.value) {
      driverInstance.value.destroy()
    }
    isGuideActive.value = false
  }

  const destroyGuide = () => {
    hideGuide()
    driverInstance.value = null
  }

  return {
    isGuideActive,
    startGuide,
    showGuideManual,
    hideGuide,
    destroyGuide,
    checkNeedGuide
  }
}
