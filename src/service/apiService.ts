import { IObject } from '@/types/interface'
import baseService from '@/service/baseService'

type ServiceKey = 'budget' | 'otherOperatingCose' | 'fullProcess' | 'project'

const createServiceApi = (service: ServiceKey) => ({
  get(path: string, params?: IObject, headers?: IObject) {
    return baseService.get(path, params, headers, { service })
  },
  post(path: string, params?: IObject, headers?: IObject) {
    return baseService.post(path, params, headers, { service })
  },
  put(path: string, params?: IObject, headers?: IObject) {
    return baseService.put(path, params, headers, { service })
  },
  delete(path: string, params?: IObject) {
    return baseService.delete(path, params, { service })
  },
  export(path: string, params?: IObject, headers?: IObject) {
    return baseService.export(path, params, headers, { service })
  },
  exportGet(path: string, params?: IObject, headers?: IObject) {
    return baseService.exportGet(path, params, headers, { service })
  },
  download(path: string, params?: IObject, fileName?: string, method: 'get' | 'post' = 'get') {
    return baseService.download(path, params, fileName, method, { service })
  },
  blob(requestUrl: string) {
    return baseService.blob(requestUrl, { service })
  }
})

export const budgetApi = createServiceApi('budget')
export const otherOperatingCoseApi = createServiceApi('otherOperatingCose')
export const fullProcessApi = createServiceApi('fullProcess')
export const projectApi = createServiceApi('project')

export default {
  budget: budgetApi,
  otherOperatingCose: otherOperatingCoseApi,
  fullProcess: fullProcessApi,
  project: projectApi
}
