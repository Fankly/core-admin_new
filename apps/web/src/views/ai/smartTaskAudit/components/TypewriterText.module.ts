export interface TypewriterProgress {
  raw: string
  revealed: number
  completed: boolean
  updatedAt: number
}
export const typewriterProgressCache = new Map<string, TypewriterProgress>()
export const TYPEWRITER_CACHE_MAX_ENTRIES = 200
export const TYPEWRITER_CACHE_TTL_MS = 30 * 60 * 1000
export const pruneTypewriterProgressCache = (now = Date.now()) => {
  typewriterProgressCache.forEach((progress, key) => {
    if (now - progress.updatedAt > TYPEWRITER_CACHE_TTL_MS) {
      typewriterProgressCache.delete(key)
    }
  })
  while (typewriterProgressCache.size > TYPEWRITER_CACHE_MAX_ENTRIES) {
    const oldestKey = typewriterProgressCache.keys().next().value
    if (oldestKey === undefined) break
    typewriterProgressCache.delete(oldestKey)
  }
}
