import baseService from "@/service/baseService";

export interface CopyData {
  sourceNd: string;
  targetNd: string;
}

export interface EnableOrDisableData {
  ids: string[];
  status: string;
}

export interface DataList {
  nd: string;
  status: string;
  yskmId?: number;
  itemName: string;
  itemId?: string;
}

// 复制
export const copyData = (params: CopyData): any => {
  return baseService.post(`/comFzpz/copy?sourceNd=${params.sourceNd}&targetNd=${params.targetNd}`);
};

// 删除
export const deleteData = (ids: string[]): any => {
  return baseService.post(`/comFzpz/delete`, { ids });
};

//获取列表
export const getDataList = (params: DataList): any => {
  return baseService.post(`/comFzpz/getDataList`, params);
};

//新增
export const saveData = (params: DataList): any => {
  return baseService.post(`/comFzpz/save`, params);
};

//修改
export const editData = (params: DataList): any => {
  return baseService.post(`/comFzpz/update`, params);
};

//启用或者停用
export const enableOrDisableData = (params: EnableOrDisableData): any => {
  return baseService.post(`/comFzpz/updateStatus`, params);
};
