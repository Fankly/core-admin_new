import baseService from "@/service/baseService";

interface Params {
  [key: string]: any;
}

// 提交并发起工作流程
export const finishActivity = (params: Params): any => {
  return baseService.post("/workflow/declare/finishWf", params);
};

// 提交并发起工作流程
export const rejectActivity = (params: Params): any => {
  return baseService.post("/workflow/declare/reject", params);
};

// 提交并发起工作流程
export const rejectOutBoundActivity = (params: Params): any => {
  return baseService.post("/workflow/outbound/reject", params);
};

// 提交并发起工作流程
export const rejectAdjustActivity = (params: Params): any => {
  return baseService.post("/workflow/adjust/reject", params);
};

export const finishOutBoundActivity = (params: Params): any => {
  return baseService.post("/workflow/outbound/finishWf", params);
};

export const finishAdjustActivity = (params: Params): any => {
  return baseService.post("/workflow/adjust/finishWf", params);
};
