import { getToken } from '@/utils/index'

class SSEClient {
  /**
   * 初始化SSE客户端
   * @param {string} url - SSE服务端接口地址
   * @param {Object} options - 配置选项
   * @param {boolean} options.parseJson - 是否解析JSON，默认true
   * @param {number} options.reconnectInterval - 重连间隔时间(ms)
   * @param {boolean} options.autoReconnect - 是否自动重连
   * @param {Object} options.headers - 自定义请求头
   * @param {string} options.method - 请求方法，默认'GET'
   * @param {Object|string} options.body - 请求体，仅用于非GET方法
   */
  constructor(url, options = {}) {
    this.url = url
    this.options = {
      parseJson: true,
      reconnectInterval: 3000,
      autoReconnect: true,
      withCredentials: true,
      headers: {}, // 自定义请求头
      method: 'GET', // 默认请求方法
      body: null, // 请求体
      ...options
    }

    this.eventListeners = new Map()
    this.isConnected = false
    this.reconnectTimer = null
    this.lastEventId = options.lastEventId || ''
    this.controller = null // 用于中止 fetch 请求

    // 重置SSE解析状态
    this.resetEventState()
  }

  // 重置事件解析状态
  resetEventState() {
    this.currentEvent = null // 默认为message事件
    this.currentData = ''
  }

  connect() {
    // 关闭可能存在的连接
    this.close()

    // 构建带 lastEventId 的 URL
    const url =
      this.lastEventId && this.options.method === 'GET' ? `${this.url}${this.url.includes('?') ? '&' : '?'}lastEventId=${this.lastEventId}` : this.url

    // 创建 AbortController 用于取消请求
    this.controller = new AbortController()

    // 构建 fetch 配置
    const fetchConfig = {
      method: this.options.method,
      headers: {
        Authorization: getToken(),
        ...this.options.headers
      },
      credentials: this.options.withCredentials ? 'include' : 'same-origin',
      signal: this.controller.signal,
      cache: 'no-store'
    }

    // 如果不是 GET 方法且有 body，则添加请求体
    if (this.options.method !== 'GET' && this.options.body) {
      // 如果 body 是对象，转换为 JSON 字符串并设置 Content-Type
      if (typeof this.options.body === 'object') {
        fetchConfig.headers['Content-Type'] = 'application/json'
        fetchConfig.body = JSON.stringify(this.options.body)
      } else {
        fetchConfig.body = this.options.body
      }
    }

    // 使用 fetch 代替原生 EventSource 以支持自定义 headers
    fetch(url, fetchConfig)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported in this browser')
        }

        this.isConnected = true
        this.clearReconnectTimer()
        this.trigger('open', 'SSE 连接已建立')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        // 处理流数据的函数
        const processStream = ({ done, value }) => {
          if (done) {
            this.isConnected = false
            this.trigger('end', '流已结束')
            if (this.options.autoReconnect) {
              this.reconnect()
            }
            return
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          lines.forEach((line) => {
            this.handleLine(line.trim())
          })

          return reader.read().then(processStream)
        }

        return reader.read().then(processStream)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          // 忽略主动中止的错误
          this.isConnected = false
          this.trigger('error', error)
          if (this.options.autoReconnect) {
            this.reconnect()
          }
        }
      })
  }

  // 处理SSE协议的单行数据
  handleLine(line) {
    if (!line) {
      // 空行表示事件结束，触发相应事件
      if (this.currentData !== '') {
        // 如果没有指定事件名，默认为message事件
        const eventName = this.currentEvent || 'message'
        const data = this.options.parseJson ? this.safeParse(this.currentData) : this.currentData

        this.trigger(eventName, data)
      }
      // 重置事件状态
      this.resetEventState()
      return
    }

    const [field, ...valueParts] = line.split(/:(?:\s|$)/)
    const value = valueParts.join(':').trim()

    switch (field) {
      case 'event':
        this.currentEvent = value
        break
      case 'data':
        this.currentData += value ? (this.currentData ? '\n' + value : value) : ''
        break
      case 'id':
        this.lastEventId = value
        break
      case 'retry': {
        // 添加大括号形成独立作用域，解决变量声明错误
        const retry = parseInt(value, 10)
        if (!isNaN(retry)) {
          this.options.reconnectInterval = retry
        }
        break
      }
      // 忽略注释和其他未知字段
      case 'comment':
      default:
        break
    }
  }

  // 安全的JSON解析方法
  safeParse(data) {
    try {
      return JSON.parse(data)
    } catch (e) {
      this.trigger('error', new Error(`JSON解析错误: ${e.message}`))
      return data // 解析失败时返回原始数据
    }
  }

  trigger(eventName, data) {
    if (this.eventListeners.has(eventName)) {
      // 复制一份监听器数组，防止在触发过程中被修改
      ;[...this.eventListeners.get(eventName)].forEach((listener) => {
        try {
          listener(data)
        } catch (e) {
          this.trigger('error', new Error(`事件监听器错误 [${eventName}]: ${e.message}`))
        }
      })
    }
  }

  on(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new Error('监听器必须是函数')
    }
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, [])
    }
    this.eventListeners.get(eventName).push(callback)
  }

  off(eventName, callback) {
    if (this.eventListeners.has(eventName)) {
      if (callback) {
        this.eventListeners.set(
          eventName,
          this.eventListeners.get(eventName).filter((fn) => fn !== callback)
        )
      } else {
        this.eventListeners.delete(eventName)
      }
    }
  }

  reconnect() {
    this.clearReconnectTimer()
    this.trigger('reconnect', `将在 ${this.options.reconnectInterval}ms 后重连`)
    this.reconnectTimer = setTimeout(() => {
      this.trigger('reconnecting', '正在重连...')
      this.connect()
    }, this.options.reconnectInterval)
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  close() {
    this.isConnected = false
    this.clearReconnectTimer()
    // 中止 fetch 请求
    if (this.controller) {
      this.controller.abort()
      this.controller = null
    }
    this.trigger('close', 'SSE 连接已关闭')
  }
}

export default SSEClient
