import baseService from "@/service/baseService";

interface Params {
  [key: string]: any;
}

// 提交
export const finishActivity = (params: Params): any => {
  return baseService.post("/workflow/bmfj/submitWf", params);
};

// 发起
export const startYapBmWf = (params: Params): any => {
  return baseService.post("/workflow/bmfj/startWf", params);
};

// 驳回
export const rejectActivity = (params: Params): any => {
  return baseService.post("/workflow/bmfj/reject", params);
};

// 提交
export const finishCityActivity = (params: Params): any => {
  return baseService.post("/workflow/cityfj/submitWf", params);
};

// 发起
export const startYapCityWf = (params: Params): any => {
  return baseService.post("/workflow/cityfj/startWf", params);
};

// 驳回
export const rejectCityActivity = (params: Params): any => {
  return baseService.post("/workflow/cityfj/reject", params);
};

// 市上报
// 提交
export const submitCityReportActivity = (params: Params): any => {
  return baseService.post("/workflow/yapCitySb/submitWf", params);
};

// 发起
export const startYapCityReportWf = (params: Params): any => {
  return baseService.post("/workflow/yapCitySb/startWf", params);
};

// 驳回
export const rejectYapCityActivity = (params: Params): any => {
  return baseService.post("/workflow/yapCitySb/reject", params);
};

// 预安排地市（直属）单位年度预算上报工作流
export const submitNdCityReportActivity = (params: Params): any => {
  return baseService.post("/workflow/ndCitySb/submitWf", params);
};

// 发起
export const startNdCityReportWf = (params: Params): any => {
  return baseService.post("/workflow/ndCitySb/startWf", params);
};

// 驳回
export const rejectNdCityActivity = (params: Params): any => {
  return baseService.post("/workflow/ndCitySb/reject", params);
};

// 省日常提交
export const submitRcProReportActivity = (params: Params): any => {
  return baseService.post("/workflow/rcProTz/submitWf", params);
};

// 发起
export const startRcProReportWf = (params: Params): any => {
  return baseService.post("/workflow/rcProTz/startWf", params);
};

// 驳回
export const rejectRcProActivity = (params: Params): any => {
  return baseService.post("/workflow/rcProTz/reject", params);
};

// 市日常提交
export const submitRcCityReportActivity = (params: Params): any => {
  return baseService.post("/workflow/rcCityTz/submitWf", params);
};

// 发起
export const startRcCityReportWf = (params: Params): any => {
  return baseService.post("/workflow/rcCityTz/startWf", params);
};

// 驳回
export const rejectRcCityActivity = (params: Params): any => {
  return baseService.post("/workflow/rcCityTz/reject", params);
};

// 部门日常提交
export const submitRcBmReportActivity = (params: Params): any => {
  return baseService.post("/workflow/rcBmTz/submitWf", params);
};

// 发起
export const startRcBmReportWf = (params: Params): any => {
  return baseService.post("/workflow/rcBmTz/startWf", params);
};

// 驳回
export const rejectRcBmActivity = (params: Params): any => {
  return baseService.post("/workflow/rcBmTz/reject", params);
};
