import { ElLoading, ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import { globalConfig } from '@/core/config'
import { getAppId } from '@/utils'

function showErrorMessage(text) {
  const appId = getAppId()
  const message = text?.message || text || '数据请求失败'
  if (appId != null && appId !== '' && window.parent) {
    window.parent.postMessage(
      {
        type: 'message',
        data: {
          type: 'error',
          text: message
        }
      },
      '*'
    )
    return
  }
  ElMessage.error(message)
}

class LoadingManager {
  constructor(options) {
    this.options = options
    this.refCount = 0
    this.loading = undefined
  }

  showMask() {
    this.loading = ElLoading.service(this.options)
    this.refCount++
  }

  hideMask() {
    if (this.refCount <= 1 && this.loading != null) {
      this.loading.close()
      this.loading = null
    }
    this.refCount--
    this.refCount = Math.max(0, this.refCount)
  }
}

const loadingManager = new LoadingManager({
  fullscreen: true,
  background: 'rgba(0, 0, 0, 0.1)'
})

const DOWNLOAD_METHODS = new Set(['get', 'post', 'put', 'delete'])

const getHeaders = (options = {}) => {
  if (options == null) return undefined
  return options.headers || options
}

const resolveDownloadArgs = (fileNameOrMethod, method = 'post') => {
  const maybeMethod = typeof fileNameOrMethod === 'string' ? fileNameOrMethod.toLowerCase() : undefined
  if (maybeMethod && DOWNLOAD_METHODS.has(maybeMethod)) {
    return {
      fileName: undefined,
      method: maybeMethod
    }
  }
  return {
    fileName: fileNameOrMethod,
    method
  }
}

const fetchPost = function (url, params, options = {}) {
  return baseService.post(url, params, getHeaders(options))
}

const fetchGet = function (url, params, options = {}) {
  return baseService.get(url, params, getHeaders(options))
}

const fetchDownloadBlob = function (url, params, fileName, method = 'post') {
  const requestMethod = (method || 'post').toLowerCase()
  const downloadRequest = requestMethod === 'get' ? baseService.exportGet(url, params) : baseService.export(url, params)
  return downloadRequest.then((data) => {
    if (data == null) {
      throw new Error('下载文件失败')
    }
    return data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' })
  })
}

const fetchDownload = function (url, params, fileName, method = 'post') {
  return baseService.download(url, params, fileName, method)
}

const fetchDownloadFileName = function (url, params, fileNameOrMethod, method = 'post') {
  const downloadArgs = resolveDownloadArgs(fileNameOrMethod, method)
  return fetchDownload(url, params, downloadArgs.fileName, downloadArgs.method)
}

const fetchUpload = function (url, params, formData) {
  const uploadData = formData || new FormData()
  if (!formData) {
    Object.keys(params || {}).forEach((key) => {
      uploadData.append(key, params[key])
    })
  }
  return baseService.post(url, uploadData, {
    'Content-Type': 'multipart/form-data'
  })
}

const ajaxThrottleSet = new Set()

const doUrl = function (url, type, params, axiosOption, options) {
  const finalOption = {
    ...globalConfig.httpOption,
    ...options
  }
  const { showMask, showError, throttleFlag, throttleTimeout } = finalOption
  const finalAxiosOption = {
    ...globalConfig.axiosOption,
    ...axiosOption
  }
  const method = type || 'post'

  if (ajaxThrottleSet.has(url) && throttleFlag) {
    return Promise.resolve()
  }

  if (throttleFlag) {
    ajaxThrottleSet.add(url)
    setTimeout(() => {
      ajaxThrottleSet.delete(url)
    }, throttleTimeout || 50)
  }

  if (showMask) loadingManager.showMask()
  const ajaxCall = method.toLowerCase() === 'get' ? fetchGet(url, params, finalAxiosOption) : fetchPost(url, params, finalAxiosOption)

  return ajaxCall
    .then((res) => {
      const data = res
      if (data && data.success === false) {
        if (showError) showErrorMessage(data.errorMessage || data.msg || '数据请求失败')
        return Promise.reject(data)
      }
      return data
    })
    .catch((error) => {
      if (showError) showErrorMessage(error?.errorMessage || error?.message || '网络请求错误')
      return Promise.reject(error)
    })
    .finally(() => {
      if (showMask) loadingManager.hideMask()
    })
}

export default {
  doUrl,
  fetchPost,
  fetchGet,
  fetchDownload,
  fetchDownloadBlob,
  fetchUpload,
  fetchDownloadFileName,
  loadingManager
}
