import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

export const containsNd = (dwId: string): Promise<Result> => {
  return otherOperatingCose.get(`/fyCommon/containsNd?dwId=${dwId}`, {}, {}, false)
}

export const getKmlxTabByDwId = (dwId: string): Promise<Result> => {
  return otherOperatingCose.get(`/fyCommon/getKmlxTabByDwId?dwId=${dwId}`, {}, {}, false)
}

export const deleteAttachByUUID = (uuids: string[]): Promise<Result> => {
  return otherOperatingCose.post(`/fy/attach/deleteAttachByUUID`, uuids, {}, false)
}

export const downloadAttach = (uuid: string): Promise<Result> => {
  return otherOperatingCose.exportFile(`/fy/attach/downloadAttach?uuid=${uuid}`, {}, {}, false)
}

export const getAttachList = (busiId: string): Promise<Result> => {
  return otherOperatingCose.get(`/fy/attach/getAttachList?busiId=${busiId}`, {}, {}, false)
}

export const uploadAttachBatch = (busiId: string, formData: any): Promise<Result> => {
  return otherOperatingCose.post(`/fy/attach/uploadAttachBatch?busiId=${busiId}`, formData, {}, false)
}
