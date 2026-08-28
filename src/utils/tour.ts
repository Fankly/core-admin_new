import { driver, DriveStep, AllowedButtons } from 'driver.js'
import 'driver.js/dist/driver.css'

const addCutomStyles = () => {
  if (document.getElementById('tour-custom-styles')) return

  const style = document.createElement('style')
  style.id = 'tour-custom-styles'

  style.textContent = `
  .driver-popver-never-show-btn {
    backgroud:#f56c6c !important;
    color:white !important;
    border:none !important;
    padding:8px 16px !important;
    border-radius:4px !important;
    cursor:pointer !important;
    margin-left:8px !important;
    font-size:14px !important;
    transition:background-color 0.3s ease !important;
  }

  .driver-popover-never-show-btn:hover {
    backgroud:#f45454 !important;
  }

  .driver-popover-footer {
    display:flex !important;
    align-items:center !important;
    justify-content:space-between !important;
  }
  `
  document.head.appendChild(style)
}

export interface TourStep extends DriveStep {
  element?: string
  popover?: {
    title?: string
    description?: string
    position?:
      | 'top'
      | 'top-center'
      | 'top-left'
      | 'top-right'
      | 'right'
      | 'right-center'
      | 'right-top'
      | 'right-bottom'
      | 'bottom'
      | ' bottom-center'
      | 'bottom-left'
      | 'bottom-right'
      | 'left'
      | 'left-center'
      | 'left-top'
      | 'left-bottom'
    showButtons?: AllowedButtons[]
    showProgress?: boolean
  }
}

export interface TourConfig {
  showProgress?: boolean
  showButtons?: string[]
  nextBtnText?: string
  prevBtnText?: string
  doneBtnText?: string
  neverShowBtnText?: string
  progressText?: string
  allowClose?: boolean
  overlayClickNext?: boolean
  smoothScroll?: boolean
  disableActiveInteraction?: boolean
}

class TourManager {
  private driverInstance: any = null
  private hasShownTour: Set<string> = new Set()
  private neverShowAgain = false
  private readonly NEVER_SHOW_KEY = 'tour_never_show_again'
  private readonly SHOWN_PAGES_KEY = 'tour_shown_pages'

  constructor() {
    addCutomStyles()

    const showTours = localStorage.getItem(this.SHOWN_PAGES_KEY)
    if (showTours) {
      this.hasShownTour = new Set(JSON.parse(showTours))
    }

    const neverShow = localStorage.getItem(this.NEVER_SHOW_KEY)
    this.neverShowAgain = neverShow === 'true'
  }

  private createDriver(config: TourConfig = {}) {
    const defaultConfig: TourConfig = {
      showProgress: false,
      showButtons: ['close'],
      doneBtnText: '知道了',
      neverShowBtnText: '不再提醒',
      allowClose: true,
      overlayClickNext: true,
      smoothScroll: true,
      disableActiveInteraction: false
    }

    const mergedConfig = { ...defaultConfig, ...config }

    this.driverInstance = driver({
      showProgress: mergedConfig.showProgress,
      showButtons: mergedConfig.showButtons as AllowedButtons[],
      doneBtnText: mergedConfig.doneBtnText,
      allowClose: mergedConfig.allowClose,
      smoothScroll: mergedConfig.smoothScroll,
      disableActiveInteraction: mergedConfig.disableActiveInteraction,
      onDestroyed: () => {
        this.driverInstance = null
      },
      onPopoverRender: (popover: any, { config, state }: any) => {
        const neverShowBtn = document.createElement('button')
        neverShowBtn.innerText = mergedConfig.neverShowBtnText || '不再提醒'
        neverShowBtn.className = 'driver-popover-never-show-btn'

        neverShowBtn.onclick = () => {
          this.setNeverShowAgain(true)
          this.stopTour()
        }

        const closeBtn = popover.querySelector('.driver-popover-close-btn')
        if (closeBtn) {
          closeBtn.innerText = mergedConfig.doneBtnText || '知道了'
        }

        const footer = popover.querySelector('.driver-popover-footer')
        if (footer) {
          footer.appendChild(neverShowBtn)
        }
      }
    })
    return this.driverInstance
  }

  startTour(steps: TourStep[], config: TourConfig = {}, pageName?: string) {
    // 如果用户设置了永不提示,直接返回
    if (this.neverShowAgain) {
      return
    }

    // 如果指定了页面名称,检查是否已经显示过
    if (pageName && this.hasShownTour.has(pageName)) {
      return
    }

    // 使用重试机制确保页面元素已加载完成
    this.startTourWithRetry(steps, config, pageName, 0)
  }

