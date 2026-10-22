import { describe, expect, it } from 'vitest'
import { buildFrameUrl } from './frame-url'

describe('embedded system URLs', () => {
  it('keeps absolute addresses and falls back to configured system URL', () => {
    expect(buildFrameUrl('https://example.com/report?q=1', {})).toBe('https://example.com/report?q=1')
    expect(buildFrameUrl('', { url: '/report' })).toBe('/report')
  })
  it('preserves existing query and hash when adding enterprise context', () => {
    const result = buildFrameUrl('/report?year=2026#details', { deployUrl: 'https://example.com', funcId: 'a&b' })
    const url = new URL(result)
    expect(url.searchParams.get('year')).toBe('2026')
    expect(url.searchParams.get('funcId')).toBe('a&b')
    expect(url.hash).toBe('#details')
  })
})
