import baseService from "@/service/baseService";

interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
  header?: any;
}

interface Params {
  [key: string]: any;
}

// 获取应用
export const getAppByGroupCode = (groupCode: string): Promise<Result> => {
  return baseService.post(`/sys/app/getAppByGroupCode?groupCode=${groupCode}`);
};

// 租赁项目快速查询
export const zlxmQuickSearch = (searchParam: string, dwId: string): Promise<Result> => {
  return baseService.post(
    `/xmAttributeConfig/zlxmQuickSearch?searchParam=${searchParam}&dwId=${dwId}`
  );
};

// 根据项目id获取全过程数据
export const getXmqgcByXmid = (xmId: string): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/getXmqgcByXmid?xmId=${xmId}`);
};
