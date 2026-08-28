import baseService from "@/service/baseService";

// 新增
export const addMsgData = (params: object) => {
  return baseService.post("/process47/add", params);
};

// 删除
export const delMsgData = (params: Array<string>) => {
  return baseService.post("/process47/delete", { ids: params });
};

//导出
export const exportData = (params?: object) => {
  return baseService.export("/process47/export", params);
};

// 获取导入模板
export const getImportTemplate = () => {
  return baseService.export("/process47/getImportTemplate");
};

// 获取分页列表
export const getPage = (params: object) => {
  return baseService.post("/process47/getPage", params);
};

// 导入
export const importData = (params: any) => {
  return baseService.post(`/process47/import?specialorgid=${params.specialorgid}`, params.excelFormData);
};

// 修改
export const updateMsg = (params: object) => {
  return baseService.post("/process47/update", params);
};

// 根据公司代码和资产编码获取资产信息
export const getZcxxByGsdmAndZcbm = (paraams:any) => {
   return baseService.get(`/process47/getZcxxByGsdmAndZcbm?gsdm=${paraams.gsdm}&zcbm=${paraams.zcbm}`);
}
