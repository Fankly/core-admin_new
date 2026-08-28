export const parseSeparatedText = (value: unknown) => {
  if (typeof value !== 'string') return []

  return Array.from(
    new Set(
      value
        .split(/[\s,，;；]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}
