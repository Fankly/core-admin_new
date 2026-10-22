export interface EmbeddedSystem {
  url?: string
  deployUrl?: string
  funcId?: string
  funcBusicode?: string
  appframeSystemId?: string
  AppframeSystemCode?: string
}

export function buildFrameUrl(framePath: string, source: EmbeddedSystem): string {
  if (/^(https?:)?\/\//.test(framePath)) return framePath
  if (!framePath) return source.url ?? ''
  const [path, hash] = framePath.split('#', 2)
  const [pathname, query] = path.split('?', 2)
  const params = new URLSearchParams(query)
  params.set('funcId', source.funcId ?? '')
  params.set('funcBusicode', source.funcBusicode ?? '')
  params.set('AppframeSystemId', source.appframeSystemId ?? '')
  params.set('AppframeSystemCode', source.AppframeSystemCode ?? '')
  return `${source.deployUrl ?? ''}${pathname}?${params.toString()}${hash ? `#${hash}` : ''}`
}
