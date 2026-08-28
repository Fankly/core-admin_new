import baseService from "@/service/baseService";

export interface Params {
  dwId: string;
  ejdw: string;
  gkbms: string[];
  nd: string;
  pid: string;
  punicode: string;
  sxmc: string;
  tjwd: string[];
  xmlxs: string[];
  yjdw: string;
  zdtxs: string[];
  zsfs: string;
  [key: string]: string | string[];
}

export interface DataAllParams {
  dwId: string;
  ejdw: string;
  gkbms: string[];
  nd: string;
  pid: string;
  punicode: string;
  sxmc: string;
  tjwd: string[];
  xmlxs: string[];
  yjdw: string;
  zdtxs: string[];
  zsfs: string;
  page: number;
  limit: number;
  [key: string]: any;
}

export interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
  [x: string]: any;
}

export interface DetailParams {
  dwId: string;
  dwType: string;
  ejdw: string;
  gkbmId: string;
  gkbms: string[];
  id: string;
  limit: number;
  nd: string;
  page: number;
  sxmc: string;
  tjwd: string[];
  xmlxId: string;
  xmlxs: string[];
  yd: string;
  yjdw: string;
  zdtxId: string;
  zdtxs: string[];
  zsfs: string;
}

// 获取数据列
export const getData = (params: Params): Promise<Result> => {
  return baseService.post("/yssxzxhz/getData", params);
};

// 获取动态表头(单位1归口2投向3)
export const getDynamicColumn = (zsfs: string): Promise<Result> => {
  return baseService.get(`/yssxzxhz/getDynamicColumn?zsfs=${zsfs}`);
};
// 按单位 / 省专业归口 / 重点投向归口统计
export const getDataAll = (params: DataAllParams): Promise<Result> => {
  return baseService.post(`/yssxzxhz/getDataAll`, params);
};

// 获取详情
export const getDetail = (params: DetailParams): Promise<Result> => {
  return baseService.post(`/yssxzxhz/getDetail`, params);
};

// 按单位/省专业归口/重点投向归口统计导出
export const exportDataAll = (params: Params): Promise<Result> => {
  return baseService.export(`/yssxzxhz/exportDataAll`, params);
};

// 按单位/省专业归口/重点投向归口统计导出
export const exportData = (params: Params): Promise<Result> => {
  return baseService.export(`/yssxzxhz/export`, params);
};
