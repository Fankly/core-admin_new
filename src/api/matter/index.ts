import baseService from "@/service/baseService";

interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
}

interface Params {
  [key: string]: any;
}

// 获取一级单位
export const getYjdwList = (params: string): Promise<Result> => {
  return baseService.get(`/process46/getYjdw?specialorgid=${params}`);
};

// 获取二级单位
export const getEjdwList = (params: Params): Promise<Result> => {
  return baseService.get(
    `/process46/getEjdw?specialorgid=${params.specialorgid}&parentId=${params.parentId}`
  );
};

// 维护字段
export const saveOrUpdateYhzd = (params: Params): Promise<Result> => {
  return baseService.post(`/yssx/saveOrUpdateYhzd`, params);
};

// 获取维护字段
export const getYhzd = (yssxId: string): Promise<Result> => {
  return baseService.get(`/yssx/getYhzd?yssxId=${yssxId}`);
};