  private startTourWithRetry(
    steps: TourStep[],
    config: TourConfig,
    pageName?: string,
    retryCount = 0
  ) {
    const maxRetries = 10
    const retryDelay = 500

    setTimeout(
      () => {
        const validSteps = steps.filter((step) => {
          if (step.element) {
            const element = document.querySelector(step.element)
            return element !== null
          }
          return true
        })

        if (validSteps.length > 0) {
          const driver = this.createDriver(config)
          driver.setSteps(validSteps)
          driver.drive()

          if (pageName) {
            this.hasShownTour.add(pageName)
            this.saveTourHistory()
          }
        } else if (retryCount < maxRetries) {
          this.startTourWithRetry(steps, config, pageName, retryCount + 1)
        } else {
          if (pageName) {
            this.hasShownTour.add(pageName)
            this.saveTourHistory()
          }
        }
      },
      retryCount === 0 ? 500 : retryDelay
    )
  }

  forceTour(steps: TourStep[], config: TourConfig = {}) {
    setTimeout(() => {
      const driver = this.createDriver(config)

      const validSteps = steps.filter((step) => {
        if (step.element) {
          const element = document.querySelector(step.element)
          return element !== null
        }
        return true
      })
      if (validSteps.length === 0) {
        console.warn('没有匹配的元素')
        return
      }

      driver.setSteps(validSteps)
      driver.drive()
    }, 500)
  }

  stopTour() {
    if (this.driverInstance) {
      this.driverInstance.destroy()
      this.driverInstance = null
    }
  }

  resetTourHistroy() {
    this.hasShownTour.clear()
    localStorage.removeItem(this.SHOWN_PAGES_KEY)
  }

  resetAllTourSettings() {
    this.hasShownTour.clear()
    this.neverShowAgain = false
    localStorage.removeItem(this.SHOWN_PAGES_KEY)
    localStorage.removeItem(this.NEVER_SHOW_KEY)
  }
  hasShownTourForPage(pageName: string): boolean {
    return this.hasShownTour.has(pageName)
  }
  private saveTourHistory() {
    localStorage.setItem(this.SHOWN_PAGES_KEY, JSON.stringify([...this.hasShownTour]))
  }
  setNeverShowAgain(neverShow: boolean) {
    this.neverShowAgain = neverShow
    localStorage.setItem(this.NEVER_SHOW_KEY, neverShow.toString())
  }
  getNeverShowAgain(): boolean {
    return this.neverShowAgain
  }
  shouldShowTour(pageName?: string): boolean {
    if (this.neverShowAgain) {
      return false
    }

    if (pageName && this.hasShownTour.has(pageName)) {
      return false
    }
    return true
  }

  markTourAsShow(pageName: string) {
    this.hasShownTour.add(pageName)
    this.saveTourHistory()
  }
}

export const tourManager = new TourManager()

export const getDefaultTourSteps = (): TourStep[] => {
  const helpButtonSelectors = [
    'i.el-icon-question',
    '.el-icon-question',
    '[class*="el-icon-question"]',
    'i[class*=question]',
    '.el-tooltip i.el-icon-question'
  ]

  const fallbackSelectors = ['.container', 'el-container', '.layout-header', '.el-header', 'body']

  let targetElement = 'body'
  let position: any = 'center'
  let isHelpButton = false

  for (const selector of helpButtonSelectors) {
    const elements = document.querySelectorAll(selector)
    for (const element of elements) {
      if (
        element &&
        (element as HTMLElement).offsetParent !== null &&
        window.getComputedStyle(element).display !== 'none' &&
        window.getComputedStyle(element).visibility !== 'hidden'
      ) {
        if (element.tagName === 'I') {
          const parentSpan = element.closest('span')
          if (parentSpan) {
            targetElement = `span:has(${selector})`
            if (!document.querySelector(targetElement)) {
              targetElement = selector
            }
          } else {
            targetElement = selector
          }
        } else {
          targetElement = selector
        }
        position = 'bottom-left'
        isHelpButton = true
        break
      }
    }
    if (isHelpButton) break
  }

  if (!isHelpButton) {
    for (const selector of fallbackSelectors) {
      if (document.querySelector(selector)) {
        targetElement = selector
        position = selector === 'body' ? 'center' : 'top'
        break
      }
    }
  }

  const title = isHelpButton ? '系统帮助功能' : '欢迎使用系统'
  const description = isHelpButton
    ? '这是系统的帮助按钮,点击可以获取使用帮助和说明。如果您不希望再看到此引导提示，可以点击"不再提醒"按钮。'
    : '欢迎使用本系统!如果您需要帮助,可以查找页面上的帮助按钮.如果不希望再看到此提示,可以点击"不在提醒"按钮。'

  return [
    {
      element: targetElement,
      popover: {
        title,
        description,
        position
      }
    }
  ]
}
