import { nextTick, onScopeDispose, watch, type Ref, type WatchSource } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

/** Animate the existing outlet so cached views, form state and iframe documents stay mounted. */
export function usePageMotion(element: Ref<HTMLElement | null>, source: WatchSource) {
  const reducedMotion = usePreferredReducedMotion()
  let animation: Animation | undefined

  const cancel = () => {
    animation?.cancel()
    animation = undefined
  }

  watch(
    [element, source, reducedMotion],
    (_value, _previous, onCleanup) => {
      let stale = false
      cancel()
      onCleanup(() => {
        stale = true
        cancel()
      })

      // Refresh remounts the view in nextTick; start after the new content is committed.
      void nextTick(() => {
        const target = element.value
        if (stale || !target || reducedMotion.value === 'reduce' || typeof target.animate !== 'function') return
        const style = getComputedStyle(target)
        animation = target.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          {
            duration: Number.parseFloat(style.getPropertyValue('--ds-duration-page')) || 280,
            easing: style.getPropertyValue('--ds-ease-out').trim() || 'ease-out'
          }
        )
      })
    },
    { flush: 'post' }
  )

  onScopeDispose(cancel)
}
