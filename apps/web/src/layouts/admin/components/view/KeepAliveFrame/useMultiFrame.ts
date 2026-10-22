import { onScopeDispose, type Component } from 'vue'

export const useMultiFrame = () => {
  const MAP = new Map<string, Component>()
  onScopeDispose(() => {
    MAP.clear()
  })
  function setMap(path: string, component: Component) {
    MAP.set(path, component)
  }

  function getMap(): Array<[string, Component]>
  function getMap(path: string): Component | undefined
  function getMap(path?: string): Array<[string, Component]> | Component | undefined {
    if (path) return MAP.get(path)
    return [...MAP.entries()]
  }

  function delMap(path: string) {
    MAP.delete(path)
  }

  return { setMap, getMap, delMap, MAP }
}
