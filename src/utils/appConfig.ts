import { IObject } from '@/types/interface'

class AppConfig {
  private data: any = {}
  private gateway = ''
  private isLoading = false
  private isLoaded = false
  private loadPromise: Promise<void> | null = null

  async load() {
    if (this.isLoaded) return
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise
    }

    this.isLoading = true
    this.loadPromise = this._loadingConfig()

    try {
      await this.loadPromise
    } finally {
      this.isLoading = false
      this.isLoaded = true
      this.loadPromise = null
    }
  }

  private async _loadingConfig() {
    const basePath = import.meta.env.BASE_URL || '/'
    const normallizedPath = basePath.replace(/\/$/, '')
    const res = await fetch(`${normallizedPath}/config.json?_t=${Date.now()}`)
    if (!res.ok) {
      throw new Error(`读取配置失败:${res.status} ${res.statusText}`)
    }
    this.data = await res.json()
    this.resolveGateway()
  }

  private resolveGateway() {
    const { hostname, protocol, port } = window.location
    const gatewayMapping = this.data['GATEWAY_MAPPING'] || {}
    for (const [key, value] of Object.entries(gatewayMapping)) {
      if (hostname.includes(key)) {
        this.gateway = value as string
        return
      }
    }
    const currentPort = port ? `:${port}` : ''
    this.gateway = `${protocol}//${hostname}${currentPort}`
  }

  get(key: string) {
    return this.data[key]
  }

  getService(key: string) {
    const services = this.data['SERVICES'] || {}
    return services[key] || services[this.data['DEFAULT_SERVICE']]
  }

  getGateway() {
    return this.gateway || this.data['DEFAULT_GETEWAY'] || ''
  }
}

export default new AppConfig()
