import baseService from "@/service/baseService";

//预算下达查看
export const getCkPageList = (params: object) => {
  return baseService.post("/yssxCk/getPage", params);
};

//预算下达导出
export const getExportData = (params: object) => {
  return baseService.export("/yssxCk/export", params);
};

//出库保存
export const yssxCksave = (params: object) => {
  return baseService.post("/yssxCk/save", params);
};

//出库提交
export const submit = (ids: string[]) => {
  return baseService.post("/yssxCk/submit", ids);
};

//出库提交(含工作流)
export const submitOutBound = (params: object) => {
  return baseService.post("/workflow/outbound/submitWf", params);
};

//出库退回
export const revert = (ids: string[]) => {
  return baseService.post("/yssxCk/revert", ids);
};
