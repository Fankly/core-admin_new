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

// 发起
export const finishZyActivity = (params: Params): Promise<Result> => {
  return baseService.post("/workflow/zlxqzysh/finishWf", params);
};

// 驳回
export const rejectZyActivity = (params: Params): Promise<Result> => {
  return baseService.post("/workflow/zlxqzysh/reject", params);
};

// 发起
export const finishCwActivity = (params: Params): Promise<Result> => {
  return baseService.post("/workflow/zlxqcwsh/finishWf", params);
};

// 驳回
export const rejectCwActivity = (params: Params): Promise<Result> => {
  return baseService.post("/workflow/zlxqcwsh/reject", params);
};
