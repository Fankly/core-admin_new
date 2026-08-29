import baseService from '@/service/baseService'
import { IHttpResponse, IObject } from '@/types/interface'
import { Method } from 'axios'
import { useAppStore } from '@/store'

export type RequestParams = Record<string, any>
export type RequestData = Record<string, any>
export type ServiceKey = 'budget' | 'otherOperatingCose' | 'fullProcess' | 'project' | 'targetBudget' | 'zgsExpense'

export class BaseMethod {
  // 惰性取 store：本文件在模块顶层被实例化，而 pinia 要到 main.ts 里 app.use(pinia) 之后才可用
  private get store() {
    return useAppStore()
  }
  protected service?: ServiceKey

  constructor(service?: ServiceKey) {
    this.service = service
  }

  private getOtherParams() {
    return this.service ? { service: this.service } : undefined
  }

  /**
   * get请求
   * @param url 请求地址
   * @param params 请求参数
   * @param headers 请求头
   * @param showLoading 全屏loading开关,默认开启
   */
  public async get<T>(url: string, params?: RequestParams, headers?: IObject, showLoading = true): Promise<IHttpResponse & { data: T }> {
    return this.requestWithLoading(() => baseService.get(url, params, headers, this.getOtherParams()), 'GET', url, showLoading)
  }

  /**
   * post请求
   * @param url 请求地址
   * @param data 请求参数
   * @param headers 请求头
   * @param showLoading 全屏loading开关,默认开启
   */
  public async post<T>(url: string, data?: RequestData, headers?: IObject, showLoading = true): Promise<IHttpResponse & { data: T }> {
    return this.requestWithLoading(() => baseService.post(url, data, headers, this.getOtherParams()), 'POST', url, showLoading)
  }

  public async put<T>(url: string, data?: RequestData, headers?: IObject, showLoading = true): Promise<IHttpResponse & { data: T }> {
    return this.requestWithLoading(() => baseService.put(url, data, headers, this.getOtherParams()), 'PUT', url, showLoading)
  }

  public async delete<T>(url: string, params?: RequestParams, showLoading = true): Promise<IHttpResponse & { data: T }> {
    return this.requestWithLoading(() => baseService.delete(url, params, this.getOtherParams()), 'DELETE', url, showLoading)
  }

  /**
   *
   * @param url 请求地址
   * @param params 请求参数
   * @param fileName 文件名
   * @param method 请求方式
   * @param showLoading 全屏loading开关,默认开启
   */
  public async download(url: string, params?: IObject, fileName?: string, method: Method = 'get', showLoading = true): Promise<void> {
    if (showLoading) this.store.showLoading()
    try {
      await baseService.download(url, params, fileName, method, this.getOtherParams())
    } finally {
      if (showLoading) this.store.hideLoading()
    }
  }

  public async exportFile(url: string, params?: IObject, headers?: IObject, showLoading = true): Promise<IHttpResponse> {
    return this.requestWithLoading(() => baseService.export(url, params, headers, this.getOtherParams()), 'EXPORT', url, showLoading)
  }

  public async getExport(url: string, params?: IObject, headers?: IObject, showLoading = true): Promise<IHttpResponse> {
    return this.requestWithLoading(() => baseService.exportGet(url, params, headers, this.getOtherParams()), 'EXPORT', url, showLoading)
  }

  public async blob(url: string, showLoading = true): Promise<{ name: string; url: string }> {
    return this.requestWithLoading(() => baseService.blob(url, this.getOtherParams()), 'BLOB', url, showLoading)
  }

  public async requestWithLoading<T>(fn: () => Promise<T>, method: string, url: string, showLoading: boolean): Promise<T> {
    if (showLoading) this.store.showLoading()
    try {
      return await fn()
    } catch (err) {
      this.handleError(err, method, url)
      throw err
    } finally {
      if (showLoading) this.store.hideLoading()
    }
  }

  handleError(err: any, method: string, url: string) {
    console.error(`[BaseService] ${method} 请求失败:${url}`, err)
  }
}
