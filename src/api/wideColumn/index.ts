import baseService from "@/service/baseService";

// 查询
export const searchData = (params?: object) => {
  return baseService.post("/dataSourceData/getData", params);
};

// 导出数据
export const exportData = (params?: object) => {
  return baseService.export("/dataSourceData/export", params);
};

// 获取动态表头
export const getDynamicColumn = (tableCode?: string) => {
  return baseService.get(`/dataSourceData/getDynamicColumn?tableCode=${tableCode}`);
};
