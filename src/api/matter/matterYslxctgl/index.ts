import baseService from "@/service/baseService";

//新增
export const addMsgData = (params: object) => {
  return baseService.post("/processYssxctgl/add", params);
};

// 删除
export const delMsgData = (params: Array<string>) => {
  return baseService.post("/processYssxctgl/delete", { ids: params });
};

// 启用
export const enableMsgData = (params: Array<string>) => {
  return baseService.post("/processYssxctgl/enable", { ids: params });
};

// 停用
export const stopMsgData = (params: Array<string>) => {
  return baseService.post("/processYssxctgl/stop", { ids: params });
};
//
//导出
export const exportData = (params?: object) => {
  return baseService.export("/processYssxctgl/export", params);
};

// 获取分页列表
export const getPage = (params: object) => {
  return baseService.post("/processYssxctgl/getPage", params);
};

// 导入
export const importData = (params: any) => {
  return baseService.post(`/processYssxctgl/import?specialorgid=${params.specialorgid}`, params.excelFormData);
};

// 获取导入模板
export const getImportTemplate = () => {
  return baseService.export("/processYssxctgl/getImportTemplate");
};

// 修改
export const updateMsg = (params: object) => {
  return baseService.post("/processYssxctgl/update", params);
};

// 白名单设置
export const updateBmdMsg = (params: any) => {
  return baseService.post(`/processYssxctgl/updateBmd?ids=${params.ids}&bmdFlag=${params.bmdFlag}`);
};

// 获取归口部门
export const getBmByYssxctId = (yssxctId: string) => {
  return baseService.get(`/processYssxctgl/getBmByYssxctId?yssxctId=${yssxctId}`);
};

// 获取归口部门
export const getBmByYssxctId1 = (yssxctId: string) => {
  return baseService.get(`/processYssxctgl/getBmByYssxctId1?yssxctId=${yssxctId}`);
};