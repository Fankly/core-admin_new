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
  ysly: string;
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

interface PassOrReject {
  ids: string[];
  nckApprovedOpinions: string;
  res: string;
}

//  导出项目
export const exportData = (searchData: SearchParams): Promise<Result> => {
  return baseService.export(`/xmncksd/export`, searchData);
};

//  查询项目
export const getPage = (searchData: SearchParams): Promise<Result> => {
  return baseService.post(`/xmncksd/getPage`, searchData);
};

//  审核通过或驳回
export const submitData = (passOrReject: PassOrReject): Promise<Result> => {
  return baseService.post(`/xmncksd/passOrReject`, passOrReject);
};

//  查看核定意见
export const viewAdvice = (id: string): Promise<Result> => {
  return baseService.get(`/xmncksd/viewAdvice?id=${id}`);
};
