import baseService from "@/service/baseService";

export interface Data {
  dwId: string;
  nd: string;
  tjfs: string[];
}

interface Result {
  headers?: any;
  code: number;
  data: any;
  msg: string;
  success: boolean;
}

export interface BmDetail {
  bmId: string;
  dwId: string;
  limit: number;
  nd: string;
  page: number;
  tjfs: string[];
}

// 柱状图
export const getData = (params: Data): Promise<Result> => {
  return baseService.post("yssxtjfx/getData", params);
};

// 柱状图穿透
export const getBmDetail = (params: BmDetail): Promise<Result> => {
  return baseService.post("yssxtjfx/getBmDetail", params);
};

// 柱状图穿透
export const getYssxDetailByCity = (id: string): Promise<Result> => {
  return baseService.get(`yssxtjfx/getYssxDetailByCity?id=${id}`);
};

// 导出
export const exportData = (params: BmDetail): Promise<Result> => {
  return baseService.export(`yssxtjfx/exportBmDetail`, params);
};
