import baseService from "@/service/baseService";

interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
  headers?: any;
}

interface Params {
  ejfl: string;
  limit: number;
  page: number;
  sjfl: string;
  specialorgid: string;
  xmlxList: string[];
  yjfl: string;
  yskzlb: string;
  yssx: string;
  zdtx: string;
}

// 导出
export const exportData = (params: Params): Promise<Result> => {
  return baseService.export("xmlxzsj/export", params);
};

// 查询
export const pageSearchData = (params: Params): Promise<Result> => {
  return baseService.post("xmlxzsj/page", params);
};
