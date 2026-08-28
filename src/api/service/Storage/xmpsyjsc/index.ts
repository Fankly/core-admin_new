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
  wh: string;
  uuids: string[];
  xmId: string;
}

//  导出
export const exportData = (params: Params): Promise<Result> => {
  return baseService.export(`/xmpsyjsc/export`, params);
};

//  获取列表
export const getPageDataList = (params: Params): Promise<Result> => {
  return baseService.post(`/xmpsyjsc/getPage`, params);
};

//  提交
export const submitData = (ids: string[]): Promise<Result> => {
  return baseService.post(`/xmpsyjsc/submit`, {
    ids: ids
  });
};

//  退回
export const thData = (params: any): Promise<Result> => {
  return baseService.post(`/xmpsyjsc/th`,params);
};

//  维护数据
export const pfwhwhData = (params: PfwhwhData): Promise<Result> => {
  return baseService.post(`/xmpsyjsc/psyjwh`, params);
};
