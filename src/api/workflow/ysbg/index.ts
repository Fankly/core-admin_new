// 提交
import baseService from "@/service/baseService";

interface Params {
  [key: string]: any;
}

interface Result {
  code: number;
  data: any;
  msg: string;
  success: boolean;
  header?: any;
}

export const submitActivity = (params: Params): Promise<Result> => {
  return baseService.post("/workflow/cbxqsh/submitWf", params);
};

// 发起
export const finishActivity = (params: Params): Promise<Result> => {
  return baseService.post("/workflow/ysbgsh/finishWf", params);
};

// 驳回
export const rejectActivity = (params: Params): Promise<Result> => {
  return baseService.post("/workflow/ysbgsh/reject", params);
};

// 查询列表
export const getYsbgshListPage = (xmIds: string[]): Promise<Result> => {
  return baseService.post(`/workflow/ysbgsh/getYsbgshListPage`, {
    xmIds
  });
};

// 获取集中修改页面动态配置
export const getDynamicTable = (): Promise<Result> => {
  return baseService.get(`/workflow/ysbgsh/getDynamicTable`);
};
