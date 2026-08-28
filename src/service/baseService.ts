import { IHttpResponse, IObject } from '@/types/interface'
import { Method } from 'axios'
import http from '../utils/http'
import { Base64 } from 'js-base64'

interface ISignature {
  random: number
  timeStamp: number
  sign: string
}

interface OtherParams {
  service: string
}

const REQUEST_TIMEOUT = 3600000

function generateSignature(): ISignature {
  const timeStamp = Date.now()
  let random: number
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    random = crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000
  } else {
    random = Math.random()
  }
  const str = `${random}-${timeStamp}`
  const sign = Base64.encode(str)
  return { random, timeStamp, sign }
}

function createHeaders(extraHeaders?: IObject): IObject {
  const signature = generateSignature()
  return {
    'Content-Type': 'application/json;charset=UTF-8',
    ...signature,
    ...extraHeaders
  }
}

/**
 * 常用CRUD
 */
export default {
  /**
   * 删除
   * @param path
   * @param params
   * @param otherParams
   * @returns
   */
  delete(path: string, params?: IObject, otherParams?: OtherParams): Promise<IHttpResponse> {
    return http({
      url: path,
      timeout: REQUEST_TIMEOUT,
      headers: createHeaders(),
      data: params,
      method: 'DELETE',
      ...otherParams
    })
  },
  async get(path: string, params?: IObject, headers?: IObject, otherParams?: OtherParams): Promise<any> {
    return await http({
      url: path,
      params,
      timeout: REQUEST_TIMEOUT,
      headers: createHeaders(headers),
      method: 'GET',
      ...otherParams
    })
  },
  put(path: string, params?: IObject, headers?: IObject, otherParams?: OtherParams): Promise<IHttpResponse> {
    return http({
      url: path,
      data: params,
      timeout: REQUEST_TIMEOUT,
      headers: createHeaders(headers),
      method: 'PUT',
      ...otherParams
    })
  },
  /**
   * 通用post方法
   * @param path
   * @param body
   * @param headers
   * @param otherParams
   * @returns
   */
  async post(path: string, body?: IObject, headers?: IObject, otherParams?: OtherParams): Promise<IHttpResponse> {
    return await http({
      url: path,
      timeout: REQUEST_TIMEOUT,
      headers: createHeaders(headers),
      data: body,
      method: 'POST',
      ...otherParams
    })
  },
  /**
   * 导出
   * @param path
   * @param body
   * @param headers
   * @param otherParams
   * @returns
   */
  export(path: string, body?: IObject, headers?: IObject, otherParams?: OtherParams): Promise<IHttpResponse> {
    return http({
      url: path,
      method: 'post',
      responseType: 'blob',
      timeout: REQUEST_TIMEOUT,
      headers: createHeaders(headers),
      data: body,
      ...otherParams
    })
  },
  /**
   * 导出get请求方式
   */
  exportGet(path: string, params?: IObject, headers?: IObject, otherParams?: OtherParams): Promise<IHttpResponse> {
    return http({
      url: path,
      method: 'get',
      responseType: 'blob',
      timeout: REQUEST_TIMEOUT,
      headers: createHeaders(headers),
      params,
      ...otherParams
    })
  },

  /**
   * 下载文件
   * @param path 文件路径
   * @param params 请求参数
   * @param filename 文件名
   * @param method 请求方法
   * @param otherParams
   */
  async download(path: string, params?: IObject, filename?: string, method: Method = 'get', otherParams?: OtherParams): Promise<void> {
    const isPost = method.toLowerCase() === 'post'
    const opt = {
      url: path,
      method,
      responseType: 'blob' as const,
      timeout: REQUEST_TIMEOUT,
      ...(isPost ? { data: params } : { params }),
      ...otherParams
    }

    const res = await http(opt)
    const a = document.createElement('a')
    const evt = new MouseEvent('click', { bubbles: false, cancelable: false })
    a.download = filename || new Date().getTime().toString()
    const blobUrl = URL.createObjectURL(res as any)
    a.href = blobUrl
    a.dispatchEvent(evt)
    URL.revokeObjectURL(blobUrl)
  },
  /**
   * 获取blob数据并转换为Base64
   * @param requestUrl 请求地址
   * @param otherParams
   */
  async blob(requestUrl: string, otherParams?: OtherParams): Promise<{ name: string; url: string }> {
    const res = await http({ url: requestUrl, responseType: 'blob', ...otherParams })
    const data = res.data
    const fileName = res.headers['filename']

    return new Promise((resolve, reject) => {
      const fr = new FileReader()
      fr.readAsDataURL(data)
      fr.onload = (e: any) => {
        const result = {
          name: fileName,
          url: e.currentTarget.result
        }
        resolve(result)
      }
      fr.onerror = reject
    })
  }
}
