import { nextTick, onBeforeUnmount, ref } from 'vue'
import type { Ref } from 'vue'

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * 一次性入场动效 + 英雄区轻量视差。
 * 数字动效由 AnimatedNumber 独立管理，接口刷新时不会重播整页入场。
 */
export const useArtboardMotion = (options: { artboardRef: Ref<HTMLElement | null> }) => {
  const { artboardRef } = options
  const isReady = ref(false)

  let parallaxRaf = 0
  let failsafeTimer: ReturnType<typeof setTimeout> | null = null
  let stopParallax: (() => void) | null = null
  let hasBooted = false

  const initHeroParallax = () => {
    if (prefersReducedMotion()) return
    const board = artboardRef.value
    if (!board) return

    const device = board.querySelector<HTMLElement>('.hero-device')
    if (!device) return

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let running = true

    const tick = () => {
      if (!running) return
      currentX += (targetX - currentX) * 0.06
      currentY += (targetY - currentY) * 0.06

      const sx = currentX * 10
      const sy = currentY * 8
      device.style.setProperty('--device-x', `${sx.toFixed(2)}px`)
      device.style.setProperty('--device-y', `${sy.toFixed(2)}px`)

      parallaxRaf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const rect = board.getBoundingClientRect()
      const x = (e.clientX - rect.left) / (rect.width || 1)
      const y = (e.clientY - rect.top) / (rect.height || 1)
      targetX = (x - 0.5) * 2
      targetY = (y - 0.5) * 2
    }

    const onLeave = () => {
      targetX = 0
      targetY = 0
    }

    board.addEventListener('pointermove', onMove)
    board.addEventListener('pointerleave', onLeave)
    parallaxRaf = requestAnimationFrame(tick)

    stopParallax = () => {
      running = false
      cancelAnimationFrame(parallaxRaf)
      board.removeEventListener('pointermove', onMove)
      board.removeEventListener('pointerleave', onLeave)
    }
  }

  const bootMotion = async () => {
    await nextTick()
    const board = artboardRef.value
    if (!board) return

    if (hasBooted) {
      if (!stopParallax) initHeroParallax()
      return
    }
    hasBooted = true

    board.classList.add('js-motion')
    isReady.value = false

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isReady.value = true
        board.classList.add('is-ready')
      })
    })

    if (failsafeTimer) clearTimeout(failsafeTimer)
    failsafeTimer = setTimeout(() => {
      if (!isReady.value) {
        isReady.value = true
        board.classList.add('is-ready')
      }
    }, 1200)

    if (stopParallax) {
      stopParallax()
      stopParallax = null
    }
    initHeroParallax()
  }

  const destroyMotion = () => {
    if (failsafeTimer) {
      clearTimeout(failsafeTimer)
      failsafeTimer = null
    }
    if (stopParallax) {
      stopParallax()
      stopParallax = null
    }
    cancelAnimationFrame(parallaxRaf)
    isReady.value = false
  }

  onBeforeUnmount(destroyMotion)

  return {
    isReady,
    bootMotion,
    destroyMotion
  }
}
