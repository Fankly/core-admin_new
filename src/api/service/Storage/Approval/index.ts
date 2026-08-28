import baseService from "@/service/baseService";

interface Result {
  header?: any;
  data: any;
  msg: string;
  success: boolean;
  code: number;
}

interface Params {
  [key: string]: any;
}

interface PfwhwhData {
  pfwh: string;
  uuids: string[];
  xmId: string;
}

//  导出
export const exportData = (params: Params): Promise<Result> => {
  return baseService.export(`/xmpfwjsc/export`, params);
};

//  获取列表
export const getPageDataList = (params: Params): Promise<Result> => {
  return baseService.post(`/xmpfwjsc/getPage`, params);
};

//  纳入储备
export const nrcbData = (ids: string[]): Promise<Result> => {
  return baseService.post(`/xmpfwjsc/nrcb`, {
    ids: ids
  });
};

//  根据xmid获取支持的可研类型
export const getKyType = (xmId: string): Promise<Result> => {
  return baseService.get(`/xmpfwjsc/getKyType?xmId=${xmId}`);
};

//  维护数据
export const pfwhwhData = (params: PfwhwhData): Promise<Result> => {
  return baseService.post(`/xmpfwjsc/pfwhwh`, params);
};

//  获取批量维护数据
export const getPfwh = (xmId: string): Promise<Result> => {
  return baseService.get(`/xmpfwjsc/getPfwh?xmId=${xmId}`);
};

//  退回
export const thData = (params: any): Promise<Result> => {
  return baseService.post(`/xmpfwjsc/th`,params);
};

