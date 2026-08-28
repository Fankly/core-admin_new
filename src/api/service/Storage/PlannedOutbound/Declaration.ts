import baseService from "@/service/baseService";

interface Result {
  header?: any;
  data: any;
  msg: string;
  success: boolean;
  code: number;
}

export interface SearchData {
  protypeIds: string[];
  sgkbmId: string;
  xmbms: string[] | string;
  xmmc: string;
  yjdw: string;
  ysly?: string;
  zts: string[];
  ejdw: string;
  jhssnd: string;
}

interface SearchParams extends SearchData {
  dwId: string;
  roleId: string;
  bmId: string;
  limit: number;
  page: number;
}

//  获取项目类型
export const getInfo = (dwId: string): Promise<Result> => {
  return baseService.get(`/xmpfwjsc/getInfo?dwId=${dwId}`);
};
//  导出项目
export const exportData = (searchData: SearchParams): Promise<Result> => {
  return baseService.export(`/xmncksb/export`, searchData);
};

//  查询项目
export const getPage = (searchData: SearchParams): Promise<Result> => {
  return baseService.post(`/xmncksb/getPage`, searchData);
};

//  提交
export const submitData = (ids: string[]): Promise<Result> => {
  return baseService.post(`/xmncksb/submit`, {
    ids: ids
  });
};

//  查看核定意见
export const viewAdvice = (id: string): Promise<Result> => {
  return baseService.get(`/xmncksb/viewAdvice?id=${id}`);
};
